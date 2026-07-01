import type {
  ASTContext,
} from '../context/index.ts';
import {
  DocumentNode,
} from '../node/index.ts';
import {
  type Parsers,

  SimpleState,
} from '../state/index.ts';
import {
  aggregateTokens,
  resolveCategories,
} from '../utils/index.ts';

import {
  ContextParser,
  type ContextParserConfig,
} from './context-parser.ts';
import {
  LineParser,
} from './line-parser.ts';
import {
  SegmentsParser,
} from './segments-parser.ts';
import type {
  AggregationConfig,
  RawTextValue,
} from './types.ts';

export interface StringParserConfig extends ContextParserConfig {
  aggregate?: AggregationConfig;
  handleMismatchedQuotes?: boolean;
}

export abstract class StringParser extends ContextParser<ASTContext> {
  #aggregate: AggregationConfig;
  #handleMismatchedQuotes: boolean;

  constructor(config: StringParserConfig) {
    super(config);

    this.#aggregate = config.aggregate ?? false;
    this.#handleMismatchedQuotes = config.handleMismatchedQuotes ?? false;
  }

  getASTNode(state: SimpleState) {
    return state.ctx.ast;
  }

  async parse(text: RawTextValue) {
    const state = await this.getState(text);

    await this.parseContext(state.ctx, state);

    return this.getASTNode(state);
  }

  protected async afterParse(ctx: ASTContext, _state: SimpleState) {
    ctx.closeSpan();

    ctx.ast.updateNewLines(this.originalLineSeparator);

    const categories = resolveCategories(this.#aggregate);

    if (categories.length) {
      // `aggregateTokens` re-indexes the AST itself once it has spliced in
      //   the aggregation nodes.
      aggregateTokens(ctx.ast, {
        categories,
        ctx,
      });
    }
    else {
      ctx.ast.reindex();
    }
  }

  protected async beforeParse(ctx: ASTContext, _state: SimpleState) {
    ctx.openSpan(DocumentNode.new({
      action: `new`,
      dir: this.lang.dir,
      index: 0,
      lang: this.lang.id,
    }));
  }

  protected getParsers(): Parsers {
    const {
      lang,
    } = this;
    const line = LineParser.new({
      lang,
    });
    const segments = new SegmentsParser({
      lang,
    });

    return {
      // @ts-ignore: Ignore TS2322... I don't care, TypeScript. NO ONE CARES, TYPESCRIPT!!!
      document: this,
      line,
      segments,
    };
  }

  protected async getState(value: RawTextValue) {
    const {
      lang,
      originalLineSeparator,
    } = this;
    const parsers = this.getParsers();

    return SimpleState.new({
      aggregate: this.#aggregate,
      handleMismatchedQuotes: this.#handleMismatchedQuotes,
      lang,
      originalLineSeparator,
      parsers,
      // value,
      value: originalLineSeparator !== lang.lineSeparator
        ? `${value}`.replaceAll(originalLineSeparator, lang.lineSeparator)
        : value,
    });
  }

  protected async onParse(ctx: ASTContext, state: SimpleState) {
    const lineParser = state.getParser(`line`);

    for await (const line of ctx) {
      await lineParser.parseContext(line, state);
    }
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(String)`;
  // }
}
