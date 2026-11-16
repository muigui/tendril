import {
  TOKEN_AGGREGATION_NODE_CATEGORY,
} from '../../../node/index.ts';

import type {
  AggregationDetector,
  AggregationMatch,
} from '../types.ts';

import {
  isValidPhone,
} from './util.ts';

// A phone candidate must start with an international marker ("+" or "00") — a
//   pragmatic v1 gate that keeps bare digit runs (and card numbers) out — then
//   we normalize "00"→"+", strip separators, and let libphonenumber decide.
const PHONE_PATTERN = /(?:\+|00)\d[\d\s()-]*\d/gu;

/**
 * Detects phone numbers that begin with an international marker (`+` or `00`),
 *   confirmed by {@link isValidPhone} (which normalizes and defers to
 *   `libphonenumber-js`).
 *
 * @see {@link AggregationDetector}
 */
export default {
  category: TOKEN_AGGREGATION_NODE_CATEGORY.PHONE_NUMBER,
  priority: 500,

  detect(text, lang) {
    const matches: AggregationMatch[] = [];

    for (const match of text.matchAll(PHONE_PATTERN)) {
      if (isValidPhone(match[0], lang.defaultRegion)) {
        matches.push({
          end: match.index + match[0].length,
          start: match.index,
        });
      }
    }

    return matches;
  },
} as AggregationDetector;
