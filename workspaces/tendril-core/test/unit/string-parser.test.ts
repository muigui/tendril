import {
  strict as assert,
} from 'node:assert';
import {
  suite,
  test,
} from 'node:test';
import {
  debuglog,
} from 'node:util';

import {
  StringParser,
} from '@muigui/tendril';
import {
  Files,
  readFileContents,
} from '@muigui/tendril-test-utils';

const debug = debuglog(`tendril:test:string`);
const LANG = `en`;

suite(`@muigui/tendril > StringParser`, () => {
  suite(`Lossless parsing and rendering`, () => {
    [
      `article-guardian-politics-sketch.original.txt`,
      `article-guardian-trump.original.txt`,
      `article-lipsum-text.original.txt`,
      `stupid-dad-stories.original.txt`,
      `supid-dad-stories--alternate.original.txt`,
    ].forEach((file) => {
      test(`File: ${file}`, async () => {
        const parser = StringParser.new({
          aggregate: true,
          lang: LANG,
        });
        const expected = readFileContents(file, LANG);
        // const TIMER_LABEL_COMPARE = `TIME -▶ StringParser -▶ compare -▶ ${file}`;
        const TIMER_LABEL_DUMP = `TIME -▶ StringParser -▶ dump   -▶ ${file}`;
        const TIMER_LABEL_PARSE = `TIME -▶ StringParser -▶ parse  -▶ ${file}`;
        const TIMER_LABEL_RENDER = `TIME -▶ StringParser -▶ render -▶ ${file}`;

        console.time(TIMER_LABEL_PARSE);

        const ast = await parser.parse(expected);

        console.timeEnd(TIMER_LABEL_PARSE);
        console.time(TIMER_LABEL_RENDER);

        const actual = ast.render();

        console.timeEnd(TIMER_LABEL_RENDER);

        console.time(TIMER_LABEL_DUMP);
        await ast.dump(Files.getASTJSONLPath(file, LANG, true), false);
        console.timeEnd(TIMER_LABEL_DUMP);

        assert.strictEqual(actual, expected);
      });
    });
  });

  suite(`Parsing and rendering with mismatched quotes`, () => {
    [
      `article-huffingtonpost-mismatched-quotes.original.txt`,
    ].forEach((file) => {
      test(`File: ${file}`, async () => {
        const parser = StringParser.new({
          aggregate: true,
          handleMismatchedQuotes: true,
          lang: LANG,
        });
        const expected = readFileContents(file, LANG);
        const TIMER_LABEL_DUMP = `TIME -▶ StringParser -▶ dump   -▶ ${file}`;
        const TIMER_LABEL_PARSE = `TIME -▶ StringParser -▶ parse  -▶ ${file}`;
        const TIMER_LABEL_RENDER = `TIME -▶ StringParser -▶ render -▶ ${file}`;

        console.time(TIMER_LABEL_PARSE);

        const ast = await parser.parse(expected);

        console.timeEnd(TIMER_LABEL_PARSE);
        console.time(TIMER_LABEL_RENDER);

        const actual = ast.render();

        console.timeEnd(TIMER_LABEL_RENDER);

        console.time(TIMER_LABEL_DUMP);
        await ast.dump(Files.getASTJSONLPath(file, LANG, true), false);
        console.timeEnd(TIMER_LABEL_DUMP);

        assert.strictEqual(actual, expected);
      });
    });
  });
});
