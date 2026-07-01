import {
  configureLanguage,
} from '../configure-language.ts';
import {
  LANGUAGE_DIRECTION,
} from '../types.ts';

export default configureLanguage({
  dir: LANGUAGE_DIRECTION.LTR,
  id: `en`,
  quotes: {
    tuples: [
      [ `"`, `"` ],
      [ `'`, `'` ],
      [ `‘`, `’` ],
      [ `“`, `”` ],
    ],
    tuplesMismatched: [
      [ `"`, `”` ],
      [ `“`, `"` ],
      [ `'`, `’` ],
      [ `‘`, `'` ],
    ],
  },
});
