import {
  strict as assert,
} from 'node:assert';
import {
  suite,
  test,
} from 'node:test';

import {
  Redact,
} from '@muigui/tendril';

import {
  Files,
  readFileContents,
} from '../utils/index.ts';

const LANG = `en`;

suite(`@muigui/tendril > API > Redact`, () => {
  suite(`Redacting using strings and regular expressions`, () => {
    [
      `supid-dad-stories--alternate.original.txt`,
    ].forEach((original) => {
      test(`File: ${original}`, async () => {
        const source = readFileContents(original, LANG);
        const final = Files.getRedactedPath(original, LANG);
        const expected = readFileContents(final, LANG);
        const actual = await Redact.fromString(LANG, source, [
          `Christos`,
          /cassie/gi,
        ]);

        assert.strictEqual(actual.render(), expected);
      });
    });
  });
});
