import type {
  RawTextValue,
} from '../parser/index.ts';

import {
  type BaseStateConfig,

  BaseState,
} from './base-state.ts';

/** Configuration for a {@link SimpleState}. */
export interface SimpleStateConfig extends BaseStateConfig {
  /** The whole text (or paragraphs) to parse in a single pass. */
  value: RawTextValue;
}

/**
 * State for parsing a single, complete string in one pass.
 *
 * `SimpleState` is meant to be used for parsing a single string, not a stream of
 *   text. For parsing text from a stream, use the {@link StreamingState} class
 *   instead. It seeds the context stack with an {@link ASTContext} built from the
 *   full input value.
 */
export class SimpleState extends BaseState {
  protected rawValue!: RawTextValue;

  /**
   * Factory for a {@link SimpleState}.
   *
   * @param config - State configuration, including the `value` to parse.
   * @returns A new {@link SimpleState} instance.
   */
  static new(config: SimpleStateConfig) {
    return new SimpleState(config);
  }

  /**
   * @param config - State configuration, including the `value` to parse.
   */
  constructor(config: SimpleStateConfig) {
    super(config);

    this.rawValue = config.value;

    this.init();
  }

  /** Initializes the base state and seeds the stack with the input's {@link ASTContext}. */
  protected init() {
    super.init();

    const ctx = this.getASTContext(this.rawValue);

    this.pushCtx(ctx);
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilState(Simple)`;
  // }
}
