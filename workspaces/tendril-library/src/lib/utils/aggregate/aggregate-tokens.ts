import type {
  ASTContext,
} from '../../context/index.ts';
import {
  type ASTNode,
  type ENUM_TOKEN_AGGREGATION_NODE_CATEGORY,
  type Nodes,
  type ValidNodes,

  SPAN_NODE_TYPE,
  SpanNode,
  TOKEN_NODE_TYPE,
  TokenAggregationNode,
  TokenNode,
} from '../../node/index.ts';
import type {
  AggregationConfig,
} from '../../parser/index.ts';

import {
  DETECTORS,
} from './detectors/index.ts';
import type {
  AggregationDetector,
  Candidate,
  PlacedAggregate,
} from './types.ts';

/**
 * Post-parse transform: walk the finished flat AST and replace contiguous runs
 *   of `TokenNode`s that form a URL / email / phone / etc. with a single
 *   `TokenAggregationNode` holding the original tokens.
 *
 * Windows span *inline* sentence markers (Tendril's sentence segmenter can split
 *   a value like `…/bar.html?enc=…` at the `?`); they are bounded only by hard
 *   breaks — newlines and block/unbound markers (paragraph, document, quote) —
 *   so an aggregation never crosses a line, paragraph, or quote boundary.
 *
 * Always re-indexes before returning, so callers don't need to.
 */
export function aggregateTokens(ast: ASTNode, {
  categories,
  ctx,
}: {
  categories: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY[];
  ctx: ASTContext;
}) {
  const detectors = DETECTORS.filter(detector =>
    categories.includes(detector.category));

  if (detectors.length) {
    const {
      nodes,
    } = ast;
    const out: Nodes = [];

    let i = 0;

    while (i < nodes.length) {
      // A window opens on a real token, then greedily absorbs following tokens
      //   and transparent (sentence) markers until a hard break.
      if (isWindowToken(nodes[i])) {
        const window: Nodes = [];

        while (i < nodes.length && inWindow(nodes[i])) {
          window.push(nodes[i]);

          i++;
        }

        out.push(...aggregateWindow(window, detectors, ctx));
      }
      else {
        out.push(nodes[i]);

        i++;
      }
    }

    ast.nodes = out;
  }

  return ast.reindex();
}

function aggregateWindow(window: Nodes, detectors: AggregationDetector[], ctx: ASTContext): Nodes {
  // Tokens drive detection & text reconstruction; remember each token's position
  //   in the window so we can splice back around transparent markers.
  const tokens: TokenNode[] = [];
  const tokenPos: number[] = [];

  window.forEach((node, position) => {
    if (node instanceof TokenNode) {
      tokens.push(node);
      tokenPos.push(position);
    }
  });

  if (!tokens.length) {
    return window;
  }

  const text = tokens.map(token => token.value).join(``);
  const candidates: Candidate[] = [];

  for (const detector of detectors) {
    for (const match of detector.detect(text, ctx.lang)) {
      if (match.end > match.start) {
        candidates.push({
          ...match,
          category: detector.category,
          priority: detector.priority,
        });
      }
    }
  }

  if (!candidates.length) {
    return window;
  }

  // Longest match wins; ties broken by detector priority, then earliest start.
  candidates.sort((a, b) =>
    (b.end - b.start) - (a.end - a.start)
    || a.priority - b.priority
    || a.start - b.start);

  const chosen: Candidate[] = [];

  for (const candidate of candidates) {
    const overlaps = chosen.some(c =>
      candidate.start < c.end && c.start < candidate.end);

    if (!overlaps) {
      chosen.push(candidate);
    }
  }

  // Character bounds of every token, so we can map match ranges back to tokens.
  const bounds: Array<[number, number]> = [];

  let offset = 0;

  for (const token of tokens) {
    bounds.push([ offset, offset += token.value.length ]);
  }

  const placed: PlacedAggregate[] = [];

  for (const match of chosen) {
    let first = -1;
    let last = -1;

    // A token belongs to the match only if it falls *fully* inside the range,
    //   so a boundary-misaligned match simply absorbs fewer tokens.
    for (let t = 0; t < tokens.length; t++) {
      if (bounds[t][0] >= match.start && bounds[t][1] <= match.end) {
        first = first < 0
          ? t
          : first;
        last = t;
      }
    }

    if (first >= 0) {
      placed.push({
        end: tokenPos[last],
        node: makeAggregate(tokens.slice(first, last + 1), match.category, ctx),
        start: tokenPos[first],
      });
    }
  }

  if (!placed.length) {
    return window;
  }

  const byStart = new Map(placed.map(item => [ item.start, item ]));
  const out: Nodes = [];

  let position = 0;

  while (position < window.length) {
    const aggregate = byStart.get(position);

    if (aggregate) {
      out.push(aggregate.node);

      // The covered tokens now live inside the aggregate, but any transparent
      //   sentence markers that sat *between* them must be preserved, or their
      //   new/end pairing (matched by `ref_id`) would be left unbalanced. Re-emit
      //   them right after the aggregate — the value simply lands in the first of
      //   the sentences it spanned, and the next sentence resumes after it.
      for (let inner = aggregate.start + 1; inner < aggregate.end; inner++) {
        if (!(window[inner] instanceof TokenNode)) {
          out.push(window[inner]);
        }
      }

      position = aggregate.end + 1;
    }
    else {
      out.push(window[position]);

      position++;
    }
  }

  return out;
}

function inWindow(node: ValidNodes) {
  return isWindowToken(node)
    || isTransparent(node);
}

// Inline spans (sentence start/end markers) are transparent to a window — they
//   may sit between tokens of a single value and must not break it.
function isTransparent(node: ValidNodes): node is SpanNode {
  return node instanceof SpanNode
    && node.type === SPAN_NODE_TYPE.INLINE;
}

// A real, aggregatable token: not a newline (a hard break) and not an existing
//   aggregate. Whitespace stays in so spaced card/phone numbers survive.
function isWindowToken(node: ValidNodes): node is TokenNode {
  return node instanceof TokenNode
    && !(node instanceof TokenAggregationNode)
    && node.type !== TOKEN_NODE_TYPE.NEW_LINE;
}

function makeAggregate(tokens: TokenNode[], category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY, ctx: ASTContext) {
  const {
    dir,
    id: lang,
  } = ctx.lang;

  return TokenAggregationNode.new({
    $ctx: ctx,
    category,
    dir,
    index: tokens[0]?.index,
    lang,
    tokens,
  });
}

/** Normalize the public `aggregate` flag into a concrete list of categories. */
export function resolveCategories(option: AggregationConfig | undefined): ENUM_TOKEN_AGGREGATION_NODE_CATEGORY[] {
  if (!option) {
    return [];
  }

  return option === true
    ? DETECTORS.map(detector => detector.category)
    : option;
}
