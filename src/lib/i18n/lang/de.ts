import {
  configureLanguage,
} from '../configure-language.ts';

import {
  LANGUAGE_DIRECTION,
  // LINE_SEPARATOR,
} from '../types.ts';

/** German (`de`) language configuration: LTR, with its quote and apostrophe rules. */
export default configureLanguage({
  dir: LANGUAGE_DIRECTION.LTR,
  id: `de`,
  // lineSeparator: LINE_SEPARATOR.CRLF,
  quotes: {
    tuples: [
      [ `"`, `"` ],
      [ `'`, `'` ],
      [ `‘`, `’` ],
      [ `“`, `”` ],
      [ `„`, `“` ],
      [ `«`, `»` ],
    ],
    tuplesMismatched: [
      [ `"`, `”` ],
      [ `“`, `"` ],
      [ `'`, `’` ],
      [ `‘`, `'` ],
      [ `„`, `”` ],
    ],
  },
});
