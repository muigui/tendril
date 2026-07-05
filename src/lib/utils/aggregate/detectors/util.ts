import {
  isValidPhoneNumber,
} from 'libphonenumber-js';

import type {
  AggregationMatch,
} from '../types.ts';

/**
 * Validates a candidate phone number via `libphonenumber-js`.
 *
 * Strips separators, normalizes a leading `00` international prefix to `+`, and
 *   defers to `isValidPhoneNumber` — returning `false` if that throws.
 *
 * @param candidate - The raw phone-number-like text.
 * @returns `true` when the candidate is a valid phone number.
 */
export function isValidPhone(candidate: string) {
  const digits = candidate.replace(/[^\d+]/gu, ``);
  const e164 = digits.startsWith(`00`)
    ? `+${digits.slice(2)}`
    : digits;

  try {
    return isValidPhoneNumber(e164);
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
