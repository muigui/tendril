import {
  TOKEN_AGGREGATION_NODE_CATEGORY,
} from '../../../node/index.ts';

import type {
  AggregationDetector,
} from '../types.ts';

import {
  rangesOf,
} from './util.ts';

// Card numbers are detected *structurally*, not by validity: the fixtures
//   include made-up numbers that fail a Luhn/brand check yet should still be
//   recognized. Two unambiguous shapes:
//     - four groups of four digits separated by a single space or hyphen; or
//     - 13–19 contiguous digits, but NOT a "00…"/"+…" run (those are phones).
//   (Brand tagging via `card-validator` into `meta` is a planned follow-up.)
const CARD_GROUPED = /\b\d{4}(?:[ -]\d{4}){3}\b/gu;
const CARD_CONTIGUOUS = /\b(?<!\+)(?!00)\d{13,19}\b/gu;

/**
 * Detects payment-card numbers structurally (not by Luhn/brand validity): either
 *   four space/hyphen-separated groups of four digits, or a 13–19 digit
 *   contiguous run that is not an international-dialing (`00…`/`+…`) run.
 *
 * @see {@link AggregationDetector}
 */
export default {
  category: TOKEN_AGGREGATION_NODE_CATEGORY.CARD_NUMBER,
  priority: 400,

  detect(text) {
    return [
      ...rangesOf(text, CARD_GROUPED),
      ...rangesOf(text, CARD_CONTIGUOUS),
    ];
  },
} as AggregationDetector;
