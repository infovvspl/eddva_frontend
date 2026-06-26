import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import DppContentRenderer from "@/components/DppContentRenderer";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

/**
 * Parse flashcards from AI-generated markdown into { q, a } pairs.
 * Tolerant of the many shapes models emit:
 *   - **Q:** … **A:** …            (same line — the prompt's canonical format)
 *   - Q1: … / A1: …                (numbered, separate lines)
 *   - Question: … / Answer: …      (full words)
 *   - 1. **Question:** … etc.      (list / numbered prefixes, bold markers)
 *   - multi-line questions/answers (continuation lines until the next marker)
 */
function parseFlashcards(content: string): { q: string; a: string }[] {
  if (!content) return [];

  // Strip emphasis markers and carriage returns up front.
  const lines = content.replace(/\r/g, "").replace(/\*\*|__|`/g, "").split("\n");

  // Optional leading list/number prefix, then Q / Question (+ optional number), then a separator.
  const Q = /^\s*(?:[-*•+]\s*)?(?:\d+[.)]\s*)?Q(?:uestion)?\s*\d*\s*[:.)\-–]\s*/i;
  const A = /^\s*(?:[-*•+]\s*)?(?:\d+[.)]\s*)?A(?:nswer)?\s*\d*\s*[:.)\-–]\s*/i;
  // Inline answer marker on the same line — case-sensitive "A"/"Answer" so we don't
  // split on a lowercase "answer:" that appears inside the question text.
  const INLINE_A = /\s+(?:A|Answer)\s*\d*\s*[:.)\-–]\s+/;

  const cards: { q: string; a: string }[] = [];
  let q = "";
  let a = "";
  let mode: "none" | "q" | "a" = "none";

  const flush = () => {
    if (q.trim() && a.trim()) cards.push({ q: q.trim(), a: a.trim() });
    q = "";
    a = "";
    mode = "none";
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Skip pure heading / separator lines (e.g. "### Card 3", "---") unless they hold a Q.
    if ((/^#{1,6}\s/.test(line) || /^[-=_]{3,}$/.test(line)) && !Q.test(line)) continue;

    if (Q.test(line)) {
      flush();
      const rest = line.replace(Q, "");
      const m = INLINE_A.exec(rest);
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

export default function FlashcardViewer({ content }: { content: string }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cards = useMemo(() => parseFlashcards(content), [content]);

  if (cards.length === 0) return <DppContentRenderer content={content} />;

  const card = cards[Math.min(index, cards.length - 1)];

  return (
    <div className="flex flex-col items-center py-4 sm:py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-1.5 w-48 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {index + 1} / {cards.length}
        </span>
      </div>

      <div className="w-full max-w-lg perspective-1000 h-[280px] sm:h-[320px] relative">
        <motion.div
          className="w-full h-full relative cursor-pointer"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => setFlipped(!flipped)}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0 w-full h-full bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-10 shadow-xl flex flex-col items-center justify-center text-center backface-hidden"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 shrink-0">Question</p>
            <div className="flex-1 flex items-center justify-center overflow-y-auto w-full px-2">
              <MarkdownRenderer content={card.q} className="prose-p:my-0 font-bold text-lg text-slate-800 text-center" />
            </div>
            <div className="mt-6 flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase tracking-widest animate-pulse shrink-0">
              <RotateCcw className="w-3.5 h-3.5" /> Tap to reveal answer
            </div>
          </div>

          <div
            className="absolute inset-0 w-full h-full bg-indigo-600 border border-indigo-500 rounded-[2.5rem] p-6 sm:p-10 shadow-xl flex flex-col items-center justify-center text-center backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-4 shrink-0">Correct Answer</p>
            <div className="flex-1 flex items-center justify-center overflow-y-auto w-full px-2">
              <MarkdownRenderer content={card.a} className="prose-p:my-0 font-bold text-lg text-white text-center prose-invert" />
            </div>
            <div className="mt-6 flex items-center gap-2 text-white/60 font-bold text-[10px] uppercase tracking-widest shrink-0">
              <RotateCcw className="w-3.5 h-3.5" /> Tap to flip back
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-4 mt-10">
        <button
          disabled={index === 0}
          onClick={() => { setIndex(index - 1); setFlipped(false); }}
          className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          disabled={index === cards.length - 1}
          onClick={() => { setIndex(index + 1); setFlipped(false); }}
          className="px-8 h-12 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-indigo-600"
        >
          Next Card
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
