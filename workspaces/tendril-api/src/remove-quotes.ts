import {
  type Language,
  type NodeArray,
  type RawTextValue,
  type ValidNodes,

  getLangData,
  SpanNode,
  StringParser,
  TOKEN_NODE_TYPE,
  TokenNode,
} from '@muigui/tendril';

export function fromAST(lang: Language, source: NodeArray<ValidNodes>) {
  // Shallow clone, as we want to conditionally include nodes, based on whether they are in a quote.
  const ast = source.clone(true);

  let quotes = 0;

  for (const node of source) {
    if (node instanceof SpanNode) {
      if (node.type === `unbound` && node.category === `quote`) {
        if (node.action === `new`) {
          ++quotes;
        }
        else if (node.action === `end`) {
          --quotes;
        }

        continue;
      }
    }

    if (quotes > 0) {
      // @ts-ignore: Ignore TS2339, for obvious reasons...
      if (node.type === `block` && node?.category === `paragraph`) {
        ast.add(TokenNode.new({
          dir: lang.dir,
          index: -1,
          lang: lang.id,
          type: TOKEN_NODE_TYPE.WHITESPACE,
          value: lang.lineSeparator,
        }));
      }

      continue;
    }

    ast.add(node.clone());
  }

  ast.reindex();

  return ast;
}

export async function fromString(lang: string, text: RawTextValue) {
  const parser = StringParser.new({
    lang,
  });
  const source = await parser.parse(text);

  // const ast = fromAST(parser.lang, source);
  return fromAST(parser.lang, source);
  // return ast;
  // return ast.render();
}

export async function fromStringWithMismatchedQuotes(lang: string, text: RawTextValue) {
  const parser = StringParser.new({
    handleMismatchedQuotes: true,
    lang,
  });
  const source = await parser.parse(text);

  // const ast = fromAST(parser.lang, source);
  return fromAST(parser.lang, source);
  // return ast;
  // return ast.render();
}
