import {
  debuglog,
} from 'node:util';

import type {
  RawTextValue,
} from '../../types.ts';

import {
  type ENUM_LINE_SEPARATOR,
  type Language,
  type NewLineBreakSegment,
  type RawSegment,
  type RawSegments,
  type Segments,
  type SentenceSegment,

  LINE_SEPARATOR,
} from '../i18n/index.ts';

const debug = debuglog(`tendril:utils:segment`);

export interface SegmenterConfig {
  lang: Language;
  lineSeparator?: ENUM_LINE_SEPARATOR;
}

export class Segmenter implements SegmenterConfig {
  readonly lang: Language;
  readonly lineSeparator: ENUM_LINE_SEPARATOR;

  static new(config: SegmenterConfig) {
    return new Segmenter(config);
  }

  constructor(config: SegmenterConfig) {
    this.lang = config.lang;
    this.lineSeparator = config.lineSeparator ?? LINE_SEPARATOR.LF;
  }

  segmentSentence(segment: RawSegments[0]) {
    const {
      lang,
    } = this;

    if (segment?.isSentenceLike) {
      return lang.segmentBy.word(segment.segment);
    }

    return [ segment ];
  }

  segmentText(text: RawTextValue) {
    const {
      lang,
    } = this;

    if (Array.isArray(text)) {
      return this.segmentText(lang.joinParagraphs(text));
    }

    const rawSegments = this.getRawSegments(text);

    debug(`####### <rawSegments> #######\n`, rawSegments);

    const segments = this.fixIncorrectlySegmentedSentences(rawSegments);

    debug(`####### <segments> #######\n`, segments);

    const final = this.fixMultipleSentenceSegments(segments);

    debug(`####### <final> #######\n`, final);

    return final;
  }

  protected fixIncorrectlySegmentedSentences(items: RawSegments) {
    const {
      lang,
    } = this;
    const segments: RawSegments = [];

    let i = -1;
    let curr: RawSegments[0];

    // eslint-disable-next-line no-cond-assign
    while (curr = items[++i]) {
      segments.push(curr);

      const next = items[i + 1];
      const nextNext = items[i + 2];
      const prev = items[i - 1];

      if (lang.isListLike(prev, curr, next, nextNext)) {
        curr.segment += next.segment;
        ++i;
      }
      else if (lang.isFragmentedSentenceSegment(prev, curr, next, nextNext)) {
        curr.segment += next.segment;
        ++i;
      }
    }

    return segments;
  }

  protected fixMultipleSentenceSegments(items: RawSegment[]) {
    const segments: RawSegments = [];

    for (const item of items) {
      if (item.isSentenceLike) {
        segments.push(...this.splitMultipleSentences(item));
      }
      else {
        segments.push(item);
      }
    }

    return segments;
  }

  protected getRawSegments(text: string) {
    const {
      lang,
      lineSeparator,
    } = this;
    const rawSegments = lang.segmentBy.sentence(text);
    const segments: RawSegments = [];
    const cache: Segments = [];

    for (let i = 0, len = rawSegments.length; i < len; i++) {
      const curr = rawSegments[i];
      const isNewLineBreak = curr.segment === lineSeparator;

      if (isNewLineBreak) {
        if (cache.length) {
          segments.push({
            index: cache[0].index,
            isSentenceLike: true,
            segment: cache.reduce((acc, { segment }) =>
              `${acc}${segment}`, ``),
          } as SentenceSegment);

          cache.length = 0;

          const segment = segments.at(-1)!;

          if (segment.segment.endsWith(lineSeparator)) {
            segment.segment = segment.segment.slice(0, -1 * lineSeparator.length);

            segments.push({
              index: curr.index - lineSeparator.length,
              isNewLineBreak: true,
              segment: lineSeparator,
            } as NewLineBreakSegment);
          }
        }

        segments.push({
          index: curr.index,
          isNewLineBreak: true,
          segment: lineSeparator,
        } as NewLineBreakSegment);

        continue;
      }

      if (lang.containsSentenceStop(curr.segment)) {
        if (cache.length) {
          cache.push(curr);

          segments.push({
            index: cache[0].index,
            isSentenceLike: true,
            segment: cache.reduce((acc, { segment }) =>
              `${acc}${segment}`, ``),
          } as SentenceSegment);

          cache.length = 0;

          const segment = segments.at(-1)!;

          if (segment.segment.endsWith(lineSeparator)) {
            segment.segment = segment.segment.slice(0, -1 * lineSeparator.length);

            segments.push({
              index: curr.index - lineSeparator.length,
              isNewLineBreak: true,
              segment: lineSeparator,
            } as NewLineBreakSegment);
          }
        }
        else {
          segments.push({
            index: curr.index,
            isSentenceLike: true,
            segment: curr.segment,
          } as SentenceSegment);

          const segment = segments.at(-1)!;

          if (segment.segment.endsWith(lineSeparator)) {
            segment.segment = segment.segment.slice(0, -1 * lineSeparator.length);

            segments.push({
              index: curr.index - lineSeparator.length,
              isNewLineBreak: true,
              segment: lineSeparator,
            } as NewLineBreakSegment);
          }
        }
      }
      else {
        cache.push(curr);
      }
    }

    if (cache.length) {
      segments.push({
        index: cache[0].index,
        isSentenceLike: true,
        segment: cache.reduce((acc, { segment }) =>
          `${acc}${segment}`, ``),
      } as SentenceSegment);

      cache.length = 0;

      const segment = segments.at(-1)!;

      if (segment.segment.endsWith(lineSeparator)) {
        segment.segment = segment.segment.slice(0, -1 * lineSeparator.length);

        segments.push({
          index: segment.index + segment.segment.length,
          isNewLineBreak: true,
          segment: lineSeparator,
        } as NewLineBreakSegment);
      }
    }

    return segments;
  }

  protected splitMultipleSentences(item: RawSegment) {
    const {
      lang,
    } = this;
    const segments: RawSegments = [];
    const { segment } = item;
    const chars = segment.split(``);

    let itemIndex = item.index;

    for (const stop of lang.sentenceStops) {
      if (!chars.length) {
        break;
      }

      const index = segment.indexOf(`${stop} `);

      if (index > -1 && index < segment.length - 2 && segment.charAt(index - 1) !== ` `) {
        const part = chars.splice(0, index + 2).join(``);

        segments.push({
          index: itemIndex,
          isSentenceLike: true,
          segment: part,
        } as SentenceSegment);

        itemIndex += index;
      }
    }

    if (segments.length) {
      if (chars.length) {
        segments.push({
          index: itemIndex,
          isSentenceLike: true,
          segment: chars.join(``),
        } as SentenceSegment);
      }
    }
    else {
      segments.push({
        index: item.index,
        isSentenceLike: true,
        segment,
      } as SentenceSegment);
    }

    if (segments.length > 1) {
      return [ segments[0] ].concat(
        ...segments.slice(1).map(item =>
          this.splitMultipleSentences(item)),
      );
    }

    return segments;
  }
}
