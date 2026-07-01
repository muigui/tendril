import {
  readFileSync,
} from 'node:fs';

import {
  getFixturePath,
} from './files.ts';

export function readFileContents(fileName: string, lang = `en`) {
  return readFileSync(getFixturePath(fileName, lang), `utf8`);
}
