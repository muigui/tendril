import type {
  Writable,
} from 'node:stream';

import type {
  ENUM_TOKEN_AGGREGATION_NODE_CATEGORY,
  NodeSetNodesData,
} from '../node/index.ts';
import {
  noop,
} from '../utils/index.ts';

export const SEGMENT_COMMAND_ACTIONS = {
  // Instruct the parser to create a new `LineNode`,
  //   using the current segment, and append it to the `ASTNode`.
  // APPEND_LINE: `append:line`,
  // Instruct the parser to create a new `TokenNode`,
  //   using the current segment, and append it to the `ASTNode`.
  APPEND_TOKEN: `append:token`,
  // Instruct the parser to do nothing.
  DO_NOTHING: `do:nothing`,
  // The "Jackson" action is a noop command that can be
  //   used to instruct the parser not to do anything...
  // Think of it as the `do:nothing` command action's much cooler friend.
  // Just like the movie: https://www.imdb.com/title/tt0094612/
  JACKSON: `jack:son`,
  // Instruct the parser to close the most recent `QuoteNode` (`SpanNode`),
  //   on the `ASTContext#quote: QuoteNode[]` stack, and append it to the `ASTNode`.
  QUOTE_CLOSE: `quote:close`,
  QUOTE_CLOSE_MISMATCHED: `quote:close:mismatched`,
  // Instruct the parser to create a new `QuoteNode` (`SpanNode`),
  //   using the current segment, and append it to the `ASTNode`.
  QUOTE_OPEN: `quote:open`,
  // Instruct the parser to end the most recent `SentenceNode` (`SpanNode`),
  //   on the `ASTContext#spans: SpanNode[]` stack, and append it to the `ASTNode`.
  // SENTENCE_END: `sentence:end`,
  // Instruct the parser to create a new `SentenceNode` (`SpanNode`),
  //   using the current segment, and append it to the `ASTNode`.
  // SENTENCE_START: `sentence:end`,
} as const;

export type ENUM_SEGMENT_COMMAND_ACTIONS = typeof SEGMENT_COMMAND_ACTIONS[keyof typeof SEGMENT_COMMAND_ACTIONS];

export const SENTENCE_SEGMENT_STYLE = {
  // Stick to the default segmenting as is done by the Intl.Segmenter.
  // This means that a multiline sentence with line breaks will not be treated as a single sentence but as separate sentences.
  DEFAULT: `default`,
  // Ensure sentences are segmented based on actual sentence stops.
  // Unlike the `default` version, this will treat a multiline sentence with line breaks as the single sentence it is.
  // The drawback to this though, is that ASTS parsed using this option will not be a one-to-one rendering of the original document, since their newlines.
  TRUE: `true`,
};

export type ENUM_SENTENCE_SEGMENT_STYLE = typeof SENTENCE_SEGMENT_STYLE[keyof typeof SENTENCE_SEGMENT_STYLE];

export type AggregationConfig = boolean | ENUM_TOKEN_AGGREGATION_NODE_CATEGORY[];

export interface ParserStateStreamingConfig {
  onChunk: (err: Error | null, chunk: NodeSetNodesData) => void;
}

export const DEFAULT_STREAM_PARSER_STATE_CONFIG: ParserStateStreamingConfig = {
  onChunk: noop,
};

export type PartialParserStateStreamingConfig = Partial<ParserStateStreamingConfig>;

export interface BaseParseConfig extends PartialParserStateStreamingConfig {
  output?: string | Writable;
}

export interface ParseFileConfig extends BaseParseConfig {
  file: string;
}

export interface ParseURLConfig extends BaseParseConfig, RequestInit {
  saveOriginalFile: string;
  url: string;
}

export const TEMP_DIRECTORY_PREFIX = `tendril-stream-parser-output-dir-`;
