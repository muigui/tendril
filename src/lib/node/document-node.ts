import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

export type DocumentNodeConfig = Omit<ISpanNode,
  | `category`
  | `type`
>;

export class DocumentNode extends SpanNode {
  static new(config: DocumentNodeConfig) {
    return new DocumentNode({
      category: `document` as ISpanNode[`category`],
      ...config,
      type: `block` as ISpanNode[`type`],
    });
  }
}
