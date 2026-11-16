import {
  getLangData,
} from '../i18n/index.ts';

/**
 * Counts the number of characters (grapheme clusters) in a string.
 *
 * This is the best way to get the exact number of characters in a string,
 *   including emojis and other grapheme clusters. The built-in `length` property
 *   of a string counts *code units*, which can be misleading for characters (like
 *   emojis) represented by multiple code units. Using the language's
 *   grapheme segmenter counts clusters — the number of characters as perceived by
 *   users.
 *
 * @param lang - Language code used to resolve the grapheme segmenter (defaults to `'en'`).
 * @param value - The string to count.
 * @returns The number of grapheme clusters in `value`.
 */
export function getCharacterCount(lang = `en`, value: string): number {
  const i18n = getLangData(lang);
  const segments = i18n.segmentBy.grapheme(value);

  return segments.length;
}
