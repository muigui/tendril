// What it does: Assumes the passed Stream is a line-delimited stream of AST Nodes
//               and returns a new Stream, which contains the rendered text,
//               from the AST Nodes in the past stream.
// How it works: Iterates over each line in the Stream, building a chunk from each
//               `SpanNode#action:new` to its `SpanNode#action:end` counterpart.
//               Once a valid chunk of nodes has been aggregated, it renders them
//               and writes the rendered text to the stream it returns, which you can consume however you like.

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

async function appendAndClear(file: string, ast: ASTNode) {
  await appendFile(file, ast.render(), `utf8`);

  ast.clear();
}
