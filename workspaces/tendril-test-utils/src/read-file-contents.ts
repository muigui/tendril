import {
  join,
} from 'node:path';

import {
  getFixture,
} from '@muigui/tendril-test-fixtures';

export function readFileContents(fileName: string, lang = `en`) {
  return getFixture(join(lang, fileName), `utf8`);
}
