import {
  strict as assert,
} from 'node:assert';
import {
  existsSync,
  readFileSync,
} from 'node:fs';
import {
  isAbsolute,
  join,
} from 'node:path';
import {
  suite,
  test,
} from 'node:test';

import {
  getBaseFixturePath,
  getFixture,
  getFixturePath,
} from './index.ts';

suite(`@muigui/tendril-test-fixtures`, () => {
  suite(`getBaseFixturePath`, () => {
    test(`returns an absolute path to the "fixtures" directory`, () => {
      const actual = getBaseFixturePath();

      assert.equal(isAbsolute(actual), true);
      assert.equal(actual.endsWith(`fixtures`), true);
      assert.equal(existsSync(actual), true);
    });
  });

  suite(`getFixturePath`, () => {
    test(`resolves a top-level fixture file relative to the base fixture path`, () => {
      const actual = getFixturePath(`URLs.json`);
      const expected = join(getBaseFixturePath(), `URLs.json`);

      assert.equal(actual, expected);
      assert.equal(existsSync(actual), true);
    });

    test(`resolves a nested fixture file relative to the base fixture path`, () => {
      const actual = getFixturePath(`en/aggregations.txt`);
      const expected = join(getBaseFixturePath(), `en`, `aggregations.txt`);

      assert.equal(actual, expected);
      assert.equal(existsSync(actual), true);
    });
  });

  suite(`getFixture`, () => {
    test(`reads the contents of a fixture file as utf8 by default`, () => {
      const actual = getFixture(`en/aggregations.txt`);
      const expected = readFileSync(getFixturePath(`en/aggregations.txt`), `utf8`);

      assert.equal(actual, expected);
    });

    test(`reads the contents of a fixture file using the given encoding`, () => {
      const actual = getFixture(`en/aggregations.txt`, `latin1`);
      const expected = readFileSync(getFixturePath(`en/aggregations.txt`), `latin1`);

      assert.equal(actual, expected);
    });

    test(`throws when the fixture file does not exist`, () => {
      assert.throws(() => getFixture(`does-not-exist.txt`), {
        code: `ENOENT`,
      });
    });
  });
});
