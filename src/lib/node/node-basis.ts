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

export const COMPUTED_NODE_KEYS = [
  `char_count`,
  `length`,
  `size`,
  `word_count`,
];

export class NodeBasis implements INodeBasis {
  #ctx!: ASTContext | undefined;
  #dir: ENUM_LANGUAGE_DIRECTION | undefined;
  #lang: string | undefined;
  #meta: Metadata | undefined;
  #ref_id: string | undefined;

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

  constructor(data: INodeBasis = {}) {
    NodeBasis.applyData(this, data);

    if (!this.#meta) {
      this.meta = {};
    }
  }

  get $ctx() {
    return this.#ctx;
  }

  get dir() {
    return this.#dir;
  }

  get lang() {
    return this.#lang;
  }

  get meta() {
    return this.#meta;
  }

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
