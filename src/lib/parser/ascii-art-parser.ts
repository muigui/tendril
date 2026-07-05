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

/**
 * A parser tuned for ASCII art rather than prose.
 *
 * A {@link StringParser} that swaps in the {@link ASCIISegmentParser} so segments
 *   are treated as literal characters (no quote handling), preserving the exact
 *   whitespace and punctuation that make up the artwork.
 */
export class ASCIIArtParser extends StringParser {
  /**
   * Factory for an {@link ASCIIArtParser}.
   *
   * @param lang - Language code used to resolve segmentation rules (e.g. `'en'`).
   * @param originalLineSeparator - The source text's line separator (defaults to `LF`).
   * @returns A new {@link ASCIIArtParser} instance.
   */
  static new(lang: string, originalLineSeparator: ENUM_LINE_SEPARATOR = LINE_SEPARATOR.LF) {
    return new ASCIIArtParser({
      lang: getLangData(lang),
      originalLineSeparator,
    });
  }

  /**
   * Returns the parsed AST, repairing the final paragraph's line separator for
   *   the single-paragraph case (where it would otherwise be left empty).
   *
   * @param state - The completed parse state.
   * @returns The parsed {@link ASTNode}.
   */
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

  /**
   * Extends the base parsers with the {@link ASCIISegmentParser}.
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
      segment: ASCIISegmentParser.new({
        lang,
      }),
    };
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(ASCIIArt)`;
  // }
}
