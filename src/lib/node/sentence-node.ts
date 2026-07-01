import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

export type SentenceNodeConfig = Omit<ISpanNode,
  | `category`
  | `type`
>;

export class SentenceNode extends SpanNode {
  static new(config: SentenceNodeConfig) {
    return new SentenceNode({
      category: `sentence` as ISpanNode[`category`],
      ...config,
      type: `inline` as ISpanNode[`type`],
    });
  }
}
