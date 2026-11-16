import type {
  ASTContext,
} from '../context/index.ts';
import type {
  ENUM_LANGUAGE_DIRECTION,
} from '../i18n/index.ts';

import type {
  INodeBasis,
  Metadata,
} from './types.ts';

/**
 * Node keys whose values are *derived* (computed from other state) and therefore
 *   must never be assigned when applying serialized data back onto a node.
 */
export const COMPUTED_NODE_KEYS = [
  `char_count`,
  `length`,
  `size`,
  `word_count`,
];

/**
 * Base class for every Tendril node.
 *
 * Holds the properties shared by all nodes — parsing context, language and
 *   direction, a metadata bag, and the `ref_id` used to pair span markers — and
 *   provides serialization ({@link NodeBasis.toJSON | toJSON}) plus the
 *   {@link NodeBasis.applyData | applyData} helper used when rehydrating nodes.
 */
export class NodeBasis implements INodeBasis {
  #ctx!: ASTContext | undefined;
  #dir: ENUM_LANGUAGE_DIRECTION | undefined;
  #lang: string | undefined;
  #meta: Metadata | undefined;
  #ref_id: string | undefined;

  /**
   * Copies `data` onto `basis`, skipping computed keys and nullish values.
   *
   * Keys listed in {@link COMPUTED_NODE_KEYS} are ignored (their values are
   *   derived), as are `null`/`undefined` values.
   *
   * @param basis - The node instance to copy properties onto.
   * @param data - The source data to apply.
   * @returns The same `basis` instance, for chaining.
   */
  static applyData(basis: NodeBasis, data: INodeBasis = {}) {
    for (const [ key, value ] of Object.entries(data)) {
      if (COMPUTED_NODE_KEYS.includes(key)) {
        continue;
      }

      if (value !== null && typeof value !== `undefined`) {
        basis[key] = value;
      }
    }

    return basis;
  }

  /**
   * @param data - Initial node properties to apply; a `meta` bag is created if
   *   none is supplied.
   */
  constructor(data: INodeBasis = {}) {
    NodeBasis.applyData(this, data);

    if (!this.#meta) {
      this.meta = {};
    }
  }

  /** The parsing context this node was created within, if any. */
  get $ctx() {
    return this.#ctx;
  }

  /** The node's writing/reading direction. */
  get dir() {
    return this.#dir;
  }

  /** The node's language id (e.g. `'en'`). */
  get lang() {
    return this.#lang;
  }

  /** The node's metadata bag. */
  get meta() {
    return this.#meta;
  }

  /** The reference id pairing a `new` span marker with its `end`. */
  get ref_id() {
    return this.#ref_id;
  }

  set $ctx(ctx: ASTContext | undefined) {
    this.#ctx = ctx;
  }

  set dir(value: ENUM_LANGUAGE_DIRECTION | undefined) {
    this.#dir = value;
  }

  set lang(value: string | undefined) {
    this.#lang = value;
  }

  set meta(value: Metadata | undefined) {
    this.#meta = value;
  }

  set ref_id(value: string | undefined) {
    this.#ref_id = value;
  }

  /**
   * Serializes the shared node properties to a plain object.
   *
   * @returns A plain-object {@link INodeBasis} snapshot of this node.
   */
  toJSON() {
    const {
      dir,
      lang,
      meta,
      ref_id,
    } = this;

    return {
      dir,
      lang,
      meta,
      ref_id,
    } as INodeBasis;
  }

  get [Symbol.toStringTag]() {
    return `TendrilNode`;
  }
}
