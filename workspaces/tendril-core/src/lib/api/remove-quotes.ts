import {
  getLangData,
  type Language,
} from '../i18n/index.ts';
import {
  type ASTNode,

  SpanNode,
  TOKEN_NODE_TYPE,
  TokenNode,
} from '../node/index.ts';
import {
  type RawTextValue,

  TextDocumentParser,
} from '../parser/index.ts';

/**
 * Returns a new AST with all quoted text — including the surrounding quote
 *   characters — removed.
 *
 * Iterates over `source` and adds each node to a fresh clone, skipping any node
 *   encountered while inside an `unbound:quote` span (tracked with a depth
 *   counter so nested quotes are handled). When a `block:paragraph` marker is
 *   dropped because it fell inside a quote, a whitespace {@link TokenNode}
 *   carrying the language's line separator is inserted in its place to preserve
 *   spacing between the surrounding text.
 *
 * @param lang - The resolved {@link Language} used for the line separator and
 *   direction of any inserted whitespace tokens.
 * @param source - The source AST to strip quotes from. It is not mutated.
 * @returns A new, re-indexed {@link ASTNode} with quoted spans removed.
 */
export function fromAST(lang: Language, source: ASTNode) {
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

/**
 * Parses `text` into an AST and returns a new copy with quoted text removed.
 *
 * A convenience wrapper that parses `text` with a {@link TextDocumentParser} for
 *   the given language and then delegates to {@link fromAST}.
 *
 * @param lang - Language code used to parse the text (e.g. `'en'`, `'en-US'`).
 * @param text - The raw text (or array of paragraphs) to parse and strip.
 * @returns A promise resolving to a new {@link ASTNode} with quoted spans removed.
 */
export async function fromString(lang: string, text: RawTextValue) {
  const parser = TextDocumentParser.new(lang);
  const source = await parser.parse(text);
  const ast = fromAST(parser.lang, source);

  return ast;
  // return ast.render();
}

/**
 * Like {@link fromString}, but tolerant of mismatched opening/closing quote
 *   characters.
 *
 * Configures the {@link TextDocumentParser} with `handleMismatchedQuotes: true`
 *   so that, for example, a `“…"` pair is still recognised as a quote span and
 *   removed.
 *
 * @param lang - Language code used to parse the text (e.g. `'en'`, `'en-US'`).
 * @param text - The raw text (or array of paragraphs) to parse and strip.
 * @returns A promise resolving to a new {@link ASTNode} with quoted spans removed.
 */
export async function fromStringWithMismatchedQuotes(lang: string, text: RawTextValue) {
  const parser = TextDocumentParser.new({
    handleMismatchedQuotes: true,
    lang: getLangData(lang),
  });
  const source = await parser.parse(text);
  const ast = fromAST(parser.lang, source);

  return ast;
  // return ast.render();
}
