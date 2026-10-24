import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { toDevanagariDigits } from "./devanagari";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// Separate from the Sarvam translation key (`eddva_lang_preference`, which
// stores region codes like "hi-IN") so the two features never clobber each other.
const STORAGE_KEY = "eddva_ui_lang";

// English namespaces are bundled eagerly; they are the source and fallback.
const enModules = import.meta.glob<Record<string, unknown>>("./locales/en/*.json", { eager: true, import: "default" });
const enResources: Record<string, Record<string, unknown>> = {};
for (const [path, mod] of Object.entries(enModules)) {
  enResources[path.split("/").pop()!.replace(".json", "")] = mod;
}

// Only English ships in the main bundle; other locales load on demand.
const localeLoaders = import.meta.glob<{ default: Record<string, unknown> }>(["./locales/*/*.json", "!./locales/en/*.json"]);

function isSupported(code: string | null): code is LanguageCode {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code);
}

function getStoredLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  return "en";
}

async function loadLocale(lng: LanguageCode) {
  if (lng === "en") return;
  const entries = Object.entries(localeLoaders).filter(([path]) => path.startsWith(`./locales/${lng}/`));
  await Promise.all(
    entries.map(async ([path, load]) => {
      const ns = path.split("/").pop()!.replace(".json", "");
      if (i18n.hasResourceBundle(lng, ns)) return;
      const mod = await load();
      i18n.addResourceBundle(lng, ns, mod.default, true, true);
    }),
  );
}

function applyDocumentLanguage(lng: string) {
  document.documentElement.lang = lng;
}

export async function setLanguage(lng: LanguageCode) {
  await loadLocale(lng);
  await i18n.changeLanguage(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* storage unavailable */
  }
}

// Hindi copy is written with ASCII digits; render them as Devanagari digits.
const devanagariDigits = {
  type: "postProcessor" as const,
  name: "devanagariDigits",
  process: (value: string, _key: unknown, _options: unknown, translator: { language?: string }) =>
    translator.language?.startsWith("hi") ? toDevanagariDigits(value) : value,
};

i18n.use(devanagariDigits).use(initReactI18next).init({
  postProcess: ["devanagariDigits"],
  resources: { en: enResources },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: Object.keys(enResources),
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

i18n.on("languageChanged", applyDocumentLanguage);

/** Resolves once the stored language's bundles are loaded, so first paint is in the right language. */
export const i18nReady: Promise<void> = (async () => {
  const lng = getStoredLanguage();
  if (lng !== "en") {
    await loadLocale(lng);
    await i18n.changeLanguage(lng);
  }
  applyDocumentLanguage(lng);
})().catch(() => undefined);

export default i18n;
