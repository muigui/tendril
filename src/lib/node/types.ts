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

export interface Attribute extends BooleanAttribute {
  quoted:
    | `"`
    | `'`
    | false;
  value: string;
}

export interface BooleanAttribute {
  key: string;
}

export interface INodeBasis {
  $ctx?: ASTContext;
  dir?: ENUM_LANGUAGE_DIRECTION;
  lang?: string;
  meta?: Metadata;
  ref_id?: string;
}

export interface ISpanNode extends INodeBasis {
  action: ENUM_SPAN_NODE_ACTION;
  ast_id?: string;
  ast_index?: number;
  category: ENUM_SPAN_NODE_CATEGORY;
  index?: number;
  ref_index?: number;
  type: ENUM_SPAN_NODE_TYPE;
  value?: string;
}

export const SPAN_NODE_ACTION = {
  END: `end`,
  NEW: `new`,
} as const;

export type ENUM_SPAN_NODE_ACTION = typeof SPAN_NODE_ACTION[keyof typeof SPAN_NODE_ACTION];

export const SPAN_NODE_CATEGORY_BLOCK = {
  DOCUMENT: `document`,
  LINE: `line`,
  PARAGRAPH: `paragraph`,
  SECTION: `section`,
} as const;

export type ENUM_SPAN_NODE_CATEGORY_BLOCK = typeof SPAN_NODE_CATEGORY_BLOCK[keyof typeof SPAN_NODE_CATEGORY_BLOCK];

export const SPAN_NODE_CATEGORY_INLINE = {
  SENTENCE: `sentence`,
} as const;

export type ENUM_SPAN_NODE_CATEGORY_INLINE = typeof SPAN_NODE_CATEGORY_INLINE[keyof typeof SPAN_NODE_CATEGORY_INLINE];

export const SPAN_NODE_CATEGORY_UNBOUND = {
  QUOTE: `quote`,
} as const;

export type ENUM_SPAN_NODE_CATEGORY_UNBOUND =
  typeof SPAN_NODE_CATEGORY_UNBOUND[keyof typeof SPAN_NODE_CATEGORY_UNBOUND];

export const SPAN_NODE_CATEGORY = {
  ...SPAN_NODE_CATEGORY_BLOCK,
  ...SPAN_NODE_CATEGORY_INLINE,
  ...SPAN_NODE_CATEGORY_UNBOUND,
};

export type ENUM_SPAN_NODE_CATEGORY = typeof SPAN_NODE_CATEGORY[keyof typeof SPAN_NODE_CATEGORY];

export const SPAN_NODE_TYPE = {
  BLOCK: `block`,
  INLINE: `inline`,
  UNBOUND: `unbound`,
} as const;

export type ENUM_SPAN_NODE_TYPE = typeof SPAN_NODE_TYPE[keyof typeof SPAN_NODE_TYPE];

export interface ITokenNode extends INodeBasis {
  index?: number;
  // type: string;
  type: ENUM_TOKEN_NODE_TYPE;
  value: string;
}

export interface ITokenAggregationNode extends Omit<ITokenNode, `type` | `value`> {
  // category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  category: string;
  tokens: ITokenNode[] | TokenNode[];
}

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

export const TOKEN_NODE_TYPE = {
  EMOJI: `emoji`,
  // NEWLINE: `newline`,
  NEW_LINE: `new-line`,
  PUNCTUATION: `punctuation`,
  WHITESPACE: `whitespace`,
  WORD: `word`,
} as const;

export type ENUM_TOKEN_NODE_TYPE = typeof TOKEN_NODE_TYPE[keyof typeof TOKEN_NODE_TYPE];

export interface INodeSet extends INodeBasis {
  // action?: ISpanNodeAction;
  // attributes?: Array<Attribute | BooleanAttribute>;
  nodes?: INodes;
  // state?: string;
  type: string;
}

export type INodes = IValidNodes[];

export type IValidNodes =
  | INodeSet
  | ISpanNode
  | ITokenNode;

export type Metadata = Record<number | string | symbol, unknown>;

export type Nodes = ValidNodes[];

export type ValidNodes =
  | NodeSet
  | SpanNode
  | TokenNode;
