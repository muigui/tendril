import {
  appendFile,
  writeFile,
} from 'node:fs/promises';

import {
  type INodeSet,
  type ISpanNode,
  type ITokenAggregationNode,
  type ITokenNode,
  type IValidNodes,
  type ValidNodes,

  NodeBasis,
  NodeSet,
  SpanNode,
  TokenAggregationNode,
  TokenNode,
} from '../node/index.ts';
import {
  isTokenType,
} from '../utils/index.ts';

// const MAX_NODES_PER_PUSH = 15_000;
// const MAX_NODES_PER_PUSH = Math.pow(2, 14);
const MAX_NODES_PER_PUSH = 2 ** 16;

export class NodeArray<T = ValidNodes> extends Array {
  static toNode(node: IValidNodes) {
    if (node instanceof NodeBasis) {
      return node;
    }
    else if (Reflect.has(node, `category`)) {
      if (Reflect.has(node, `tokens`)) {
        return TokenAggregationNode.new(node as unknown as ITokenAggregationNode);
      }
      else {
        return SpanNode.new(node as ISpanNode);
      }
    }
    else if (Reflect.has(node, `nodes`)) {
      return NodeSet.new(node as INodeSet);
    }
    else if (Reflect.has(node, `index`) && Reflect.has(node, `value`) && isTokenType(node.type)) {
      return TokenNode.new(node as ITokenNode);
    }

    return null;
  }

  get empty() {
    return this.length === 0;
  }

  get first(): T | undefined {
    return this[0];
  }

  get firstSpan(): SpanNode | undefined {
    return this.find(node => node instanceof SpanNode);
  }

  get firstToken(): TokenNode | undefined {
    return this.find(node => node instanceof TokenNode);
  }

  get last(): T | undefined {
    return this[this.length - 1];
  }

  get lastSpan(): SpanNode | undefined {
    return this.findLast(node => node instanceof SpanNode);
  }

  get lastToken(): TokenNode | undefined {
    return this.findLast(node => node instanceof TokenNode);
  }

  get size() {
    return this.reduce((acc, node) => acc + node.length, 0);
  }

  add(item: T) {
    this.push(item);

    return this;
  }

  // appendTo(stream: Writable, lineSeparator: ENUM_LINE_SEPARATOR = LINE_SEPARATOR.LF) {
  //   for (const node of this) {
  //     stream.write(node.serialize(lineSeparator), `utf8`);
  //   }
  //
  //   return this;
  // }

  clear() {
    this.length = 0;

    return this;
  }

  clone(shallow = false) {
    const clone = new NodeArray<T>();

    if (!shallow) {
      for (const node of this) {
        clone.add(node.clone());
      }
    }

    return clone;
  }

  async dump(file: string, append = false) {
    if (!append) {
      await writeFile(file, ``, `utf8`);
    }

    for (const node of this) {
      await appendFile(file, node.serialize(), `utf8`);
    }

    return this;
  }

  // load(nodes: NodeArray<T> | T | T[], append = false) {
  load({
    append = false,
    nodes,
    reindex = true,
  }: {
    append?: boolean;
    nodes: NodeArray<T> | T | T[];
    reindex?: boolean | number;
  }) {
    if (append !== true) {
      this.clear();
    }

    if (Array.isArray(nodes)) {
      if (nodes.length < MAX_NODES_PER_PUSH * 2) {
        this.push(...nodes);
      }
      else {
        const nodesLength = nodes.length;

        let i = 0;
        let j = MAX_NODES_PER_PUSH;

        do {
          this.push(...nodes.slice(i, j));

          i = j;
          j += MAX_NODES_PER_PUSH;
        } while (i < nodesLength);
      }
    }
    else {
      this.push(nodes);
    }

    return typeof reindex === `number` || reindex
      ? this.reindex(reindex === true
        ? 0
        : reindex)
      : this;
  }

  reindex(index = 0) {
    for (const node of this) {
      node.index = index;

      index += node.length;
    }

    return this;
  }

  render() {
    return this
      .map(node => node.render())
      .join(``);
  }

  toArray() {
    return Array.from(this.toJSON());
  }

  toJSON() {
    return this.map(node => node.toJSON());
  }

  get [Symbol.toStringTag]() {
    return `TendrilNodeArray`;
  }
}
