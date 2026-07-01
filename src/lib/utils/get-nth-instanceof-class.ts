import type {
  Nodes,
  ValidNodes,
} from '../node/types.ts';

export type NodeClass<NODE_CLASS> = abstract new (...args: never[]) => NODE_CLASS;

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
