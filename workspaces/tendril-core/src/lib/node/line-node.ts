import {
  getLangData,
} from '../i18n/index.ts';

import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

export type LineNodeConfig = Omit<ISpanNode,
  | `action`
  | `category`
  | `type`
>;

export class LineNode extends SpanNode {
  static new(config: LineNodeConfig) {
    const {
      lineSeparator,
    } = getLangData(config.lang);

    return new LineNode({
      action: `new` as ISpanNode[`action`],
      category: `line` as ISpanNode[`category`],
      value: lineSeparator,
      ...config,
      type: `block` as ISpanNode[`type`],
    });
  }

  constructor(config: ISpanNode) {
    super(config);

    const {
      $ctx,
      lang: langId,
    } = this;
    const lang = $ctx?.lang ?? getLangData(langId);

    if (typeof this.value === `undefined`) {
      this.value = lang.lineSeparator;
    }
  }
}
