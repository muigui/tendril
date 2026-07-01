import type {
  SegmentsContext,
} from '../context/index.ts';
import {
  SentenceNode,
} from '../node/index.ts';
import type {
  BaseState,
} from '../state/index.ts';

import {
  type ContextParserConfig,

  ContextParser,
} from './context-parser.ts';

export interface SegmentsParserConfig extends ContextParserConfig { }

export class SegmentsParser extends ContextParser<SegmentsContext> {
  static new(config: SegmentsParserConfig) {
    return new SegmentsParser(config);
  }

  protected async afterParse(segments: SegmentsContext, state: BaseState) {
    const {
      ctx,
    } = state;

    ctx.closeSpan();

    await super.afterParse(segments, state);
  }

  protected async beforeParse(segments: SegmentsContext, state: BaseState) {
    await super.beforeParse(segments, state);

    const {
      ctx,
      lang: {
        dir,
        id: lang,
      },
    } = state;

    ctx.openSpan(SentenceNode.new({
      action: `new`,
      dir,
      index: 0,
      lang,
    }));
  }

  protected async onParse(segments: SegmentsContext, state: BaseState) {
    const segmentParser = state.getParser(`segment`);

    for await (const curr of segments) {
      await segmentParser.parseContext(curr, state);
    }
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(Segments)`;
  // }
}
