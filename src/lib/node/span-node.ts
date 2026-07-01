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

export interface SpanNodeData extends ISpanNode {
  char_count: number;
  length: number;
}

export class SpanNode extends NodeBasis implements ISpanNode {
  #action!: ENUM_SPAN_NODE_ACTION;
  #ast_id!: string;
  #ast_index!: number;
  #category!: ENUM_SPAN_NODE_CATEGORY;
  #index?: number;
  #ref_index!: number;
  #type!: ENUM_SPAN_NODE_TYPE;
  #value?: string;

  static new(config: ISpanNode) {
    return new SpanNode(config);
  }

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

  get action() {
    return this.#action;
  }

  get ast_id() {
    return this.#ast_id;
  }

  get ast_index() {
    return this.#ast_index;
  }

  get category() {
    return this.#category;
  }

  get char_count() {
    if (typeof this.value !== `string` || this.value.length === 0) {
      return 0;
    }

    const lang = this.lang
      ?? this.$ctx?.lang?.id
      ?? `en`;

    return getCharacterCount(lang, this.value);
  }

  get index() {
    return this.#index;
  }

  get isEnd() {
    return this.action === `end`;
  }

  get isNew() {
    return this.action === `new`;
  }

  get length() {
    return this.#value?.length ?? 0;
  }

  get ref_index() {
    return this.#ref_index;
  }

  get type() {
    return this.#type;
  }

  get type_id() {
    return `${this.type}:${this.category}`;
  }

  get value() {
    return this.#value;
  }

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

  end(value?: string) {
    const end = this.clone();

    end.action = `end`;

    if (typeof value !== `undefined`) {
      end.value = value;
    }

    return end;
  }

  render() {
    return this.value ?? ``;
  }

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
