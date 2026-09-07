import {
  strict as assert,
} from 'node:assert';
import {
  existsSync,
  readFileSync,
  unlinkSync,
} from 'node:fs';
import {
  after,
  suite,
  test,
} from 'node:test';

import {
  getFixturePath,
} from '@muigui/tendril-test-fixtures';

import {
  writeFileBasedOnContents,
} from './index.ts';

// These tests write into the real `tendril-test-fixtures` fixtures directory,
//   since that's what `writeFileBasedOnContents` is for. We use file names
//   that don't collide with any real fixture, and remove them afterward so
//   the workspace is left clean.
const LANG = `en`;
const written: string[] = [];

after(() => {
  written.forEach((fileName) => {
    const path = getFixturePath(`${LANG}/${fileName}`);

    if (existsSync(path)) {
      unlinkSync(path);
    }
  });
});

suite(`@muigui/tendril-test-utils > writeFileBasedOnContents`, () => {
  test(`writes string data as-is, with no trailing newline added`, () => {
    const fileName = `__write-file-based-on-contents.test__.string.txt`;

    written.push(fileName);
    writeFileBasedOnContents(fileName, `hello world`, LANG);

    const actual = readFileSync(getFixturePath(`${LANG}/${fileName}`), `utf8`);

    assert.equal(actual, `hello world`);
  });

  test(`writes objects exposing "toJSON" as pretty-printed JSON with a trailing newline`, () => {
    const fileName = `__write-file-based-on-contents.test__.json.txt`;
    const data = {
      toJSON: () => ({
        a: 1,
        b: 2,
      }),
    };

    written.push(fileName);
    writeFileBasedOnContents(fileName, data, LANG);

    const actual = readFileSync(getFixturePath(`${LANG}/${fileName}`), `utf8`);

    assert.equal(actual, `${JSON.stringify({
      a: 1,
      b: 2,
    }, null, 2)}\n`);
  });

  test(`defaults to the "en" language directory`, () => {
    const fileName = `__write-file-based-on-contents.test__.default-lang.txt`;

    written.push(fileName);
    writeFileBasedOnContents(fileName, `default language`);

    const actual = readFileSync(getFixturePath(`en/${fileName}`), `utf8`);

    assert.equal(actual, `default language`);
  });
});
