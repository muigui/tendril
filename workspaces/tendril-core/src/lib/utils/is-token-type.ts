import {
  type ENUM_TOKEN_NODE_TYPE,

  TOKEN_NODE_TYPE,
} from '../node/index.ts';

export function isTokenType(type: string) {
  return Object.values(TOKEN_NODE_TYPE)
    .includes(type as ENUM_TOKEN_NODE_TYPE);
}
