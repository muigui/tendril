import type {
  ContextParser,
} from '../parser/index.ts';

/** Registry of the parsers available to a state, keyed by level (`document`, `line`, …). */
export type Parsers = Record<string, ContextParser<unknown>>;

/** Ad-hoc, string-keyed scratch store a state carries during parsing. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TempStateData = Record<string, any>;
/** The value type stored in {@link TempStateData}. */
export type TempStateDataValue = TempStateData[string];
