import {
  strict as assert,
} from 'node:assert';
import {
  writeFile,
} from 'node:fs/promises';
import {
  suite,
  test,
} from 'node:test';

import {
  type AggregationConfig,
  type ASTNode,

  getLangData,
  SpanNode,
  TextDocumentParser,
  TOKEN_AGGREGATION_NODE_CATEGORY,
  TokenAggregationNode,
} from '@muigui/tendril';

import {
  Files,
  readFileContents,
} from '../utils/index.ts';

async function parse(text: string, aggregate: AggregationConfig = true) {
  return TextDocumentParser.new({
    aggregate,
    lang: getLangData(`en`),
  }).parse(text);
}

function aggregatesIn(ast: ASTNode) {
  const found: TokenAggregationNode[] = [];

  ast.walk((node) => {
    if (node instanceof TokenAggregationNode) {
      found.push(node);
    }
  });

  return found;
}

suite(`@muigui/tendril > token aggregation`, () => {
  suite(`url`, () => {
    test(`collapses a simple URL into one node`, async () => {
      const ast = await parse(`Visit https://example.com soon.`);
      const aggregates = aggregatesIn(ast);

      assert.equal(aggregates.length, 1);
      assert.equal(aggregates[0].category, TOKEN_AGGREGATION_NODE_CATEGORY.URL);
      assert.equal(aggregates[0].value, `https://example.com`);
    });

    test(`trims trailing sentence punctuation`, async () => {
      const ast = await parse(`See https://example.com.`);
      const [ url ] = aggregatesIn(ast);

      // The "." is a sentence terminator, not part of the link.
      assert.equal(url.value, `https://example.com`);
    });

    test(`detects an ftp:// URL`, async () => {
      const ast = await parse(`Download ftp://files.example.com/archive.zip now.`);
      const [ url ] = aggregatesIn(ast);

      assert.equal(url.value, `ftp://files.example.com/archive.zip`);
    });

    test(`drops a wrapping close-paren`, async () => {
      const ast = await parse(`Docs are here (https://example.com/docs) for you.`);
      const [ url ] = aggregatesIn(ast);

      assert.equal(url.value, `https://example.com/docs`);
    });

    test(`keeps a fully-qualified URL with every part intact`, async () => {
      const url = `https://user:password@www.example.com:1234/foo/bar.html?enc=utf8#main`;
      const ast = await parse(`The URL: ${url} has all parts.`);
      const [ node ] = aggregatesIn(ast);

      assert.equal(node.value, url);
    });
  });

  suite(`email`, () => {
    test(`collapses an email address`, async () => {
      const ast = await parse(`Email tendrill.muigui@library.example.co.uk now.`);
      const [ email ] = aggregatesIn(ast);

      assert.equal(email.category, TOKEN_AGGREGATION_NODE_CATEGORY.EMAIL);
      assert.equal(email.value, `tendrill.muigui@library.example.co.uk`);
    });

    test(`keeps a "+" sub-address intact`, async () => {
      const address = `tendrill.muigui+extra-information@library.example.co.uk`;
      const ast = await parse(`Also ${address}, same person.`);
      const [ email ] = aggregatesIn(ast);

      assert.equal(email.value, address);
    });

    test(`does not mistake the email's "@" for a username`, async () => {
      const ast = await parse(`Reach me at foo@example.com please.`);
      const aggregates = aggregatesIn(ast);

      assert.equal(aggregates.length, 1);
      assert.equal(aggregates[0].category, TOKEN_AGGREGATION_NODE_CATEGORY.EMAIL);
    });
  });

  suite(`username`, () => {
    test(`collapses an @username`, async () => {
      const ast = await parse(`This is a username: @constantology.`);
      const [ username ] = aggregatesIn(ast);

      assert.equal(username.category, TOKEN_AGGREGATION_NODE_CATEGORY.USERNAME);
      assert.equal(username.value, `@constantology`);
    });

    test(`keeps an underscore in the handle`, async () => {
      const ast = await parse(`Ping @someone_else about it.`);
      const [ username ] = aggregatesIn(ast);

      assert.equal(username.value, `@someone_else`);
    });
  });

  suite(`hashtag`, () => {
    test(`collapses a #hashtag`, async () => {
      const ast = await parse(`This is a hashtag: #muigui.`);
      const [ hashTag ] = aggregatesIn(ast);

      assert.equal(hashTag.category, TOKEN_AGGREGATION_NODE_CATEGORY.HASHTAG);
      assert.equal(hashTag.value, `#muigui`);
    });

    test(`keeps underscores but stops at spaces`, async () => {
      const ast = await parse(`Tags like #underscores_but_not_spaces work.`);
      const [ hashTag ] = aggregatesIn(ast);

      assert.equal(hashTag.value, `#underscores_but_not_spaces`);
    });
  });

  suite(`card-number`, () => {
    test(`collapses a contiguous (unspaced) card number`, async () => {
      const ast = await parse(`Pay with 4242424242424242 today.`);
      const [ card ] = aggregatesIn(ast);

      assert.equal(card.category, TOKEN_AGGREGATION_NODE_CATEGORY.CARD_NUMBER);
      assert.equal(card.value, `4242424242424242`);
    });

    test(`collapses a space-separated card number`, async () => {
      const ast = await parse(`Pay with 4242 4242 4242 4242 today.`);
      const [ card ] = aggregatesIn(ast);

      assert.equal(card.value, `4242 4242 4242 4242`);
    });

    test(`detects a structurally-valid but made-up number (no Luhn gate)`, async () => {
      const ast = await parse(`A made-up one: 1234 5678 9098 7654 here.`);
      const [ card ] = aggregatesIn(ast);

      assert.equal(card.category, TOKEN_AGGREGATION_NODE_CATEGORY.CARD_NUMBER);
      assert.equal(card.value, `1234 5678 9098 7654`);
    });
  });

  suite(`phone-number`, () => {
    test(`collapses an international "+" number with parens and spaces`, async () => {
      const ast = await parse(`Call +61 (02) 9481 1111 to order.`);
      const [ phone ] = aggregatesIn(ast);

      assert.equal(phone.category, TOKEN_AGGREGATION_NODE_CATEGORY.PHONE_NUMBER);
      assert.equal(phone.value, `+61 (02) 9481 1111`);
    });

    test(`collapses the "00" international-prefix form`, async () => {
      const ast = await parse(`Or written as 00610294811111 instead.`);
      const [ phone ] = aggregatesIn(ast);

      assert.equal(phone.category, TOKEN_AGGREGATION_NODE_CATEGORY.PHONE_NUMBER);
      assert.equal(phone.value, `00610294811111`);
    });

    test(`a "00" phone run is not mistaken for a card number`, async () => {
      const ast = await parse(`Or written as 00610294811111 instead.`);
      const aggregates = aggregatesIn(ast);

      assert.equal(aggregates.length, 1);
      assert.equal(aggregates[0].category, TOKEN_AGGREGATION_NODE_CATEGORY.PHONE_NUMBER);
    });
  });

  suite(`invariants`, () => {
    test(`is lossless — render() is unchanged vs. parsing with aggregation off`, async () => {
      const text = `This is a URL: https://example.com. http://example.com is the same URL.`;
      const on = await parse(text, true);
      const off = await parse(text, false);

      // Aggregation only regroups tokens; the rendered document must be identical.
      assert.equal(on.render(), off.render());
    });

    test(`is inert when disabled — produces no aggregation nodes`, async () => {
      const text = `Visit https://example.com soon.`;
      const ast = await parse(text, false);

      assert.equal(aggregatesIn(ast).length, 0);
    });

    test(`keeps sentence boundaries balanced when an aggregate spans one`, async () => {
      // The sentence segmenter splits this URL at the "?", so the aggregate
      //   subsumes a sentence boundary. The surviving new/end markers must
      //   still pair up by ref_id.
      const url = `https://user:password@www.example.com:1234/foo/bar.html?enc=utf8#main`;
      const ast = await parse(`The URL: ${url} is a URL.`);

      // The URL is still aggregated whole, across the (mis-placed) boundary.
      assert.equal(aggregatesIn(ast)[0]?.value, url);

      // Every sentence `end` closes the most recently opened sentence.
      const stack: Array<string | undefined> = [];

      for (const node of ast.nodes) {
        if (node instanceof SpanNode && node.category === `sentence`) {
          if (node.isNew) {
            stack.push(node.ref_id);
          }
          else {
            assert.equal(stack.pop(), node.ref_id, `sentence end must match its open marker`);
          }
        }
      }

      assert.equal(stack.length, 0, `every sentence is closed`);
    });
  });

  suite(`aggregations.txt`, () => {
    const file = `aggregations.txt`;
    const LANG = `en`;
    const parser = TextDocumentParser.new({
      aggregate: true,
      lang: getLangData(LANG),
    });

    test(`Lossless parsing and rendering`, async () => {
      const expected = readFileContents(file, LANG);
      const ast = await parser.parse(expected);
      const actual = ast.render();

      await writeFile(
        Files.getASTJSONPath(file, LANG, true),
        JSON.stringify(ast.toJSON(), null, 2),
        `utf8`,
      );

      assert.strictEqual(actual, expected);
    });
  });
});
