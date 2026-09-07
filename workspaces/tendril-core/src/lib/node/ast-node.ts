import {
  NodeSet,
} from './node-set.ts';
import type {
  INodeSet,
} from './types.ts';

/** Configuration for {@link ASTNode.new} — a {@link INodeSet} without its `nodes` or `type`. */
export type ASTNodeConfig = Omit<INodeSet,
  | `nodes`
  | `type`
>;

/**
 * The root of a parsed document: a {@link NodeSet} whose `type` is fixed to `ast`.
 *
 * An `ASTNode` holds the entire flat stream of span markers and tokens produced
 *   by a parser and is the object callers render, walk, and transform.
 */
export class ASTNode extends NodeSet {
  /**
   * Factory for an {@link ASTNode}.
   *
   * @param config - Optional node configuration (language, direction, …).
   * @returns A new, empty {@link ASTNode}.
   */
  static new(config: ASTNodeConfig = {}) {
    return new ASTNode({
      ...config,
      type: `ast` as INodeSet[`type`],
    });
  }
}
