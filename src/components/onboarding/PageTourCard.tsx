import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavTourStep, PageFeature } from "./useNavTour";

interface Props {
  step: NavTourStep;
  stepIndex: number;
  totalSteps: number;
  feature: PageFeature;
  featureIndex: number;
  totalFeatures: number;
  onNext: () => void;
  onSkip: () => void;
}

export function PageTourCard({
  step,
  stepIndex,
  totalSteps,
  feature,
  featureIndex,
  totalFeatures,
  onNext,
  onSkip,
}: Props) {
  const Icon = step.icon;
  const isLastFeature = featureIndex === totalFeatures - 1;
  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <div className="fixed bottom-6 right-6 z-[250] pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${stepIndex}-${featureIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pointer-events-auto w-[300px] bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden"
        >
          {/* Step breadcrumb */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                  Step {stepIndex + 1} of {totalSteps}
                </p>
                <p className="text-xs font-bold text-slate-700 leading-snug">{step.title}</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
              title="Skip tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-px bg-slate-100 mx-4" />

          {/* Current feature */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-slate-900">{feature.title}</p>
              <span className="text-[10px] font-semibold text-slate-400">
                {featureIndex + 1} / {totalFeatures}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
          </div>

          {/* Feature progress dots */}
          <div className="flex items-center gap-1 px-4 pb-3 pt-1">
            {Array.from({ length: totalFeatures }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === featureIndex ? "w-4 h-1.5 bg-indigo-600" : "w-1.5 h-1.5 bg-slate-200"
                )}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <button
              onClick={onNext}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {isLastFeature && isLastStep
                ? "Finish Tour ✓"
                : isLastFeature
                ? "Next Section →"
                : (
                  <>
                    Next <ArrowRight className="w-3 h-3" />
                  </>
                )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
