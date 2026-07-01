import type {
  RawTextValue,
} from '../parser/index.ts';

import {
  type BaseStateConfig,

  BaseState,
} from './base-state.ts';

export interface SimpleStateConfig extends BaseStateConfig {
  value: RawTextValue;
}

// `SimpleState` is meant to be used for parsing a single string, not a stream of text.
// For parsing text from a stream, use the `StreamingState` class instead.
export class SimpleState extends BaseState {
  protected rawValue!: RawTextValue;

  static new(config: SimpleStateConfig) {
    return new SimpleState(config);
  }

  constructor(config: SimpleStateConfig) {
    super(config);

    this.rawValue = config.value;

    this.init();
  }

  protected init() {
    super.init();

    const ctx = this.getASTContext(this.rawValue);

    this.pushCtx(ctx);
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilState(Simple)`;
  // }
}
