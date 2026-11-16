import {
  type SegmentByGranularity,
  type Segments,

  SEGMENT_GRANULARITY,
} from './types.ts';

export const DEFAULT_SEGMENTED_PROPERTIES: string[] = [
  `index`,
  `segment`,
];

export const GRANULARITY_CONFIGS = [ {
  granularity: SEGMENT_GRANULARITY.GRAPHEME,
}, {
  granularity: SEGMENT_GRANULARITY.SENTENCE,
}, {
  granularity: SEGMENT_GRANULARITY.WORD,
  properties: [ `isWordLike` ],
} ];

export function create(id: string) {
  const segmentBy = {} as SegmentByGranularity;

  for (const {
    granularity,
    properties,
  } of GRANULARITY_CONFIGS) {
    const segmenter = new Intl.Segmenter(id, { granularity });

    segmentBy[granularity] = wrap(segmenter, properties ?? []);
  }

  return segmentBy;
}

function wrap(segmenter: Intl.Segmenter, properties: string[] = []) {
  properties.push(...DEFAULT_SEGMENTED_PROPERTIES);

  return function segmentingByGranularity(value: string) {
    return [
      ...segmenter.segment(value),
    ].map((segment) => {
      return properties.reduce((acc, property) => {
        acc[property] = segment[property];

        return acc;
      }, {});
    }) as Segments;
  };
}
