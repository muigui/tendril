import type {
  ProcessableSegment,
  RawSegment,
} from '../i18n/index.ts';

import type {
  ASTContext,
} from './ast-context.ts';
import {
  IteratorContext,
} from './iterator-context.ts';

export interface SegmentContextConfig {
  index?: number;
  items: ProcessableSegment[];
  parentCtx: ASTContext;
}

export class SegmentContext extends IteratorContext<ProcessableSegment, ProcessableSegment, ASTContext> {
  public isNewLineOnly: boolean;
  public segments?: ProcessableSegment[];

  static new(config: SegmentContextConfig) {
    return new SegmentContext(config);
  }

  constructor(config: SegmentContextConfig) {
    super(config);

    const item = this.items[0];
    const segmenter = this.parentCtx!.segmenter;

    this.isNewLineOnly = false;

    if (!item.isNewLineBreak) {
      this.items = segmenter.segmentSentence(item as RawSegment);
    }
    else {
      this.isNewLineOnly = true;
    }
  }
}
