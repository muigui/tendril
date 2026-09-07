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

/**
 * Serialized (plain-object) form of a {@link TokenNode}, including its computed
 *   `char_count` and `length`.
 *
 * @interface TokenNodeData
 */
export interface TokenNodeData extends ITokenNode {
  /** Character (grapheme) count of the token's value. */
  char_count: number;
  /** Code-unit length of the token's value. */
  length: number;
}

/**
 * A leaf node carrying a run of literal text — a word, whitespace, punctuation,
 *   emoji, or newline.
 *
 * Tokens are the content of the flat AST: everything between the span markers.
 *   Character counting is grapheme-aware, so a multi-code-unit emoji counts as a
 *   single character even though its `length` (code units) is larger.
 */
export class TokenNode extends NodeBasis implements ITokenNode {
  #index?: number;
  #type!: ENUM_TOKEN_NODE_TYPE;
  #value!: string;

  /**
   * Builds a {@link TokenNode} from a segmenter {@link Segment}.
   *
   * The token's `type` is derived from the segment (word, whitespace, emoji, …);
   *   when a context is supplied, the token also inherits its language and
   *   direction and is linked back to that context.
   *
   * @param segment - The segment to build a token from.
   * @param ctx - Optional parsing context supplying language/direction.
   * @returns A new {@link TokenNode}.
   */
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

  /**
   * Factory for a {@link TokenNode}.
   *
   * @param config - The token configuration.
   * @returns A new {@link TokenNode} instance.
   */
  static new(config: ITokenNode) {
    return new TokenNode(config);
  }

  /**
   * Builds a `new-line` token carrying the context language's line separator.
   *
   * @param ctx - The parsing context supplying the line separator and language.
   * @returns A new whitespace/newline {@link TokenNode}.
   */
  static newLine(ctx: ASTContext) {
    return TokenNode.fromSegment({
      index: -1,
      isWordLike: false,
      segment: ctx.lang.lineSeparator,
    }, ctx);
  }

  /**
   * @param config - The token configuration; `type` and `value` are required and
   *   `index` is applied only when provided.
   */
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

  /**
   * Character (grapheme) count of the token's value.
   *
   * Whitespace short-circuits to `length`; everything else is counted with a
   *   grapheme segmenter so emoji and other clusters count as one character.
   */
  get char_count() {
    if (this.type === TOKEN_NODE_TYPE.WHITESPACE) {
      return this.length;
    }

    const lang = this.lang
      ?? this.$ctx?.lang.id
      ?? `en`;

    return getCharacterCount(lang, this.value);
  }

  /** Character index of the token within the document. */
  get index() {
    return this.#index;
  }

  /** Code-unit length of the token's value. */
  get length() {
    return this.value.length;
  }

  /** The token's classification (word, whitespace, punctuation, emoji, newline). */
  get type() {
    return this.#type;
  }

  /** The literal text of the token. */
  get value() {
    return this.#value;
  }

  /** `1` when the token is a word; otherwise `0`. */
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

  /**
   * Creates a copy of this token (computed fields are recomputed, not copied).
   *
   * @returns A new {@link TokenNode} (or subclass) instance.
   */
  clone(): TokenNode {
    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      char_count,
      length,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...data
    } = this.toJSON();
    // @ts-ignore: Ignore TS2339. It does exist. Oh, yes. It does.
    const node = this.constructor.new(data);

    node.$ctx = this.$ctx;

    return node;
  }

  /**
   * Renders the token back to text.
   *
   * @returns The token's literal value.
   */
  render() {
    return this.value;
  }

  /**
   * Serializes the token to a plain object.
   *
   * @returns A {@link TokenNodeData} snapshot of this token.
   */
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
}
