const DEVANAGARI_ZERO = 0x0966;

/** Converts ASCII digits to Devanagari digits unconditionally. */
export const toDevanagariDigits = (text: string): string =>
  text.replace(/\d/g, (d) => String.fromCharCode(DEVANAGARI_ZERO + Number(d)));
