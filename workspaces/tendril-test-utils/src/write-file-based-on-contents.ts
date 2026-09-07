import {
  writeFileSync,
} from 'node:fs';
import {
  join,
} from 'node:path';

import type {
  ASTNode,
} from '@muigui/tendril';
import {
  getFixturePath,
} from '@muigui/tendril-test-fixtures';

export function writeFileBasedOnContents(fileName: string, data: ASTNode | object | string, lang = `en`) {
  // @ts-ignore: Ignore TS2339. I'm not going out of my way to make TS happy here. Sorry...
  const isJSON = typeof data !== `string` && typeof data?.toJSON === `function`;
  const content = isJSON
    // @ts-ignore: Ignore TS2339. I'm not going out of my way to make TS happy here. Sorry...
    ? JSON.stringify(data?.toJSON() ?? data, null, 2)
    : data as string;
  const EOF = isJSON
    ? `\n`
    : ``;

  writeFileSync(
    getFixturePath(join(lang, fileName)),
    `${content}${EOF}`,
    `utf8`,
  );
}
