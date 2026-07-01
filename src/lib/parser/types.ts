import type {
  ENUM_TOKEN_AGGREGATION_NODE_CATEGORY,
} from '../node/index.ts';

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

/**
 * The public, opt-in parse flag. `true` enables every category; an array
 *   enables only the listed categories; `false`/`undefined` disables aggregation.
 */
export type AggregationConfig = boolean | ENUM_TOKEN_AGGREGATION_NODE_CATEGORY[];

export type RawTextValue = string | string[];
