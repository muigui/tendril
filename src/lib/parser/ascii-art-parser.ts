import {
  type ENUM_LINE_SEPARATOR,
  getLangData,
  LINE_SEPARATOR,
} from '../i18n/index.ts';
import {
  ParagraphNode,
} from '../node/index.ts';
import type {
  Parsers,
  SimpleState,
} from '../state/index.ts';

import {
  ASCIISegmentParser,
} from './ascii-segment-parser.ts';
import {
  StringParser,
} from './string-parser.ts';

export class ASCIIArtParser extends StringParser {
  static new(lang: string, originalLineSeparator: ENUM_LINE_SEPARATOR = LINE_SEPARATOR.LF) {
    return new ASCIIArtParser({
      lang: getLangData(lang),
      originalLineSeparator,
    });
  }

  getASTNode(state: SimpleState) {
    const ast = super.getASTNode(state);
    const paragraph = ast.spanAt(-1, ParagraphNode);

    // This covers a case where there is only a single paragraph for the entire document.
    // Because of this, the final `end` paragraph node's `value` ends up incorrectly set to empty string (``).
    // So, for these cases, we simply need to set it to the `Language#lineSeparator` value.
    if (paragraph && paragraph.action === `end` && state.lang.isEmpty(paragraph.value, state)) {
      paragraph.value = state.lang.lineSeparator;
    }

    return ast;
  }

  protected getParsers(): Parsers {
    const {
      lang,
    } = this;
    const parsers = super.getParsers();

    return {
      ...parsers,
      segment: ASCIISegmentParser.new({
        lang,
      }),
    };
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(ASCIIArt)`;
  // }
}
