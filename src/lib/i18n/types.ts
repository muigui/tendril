import type {
  BaseState,
} from '../state/index.ts';

/**
 * Direction options supported for parsing text to AST and rendering AST to text.
 *
 * @enum {string}
 */
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

/**
 * Granularity options supported by the Intl.Segmenter wrapper.
 *
 * @enum {string}
 */
export const SEGMENT_GRANULARITY = {
  GRAPHEME: `grapheme`,
  SENTENCE: `sentence`,
  WORD: `word`,
} as const;

export type ENUM_SEGMENT_GRANULARITY = typeof SEGMENT_GRANULARITY[keyof typeof SEGMENT_GRANULARITY];

/**
 * Language configuration for text extraction.
 *
 * Defines the rules and patterns used by the parser to process text
 * in a specific language, including character sets, quotes, and segmentation rules.
 *
 * @interface Language
 */
export interface Language {
  /** Regular expression for apostrophe characters */
  apostrophes: RegExp;
  /** Language writing/reading direction (e.g. 'ltr' for English) */
  dir: ENUM_LANGUAGE_DIRECTION;
  /** Function that returns the first tuple where the opening quote matches the passed `value: string` */
  getTuple: ((value: string, state: BaseState) => [string, string] | null) & ThisType<Language>;
  /** Language identifier (e.g. 'en' for English) */
  id: string;
  /** Function that returns `true` if the passed value is an apostrophe */
  isApostrophe: ((value: string, state: BaseState) => boolean) & ThisType<Language>;
  /** Function that returns `true` if the passed value is an apostrophe character.
   *  This function does not guarantee the character is being used as an apostrophe, though,
   *    unlike the `isApostrophe` function above. */
  isApostropheChar: ((value: string, state: BaseState) => boolean) & ThisType<Language>;
  /** Function that returns `true` if the passed value is a closing quote */
  isClosingQuote: ((value: string, state?: BaseState) => boolean) & ThisType<Language>;
  /** Function that returns `true` if the passed value is an empty string */
  isEmpty: ((value: string | undefined, state?: BaseState) => boolean) & ThisType<Language>;
  /** Function that returns `true` if the passed value is a single newline */
  isNewLineOnly: ((value: string, state?: BaseState) => boolean) & ThisType<Language>;
  /** Function that returns `true` if the passed value is a numerical value */
  isNumerical: ((value: string, state?: BaseState) => boolean) & ThisType<Language>;
  /** Function that returns `true` if the passed value is an opening quote */
  isOpeningQuote: ((value: string, state?: BaseState) => boolean) & ThisType<Language>;
  /** Function that returns `true` if the passed value only contains white space */
  isWhiteSpaceOnly: ((value: string, state?: BaseState) => boolean) & ThisType<Language>;
  /** Function that joins the passed `string[]` and returns a single `string` */
  joinParagraphs: ((value: string[], state?: BaseState) => string) & ThisType<Language>;
  /** String used to store the new line character */
  lineSeparator: ENUM_LINE_SEPARATOR;
  /** String used to join an array of paragraph strings into a single text document */
  paragraphJoin: string;
  /** Regular expression for splitting text into paragraphs */
  paragraphSplit: RegExp;
  /** Quote configuration for the language */
  quotes: Quotes;
  /** Function that returns `true` if the passed `open` and `close` quote characters are a match */
  quotesMatch: ((open: string, close: string) => boolean) & ThisType<Language>;
  /** Function that returns `true` if the passed `open` and `close` quote characters are a mis-matched match */
  quotesMismatched: ((open: string, close: string) => boolean) & ThisType<Language>;
  /** Segmentation rules from the i18n library */
  segmentBy: SegmentByGranularity;
  /** Function that splits a single `string` using a paragraph separator and returns a `string[]` */
  splitIntoParagraphs: ((value: string, state?: BaseState) => string[]) & ThisType<Language>;
}

/**
 * Configuration for quote characters and their relationships.
 *
 * Defines opening and closing quotes, their mappings, and valid combinations
 * for proper quote handling in AST document parsing.
 *
 * @interface Quotes
 */
export interface Quotes {
  /** Array of closing quote characters */
  closing: string[];
  /** Array of opening quote characters */
  opening: string[];
  /** Mapping from closing quotes to their opening counterparts */
  tupleMap: Record<string, [string, string]>;
  /** Array of valid quote pairs as tuples */
  tuples: Array<[string, string]>;
  /** Array of mismatched quote pairs as tuples */
  tuplesMismatched: Array<[string, string]>;
}

/**
 * Segment item returned by the segmenter wrapper.
 *
 * @interface Segment
 */
export interface Segment {
  /** Index of the segment within the original string */
  index: number;
  /** Word-like flag is only present for word granularity */
  isWordLike?: undefined;
  /** Segment text */
  segment: string;
}

/**
 * Segment item returned by word granularity with a word-like flag.
 *
 * @interface WordSegment
 */
export interface WordSegment extends Omit<Segment, `isWordLike`> {
  /** Whether the segment represents a word-like token */
  isWordLike: boolean;
}

/**
 * Map of segmenting functions keyed by granularity.
 *
 * @example
 * ```typescript
 * const segmentBy: SegmentByGranularity = {
 *   word: (value) => ([ {
 *     index: 0,
 *     segment: value,
 *     isWordLike: true,
 *   } ]),
 * };
 * ```
 */
export type SegmentByGranularity = Record<ENUM_SEGMENT_GRANULARITY, WrappedSegmentFunction>;

/**
 * Collection of segments returned by a segmenting function.
 */
export type Segments = Array<Segment | WordSegment>;

/**
 * Wrapped segmentation function.
 *
 * @param value - Input string to segment
 * @returns Array of segments for the input
 */
export type WrappedSegmentFunction = (value: string) => Segments;
