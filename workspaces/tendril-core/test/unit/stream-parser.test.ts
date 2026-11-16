import {
  strict as assert,
} from 'node:assert';
import {
  open,
} from 'node:fs/promises';
import {
  basename,
} from 'node:path';
import {
  env,
} from 'node:process';
import {
  suite,
  test,
} from 'node:test';
import {
  setTimeout,
} from 'node:timers/promises';
import {
  debuglog,
} from 'node:util';

import {
  type NodeSetNodesData,

  LINE_SEPARATOR,
  renderASTFile,
  StreamParser,
} from '@muigui/tendril';
import {
  compareLineByLine,
  Files,
} from '@muigui/tendril-test-utils';

const isCI = env.CI === `true`;
// const isCI = true;
const LANG = `en`;
const debug = debuglog(`tendril:test:stream`);

suite(`@muigui/tendril > StreamParser`, () => {
  suite(`Lossless parsing and rendering`, () => {
    suite(`#parseURL`, () => {
      [
        `https://www.rfc-editor.org/rfc/rfc7530.txt`,
      ].forEach((url) => {
        test(`URL: ${url}`, async () => {
          const parser = StreamParser.new({
            lang: LANG,
          });
          const output = Files.getASTJSONLPathFromURL(url, LANG, true);
          const TIMER_LABEL_COMPARE = `TIME -▶ StreamParser -▶ compare -▶ ${url}`;
          const TIMER_LABEL_PARSE = `TIME -▶ StreamParser -▶ parse   -▶ ${url}`;
          const TIMER_LABEL_RENDER = `TIME -▶ StreamParser -▶ render  -▶ ${url}`;
          const originalFileName = Files.getRenderedPathFromURL(url, LANG);

          console.time(TIMER_LABEL_PARSE);
          await parser.parseURL({
            onChunk,
            output,
            saveOriginalFile: originalFileName,
            url,
          });
          console.timeEnd(TIMER_LABEL_PARSE);

          await setTimeout(1_000);

          const renderedFileName = Files.getRenderedPath(`${basename(output, Files.EXT.AST_JSONL)}${Files.EXT.TEXT}`, LANG);

          console.time(TIMER_LABEL_RENDER);
          await renderASTFile(
            await open(output, `r`),
            renderedFileName,
          );
          console.timeEnd(TIMER_LABEL_RENDER);

          await setTimeout(1_000);

          console.time(TIMER_LABEL_COMPARE);
          await compareLineByLine({
            // breakEarly: true,
            ignoreExtraNewLines: true,
            ignoreWhiteSpaceOnlyLines: true,
            original: originalFileName,
            rendered: renderedFileName,
          });
          console.timeEnd(TIMER_LABEL_COMPARE);
        });
      });
    });

    suite(`#parseFile`, () => {
      suite(`Line Separator: LF`, () => {
        [
          [ `ECMA-262.original.txt`, false ],
          [ `RFC-7530.original.txt`, false ],
          // [CC] TODO: Like the issue in `i18n.test.ts`: the lines feed issues
          //              in CI/CD are most likely to do with the GIT `core.autocrlf` setting.
          //            So, you'll probably want to fix that — guy face!
          [ `unicode-v17-core-specification.original.txt`, isCI ],
        ].forEach(([ fileName, skip ]) => {
          test(`File: ${fileName}`, { skip }, async () => {
            const parser = StreamParser.new({
              lang: LANG,
            });
            const file = Files.getFixturePath(`${fileName}`, LANG);
            const output = Files.getASTJSONLPath(`${fileName}`, LANG, true);
            const TIMER_LABEL_COMPARE = `TIME -▶ StreamParser -▶ compare -▶ ${fileName}`;
            const TIMER_LABEL_PARSE = `TIME -▶ StreamParser -▶ parse   -▶ ${fileName}`;
            const TIMER_LABEL_RENDER = `TIME -▶ StreamParser -▶ render  -▶ ${fileName}`;

            console.time(TIMER_LABEL_PARSE);
            await parser.parseFile({
              file,
              onChunk,
              output,
            });
            console.timeEnd(TIMER_LABEL_PARSE);

            await setTimeout(1_000);

            const renderedFileName = Files.getRenderedPath(`${fileName}`, LANG);

            console.time(TIMER_LABEL_RENDER);
            await renderASTFile(
              await open(output, `r`),
              renderedFileName,
            );
            console.timeEnd(TIMER_LABEL_RENDER);

            await setTimeout(1_000);

            console.time(TIMER_LABEL_COMPARE);
            await compareLineByLine({
              // breakEarly: true,
              ignoreExtraNewLines: true,
              ignoreWhiteSpaceOnlyLines: true,
              original: file,
              rendered: renderedFileName,
            });
            console.timeEnd(TIMER_LABEL_COMPARE);
          });
        });
      });

      suite(`Line Separator: CRLF`, () => {
        [
          `A Budget of Paradoxes, Volume I by Augustus De Morgan.original.txt`,
          `The 2006 CIA World Factbook by United States. Central Intelligence Agency.original.txt`,
          `The Complete Works of William Shakespeare by William Shakespeare.original.txt`,
        ].forEach((fileName) => {
          test(`File: ${fileName}`, async () => {
            const parser = StreamParser.new({
              lang: LANG,
              originalLineSeparator: LINE_SEPARATOR.CRLF,
            });
            const file = Files.getFixturePath(fileName, LANG);
            const output = Files.getASTJSONLPath(fileName, LANG, true);
            const TIMER_LABEL_COMPARE = `TIME -▶ StreamParser -▶ compare -▶ ${fileName}`;
            const TIMER_LABEL_PARSE = `TIME -▶ StreamParser -▶ parse   -▶ ${fileName}`;
            const TIMER_LABEL_RENDER = `TIME -▶ StreamParser -▶ render  -▶ ${fileName}`;

            console.time(TIMER_LABEL_PARSE);
            await parser.parseFile({
              file,
              onChunk,
              output,
            });
            console.timeEnd(TIMER_LABEL_PARSE);

            await setTimeout(1_000);

            const renderedFileName = Files.getRenderedPath(fileName, LANG);

            console.time(TIMER_LABEL_RENDER);
            await renderASTFile(
              await open(output, `r`),
              renderedFileName,
            );
            console.timeEnd(TIMER_LABEL_RENDER);

            await setTimeout(1_000);

            console.time(TIMER_LABEL_COMPARE);
            await compareLineByLine({
              // breakEarly: true,
              ignoreExtraNewLines: true,
              ignoreWhiteSpaceOnlyLines: true,
              original: file,
              rendered: renderedFileName,
            });
            console.timeEnd(TIMER_LABEL_COMPARE);
          });
        });
      });
    });
  });
});

function onChunk(err: Error | null, chunk: NodeSetNodesData) {
  assert.ifError(err);

  assert.ok(Array.isArray(chunk));

  chunk.every((node) => {
    assert.ok(node && typeof node === `object`);
  });
}
