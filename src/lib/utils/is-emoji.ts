export const REGEX_EMOJI_BASIC = /\p{Basic_Emoji}/gv;
export const REGEX_EMOJI_EXTENDED = /\p{Extended_Pictographic}/gu;
export const REGEX_EMOJI_FLAG = /\p{RGI_Emoji_Flag_Sequence}/gv;
export const REGEX_EMOJI_KEYCAP = /\p{Emoji_Keycap_Sequence}/gv;
export const REGEX_EMOJI_MOD = /\p{RGI_Emoji_Modifier_Sequence}/gv;
export const REGEX_EMOJI_PRESENTATION = /\p{Emoji_Presentation}/gu;
export const REGEX_EMOJI_TAG = /\p{RGI_Emoji_Tag_Sequence}/gv;

export function isEmoji(value: string) {
  return REGEX_EMOJI_BASIC.test(value)
    || REGEX_EMOJI_EXTENDED.test(value)
    || REGEX_EMOJI_FLAG.test(value)
    || REGEX_EMOJI_KEYCAP.test(value)
    || REGEX_EMOJI_MOD.test(value)
    || REGEX_EMOJI_PRESENTATION.test(value)
    || REGEX_EMOJI_TAG.test(value);
}
