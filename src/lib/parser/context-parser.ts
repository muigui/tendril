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

export interface ContextParserConfig {
  lang: Language;
  originalLineSeparator?: ENUM_LINE_SEPARATOR;
}

export abstract class ContextParser<CONTEXT_CLASS> {
  public lang!: Language;

  #originalLineSeparator: ENUM_LINE_SEPARATOR;

  constructor({
    lang,
    originalLineSeparator,
  }: ContextParserConfig) {
    this.lang = lang;

    this.#originalLineSeparator = originalLineSeparator ?? lang.lineSeparator;
  }

  get originalLineSeparator() {
    return this.#originalLineSeparator;
  }

  async parseContext(ctx: CONTEXT_CLASS, state: BaseState) {
    await this.beforeParse(ctx, state);
    await this.onParse(ctx, state);
    await this.afterParse(ctx, state);
  }

  protected async afterParse(ctx: CONTEXT_CLASS, state: BaseState) {
    if (ctx instanceof IteratorContext) {
      state.popCtx(ctx);
    }
  }

  protected async beforeParse(ctx: CONTEXT_CLASS, state: BaseState) {
    if (ctx instanceof IteratorContext) {
      state.pushCtx(ctx);
    }
  }

  protected init() { }

  protected abstract onParse(ctx: CONTEXT_CLASS, state: BaseState): Promise<void>;

  get [Symbol.toStringTag]() {
    return `TendrilParser`;
  }
}
