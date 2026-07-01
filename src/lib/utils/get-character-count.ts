import {
  getLangData,
} from '../i18n/index.ts';

// This is the best way to get the exact number of characters in a string, including
//   emojis and other grapheme clusters.
// The built-in `length` property of a string counts code units, which can be misleading
//   for certain characters (like emojis) that are represented by multiple code units.
// By using the `segmentBy.grapheme` method from the language data, we can accurately count
//   the number of grapheme clusters, which corresponds to the number of characters as perceived by users.
export function getCharacterCount(lang = `en`, value: string): number {
  const i18n = getLangData(lang);
  const segments = i18n.segmentBy.grapheme(value);

  return segments.length;
}
