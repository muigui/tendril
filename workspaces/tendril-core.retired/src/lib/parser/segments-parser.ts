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

/** Configuration for a {@link SegmentsParser}. */
export interface SegmentsParserConfig extends ContextParserConfig { }

/**
 * Sentence-level parser: wraps a run of segments in a {@link SentenceNode} span
 *   and delegates each segment to the segment parser.
 *
 * Opens a `new` sentence marker before iterating and closes it afterwards, so
 *   every sentence in the source is delimited in the flat AST.
 */
export class SegmentsParser extends ContextParser<SegmentsContext> {
  /**
   * Factory for a {@link SegmentsParser}.
   *
   * @param config - Parser configuration.
   * @returns A new {@link SegmentsParser} instance.
   */
  static new(config: SegmentsParserConfig) {
    return new SegmentsParser(config);
  }

  /**
   * Closes the sentence span opened in {@link SegmentsParser.beforeParse | beforeParse}.
   *
   * @param segments - The sentence's segment context.
   * @param state - The shared parser state.
   */
  protected async afterParse(segments: SegmentsContext, state: BaseState) {
    const {
      ctx,
    } = state;

    ctx.closeSpan();

    await super.afterParse(segments, state);
  }

  /**
   * Opens a new {@link SentenceNode} span before the sentence's segments are parsed.
   *
   * @param segments - The sentence's segment context.
   * @param state - The shared parser state.
   */
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

  /**
   * Iterates the sentence's segments, delegating each to the `segment` parser.
   *
   * @param segments - The sentence's segment context.
   * @param state - The shared parser state.
   */
  protected async onParse(segments: SegmentsContext, state: BaseState) {
    const segmentParser = state.getParser(`segment`);

    for await (const curr of segments) {
      await segmentParser.parseContext(curr, state);
    }
  }
}
