import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

/** Configuration for {@link SentenceNode.new} — an {@link ISpanNode} without its fixed `category`/`type`. */
export type SentenceNodeConfig = Omit<ISpanNode,
  | `category`
  | `type`
>;

/**
 * A sentence span.
 *
 * A {@link SpanNode} with `category: sentence` and `type: inline`; sentence
 *   markers live within a line and delimit the segmenter's sentence boundaries.
 */
export class SentenceNode extends SpanNode {
  /**
   * Factory for a {@link SentenceNode}.
   *
   * @param config - The span configuration (action, index, language, …).
   * @returns A new {@link SentenceNode} marker.
   */
  static new(config: SentenceNodeConfig) {
    return new SentenceNode({
      category: `sentence` as ISpanNode[`category`],
      ...config,
      type: `inline` as ISpanNode[`type`],
    });
  }
}
