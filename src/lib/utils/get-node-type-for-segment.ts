import {
  type Segment,
  type WordSegment,

  LINE_SEPARATOR,
} from '../i18n/types.ts';
import {
  type ENUM_TOKEN_NODE_TYPE,

  TOKEN_NODE_TYPE,
} from '../node/types.ts';

import {
  isEmoji,
} from './is-emoji.ts';

export function getNodeTypeForSegment({
  isWordLike,
  segment: value,
}: Segment | WordSegment): ENUM_TOKEN_NODE_TYPE {
  if (isWordLike) {
    return TOKEN_NODE_TYPE.WORD;
  }

  if (Object.values<string>(LINE_SEPARATOR).includes(value)) {
    return TOKEN_NODE_TYPE.NEW_LINE;
  }

  if (value.trim() === ``) {
    return TOKEN_NODE_TYPE.WHITESPACE;
  }

  if (isEmoji(value)) {
    return TOKEN_NODE_TYPE.EMOJI;
  }

  return TOKEN_NODE_TYPE.PUNCTUATION;
}
