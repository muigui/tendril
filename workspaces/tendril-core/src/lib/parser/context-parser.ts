import type {
  UniversalIteratorContextParent,
} from '../context/index.ts';
import type {
  ENUM_LINE_SEPARATOR,
  Language,
} from '../i18n/index.ts';
import {
  type NodeArray,
  type ValidNodes,

  ReferenceManager,
} from '../node/index.ts';
import {
  TempData,
} from '../utils/index.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UniversalContextParserParent = ContextParser<any, any>;

export interface ContextParserConfig<
  CONTEXT_CLASS = UniversalIteratorContextParent,
  PARENT_PARSER = UniversalContextParserParent,
> {
  ctx?: CONTEXT_CLASS;
  lang: Language;
  originalLineSeparator?: ENUM_LINE_SEPARATOR;
  parentParser?: PARENT_PARSER;
}

export abstract class ContextParser<
  CONTEXT_CLASS = UniversalIteratorContextParent,
  PARENT_PARSER = UniversalContextParserParent,
> {
  public ctx!: CONTEXT_CLASS;
  public lang!: Language;
  public parentParser?: PARENT_PARSER;
  public temp!: TempData;

  protected ASTRefMgr!: ReferenceManager;
  protected refMgr!: ReferenceManager;

  #originalLineSeparator: ENUM_LINE_SEPARATOR;

  constructor({
    ctx,
    lang,
    originalLineSeparator,
    parentParser,
  }: ContextParserConfig<CONTEXT_CLASS, PARENT_PARSER>) {
    if (ctx) {
      this.ctx = ctx;
    }

    this.lang = lang;

    if (parentParser) {
      this.parentParser = parentParser;
    }

    this.#originalLineSeparator = originalLineSeparator ?? lang.lineSeparator;

    if (this.originalLineSeparator) {
      this.lang.paragraphJoin = this.originalLineSeparator.repeat(2);
    }
  }

  get originalLineSeparator() {
    return this.#originalLineSeparator;
  }

  async parseContext(ctx: CONTEXT_CLASS) {
    await this.beforeParse(ctx);

    const ast: NodeArray<ValidNodes> = await this.onParse(ctx);

    await this.afterParse(ctx, ast);

    return ast.reindex();
  }

  protected async afterParse(_ctx: CONTEXT_CLASS, _ast?: NodeArray<ValidNodes>) {}

  protected async beforeParse(_ctx: CONTEXT_CLASS) {}

  protected init() {
    this.refMgr = ReferenceManager.new();

    this.temp = TempData.new();
  }

  protected abstract onParse(ctx: CONTEXT_CLASS): Promise<NodeArray<ValidNodes>>;

  get [Symbol.toStringTag]() {
    return `TendrilParser`;
  }
}
