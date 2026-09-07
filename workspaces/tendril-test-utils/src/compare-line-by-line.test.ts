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
  compareLineByLine,
} from './index.ts';

suite(`@muigui/tendril-test-utils > compareLineByLine`, () => {
  let dir: string;

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), `tendril-test-utils-compare-line-by-line-`));
  });

  after(async () => {
    await rm(dir, {
      recursive: true,
    });
  });

  test(`resolves when both files match, line by line`, async () => {
    const contents = `line one\nline two\nline three`;
    const fileA = join(dir, `identical-a.txt`);
    const fileB = join(dir, `identical-b.txt`);

    await Promise.all([
      writeFile(fileA, contents, `utf8`),
      writeFile(fileB, contents, `utf8`),
    ]);

    await assert.doesNotReject(compareLineByLine(fileA, fileB));
  });

  test(`rejects when a line differs between the two files`, async () => {
    const fileA = join(dir, `mismatched-a.txt`);
    const fileB = join(dir, `mismatched-b.txt`);

    await Promise.all([
      writeFile(fileA, `line one\nline two`, `utf8`),
      writeFile(fileB, `line one\nline TWO`, `utf8`),
    ]);

    await assert.rejects(compareLineByLine(fileA, fileB));
  });

  test(`rejects when one file has more lines than the other`, async () => {
    const fileA = join(dir, `short.txt`);
    const fileB = join(dir, `long.txt`);

    await Promise.all([
      writeFile(fileA, `line one`, `utf8`),
      writeFile(fileB, `line one\nline two`, `utf8`),
    ]);

    await assert.rejects(compareLineByLine(fileA, fileB));
  });
});
