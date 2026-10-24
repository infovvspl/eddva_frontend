import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, Highlighter, ListTodo, StickyNote, Trash2, X } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { useIsCompactLayout } from "@/hooks/use-mobile";
import type { NotesView } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";
import {
  formatSolutionSteps,
  mdClassBase,
  normalizeLessonMarkdown,
  NotesFlashcard,
  PracticeCard,
  type InlineComment,
  type SavedHighlight,
} from "./notes-parts";

const COLORS = ["#fef08a", "#bfdbfe", "#bbf7d0", "#fecaca", "#e9d5ff"];
const SAVE_DELAY_MS = 1200;

export interface NotesUpdate {
  highlights?: SavedHighlight[];
  inlineComments?: InlineComment[];
  lastAnchor?: { offsetPct: number } | null;
}

interface AiNotesPanelProps {
  notes: NotesView;
  /** Ask the AI about something in the notes (answered in the chat). */
  onAsk: (question: string) => void;
  /** Saves highlights, comments and the reading position (called debounced). */
  onSave: (update: NotesUpdate) => void;
  /** The scrolling element the notes sit in; the reading position is kept against it. */
  scrollRef: RefObject<HTMLElement>;
  /** Scroll to this subtopic's part of the lesson when opened from the mind map. */
  focusSubtopic?: string | null;
  footer?: ReactNode;
}

/**
 * AI notes with the student's own study tools: highlights, inline comments,
 * flashcards and practice questions. Same features as the original study
 * page; highlights and comments are kept on the server, so they follow the
 * student across devices.
 */
export function AiNotesPanel({ notes, onAsk, onSave, scrollRef, focusSubtopic, footer }: AiNotesPanelProps) {
  const isCompact = useIsCompactLayout();
  const [zoom, setZoom] = useState<"sm" | "md" | "lg">("md");
  const [highlights, setHighlights] = useState<SavedHighlight[]>(notes.highlights ?? []);
  const [comments, setComments] = useState<InlineComment[]>(notes.inlineComments ?? []);
  const [color, setColor] = useState(COLORS[0]);
  const [draft, setDraft] = useState("");
  const [tool, setTool] = useState<"highlights" | "notes" | null>(null);
  const [openBubble, setOpenBubble] = useState<string | null>(null);
  const [cards, setCards] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [doubt, setDoubt] = useState("");
  const [selectionReady, setSelectionReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const savedText = useRef("");
  const pendingSave = useRef<NotesUpdate>({});
  const saveTimer = useRef<number | null>(null);

  const markdown = useMemo(() => formatSolutionSteps(normalizeLessonMarkdown(notes.lessonMarkdown ?? "")), [notes.lessonMarkdown]);
  const zoomClass =
    zoom === "sm"
      ? "prose-h2:text-2xl prose-h3:text-base prose-p:text-sm prose-ul:text-sm prose-code:text-[12px]"
      : zoom === "lg"
        ? "prose-h2:text-4xl prose-h3:text-xl prose-p:text-lg prose-ul:text-lg prose-code:text-[15px]"
        : "prose-h2:text-3xl prose-h3:text-lg prose-p:text-base prose-ul:text-base prose-code:text-[13px]";

  // ── Saving (debounced, merged) ──
  const queueSave = useCallback(
    (update: NotesUpdate) => {
      pendingSave.current = { ...pendingSave.current, ...update };
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        const body = pendingSave.current;
        pendingSave.current = {};
        onSave(body);
      }, SAVE_DELAY_MS);
    },
    [onSave],
  );
  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      if (Object.keys(pendingSave.current).length) onSave(pendingSave.current); // flush on leave
    },
    [onSave],
  );

  // ── Reading position: restore once, then keep it as the student scrolls ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = focusSubtopic
      ? Array.from(contentRef.current?.querySelectorAll("h2, h3, h4") ?? []).find((h) =>
          h.textContent?.toLowerCase().includes(focusSubtopic.toLowerCase()),
        )
      : null;
    if (target) target.scrollIntoView({ block: "start" });
    else if (notes.lastAnchor?.offsetPct) el.scrollTop = (notes.lastAnchor.offsetPct / 100) * (el.scrollHeight - el.clientHeight);
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0) queueSave({ lastAnchor: { offsetPct: Math.round((el.scrollTop / max) * 1000) / 10 } });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes.sessionId]);

  // ── Selection capture for highlights and comments ──
  useEffect(() => {
    const onSelection = () => {
      const sel = window.getSelection();
      const root = contentRef.current;
      if (!sel || !root || sel.rangeCount === 0 || sel.isCollapsed) return;
      if (sel.anchorNode && root.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
        savedText.current = sel.toString().trim().replace(/\s+/g, " ");
        setSelectionReady(!!savedText.current);
      }
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    savedRange.current = null;
    savedText.current = "";
    setSelectionReady(false);
  };

  const addHighlight = () => {
    const text = savedText.current;
    if (!text) return;
    const next = [{ text, color }, ...highlights].slice(0, 30);
    setHighlights(next);
    queueSave({ highlights: next });
    clearSelection();
  };

  const addComment = () => {
    const text = draft.trim();
    const range = savedRange.current;
    const root = contentRef.current;
    if (!text || !range || !root) return;
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    const end = rects[rects.length - 1] ?? range.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const comment: InlineComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      quote: savedText.current,
      top: Math.max(0, end.top - box.top + end.height / 2),
      left: Math.max(0, Math.min(end.right - box.left + 6, root.clientWidth - 36)),
    };
    const next = [comment, ...comments].slice(0, 50);
    setComments(next);
    queueSave({ inlineComments: next });
    setDraft("");
    clearSelection();
  };

  const removeHighlight = (index: number) => {
    const next = highlights.filter((_, i) => i !== index);
    setHighlights(next);
    queueSave({ highlights: next });
  };
  const removeComment = (id: string) => {
    const next = comments.filter((c) => c.id !== id);
    setComments(next);
    queueSave({ inlineComments: next });
    if (openBubble === id) setOpenBubble(null);
  };

  const practice = notes.practiceQuestions ?? [];
  const toolButton = (active: boolean, tone: string) =>
    cn("inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
      active ? tone : "border-border bg-card text-muted-foreground hover:bg-muted");

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Study toolkit */}
      <aside className="space-y-3 lg:sticky lg:top-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Study toolkit</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setTool((t) => (t === "highlights" ? null : "highlights"))}
              className={toolButton(tool === "highlights", "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300")}>
              <Highlighter className="size-3.5" /> Highlight
            </button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setTool((t) => (t === "notes" ? null : "notes"))}
              className={toolButton(tool === "notes", "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300")}>
              <StickyNote className="size-3.5" /> Comment
            </button>
            <button type="button" onClick={() => { setCardIndex(0); setFlipped(false); setCards(true); }} className={toolButton(false, "")}>
              <Brain className="size-3.5" /> Cards
            </button>
          </div>

          {tool === "highlights" && (
            <div className="mt-4 space-y-3" onMouseDown={(e) => e.preventDefault()}>
              <p className="text-xs leading-5 text-muted-foreground">Select text in the notes, pick a colour, then save it.</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Highlight colour ${c}`}
                    className={cn("size-7 rounded-full border-2", color === c ? "scale-110 border-foreground" : "border-transparent")} style={{ backgroundColor: c }} />
                ))}
              </div>
              <button type="button" onClick={addHighlight} disabled={!selectionReady}
                className="w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                Save highlight
              </button>
              <ul className="space-y-1.5">
                {highlights.length === 0 && <li className="text-xs text-muted-foreground">No highlights yet.</li>}
                {highlights.map((h, i) => (
                  <li key={`${h.text}-${i}`} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-800" style={{ backgroundColor: h.color }}>
                    <span className="flex-1">{h.text}</span>
                    <button type="button" onClick={() => removeHighlight(i)} aria-label="Delete highlight"><Trash2 className="size-3.5" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tool === "notes" && (
            <div className="mt-4 space-y-3">
              <p className="text-xs leading-5 text-muted-foreground">Select a line in the notes and add your own reminder to it.</p>
              {selectionReady && (
                <p className="rounded-lg border border-border bg-muted px-2 py-1.5 text-[11px] italic text-muted-foreground">
                  “{savedText.current.slice(0, 120)}{savedText.current.length > 120 ? "…" : ""}”
                </p>
              )}
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={1000} placeholder="Write your comment…"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addComment} disabled={!draft.trim() || !selectionReady}
                className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                Add comment
              </button>
              <ul className="space-y-1.5">
                {comments.length === 0 && <li className="text-xs text-muted-foreground">No comments yet.</li>}
                {comments.map((c) => (
                  <li key={c.id} className="relative rounded-lg border border-border bg-background px-2 py-2 pr-7 text-xs">
                    <p className="truncate font-semibold text-foreground">{c.quote}</p>
                    <p className="mt-0.5 text-muted-foreground">{c.text}</p>
                    <button type="button" onClick={() => removeComment(c.id)} aria-label="Delete comment" className="absolute right-2 top-2 text-muted-foreground hover:text-rose-500">
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!tool && <p className="mt-3 text-xs leading-5 text-muted-foreground">Your highlights and comments are saved, so they are here whenever you come back.</p>}
        </div>
        {footer}
      </aside>

      {/* Lesson */}
      <div className="min-w-0 space-y-5">
        <article className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-slate-900">
              <BookOpen className="size-5" />
              <h2 className="text-lg font-bold">{notes.round > 1 ? `Focused notes · Round ${notes.round}` : "Revision notes"}</h2>
            </div>
            <div className="flex items-center gap-1.5" role="group" aria-label="Text size">
              {(["sm", "md", "lg"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setZoom(s)} aria-pressed={zoom === s}
                  className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold", zoom === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {notes.focusConcepts?.length > 0 && (
            <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              These notes focus on what you found hard: <strong>{notes.focusConcepts.join(", ")}</strong>.
            </p>
          )}
          <div className="relative">
            {openBubble && <div className="fixed inset-0 z-10" onClick={() => setOpenBubble(null)} />}
            <div ref={contentRef} className={cn("relative select-text rounded-2xl text-slate-800 selection:bg-blue-100", zoomClass, mdClassBase)}>
              {!isCompact &&
                comments.map((c) => (
                  <div key={c.id} className="absolute z-20" style={{ top: c.top, left: c.left, transform: "translateY(-50%)" }}>
                    <button type="button" onClick={() => setOpenBubble((v) => (v === c.id ? null : c.id))} title={c.text}
                      className={cn("flex size-7 items-center justify-center rounded-full border shadow-sm", openBubble === c.id ? "border-blue-300 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600")}>
                      <StickyNote className="size-3.5" />
                    </button>
                    {openBubble === c.id && (
                      <div className="absolute left-9 top-1/2 z-30 w-60 -translate-y-1/2 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-xl">
                        {c.quote && <p className="line-clamp-2 border-b border-slate-100 px-3 py-2 text-xs italic text-slate-500">“{c.quote}”</p>}
                        <p className="px-3 py-2 text-sm text-slate-800">{c.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              {markdown ? <MarkdownRenderer content={markdown} highlights={highlights} /> : <p className="py-16 text-center text-sm text-slate-400">No notes yet.</p>}
            </div>
          </div>
        </article>

        {practice.length > 0 && (
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
              <ListTodo className="size-5 text-indigo-500" /> Practice questions
            </h3>
            {practice.map((q, i) => (
              <PracticeCard key={`${q.question}-${i}`} q={q as any} index={i} onAskAI={(question) => onAsk(`Explain this practice question step by step: "${question}"`)} />
            ))}
          </section>
        )}
      </div>

      {/* Flashcards */}
      <AnimatePresence>
        {cards && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setCards(false)}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }} className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative rounded-3xl border border-border bg-card p-6 shadow-2xl">
                <button type="button" onClick={() => setCards(false)} aria-label="Close" className="absolute right-4 top-4 rounded-lg bg-muted p-2 text-muted-foreground">
                  <X className="size-4" />
                </button>
                <h3 className="flex items-center gap-2 text-lg font-bold text-foreground"><Brain className="size-5 text-emerald-500" /> Flashcards</h3>
                {practice.length === 0 ? (
                  <p className="py-14 text-center text-sm text-muted-foreground">No flashcards for this topic yet.</p>
                ) : (
                  (() => {
                    const total = practice.length;
                    const i = Math.min(cardIndex, total - 1);
                    const card = practice[i];
                    return (
                      <div className="mt-4">
                        <p className="mb-3 text-xs font-medium text-muted-foreground">Card {i + 1} of {total}</p>
                        <NotesFlashcard question={card.question} answer={card.answer} explanation={card.explanation} flipped={flipped} onToggle={() => setFlipped((f) => !f)} />
                        <div className="mt-5 flex gap-3">
                          <button type="button" disabled={total <= 1} onClick={() => { setFlipped(false); setCardIndex((x) => (x - 1 + total) % total); }}
                            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-40">Previous</button>
                          <button type="button" disabled={total <= 1} onClick={() => { setFlipped(false); setCardIndex((x) => (x + 1) % total); }}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                            Next <ArrowRight className="size-4" />
                          </button>
                        </div>
                        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const q = doubt.trim(); if (!q) return; onAsk(q); setDoubt(""); setCards(false); }}>
                          <input value={doubt} onChange={(e) => setDoubt(e.target.value)} placeholder="Ask a doubt (answered in the chat)…" maxLength={2000}
                            className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
                          <button type="submit" disabled={!doubt.trim()} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Ask</button>
                        </form>
                      </div>
                    );
                  })()
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
