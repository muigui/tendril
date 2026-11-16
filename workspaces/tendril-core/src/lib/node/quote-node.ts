import {
  getLangData,
} from '../i18n/index.ts';

import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

export type QuoteNodeConfig = Omit<ISpanNode,
  | `category`
  | `type`
>;

export class QuoteNode extends SpanNode {
  static new(config: QuoteNodeConfig) {
    return new QuoteNode({
      category: `quote` as ISpanNode[`category`],
      ...config,
      type: `unbound` as ISpanNode[`type`],
    });
  }

  end(value?: string) {
    if (typeof value === `undefined`) {
      const lang = this.$ctx?.lang ?? getLangData(this.lang);
      const {
        quotes: {
          tupleMap,
        },
      } = lang;

      value = tupleMap[this.value!][1];
    }

    return super.end(value);
  }
}
