import {
  strict as assert,
} from 'assert';
import {
  createReadStream,
} from 'node:fs';
import {
  stdin,
  stdout,
} from 'node:process';
import {
  cursorTo,
  moveCursor,
} from 'node:readline';
import {
  createInterface,
} from 'node:readline/promises';
import {
  debuglog,
} from 'node:util';

const RL = createInterface({
  crlfDelay: Number.POSITIVE_INFINITY,
  input: stdin,
  output: stdout,
  terminal: true,
});
const debug = debuglog(`tendril:test:compare`);

export interface LineDiff {
  actual: string | undefined;
  expected: string | undefined;
  line: number;
  match: boolean;
}

export async function compareLineByLine({
  breakEarly = false,
  ignoreExtraNewLines = false,
  ignoreWhiteSpaceOnlyLines = false,
  original,
  rendered,
  testMode = false,
}: {
  breakEarly?: boolean;
  ignoreExtraNewLines?: boolean;
  ignoreWhiteSpaceOnlyLines?: boolean;
  original: string;
  rendered: string;
  testMode?: boolean;
}) {
  const rlA = getReadableByLine(original);
  const rlB = getReadableByLine(rendered);
  const fileA = rlA[Symbol.asyncIterator]();
  const fileB = rlB[Symbol.asyncIterator]();
  const diffs: LineDiff[] = [];

  let line = 0;

  while (true) {
    ++line;

    if (debug.enabled && line % 100 === 0) {
      cursorTo(stdout, 0);
      moveCursor(stdout, 0, 1);

      RL.write(`Lines compared: ${line}; differences: ${diffs.length};`);

      moveCursor(stdout, 0, -1);
    }

    const [ lineA, lineB ] = await Promise.all([
      fileA.next(),
      fileB.next(),
    ]);

    if (lineA.done && lineB.done) {
      cursorTo(stdout, 0);
      moveCursor(stdout, 0, 1);

      RL.write(`Lines compared: ${line}; differences: ${diffs.length};`);

      moveCursor(stdout, 0, 2);
      cursorTo(stdout, 0);

      if (diffs.length) {
        console.log(`Comparison failed: `, {
          original,
          rendered,
        });
      }

      break;
    }

    const { value: expected } = lineA;
    const { value: actual } = lineB;

    if (actual !== expected) {
      const typeA = typeof actual;
      const typeE = typeof expected;

      let ignore = false;

      if (ignoreExtraNewLines) {
        ignore = (typeA === `undefined` && expected?.trim() === ``)
          || (actual?.trim() === `` && typeE === `undefined`);
      }

      if (ignore) {
        continue;
      }

      if (ignoreWhiteSpaceOnlyLines) {
        ignore = (typeA === `string` && typeE === `string`)
          && actual?.trim() === expected?.trim();
      }

      if (ignore) {
        continue;
      }

      // We could test using `assert.strictEqual(actual, expected)`,
      //   but this will give us better results for debugging because
      //   we'll be able to see the line numbers, as well as the line differences.
      diffs.push({
        actual,
        expected,
        line,
        match: false,
      });

      if (breakEarly) {
        break;
      }
    }
  }

  // @ts-ignore Ignore TS2339.
  rlA.__input__.close();
  rlA.close();
  // @ts-ignore Ignore TS2339.
  rlB.__input__.close();
  rlB.close();

  if (testMode) {
    return diffs;
  }

  assert.deepStrictEqual(diffs, []);
}

function getReadableByLine(file: string) {
  const input = createReadStream(file, { encoding: `utf8` });
  const rl = createInterface({
    crlfDelay: Number.POSITIVE_INFINITY,
    input,
  });

  // @ts-ignore Ignore TS2339.
  rl.__input__ = input;

  return rl;
}
