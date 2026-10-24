import i18n from "./index";
import { toDevanagariDigits } from "./devanagari";

/** Renders ASCII digits as Devanagari digits when the UI language is Hindi. */
export const localizeDigits = (text: string | number): string =>
  i18n.language?.startsWith("hi") ? toDevanagariDigits(String(text)) : String(text);
