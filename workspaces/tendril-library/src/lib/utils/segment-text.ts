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

/**
 * Segments raw text into the document hierarchy the parser iterates over.
 *
 * The result is nested by level: paragraphs → sentences → segments (words,
 *   whitespace, punctuation, …). An array input is first joined into a single
 *   document using the language's paragraph join; a string input is split into
 *   paragraphs, each split into sentences, each split into word-level segments.
 *
 * @param lang - The resolved language supplying the segmenters and join/split rules.
 * @param text - The raw text, or an array of paragraphs, to segment.
 * @param state - The parser state (passed through to the language helpers).
 * @returns Segments grouped as `paragraphs[sentences[segments]]`.
 */
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
