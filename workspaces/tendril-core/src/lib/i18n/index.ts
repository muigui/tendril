import {
  AVAILABLE_LANGUAGES,
} from './available-languages.ts';

import './lang/index.ts';

export * from './available-languages.ts';
export * from './configure-language.ts';

export * as LANG_DEFAULTS from './language-defaults.ts';

export * as LangSegmenter from './segmenter.ts';

export * from './types.ts';

export function getLangData(lang = `en`) {
  const code = lang.toLocaleLowerCase()
    .split(/[-_]+/)
    .shift() as string;
  const langData = AVAILABLE_LANGUAGES[lang]
    ?? AVAILABLE_LANGUAGES[code];

  return {
    ...langData,
  };
}
