import {
  strict as assert,
} from 'node:assert';
import {
  suite,
  test,
} from 'node:test';

import {
  RemoveQuotes,
} from '@muigui/tendril';

import {
  Files,
  readFileContents,
} from '../utils/index.ts';

const LANG = `en`;

suite(`@muigui/tendril > API > Remove Quotes`, () => {
  suite(`Without mismatched quotes`, () => {
    [
      `article-guardian-politics-sketch.original.txt`,
      `article-lipsum-text.original.txt`,
      `article-guardian-trump.original.txt`,
      `test.nested-quotes.original.txt`,
    ].forEach((original) => {
      test(`File: ${original}`, async () => {
        const source = readFileContents(original, LANG);
        const final = Files.getQuotesRemovedPath(original, LANG);
        const expected = readFileContents(final, LANG);
        const actual = await RemoveQuotes.fromString(LANG, source);

        assert.strictEqual(actual.render(), expected);
      });
    });
  });

  suite(`With mismatched quotes`, () => {
    [
      `article-huffingtonpost-mismatched-quotes.original.txt`,
    ].forEach((original) => {
      test(`File: ${original}`, async () => {
        const source = readFileContents(original, LANG);
        const final = Files.getQuotesRemovedPath(original, LANG);
        const expected = readFileContents(final, LANG);
        const actual = await RemoveQuotes.fromStringWithMismatchedQuotes(LANG, source);

        assert.strictEqual(actual.render(), expected);
      });
    });
  });
});
