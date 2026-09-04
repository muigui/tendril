import type {
  Segments,
} from '../i18n/index.ts';

import {
  IteratorContext,
} from './iterator-context.ts';
import {
  SegmentsContext,
} from './segments-context.ts';

/**
 * Mid-level context: an iterable cursor over the sentences of a single line
 *   (paragraph) of the document.
 *
 * Each iteration yields a {@link SegmentsContext} for the current sentence, held
 *   on {@link LineContext.segments | segments} for the duration of that step.
 */
export class LineContext extends IteratorContext<Segments, SegmentsContext> {
  /** The sub-context for the sentence currently being iterated, if any. */
  public segments?: SegmentsContext;

  /** `true` when positioned on the last segment of the last sentence. */
  get isEndOfLine() {
    return this.segments?.isLast ?? (this.index > 0 && !this.segments);
  }

  /** `true` when positioned at the very start of the line. */
  get isStartOfLine() {
    return !this.segments || this.segments?.isFirst;
  }

  /**
   * Yields the {@link SegmentsContext} for the current sentence.
   *
   * @returns A promise resolving to the current sentence's segment context.
   */
  async next() {
    return this.segments!;
  }

  /** Builds a fresh {@link SegmentsContext} for the sentence about to be yielded. */
  protected async beforeNext() {
    this.segments = new SegmentsContext({
      items: this.$curr!,
    });
  }

  /** Resets the cursor and clears the current segment sub-context. */
  protected async onComplete() {
    await super.onComplete();

    this.segments = undefined;
  }
}
