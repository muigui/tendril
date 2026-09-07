import {
  IteratorContext,
} from '../context/index.ts';
import type {
  ENUM_LINE_SEPARATOR,
  Language,
} from '../i18n/index.ts';
import type {
  BaseState,
} from '../state/index.ts';

/** Base configuration shared by every {@link ContextParser}. */
export interface ContextParserConfig {
  /** The resolved language configuration to parse with. */
  lang: Language;
  /** Line separator used by the *source* text (defaults to the language's). */
  originalLineSeparator?: ENUM_LINE_SEPARATOR;
}

/**
 * Abstract base for every parser in the pipeline.
 *
 * Each parser handles one level of the document hierarchy (document → line →
 *   sentence → segment). {@link ContextParser.parseContext | parseContext} runs
 *   the fixed {@link ContextParser.beforeParse | beforeParse} →
 *   {@link ContextParser.onParse | onParse} →
 *   {@link ContextParser.afterParse | afterParse} lifecycle, pushing/popping the
 *   context onto the {@link BaseState}'s stack around the work. Subclasses
 *   implement `onParse` (and often override the hooks) to open spans, emit
 *   tokens, and delegate to the next parser down.
 *
 * @typeParam CONTEXT_CLASS - The context type this parser operates on.
 */
export abstract class ContextParser<CONTEXT_CLASS> {
  /** The resolved language configuration in use. */
  public lang!: Language;

  #originalLineSeparator: ENUM_LINE_SEPARATOR;

  /**
   * @param config - Parser configuration (language and optional source line
   *   separator).
   */
  constructor({
    lang,
    originalLineSeparator,
  }: ContextParserConfig) {
    this.lang = lang;

    this.#originalLineSeparator = originalLineSeparator ?? lang.lineSeparator;
  }

  /** The line separator used by the source text being parsed. */
  get originalLineSeparator() {
    return this.#originalLineSeparator;
  }

  /**
   * Runs the full parse lifecycle for a context: before → on → after.
   *
   * @param ctx - The context to parse.
   * @param state - The shared parser state.
   */
  async parseContext(ctx: CONTEXT_CLASS, state: BaseState) {
    await this.beforeParse(ctx, state);
    await this.onParse(ctx, state);
    await this.afterParse(ctx, state);
  }

  /**
   * Lifecycle hook run after parsing; pops the context off the state stack.
   *
   * @param ctx - The context that was parsed.
   * @param state - The shared parser state.
   */
  protected async afterParse(ctx: CONTEXT_CLASS, state: BaseState) {
    if (ctx instanceof IteratorContext) {
      state.popCtx(ctx);
    }
  }

  /**
   * Lifecycle hook run before parsing; pushes the context onto the state stack.
   *
   * @param ctx - The context about to be parsed.
   * @param state - The shared parser state.
   */
  protected async beforeParse(ctx: CONTEXT_CLASS, state: BaseState) {
    if (ctx instanceof IteratorContext) {
      state.pushCtx(ctx);
    }
  }

  /** Optional one-time initialization hook; no-op by default. */
  protected init() { }

  /**
   * Performs the parser's core work for a context.
   *
   * @param ctx - The context to parse.
   * @param state - The shared parser state.
   */
  protected abstract onParse(ctx: CONTEXT_CLASS, state: BaseState): Promise<void>;

  get [Symbol.toStringTag]() {
    return `TendrilParser`;
  }
}
