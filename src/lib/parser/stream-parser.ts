import {
  nextTick,
} from 'node:process';
import {
  PassThrough,
} from 'node:stream';

import type {
  ASTContext,
} from '../context/index.ts';
import {
  DocumentNode,
  ParagraphNode,
} from '../node/index.ts';
import {
  type Parsers,
  type ParserStateStreamingConfig,
  type StreamingStateConfig,

  DEFAULT_STREAM_PARSER_STATE_CONFIG,
  StreamingState,
} from '../state/index.ts';

import {
  type ContextParserConfig,

  ContextParser,
} from './context-parser.ts';
import {
  LineParser,
} from './line-parser.ts';
import {
  SegmentsParser,
} from './segments-parser.ts';
import type {
  RawTextValue,
} from './types.ts';

/** Configuration for a {@link StreamParser} (and its subclasses). */
export interface StreamParserConfig extends ContextParserConfig {
  /** When `true`, mismatched opening/closing quotes are still paired. */
  handleMismatchedQuotes?: boolean;
}

/**
 * Abstract base for parsers that consume text incrementally and emit the AST as
 *   a stream of newline-delimited nodes.
 *
 * Text is fed in via {@link StreamParser.parse | parse} and buffered until a
 *   whole paragraph is available; each complete chunk is parsed against a
 *   {@link StreamingState} and its nodes are flushed to a {@link PassThrough}
 *   stream (and to the `onChunk` callback). A {@link DocumentNode} span is opened
 *   at the start of the document and closed by {@link StreamParser.end | end}.
 *   Because rendering is deferred while a quote is open, quotes that overlap
 *   paragraph boundaries stream out correctly.
 */
export abstract class StreamParser extends ContextParser<ASTContext> {
  #handleMismatchedQuotes: boolean;
  #state: null | StreamingState = null;
  #stream: null | PassThrough = null;
  #temp!: string;

  /**
   * @param config - Parser configuration, including the mismatched-quote option.
   */
  constructor(config: StreamParserConfig) {
    super(config);

    this.init();

    this.#handleMismatchedQuotes = config.handleMismatchedQuotes ?? false;
  }

  /** The active streaming state's configuration (e.g. the `onChunk` callback). */
  get config() {
    return this.state.config;
  }

  /** `true` while the parser is running and ready to accept chunks. */
  get on() {
    return this.state?.on ?? false;
  }

  /** The active {@link StreamingState}, or a nullish value when not running. */
  get state() {
    return this.#state as StreamingState;
  }

  /** The output stream that rendered/serialized nodes are written to. */
  get stream() {
    return this.#stream as PassThrough;
  }

  /**
   * Starts a streaming parse, creating a fresh state and output stream.
   *
   * @param config - Optional streaming-state overrides (e.g. `onChunk`).
   * @returns A promise resolving to this parser (resumed and ready).
   * @throws If the parser is already running.
   */
  async begin(config?: Partial<ParserStateStreamingConfig>) {
    if (this.on) {
      throw new Error(`${this.constructor.name}AlreadyOnError: The parser and state are already "on" and ready to parse stream chunks.`);
    }

    this.#state = await this.getState(config);
    this.#stream = new PassThrough();
    this.#temp = ``;

    return this.resume();
  }

  /**
   * Finishes a streaming parse: finalizes state, flushes remaining nodes, ends
   *   the output stream, and tears the parser down.
   *
   * @returns A promise resolving to this parser.
   */
  async end() {
    const {
      lang: {
        lineSeparator,
      },
      state,
    } = this;

    state.finalize();
    await this.parse(lineSeparator);

    nextTick(() => {
      this.flush();
      this.stream.end();
      this.pause();

      this.#state = null;
    });

    return this;
  }

  /**
   * Flushes the current chunk's nodes: notifies `onChunk` and writes each node to
   *   the output stream as a JSON line.
   */
  flush() {
    const {
      config,
      state,
      stream,
    } = this;
    const nodes = state.flush();

    config.onChunk(null, nodes);

    nodes.forEach(node =>
      stream.write(JSON.stringify(node) + `\n`, `utf8`));
  }

  /**
   * Decides whether the buffered `chunk` is a complete, parseable unit.
   *
   * A chunk is loadable when the parser is not paused and either the stream is
   *   finalizing or the chunk ends on a paragraph boundary and is not whitespace-only.
   *
   * @param chunk - The currently buffered text.
   * @returns `true` when the chunk should be parsed now.
   */
  isLoadableChunk(chunk: string) {
    const {
      lang: {
        isWhiteSpaceOnly,
        paragraphJoin,
      },
      state,
      state: {
        finalizing,
        paused,
      },
    } = this;

    return !paused
      && (
        finalizing
        || (chunk.endsWith(paragraphJoin) && !isWhiteSpaceOnly(chunk, state))
      );
  }

  /**
   * Feeds a piece of text into the stream, parsing and flushing once a whole
   *   paragraph has been buffered.
   *
   * @param text - The next piece of source text (e.g. a line).
   * @returns A promise that resolves once any complete chunk has been parsed.
   * @throws If the parser is not currently running.
   */
  async parse(text: RawTextValue) {
    const {
      lang: {
        lineSeparator,
      },
      state,
      state: {
        originalLineSeparator,
      },
    } = this;

    if (!this.on) {
      throw new Error(`${this.constructor.name}NotOnError: The parser is not currently "on".`);
    }

    this.#temp += `${text}${originalLineSeparator}`;

    if (this.isLoadableChunk(this.#temp)) {
      // state.loadChunk(this.#temp.replaceAll(originalLineSeparator, lineSeparator));
      state.loadChunk(originalLineSeparator !== lineSeparator
        ? this.#temp.replaceAll(originalLineSeparator, lineSeparator)
        : this.#temp);

      this.#temp = ``;

      await this.parseContext(state.ctx, state);

      // In this class, `shouldFlush` simply returns `true`.
      // It can be overwritten in subclasses if they need to flush conditionally.
      if (this.shouldFlush()) {
        this.flush();
      }
    }
  }

  /**
   * Pauses the parser so buffered chunks are not parsed until resumed.
   *
   * @returns This parser, for chaining.
   */
  pause() {
    this.state?.pause();

    return this;
  }

  /**
   * Tears the parser back down to an idle state, discarding state, stream, and
   *   any buffered text.
   *
   * @returns This parser, for chaining.
   */
  reset() {
    this.pause();

    this.#state = null;
    this.#stream = null;
    this.#temp = ``;

    return this;
  }

  /**
   * Resumes a paused parser, parsing any already-buffered complete chunk.
   *
   * @returns This parser, for chaining.
   */
  resume() {
    this.state.resume();

    if (this.isLoadableChunk(this.#temp)) {
      const text = this.#temp;

      this.#temp = ``;

      this.parse(text)
        .then(() => {})
        .catch(() => {});
    }

    return this;
  }

  /**
   * Whether a parsed chunk should be flushed immediately.
   *
   * Always `true` here; subclasses can override to flush conditionally.
   *
   * @returns `true` to flush after each parsed chunk.
   */
  // This method specifically leaves a way for subclasses to conditionally decide whether to flush.
  shouldFlush() {
    return true;
  }

  /**
   * After a chunk is parsed: when finalizing, closes the outstanding
   *   {@link DocumentNode} span as the final node of the stream.
   *
   * @param ctx - The AST context for the chunk.
   * @param state - The streaming state.
   */
  protected async afterParse(ctx: ASTContext, state: StreamingState) {
    if (state.finalizing) {
      this.finalize(state);

      // Retrieve the `DocumentNode` from the state's temp cache.
      const node = state.temp(`document`);

      // And end it, as the final AST node of the stream.
      ctx.closeSpan(node.end());

      // Delete the `DocumentNode` from the state's temp cache now that we've used it.
      state.temp(`document`, null);
    }
  }

  /**
   * Before the first chunk: opens the outer {@link DocumentNode} span and stashes
   *   it in the state's temp cache so {@link StreamParser.afterParse | afterParse}
   *   can close it later.
   *
   * @param ctx - The AST context for the chunk.
   * @param state - The streaming state.
   */
  protected async beforeParse(ctx: ASTContext, state: StreamingState) {
    if (state.isStartOfDocument && state.contextStackSize === 1) {
      const node = DocumentNode.new({
        action: `new`,
        dir: this.lang.dir,
        index: 0,
        lang: this.lang.id,
      });

      // Because we're dealing with stream data,
      //   the context stack is changing based on the current chunk being parsed.
      ctx.openSpan(node);

      // As such, we need to store the `DocumentNode` in the state's temp cache
      //   so we can retrieve it later and end it in the `afterParse` method.
      state.temp(`document`, node);
    }
  }

  /**
   * Builds the line and segments parsers for this parser's language.
   *
   * Subclasses override this to add the appropriate segment parser.
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
      document: this,
      line,
      segments,
    };
  }

  /**
   * Creates the {@link StreamingState} used for the parse.
   *
   * @param config - Optional streaming-state overrides (e.g. `onChunk`).
   * @returns A promise resolving to the initialized {@link StreamingState}.
   */
  protected async getState(config: Partial<ParserStateStreamingConfig> = {}) {
    const {
      lang,
    } = this;
    const parsers = this.getParsers();

    config.onChunk ??= DEFAULT_STREAM_PARSER_STATE_CONFIG.onChunk;

    return StreamingState.new({
      handleMismatchedQuotes: this.#handleMismatchedQuotes,
      lang,
      parsers,
      ...config,
    } as StreamingStateConfig);
  }

  /**
   * Trims a dangling trailing newline off the document's final paragraph so the
   *   stream doesn't end with an extra blank line.
   *
   * @param state - The streaming state being finalized.
   */
  protected finalize(state: StreamingState) {
    const {
      ctx,
      lang: {
        isNewLineOnly,
      },
    } = state;
    const paragraph = ctx.ast.spanAt(-1, ParagraphNode);

    if (paragraph) {
      const {
        action,
        value,
      } = paragraph;

      // Ensure there are no extra dangling new lines at the end of the document.
      if (action === `end` && typeof value === `string` && isNewLineOnly(value, state)) {
        paragraph.value = ``;
      }
    }
  }

  /**
   * Iterates the current chunk's lines, delegating each to the `line` parser.
   *
   * @param ctx - The AST context for the chunk.
   * @param state - The streaming state.
   */
  protected async onParse(ctx: ASTContext, state: StreamingState) {
    const lineParser = state.getParser(`line`);

    for await (const line of ctx) {
      await lineParser.parseContext(line, state);
    }
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(Stream)`;
  // }
}
