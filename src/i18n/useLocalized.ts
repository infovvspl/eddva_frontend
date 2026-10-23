import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Tree = unknown;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && Object.getPrototypeOf(v) === Object.prototype;

/**
 * Overlays translated text onto a structural data tree without touching
 * non-text fields (icons, colors, slugs, images).
 *
 * - arrays of objects with an `id`: translation is an object keyed by that id
 * - other arrays (strings, id-less objects): translation is an array matched by index
 * - plain objects: only the keys present in the translation are replaced
 * Anything the translation doesn't cover falls back to the original (English) value.
 */
export function localize<T>(data: T, tr: Tree): T {
  if (tr === undefined || tr === null) return data;

  if (Array.isArray(data)) {
    if (Array.isArray(tr)) {
      const len = Math.max(data.length, tr.length);
      return Array.from({ length: len }, (_, i) => localize(data[i], tr[i])) as unknown as T;
    }
    if (isPlainObject(tr)) {
      return data.map((item) =>
        isPlainObject(item) && typeof item.id === "string" && item.id in tr ? localize(item, tr[item.id]) : item,
      ) as unknown as T;
    }
    return data;
  }

  if (isPlainObject(data) && isPlainObject(tr)) {
    const out: Record<string, unknown> = { ...data };
    for (const key of Object.keys(tr)) out[key] = localize(data[key], tr[key]);
    return out as T;
  }

  if (typeof tr === "string" && (typeof data === "string" || data === undefined)) return tr as unknown as T;
  return data;
}

/**
 * Returns `data` with the current language's translation of namespace `ns`
 * applied. English (or a missing namespace) returns `data` unchanged.
 * `key` selects a sub-tree for single-object data (e.g. a founder profile).
 */
export function useLocalized<T>(ns: string, data: T, key?: string): T {
  const { i18n } = useTranslation();
  const lng = i18n.language;
  return useMemo(() => {
    if (lng === "en") return data;
    const bundle = i18n.getResourceBundle(lng, ns) as Record<string, unknown> | undefined;
    if (!bundle) return data;
    return localize(data, key ? bundle[key] : bundle);
  }, [lng, ns, key, data, i18n]);
}
