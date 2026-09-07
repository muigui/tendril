import {
  getLangData,
} from '../i18n/index.ts';

import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

/** Configuration for {@link ParagraphNode.new} — an {@link ISpanNode} without its fixed `category`/`type`. */
export type ParagraphNodeConfig = Omit<ISpanNode,
  | `category`
  | `type`
>;

/**
 * A paragraph span.
 *
 * A {@link SpanNode} with `category: paragraph` and `type: block`. Its value
 *   defaults to the language's line separator (so a paragraph break renders as a
 *   newline) unless an explicit value is supplied.
 */
export class ParagraphNode extends SpanNode {
  /**
   * Factory for a {@link ParagraphNode}.
   *
   * @param config - The span configuration; `value` defaults to the language's
   *   line separator.
   * @returns A new {@link ParagraphNode} marker.
   */
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

  /**
   * @param config - The span configuration; when no `value` is given it defaults
   *   to the resolved language's line separator.
   */
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
