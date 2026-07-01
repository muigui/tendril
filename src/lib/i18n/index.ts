import {
  AVAILABLE_LANGUAGES,
} from './available-languages.ts';

import './lang/index.ts';

export * from './available-languages.ts';
export * from './configure-language.ts';
export * as LANG_DEFAULTS from './language-defaults.ts';
export * as Segmenter from './segmenter.ts';
export * from './types.ts';

/**
 * Gets language data for the specified language code.
 *
 * Normalizes the language code by converting to lowercase and extracting
 * the primary language part (before any hyphens or underscores).
 *
 * @param lang - Language code (e.g. 'en', 'en-US', 'en_US')
 * @returns Language configuration for the specified language, or undefined if unsupported
 *
 * @example
 * ```typescript
 * const lang = getLangData('en-AU');
 * const words = lang?.segmentBy.word('Hello world');
 * ```
 */
export function getLangData(lang = `en`) {
  const code = lang.toLocaleLowerCase()
    .split(/[-_]+/)
    .shift() as string;

  return AVAILABLE_LANGUAGES[lang]
    ?? AVAILABLE_LANGUAGES[code];
}
