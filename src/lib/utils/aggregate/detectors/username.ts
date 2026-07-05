import {
  TOKEN_AGGREGATION_NODE_CATEGORY,
} from '../../../node/index.ts';

import type {
  AggregationDetector,
} from '../types.ts';

import {
  rangesOf,
} from './util.ts';

// `@handle` / `#tag`: word characters (so underscores are kept, whitespace and
//   punctuation are not). The lookbehind stops the leading marker from being
//   absorbed mid-word — notably the "@" inside an email, or a "C#".
const USERNAME_PATTERN = /(?<![\w@.+-])@\w+/gu;

/**
 * Detects @-mentions: an `@` followed by word characters, with a lookbehind that
 *   prevents matching the `@` inside an email address or mid-word.
 *
 * @see {@link AggregationDetector}
 */
export default {
  category: TOKEN_AGGREGATION_NODE_CATEGORY.USERNAME,
  priority: 200,

  detect(text) {
    return rangesOf(text, USERNAME_PATTERN);
  },
} as AggregationDetector;
