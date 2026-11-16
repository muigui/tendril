import {
  type CountryCode,

  isValidPhoneNumber,
} from 'libphonenumber-js';

import type {
  AggregationMatch,
} from '../types.ts';

export const WORD_CHARS = String.raw`\p{L}\p{M}\p{N}_`;

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
