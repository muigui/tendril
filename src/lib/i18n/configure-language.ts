import {
  AVAILABLE_LANGUAGES,
} from './available-languages.ts';
import * as LANG_DEFAULTS from './language-defaults.ts';
import * as Segmenter from './segmenter.ts';
import {
  type Language,
  type Quotes,

  LINE_SEPARATOR,
} from './types.ts';

export function configureLanguage({
  apostrophes = /^[\u0027\u2019]$/, // ' ’
  dir,
  functions = {},
  id,
  lineSeparator = LINE_SEPARATOR.LF,
  // This does not have a default value. Instead, if no value is provided,
  //   we default to using: `lineSeparator.repeat(2)`, as you will see below.
  paragraphJoin,
  paragraphSplit = /[\n\r\u2028\u2029]{2}/,
  quotes,
}: {
  /** Regular expression for apostrophe characters */
  apostrophes?: Language[`apostrophes`];
  /** Language writing/reading direction (e.g. 'ltr' for English) */
  dir: Language[`dir`];
  functions?: Partial<
    Omit<
      Language,
      | `apostrophes`
      | `dir`
      | `id`
      | `lineSeparator`
      | `paragraphJoin`
      | `paragraphSplit`
      | `quotes`
      | `segmentBy`
    >
  >;
  /** Language identifier (e.g. 'en' for English) */
  id: Language[`id`];
  /** String used to store the new line character */
  lineSeparator?: Language[`lineSeparator`];
  /** String used to join an array of paragraph strings into a single text document */
  paragraphJoin?: Language[`paragraphJoin`];
  /** Regular expression for splitting text into paragraphs */
  paragraphSplit?: Language[`paragraphSplit`];
  quotes:
    /** Array of valid quote pairs as tuples */
    & Partial<Pick<Quotes, `tuplesMismatched`>>
    /** Array of mismatched quote pairs as tuples */
    & Pick<Quotes, `tuples`>;
}) {
  paragraphJoin ??= lineSeparator.repeat(2);

  const LANG: Partial<Language> = {
    apostrophes,
    dir,
    id,
    lineSeparator,
    paragraphJoin,
    paragraphSplit,
    quotes: configureLanguageQuotes(quotes.tuples, quotes.tuplesMismatched ?? []),
    segmentBy: Segmenter.create(id),
  };

  for (const [ name, defaultImpl ] of Object.entries(LANG_DEFAULTS)) {
    const func = typeof functions[name] === `function`
      ? functions[name]
      : defaultImpl;

    LANG[name] = func.bind(LANG);
  }

  // eslint-disable-next-line no-return-assign
  return AVAILABLE_LANGUAGES[id] = LANG as Language;
}

export function configureLanguageQuotes(
  tuples: Array<[string, string]>,
  tuplesMismatched: Array<[string, string]> = [],
) {
  const closing: string[] = [];
  const opening: string[] = [];
  const tupleMap: Quotes[`tupleMap`] = {};

  tuples.forEach(([ open, close ]) => {
    closing.push(close);
    opening.push(open);

    tupleMap[open] = [ open, close ];
    tupleMap[close] = [ open, close ];
  });

  return {
    closing,
    opening,
    tupleMap,
    tuples,
    tuplesMismatched,
  } as Quotes;
}
