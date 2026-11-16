import {
  type FileHandle,

  appendFile,
  writeFile,
} from 'node:fs/promises';
import {
  debuglog,
} from 'node:util';

import {
  type IValidNodes,
  type Nodes,
  type ValidNodes,

  NodeArray,
  SpanNode,
} from '../node/index.ts';

const debug = debuglog(`tendril:utils:render-ast-file`);

export async function renderASTFile(stream: FileHandle, file: string) {
  const ast = new NodeArray<ValidNodes>();

  let spans = 0;
  let unbound = 0;

  await writeFile(file, ``, `utf8`);
  debug(`Ensure file is empty:    ${file}`);

  for await (const line of stream.readLines()) {
    const raw = JSON.parse(line) as IValidNodes;
    const node = NodeArray.toNode(raw);

    if (node !== null) {
      ast.load({
        append: true,
        nodes: [ node ] as Nodes,
        reindex: false,
      });

      // We're keeping track of whether we're in a quote so that we don't render
      //   and append until we are not in a situation where we have overlaps of
      //   unbound nodes and block nodes.
      if (node instanceof SpanNode) {
        if (node.type === `unbound`) {
          if (node.action === `new`) {
            ++unbound;
          }
          else if (node.action === `end`) {
            --unbound;
          }
        }
        else if (![ `document`, `line` ].includes(node.category)) {
          if (node.action === `new`) {
            ++spans;
          }
          else if (node.action === `end`) {
            --spans;
          }
        }
      }
    }

    // And here is where we check whether we're dealing with the overlap and only dump if we aren't.
    // if (!quotes && !ast.empty) {
    if (!spans && !unbound && !ast.empty) {
      if (ast.length > 50_000) {
        debug(`Appending to file:       ${ast.length} nodes`);
      }

      await appendAndClear(file, ast);
    }
  }

  // Finally, we check if the AST has any remaining nodes.
  if (!ast.empty) {
    if (ast.length > 50_000) {
      debug(`Final appending to file: ${ast.length} nodes`);
    }

    // And append them if it does.
    await appendAndClear(file, ast);
  }

  debug(`File rendered:           ${file}`);
}

async function appendAndClear(file: string, ast: NodeArray<ValidNodes>) {
  await appendFile(file, ast.render(), `utf8`);

  ast.clear();
}
