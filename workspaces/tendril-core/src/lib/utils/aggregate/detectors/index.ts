import type {
  AggregationDetector,
} from '../types.ts';

import CARD_NUMBER_DETECTOR from './card-number.ts';
import EMAIL_ADDRESS_DETECTOR from './email-address.ts';
import HASHTAG_DETECTOR from './hashtag.ts';
import PHONE_NUMBER_DETECTOR from './phone-number.ts';
import URL_DETECTOR from './url.ts';
import USERNAME_DETECTOR from './username.ts';

export const DETECTORS: AggregationDetector[] = [
  URL_DETECTOR,
  EMAIL_ADDRESS_DETECTOR,
  USERNAME_DETECTOR,
  HASHTAG_DETECTOR,
  CARD_NUMBER_DETECTOR,
  PHONE_NUMBER_DETECTOR,
];
