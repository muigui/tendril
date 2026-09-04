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

/** Configuration for an {@link ASCIISegmentParser}. */
export interface ASCIISegmentParserConfig extends ContextParserConfig { }

/**
 * Segment parser used by the {@link ASCIIArtParser}.
 *
 * It treats every segment as literal text — appending a {@link TokenNode} for
 *   each — with no quote handling, so whitespace and punctuation in ASCII art are
 *   preserved verbatim. The only special case is a trailing document-final
 *   newline, which is dropped.
 */
export class ASCIISegmentParser extends ContextParser<Segments[0]> {
  /**
   * Factory for an {@link ASCIISegmentParser}.
   *
   * @param config - Parser configuration.
   * @returns A new {@link ASCIISegmentParser} instance.
   */
  static new(config: ASCIISegmentParserConfig) {
    return new ASCIISegmentParser(config);
  }

  /**
   * Decides what to do with a segment: append it, or (for a document-final
   *   newline) do nothing.
   *
   * @param curr - The current segment.
   * @param state - The shared parser state.
   * @returns The command action to apply.
   */
  protected async getCommandAction(curr: Segments[0], state: BaseState): Promise<ENUM_SEGMENT_COMMAND_ACTIONS> {
    return (state.lang.isNewLineOnly(curr.segment, state) && state.allLast)
      ? ACTION.JACKSON
      : ACTION.APPEND_TOKEN;
  }

  /**
   * Appends the current segment as a {@link TokenNode}, unless the command action
   *   says otherwise.
   *
   * @param curr - The current segment.
   * @param state - The shared parser state.
   */
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
}
