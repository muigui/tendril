import {
  configureLanguage,
} from '../configure-language.ts';
import {
  LANGUAGE_DIRECTION,
} from '../types.ts';

/** French (`fr`) language configuration: LTR, with its quote and apostrophe rules. */
export default configureLanguage({
  dir: LANGUAGE_DIRECTION.LTR,
  id: `fr`,
  quotes: {
    tuples: [
      [ `"`, `"` ],
      [ `'`, `'` ],
      [ `‘`, `’` ],
      [ `“`, `”` ],
      [ `«`, `»` ],
      [ `‹`, `›` ],
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
      [ `‹`, `›` ],
      [ `«`, `›` ],
      [ `‹`, `»` ],
    ],
  },
});
