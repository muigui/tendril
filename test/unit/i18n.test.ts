import {
  strict as assert,
} from 'node:assert';
// import {
//   writeFile,
// } from 'node:fs/promises';
import {
  env,
} from 'node:process';
import {
  suite,
  test,
} from 'node:test';

import {
  getLangData,
  LINE_SEPARATOR,
  TextDocumentParser,
} from '@muigui/tendril';

import URLs from '../fixtures/URLs.json' with { type: 'json' };

import {
  // compareLineByLine,
  // Files,
  readFileContents,
} from '../utils/index.ts';

const isCI = env.CI === `true`;
const URLsByLineSeparator = Object.groupBy(
  URLs,
  ({ lineSeparator = `LF` }) => isCI
    ? `LF`
    : lineSeparator,
);

suite(`@muigui/tendril > Internationalization`, () => {
  Object
    .entries(URLsByLineSeparator)
    .forEach(([ lineSeparator, items ]) => {
      suite(`Line Separator: ${lineSeparator}`, () => {
        items!.forEach(({
          lang,
          // lineSeparator = `LF`,
          title,
          // url: _,
        }) => {
          test(`Lang: ${lang.toLocaleUpperCase()}; Title: ${title};`, async () => {
            const parser = TextDocumentParser.new({
              aggregate: true,
              handleMismatchedQuotes: true,
              lang: getLangData(lang),
              originalLineSeparator: LINE_SEPARATOR[lineSeparator],
            });
            const expected = readFileContents(`${title}.original.txt`, lang);
            const ast = await parser.parse(expected);
            const actual = ast.render();

            // <MOST-RECENT:STUFF>
            //   const renderedFileName = Files.getRenderedPath(`${title}.txt`, lang);
            //   const astFileName = Files.getASTJSONLPath(`${title}.original.txt`, lang, true);
            //   await writeFile(astFileName, JSON.stringify(ast.toJSON()).replace(/\},\{/gm, `}\n{`), `utf8`);
            //   await writeFile(renderedFileName, actual, `utf8`);
            //   Comparing line-by-line allows us to avoid tests failing due to different line separators...
            //   await compareLineByLine(Files.getFixturePath(`${title}.original.txt`, lang), renderedFileName);
            // </MOST-RECENT:STUFF>

            // <HELLA-OLDER:STUFF>
            //   const originalFileName = Files.getRenderedPath(`${title}.original.txt`, lang);
            //   await writeFile(originalFileName, expected.replaceAll(LINE_SEPARATOR[lineSeparator], parser.lang.lineSeparator), `utf8`);
            //   if ([ `de` ].includes(lang)) {
            //     console.log(`####### <${lang.toLocaleUpperCase()} => ${title}> #######`);
            //     console.log(actual);
            //     console.log(`####### </${lang.toLocaleUpperCase()} => ${title}> #######`);
            //   }
            //   await compareLineByLine(originalFileName, renderedFileName);
            // </HELLA-OLDER:STUFF>

            assert.strictEqual(actual, expected);
          });
        });
      });
    });
});
