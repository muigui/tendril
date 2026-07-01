import type {
  LineContext,
} from '../context/index.ts';
import {
  ParagraphNode,
} from '../node/index.ts';
import type {
  BaseState,
} from '../state/index.ts';

import {
  type ContextParserConfig,

  ContextParser,
} from './context-parser.ts';

export interface LineParserConfig extends ContextParserConfig { }

export class LineParser extends ContextParser<LineContext> {
  static new(config: LineParserConfig) {
    return new LineParser(config);
  }

  protected async afterParse(line: LineContext, state: BaseState) {
    const {
      ctx,
      ctx: {
        ast,
      },
      lang: {
        lineSeparator,
      },
      // originalLineSeparator,
    } = state;

    // The `SpanNode`'s instance method: `end(value: string)` is created by cloning its opening counterpart.
    // The instance method: `clone` will end up using the same value for `end` as it does for `new`, unless you pass an overwriting `value` when calling `end`.
    ctx.closeSpan(state.isStartOfDocument
      // So, we need to check if we're closing the first paragraph in the document and overwrite the value used, if we are, to ensure a line-break IS included.
      ? ast.spanAt(-1, ParagraphNode)?.end(lineSeparator)

      // Similarly, when dealing with the last paragraph in the document, we don't want to end with a line-break.
      // Ending in a line-break would add an extra line to the end of the AST, which would not accurately represent the document being parsed.
      : state.isEndOfDocument
        // eslint-disable-next-line @stylistic/max-len
        // So, we need to check if we're closing the last paragraph in the document and overwrite the value used, if we are, to ensure a line-break IS NOT included.
        ? ast.spanAt(-1, ParagraphNode)?.end(``)
        // Otherwise, we want to keep the default behaviour which uses the same value for `end` as it does for `new`.
        : undefined);

    await super.afterParse(line, state);
  }

  protected async beforeParse(line: LineContext, state: BaseState) {
    await super.beforeParse(line, state);

    const {
      ctx,
      lang: {
        dir,
        id: lang,
      },
      // originalLineSeparator,
    } = state;

    ctx.openSpan(ParagraphNode.new({
      action: `new`,
      dir,
      index: 0,
      lang,
      // We don't want the first paragraph to have a line-break, or it would add an
      //   extra line at the beginning of the document, which would not accurately
      //   represent the document being parsed.
      value: state.isStartOfDocument
        ? ``
        : undefined,
      // : originalLineSeparator,
    }));
  }

  protected async onParse(line: LineContext, state: BaseState) {
    const segmentsParser = state.getParser(`segments`);

    for await (const segments of line) {
      await segmentsParser.parseContext(segments, state);
    }
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(Line)`;
  // }
}
