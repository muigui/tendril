import type {
  CountryCode,
} from 'libphonenumber-js';

import type {
  ASTContext,
} from '../context/index.ts';
import type {
  NodeBasis,
} from '../node/index.ts';

export const LANGUAGE_DIRECTION = {
  AUTO: `auto`,
  LTR: `ltr`,
  RTL: `rtl`,
} as const;

export type ENUM_LANGUAGE_DIRECTION = typeof LANGUAGE_DIRECTION[keyof typeof LANGUAGE_DIRECTION];

export const LINE_SEPARATOR = {
  CR: `\r`,
  CRLF: `\r\n`,
  LF: `\n`,
} as const;

export type ENUM_LINE_SEPARATOR = typeof LINE_SEPARATOR[keyof typeof LINE_SEPARATOR];

export const SEGMENT_GRANULARITY = {
  GRAPHEME: `grapheme`,
  SENTENCE: `sentence`,
  WORD: `word`,
} as const;

export type ENUM_SEGMENT_GRANULARITY = typeof SEGMENT_GRANULARITY[keyof typeof SEGMENT_GRANULARITY];

export interface Language {
  apostrophes: RegExp;
  containsSentenceStop: ((value: string) => boolean) & ThisType<Language>;
  defaultRegion?: CountryCode;
  dir: ENUM_LANGUAGE_DIRECTION;
  getTuple: ((value: string) => [string, string] | null) & ThisType<Language>;
  id: string;
  isApostrophe: ((
    value: string,
    next: ItemSegment | null | undefined,
    prev: NodeBasis | null | undefined,
  ) => boolean) & ThisType<Language>;
  isApostropheChar: ((value: string) => boolean) & ThisType<Language>;
  isClosingQuote: ((value: string) => boolean) & ThisType<Language>;
  isEmpty: ((value: string | undefined) => boolean) & ThisType<Language>;
  isFragmentedSentenceSegment: ((
    prev: RawSegments[0],
    curr: RawSegments[0],
    next: RawSegments[0],
    nextNext: RawSegments[0],
  ) => boolean) & ThisType<Language>;
  isListLike: ((
    prev: RawSegments[0],
    curr: RawSegments[0],
    next: RawSegments[0],
    nextNext: RawSegments[0],
  ) => boolean) & ThisType<Language>;
  isNewLineOnly: ((value: string) => boolean) & ThisType<Language>;
  isOpeningQuote: ((value: string) => boolean) & ThisType<Language>;
  isWhiteSpaceOnly: ((value: string, ctx: ASTContext) => boolean) & ThisType<Language>;
  joinParagraphs: ((value: string[]) => string) & ThisType<Language>;
  lineSeparator: ENUM_LINE_SEPARATOR;
  paragraphJoin: string;
  paragraphSplit: RegExp;
  quotes: Quotes;
  quotesMatch: ((open: string, close: string) => boolean) & ThisType<Language>;
  quotesMismatched: ((open: string, close: string) => boolean) & ThisType<Language>;
  segmentBy: SegmentByGranularity;
  sentenceStops: string[];
  splitIntoParagraphs: ((value: string) => string[]) & ThisType<Language>;
  trailingPunctuation: RegExp;
}

export interface Quotes {
  closing: string[];
  opening: string[];
  tupleMap: Record<string, [string, string]>;
  tuples: Array<[string, string]>;
  tuplesMismatched: Array<[string, string]>;
}

export interface Segment {
  index: number;
  isNewLineBreak?: undefined;
  isSentenceLike?: undefined;
  isWordLike?: undefined;
  segment: string;
}

export interface NewLineBreakSegment extends Omit<Segment, `isNewLineBreak`> {
  isNewLineBreak: true;
  isSentenceLike?: undefined;
  isWordLike?: undefined;
}

export interface SentenceSegment {
  index: number;
  isNewLineBreak?: undefined;
  isSentenceLike: true;
  isWordLike?: undefined;
  segment: string;
}

export interface WordSegment extends Omit<Segment, `isWordLike`> {
  isWordLike: boolean;
}

export type SegmentByGranularity = Record<ENUM_SEGMENT_GRANULARITY, WrappedSegmentFunction>;

export type RawSegment =
  | NewLineBreakSegment
  | Segment
  | SentenceSegment;
export type RawSegments = RawSegment[];

export type ItemSegment =
  | NewLineBreakSegment
  | Segment
  | WordSegment;
export type Segments = ItemSegment[];

export type ProcessableSegment = ItemSegment | RawSegment;

export type WrappedSegmentFunction = (value: string) => Segments;
