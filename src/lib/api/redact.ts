// What it does: Returns a new AST/string with specific words redacted.
// How it works: Accepts a dictionary of words/regex patterns, and
//               any matches have their value moved into `meta.original_value: string`
//               then each character replaced with the redacted character, which defaults to:
//               ```FULL BLOCK => █ Unicode: U+2588, UTF-8: E2 96 88```.
import {
  type ASTNode,

  TokenAggregationNode,
  TokenNode,
} from '../node/index.ts';
import {
  type RawTextValue,

  TextDocumentParser,
} from '../parser/index.ts';

// We test each individual token value; `dict.some(...)` stops at the first hit.
function isRedacted(value: string, dict: Array<RegExp | string>) {
  return dict.some(item => (typeof item === `string`
    ? value === item
    : item.test(value)));
}

function redactToken(token: TokenNode, dict: Array<RegExp | string>, redactChar: string) {
  if (isRedacted(token.value, dict)) {
    token.meta!.original_value = token.value;
    token.value = redactChar.repeat(token.char_count);
  }

  return token;
}

export function fromAST(source: ASTNode, dict: Array<RegExp | string>, redactChar = `█`) {
  // Shallow clone, as we want to conditionally include nodes, based on whether they are in a quote.
  const ast = source.clone(true);

  for (const node of source) {
    // A `TokenAggregationNode` is also a `TokenNode`, so it must be matched
    //   first. Its value is derived (and can't be set directly), so for v1 we
    //   redact matching *individual* inner token values, leaving the rest — and
    //   the aggregate's structure — intact.
    // [CC] TODO: also support matching the concatenated `TokenAggregationNode#value`.
    if (node instanceof TokenAggregationNode) {
      const aggregate = node.clone();

      for (const token of aggregate.tokens) {
        if (token instanceof TokenNode) {
          redactToken(token, dict, redactChar);
        }
      }

      ast.add(aggregate);
    }
    else if (node instanceof TokenNode) {
      ast.add(redactToken(node.clone(), dict, redactChar));
    }
    else {
      ast.add(node.clone());
    }
  }

  ast.reindex();

  return ast;
}

export async function fromString(lang: string, text: RawTextValue, dict: Array<RegExp | string>, redactChar = `█`) {
  const parser = TextDocumentParser.new(lang);
  const source = await parser.parse(text);
  const ast = fromAST(source, dict, redactChar);

  return ast;
  // return ast.render();
}
