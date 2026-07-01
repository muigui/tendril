import type {
  Segments,
} from '../i18n/index.ts';

import {
  IteratorContext,
} from './iterator-context.ts';
import {
  SegmentsContext,
} from './segments-context.ts';

export class LineContext extends IteratorContext<Segments, SegmentsContext> {
  public segments?: SegmentsContext;

  get isEndOfLine() {
    return this.segments?.isLast ?? (this.index > 0 && !this.segments);
  }

  get isStartOfLine() {
    return !this.segments || this.segments?.isFirst;
  }

  async next() {
    return this.segments!;
  }

  protected async beforeNext() {
    this.segments = new SegmentsContext({
      items: this.$curr!,
    });
  }

  protected async onComplete() {
    await super.onComplete();

    this.segments = undefined;
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilContext(Line)`;
  // }
}
