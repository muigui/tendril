import type {
  Segments,
} from '../i18n/index.ts';

import {
  IteratorContext,
} from './iterator-context.ts';

/**
 * Innermost context: an iterable cursor over the individual segments (words,
 *   whitespace, punctuation, …) that make up a single sentence.
 *
 * It adds no behaviour of its own — each iteration simply yields the current
 *   {@link Segments} entry — and exists so the parser has a distinct context
 *   type at the segment level of the document hierarchy.
 */
export class SegmentsContext extends IteratorContext<Segments[0]> {
  // get [Symbol.toStringTag]() {
  //   return `TendrilContext(Segments)`;
  // }
}
