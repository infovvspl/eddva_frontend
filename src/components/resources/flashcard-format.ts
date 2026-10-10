/**
 * Flashcard <-> Markdown format shared by the viewer, the teacher editor and
 * the AI generator. A deck is stored in `study_materials.description` as
 * repeated `**Q:** … / **A:** …` pairs.
 */

export type Flashcard = { q: string; a: string };

/**
 * Parse flashcards from Markdown into { q, a } pairs.
 * Tolerant of the many shapes models emit:
 *   - **Q:** … **A:** …            (same line — the prompt's canonical format)
 *   - Q1: … / A1: …                (numbered, separate lines)
 *   - Question: … / Answer: …      (full words)
 *   - 1. **Question:** … etc.      (list / numbered prefixes, bold markers)
 *   - multi-line questions/answers (continuation lines until the next marker)
 */
export function parseFlashcards(content: string): Flashcard[] {
  if (!content) return [];

  // Strip emphasis markers and carriage returns up front.
  const lines = content.replace(/\r/g, "").replace(/\*\*|__|`/g, "").split("\n");

  // Optional leading list/number prefix, then Q / Question (+ optional number), then a separator.
  const Q = /^\s*(?:[-*•+]\s*)?(?:\d+[.)]\s*)?Q(?:uestion)?\s*\d*\s*[:.)\-–]\s*/i;
  const A = /^\s*(?:[-*•+]\s*)?(?:\d+[.)]\s*)?A(?:nswer)?\s*\d*\s*[:.)\-–]\s*/i;
  // Inline answer marker on the same line — case-sensitive "A"/"Answer" so we don't
  // split on a lowercase "answer:" that appears inside the question text.
  const INLINE_A = /\s+(?:A|Answer)\s*\d*\s*[:.)\-–]\s+/;

  const cards: Flashcard[] = [];
  let q = "";
  let a = "";
  let mode: "none" | "q" | "a" = "none";

  const flush = () => {
    if (q.trim() && a.trim()) cards.push({ q: q.trim(), a: a.trim() });
    q = "";
    a = "";
    mode = "none";
  };

  const nextNonEmpty = (from: number) => {
    for (let j = from; j < lines.length; j++) {
      const l = lines[j].trim();
      if (l) return l;
    }
    return "";
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Skip pure heading / separator lines (e.g. "### Card 3", "---") unless they hold a Q.
    if ((/^#{1,6}\s/.test(line) || /^[-=_]{3,}$/.test(line)) && !Q.test(line)) continue;

    if (Q.test(line)) {
      flush();
      const rest = line.replace(Q, "");
      // Only split on an inline "A:" when the answer isn't on its own line next —
      // otherwise a question like "Vitamin A: where is it found?" gets cut in half.
      const m = A.test(nextNonEmpty(i + 1)) ? null : INLINE_A.exec(rest);
      if (m) {
        q = rest.slice(0, m.index).trim();
        a = rest.slice(m.index + m[0].length).trim();
        mode = "a";
      } else {
        q = rest;
        mode = "q";
      }
    } else if (A.test(line)) {
      a = line.replace(A, "").trim();
      mode = "a";
    } else if (mode === "a") {
      a += "\n" + line;
    } else if (mode === "q") {
      q += "\n" + line;
    }
  }
  flush();
  return cards;
}

/** A continuation line that parseFlashcards would read as a new card, answer or heading. */
const looksLikeMarker = (line: string) => {
  const l = line.replace(/\*\*|__|`/g, "");
  return /^\s*(?:[-*•+]\s*)?(?:\d+[.)]\s*)?(?:Q(?:uestion)?|A(?:nswer)?)\s*\d*\s*[:.)\-–]/i.test(l)
    || /^#{1,6}\s/.test(l)
    || /^[-=_]{3,}$/.test(l);
};

/**
 * Keep a side's line breaks (lists, multi-line answers) but join any line that
 * would be misread as a marker onto the previous one, and drop blank lines —
 * so every card round-trips through parseFlashcards unchanged in meaning.
 */
const safeSide = (s: string) =>
  s.split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .reduce<string[]>((out, l) => {
      if (out.length && looksLikeMarker(l)) out[out.length - 1] += ` ${l}`;
      else out.push(l);
      return out;
    }, [])
    .join("\n");

/** Serialize cards to the stored Markdown format. Blank cards are dropped. */
export function serializeFlashcards(cards: Flashcard[]): string {
  return cards
    .map((c) => ({ q: safeSide(c.q), a: safeSide(c.a) }))
    .filter((c) => c.q && c.a)
    .map((c) => `**Q:** ${c.q}\n**A:** ${c.a}`)
    .join("\n\n");
}

/**
 * Parse a pasted list into cards. Accepts, per line:
 *   term<TAB>definition        (copied from Excel / Google Sheets)
 *   term - definition          (also – and —)
 *   term: definition
 *   term, definition           (CSV)
 * or a whole block already in Q:/A: form.
 * Returns the cards plus the lines that could not be split.
 */
export function parsePastedFlashcards(text: string): { cards: Flashcard[]; skipped: string[] } {
  const structured = parseFlashcards(text);
  if (structured.length) return { cards: structured, skipped: [] };

  const cards: Flashcard[] = [];
  const skipped: string[] = [];
  const separators = [/\t+/, /\s+[-–—]\s+/, /\s*:\s+/, /\s*,\s*/];

  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    let card: Flashcard | null = null;
    for (const sep of separators) {
      const m = sep.exec(line);
      if (!m || m.index === 0) continue;
      const q = line.slice(0, m.index).trim();
      const a = line.slice(m.index + m[0].length).trim().replace(/^"(.*)"$/, "$1");
      if (q && a) { card = { q: q.replace(/^"(.*)"$/, "$1"), a }; break; }
    }
    if (card) cards.push(card);
    else skipped.push(line);
  }

  // Drop a header row such as "Term<TAB>Definition" / "Front,Back".
  if (cards.length && /^(term|word|front|question|q)$/i.test(cards[0].q) && /^(definition|meaning|back|answer|a)$/i.test(cards[0].a)) {
    cards.shift();
  }
  return { cards, skipped };
}

// ── Editor helpers ───────────────────────────────────────────────────────────

/** A card being edited — `id` keeps React keys and focus stable while rows move. */
export type EditableCard = Flashcard & { id: string };

let seq = 0;
export const newCardId = () => `card-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const blankCard = (): EditableCard => ({ id: newCardId(), q: "", a: "" });
export const toEditableCards = (cards: Flashcard[]): EditableCard[] =>
  cards.length ? cards.map((c) => ({ ...c, id: newCardId() })) : [blankCard()];

/** Cards with exactly one side filled in — saving them would silently drop text. */
export const incompleteCardCount = (cards: EditableCard[]) =>
  cards.filter((c) => !!c.q.trim() !== !!c.a.trim()).length;

export const completeCards = (cards: EditableCard[]): Flashcard[] =>
  cards.filter((c) => c.q.trim() && c.a.trim()).map(({ q, a }) => ({ q, a }));
