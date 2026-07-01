import type {
  Language,
  Segments,
} from '../i18n/index.ts';
import type {
  RawTextValue,
} from '../parser/index.ts';
import type {
  BaseState,
} from '../state/index.ts';

export function segmentText(lang: Language, text: RawTextValue, state: BaseState): Segments[][] {
  if (Array.isArray(text)) {
    return this.segment(lang, lang.joinParagraphs(text, state));
  }

  const lines = lang.splitIntoParagraphs(text, state);

  return lines.map(line =>
    lang.segmentBy.sentence(line)
      .map(({ segment }) =>
        lang.segmentBy.word(segment)));
}
