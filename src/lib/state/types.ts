import type {
  ContextParser,
} from '../parser/index.ts';

export type Parsers = Record<string, ContextParser<unknown>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TempStateData = Record<string, any>;
export type TempStateDataValue = TempStateData[string];
