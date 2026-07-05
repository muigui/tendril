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

/** Configuration for a {@link StringParser} (and its subclasses). */
export interface StringParserConfig extends ContextParserConfig {
  /** Token-aggregation opt-in (see {@link AggregationConfig}); defaults to off. */
  aggregate?: AggregationConfig;
  /** When `true`, mismatched opening/closing quotes are still paired. */
  handleMismatchedQuotes?: boolean;
}

/**
 * Abstract base for parsers that consume a whole string (or array of paragraphs)
 *   in one pass and return the finished {@link ASTNode}.
 *
 * It drives the document → line pipeline against a {@link SimpleState}, wrapping
 *   the run in a {@link DocumentNode} span and, after parsing, normalizing line
 *   breaks and optionally aggregating multi-token values (URLs, emails, …).
 *   Subclasses ({@link TextDocumentParser}, {@link ASCIIArtParser}) choose the
 *   segment parser via {@link StringParser.getParsers | getParsers}.
 */
export abstract class StringParser extends ContextParser<ASTContext> {
  #aggregate: AggregationConfig;
  #handleMismatchedQuotes: boolean;

  /**
   * @param config - Parser configuration, including aggregation and
   *   mismatched-quote options.
   */
  constructor(config: StringParserConfig) {
    super(config);

    this.#aggregate = config.aggregate ?? false;
    this.#handleMismatchedQuotes = config.handleMismatchedQuotes ?? false;
  }

  /**
   * Returns the finished AST from a completed parse state.
   *
   * Exposed as an overridable hook so subclasses can post-process the AST.
   *
   * @param state - The completed parse state.
   * @returns The parsed {@link ASTNode}.
   */
  getASTNode(state: SimpleState) {
    return state.ctx.ast;
  }

  /**
   * Parses `text` into a flat AST.
   *
   * @param text - The document string, or an array of paragraphs, to parse.
   * @returns A promise resolving to the parsed {@link ASTNode}.
   */
  async parse(text: RawTextValue) {
    const state = await this.getState(text);

    await this.parseContext(state.ctx, state);

    return this.getASTNode(state);
  }

  /**
   * Closes the document span, normalizes line breaks, and runs token aggregation
   *   (or a plain re-index when aggregation is off).
   *
   * @param ctx - The AST context.
   * @param _state - The parse state (unused).
   */
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

  /**
   * Opens the outer {@link DocumentNode} span before parsing begins.
   *
   * @param ctx - The AST context.
   * @param _state - The parse state (unused).
   */
  protected async beforeParse(ctx: ASTContext, _state: SimpleState) {
    ctx.openSpan(DocumentNode.new({
      action: `new`,
      dir: this.lang.dir,
      index: 0,
      lang: this.lang.id,
    }));
  }

  /**
   * Builds the line and segments parsers for this parser's language.
   *
   * Subclasses override this to add the segment parser appropriate to their
   *   dialect (plain text vs ASCII art).
   *
   * @returns The parser registry keyed by level (`document`, `line`, `segments`).
   */
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

  /**
   * Creates the {@link SimpleState} for a parse, normalizing the source line
   *   separator to the language's own where they differ.
   *
   * @param value - The raw text (or paragraphs) to seed the state with.
   * @returns A promise resolving to the initialized {@link SimpleState}.
   */
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

  /**
   * Iterates the document's lines, delegating each to the `line` parser.
   *
   * @param ctx - The AST context.
   * @param state - The parse state.
   */
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
