/**
 * Sarvam AI Translation API
 * Model: mayura:v1 (supports 22 Indian languages)
 * Docs: https://docs.sarvam.ai
 */

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY as string;
const SARVAM_URL = "https://api.sarvam.ai/translate";
const LANG_KEY = "apexiq_lang_preference";

export interface IndianLanguage {
  code: string;
  label: string;
  native: string;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  { code: "en-IN", label: "English",   native: "English"    },
  { code: "hi-IN", label: "Hindi",     native: "हिंदी"       },
  { code: "bn-IN", label: "Bengali",   native: "বাংলা"      },
  { code: "te-IN", label: "Telugu",    native: "తెలుగు"     },
  { code: "ta-IN", label: "Tamil",     native: "தமிழ்"      },
  { code: "mr-IN", label: "Marathi",   native: "मराठी"      },
  { code: "gu-IN", label: "Gujarati",  native: "ગુજરાતી"    },
  { code: "kn-IN", label: "Kannada",   native: "ಕನ್ನಡ"      },
  { code: "ml-IN", label: "Malayalam", native: "മലയാളം"     },
  { code: "pa-IN", label: "Punjabi",   native: "ਪੰਜਾਬੀ"    },
  { code: "od-IN", label: "Odia",      native: "ଓଡ଼ିଆ"      },
];

export function getStoredLanguage(): string {
  try { return localStorage.getItem(LANG_KEY) || "en-IN"; } catch { return "en-IN"; }
}

export function storeLanguage(code: string): void {
  try { localStorage.setItem(LANG_KEY, code); } catch {}
}

/** Translate a single text. Returns original on English target or empty input. */
export async function sarvamTranslate(
  text: string,
  targetLang: string,
  sourceLang = "en-IN",
): Promise<string> {
  if (!text.trim() || targetLang === "en-IN" || targetLang === sourceLang) return text;

  const res = await fetch(SARVAM_URL, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceLang,
      target_language_code: targetLang,
      model: "mayura:v1",
      enable_preprocessing: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Sarvam [${res.status}]: ${await res.text().catch(() => "")}`);
  }
  const data = await res.json();
  return data.translated_text || text;
}

/**
 * Translate multiple short strings in parallel.
 * Falls back to original text for any that fail.
 */
export async function sarvamTranslateMany(
  texts: string[],
  targetLang: string,
  sourceLang = "en-IN",
): Promise<string[]> {
  if (targetLang === "en-IN" || targetLang === sourceLang) return texts;
  const results = await Promise.allSettled(
    texts.map((t) => sarvamTranslate(t, targetLang, sourceLang)),
  );
  return results.map((r, i) => (r.status === "fulfilled" ? r.value : texts[i]));
}
