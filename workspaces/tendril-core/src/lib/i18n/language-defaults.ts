import type {
  ASTContext,
} from '../context/index.ts';
import {
  type NodeBasis,

  TOKEN_NODE_TYPE,
} from '../node/index.ts';
import {
  getNodeTypeForSegment,
} from '../utils/index.ts';

import type {
  ItemSegment,
  RawSegments,
} from './types.ts';

export function containsSentenceStop(value: string) {
  return this.sentenceStops.some((stop) => {
    const index = value.indexOf(`${stop} `);

    if (index > -1 && index < value.length - 2 && value.charAt(index - 1) !== ` `) {
      return true;
    }

    return false;
  });
}

export function getTuple(value: string) {
  const {
    tupleMap,
  } = this.quotes;

  return tupleMap[value] ?? null;
}

export function isApostrophe(value: string, next: ItemSegment | null | undefined, _prev: NodeBasis | null | undefined) {
  if (this.isApostropheChar(value)) {
    if (!next) {
      return true;
    }

    const nextType = getNodeTypeForSegment(next!);

    if (nextType === TOKEN_NODE_TYPE.WHITESPACE || nextType === TOKEN_NODE_TYPE.PUNCTUATION) {
      return true;
    }
  }

  return false;
}

export function isApostropheChar(value: string) {
  return this.apostrophes.test(value);
}

export function isClosingQuote(value: string) {
  return this.quotes.closing.includes(value);
}

export function isEmpty(value: string | undefined) {
  return typeof value === `undefined` || value === ``;
}

export function isFragmentedSentenceSegment(
  prev: RawSegments[0],
  curr: RawSegments[0],
  next: RawSegments[0],
  _nextNext: RawSegments[0],
) {
  if (next) {
    if (next.isNewLineBreak || curr.isNewLineBreak) {
      return false;
    }

    if (curr.isSentenceLike && curr.segment.trim() !== curr.segment) {
      return false;
    }
    else if (next.isSentenceLike) {
      return true;
    }
  }

  return false;
}

export function isListLike(
  prev: RawSegments[0],
  curr: RawSegments[0],
  next: RawSegments[0],
  _nextNext: RawSegments[0],
) {
  // @ts-ignore: Ignore TS2339. See explanation on line 72'ish above...
  if ((prev?.isNewLineBreak ?? true) && curr?.isSentenceLike) {
    if ((/^[^\S\r\n]*\S+[^\S\r\n]*$/).test(curr.segment)) {
      // @ts-ignore: Ignore TS2339. See explanation on line 72'ish above...
      if (next?.isSentenceLike) {
        return true;
      }
    }
  }

  return false;
}

export function isNewLineOnly(value: string, ctx: ASTContext) {
  return value === this.lineSeparator || value === ctx?.originalLineSeparator;
}

export function isOpeningQuote(value: string) {
  return this.quotes.opening.includes(value);
}

export function isWhiteSpaceOnly(value: string, ctx: ASTContext) {
  return !this.isNewLineOnly(value, ctx) && this.isEmpty(value.trim());
}

export function joinParagraphs(value: string[]) {
  return value.join(this.paragraphJoin);
}

export function splitIntoParagraphs(value: string) {
  return value.split(this.paragraphSplit);
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
