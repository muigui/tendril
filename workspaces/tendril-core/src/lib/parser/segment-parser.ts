import type {
  SegmentContext,
} from '../context/index.ts';
import type {
  ItemSegment,
  ProcessableSegment,
} from '../i18n/index.ts';
import {
  LineNode,
  SentenceNode,
  TokenNode,
} from '../node/index.ts';

import {
  type ContextParserConfig,

  ContextParser,
} from './context-parser.ts';
import type {
  StreamParser,
} from './stream-parser.ts';
import type {
  StringParser,
} from './string-parser.ts';
import {
  type ENUM_SEGMENT_COMMAND_ACTIONS,

  SEGMENT_COMMAND_ACTIONS as ACTION,
} from './types.ts';

export interface SegmentParserConfig extends ContextParserConfig<SegmentContext, StreamParser | StringParser> { }

export class SegmentParser extends ContextParser<SegmentContext, StreamParser | StringParser> {
  static new(config: SegmentParserConfig) {
    return new SegmentParser(config);
  }

  constructor(config: SegmentParserConfig) {
    super(config);
  }

  addNewLine() {
    const {
      parentCtx,
    } = this.ctx;
    const {
      ast,
      lang,
      originalLineSeparator,
    } = parentCtx!;

    ast.add(LineNode.new({
      lang: lang.id,
      value: originalLineSeparator ?? lang.lineSeparator,
    }));

    return this;
  }

  async parseNode(ctx: SegmentContext, curr: ProcessableSegment) {
    const {
      parentCtx,
    } = ctx;
    const {
      ast,
    } = parentCtx!;

    if (curr.isNewLineBreak) {
      this.addNewLine();
    }
    else if (curr.isWordLike) {
      ast.add(TokenNode.fromSegment(curr as ItemSegment, parentCtx!));
    }
    else {
      const command = await this.getCommandAction(curr, ctx);

      // eslint-disable-next-line default-case
      switch (command) {
        case ACTION.APPEND_TOKEN:
          ast.add(TokenNode.fromSegment(curr as ItemSegment, parentCtx));

          break;
        case ACTION.QUOTE_OPEN:
          parentCtx!.openQuote(curr.segment, curr.index);

          break;
        case ACTION.QUOTE_CLOSE:
          parentCtx!.closeQuote();

          break;
        case ACTION.QUOTE_CLOSE_MISMATCHED:
          parentCtx!.closeQuote(curr.segment, true);

          break;
      }
    }
  }

  protected async getCommandAction(
    curr: ProcessableSegment,
    ctx: SegmentContext,
  ): Promise<ENUM_SEGMENT_COMMAND_ACTIONS> {
    const {
      lang: {
        getTuple,
        isApostrophe,
        isClosingQuote,
        isOpeningQuote,
        quotesMatch,
        quotesMismatched,
      },
      parentParser,
    } = this;
    const {
      handleMismatchedQuotes,
    } = parentParser!;
    const {
      parentCtx,
    } = ctx;
    const {
      ast,
      currentQuote: quote,
      inQuote,
    } = parentCtx!;

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

    if (isClosingQuote(curr.segment)) {
      if (inQuote) {
        if (quotesMatch(`${quote?.value}`, curr.segment)) {
          return ACTION.QUOTE_CLOSE;
        }

        if (handleMismatchedQuotes && quotesMismatched(`${quote?.value}`, curr.segment)) {
          return ACTION.QUOTE_CLOSE_MISMATCHED;
        }
      }

      if (isApostrophe(curr.segment, ctx.$next as ItemSegment, ast.lastToken)) {
        return ACTION.APPEND_TOKEN;
      }
      else {
        const tuple = getTuple(curr.segment);

        return isApostrophe(curr.segment, ctx?.$next as ItemSegment, ast.lastToken)
          ? ACTION.APPEND_TOKEN
          : tuple && tuple[0] === tuple[1]
            ? ACTION.QUOTE_OPEN
            : ACTION.APPEND_TOKEN;
      }
    }

    if (isOpeningQuote(curr.segment)) {
      if (!inQuote || !quotesMatch(`${quote?.value}`, curr.segment)) {
        return ACTION.QUOTE_OPEN;
      }
    }

    return ACTION.APPEND_TOKEN;
  }

  protected async afterParse(ctx: SegmentContext) {
    const {
      parentCtx,
    } = ctx;
    const {
      currentSpan,
    } = parentCtx!;

    if (!ctx.isNewLineOnly && currentSpan && currentSpan.category === `sentence`) {
      parentCtx!.closeSpan(currentSpan.end());
    }
  }

  protected async beforeParse(ctx: SegmentContext) {
    const {
      parentCtx,
    } = ctx;
    const {
      lang: {
        dir,
        id: lang,
      },
    } = parentCtx!;

    if (ctx.size > 1) {
      parentCtx!.openSpan(SentenceNode.new({
        action: `new`,
        dir,
        index: 0,
        lang,
      }));
    }
  }

  protected async onParse(ctx: SegmentContext) {
    const {
      parentCtx,
    } = ctx;
    const {
      ast,
    } = parentCtx!;

    for await (const curr of ctx) {
      if (curr.isNewLineBreak && ctx.size === 1) {
        this.addNewLine();
      }
      else {
        await this.parseNode(ctx, curr);
      }
    }

    return ast;
  }
}
