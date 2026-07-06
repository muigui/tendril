import {
  type CountryCode,

  isValidPhoneNumber,
} from 'libphonenumber-js';

import type {
  AggregationMatch,
} from '../types.ts';

/**
 * Character class (regex-source, not a `RegExp`) for the "word" characters that
 *   make up a social handle or hashtag. Unlike `\w` (which is ASCII-only even
 *   under the `u` flag), this covers letters, combining marks, and numbers from
 *   *every* script, so `@José`, `#日本語`, and `@محمد` match as whole tokens.
 *   Underscore is kept for parity with the previous `\w` behavior.
 */
export const WORD_CHARS = String.raw`\p{L}\p{M}\p{N}_`;

/**
 * Validates a candidate phone number via `libphonenumber-js`.
 *
 * Strips separators, normalizes a leading `00` international prefix to `+`, and
 *   defers to `isValidPhoneNumber` — returning `false` if that throws. A
 *   `region` (when supplied by the language) lets national-format numbers
 *   validate; without it only international (E.164) numbers are accepted.
 *
 * @param candidate - The raw phone-number-like text.
 * @param region - Optional default region for national-format validation.
 * @returns `true` when the candidate is a valid phone number.
 */
export function isValidPhone(candidate: string, region?: CountryCode) {
  const digits = candidate.replace(/[^\d+]/gu, ``);
  const e164 = digits.startsWith(`00`)
    ? `+${digits.slice(2)}`
    : digits;

  try {
    return isValidPhoneNumber(e164, region);
  }
  catch {
    return false;
  }
}
/**
 * Collects the character ranges of every match of `pattern` within `text`.
 *
 * @param text - The text to scan (the pattern must be global).
 * @param pattern - The regular expression to match.
 * @returns One {@link AggregationMatch} (with exclusive `end`) per match.
 */
export function rangesOf(text: string, pattern: RegExp): AggregationMatch[] {
  const matches: AggregationMatch[] = [];

  for (const match of text.matchAll(pattern)) {
    matches.push({
      end: match.index + match[0].length,
      start: match.index,
    });
  }

  return matches;
}
