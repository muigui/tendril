import {
  TOKEN_AGGREGATION_NODE_CATEGORY,
} from '../../../node/index.ts';

import type {
  AggregationDetector,
  AggregationMatch,
} from '../types.ts';

// Sentence punctuation that is almost never part of a link when it sits on the
//   trailing edge — e.g. the "." in "…visit https://example.com." or the
//   wrapping ")" in "(see https://example.com)".
const URL_TRAILING = /[.,;:!?'")\]}]+$/u;
// Require an explicit scheme for v1 — schemeless bare domains ("co.uk", a
//   sentence-final "…example.com.") are a false-positive minefield, deferred.
const URL_PATTERN = /\b(?:https?|ftp):\/\/\S+/giu;

export default {
  category: TOKEN_AGGREGATION_NODE_CATEGORY.URL,
  priority: 0,

  detect(text) {
    const matches: AggregationMatch[] = [];

    for (const match of text.matchAll(URL_PATTERN)) {
      const start = match.index;
      const value = match[0].replace(URL_TRAILING, ``);

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
