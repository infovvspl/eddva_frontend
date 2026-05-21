import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MousePointerClick, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavTourStep } from "./useNavTour";

type ArrowDir = "left" | "up";

interface Position {
  top: number;
  left: number;
  arrowDir: ArrowDir;
}

interface Props {
  step: NavTourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

const CARD_W = 268;
const CARD_H = 252;

export function NavTourCard({ step, stepIndex, totalSteps, onNext, onSkip }: Props) {
  const [pos, setPos] = useState<Position | null>(null);

  useEffect(() => {
    function measure() {
      const el = document.querySelector(`[data-tour="nav-${step.navKey}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();

      // If element is near the right edge or top of screen → drop card below it
      const wouldOverflow = r.right + 20 + CARD_W > window.innerWidth - 12;
      const nearTop = r.top < 80;

      if (wouldOverflow || nearTop) {
        const left = Math.max(12, Math.min(r.right - CARD_W, window.innerWidth - CARD_W - 12));
        setPos({ top: r.bottom + 10, left, arrowDir: "up" });
      } else {
        const top = Math.min(
          Math.max(12, r.top + r.height / 2 - CARD_H / 2),
          window.innerHeight - CARD_H - 12
        );
        setPos({ top, left: r.right + 20, arrowDir: "left" });
      }
    }

    const t = setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [step.navKey]);

  if (!pos) return null;

  const Icon = step.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.navKey}
        initial={{ opacity: 0, y: pos.arrowDir === "up" ? -8 : 0, x: pos.arrowDir === "left" ? -8 : 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="fixed z-[250] pointer-events-none"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Arrow */}
        {pos.arrowDir === "left" && (
          <div
            className="absolute -left-[9px] w-4 h-4 rotate-45 bg-white border-l border-b border-slate-200/80"
            style={{ top: CARD_H / 2 - 8 }}
          />
        )}
        {pos.arrowDir === "up" && (
          <div className="absolute -top-[9px] left-5 w-4 h-4 rotate-45 bg-white border-l border-t border-slate-200/80" />
        )}

        <div className="pointer-events-auto w-[268px] bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-3 p-4 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none mb-1">
                Step {stepIndex + 1} of {totalSteps}
              </p>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{step.title}</h3>
            </div>
            <button
              onClick={onSkip}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors shrink-0 -mt-0.5"
              title="Skip tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="px-4 pb-3 text-xs text-slate-500 leading-relaxed">{step.description}</p>

          {/* Click prompt — only when there's a real nav path to click */}
          {step.path && (
            <div className="mx-4 mb-3 flex items-center gap-2 py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <MousePointerClick className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <p className="text-xs font-semibold text-indigo-700">
                Click <span className="font-bold">"{step.label}"</span> in the sidebar
              </p>
            </div>
          )}

          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === stepIndex ? "w-5 h-1.5 bg-indigo-600" : "w-1.5 h-1.5 bg-slate-200"
                  )}
                />
              ))}
            </div>
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Next <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
