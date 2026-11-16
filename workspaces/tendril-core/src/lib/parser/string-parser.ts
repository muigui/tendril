import type {
  RawTextValue,
} from '../../types.ts';

import {
  ASTContext,
} from '../context/index.ts';
import {
  getLangData,
} from '../i18n/index.ts';
import {
  DocumentNode,
  ReferenceManager,
} from '../node/index.ts';
import {
  aggregateTokens,
  resolveCategories,
  Segmenter,
} from '../utils/index.ts';

import {
  type ContextParserConfig,

  ContextParser,
} from './context-parser.ts';
import {
  SegmentParser,
} from './segment-parser.ts';
import type {
  AggregationConfig,
  ENUM_SENTENCE_SEGMENT_STYLE,
} from './types.ts';

export interface StringParserConfig extends ContextParserConfig<ASTContext> {
  aggregate?: AggregationConfig;
  handleMismatchedQuotes?: boolean;
  sentenceSegmentStyle?: ENUM_SENTENCE_SEGMENT_STYLE;
}

export interface StringParserNewConfig extends Omit<StringParserConfig, `lang`> {
  lang: string;
}

export class StringParser extends ContextParser<ASTContext> {
  segmenter!: Segmenter;

  #aggregate: AggregationConfig;
  #handleMismatchedQuotes: boolean;

  static new(config: StringParserNewConfig) {
    const {
      lang,
      ...conf
    } = config;

    return new StringParser({
      aggregate: true,
      handleMismatchedQuotes: false,
      ...conf,
      lang: getLangData(lang),
    });
  }

  constructor(config: StringParserConfig) {
    super(config);

    this.#aggregate = config.aggregate ?? true;
    this.#handleMismatchedQuotes = config.handleMismatchedQuotes ?? false;

    this.init();
  }

  get aggregate() {
    return this.#aggregate;
  }

  get handleMismatchedQuotes() {
    return this.#handleMismatchedQuotes;
  }

  async parse(text: RawTextValue) {
    const {
      ASTRefMgr,
      lang,
      originalLineSeparator,
      refMgr,
      segmenter,
    } = this;
    const ctx = ASTContext.new({
      ASTRefMgr,
      items: segmenter.segmentText(text),
      lang: lang.id,
      originalLineSeparator,
      refMgr,
      segmenter,
    });

    return this.parseContext(ctx);
  }

  reset() {
    ReferenceManager.reset(this.ASTRefMgr);
    ReferenceManager.reset(this.refMgr);

    return this;
  }

  protected async afterParse(ctx: ASTContext) {
    const categories = resolveCategories(this.#aggregate);

    if (categories.length) {
      // `aggregateTokens` re-indexes the AST itself once it has spliced in
      //   the aggregation nodes.
      aggregateTokens(ctx.ast, {
        categories,
        ctx,
      });
    }

    ctx.closeSpan();
  }

  protected async beforeParse(ctx: ASTContext) {
    ctx.openSpan(DocumentNode.new({
      action: `new`,
      dir: this.lang.dir,
      index: 0,
      lang: this.lang.id,
    }));
  }

  protected init() {
    super.init();

    const {
      lang,
      originalLineSeparator,
    } = this;

    this.ASTRefMgr = ReferenceManager.new({
      getCacheID() {
        return `ast`;
      },
      refIDProperty: `ast_id`,
      refIndexProperty: `ast_index`,
    });

    this.segmenter = Segmenter.new({
      lang,
      lineSeparator: originalLineSeparator,
    });
  }

  // @ts-ignore Ignore TS2416. Because we are OVERWRITING!!!
  protected async onParse(ctx: ASTContext) {
    const {
      ast,
    } = ctx;
    const {
      lang,
      originalLineSeparator,
    } = this;

    for await (const segmentCtx of ctx) {
      const segmentParser = SegmentParser.new({
        ctx: segmentCtx,
        lang,
        originalLineSeparator,
        parentParser: this,
      });

      await segmentParser.parseContext(segmentCtx);
    }

    return ast;
  }
}
