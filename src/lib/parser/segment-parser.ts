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

export interface SegmentParserConfig extends ContextParserConfig { }

export class SegmentParser extends ContextParser<Segments[0]> {
  static new(config: SegmentParserConfig) {
    return new SegmentParser(config);
  }

  protected async getCommandAction(curr: Segments[0], state: BaseState): Promise<ENUM_SEGMENT_COMMAND_ACTIONS> {
    const {
      ctx: {
        currentQuote: quote,
        inQuote,
      },
      handleMismatchedQuotes,
      lang: {
        getTuple,
        isApostrophe,
        isApostropheChar,
        isClosingQuote,
        isOpeningQuote,
        quotesMatch,
        quotesMismatched,
      },
    } = state;

    // [CC] TODO: New stuff, when we get rid of `paragraphs`/`Segments[][]`
    // if (curr.isWordLike || isWhiteSpaceOnly(curr.segment, state)) {
    //   return ACTION.APPEND_TOKEN;
    // }
    // else if (isNewLineOnly(curr.segment, state)) {
    //   return ACTION.APPEND_LINE;
    // }

    if (curr.isWordLike) {
      return ACTION.APPEND_TOKEN;
    }

    if (isClosingQuote(curr.segment, state)) {
      if (inQuote) {
        if (quotesMatch(`${quote?.value}`, curr.segment)) {
          return ACTION.QUOTE_CLOSE;
        }

        if (handleMismatchedQuotes && quotesMismatched(`${quote?.value}`, curr.segment)) {
          return ACTION.QUOTE_CLOSE_MISMATCHED;
        }
      }

      if (isApostrophe(curr.segment, state)) {
        return ACTION.APPEND_TOKEN;
      }
      else {
        const tuple = getTuple(curr.segment, state);

        return isApostropheChar(curr.segment, state)
          ? ACTION.APPEND_TOKEN
          : tuple && tuple[0] === tuple[1]
            ? ACTION.QUOTE_OPEN
            : ACTION.APPEND_TOKEN;
      }
    }

    if (isOpeningQuote(curr.segment, state)) {
      if (!inQuote || !quotesMatch(`${quote?.value}`, curr.segment)) {
        return ACTION.QUOTE_OPEN;
      }
    }

    return ACTION.APPEND_TOKEN;
  }

  protected async onParse(curr: Segments[0], state: BaseState) {
    const {
      ctx,
    } = state;
    const command = await this.getCommandAction(curr, state);

    // eslint-disable-next-line default-case
    switch (command) {
      case ACTION.APPEND_TOKEN:
        ctx.append(TokenNode.fromSegment(curr, ctx));

        break;
      case ACTION.QUOTE_OPEN:
        ctx.openQuote(curr.segment, curr.index);

        break;
      case ACTION.QUOTE_CLOSE:
        ctx.closeQuote();

        break;
      case ACTION.QUOTE_CLOSE_MISMATCHED:
        ctx.closeQuote(curr.segment, true);

        break;
    }
  }
}
