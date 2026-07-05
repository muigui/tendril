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
  beforeEach,
  suite,
  test,
} from 'node:test';
import {
  setTimeout,
} from 'node:timers/promises';

import {
  getLangData,
  LINE_SEPARATOR,
  type NodeSetNodesData,

  renderASTFile,
  StreamingTextDocumentParser,
} from '@muigui/tendril';

import {
  compareLineByLine,
  Files,
} from '../utils/index.ts';

const isCI = env.CI === `true`;
const LANG = `en`;

suite(`@muigui/tendril > StreamingTextDocumentParser`, () => {
  suite(`Lossless parsing and rendering`, () => {
    suite(`#parseURL`, () => {
      const parser = StreamingTextDocumentParser.new(LANG);

      beforeEach(() => {
        parser.reset();
      });

      [
        `https://www.rfc-editor.org/rfc/rfc7530.txt`,
      ].forEach((url) => {
        test(`URL: ${url}`, async () => {
          const output = Files.getASTJSONLPathFromURL(url, LANG, true);

          await parser.parseURL({
            onChunk,
            output,
            url,
          });

          await setTimeout(1_000);

          const renderedFileName = Files.getRenderedPath(`${basename(output, Files.EXT.AST_JSONL)}${Files.EXT.TEXT}`, LANG);

          await renderASTFile(
            await open(output, `r`),
            LANG,
            renderedFileName,
          );

          // await setTimeout(1_000);

          // await compareLineByLine(file, renderedFileName);
        });
      });
    });

    suite(`#parseFile`, () => {
      suite(`Line Separator: LF`, () => {
        const parser = StreamingTextDocumentParser.new(LANG);
        const files = [
          `ECMA-262.original.txt`,
          `RFC-7530.original.txt`,
        ];

        if (!isCI) {
          files.push(`unicode-v17-core-specification.original.txt`);
        }

        beforeEach(() => {
          parser.reset();
        });

        files.forEach((fileName) => {
          test(`File: ${fileName}`, async () => {
            const file = Files.getFixturePath(fileName, LANG);
            const output = Files.getASTJSONLPath(fileName, LANG, true);

            await parser.parseFile({
              file,
              onChunk,
              output,
            });

            await setTimeout(1_000);

            const renderedFileName = Files.getRenderedPath(fileName, LANG);

            await renderASTFile(
              await open(output, `r`),
              LANG,
              renderedFileName,
            );

            await setTimeout(1_000);

            await compareLineByLine(file, renderedFileName);
          });
        });
      });

      suite(`Line Separator: CRLF`, () => {
        const parser = StreamingTextDocumentParser.new(LANG, LINE_SEPARATOR.CRLF);

        beforeEach(() => {
          parser.reset();
        });

        [
          `A Budget of Paradoxes, Volume I by Augustus De Morgan.original.txt`,
          `The 2006 CIA World Factbook by United States. Central Intelligence Agency.original.txt`,
          `The Complete Works of William Shakespeare by William Shakespeare.original.txt`,
        ].forEach((fileName) => {
          test(`File: ${fileName}`, async () => {
            const file = Files.getFixturePath(fileName, LANG);
            const output = Files.getASTJSONLPath(fileName, LANG, true);

            await parser.parseFile({
              file,
              onChunk,
              output,
            });

            await setTimeout(1_000);

            const renderedFileName = Files.getRenderedPath(fileName, LANG);

            await renderASTFile(
              await open(output, `r`),
              LANG,
              renderedFileName,
            );

            await setTimeout(1_000);

            await compareLineByLine(file, renderedFileName);
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
