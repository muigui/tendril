import {
  type ASTNode,

  TokenAggregationNode,
  TokenNode,
} from '../node/index.ts';
import {
  type RawTextValue,

  TextDocumentParser,
} from '../parser/index.ts';

/**
 * Tests a single token value against the redaction dictionary.
 *
 * Each individual token value is tested in turn; `dict.some(...)` stops at the
 *   first hit. String entries are matched exactly (`===`) while {@link RegExp}
 *   entries are matched with `RegExp.prototype.test`.
 *
 * @param value - The token value to test.
 * @param dict - Words (matched exactly) and/or patterns to redact.
 * @returns `true` if the value matches any dictionary entry; otherwise `false`.
 */
function isRedacted(value: string, dict: Array<RegExp | string>) {
  return dict.some(item => (typeof item === `string`
    ? value === item
    : item.test(value)));
}

/**
 * Redacts a single {@link TokenNode} in place when its value matches the dictionary.
 *
 * On a match the token's original value is preserved on `meta.original_value` and
 *   its `value` is replaced with `redactChar` repeated `char_count` times, so the
 *   redacted glyph count matches the number of characters (graphemes) redacted.
 *
 * @param token - The token to (potentially) redact; mutated on a match.
 * @param dict - Words and/or patterns to redact.
 * @param redactChar - The character used to mask each redacted character.
 * @returns The same `token` instance, redacted when matched.
 */
function redactToken(token: TokenNode, dict: Array<RegExp | string>, redactChar: string) {
  if (isRedacted(token.value, dict)) {
    token.meta!.original_value = token.value;
    token.value = redactChar.repeat(token.char_count);
  }

  return token;
}

/**
 * Returns a new AST with specific words redacted.
 *
 * Walks `source` and copies every node into a fresh clone, redacting any
 *   {@link TokenNode} whose value matches an entry in `dict`. Because a
 *   {@link TokenAggregationNode} is also a {@link TokenNode}, it is matched first
 *   and its derived value cannot be set directly, so — for v1 — its matching
 *   *inner* token values are redacted, leaving the aggregate's structure intact.
 *
 * @param source - The source AST to redact. It is not mutated.
 * @param dict - Words (matched exactly) and/or patterns to redact.
 * @param redactChar - The character used to mask each redacted character.
 *   Defaults to the FULL BLOCK glyph (`█`, `U+2588`, UTF-8 `E2 96 88`).
 * @returns A new, re-indexed {@link ASTNode} with matching tokens redacted.
 */
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

/**
 * Parses `text` into an AST and returns a new, redacted copy of it.
 *
 * A convenience wrapper that parses `text` with a {@link TextDocumentParser} for
 *   the given language and then delegates to {@link fromAST}.
 *
 * @param lang - Language code used to parse the text (e.g. `'en'`, `'en-US'`).
 * @param text - The raw text (or array of paragraphs) to parse and redact.
 * @param dict - Words (matched exactly) and/or patterns to redact.
 * @param redactChar - The character used to mask each redacted character.
 *   Defaults to the FULL BLOCK glyph (`█`, `U+2588`, UTF-8 `E2 96 88`).
 * @returns A promise resolving to a new, redacted {@link ASTNode}.
 */
export async function fromString(lang: string, text: RawTextValue, dict: Array<RegExp | string>, redactChar = `█`) {
  const parser = TextDocumentParser.new(lang);
  const source = await parser.parse(text);
  const ast = fromAST(source, dict, redactChar);

  return ast;
  // return ast.render();
}
