import type {
  Language,
} from '../../i18n/index.ts';
import type {
  ENUM_TOKEN_AGGREGATION_NODE_CATEGORY,
  TokenAggregationNode,
} from '../../node/index.ts';

export interface AggregationDetector {
  category: ENUM_TOKEN_AGGREGATION_NODE_CATEGORY;
  detect(text: string, lang: Language): AggregationMatch[];
  priority: number;
}

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
