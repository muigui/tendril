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

/**
 * Serialized (plain-object) form of a {@link NodeSet}, including its computed
 *   statistics and recursively-serialized child nodes.
 *
 * @interface NodeSetData
 */
export interface NodeSetData extends INodeSet {
  /** Total character (grapheme) count across all descendants. */
  char_count: number;
  /** Character index one past the last node in the set. */
  end_index: number;
  /** Total code-unit length across all descendants. */
  length: number;
  /** The serialized child nodes. */
  nodes: NodeSetNodesData;
  /** Number of immediate child nodes. */
  size: number;
  /** Character index of the first node in the set. */
  start_index: number;
  /** Total word count across all descendants. */
  word_count: number;
}

/**
 * Human-friendly roll-up of a node set's size statistics.
 *
 * @interface NodeSetStatTotals
 */
export interface NodeSetStatTotals {
  /**
   * The number of characters in the entire node set — e.g. emoji characters are
   *   counted as a single character — including all its descendants.
   *
   * This is the same as calling `NodeSet#char_count`.
   */
  characters: number;
  /**
   * The number of child nodes this node set contains.
   *
   * This is the same as calling `NodeSet#size`.
   */
  child_nodes: number;
  /**
   * The number of code units in the entire node set — e.g. emoji characters have
   *   all their code units counted individually — including all its descendants.
   *
   * This is the same as calling `NodeSet#length`.
   */
  code_units: number;
  /**
   * The number of words in the entire node set — i.e. only `TokenNode` instances
   *   with `type: word` are counted — including all its descendants.
   *
   * This is the same as calling `NodeSet#word_count`.
   */
  words: number;
}

// export type NodeSetConfig = Omit<INodeSet, `nodes`>;

/** The serialized child-node array of a {@link NodeSetData}. */
export type NodeSetNodesData = Array<
  | NodeSetData
  | SpanNodeData
  | TokenNodeData
>;

/**
 * An ordered set of nodes, and the base class for the flat AST ({@link ASTNode})
 *   and a {@link TokenAggregationNode}'s inner tokens.
 *
 * Beyond holding child {@link Nodes}, it exposes aggregate statistics
 *   (`char_count`, `length`, `size`, `word_count`), tree-walking
 *   ({@link NodeSet.walk | walk}), (de)serialization, re-indexing, rendering back
 *   to text, and lookups for the nth span/token.
 */
export class NodeSet extends NodeBasis implements INodeSet {
  #endIndex!: number;
  #index!: number;
  #nodes!: Nodes;
  #startIndex!: number;
  #type!: string;

  /**
   * Adds each item in `items` to `nodeSet` via {@link NodeSet.loadItem | loadItem}.
   *
   * @param nodeSet - The set to load nodes into.
   * @param items - Node instances or serialized node shapes to add.
   * @returns The same `nodeSet`, for chaining.
   */
  static load(nodeSet: NodeSet, items: INodes | Nodes) {
    if (items?.length) {
      for (const node of items) {
        this.loadItem(nodeSet, node);
      }
    }

    return nodeSet;
  }

  /**
   * Adds a single node to `nodeSet`, constructing the right node class when the
   *   item is a serialized (plain-object) shape.
   *
   * Node instances are added as-is; plain objects are dispatched to
   *   {@link TokenAggregationNode}, {@link SpanNode}, {@link TokenNode}, or a
   *   nested {@link NodeSet} based on their shape.
   *
   * @param nodeSet - The set to add the node to.
   * @param node - A node instance or a serialized node shape.
   * @returns The same `nodeSet`, for chaining.
   */
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

  /**
   * Factory for a {@link NodeSet}.
   *
   * @param config - The node-set configuration (including any initial `nodes`).
   * @returns A new {@link NodeSet} instance.
   */
  static new(config: INodeSet) {
    return new NodeSet(config);
  }

  /**
   * @param config - Node-set configuration.
   * @param config.nodes - Initial child nodes to load (defaults to none).
   * @param config.type - Label describing the kind of set.
   */
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

  /** Total character (grapheme) count of every node value in this set. */
  get char_count() {
    let char_count = 0;

    this.walk<number>(node => char_count += node.char_count);

    return char_count;
  }

  /** `true` when the set contains no nodes. */
  get empty() {
    return this.size === 0;
  }

  /** Character index one past the last node, set by {@link NodeSet.reindex | reindex}. */
  get endIndex() {
    return this.#endIndex;
  }

  /** The first node in this set, or `null` when empty. */
  get first() {
    return this.nodes.at(0) ?? null;
  }

  /** The last node in this set, or `null` when empty. */
  get last() {
    return this.nodes.at(-1) ?? null;
  }

  /** Total code-unit length of every node value in this set. */
  get length() {
    let length = 0;

    this.walk<number>(node => length += node.length);

    return length;
  }

  /** The immediate child nodes of this set. */
  get nodes() {
    return this.#nodes;
  }

  /** The number of immediate child nodes in this set. */
  get size() {
    return this.nodes.length;
  }

  /** Character index of the first node, set by {@link NodeSet.reindex | reindex}. */
  get startIndex() {
    return this.#startIndex;
  }

  /** A human-friendly roll-up of this set's size statistics. */
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

  /** A label describing the kind of set (e.g. `ast`). */
  get type() {
    return this.#type;
  }

  /** Total word count of every node value in this set. */
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

  /**
   * Appends a node to the end of the set.
   *
   * @param node - The node to append.
   * @returns This set, for chaining.
   */
  add(node: ValidNodes) {
    this.nodes.push(node);

    return this;
  }

  /**
   * Returns the child node at an absolute `offset` (negative counts from the end).
   *
   * @typeParam NodeClass - The expected node type of the result.
   * @param offset - Index into the child nodes; negatives count from the end.
   * @returns The node at `offset`, or `null` if out of range.
   */
  at<NodeClass>(offset = 0) {
    return this.nodes.at(offset) as NodeClass ?? null;
  }

  /**
   * Removes all child nodes from the set.
   *
   * @returns This set, for chaining.
   */
  clear() {
    this.nodes.length = 0;

    return this;
  }

  /**
   * Creates a copy of this set.
   *
   * @param shallow - When `true`, copies only the set's own properties (no child
   *   nodes); when `false` (the default), also deep-clones every child node.
   * @returns A new {@link NodeSet} (or subclass) instance.
   */
  clone(shallow = false): NodeSet {
    // @ts-ignore: Ignore TS2339. It does exist. Oh, yes. It does.
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

  /**
   * Re-assigns each node's character `index` by walking the set in order.
   *
   * Also records the resulting {@link NodeSet.startIndex | startIndex} and
   *   {@link NodeSet.endIndex | endIndex}.
   *
   * @param index - Character index to start counting from (defaults to `0`).
   * @returns This set, for chaining.
   */
  reindex(index = 0) {
    this.#startIndex = index;

    this.walk((node) => {
      node.index = index;

      index += node.length;
    });

    this.#endIndex = index;

    return this;
  }

  /**
   * Renders the set back into text by concatenating every node's rendered value.
   *
   * @returns The reconstructed text for this set.
   */
  render() {
    const parts: string[] = [];

    this.walk(node =>
      parts.push(node.render()));

    return parts.join(``);
  }

  /**
   * Finds the nth {@link SpanNode} (of a given class) among the immediate children.
   *
   * @param offset - Which match to return; negative values count from the end.
   * @param NodeClass - The span subclass to match (defaults to {@link SpanNode}).
   * @returns The matching span, or `null` if there is none.
   */
  spanAt(offset = 0, NodeClass: typeof SpanNode = SpanNode) {
    const node = getNthInstanceOfClass(this.nodes, NodeClass, offset);

    return node
      ? node as SpanNode
      : null;
  }

  /**
   * Serializes the set (and, unless `shallow`, its child nodes) to a plain object.
   *
   * @param shallow - When `true`, omits the serialized child `nodes`.
   * @returns A {@link NodeSetData} snapshot of this set.
   */
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

  /**
   * Finds the nth {@link TokenNode} among the immediate children.
   *
   * @param offset - Which match to return; negative values count from the end.
   * @returns The matching token, or `null` if there is none.
   */
  tokenAt(offset = 0) {
    const node = getNthInstanceOfClass(this.nodes, TokenNode, offset);

    return node
      ? node as TokenNode
      : null;
  }

  /**
   * Rewrites every line-break value in the set to use the given line separator.
   *
   * Applies to `paragraph` {@link SpanNode}s and `new-line` {@link TokenNode}s,
   *   so a document parsed with one line ending can be re-emitted with another.
   *
   * @param lineSeparator - The line separator to apply.
   * @returns This set, for chaining.
   */
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

  /**
   * Depth-first walks every leaf node in the set, calling `exec` on each.
   *
   * Nested {@link NodeSet}s are recursed into, so `exec` only ever receives leaf
   *   {@link SpanNode}/{@link TokenNode} instances.
   *
   * @typeParam T - The (ignored) return type of `exec`.
   * @param exec - Callback invoked for every leaf node, in document order.
   */
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

  /** Iterates the immediate child nodes in order. */
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
}
