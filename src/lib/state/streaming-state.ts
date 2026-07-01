import type {
  ASTNode,
  NodeSetNodesData,
} from '../node/index.ts';
import type {
  RawTextValue,
} from '../parser/index.ts';
import {
  noop,
} from '../utils/index.ts';

import {
  type BaseStateConfig,

  BaseState,
} from './base-state.ts';

export interface ParserStateStreamingConfig {
  // This callback will be called when a chunk is flushed to the output stream.
  onChunk: (err: Error | null, chunk: NodeSetNodesData) => void;
}

export const DEFAULT_STREAM_PARSER_STATE_CONFIG: ParserStateStreamingConfig = {
  onChunk: noop,
};

export interface StreamingStateConfig extends BaseStateConfig, ParserStateStreamingConfig {
}

// `StreamingState` is meant to be used for parsing text from a stream.
// For parsing a single string of text, use the `SimpleState` class instead.
export class StreamingState extends BaseState {
  #config: null | ParserStateStreamingConfig = null;
  #currentChunk!: ASTNode | null;
  #currentIndex!: number;
  #finalizing = false;
  #paused!: boolean;

  static new(config: StreamingStateConfig) {
    return new StreamingState(config);
  }

  constructor(config: StreamingStateConfig) {
    super(config);

    this.init();

    // Would have been nice to put this in the `init` method, but we can't because
    //   of the private `#config` field, which can only be assigned to this `this` context,
    //   once `super(config)` has completely finished executing.
    const {
      onChunk = DEFAULT_STREAM_PARSER_STATE_CONFIG.onChunk,
    } = config;

    this.#config = {
      onChunk,
    };
  }

  get config() {
    return this.#config as ParserStateStreamingConfig;
  }

  get currentChunk() {
    return this.#currentChunk;
  }

  get currentIndex() {
    return this.#currentIndex;
  }

  get finalizing() {
    return this.#finalizing ?? false;
  }

  get isEndOfDocument(): boolean {
    return super.isEndOfDocument && this.#finalizing;
  }

  get isStartOfDocument(): boolean {
    return super.isStartOfDocument && this.currentIndex === 0;
  }

  get on() {
    return !!this.config
      && !this.paused;
  }

  get paused() {
    return this.#paused;
  }

  finalize() {
    this.#finalizing = true;

    return this;
  }

  flush() {
    const {
      ctx: {
        ast,
      },
    } = this;

    ast.updateNewLines(this.originalLineSeparator)
      .reindex(this.currentIndex);

    this.#currentIndex += ast.length;

    const astChunk = ast.clone();
    const {
      nodes,
    } = astChunk.toJSON();

    ast.clear();

    this.#currentChunk = astChunk;

    return nodes;
  }

  loadChunk(chunk: RawTextValue) {
    const {
      lang: {
        paragraphJoin,
      },
    } = this;
    // If the chunk of text ends with a `paragraphJoin`, we want to chop it off.
    // Otherwise, we end up with an extra `paragraphJoin`, for every paragraph parsed.
    const text = `${chunk}`.endsWith(paragraphJoin)
      ? `${chunk}`.slice(0, -2)
      : chunk;

    this.contextStack[0] = this.getASTContext(text);

    return this;
  }

  pause() {
    this.#paused = true;

    return this;
  }

  resume() {
    this.#paused = false;

    return this;
  }

  protected init() {
    super.init();

    this.#currentChunk = null;
    this.#currentIndex = 0;
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilState(Streaming)`;
  // }
}
