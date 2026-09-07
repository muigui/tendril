import {
  getLangData,
} from '../i18n/index.ts';
import type {
  Parsers,
} from '../state/index.ts';

import {
  SegmentParser,
} from './segment-parser.ts';
import {
  type StringParserConfig,

  StringParser,
} from './string-parser.ts';

/**
 * The default parser for prose: turns a text document into a flat AST with full
 *   sentence/word segmentation and quote handling.
 *
 * A {@link StringParser} that uses the standard {@link SegmentParser} for its
 *   segment level. This is the parser behind {@link Redact.fromString} and
 *   {@link RemoveQuotes.fromString}.
 */
export class TextDocumentParser extends StringParser {
  /**
   * Factory for a {@link TextDocumentParser}.
   *
   * @param config - Either a language code (e.g. `'en'`) or a full
   *   {@link StringParserConfig}.
   * @returns A new {@link TextDocumentParser} instance.
   */
  static new(config: string | StringParserConfig) {
    config = typeof config === `string`
      ? { lang: getLangData(config) }
      : config;

    return new TextDocumentParser(config);
  }

  /**
   * Extends the base parsers with the standard {@link SegmentParser}.
   *
   * @returns The parser registry keyed by level.
   */
  protected getParsers(): Parsers {
    const {
      lang,
    } = this;
    const parsers = super.getParsers();

    return {
      ...parsers,
      segment: SegmentParser.new({
        lang,
      }),
    };
  }
}
