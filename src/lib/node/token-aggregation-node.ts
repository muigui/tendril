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

/**
 * Serialized (plain-object) form of a {@link TokenAggregationNode}, adding the
 *   `category` and computed `word_count` to the base token data.
 *
 * @interface TokenAggregationNodeData
 */
export interface TokenAggregationNodeData extends TokenNodeData {
  // category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  /** The kind of aggregated value (URL, email, phone number, …). */
  category: string;
  /** Total word count across the aggregated tokens. */
  word_count: number;
}

/**
 * A {@link TokenNode} that groups several adjacent tokens which together form a
 *   single semantic value — a URL, email address, phone number, hashtag, etc.
 *
 * Its `value` is *derived* by rendering the inner {@link TokenAggregationNode.tokens | tokens}
 *   (and therefore cannot be set directly), so redaction and other transforms
 *   operate on the original inner tokens while the aggregate preserves the whole.
 */
// @ts-ignore: Ignoring TS2417 because we don't care if this class' `static new(...)`
//               method matches the one in the `TokenNode` class!
export class TokenAggregationNode extends TokenNode {
  // #category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  #category: string;
  #tokens: NodeSet;

  /**
   * Factory for a {@link TokenAggregationNode}.
   *
   * @param config - The aggregation configuration (category plus inner tokens).
   * @returns A new {@link TokenAggregationNode} instance.
   */
  static new(config: ITokenAggregationNode) {
    return new TokenAggregationNode(config);
  }

  /**
   * @param config - The aggregation configuration; `tokens` are wrapped in an
   *   internal, re-indexed {@link NodeSet} and the base token `value` is `""`
   *   (the real value is derived from the tokens).
   */
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

  /** The kind of aggregated value (URL, email, phone number, …). */
  get category() {
    return this.#category;
  }

  /** Character (grapheme) count across the inner tokens. */
  get char_count() {
    return this.#tokens.char_count;
  }

  /** Code-unit length across the inner tokens. */
  get length() {
    return this.#tokens.length;
  }

  /** The aggregated value, derived by rendering the inner tokens. */
  get value() {
    return this.#tokens.render();
  }

  /** The original tokens that make up the aggregated value. */
  get tokens() {
    return this.#tokens;
  }

  /** Total word count across the inner tokens. */
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

  /**
   * Creates a copy of this aggregate (computed fields are recomputed, not copied).
   *
   * @returns A new {@link TokenAggregationNode} instance.
   */
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

  /**
   * Serializes the aggregate — including its inner tokens — to a plain object.
   *
   * @returns A {@link TokenAggregationNodeData} snapshot of this aggregate.
   */
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
