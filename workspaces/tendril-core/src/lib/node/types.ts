import type {
  ASTContext,
} from '../context/index.ts';
import type {
  ENUM_LANGUAGE_DIRECTION,
} from '../i18n/index.ts';

import type {
  NodeSet,
} from './node-set.ts';
import type {
  SpanNode,
} from './span-node.ts';
import type {
  TokenNode,
} from './token-node.ts';

/**
 * A key/value attribute, optionally wrapped in quote characters.
 *
 * @interface Attribute
 */
export interface Attribute extends BooleanAttribute {
  /** The quote character wrapping the value, or `false` when unquoted. */
  quoted:
    | `"`
    | `'`
    | false;
  /** The attribute value. */
  value: string;
}

/**
 * A valueless (boolean) attribute — its mere presence is the value.
 *
 * @interface BooleanAttribute
 */
export interface BooleanAttribute {
  /** The attribute name. */
  key: string;
}

/**
 * Properties common to every node type.
 *
 * @interface INodeBasis
 */
export interface INodeBasis {
  /** The parsing context a node was created within, when available. */
  $ctx?: ASTContext;
  /** Writing/reading direction inherited from the language. */
  dir?: ENUM_LANGUAGE_DIRECTION;
  /** Language id (e.g. `'en'`) the node belongs to. */
  lang?: string;
  /** Arbitrary per-node metadata bag. */
  meta?: Metadata;
  /** Reference id linking a `new` span marker to its `end` counterpart. */
  ref_id?: string;
}

/**
 * Shape of a span node — a boundary marker for a structure (document, paragraph,
 *   sentence, quote, …) in the flat AST.
 *
 * @interface ISpanNode
 */
export interface ISpanNode extends INodeBasis {
  /** Whether this marker opens (`new`) or closes (`end`) the span. */
  action: ENUM_SPAN_NODE_ACTION;
  /** Document-wide reference id (paired with `ast_index`). */
  ast_id?: string;
  /** Document-wide reference index. */
  ast_index?: number;
  /** The kind of structure this span represents (e.g. `paragraph`, `quote`). */
  category: ENUM_SPAN_NODE_CATEGORY;
  /** Character index of the marker within the document. */
  index?: number;
  /** Per-chunk reference index (paired with `ref_id`). */
  ref_index?: number;
  /** Structural class of the span (`block`, `inline`, or `unbound`). */
  type: ENUM_SPAN_NODE_TYPE;
  /** Literal text carried by the marker (e.g. the quote or line-break glyph). */
  value?: string;
}

/**
 * The two span-marker actions: opening a span (`new`) or closing it (`end`).
 *
 * @enum {string}
 */
export const SPAN_NODE_ACTION = {
  END: `end`,
  NEW: `new`,
} as const;

export type ENUM_SPAN_NODE_ACTION = typeof SPAN_NODE_ACTION[keyof typeof SPAN_NODE_ACTION];

/**
 * Block-level span categories — structures that occupy their own line(s).
 *
 * @enum {string}
 */
export const SPAN_NODE_CATEGORY_BLOCK = {
  DOCUMENT: `document`,
  LINE: `line`,
  PARAGRAPH: `paragraph`,
  SECTION: `section`,
} as const;

export type ENUM_SPAN_NODE_CATEGORY_BLOCK = typeof SPAN_NODE_CATEGORY_BLOCK[keyof typeof SPAN_NODE_CATEGORY_BLOCK];

/**
 * Inline span categories — structures that live within a line.
 *
 * @enum {string}
 */
export const SPAN_NODE_CATEGORY_INLINE = {
  SENTENCE: `sentence`,
} as const;

export type ENUM_SPAN_NODE_CATEGORY_INLINE = typeof SPAN_NODE_CATEGORY_INLINE[keyof typeof SPAN_NODE_CATEGORY_INLINE];

/**
 * Unbound span categories — structures that may overlap block/inline boundaries.
 *
 * @enum {string}
 */
export const SPAN_NODE_CATEGORY_UNBOUND = {
  QUOTE: `quote`,
} as const;

export type ENUM_SPAN_NODE_CATEGORY_UNBOUND =
  typeof SPAN_NODE_CATEGORY_UNBOUND[keyof typeof SPAN_NODE_CATEGORY_UNBOUND];

/**
 * The full set of span categories (block, inline, and unbound combined).
 *
 * @enum {string}
 */
export const SPAN_NODE_CATEGORY = {
  ...SPAN_NODE_CATEGORY_BLOCK,
  ...SPAN_NODE_CATEGORY_INLINE,
  ...SPAN_NODE_CATEGORY_UNBOUND,
};

export type ENUM_SPAN_NODE_CATEGORY = typeof SPAN_NODE_CATEGORY[keyof typeof SPAN_NODE_CATEGORY];

/**
 * Structural class of a span, determining how it nests/overlaps other spans.
 *
 * @enum {string}
 */
export const SPAN_NODE_TYPE = {
  BLOCK: `block`,
  INLINE: `inline`,
  UNBOUND: `unbound`,
} as const;

export type ENUM_SPAN_NODE_TYPE = typeof SPAN_NODE_TYPE[keyof typeof SPAN_NODE_TYPE];

/**
 * Shape of a token node — a leaf carrying literal text (word, whitespace,
 *   punctuation, emoji, or newline).
 *
 * @interface ITokenNode
 */
export interface ITokenNode extends INodeBasis {
  /** Character index of the token within the document. */
  index?: number;
  // type: string;
  /** The token's classification. */
  type: ENUM_TOKEN_NODE_TYPE;
  /** The literal text of the token. */
  value: string;
}

/**
 * Shape of a token-aggregation node — a group of adjacent tokens that together
 *   form a single semantic value (URL, email, phone number, …).
 *
 * @interface ITokenAggregationNode
 */
export interface ITokenAggregationNode extends Omit<ITokenNode, `type` | `value`> {
  // category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  /** The kind of aggregated value (see {@link TOKEN_AGGREGATION_NODE_CATEGORY}). */
  category: string;
  /** The original tokens that make up the aggregated value. */
  tokens: ITokenNode[] | TokenNode[];
}

/**
 * Categories of multi-token values recognised by the aggregation detectors.
 *
 * @enum {string}
 */
export const TOKEN_AGGREGATION_NODE_CATEGORY = {
  CARD_NUMBER: `card-number`,
  EMAIL: `email-address`,
  HASHTAG: `hashtag`,
  // LOCATION: `location`,
  // NAME: `name`,
  NUMBER: `number`,
  PHONE_NUMBER: `phone-number`,
  // UID: `uid`,
  URL: `url`,
  USERNAME: `username`,
} as const;

export type ENUM_TOKEN_AGGREGATION_NODE_CATEGORY = typeof TOKEN_AGGREGATION_NODE_CATEGORY[
  keyof typeof TOKEN_AGGREGATION_NODE_CATEGORY
];

/**
 * The classifications a {@link ITokenNode} can have.
 *
 * @enum {string}
 */
export const TOKEN_NODE_TYPE = {
  EMOJI: `emoji`,
  // NEWLINE: `newline`,
  NEW_LINE: `new-line`,
  PUNCTUATION: `punctuation`,
  WHITESPACE: `whitespace`,
  WORD: `word`,
} as const;

export type ENUM_TOKEN_NODE_TYPE = typeof TOKEN_NODE_TYPE[keyof typeof TOKEN_NODE_TYPE];

/**
 * Shape of a node set — an ordered collection of nodes (the AST itself, or an
 *   aggregate's inner tokens).
 *
 * @interface INodeSet
 */
export interface INodeSet extends INodeBasis {
  // action?: ISpanNodeAction;
  // attributes?: Array<Attribute | BooleanAttribute>;
  /** The child nodes contained in the set. */
  nodes?: INodes;
  // state?: string;
  /** A label describing the kind of set (e.g. `ast`). */
  type: string;
}

/** An array of serialized (plain-object) node shapes. */
export type INodes = IValidNodes[];

/** Any serialized (plain-object) node shape. */
export type IValidNodes =
  | INodeSet
  | ISpanNode
  | ITokenNode;

/** Arbitrary per-node metadata keyed by string, number, or symbol. */
export type Metadata = Record<number | string | symbol, unknown>;

/** An array of node instances. */
export type Nodes = ValidNodes[];

/** Any node instance ({@link NodeSet}, {@link SpanNode}, or {@link TokenNode}). */
export type ValidNodes =
  | NodeSet
  | SpanNode
  | TokenNode;
