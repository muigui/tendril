import {
  strict as assert,
} from 'node:assert';
import {
  existsSync,
} from 'node:fs';
import {
  join,
} from 'node:path';
import {
  suite,
  test,
} from 'node:test';

import {
  Files,
} from './index.ts';

suite(`@muigui/tendril-test-utils > Files`, () => {
  suite(`EXT`, () => {
    test(`exposes the expected file extension constants`, () => {
      assert.deepStrictEqual(Files.EXT, {
        AST_JSON: `.ast.json`,
        AST_JSONL: `.ast.jsonl`,
        ORIGINAL_TEXT: `.original.txt`,
        QUOTES_REMOVED_TEXT: `.quotes.removed.txt`,
        REDACTED_TEXT: `.redacted.txt`,
        TEXT: `.txt`,
      });
    });
  });

  suite(`TEMP_DIR`, () => {
    test(`points to an existing directory created for this test run`, () => {
      assert.equal(existsSync(Files.TEMP_DIR), true);
    });
  });

  suite(`getASTJSONPath`, () => {
    test(`swaps the original-text extension for ".ast.json"`, () => {
      assert.equal(
        Files.getASTJSONPath(`article.original.txt`),
        `article.ast.json`,
      );
    });

    test(`returns a path inside TEMP_DIR when "full" is true`, () => {
      assert.equal(
        Files.getASTJSONPath(`article.original.txt`, `en`, true),
        join(Files.TEMP_DIR, `en.article.ast.json`),
      );
    });
  });

  suite(`getASTJSONLPath`, () => {
    test(`swaps the original-text extension for ".ast.jsonl"`, () => {
      assert.equal(
        Files.getASTJSONLPath(`article.original.txt`),
        `article.ast.jsonl`,
      );
    });

    test(`returns a path inside TEMP_DIR when "full" is true`, () => {
      assert.equal(
        Files.getASTJSONLPath(`article.original.txt`, `de`, true),
        join(Files.TEMP_DIR, `de.article.ast.jsonl`),
      );
    });
  });

  suite(`getASTJSONPathFromURL`, () => {
    // NOTE: `extname()` only strips the final ".txt", so the "original" part
    //   of the file name survives into the result. This mirrors the actual,
    //   current behaviour of the source rather than what might be intended.
    test(`derives the AST JSON path from a URL's file name`, () => {
      assert.equal(
        Files.getASTJSONPathFromURL(`https://example.com/cache/article.original.txt`),
        `article.original.ast.json`,
      );
    });
  });

  suite(`getASTJSONLPathFromURL`, () => {
    test(`derives the AST JSONL path from a URL's file name`, () => {
      assert.equal(
        Files.getASTJSONLPathFromURL(`https://example.com/cache/article.original.txt`),
        `article.original.ast.jsonl`,
      );
    });
  });

  suite(`getFixturePath`, () => {
    test(`resolves a fixture path under the given language directory`, () => {
      const actual = Files.getFixturePath(`aggregations.txt`, `en`);

      assert.equal(actual.endsWith(join(`en`, `aggregations.txt`)), true);
      assert.equal(existsSync(actual), true);
    });

    test(`defaults to the "en" language directory`, () => {
      assert.equal(
        Files.getFixturePath(`aggregations.txt`),
        Files.getFixturePath(`aggregations.txt`, `en`),
      );
    });
  });

  suite(`getQuotesRemovedPath`, () => {
    test(`swaps the original-text extension for ".quotes.removed.txt"`, () => {
      assert.equal(
        Files.getQuotesRemovedPath(`article.original.txt`),
        `article.quotes.removed.txt`,
      );
    });

    test(`resolves the fixture path when "full" is true`, () => {
      assert.equal(
        Files.getQuotesRemovedPath(`article-guardian-trump.original.txt`, `en`, true),
        Files.getFixturePath(`article-guardian-trump.quotes.removed.txt`, `en`),
      );
    });
  });

  suite(`getRedactedPath`, () => {
    test(`swaps the original-text extension for ".redacted.txt"`, () => {
      assert.equal(
        Files.getRedactedPath(`article.original.txt`),
        `article.redacted.txt`,
      );
    });

    test(`resolves the fixture path when "full" is true`, () => {
      assert.equal(
        Files.getRedactedPath(`supid-dad-stories--alternate.original.txt`, `en`, true),
        Files.getFixturePath(`supid-dad-stories--alternate.redacted.txt`, `en`),
      );
    });
  });

  suite(`getRenderedPath`, () => {
    test(`joins the language-prefixed file name onto TEMP_DIR`, () => {
      assert.equal(
        Files.getRenderedPath(`article.txt`, `fr`),
        join(Files.TEMP_DIR, `fr.article.txt`),
      );
    });
  });
});
