import type {
  Nodes,
  ValidNodes,
} from '../node/types.ts';

/** A constructor reference used to `instanceof`-test nodes (may be abstract). */
export type NodeClass<NODE_CLASS> = abstract new (...args: never[]) => NODE_CLASS;

/**
 * Finds the nth node in `items` that is an instance of `Node`.
 *
 * A non-negative `offset` counts matches from the start; a negative `offset`
 *   counts them from the end.
 *
 * @typeParam NODE_CLASS - The node class being matched.
 * @param items - The nodes to search.
 * @param Node - The class to match instances of.
 * @param offset - Which match to return (negative counts from the end).
 * @returns The matching node, or `undefined` when there is none.
 */
export function getNthInstanceOfClass<NODE_CLASS extends ValidNodes>(
  items: Nodes,
  Node: NodeClass<NODE_CLASS>,
  offset = 0,
): undefined | ValidNodes {
  const find = offset >= 0
    ? getNthFirstInstanceOfClass
    : getNthLastInstanceOfClass;

  return find<NODE_CLASS>(items, Node, offset) as NODE_CLASS;
}

/**
 * Finds the nth matching node counting forward from the start.
 *
 * @typeParam NODE_CLASS - The node class being matched.
 * @param items - The nodes to search.
 * @param Node - The class to match instances of.
 * @param offset - The zero-based match index to return.
 * @returns The matching node, or `undefined` when there are too few matches.
 */
function getNthFirstInstanceOfClass<NODE_CLASS extends ValidNodes>(
  items: Nodes,
  Node: NodeClass<NODE_CLASS>,
  offset = 0,
): undefined | ValidNodes {
  let index = -1;

  return items.find((node) => {
    if (node instanceof Node) {
      return ++index === offset;
    }
  });
}

/**
 * Finds the nth matching node counting backward from the end.
 *
 * @typeParam NODE_CLASS - The node class being matched.
 * @param items - The nodes to search.
 * @param Node - The class to match instances of.
 * @param offset - The negative match index to return (`-1` is the last match).
 * @returns The matching node, or `undefined` when there are too few matches.
 */
function getNthLastInstanceOfClass<NODE_CLASS extends ValidNodes>(
  items: Nodes,
  Node: NodeClass<NODE_CLASS>,
  offset = 0,
): undefined | ValidNodes {
  const size = items.length;

  let index = size;

  return items.findLast((node) => {
    if (node instanceof Node) {
      return --index - size === offset;
    }
  });
}
