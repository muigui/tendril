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

/**
 * Builds and registers a {@link Language} configuration.
 *
 * Merges the supplied settings with sensible defaults (apostrophes, line
 *   separator, paragraph split/join), constructs the {@link Quotes} lookup
 *   tables, wires up an {@link Intl.Segmenter}-backed segmenter, and binds the
 *   language helper functions (overriding any provided in `functions`). The
 *   result is stored in {@link AVAILABLE_LANGUAGES} under its `id` and returned.
 *
 * @returns The fully-built, registered {@link Language}.
 *
 * @example
 * ```typescript
 * configureLanguage({
 *   dir: LANGUAGE_DIRECTION.LTR,
 *   id: 'en',
 *   quotes: { tuples: [[ '"', '"' ], [ '‘', '’' ]] },
 * });
 * ```
 */
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

/**
 * Builds the {@link Quotes} lookup tables from opening/closing quote pairs.
 *
 * Derives the flat `opening`/`closing` arrays and a `tupleMap` that resolves
 *   either character of a pair back to the full tuple, alongside the original
 *   `tuples` and `tuplesMismatched`.
 *
 * @param tuples - Valid `[open, close]` quote pairs.
 * @param tuplesMismatched - Tolerated mismatched `[open, close]` pairs.
 * @returns The assembled {@link Quotes} configuration.
 */
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
