import type {
  SpanNode,
} from './span-node.ts';

/**
 * Overridable strategy hooks and property names for a {@link ReferenceManager}.
 *
 * Every field is optional; anything omitted falls back to
 *   {@link DEFAULT_REFERENCE_MANAGER_CONFIG}.
 *
 * @interface ReferenceManagerConfig
 */
export interface ReferenceManagerConfig {
  /** Returns the current per-cache-id counter for a node. */
  getCachedIndex?: (node: SpanNode) => number;
  /** Returns the cache key a node's counter is grouped under (defaults to `type_id`). */
  getCacheID?: (node: SpanNode) => string;
  /** Formats a node's counter into the reference-index string component. */
  getRefIndex?: (node: SpanNode) => string;
  /** Whether encountering this node should advance the counter (defaults to `isNew`). */
  incrementCount?: (node: SpanNode) => boolean;
  /** Whether a node still needs priming (defaults to "has no ref id yet"). */
  primeNode?: (node: SpanNode) => boolean;
  /** Node property that receives the generated reference id (defaults to `ref_id`). */
  refIDProperty?: string;
  /** Node property that receives the generated reference index (defaults to `ref_index`). */
  refIndexProperty?: string;
}

/** A per-cache-id monotonic counter store. */
export type IndexCache = Record<string, number>;

const CACHES = new WeakMap<ReferenceManager, IndexCache>();

/**
 * Default {@link ReferenceManagerConfig} strategy.
 *
 * Groups counters by a span's `type_id`, formats the index as a zero-padded
 *   5-digit string, advances the counter only on `new` markers, and primes a
 *   node only when it has no reference id yet.
 */
export const DEFAULT_REFERENCE_MANAGER_CONFIG: ReferenceManagerConfig = {
  getCachedIndex(node: SpanNode) {
    const INDEX_CACHE = CACHES.get(this)!;

    return INDEX_CACHE[this.getCacheID(node)] ?? 0;
  },
  getCacheID(node: SpanNode) {
    return node.type_id;
  },
  getRefIndex(node: SpanNode) {
    return this.getCachedIndex(node)
      .toString(10)
      .padStart(5, `0`);
  },
  incrementCount(node: SpanNode) {
    return node.isNew;
  },
  primeNode(node: SpanNode) {
    return !node[this.refIDProperty];
  },
  refIDProperty: `ref_id`,
  refIndexProperty: `ref_index`,
};

/**
 * Assigns stable, paired references to span markers so a `new` marker and its
 *   `end` counterpart share the same `ref_id`.
 *
 * Each manager keeps a per-cache-id counter (e.g. one per `type:category`); as
 *   spans are {@link ReferenceManager.prime | prime}d, opening markers advance
 *   the counter and both markers receive a matching id/index. The parser uses two
 *   managers — one document-wide (`ast_id`/`ast_index`) and one per chunk
 *   (`ref_id`/`ref_index`) — which is why the property names are configurable.
 */
export class ReferenceManager {
  protected getCachedIndex!: (node: SpanNode) => number;
  protected getCacheID!: (node: SpanNode) => string;
  protected getRefIndex!: (node: SpanNode) => string;
  protected incrementCount!: (node: SpanNode) => boolean;
  protected primeNode!: (node: SpanNode) => boolean;
  protected refIDProperty!: string;
  protected refIndexProperty!: string;

  readonly #config: ReferenceManagerConfig;

  /**
   * Factory for a {@link ReferenceManager}.
   *
   * @param config - Optional strategy overrides.
   * @returns A new {@link ReferenceManager} instance.
   */
  static new(config: ReferenceManagerConfig = {}) {
    return new ReferenceManager(config);
  }

  /**
   * Resets a manager's counters back to zero without discarding the manager.
   *
   * @param mgr - The manager whose index cache should be cleared.
   * @returns The same `mgr`, for chaining.
   */
  static reset(mgr: ReferenceManager) {
    const INDEX_CACHE = CACHES.get(mgr);

    if (INDEX_CACHE) {
      for (const key of Object.keys(INDEX_CACHE)) {
        INDEX_CACHE[key] = 0;
      }
    }

    return mgr;
  }

  /**
   * @param config - Strategy overrides layered on top of
   *   {@link DEFAULT_REFERENCE_MANAGER_CONFIG}.
   */
  constructor(config: ReferenceManagerConfig = {}) {
    this.#config = config;

    // We have functions in the `DEFAULT_REFERENCE_MANAGER_CONFIG` so, we can't use `structuredClone` here.`
    const defaults = Object.assign({}, DEFAULT_REFERENCE_MANAGER_CONFIG);

    // Copy the defaults over first and then the custom configuration over that.
    Object.assign(this, defaults, config);

    CACHES.set(this, {});
  }

  /**
   * Creates an independent copy of this manager, including its current counters.
   *
   * @returns A new {@link ReferenceManager} with a cloned index cache.
   */
  clone() {
    const INDEX_CACHE = CACHES.get(this)!;
    const refMgr = ReferenceManager.new(this.#config);

    CACHES.set(refMgr, structuredClone(INDEX_CACHE));

    return refMgr;
  }

  /**
   * Assigns the node's reference id property (`<cacheId>:<refIndex>`).
   *
   * @param node - The span marker to assign an id to.
   * @returns The same `node`, for chaining.
   */
  ensureRefId(node: SpanNode) {
    const refIndex = this.getRefIndex(node);

    node[this.refIDProperty] = `${this.getCacheID(node)}:${refIndex}`;

    return node;
  }

  /**
   * Assigns the node's reference index property from the current counter.
   *
   * @param node - The span marker to assign an index to.
   * @returns The same `node`, for chaining.
   */
  ensureRefIndex(node: SpanNode) {
    node[this.refIndexProperty] = this.getCachedIndex(node);

    return node;
  }

  /**
   * Primes a span marker with a reference index and id, advancing the counter for
   *   opening markers so a `new`/`end` pair ends up sharing one id.
   *
   * Does nothing when the node is already primed.
   *
   * @param node - The span marker to prime.
   * @returns The same `node`, for chaining.
   */
  prime(node: SpanNode) {
    // We only want to do all the below if the node does not already have a `ref_id`.
    if (this.primeNode(node)) {
      if (this.incrementCount(node)) {
        this.updateIndexCache(node);
      }

      this.ensureRefIndex(node);

      this.ensureRefId(node);
    }

    return node;
  }

  /**
   * Increments the counter for the node's cache id (creating it at `0` first).
   *
   * @param node - The span marker whose counter should advance.
   * @returns The same `node`, for chaining.
   */
  updateIndexCache(node: SpanNode) {
    const INDEX_CACHE = CACHES.get(this)!;
    const cacheID = this.getCacheID(node);

    INDEX_CACHE[cacheID] ??= 0;

    INDEX_CACHE[cacheID] += 1;

    return node;
  }

  get [Symbol.toStringTag]() {
    return `TendrilNodeReferenceManager`;
  }
}
