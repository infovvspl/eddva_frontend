import { describe, expect, it } from "vitest";
import { parseFlashcards, parsePastedFlashcards, serializeFlashcards } from "./flashcard-format";

describe("parseFlashcards", () => {
  it("reads the canonical separate-line format", () => {
    expect(parseFlashcards("**Q:** What is a tide?\n**A:** Ocean water rising and falling.")).toEqual([
      { q: "What is a tide?", a: "Ocean water rising and falling." },
    ]);
  });

  it("still splits the AI same-line format", () => {
    expect(parseFlashcards("**Q:** What is H2O? **A:** Water.\n**Q:** What is ice? **A:** Frozen water.")).toEqual([
      { q: "What is H2O?", a: "Water." },
      { q: "What is ice?", a: "Frozen water." },
    ]);
  });

  it("does not cut a question containing ' A: ' when the answer is on its own line", () => {
    expect(parseFlashcards("**Q:** Vitamin A: where is it found?\n**A:** Carrots.")).toEqual([
      { q: "Vitamin A: where is it found?", a: "Carrots." },
    ]);
  });
});

describe("serializeFlashcards", () => {
  it("round-trips through parseFlashcards", () => {
    const cards = [
      { q: "molecule", a: "A tiny unit that makes up everything around us." },
      { q: "Vitamin A: source?", a: "Carrots\n- also spinach" },
    ];
    expect(parseFlashcards(serializeFlashcards(cards))).toEqual(cards);
  });

  it("joins continuation lines that would be misread as a new card", () => {
    const out = parseFlashcards(serializeFlashcards([{ q: "Pick one", a: "Option 1\nQ: is not a new card\n## nor a heading" }]));
    expect(out).toHaveLength(1);
    expect(out[0].a).toBe("Option 1 Q: is not a new card ## nor a heading");
  });

  it("drops blank and half-empty cards", () => {
    expect(serializeFlashcards([{ q: " ", a: " " }, { q: "x", a: "" }, { q: "a", a: "b" }])).toBe("**Q:** a\n**A:** b");
  });
});

describe("parsePastedFlashcards", () => {
  it("accepts tab, dash, colon and comma separated lines", () => {
    const { cards, skipped } = parsePastedFlashcards(
      "tide\tOcean water rising and falling\nglacier - A huge block of ice\ncomet: An icy object\ntrade, Exchange of goods, services\nno separator here",
    );
    expect(cards).toEqual([
      { q: "tide", a: "Ocean water rising and falling" },
      { q: "glacier", a: "A huge block of ice" },
      { q: "comet", a: "An icy object" },
      { q: "trade", a: "Exchange of goods, services" },
    ]);
    expect(skipped).toEqual(["no separator here"]);
  });

  it("keeps hyphenated words and drops a header row", () => {
    const { cards } = parsePastedFlashcards("Term\tDefinition\nair pressure\tThe force of air — on Earth");
    expect(cards).toEqual([{ q: "air pressure", a: "The force of air — on Earth" }]);
  });

  it("accepts a block already in Q:/A: form", () => {
    expect(parsePastedFlashcards("Q: a\nA: b").cards).toEqual([{ q: "a", a: "b" }]);
  });
});
