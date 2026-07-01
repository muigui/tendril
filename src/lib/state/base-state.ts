import {
  ASTContext,
  IteratorContext,
} from '../context/index.ts';
import type {
  ENUM_LINE_SEPARATOR,
  Language,
} from '../i18n/index.ts';
import {
  ReferenceManager,
} from '../node/index.ts';
import type {
  AggregationConfig,
  RawTextValue,
} from '../parser/index.ts';
import {
  segmentText,
} from '../utils/index.ts';

import type {
  Parsers,
  TempStateData,
  TempStateDataValue,
} from './types.ts';

export interface BaseStateConfig {
  aggregate?: AggregationConfig;
  handleMismatchedQuotes?: boolean;
  lang: Language;
  originalLineSeparator?: ENUM_LINE_SEPARATOR;
  parsers: Parsers;
}

export class BaseState {
  protected ASTRefMgr!: ReferenceManager;
  protected contextStack!: Array<IteratorContext<unknown>>;
  protected refMgr!: ReferenceManager;

  readonly #aggregate: AggregationConfig;
  readonly #handleMismatchedQuotes: boolean;
  readonly #lang: Language;
  readonly #originalLineSeparator: ENUM_LINE_SEPARATOR;
  readonly #parse: Parsers;
  readonly #temp: TempStateData;

  constructor({
    aggregate = false,
    handleMismatchedQuotes = false,
    lang,
    originalLineSeparator,
    parsers,
  }: BaseStateConfig) {
    this.#aggregate = aggregate;
    this.#handleMismatchedQuotes = handleMismatchedQuotes;
    this.#lang = lang;
    this.#originalLineSeparator = originalLineSeparator ?? lang.lineSeparator;
    this.#parse = parsers;
    this.#temp = {};
  }

  get aggregate() {
    return this.#aggregate;
  }

  get allFirst() {
    return this.contextStack.every(ctx => ctx.isFirst);
  }

  get allLast() {
    return this.contextStack.every(ctx => ctx.isLast);
  }

  get contextStackSize() {
    return this.contextStack.length;
  }

  get ctx() {
    return this.contextStack.at(0) as ASTContext;
  }

  get currentCtx() {
    return this.contextStack.at(-1);
  }

  get currentNode() {
    return this.ctx?.ast?.last ?? null;
  }

  get handleMismatchedQuotes() {
    return this.#handleMismatchedQuotes ?? false;
  }

  get isEndOfDocument(): boolean {
    return this.ctx.isLast;
  }

  get isFirst() {
    return this.currentCtx?.isFirst ?? false;
  }

  get isLast() {
    return this.currentCtx?.isLast ?? false;
  }

  get isStartOfDocument(): boolean {
    return this.ctx.isFirst;
  }

  get lang() {
    return this.#lang;
  }

  get originalLineSeparator() {
    return this.#originalLineSeparator;
  }

  get parse() {
    return this.#parse;
  }

  getASTContext(text: RawTextValue) {
    const {
      ASTRefMgr,
      lang,
      refMgr,
    } = this;
    const ctx = ASTContext.new({
      ASTRefMgr,
      items: segmentText(lang, text, this),
      lang: lang.id,
      refMgr,
    });

    return ctx;
  }

  getParser(id: string) {
    return this.parse[id] ?? null;
  }

  popCtx(context: IteratorContext<unknown>) {
    if (!(context instanceof IteratorContext)) {
      return;
    }

    const {
      contextStack,
    } = this;

    while (contextStack.includes(context)) {
      contextStack.pop();
    }
  }

  pushCtx(context: IteratorContext<unknown>) {
    const {
      contextStack,
    } = this;

    if (context instanceof IteratorContext && !contextStack.includes(context)) {
      contextStack.push(context);
    }
  }

  temp<T = TempStateDataValue>(key: string, value: T): void;
  temp<T = TempStateDataValue>(key: string): T;
  temp<T = TempStateDataValue>(...args: never[]) {
    let key: string;
    let value: T | undefined;

    if (args.length > 1) {
      [ key, value ] = args;
    }
    else {
      [ key ] = args;
    }

    if (typeof value === `undefined`) {
      return this.#temp[key] ?? null;
    }
    else if (value === null) {
      delete this.#temp[key];
    }
    else {
      this.#temp[key] = value as T;
    }

    return this;
  }

  protected init() {
    this.contextStack = [];

    this.ASTRefMgr = ReferenceManager.new({
      getCacheID() {
        return `ast`;
      },
      refIDProperty: `ast_id`,
      refIndexProperty: `ast_index`,
    });
    this.refMgr = ReferenceManager.new();
  }

  get [Symbol.toStringTag]() {
    return `TendrilState`;
  }
}
