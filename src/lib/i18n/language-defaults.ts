import type {
  BaseState,
} from '../state/index.ts';

import type {
  Segments,
} from './types.ts';

export function getTuple(value: string, _state: BaseState) {
  const {
    tupleMap,
  } = this.quotes;

  return tupleMap[value] ?? null;
}

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

export function isApostropheChar(value: string, _state: BaseState) {
  return this.apostrophes.test(value);
}

export function isClosingQuote(value: string, _state?: BaseState) {
  return this.quotes.closing.includes(value);
}

export function isEmpty(value: string | undefined, _state?: BaseState) {
  return typeof value === `undefined` || value === ``;
}

export function isNewLineOnly(value: string, state: BaseState) {
  return value === this.lineSeparator || value === state?.originalLineSeparator;
}

export function isOpeningQuote(value: string, _state?: BaseState) {
  return this.quotes.opening.includes(value);
}

export function isWhiteSpaceOnly(value: string, state: BaseState) {
  return !this.isNewLineOnly(value, state) && this.isEmpty(value.trim(), state);
}

export function joinParagraphs(value: string[], _state: BaseState) {
  return value.join(this.paragraphJoin);
  // return value.join(state.originalLineSeparator
  //   ? state.originalLineSeparator.repeat(2)
  //   : this.paragraphJoin);
}

export function splitIntoParagraphs(value: string, _state: BaseState) {
  return value.split(this.paragraphSplit);
  // return value.split(state.originalLineSeparator
  //   ? state.originalLineSeparator.repeat(2)
  //   : this.paragraphSplit);
}

export function quotesMatch(open: string, close: string) {
  const {
    tuples,
  } = this.quotes;
  const tuple = tuples.find(([ o, c ]) =>
    o === open && c === close);

  return !!tuple;
}

export function quotesMismatched(open: string, close: string) {
  const {
    tuplesMismatched: tuples,
  } = this.quotes;
  const tuple = tuples.find(([ o, c ]) =>
    o === open && c === close);

  return !!tuple;
}
