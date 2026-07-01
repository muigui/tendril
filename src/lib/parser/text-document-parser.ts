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

export class TextDocumentParser extends StringParser {
  static new(config: string | StringParserConfig) {
    config = typeof config === `string`
      ? { lang: getLangData(config) }
      : config;

    return new TextDocumentParser(config);
  }

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

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(TextDocument)`;
  // }
}
