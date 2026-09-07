import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

/** Configuration for {@link DocumentNode.new} — an {@link ISpanNode} without its fixed `category`/`type`. */
export type DocumentNodeConfig = Omit<ISpanNode,
  | `category`
  | `type`
>;

/**
 * The outermost span of a parsed document.
 *
 * A {@link SpanNode} with `category: document` and `type: block`; its `new`/`end`
 *   markers wrap the entire node stream.
 */
export class DocumentNode extends SpanNode {
  /**
   * Factory for a {@link DocumentNode}.
   *
   * @param config - The span configuration (action, index, language, …).
   * @returns A new {@link DocumentNode} marker.
   */
  static new(config: DocumentNodeConfig) {
    return new DocumentNode({
      category: `document` as ISpanNode[`category`],
      ...config,
      type: `block` as ISpanNode[`type`],
    });
  }
}
