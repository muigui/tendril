import {
  TOKEN_AGGREGATION_NODE_CATEGORY,
} from '../../../node/index.ts';

import type {
  AggregationDetector,
  AggregationMatch,
} from '../types.ts';

// Require an explicit scheme for v1 — schemeless bare domains ("co.uk", a
//   sentence-final "…example.com.") are a false-positive minefield, deferred.
// Trailing sentence punctuation ("…example.com.", a wrapping ")") is script-
//   specific, so it comes from the language (`lang.trailingPunctuation`).
const URL_PATTERN = /\b(?:https?|ftp):\/\/\S+/giu;

/**
 * Detects URLs that carry an explicit scheme (`http`, `https`, or `ftp`),
 *   trimming trailing sentence punctuation (e.g. a closing `)` or full stop)
 *   that is almost never part of the link.
 *
 * @see {@link AggregationDetector}
 */
export default {
  category: TOKEN_AGGREGATION_NODE_CATEGORY.URL,
  priority: 0,

  detect(text, lang) {
    const matches: AggregationMatch[] = [];

    for (const match of text.matchAll(URL_PATTERN)) {
      const start = match.index;
      const value = match[0].replace(lang.trailingPunctuation, ``);

      if (value.length) {
        matches.push({
          end: start + value.length,
          start,
        });
      }
    }

    return matches;
  },
} as AggregationDetector;
