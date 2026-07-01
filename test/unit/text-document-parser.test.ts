import {
  strict as assert,
} from 'node:assert';
import {
  writeFile,
} from 'node:fs/promises';
import {
  suite,
  test,
} from 'node:test';

import {
  getLangData,
  TextDocumentParser,
} from '@muigui/tendril';

import {
  Files,
  readFileContents,
} from '../utils/index.ts';

const LANG = `en`;

suite(`@muigui/tendril > TextDocumentParser`, () => {
  suite(`Lossless parsing and rendering`, () => {
    const parser = TextDocumentParser.new({
      aggregate: true,
      lang: getLangData(LANG),
    });

    [
      `article-guardian-politics-sketch.original.txt`,
      `article-guardian-trump.original.txt`,
      `article-lipsum-text.original.txt`,
      `stupid-dad-stories.original.txt`,
      `supid-dad-stories--alternate.original.txt`,
    ].forEach((file) => {
      test(`File: ${file}`, async () => {
        const expected = readFileContents(file, LANG);
        const ast = await parser.parse(expected);
        const actual = ast.render();

        await writeFile(
          Files.getASTJSONPath(file, LANG, true),
          JSON.stringify(ast.toJSON(), null, 2),
          `utf8`,
        );

        assert.strictEqual(actual, expected);
      });
    });
  });

  suite(`Parsing and rendering with mismatched quotes`, () => {
    const parser = TextDocumentParser.new({
      aggregate: true,
      handleMismatchedQuotes: true,
      lang: getLangData(LANG),
    });

    [
      `article-huffingtonpost-mismatched-quotes.original.txt`,
    ].forEach((file) => {
      test(`File: ${file}`, async () => {
        const expected = readFileContents(file, LANG);
        const ast = await parser.parse(expected);
        const actual = ast.render();

        await writeFile(
          Files.getASTJSONPath(file, LANG, true),
          JSON.stringify(ast.toJSON(), null, 2),
          `utf8`,
        );

        assert.strictEqual(actual, expected);
      });
    });
  });
});
