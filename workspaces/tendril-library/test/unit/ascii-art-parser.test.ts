import {
  strict as assert,
} from 'node:assert';
import {
  suite,
  test,
} from 'node:test';

import {
  ASCIIArtParser,
} from '@muigui/tendril';

import {
  readFileContents,
} from '../utils/index.ts';

const LANG = `en`;

suite(`@muigui/tendril > ASCIIArtParser`, () => {
  suite(`Lossless parsing and rendering`, () => {
    const parser = ASCIIArtParser.new(LANG);

    [
      `ascii.duck.original.txt`,
      `ascii.teddy.original.txt`,
      `ascii.wwf.original.txt`,
    ].forEach((file) => {
      test(`File: ${file}`, async () => {
        const expected = readFileContents(file, LANG);
        const ast = await parser.parse(expected);
        const actual = ast.render();

        assert.strictEqual(actual, expected);
      });
    });
  });
});
