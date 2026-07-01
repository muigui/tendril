import type {
  Segments,
} from '../i18n/index.ts';

import {
  IteratorContext,
} from './iterator-context.ts';

export class SegmentsContext extends IteratorContext<Segments[0]> {
  // get [Symbol.toStringTag]() {
  //   return `TendrilContext(Segments)`;
  // }
}
