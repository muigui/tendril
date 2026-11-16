import {
  getLangData,
} from '../i18n/index.ts';

export function getCharacterCount(lang = `en`, value: string): number {
  const i18n = getLangData(lang);
  const segments = i18n.segmentBy.grapheme(value);

  return segments.length;
}
