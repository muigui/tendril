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

/** Configuration for a {@link SegmentParser}. */
export interface SegmentParserConfig extends ContextParserConfig { }

/**
 * Innermost parser: decides what a single segment means and mutates the AST
 *   accordingly.
 *
 * Word-like segments become {@link TokenNode}s; quote characters open or close
 *   {@link QuoteNode} spans (including apostrophe-vs-quote disambiguation and, when
 *   enabled, mismatched-quote handling); everything else is appended as a token.
 */
export class SegmentParser extends ContextParser<Segments[0]> {
  /**
   * Factory for a {@link SegmentParser}.
   *
   * @param config - Parser configuration.
   * @returns A new {@link SegmentParser} instance.
   */
  static new(config: SegmentParserConfig) {
    return new SegmentParser(config);
  }

  /**
   * Classifies the current segment into a command action.
   *
   * Distinguishes word-like text, opening/closing quotes (matched, mismatched, or
   *   an apostrophe used mid-word), and plain punctuation, so the caller knows
   *   whether to append a token or open/close a quote.
   *
   * @param curr - The current segment.
   * @param state - The shared parser state.
   * @returns The command action to apply.
   */
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

  /**
   * Applies the classified command action for the current segment: append a
   *   token, or open/close a (possibly mismatched) quote.
   *
   * @param curr - The current segment.
   * @param state - The shared parser state.
   */
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
