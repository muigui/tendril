import type {
  ASTContext,
} from '../context/index.ts';
import type {
  Segment,
  WordSegment,
} from '../i18n/types.ts';
import {
  getCharacterCount,
  getNodeTypeForSegment,
} from '../utils/index.ts';

import {
  NodeBasis,
} from './node-basis.ts';
import {
  type ENUM_TOKEN_NODE_TYPE,
  type ITokenNode,

  TOKEN_NODE_TYPE,
} from './types.ts';

// If we use this array directly, we get a `TS2345` error:
//     Argument of type `ENUM_TOKEN_NODE_TYPE` is not assignable
//       to parameter of type 'new-line' | 'whitespace'
//     Type 'emoji' is not assignable to type 'new-line' | 'whitespace'
// Why?
// Because TypeScript does not like the values in this array,
//   and the `this.type` in the `includes` (both below) all being treated as strings.
// So, we need to declare this array as a `string[]`, or face its wrath!
// const WHITESPACE_TYPES: string[] = [
//   TOKEN_NODE_TYPE.NEW_LINE,
//   TOKEN_NODE_TYPE.WHITESPACE,
// ];

export interface TokenNodeData extends ITokenNode {
  char_count: number;
  length: number;
}

export class TokenNode extends NodeBasis implements ITokenNode {
  #index?: number;
  #type!: ENUM_TOKEN_NODE_TYPE;
  #value!: string;

  static fromSegment(segment: Segment | WordSegment, ctx?: ASTContext) {
    const {
      index,
      segment: value,
    } = segment;

    return TokenNode.new({
      ...(ctx && {
        $ctx: ctx,
        dir: ctx.lang.dir,
        lang: ctx.lang.id,
      }),
      index,
      type: getNodeTypeForSegment(segment),
      value,
    });
  }

  static new(config: ITokenNode) {
    return new TokenNode(config);
  }

  static newLine(ctx: ASTContext) {
    return TokenNode.fromSegment({
      index: -1,
      isWordLike: false,
      segment: ctx.lang.lineSeparator,
    }, ctx);
  }

  constructor({
    index,
    type,
    value,
    ...basis
  }: ITokenNode) {
    super(basis);

    if (typeof index !== `undefined`) {
      this.index = index;
    }

    this.type = type;
    this.value = value;
  }

  get char_count() {
    if (this.type === TOKEN_NODE_TYPE.WHITESPACE) {
      return this.length;
    }

    const lang = this.lang
      ?? this.$ctx?.lang.id
      ?? `en`;

    return getCharacterCount(lang, this.value);
  }

  get index() {
    return this.#index;
  }

  get length() {
    return this.value.length;
  }

  get type() {
    return this.#type;
  }

  get value() {
    return this.#value;
  }

  get word_count(): number {
    return this.type === TOKEN_NODE_TYPE.WORD
      ? 1
      : 0;
  }

  set index(index: number | undefined) {
    this.#index = index;
  }

  set type(type: ENUM_TOKEN_NODE_TYPE) {
    this.#type = type;
  }

  set value(value: string) {
    this.#value = value;
  }

  clone(): TokenNode {
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

  render() {
    return this.value;
  }

  toJSON() {
    const basis = super.toJSON();
    const {
      char_count,
      index,
      length,
      type,
      value,
    } = this;

    return {
      ...basis,
      char_count,
      index,
      length,
      type,
      value,
    } as TokenNodeData;
  }

  [Symbol.toPrimitive]() {
    return this.render();
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilNode(Token)`;
  // }
}
