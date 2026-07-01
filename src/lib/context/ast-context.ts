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

export interface ASTContextBaseConfig {
  ASTRefMgr: ReferenceManager;
  items: Segments[][];
  refMgr: ReferenceManager;
  throwOnUnpairedQuotes?: boolean;
}

export interface ASTContextConstructorConfig extends ASTContextBaseConfig {
  lang: Language;
}

export interface ASTContextNewConfig extends ASTContextBaseConfig {
  lang: string;
}

export class ASTContext extends IteratorContext<Segments[], LineContext> {
  public ast: ASTNode;
  public lang: Language;
  public line?: LineContext;
  public quotes: QuoteNode[];
  public spans: SpanNode[];

  protected ASTRefMgr: ReferenceManager;
  protected refMgr: ReferenceManager;

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

  get currentQuote(): null | QuoteNode {
    return this.quotes.at(-1) ?? null;
  }

  get currentSpan(): null | SpanNode {
    return this.spans.at(-1) ?? null;
  }

  get inQuote(): boolean {
    return !!this.quotes.length;
  }

  get isEndOfDocument(): boolean {
    return this.isLast && this.isLastLine && this.isEndOfLine;
  }

  get isEndOfLine(): boolean {
    return this.line?.isEndOfLine ?? (this.index > 0 && !this.line);
  }

  get isFirstLine(): boolean {
    return this.isFirst && !!this.line?.isFirst;
  }

  get isLastLine(): boolean {
    return this.isLast && !!this.line?.isLast;
  }

  get isStartOfDocument(): boolean {
    return this.isFirst && this.isFirstLine && this.isStartOfLine;
  }

  get isStartOfLine(): boolean {
    return !!this.line?.isStartOfLine;
  }

  append(...nodes: Nodes) {
    for (const node of nodes) {
      this.ast.add(node);
    }

    return this;
  }

  clear() {
    this.ast.clear();

    this.quotes.length = 0;
    this.spans.length = 0;

    return this;
  }

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

  async next() {
    return this.line!;
  }

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

  reset() {
    this.clear();

    ReferenceManager.reset(this.ASTRefMgr);
    ReferenceManager.reset(this.refMgr);

    return this;
  }

  protected async beforeNext() {
    this.line = new LineContext({
      items: this.$curr!,
    });
  }

  protected async onComplete() {
    await super.onComplete();

    this.line = undefined;
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilContext(AST)`;
  // }
}
