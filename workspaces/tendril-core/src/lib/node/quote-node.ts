import {
  getLangData,
} from '../i18n/index.ts';

import {
  SpanNode,
} from './span-node.ts';
import type {
  ISpanNode,
} from './types.ts';

/** Configuration for {@link QuoteNode.new} — an {@link ISpanNode} without its fixed `category`/`type`. */
export type QuoteNodeConfig = Omit<ISpanNode,
  | `category`
  | `type`
>;

/**
 * A quote span.
 *
 * A {@link SpanNode} with `category: quote` and `type: unbound` — "unbound"
 *   meaning it may overlap block and line boundaries, which is exactly the
 *   overlapping-structure case Tendril's flat AST is designed to represent.
 */
export class QuoteNode extends SpanNode {
  /**
   * Factory for a {@link QuoteNode}.
   *
   * @param config - The span configuration; `value` is the opening quote character.
   * @returns A new {@link QuoteNode} marker.
   */
  static new(config: QuoteNodeConfig) {
    return new QuoteNode({
      category: `quote` as ISpanNode[`category`],
      ...config,
      type: `unbound` as ISpanNode[`type`],
    });
  }

  /**
   * Produces the matching `end` marker, defaulting its value to the *closing*
   *   quote glyph paired with this quote's opening character.
   *
   * @param value - Optional explicit closing value; when omitted, the language's
   *   quote tuple map supplies the correct closing glyph.
   * @returns A new `end`-action {@link QuoteNode}.
   */
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
