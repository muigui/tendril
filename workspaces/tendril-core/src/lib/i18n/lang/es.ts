import {
  configureLanguage,
} from '../configure-language.ts';
import {
  LANGUAGE_DIRECTION,
} from '../types.ts';

/** Spanish (`es`) language configuration: LTR, with its quote and apostrophe rules. */
export default configureLanguage({
  dir: LANGUAGE_DIRECTION.LTR,
  id: `es`,
  quotes: {
    tuples: [
      [ `"`, `"` ],
      [ `'`, `'` ],
      [ `‘`, `’` ],
      [ `“`, `”` ],
      [ `«`, `»` ],
    ],
    tuplesMismatched: [
      [ `"`, `”` ],
      [ `“`, `"` ],
      [ `'`, `’` ],
      [ `‘`, `'` ],
      [ `«`, `"` ],
      [ `"`, `»` ],
      [ `«`, `”` ],
      [ `“`, `»` ],
    ],
  },
});
