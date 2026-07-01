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

export interface StreamParserConfig extends ContextParserConfig {
  handleMismatchedQuotes?: boolean;
}

export abstract class StreamParser extends ContextParser<ASTContext> {
  #handleMismatchedQuotes: boolean;
  #state: null | StreamingState = null;
  #stream: null | PassThrough = null;
  #temp!: string;

  constructor(config: StreamParserConfig) {
    super(config);

    this.init();

    this.#handleMismatchedQuotes = config.handleMismatchedQuotes ?? false;
  }

  get config() {
    return this.state.config;
  }

  get on() {
    return this.state?.on ?? false;
  }

  get state() {
    return this.#state as StreamingState;
  }

  get stream() {
    return this.#stream as PassThrough;
  }

  async begin(config?: Partial<ParserStateStreamingConfig>) {
    if (this.on) {
      throw new Error(`${this.constructor.name}AlreadyOnError: The parser and state are already "on" and ready to parse stream chunks.`);
    }

    this.#state = await this.getState(config);
    this.#stream = new PassThrough();
    this.#temp = ``;

    return this.resume();
  }

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

  pause() {
    this.state?.pause();

    return this;
  }

  reset() {
    this.pause();

    this.#state = null;
    this.#stream = null;
    this.#temp = ``;

    return this;
  }

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

  // This method specifically leaves a way for subclasses to conditionally decide whether to flush.
  shouldFlush() {
    return true;
  }

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
