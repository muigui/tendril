import type {
  SpanNode,
} from './span-node.ts';

export interface ReferenceManagerConfig {
  getCachedIndex?: (node: SpanNode) => number;
  getCacheID?: (node: SpanNode) => string;
  getRefIndex?: (node: SpanNode) => string;
  incrementCount?: (node: SpanNode) => boolean;
  primeNode?: (node: SpanNode) => boolean;
  refIDProperty?: string;
  refIndexProperty?: string;
}

export type IndexCache = Record<string, number>;

const CACHES = new WeakMap<ReferenceManager, IndexCache>();

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

export class ReferenceManager {
  protected getCachedIndex!: (node: SpanNode) => number;
  protected getCacheID!: (node: SpanNode) => string;
  protected getRefIndex!: (node: SpanNode) => string;
  protected incrementCount!: (node: SpanNode) => boolean;
  protected primeNode!: (node: SpanNode) => boolean;
  protected refIDProperty!: string;
  protected refIndexProperty!: string;

  readonly #config: ReferenceManagerConfig;

  static new(config: ReferenceManagerConfig = {}) {
    return new ReferenceManager(config);
  }

  static reset(mgr: ReferenceManager) {
    const INDEX_CACHE = CACHES.get(mgr);

    if (INDEX_CACHE) {
      for (const key of Object.keys(INDEX_CACHE)) {
        INDEX_CACHE[key] = 0;
      }
    }

    return mgr;
  }

  constructor(config: ReferenceManagerConfig = {}) {
    this.#config = config;

    // We have functions in the `DEFAULT_REFERENCE_MANAGER_CONFIG` so, we can't use `structuredClone` here.`
    const defaults = Object.assign({}, DEFAULT_REFERENCE_MANAGER_CONFIG);

    // Copy the defaults over first and then the custom configuration over that.
    Object.assign(this, defaults, config);

    CACHES.set(this, {});
  }

  clone() {
    const INDEX_CACHE = CACHES.get(this)!;
    const refMgr = ReferenceManager.new(this.#config);

    CACHES.set(refMgr, structuredClone(INDEX_CACHE));

    return refMgr;
  }

  ensureRefId(node: SpanNode) {
    const refIndex = this.getRefIndex(node);

    node[this.refIDProperty] = `${this.getCacheID(node)}:${refIndex}`;

    return node;
  }

  ensureRefIndex(node: SpanNode) {
    node[this.refIndexProperty] = this.getCachedIndex(node);

    return node;
  }

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
