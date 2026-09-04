import {
  mkdtemp,
  rm,
} from 'node:fs/promises';
import {
  tmpdir,
} from 'node:os';
import {
  basename,
  extname,
  join,
  resolve,
} from 'node:path';
import {
  cwd,
} from 'node:process';
import {
  after,
} from 'node:test';
import {
  URL,
} from 'node:url';

export const EXT = {
  AST_JSON: `.ast.json`,
  AST_JSONL: `.ast.jsonl`,
  ORIGINAL_TEXT: `.original.txt`,
  QUOTES_REMOVED_TEXT: `.quotes.removed.txt`,
  REDACTED_TEXT: `.redacted.txt`,
  TEXT: `.txt`,
} as const;
export const TEMP_DIR = await mkdtemp(join(tmpdir(), `tendril-unit-test-output-dir-`));

// Uncomment this, if you want to see where the files are being generated to
// console.log(`####### <TEMP_DIR: ${TEMP_DIR} /> #######`);

after(async () => {
  // Comment this out, to prevent the above `TEMP_DIR` from being deleted after its tests have ended.
  // This is handy for debugging code and to better understand the parsed AST documents.
  await rm(TEMP_DIR, {
    recursive: true,
  });
});

type VALID_AST_EXTENSION =
  | typeof EXT.AST_JSON
  | typeof EXT.AST_JSONL;

export function getASTJSONLPath(fileName: string, lang = `en`, full = false) {
  return getASTPath(fileName, EXT.AST_JSONL, lang, full);
}

export function getASTJSONLPathFromURL(url: string, lang = `en`, full = false) {
  return getASTPathFromURL(url, EXT.AST_JSONL, lang, full);
}

export function getASTJSONPath(fileName: string, lang = `en`, full = false) {
  return getASTPath(fileName, EXT.AST_JSON, lang, full);
}

export function getASTJSONPathFromURL(url: string, lang = `en`, full = false) {
  return getASTPathFromURL(url, EXT.AST_JSON, lang, full);
}

// export function getASTJSONLPath(fileName: string, lang = `en`, full = false) {
//   const file = `${basename(fileName, EXT.ORIGINAL_TEXT)}${EXT.AST_JSONL}`;
//
//   return full
//     ? getRenderedPath(file, lang)
//     : file;
// }

export function getASTPath(fileName: string, extension: VALID_AST_EXTENSION, lang = `en`, full = false) {
  const file = `${basename(fileName, EXT.ORIGINAL_TEXT)}${extension}`;

  return full
    ? getRenderedPath(file, lang)
    : file;
}

export function getASTPathFromURL(url: string, extension: VALID_AST_EXTENSION, lang = `en`, full = false) {
  const uri = new URL(url);
  const file = basename(uri.pathname, extname(uri.pathname));

  return getASTPath(file, extension, lang, full);
}

export function getFixturePath(fileName: string, lang = `en`) {
  return resolve(cwd(), `test`, `fixtures`, lang, fileName);
}

export function getQuotesRemovedPath(fileName: string, lang = `en`, full = false) {
  const file = `${basename(fileName, EXT.ORIGINAL_TEXT)}${EXT.QUOTES_REMOVED_TEXT}`;

  return full
    ? getFixturePath(file, lang)
    : file;
}

export function getRedactedPath(fileName: string, lang = `en`, full = false) {
  const file = `${basename(fileName, EXT.ORIGINAL_TEXT)}${EXT.REDACTED_TEXT}`;

  return full
    ? getFixturePath(file, lang)
    : file;
}

export function getRenderedPath(fileName: string, lang = `en`) {
  return join(TEMP_DIR, `${lang}.${fileName}`);
}
