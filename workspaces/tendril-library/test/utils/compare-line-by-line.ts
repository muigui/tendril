import {
  strict as assert,
} from 'assert';
import {
  createReadStream,
} from 'node:fs';
import {
  createInterface,
} from 'node:readline';

export interface LineDiff {
  actual: string | undefined;
  expected: string | undefined;
  line: number;
  match: boolean;
}

export async function compareLineByLine(original: string, rendered: string) {
  const fileA = getReadableByLine(original);
  const fileB = getReadableByLine(rendered);
  const diffs: LineDiff[] = [];

  let line = 0;

  while (true) {
    ++line;
    // if (++i % 1000 === 0) {
    //   console.log(`Number of lines compared: ${i.toString(10).padStart(6, `0`)}`);
    // }

    const [ lineA, lineB ] = await Promise.all([
      fileA.next(),
      fileB.next(),
    ]);

    if (lineA.done && lineB.done) {
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
      // We could test using `assert.strictEqual(actual, expected)`,
      //   but this will give us better results for debugging because
      //   we'll be able to see the line numbers, as well as the line differences.
      diffs.push({
        actual,
        expected,
        line,
        match: false,
      });
    }
  }

  assert.deepStrictEqual(diffs, []);
}

function getReadableByLine(file: string) {
  const input = createReadStream(file, { encoding: `utf8` });
  const rl = createInterface({
    crlfDelay: Number.POSITIVE_INFINITY,
    input,
  });

  return rl[Symbol.asyncIterator]();
}
