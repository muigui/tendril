import {
  strict as assert,
} from 'node:assert';
import {
  suite,
  test,
} from 'node:test';

import {
  getFixture,
} from '@muigui/tendril-test-fixtures';

import {
  readFileContents,
} from './index.ts';

suite(`@muigui/tendril-test-utils > readFileContents`, () => {
  test(`reads a fixture from the given language directory`, () => {
    const actual = readFileContents(`aggregations.txt`, `en`);
    const expected = getFixture(`en/aggregations.txt`, `utf8`);

    assert.equal(actual, expected);
  });

  test(`defaults to the "en" language directory`, () => {
    const actual = readFileContents(`aggregations.txt`);
    const expected = getFixture(`en/aggregations.txt`, `utf8`);

    assert.equal(actual, expected);
  });

  test(`throws when the fixture file does not exist`, () => {
    assert.throws(() => readFileContents(`does-not-exist.txt`, `en`), {
      code: `ENOENT`,
    });
  });
});
