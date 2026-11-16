import {
  getLangData,
} from '../i18n/index.ts';

import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

export type ParagraphNodeConfig = Omit<ISpanNode,
  | `category`
  | `type`
>;

export class ParagraphNode extends SpanNode {
  static new(config: ParagraphNodeConfig) {
    const {
      lineSeparator,
    } = getLangData(config.lang);

    return new ParagraphNode({
      category: `paragraph` as ISpanNode[`category`],
      ...config,
      type: `block` as ISpanNode[`type`],
      value: config.value ?? lineSeparator,
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
