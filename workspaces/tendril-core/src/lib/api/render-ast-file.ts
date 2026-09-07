import {
  type FileHandle,

  appendFile,
  writeFile,
} from 'node:fs/promises';
// import type {
//   PassThrough,
// } from 'node:stream';

import {
  getLangData,
} from '../i18n/index.ts';
import {
  ASTNode,
} from '../node/index.ts';

/**
 * Renders a line-delimited stream of AST nodes back into text, written to a file.
 *
 * `stream` is assumed to be a newline-delimited (NDJSON) stream of serialized AST
 *   nodes — the format produced by the streaming parsers. Each line is loaded
 *   into a working {@link ASTNode}, and nodes are buffered until a complete,
 *   renderable chunk has been accumulated: rendering is deferred while inside an
 *   `unbound` (quote) span so that quotes overlapping block boundaries are not
 *   split mid-render. Whenever the buffer reaches the `end` of a `block` node and
 *   no quote is open, the buffered nodes are rendered and appended to `file`,
 *   then cleared. Any remaining nodes are flushed once the stream is exhausted.
 *
 * The target `file` is truncated before writing begins.
 *
 * @param stream - An open {@link FileHandle} yielding one serialized AST node per line.
 * @param lang - Language code used to seed the working AST's direction and id.
 * @param file - Path of the output file that rendered text is appended to.
 * @returns A promise that resolves once the whole stream has been rendered.
 */
export async function renderASTFile(stream: FileHandle, lang: string, file: string) {
  const i18n = getLangData(lang);
  const ast = ASTNode.new({
    dir: i18n.dir,
    lang: i18n.id,
  });

  let quotes = 0;

  await writeFile(file, ``, `utf8`);

  for await (const line of stream.readLines()) {
    ASTNode.loadItem(ast, JSON.parse(line));

    const node = ast.last;

    // We're keeping track of whether we're in a quote so that we don't render
    //   and append until we are not in a situation where we have overlaps of
    //   unbound nodes and block nodes.
    if (node.type === `unbound`) {
      if (node.action === `new`) {
        ++quotes;
      }
      else if (node.action === `end`) {
        --quotes;
      }
    }

    // And here is where we check whether we're dealing with the overlap and only dump if we aren't.
    if (!quotes && node.type === `block` && node.action === `end`) {
      await appendAndClear(file, ast);
    }
  }

  // Finally, we check if the AST has any remaining nodes.
  if (!ast.empty) {
    // And append them if it does.
    await appendAndClear(file, ast);
  }
}

/**
 * Renders the buffered AST, appends the text to `file`, then clears the buffer.
 *
 * @param file - Path of the output file to append rendered text to.
 * @param ast - The working AST whose buffered nodes are rendered and then cleared.
 * @returns A promise that resolves once the rendered text has been appended.
 */
async function appendAndClear(file: string, ast: ASTNode) {
  await appendFile(file, ast.render(), `utf8`);

  ast.clear();
}
