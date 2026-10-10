import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardPaste, Plus, Trash2, X } from "lucide-react";
import { blankCard, completeCards, newCardId, parsePastedFlashcards, type EditableCard } from "./flashcard-format";

const MAX_SIDE_CHARS = 1000;

const PASTE_PLACEHOLDER = [
  "One card per line — front, then back:",
  "",
  "molecule - A tiny unit that makes up everything around us.",
  "evaporation: When water gets heated and turns into vapour.",
  "",
  "Copying two columns from Excel / Google Sheets also works.",
].join("\n");

export default function FlashcardEditor({
  cards,
  onChange,
}: {
  cards: EditableCard[];
  onChange: (cards: EditableCard[]) => void;
}) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const frontRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const pasted = useMemo(() => parsePastedFlashcards(pasteText), [pasteText]);

  useEffect(() => {
    if (!focusId) return;
    frontRefs.current[focusId]?.focus();
    setFocusId(null);
  }, [focusId, cards]);

  const update = (id: string, side: "q" | "a", value: string) =>
    onChange(cards.map((c) => (c.id === id ? { ...c, [side]: value.slice(0, MAX_SIDE_CHARS) } : c)));

  const remove = (id: string) => {
    const next = cards.filter((c) => c.id !== id);
    onChange(next.length ? next : [blankCard()]);
  };

  const addCard = () => {
    const card = blankCard();
    onChange([...cards, card]);
    setFocusId(card.id);
  };

  const addPasted = () => {
    if (!pasted.cards.length) return;
    // Replace the untouched starter row instead of leaving a blank card on top.
    const kept = cards.filter((c) => c.q.trim() || c.a.trim());
    onChange([...kept, ...pasted.cards.map((c) => ({ id: newCardId(), q: c.q.slice(0, MAX_SIDE_CHARS), a: c.a.slice(0, MAX_SIDE_CHARS) }))]);
    setPasteText("");
    setPasteOpen(false);
  };

  const filled = completeCards(cards).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-surface-400">
          {filled} card{filled === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setPasteOpen((o) => !o)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-surface-200 px-2.5 text-xs font-bold text-surface-600 transition-colors hover:border-brand-200 hover:text-brand-600 dark:border-surface-700 dark:text-surface-300"
        >
          {pasteOpen ? <X size={13} /> : <ClipboardPaste size={13} />} {pasteOpen ? "Close" : "Paste a list"}
        </button>
      </div>

      {pasteOpen && (
        <div className="space-y-2 rounded-2xl border border-brand-200 bg-brand-50/50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            autoFocus
            placeholder={PASTE_PLACEHOLDER}
            className="w-full rounded-xl border border-surface-200 bg-white p-3 text-sm text-surface-800 outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-surface-500">
              {pasteText.trim()
                ? <>Found <b>{pasted.cards.length}</b> card{pasted.cards.length === 1 ? "" : "s"}
                    {pasted.skipped.length > 0 && <> · <span className="text-amber-600">{pasted.skipped.length} line{pasted.skipped.length === 1 ? "" : "s"} without a front and back were skipped</span></>}
                  </>
                : "Separate the front and back with a tab, dash, colon or comma."}
            </p>
            <button
              type="button"
              onClick={addPasted}
              disabled={!pasted.cards.length}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-600 px-3 text-xs font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
            >
              <Plus size={13} /> Add {pasted.cards.length || ""} card{pasted.cards.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
        {cards.map((c, i) => {
          const incomplete = !!c.q.trim() !== !!c.a.trim();
          return (
            <div key={c.id}
              className={`flex items-start gap-2 rounded-2xl border p-2.5 ${incomplete ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-900/10" : "border-surface-100 dark:border-surface-700"}`}>
              <span className="mt-2 w-6 shrink-0 text-center text-xs font-black text-surface-400">{i + 1}</span>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <textarea
                  ref={(el) => { frontRefs.current[c.id] = el; }}
                  value={c.q}
                  onChange={(e) => update(c.id, "q", e.target.value)}
                  rows={2}
                  aria-label={`Card ${i + 1} front`}
                  placeholder="Front — word or question"
                  className="w-full resize-y rounded-xl border border-surface-200 bg-white p-2 text-sm font-semibold text-surface-800 outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
                />
                <textarea
                  value={c.a}
                  onChange={(e) => update(c.id, "a", e.target.value)}
                  onKeyDown={(e) => {
                    // Enter on the last card's back starts a new card — fast typing flow.
                    if (e.key === "Enter" && !e.shiftKey && i === cards.length - 1 && c.q.trim() && c.a.trim()) {
                      e.preventDefault();
                      addCard();
                    }
                  }}
                  rows={2}
                  aria-label={`Card ${i + 1} back`}
                  placeholder="Back — meaning or answer"
                  className="w-full resize-y rounded-xl border border-surface-200 bg-white p-2 text-sm text-surface-700 outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(c.id)}
                aria-label={`Delete card ${i + 1}`}
                className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-surface-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addCard}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-surface-200 py-2.5 text-sm font-bold text-surface-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-surface-700"
      >
        <Plus size={15} /> Add card
      </button>
    </div>
  );
}
