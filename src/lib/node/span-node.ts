import {
  getCharacterCount,
} from '../utils/index.ts';

import {
  NodeBasis,
} from './node-basis.ts';
import type {
  ENUM_SPAN_NODE_ACTION,
  ENUM_SPAN_NODE_CATEGORY,
  ENUM_SPAN_NODE_TYPE,
  ISpanNode,
} from './types.ts';

/**
 * Serialized (plain-object) form of a {@link SpanNode}, including its computed
 *   `char_count` and `length`.
 *
 * @interface SpanNodeData
 */
export interface SpanNodeData extends ISpanNode {
  /** Character (grapheme) count of the marker's value. */
  char_count: number;
  /** Code-unit length of the marker's value. */
  length: number;
}

/**
 * A boundary marker for a structural span in the flat AST.
 *
 * Rather than nesting, Tendril represents a structure (document, paragraph,
 *   sentence, quote, …) as a matched pair of `SpanNode`s: a `new` marker where it
 *   opens and an `end` marker where it closes, linked by `ref_id`. This lets a
 *   span overlap block/line boundaries — the case a traditional nested tree
 *   cannot represent. Subclasses fix the `category`/`type` for each structure.
 */
export class SpanNode extends NodeBasis implements ISpanNode {
  #action!: ENUM_SPAN_NODE_ACTION;
  #ast_id!: string;
  #ast_index!: number;
  #category!: ENUM_SPAN_NODE_CATEGORY;
  #index?: number;
  #ref_index!: number;
  #type!: ENUM_SPAN_NODE_TYPE;
  #value?: string;

  /**
   * Factory for a {@link SpanNode}.
   *
   * @param config - The span configuration.
   * @returns A new {@link SpanNode} instance.
   */
  static new(config: ISpanNode) {
    return new SpanNode(config);
  }

  /**
   * @param config - The span configuration; `action`, `category`, and `type` are
   *   required, the remaining fields are applied only when provided.
   */
  constructor({
    action,
    ast_id,
    ast_index,
    category,
    index,
    ref_index,
    type,
    value,
    ...basis
  }: ISpanNode) {
    super(basis);

    this.action = action;
    this.category = category;
    this.type = type;

    if (typeof ast_id !== `undefined`) {
      this.ast_id = ast_id;
    }

    if (typeof ast_index !== `undefined`) {
      this.ast_index = ast_index;
    }

    if (typeof index !== `undefined`) {
      this.index = index;
    }

    if (typeof ref_index !== `undefined`) {
      this.ref_index = ref_index;
    }

    if (typeof value !== `undefined`) {
      this.value = value;
    }
  }

  /** Whether this marker opens (`new`) or closes (`end`) the span. */
  get action() {
    return this.#action;
  }

  /** Document-wide reference id (paired with {@link SpanNode.ast_index | ast_index}). */
  get ast_id() {
    return this.#ast_id;
  }

  /** Document-wide reference index. */
  get ast_index() {
    return this.#ast_index;
  }

  /** The kind of structure this span represents (e.g. `paragraph`, `quote`). */
  get category() {
    return this.#category;
  }

  /** Character (grapheme) count of the marker's value; `0` when it has none. */
  get char_count() {
    if (typeof this.value !== `string` || this.value.length === 0) {
      return 0;
    }

    const lang = this.lang
      ?? this.$ctx?.lang?.id
      ?? `en`;

    return getCharacterCount(lang, this.value);
  }

  /** Character index of the marker within the document. */
  get index() {
    return this.#index;
  }

  /** `true` when this marker closes the span. */
  get isEnd() {
    return this.action === `end`;
  }

  /** `true` when this marker opens the span. */
  get isNew() {
    return this.action === `new`;
  }

  /** Code-unit length of the marker's value; `0` when it has none. */
  get length() {
    return this.#value?.length ?? 0;
  }

  /** Per-chunk reference index (paired with `ref_id`). */
  get ref_index() {
    return this.#ref_index;
  }

  /** Structural class of the span (`block`, `inline`, or `unbound`). */
  get type() {
    return this.#type;
  }

  /** Combined `type:category` identifier (e.g. `block:paragraph`). */
  get type_id() {
    return `${this.type}:${this.category}`;
  }

  /** Literal text carried by the marker (e.g. the quote or line-break glyph). */
  get value() {
    return this.#value;
  }

  /** Always `0` — a span marker carries no words. */
  get word_count() {
    return 0;
  }

  set action(action: ENUM_SPAN_NODE_ACTION) {
    this.#action = action;
  }

  set ast_id(id: string) {
    this.#ast_id = id;
  }

  set ast_index(index: number) {
    this.#ast_index = index;
  }

  set category(category: ENUM_SPAN_NODE_CATEGORY) {
    this.#category = category;
  }

  set index(index: number | undefined) {
    this.#index = index;
  }

  set ref_index(index: number) {
    this.#ref_index = index;
  }

  set type(type: ENUM_SPAN_NODE_TYPE) {
    this.#type = type;
  }

  set value(value: string | undefined) {
    this.#value = value;
  }

  /**
   * Creates a copy of this span marker (computed fields are recomputed, not copied).
   *
   * @returns A new {@link SpanNode} (or subclass) instance.
   */
  clone(): SpanNode {
    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      char_count,
      length,
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
   * Produces the matching `end` marker for this (opening) span.
   *
   * Clones this node and flips its action to `end`, optionally overriding the
   *   value — e.g. so a closing quote can carry the closing glyph.
   *
   * @param value - Optional value for the `end` marker; defaults to this node's value.
   * @returns A new `end`-action {@link SpanNode}.
   */
  end(value?: string) {
    const end = this.clone();

    end.action = `end`;

    if (typeof value !== `undefined`) {
      end.value = value;
    }

    return end;
  }

  /**
   * Renders the marker back to text.
   *
   * @returns The marker's value, or an empty string when it has none.
   */
  render() {
    return this.value ?? ``;
  }

  /**
   * Serializes the span marker to a plain object.
   *
   * @returns A {@link SpanNodeData} snapshot of this marker.
   */
  toJSON() {
    const basis = super.toJSON();
    const {
      action,
      ast_id,
      ast_index,
      category,
      char_count,
      index,
      length,
      type,
      value,
    } = this;

    return {
      action,
      ast_id,
      ast_index,
      category,
      char_count,
      ...basis,
      index,
      length,
      type,
      value,
    } as SpanNodeData;
  }

  [Symbol.toPrimitive]() {
    return this.render();
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilNode(Span)`;
  // }
}
