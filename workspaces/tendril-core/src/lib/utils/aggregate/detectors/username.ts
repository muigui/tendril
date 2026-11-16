import {
  TOKEN_AGGREGATION_NODE_CATEGORY,
} from '../../../node/index.ts';

import type {
  AggregationDetector,
} from '../types.ts';

import {
  rangesOf,
  WORD_CHARS,
} from './util.ts';

// `@handle`: Unicode word characters (see WORD_CHARS — letters/marks/numbers
//   from any script, plus underscore). The lookbehind stops the leading "@"
//   from being absorbed into an email address (preceded by a word char, ".",
//   "+", or "-") or a chained "@".
const USERNAME_PATTERN = new RegExp(String.raw`(?<![${WORD_CHARS}@.+-])@[${WORD_CHARS}]+`, `gu`);

export default {
  category: TOKEN_AGGREGATION_NODE_CATEGORY.USERNAME,
  priority: 200,

  detect(text) {
    return rangesOf(text, USERNAME_PATTERN);
  },
} as AggregationDetector;
