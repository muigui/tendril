/** Matches basic emoji (RGI basic emoji set). */
export const REGEX_EMOJI_BASIC = /\p{Basic_Emoji}/gv;
/** Matches extended pictographic characters. */
export const REGEX_EMOJI_EXTENDED = /\p{Extended_Pictographic}/gu;
/** Matches regional-indicator flag sequences. */
export const REGEX_EMOJI_FLAG = /\p{RGI_Emoji_Flag_Sequence}/gv;
/** Matches keycap sequences (e.g. `1️⃣`). */
export const REGEX_EMOJI_KEYCAP = /\p{Emoji_Keycap_Sequence}/gv;
/** Matches skin-tone (modifier) sequences. */
export const REGEX_EMOJI_MOD = /\p{RGI_Emoji_Modifier_Sequence}/gv;
/** Matches characters with a default emoji presentation. */
export const REGEX_EMOJI_PRESENTATION = /\p{Emoji_Presentation}/gu;
/** Matches tag sequences (e.g. subdivision flags). */
export const REGEX_EMOJI_TAG = /\p{RGI_Emoji_Tag_Sequence}/gv;

/**
 * Determines whether a string contains (or is) an emoji.
 *
 * Tests the value against the full family of emoji patterns — basic, extended
 *   pictographic, flag, keycap, modifier, presentation, and tag sequences.
 *
 * @param value - The string to test.
 * @returns `true` when any emoji pattern matches.
 */
export function isEmoji(value: string) {
  return REGEX_EMOJI_BASIC.test(value)
    || REGEX_EMOJI_EXTENDED.test(value)
    || REGEX_EMOJI_FLAG.test(value)
    || REGEX_EMOJI_KEYCAP.test(value)
    || REGEX_EMOJI_MOD.test(value)
    || REGEX_EMOJI_PRESENTATION.test(value)
    || REGEX_EMOJI_TAG.test(value);
}
