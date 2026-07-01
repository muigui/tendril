import type {
  Segments,
} from '../i18n/index.ts';
import {
  TokenNode,
} from '../node/index.ts';
import type {
  BaseState,
} from '../state/index.ts';

import {
  type ContextParserConfig,

  ContextParser,
} from './context-parser.ts';
import {
  type ENUM_SEGMENT_COMMAND_ACTIONS,

  SEGMENT_COMMAND_ACTIONS as ACTION,
} from './types.ts';

export interface ASCIISegmentParserConfig extends ContextParserConfig { }

export class ASCIISegmentParser extends ContextParser<Segments[0]> {
  static new(config: ASCIISegmentParserConfig) {
    return new ASCIISegmentParser(config);
  }

  protected async getCommandAction(curr: Segments[0], state: BaseState): Promise<ENUM_SEGMENT_COMMAND_ACTIONS> {
    return (state.lang.isNewLineOnly(curr.segment, state) && state.allLast)
      ? ACTION.JACKSON
      : ACTION.APPEND_TOKEN;
  }

  protected async onParse(curr: Segments[0], state: BaseState) {
    const {
      ctx,
    } = state;
    const command = await this.getCommandAction(curr, state);

    if (command !== ACTION.APPEND_TOKEN) {
      return;
    }

    ctx.append(TokenNode.fromSegment(curr, ctx));
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(ASCIISegment)`;
  // }
}
