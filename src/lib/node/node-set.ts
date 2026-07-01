/* eslint-disable no-return-assign */
import type {
  ENUM_LINE_SEPARATOR,
} from '../i18n/index.ts';
import {
  getNthInstanceOfClass,
} from '../utils/index.ts';

import {
  NodeBasis,
} from './node-basis.ts';
import {
  type SpanNodeData,

  SpanNode,
} from './span-node.ts';
import {
  TokenAggregationNode,
} from './token-aggregation-node.ts';
import {
  type TokenNodeData,

  TokenNode,
} from './token-node.ts';
import {
  TOKEN_NODE_TYPE,
} from './types.ts';
import type {
  INodes,
  INodeSet,
  ISpanNode,
  ITokenAggregationNode,
  ITokenNode,
  IValidNodes,
  Nodes,
  ValidNodes,
} from './types.ts';

export interface NodeSetData extends INodeSet {
  char_count: number;
  end_index: number;
  length: number;
  nodes: NodeSetNodesData;
  size: number;
  start_index: number;
  word_count: number;
}

export interface NodeSetStatTotals {
  // The number of characters in the entire node set
  //   — e.g. emoji characters are counted as a single character
  //   — including all its descendants.
  // This is the same as calling `NodeSet#char_count`.
  characters: number;
  // The number of child nodes this node set contains.
  // This is the same as calling `NodeSet#size`.
  child_nodes: number;
  // The number of code units in the entire node set
  //   — e.g. emoji characters have all their code units counted individually
  //   — including all its descendants.
  // This is the same as calling `NodeSet#length`.
  code_units: number;
  // The number of words in the entire node set
  //   — i.e. only `TokenNode` instances with `type: word` are counted.
  //   — including all its descendants.
  // This is the same as calling `NodeSet#word_count`.
  words: number;
}

// export type NodeSetConfig = Omit<INodeSet, `nodes`>;
export type NodeSetNodesData = Array<
  | NodeSetData
  | SpanNodeData
  | TokenNodeData
>;

export class NodeSet extends NodeBasis implements INodeSet {
  #endIndex!: number;
  #index!: number;
  #nodes!: Nodes;
  #startIndex!: number;
  #type!: string;

  static load(nodeSet: NodeSet, items: INodes | Nodes) {
    if (items?.length) {
      for (const node of items) {
        this.loadItem(nodeSet, node);
      }
    }

    return nodeSet;
  }

  static loadItem(nodeSet: NodeSet, node: IValidNodes | ValidNodes) {
    if (node instanceof NodeBasis) {
      nodeSet.add(node);
    }
    else if (Reflect.has(node, `category`)) {
      if (Reflect.has(node, `tokens`)) {
        nodeSet.add(TokenAggregationNode.new(node as unknown as ITokenAggregationNode));
      }
      else {
        nodeSet.add(SpanNode.new(node as ISpanNode));
      }
    }
    else if (Reflect.has(node, `index`) && Reflect.has(node, `value`)) {
      nodeSet.add(TokenNode.new(node as ITokenNode));
    }
    else {
      nodeSet.add(NodeSet.new(node as INodeSet));
    }

    return nodeSet;
  }

  static new(config: INodeSet) {
    return new NodeSet(config);
  }

  constructor({
    nodes = [],
    type,
    ...basis
  }: INodeSet) {
    super(basis);

    this.nodes = [];
    this.type = type;

    NodeSet.load(this, nodes);
  }

  // Returns the total `char_count` of all node values in this set
  get char_count() {
    let char_count = 0;

    this.walk<number>(node => char_count += node.char_count);

    return char_count;
  }

  get empty() {
    return this.size === 0;
  }

  get endIndex() {
    return this.#endIndex;
  }

  // Returns the current `first` node in this set
  get first() {
    return this.nodes.at(0) ?? null;
  }

  // Returns the current `last` node in this set
  get last() {
    return this.nodes.at(-1) ?? null;
  }

  // Returns the total `length` of all node values in this set
  get length() {
    let length = 0;

    this.walk<number>(node => length += node.length);

    return length;
  }

  get nodes() {
    return this.#nodes;
  }

  // The number of nodes in this set
  get size() {
    return this.nodes.length;
  }

  get startIndex() {
    return this.#startIndex;
  }

  get total(): NodeSetStatTotals {
    const {
      char_count: characters,
      length: code_units,
      size: child_nodes,
      word_count: words,
    } = this;

    return {
      characters,
      child_nodes,
      code_units,
      words,
    };
  }

  get type() {
    return this.#type;
  }

  get word_count() {
    let word_count = 0;

    this.walk<number>(node => word_count += node.word_count);

    return word_count;
  }

  set nodes(nodes: Nodes) {
    this.#nodes = nodes;
  }

  set type(type: string) {
    this.#type = type;
  }

  add(node: ValidNodes) {
    this.nodes.push(node);

    return this;
  }

  at<NodeClass>(offset = 0) {
    return this.nodes.at(offset) as NodeClass ?? null;
  }

  clear() {
    this.nodes.length = 0;

    return this;
  }

  clone(shallow = false): NodeSet {
    // @ts-ignore: Ignore TS2339. Why? Because in this particular instance —
    //                            TS does not know what the hell it's talking about!
    const nodeSet: NodeSet = this.constructor.new(this.toJSON(true));

    nodeSet.$ctx = this.$ctx;

    if (!shallow) {
      const {
        nodes,
      } = this;

      for (const node of nodes) {
        nodeSet.add(node.clone());
      }
    }

    return nodeSet;
  }

  reindex(index = 0) {
    this.#startIndex = index;

    this.walk((node) => {
      node.index = index;

      index += node.length;
    });

    this.#endIndex = index;

    return this;
  }

  render() {
    const parts: string[] = [];

    this.walk(node =>
      parts.push(node.render()));

    return parts.join(``);
  }

  spanAt(offset = 0, NodeClass: typeof SpanNode = SpanNode) {
    const node = getNthInstanceOfClass(this.nodes, NodeClass, offset);

    return node
      ? node as SpanNode
      : null;
  }

  toJSON(shallow = false) {
    const basis = super.toJSON();
    const {
      char_count,
      endIndex: end_index,
      length,
      nodes,
      size,
      startIndex: start_index,
      type,
      word_count,
    } = this;
    const data: NodeSetData = {
      ...basis,
      char_count,
      end_index,
      length,
      nodes: [],
      size,
      start_index,
      type,
      word_count,
    };

    if (!shallow) {
      for (const node of nodes) {
        data.nodes.push(node.toJSON());
      }
    }

    return data;
  }

  tokenAt(offset = 0) {
    const node = getNthInstanceOfClass(this.nodes, TokenNode, offset);

    return node
      ? node as TokenNode
      : null;
  }

  updateNewLines(lineSeparator: ENUM_LINE_SEPARATOR) {
    this.walk((node) => {
      if (node instanceof SpanNode) {
        if (node.category === `paragraph` && node.value !== `` && node.value !== undefined) {
          node.value = lineSeparator;
        }
      }
      else if (node instanceof TokenNode) {
        if (node.type === TOKEN_NODE_TYPE.NEW_LINE) {
          node.value = lineSeparator;
        }
      }
    });

    return this;
  }

  walk<T = void>(exec: (node: SpanNode | TokenNode) => T) {
    for (const node of this) {
      if (node instanceof NodeSet) {
        node.walk(exec);
      }
      else {
        exec(node);
      }
    }
  }

  * [Symbol.iterator]() {
    const len = this.nodes.length;

    this.#index = -1;

    while (++this.#index < len) {
      yield this.nodes[this.#index];
    }
  }

  [Symbol.toPrimitive]() {
    return this.render();
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilNode(Set)`;
  // }
}
