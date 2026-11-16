import type {
  BaseState,
} from '../state/index.ts';

import type {
  Segments,
} from './types.ts';

/**
 * Default {@link Language.getTuple} implementation.
 *
 * @param value - A quote character (opening or closing).
 * @param _state - The parser state (unused).
 * @returns The matching `[open, close]` tuple, or `null` when `value` isn't a quote.
 */
export function getTuple(value: string, _state: BaseState) {
  const {
    tupleMap,
  } = this.quotes;

  return tupleMap[value] ?? null;
}

/**
 * Default {@link Language.isApostrophe} implementation.
 *
 * Returns `true` only when `value` is an apostrophe *character* being used as an
 *   apostrophe — i.e. flanked by word-like text — rather than as a quote.
 *
 * @param value - The candidate character.
 * @param state - The parser state, used to inspect the surrounding tokens.
 * @returns `true` when `value` is functioning as an apostrophe.
 */
export function isApostrophe(value: string, state: BaseState) {
  if (this.isApostropheChar(value, state)) {
    const {
      ctx,
    } = state;
    // Next is an unprocessed segment
    const next = state.currentCtx?.$next as Segments[0];
    // Previous is a processed AST Node.
    const previous = ctx.ast.tokenAt(-1);

    // This is why they need different types of checks...
    if (next?.isWordLike || previous?.type === `word`) {
      return true;
    }
  }

  return false;
}

/**
 * Default {@link Language.isApostropheChar} implementation.
 *
 * Tests only the character shape (does it match the apostrophe pattern), not how
 *   it is being used — see {@link isApostrophe} for that.
 *
 * @param value - The candidate character.
 * @param _state - The parser state (unused).
 * @returns `true` when `value` is an apostrophe character.
 */
export function isApostropheChar(value: string, _state: BaseState) {
  return this.apostrophes.test(value);
}

/**
 * Default {@link Language.isClosingQuote} implementation.
 *
 * @param value - The candidate character.
 * @param _state - The parser state (unused).
 * @returns `true` when `value` is a closing quote character for the language.
 */
export function isClosingQuote(value: string, _state?: BaseState) {
  return this.quotes.closing.includes(value);
}

/**
 * Default {@link Language.isEmpty} implementation.
 *
 * @param value - The candidate value.
 * @param _state - The parser state (unused).
 * @returns `true` when `value` is `undefined` or the empty string.
 */
export function isEmpty(value: string | undefined, _state?: BaseState) {
  return typeof value === `undefined` || value === ``;
}

/**
 * Default {@link Language.isNewLineOnly} implementation.
 *
 * @param value - The candidate value.
 * @param state - The parser state, used for the source line separator.
 * @returns `true` when `value` is exactly the language's or source's line separator.
 */
export function isNewLineOnly(value: string, state: BaseState) {
  return value === this.lineSeparator || value === state?.originalLineSeparator;
}

/**
 * Default {@link Language.isOpeningQuote} implementation.
 *
 * @param value - The candidate character.
 * @param _state - The parser state (unused).
 * @returns `true` when `value` is an opening quote character for the language.
 */
export function isOpeningQuote(value: string, _state?: BaseState) {
  return this.quotes.opening.includes(value);
}

/**
 * Default {@link Language.isWhiteSpaceOnly} implementation.
 *
 * @param value - The candidate value.
 * @param state - The parser state.
 * @returns `true` when `value` is whitespace but not a line separator.
 */
export function isWhiteSpaceOnly(value: string, state: BaseState) {
  return !this.isNewLineOnly(value, state) && this.isEmpty(value.trim(), state);
}

/**
 * Default {@link Language.joinParagraphs} implementation.
 *
 * @param value - The paragraph strings to join.
 * @param _state - The parser state (unused).
 * @returns The paragraphs joined with the language's `paragraphJoin`.
 */
export function joinParagraphs(value: string[], _state: BaseState) {
  return value.join(this.paragraphJoin);
  // return value.join(state.originalLineSeparator
  //   ? state.originalLineSeparator.repeat(2)
  //   : this.paragraphJoin);
}

/**
 * Default {@link Language.splitIntoParagraphs} implementation.
 *
 * @param value - The document text to split.
 * @param _state - The parser state (unused).
 * @returns The paragraphs produced by splitting on the language's `paragraphSplit`.
 */
export function splitIntoParagraphs(value: string, _state: BaseState) {
  return value.split(this.paragraphSplit);
  // return value.split(state.originalLineSeparator
  //   ? state.originalLineSeparator.repeat(2)
  //   : this.paragraphSplit);
}

/**
 * Default {@link Language.quotesMatch} implementation.
 *
 * @param open - The opening quote character.
 * @param close - The closing quote character.
 * @returns `true` when `[open, close]` is a valid quote pair for the language.
 */
export function quotesMatch(open: string, close: string) {
  const {
    tuples,
  } = this.quotes;
  const tuple = tuples.find(([ o, c ]) =>
    o === open && c === close);

  return !!tuple;
}

/**
 * Default {@link Language.quotesMismatched} implementation.
 *
 * @param open - The opening quote character.
 * @param close - The closing quote character.
 * @returns `true` when `[open, close]` is a tolerated *mismatched* pair.
 */
export function quotesMismatched(open: string, close: string) {
  const {
    tuplesMismatched: tuples,
  } = this.quotes;
  const tuple = tuples.find(([ o, c ]) =>
    o === open && c === close);

  return !!tuple;
}
