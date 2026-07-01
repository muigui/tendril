import {
  NodeSet,
} from './node-set.ts';
import {
  type TokenNodeData,

  TokenNode,
} from './token-node.ts';
import {
  type ITokenAggregationNode,
  type ITokenNode,

  TOKEN_NODE_TYPE,
} from './types.ts';

export interface TokenAggregationNodeData extends TokenNodeData {
  // category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  category: string;
  word_count: number;
}

// @ts-ignore: Ignoring TS2417 because we don't care if this class' `static new(...)`
//               method matches the one in the `TokenNode` class!
export class TokenAggregationNode extends TokenNode {
  // #category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  #category: string;
  #tokens: NodeSet;

  static new(config: ITokenAggregationNode) {
    return new TokenAggregationNode(config);
  }

  constructor({
    category,
    tokens,
    ...config
  }: ITokenAggregationNode) {
    super({
      ...config,
      type: TOKEN_NODE_TYPE.WORD,
      value: ``,
    } as ITokenNode);

    this.#category = category;

    this.#tokens = NodeSet.new({
      nodes: tokens,
      type: `token-node-aggregate`,
    });

    this.#tokens.reindex();
  }

  get category() {
    return this.#category;
  }

  get char_count() {
    return this.#tokens.char_count;
  }

  get length() {
    return this.#tokens.length;
  }

  get value() {
    return this.#tokens.render();
  }

  get tokens() {
    return this.#tokens;
  }

  get word_count() {
    return this.#tokens.word_count;
  }

  set category(category: string) {
    this.#category = category;
  }

  set value(value: string) {
    // The parent `TokenNode` constructor assigns `value` (always `""` for an
    //   aggregate, whose real value is derived from its `tokens`). Only warn on
    //   a genuine external attempt to set a non-empty value.
    if (value !== ``) {
      console.error(`TokenAggregationNodeSetValueError. Cannot directly set the value of this node type.`);
    }
  }

  clone(): TokenAggregationNode {
    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      char_count,
      length,
      word_count,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...data
    } = this.toJSON();
    // @ts-ignore: Ignore TS2339. Why? Because in this particular instance —
    //                            TS does not know what the hell it's talking about!
    const node = this.constructor.new(data);

    node.$ctx = this.$ctx;

    return node;
  }

  toJSON() {
    const {
      category,
      word_count,
    } = this;
    const data = super.toJSON();
    const {
      nodes: tokens,
    } = this.tokens.toJSON();

    return {
      category,
      ...data,
      tokens,
      word_count,
    } as TokenAggregationNodeData;
  }
}
