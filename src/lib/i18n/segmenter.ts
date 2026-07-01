import {
  type SegmentByGranularity,
  type Segments,

  SEGMENT_GRANULARITY,
} from './types.ts';

export const DEFAULT_SEGMENTED_PROPERTIES: string[] = [
  `index`,
  `segment`,
];
/**
 * Granularity configurations used to build wrapped segmenters.
 *
 * @example
 * ```typescript
 * const config = granularityConfigs.find(c =>
 *   c.granularity === ENUM_SEGMENT_GRANULARITY.WORD);
 * ```
 */
export const GRANULARITY_CONFIGS = [ {
  granularity: SEGMENT_GRANULARITY.GRAPHEME,
}, {
  granularity: SEGMENT_GRANULARITY.SENTENCE,
}, {
  granularity: SEGMENT_GRANULARITY.WORD,
  properties: [ `isWordLike` ],
} ];

/**
 * Creates a map of wrapped Intl.Segmenter functions for a locale.
 *
 * @param id - Locale identifier (e.g. 'en')
 * @returns Map of segmentation functions keyed by granularity
 *
 * @example
 * ```typescript
 * const segmentBy = create('en');
 * const words = segmentBy.word('Hello world');
 * ```
 */
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

/**
 * Wraps an Intl.Segmenter instance into a plain object segmenter.
 *
 * @param segmenter - Intl.Segmenter instance
 * @param properties - Segment properties to include in results
 * @returns Function that segments text into plain objects
 */
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
