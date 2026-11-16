import {
  isEmailValid,
} from '@hapi/address';

import {
  TOKEN_AGGREGATION_NODE_CATEGORY,
} from '../../../node/index.ts';

import type {
  AggregationDetector,
  AggregationMatch,
} from '../types.ts';

// The local part is permissive (RFC-ish, includes "+" for sub-addressing); the
//   domain requires at least one dot, so a bare "foo@bar" is not a candidate.
//   `isEmailValid` is the authority on whether a candidate is actually valid.
const EMAIL_PATTERN = /[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+/gu;

export default {
  category: TOKEN_AGGREGATION_NODE_CATEGORY.EMAIL,
  priority: 100,

  detect(text) {
    const matches: AggregationMatch[] = [];

    for (const match of text.matchAll(EMAIL_PATTERN)) {
      if (isEmailValid(match[0])) {
        matches.push({
          end: match.index + match[0].length,
          start: match.index,
        });
      }
    }

    return matches;
  },
} as AggregationDetector;
