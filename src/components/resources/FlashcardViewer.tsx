import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import DppContentRenderer from "@/components/DppContentRenderer";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { parseFlashcards } from "./flashcard-format";

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
