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

/** Streaming-specific configuration: the per-chunk flush callback. */
export interface ParserStateStreamingConfig {
  /**
   * Called each time a chunk of nodes is flushed to the output stream.
   *
   * @param err - An error, or `null` on success.
   * @param chunk - The serialized nodes being flushed.
   */
  onChunk: (err: Error | null, chunk: NodeSetNodesData) => void;
}

/** Default streaming config: a no-op `onChunk` callback. */
export const DEFAULT_STREAM_PARSER_STATE_CONFIG: ParserStateStreamingConfig = {
  onChunk: noop,
};

/** Configuration for a {@link StreamingState}. */
export interface StreamingStateConfig extends BaseStateConfig, ParserStateStreamingConfig {
}

/**
 * State for parsing text incrementally from a stream.
 *
 * `StreamingState` is meant to be used for parsing text from a stream. For
 *   parsing a single string of text, use the {@link SimpleState} class instead.
 *   It tracks the running document character index across chunks, a pause/resume
 *   flag, and a "finalizing" flag, and flushes each parsed chunk's nodes out of
 *   the working AST so memory doesn't grow with the document.
 */
export class StreamingState extends BaseState {
  #config: null | ParserStateStreamingConfig = null;
  #currentChunk!: ASTNode | null;
  #currentIndex!: number;
  #finalizing = false;
  #paused!: boolean;

  /**
   * Factory for a {@link StreamingState}.
   *
   * @param config - State configuration, including the `onChunk` callback.
   * @returns A new {@link StreamingState} instance.
   */
  static new(config: StreamingStateConfig) {
    return new StreamingState(config);
  }

  /**
   * @param config - State configuration, including the `onChunk` callback.
   */
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

  /** The streaming configuration (e.g. the `onChunk` callback). */
  get config() {
    return this.#config as ParserStateStreamingConfig;
  }

  /** The most recently flushed chunk as a cloned {@link ASTNode}, or `null`. */
  get currentChunk() {
    return this.#currentChunk;
  }

  /** Running character index into the whole document, across chunks. */
  get currentIndex() {
    return this.#currentIndex;
  }

  /** `true` once {@link StreamingState.finalize | finalize} has been called. */
  get finalizing() {
    return this.#finalizing ?? false;
  }

  /** `true` only when the last line is reached *and* the stream is finalizing. */
  get isEndOfDocument(): boolean {
    return super.isEndOfDocument && this.#finalizing;
  }

  /** `true` only at the first line of the very first chunk. */
  get isStartOfDocument(): boolean {
    return super.isStartOfDocument && this.currentIndex === 0;
  }

  /** `true` while the state is configured and not paused. */
  get on() {
    return !!this.config
      && !this.paused;
  }

  /** `true` while parsing is paused. */
  get paused() {
    return this.#paused;
  }

  /**
   * Marks the stream as finalizing, so the next parse closes out the document.
   *
   * @returns This state, for chaining.
   */
  finalize() {
    this.#finalizing = true;

    return this;
  }

  /**
   * Flushes the working AST: re-indexes and normalizes it, advances the running
   *   index, snapshots it as {@link StreamingState.currentChunk | currentChunk},
   *   clears it, and returns the serialized nodes.
   *
   * @returns The serialized nodes for the flushed chunk.
   */
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

  /**
   * Replaces the root context with one built from the next chunk of text.
   *
   * A trailing `paragraphJoin` is trimmed first, so paragraphs don't accumulate
   *   an extra separator as chunks arrive.
   *
   * @param chunk - The next chunk of source text.
   * @returns This state, for chaining.
   */
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

  /**
   * Pauses parsing.
   *
   * @returns This state, for chaining.
   */
  pause() {
    this.#paused = true;

    return this;
  }

  /**
   * Resumes parsing.
   *
   * @returns This state, for chaining.
   */
  resume() {
    this.#paused = false;

    return this;
  }

  /** Initializes the base state and resets the running chunk/index tracking. */
  protected init() {
    super.init();

    this.#currentChunk = null;
    this.#currentIndex = 0;
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilState(Streaming)`;
  // }
}
