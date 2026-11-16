import {
  strict as assert,
} from 'node:assert';
import {
  env,
} from 'node:process';
import {
  suite,
  test,
} from 'node:test';
import {
  debuglog,
} from 'node:util';

import {
  LINE_SEPARATOR,
  StringParser,
} from '@muigui/tendril';
import URLs from '@muigui/tendril-test-fixtures/URLs' with { type: 'json' };
import {
  readFileContents,
} from '@muigui/tendril-test-utils';

const debug = debuglog(`tendril:test:i18n`);
const isCI = env.CI === `true`;
// [CC] TODO: The lines feed issues in CI/CD are most likely to do with the GIT
//              `core.autocrlf` setting. So, you probably want to fix that — guy face!
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
            const parser = StringParser.new({
              aggregate: true,
              handleMismatchedQuotes: true,
              lang,
              originalLineSeparator: LINE_SEPARATOR[lineSeparator],
            });
            const expected = readFileContents(`${title}.original.txt`, lang);
            const TIMER_LABEL_PARSE = `TIME -▶ i18n -▶ parse  -▶ ${lang}:${title}`;
            const TIMER_LABEL_RENDER = `TIME -▶ i18n -▶ render -▶ ${lang}:${title}`;

            console.time(TIMER_LABEL_PARSE);

            const ast = await parser.parse(expected);

            console.timeEnd(TIMER_LABEL_PARSE);
            console.time(TIMER_LABEL_RENDER);

            const actual = ast.render();

            console.timeEnd(TIMER_LABEL_RENDER);

            assert.strictEqual(actual, expected);
          });
        });
      });
    });
});
