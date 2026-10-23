import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { localize } from "./useLocalized";

const dir = join(__dirname, "locales");
const load = (lng: string, file: string) => JSON.parse(readFileSync(join(dir, lng, file), "utf-8"));

const flatten = (obj: unknown, prefix = ""): string[] =>
  obj && typeof obj === "object" && !Array.isArray(obj)
    ? Object.entries(obj).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k))
    : [prefix];

describe("localize", () => {
  const Icon = () => null;
  const data = [
    { id: "a", title: "A", Icon, bullets: ["x", "y"], groups: [{ id: "g", items: [{ name: "n1" }, { name: "n2" }] }] },
    { id: "b", title: "B", Icon },
  ];

  it("overlays text by id and keeps non-text fields", () => {
    const out = localize(data, {
      a: { title: "अ", bullets: ["क", "ख"], groups: { g: { items: [{ name: "एक" }, { name: "दो" }] } } },
    });
    expect(out[0].title).toBe("अ");
    expect(out[0].Icon).toBe(Icon);
    expect(out[0].bullets).toEqual(["क", "ख"]);
    expect(out[0].groups[0].items.map((i) => i.name)).toEqual(["एक", "दो"]);
    expect(out[1]).toBe(data[1]);
  });

  it("falls back to the original when a translation is missing", () => {
    expect(localize(data, undefined)).toBe(data);
    expect(localize(data, {})[0].title).toBe("A");
  });
});

describe("locale files", () => {
  const enFiles = readdirSync(join(dir, "en"));

  it.each(enFiles)("hi/%s has every key present in en", (file) => {
    const hi = new Set(flatten(load("hi", file)));
    const missing = flatten(load("en", file)).filter((k) => !hi.has(k));
    expect(missing).toEqual([]);
  });

  it("every hi file parses", () => {
    for (const f of readdirSync(join(dir, "hi"))) expect(() => load("hi", f)).not.toThrow();
  });
});
