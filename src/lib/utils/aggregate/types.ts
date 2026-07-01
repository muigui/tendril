import type {
  Language,
} from '../../i18n/index.ts';
import type {
  ENUM_TOKEN_AGGREGATION_NODE_CATEGORY,
  TokenAggregationNode,
} from '../../node/index.ts';

/**
 * A self-contained detector for one aggregation category.
 *
 * Detectors are *windowed*: they see the full reconstructed text of a run of
 *   adjacent tokens at once, which sidesteps the "could this still become a
 *   valid X?" prefix problem that an online (during-parse) approach would face.
 *
 * Ranges SHOULD align to token boundaries — the transform only aggregates the
 *   tokens a match *fully* covers, so a misaligned edge simply isn't absorbed.
 */
export interface AggregationDetector {
  category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  detect(text: string, lang: Language): AggregationMatch[];
  /** Lower wins when two matches are the same length (see overlap resolution). */
  priority: number;
}

/**
 * A character range, relative to the start of a window's reconstructed text,
 *   that a detector believes is a single aggregatable value.
 *
 * `end` is exclusive (so `text.slice(start, end)` is the matched value).
 */
export interface AggregationMatch {
  end: number;
  start: number;
}

export interface Candidate extends AggregationMatch {
  category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  priority: number;
}

export interface PlacedAggregate {
  // Inclusive window-position span the aggregate replaces (may enclose
  //   transparent sentence markers, which are dropped).
  end: number;
  node: TokenAggregationNode;
  start: number;
}
