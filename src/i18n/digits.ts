import i18n from "./index";

const DEVANAGARI_ZERO = 0x0966;

/** Renders ASCII digits as Devanagari digits when the UI language is Hindi. */
export const localizeDigits = (text: string): string =>
  i18n.language?.startsWith("hi")
    ? text.replace(/\d/g, d => String.fromCharCode(DEVANAGARI_ZERO + Number(d)))
    : text;
