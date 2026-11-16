import {
  type Language,
  type Segments,

  getLangData,
} from '../i18n/index.ts';
import {
  type Nodes,
  type SpanNode,
  // type ValidNodes,

  ASTNode,
  QuoteNode,
  ReferenceManager,
} from '../node/index.ts';

import {
  IteratorContext,
} from './iterator-context.ts';
import {
  LineContext,
} from './line-context.ts';

/** Configuration shared by every way of constructing an {@link ASTContext}. */
export interface ASTContextBaseConfig {
  /** Reference manager that assigns document-wide (`ast_id`/`ast_index`) references. */
  ASTRefMgr: ReferenceManager;
  /** The segmented document: paragraphs → sentences → segments. */
  items: Segments[][];
  /** Reference manager that assigns per-chunk (`ref_id`/`ref_index`) references. */
  refMgr: ReferenceManager;
  /** When `true`, unpaired quotes raise an error instead of being tolerated. */
  throwOnUnpairedQuotes?: boolean;
}

/** Config accepted by the {@link ASTContext} constructor (resolved {@link Language}). */
export interface ASTContextConstructorConfig extends ASTContextBaseConfig {
  /** The resolved language configuration for the document. */
  lang: Language;
}

/** Config accepted by {@link ASTContext.new} (language code string). */
export interface ASTContextNewConfig extends ASTContextBaseConfig {
  /** Language code (e.g. `'en'`) resolved to a {@link Language} internally. */
  lang: string;
}

/**
 * Top-level parsing context that assembles the flat AST for a document (or, in
 *   streaming mode, a single chunk of one).
 *
 * It iterates over the document's lines (each yielding a {@link LineContext}) and
 *   provides the mutating API the parsers use to build the AST: appending nodes,
 *   and opening/closing quote and span markers while tracking the open-quote and
 *   open-span stacks. Positional getters (`isStartOfDocument`, `isEndOfLine`, …)
 *   combine this context's cursor with the current line/segment cursors.
 */
export class ASTContext extends IteratorContext<Segments[], LineContext> {
  /** The flat AST being assembled for this document/chunk. */
  public ast: ASTNode;
  /** The resolved language configuration in use. */
  public lang: Language;
  /** The line sub-context currently being parsed, if any. */
  public line?: LineContext;
  /** Stack of currently open {@link QuoteNode}s (innermost last). */
  public quotes: QuoteNode[];
  /** Stack of currently open {@link SpanNode}s (innermost last). */
  public spans: SpanNode[];

  protected ASTRefMgr: ReferenceManager;
  protected refMgr: ReferenceManager;

  /**
   * Creates an {@link ASTContext}, resolving the `lang` code to a {@link Language}.
   *
   * @param config - Context configuration using a language-code string.
   * @returns A new {@link ASTContext} instance.
   */
  static new(config: ASTContextNewConfig) {
    return new ASTContext({
      ...config,
      lang: getLangData(config.lang),
    });
  }

  constructor(config: ASTContextConstructorConfig) {
    const {
      ASTRefMgr,
      items,
      lang,
      refMgr,
    } = config;

    super({
      items,
    });

    this.ASTRefMgr = ASTRefMgr;
    this.ast = ASTNode.new({
      dir: lang.dir,
      lang: lang.id,
    });
    this.lang = lang;
    this.quotes = [];
    this.refMgr = refMgr;
    this.spans = [];
  }

  /** The innermost currently open {@link QuoteNode}, or `null` if none. */
  get currentQuote(): null | QuoteNode {
    return this.quotes.at(-1) ?? null;
  }

  /** The innermost currently open {@link SpanNode}, or `null` if none. */
  get currentSpan(): null | SpanNode {
    return this.spans.at(-1) ?? null;
  }

  /** `true` while at least one quote is open. */
  get inQuote(): boolean {
    return !!this.quotes.length;
  }

  /** `true` at the final segment of the final line of the document. */
  get isEndOfDocument(): boolean {
    return this.isLast && this.isLastLine && this.isEndOfLine;
  }

  /** `true` at the end of the current line. */
  get isEndOfLine(): boolean {
    return this.line?.isEndOfLine ?? (this.index > 0 && !this.line);
  }

  /** `true` when parsing the first line of the document. */
  get isFirstLine(): boolean {
    return this.isFirst && !!this.line?.isFirst;
  }

  /** `true` when parsing the last line of the document. */
  get isLastLine(): boolean {
    return this.isLast && !!this.line?.isLast;
  }

  /** `true` at the very first segment of the first line of the document. */
  get isStartOfDocument(): boolean {
    return this.isFirst && this.isFirstLine && this.isStartOfLine;
  }

  /** `true` at the start of the current line. */
  get isStartOfLine(): boolean {
    return !!this.line?.isStartOfLine;
  }

  /**
   * Appends one or more nodes to the AST, in order.
   *
   * @param nodes - The nodes to append.
   * @returns This context, for chaining.
   */
  append(...nodes: Nodes) {
    for (const node of nodes) {
      this.ast.add(node);
    }

    return this;
  }

  /**
   * Empties the AST and resets the open-quote and open-span stacks.
   *
   * @returns This context, for chaining.
   */
  clear() {
    this.ast.clear();

    this.quotes.length = 0;
    this.spans.length = 0;

    return this;
  }

  /**
   * Closes an open quote, appending its `end` marker to the AST.
   *
   * The quote to close can be given explicitly (as a {@link QuoteNode}), by its
   *   character (looked up against the language's quote tuples — using the
   *   mismatched table when `isMisMatched` is set), or omitted to close the
   *   innermost open quote. If the resolved quote is not the innermost one, any
   *   quotes opened after it are closed first so the stack stays balanced.
   *
   * @param quote - A {@link QuoteNode}, a quote character, or `undefined` for the
   *   innermost open quote.
   * @param isMisMatched - When `true`, resolve `quote` via the language's
   *   mismatched-quote tuples.
   * @returns This context, for chaining.
   */
  closeQuote(quote?: QuoteNode | string, isMisMatched = false) {
    let node: QuoteNode | undefined;

    if (!quote) {
      node = this.currentQuote!;
    }
    else if (typeof quote === `string`) {
      if (isMisMatched) {
        const {
          quotes: {
            tuplesMismatched,
          },
        } = this.lang;
        const tuple = tuplesMismatched.find(([ _, c ]) => c === quote);

        if (tuple) {
          node = this.quotes.findLast(q => q.value === tuple[0]);
        }
        else {
          console.warn(`NoQuoteTupleFoundWarning: No quote tuple found for mismatched quote character: ${quote}`);
        }
      }
      else {
        const {
          quotes: {
            tupleMap,
          },
        } = this.lang;
        const tuple = tupleMap[quote];

        if (tuple) {
          node = this.quotes.findLast(q => q.value === tuple[0]);
        }
        else {
          console.warn(`NoQuoteTupleFoundWarning: No quote tuple found for quote character: ${quote}`);
        }
      }
    }
    else {
      if (quote instanceof QuoteNode) {
        node = quote;
      }
    }

    if (node) {
      const index = this.quotes.findLastIndex(n => n.ref_id === node.ref_id);

      if (index > -1) {
        this.append(node.end(isMisMatched && typeof quote === `string`
          ? quote
          : undefined));

        if (index === this.quotes.length - 1) {
          this.quotes.pop();
        }
        else {
          while (this.quotes.length && index < this.quotes.length - 1) {
            this.closeQuote();
          }
        }
      }
    }

    return this;
  }

  /**
   * Closes an open span, appending its `end` marker to the AST.
   *
   * Defaults to the innermost open span when `node` is omitted. If the given
   *   span is not the innermost one, spans opened after it are closed first so
   *   the stack stays balanced.
   *
   * @param node - The span to close; defaults to the innermost open span.
   * @returns This context, for chaining.
   */
  closeSpan(node?: SpanNode) {
    node ??= this.currentSpan!;

    if (node) {
      this.append(node.isEnd
        ? node
        : node.end());

      const index = this.spans.findLastIndex(n => n.ref_id === node.ref_id);

      if (index > -1) {
        if (index === this.spans.length - 1) {
          this.spans.pop();
        }
        else {
          while (this.spans.length && index < this.spans.length - 1) {
            this.closeSpan();
          }
        }
      }
    }

    return this;
  }

  /**
   * Yields the {@link LineContext} for the current line.
   *
   * @returns A promise resolving to the current line's context.
   */
  async next() {
    return this.line!;
  }

  /**
   * Opens a new quote span, priming its references and appending it to the AST.
   *
   * Warns (and does nothing) when `value` is not a known quote character for the
   *   language, or when it is a *closing* quote character. Otherwise a new
   *   `new`-action {@link QuoteNode} is created, registered with both reference
   *   managers, appended, and pushed onto the open-quote stack.
   *
   * @param value - The opening quote character.
   * @param index - Character index of the quote within its segment.
   * @returns This context, for chaining.
   */
  openQuote(value: string, index = 0) {
    const {
      ASTRefMgr,
      lang: {
        dir,
        id: lang,
        quotes: {
          tupleMap,
        },
      },
      quotes: quoteStack,
      refMgr,
    } = this;
    const tuple = tupleMap[value];

    if (!tuple) {
      console.warn(`NoQuoteTupleFoundWarning: No quote tuple found for quote character: ${value}`);
    }
    else if (value !== tuple[0] && value !== tuple[1]) {
      console.warn(`OpenQuoteWithCloseQuoteWarning: Attempt was made to open a quote with the close quote character: ${value}`);
    }
    else {
      const quote = QuoteNode.new({
        action: `new`,
        dir,
        index,
        lang,
        value,
      });

      ASTRefMgr.prime(quote);
      refMgr.prime(quote);

      this.append(quote);

      quoteStack.push(quote);
    }

    return this;
  }

  /**
   * Opens a span, priming its references, appending it, and pushing it onto the
   *   open-span stack.
   *
   * @param node - The `new`-action {@link SpanNode} to open.
   * @returns This context, for chaining.
   */
  openSpan(node: SpanNode) {
    const {
      ASTRefMgr,
      refMgr,
      spans: spanStack,
    } = this;

    ASTRefMgr.prime(node);
    refMgr.prime(node);

    this.append(node);

    spanStack.push(node);

    return this;
  }

  /**
   * Clears the context and resets both reference managers' index caches.
   *
   * @returns This context, for chaining.
   */
  reset() {
    this.clear();

    ReferenceManager.reset(this.ASTRefMgr);
    ReferenceManager.reset(this.refMgr);

    return this;
  }

  /** Builds a fresh {@link LineContext} for the line about to be yielded. */
  protected async beforeNext() {
    this.line = new LineContext({
      items: this.$curr!,
    });
  }

  /** Resets the cursor and clears the current line sub-context. */
  protected async onComplete() {
    await super.onComplete();

    this.line = undefined;
  }
}
