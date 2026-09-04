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

/** Configuration shared by every {@link BaseState} subclass. */
export interface BaseStateConfig {
  /** Token-aggregation opt-in (see {@link AggregationConfig}); defaults to off. */
  aggregate?: AggregationConfig;
  /** When `true`, mismatched opening/closing quotes are still paired. */
  handleMismatchedQuotes?: boolean;
  /** The resolved language configuration to parse with. */
  lang: Language;
  /** Line separator used by the source text (defaults to the language's). */
  originalLineSeparator?: ENUM_LINE_SEPARATOR;
  /** The parser registry, keyed by level. */
  parsers: Parsers;
}

/**
 * Shared parsing state threaded through every parser in the pipeline.
 *
 * It owns the context stack (document → line → sentence → segment), the two
 *   {@link ReferenceManager}s used to pair span markers, the resolved language
 *   and options, and a small temp store. Positional getters (`isStartOfDocument`,
 *   `allLast`, …) summarize where the parse currently sits across the stack.
 *   {@link SimpleState} and {@link StreamingState} specialize it.
 */
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

  /**
   * @param config - State configuration (language, parsers, and options).
   */
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

  /** The token-aggregation configuration in effect. */
  get aggregate() {
    return this.#aggregate;
  }

  /** `true` when every context on the stack is at its first item. */
  get allFirst() {
    return this.contextStack.every(ctx => ctx.isFirst);
  }

  /** `true` when every context on the stack is at its last item. */
  get allLast() {
    return this.contextStack.every(ctx => ctx.isLast);
  }

  /** The number of contexts currently on the stack. */
  get contextStackSize() {
    return this.contextStack.length;
  }

  /** The root {@link ASTContext} (bottom of the stack). */
  get ctx() {
    return this.contextStack.at(0) as ASTContext;
  }

  /** The innermost (top-of-stack) context. */
  get currentCtx() {
    return this.contextStack.at(-1);
  }

  /** The most recently appended AST node, or `null`. */
  get currentNode() {
    return this.ctx?.ast?.last ?? null;
  }

  /** Whether mismatched quotes are being paired. */
  get handleMismatchedQuotes() {
    return this.#handleMismatchedQuotes ?? false;
  }

  /** `true` at the last line of the document. */
  get isEndOfDocument(): boolean {
    return this.ctx.isLast;
  }

  /** `true` when the innermost context is at its first item. */
  get isFirst() {
    return this.currentCtx?.isFirst ?? false;
  }

  /** `true` when the innermost context is at its last item. */
  get isLast() {
    return this.currentCtx?.isLast ?? false;
  }

  /** `true` at the first line of the document. */
  get isStartOfDocument(): boolean {
    return this.ctx.isFirst;
  }

  /** The resolved language configuration in use. */
  get lang() {
    return this.#lang;
  }

  /** The line separator used by the source text. */
  get originalLineSeparator() {
    return this.#originalLineSeparator;
  }

  /** The parser registry, keyed by level. */
  get parse() {
    return this.#parse;
  }

  /**
   * Segments `text` and builds a fresh {@link ASTContext} for it, wired to this
   *   state's reference managers.
   *
   * @param text - The raw text (or paragraphs) to segment.
   * @returns A new {@link ASTContext} ready to iterate.
   */
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

  /**
   * Looks up a parser from the registry by its level id.
   *
   * @param id - The parser key (e.g. `line`, `segments`, `segment`).
   * @returns The matching parser, or `null` when absent.
   */
  getParser(id: string) {
    return this.parse[id] ?? null;
  }

  /**
   * Removes a context from the stack (all occurrences of it).
   *
   * @param context - The context to pop.
   */
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

  /**
   * Pushes a context onto the stack, unless it is already present.
   *
   * @param context - The context to push.
   */
  pushCtx(context: IteratorContext<unknown>) {
    const {
      contextStack,
    } = this;

    if (context instanceof IteratorContext && !contextStack.includes(context)) {
      contextStack.push(context);
    }
  }

  /**
   * Reads or writes the state's temp scratch store.
   *
   * With one argument, returns the stored value (or `null`). With two, stores the
   *   value — or deletes the key when the value is `null`.
   *
   * @typeParam T - The value type stored/returned.
   * @param args - Either `[key]` to read, or `[key, value]` to write/delete.
   * @returns The stored value when reading; otherwise this state, for chaining.
   */
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

  /**
   * Initializes the context stack and the two reference managers (document-wide
   *   and per-chunk).
   */
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
