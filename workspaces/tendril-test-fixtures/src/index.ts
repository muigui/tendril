import {
  readFileSync,
} from 'node:fs';
import {
  resolve,
} from 'node:path';

export function getBaseFixturePath() {
  return resolve(import.meta.dirname, `..`, `fixtures`);
}

export function getFixture(fileName: string, encoding: BufferEncoding = `utf8`) {
  return readFileSync(getFixturePath(fileName), encoding);
}

export function getFixturePath(fileName: string) {
  return resolve(getBaseFixturePath(), fileName);
}
