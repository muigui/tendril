import {
  strict as assert,
} from 'node:assert';
import {
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import {
  tmpdir,
} from 'node:os';
import {
  join,
} from 'node:path';
import {
  after,
  before,
  suite,
  test,
} from 'node:test';
import {
  debuglog,
} from 'node:util';

import {
  compareLineByLine,
} from './index.ts';

const debug = debuglog(`tendril:test`);

suite(`@muigui/tendril-test-utils > compareLineByLine`, () => {
  let TEMP_DIR: string;

  before(async () => {
    TEMP_DIR = await mkdtemp(join(tmpdir(), `tendril-test-utils-compare-line-by-line-`));

    if (debug.enabled) {
      console.log(`####### <TEMP DIRECTORY: ${TEMP_DIR} /> #######`);
    }
  });

  after(async () => {
    if (!debug.enabled) {
      await rm(TEMP_DIR, {
        recursive: true,
      });
    }
  });

  test(`resolves when both files match, line by line`, async () => {
    const contents = `line one\nline two\nline three`;
    const fileA = join(TEMP_DIR, `identical-a.txt`);
    const fileB = join(TEMP_DIR, `identical-b.txt`);

    await Promise.all([
      writeFile(fileA, contents, `utf8`),
      writeFile(fileB, contents, `utf8`),
    ]);

    const diffs = await compareLineByLine({
      original: fileA,
      rendered: fileB,
      testMode: true,
    });

    assert.equal(diffs?.length, 0);
  });

  test(`rejects when a line differs between the two files`, async () => {
    const fileA = join(TEMP_DIR, `mismatched-a.txt`);
    const fileB = join(TEMP_DIR, `mismatched-b.txt`);

    await Promise.all([
      writeFile(fileA, `line one\nline two`, `utf8`),
      writeFile(fileB, `line one\nline TWO`, `utf8`),
    ]);

    const diffs = await compareLineByLine({
      original: fileA,
      rendered: fileB,
      testMode: true,
    });

    assert.ok((diffs?.length ?? 0) > 0);
  });

  test(`rejects when one file has more lines than the other`, async () => {
    const fileA = join(TEMP_DIR, `short.txt`);
    const fileB = join(TEMP_DIR, `long.txt`);

    await Promise.all([
      writeFile(fileA, `line one`, `utf8`),
      writeFile(fileB, `line one\nline two`, `utf8`),
    ]);

    const diffs = await compareLineByLine({
      original: fileA,
      rendered: fileB,
      testMode: true,
    });

    assert.ok((diffs?.length ?? 0) > 0);
  });
});
