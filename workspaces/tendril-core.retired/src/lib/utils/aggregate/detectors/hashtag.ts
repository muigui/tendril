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

// `#tag`: Unicode word characters (see WORD_CHARS — letters/marks/numbers from
//   any script, plus underscore). The lookbehind stops the leading "#" from
//   being absorbed mid-word — notably a "C#" or a "#" inside another token.
const HASHTAG_PATTERN = new RegExp(String.raw`(?<![${WORD_CHARS}#])#[${WORD_CHARS}]+`, `gu`);

/**
 * Detects hashtags: a `#` followed by word characters, with a lookbehind that
 *   prevents matching mid-word (e.g. the `#` in `C#`).
 *
 * @see {@link AggregationDetector}
 */
export default {
  category: TOKEN_AGGREGATION_NODE_CATEGORY.HASHTAG,
  priority: 300,

  detect(text) {
    return rangesOf(text, HASHTAG_PATTERN);
  },
} as AggregationDetector;
