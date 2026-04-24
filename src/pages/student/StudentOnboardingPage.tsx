import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Sparkles, ChevronRight, Loader2,
  ArrowRight, CalendarDays, GraduationCap,
} from "lucide-react";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import { useAuthStore } from "@/lib/auth-store";
import { useUpdateStudentProfile } from "@/hooks/use-student";
import { cn } from "@/lib/utils";

// ─── Exam options ─────────────────────────────────────────────────────────────

const EXAMS = [
  {
    key: "jee",
    label: "JEE",
    full: "JEE Main & Advanced",
    emoji: "⚡",
    desc: "Engineering entrance for IITs, NITs & more",
    gradient: "from-orange-400 to-red-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    selected: "border-orange-500 bg-orange-50 ring-2 ring-orange-400/30",
    textColor: "text-orange-600",
  },
  {
    key: "neet",
    label: "NEET",
    full: "NEET UG",
    emoji: "🧬",
    desc: "Medical entrance for MBBS & BDS",
    gradient: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    selected: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/30",
    textColor: "text-emerald-600",
  },
  {
    key: "cbse_10",
    label: "CBSE Class 10",
    full: "CBSE Class 10 Boards",
    emoji: "📚",
    desc: "Secondary board examination",
    gradient: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    selected: "border-blue-500 bg-blue-50 ring-2 ring-blue-400/30",
    textColor: "text-blue-600",
  },
  {
    key: "cbse_12",
    label: "CBSE Class 12",
    full: "CBSE Class 12 Boards",
    emoji: "🎓",
    desc: "Senior secondary board examination",
    gradient: "from-violet-400 to-purple-500",
    bg: "bg-violet-50",
    border: "border-violet-200",
    selected: "border-violet-500 bg-violet-50 ring-2 ring-violet-400/30",
    textColor: "text-violet-600",
  },
];

// ─── Year options ─────────────────────────────────────────────────────────────

function getYearOptions() {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current + i);
}

// ─── Step dot progress ────────────────────────────────────────────────────────

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((s) => (
        <motion.div
          key={s}
          animate={{ width: s === step ? 24 : 8 }}
          className={cn(
            "h-2 rounded-full transition-colors duration-300",
            s < step ? "bg-indigo-500" : s === step ? "bg-indigo-600" : "bg-slate-200"
          )}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentOnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const updateProfile = useUpdateStudentProfile();

  const [step, setStep]               = useState(1);
  const [examTarget, setExamTarget]   = useState("");
  const [examYear, setExamYear]       = useState<number>(getYearOptions()[1]);
  const [generating, setGenerating]   = useState(false);
  const [done, setDone]               = useState(false);

  const selectedExam = EXAMS.find((e) => e.key === examTarget);
  const years = getYearOptions();

  function goToStep2() {
    if (!examTarget) return;
    setStep(2);
  }

  function handleFinish() {
    setGenerating(true);
    updateProfile.mutate(
      { examTarget, examYear },
      {
        onSettled: () => {
          // Mark onboarding as done
          if (user?.id) {
            localStorage.setItem(`student_onboarded_${user.id}`, "1");
          }
          setGenerating(false);
          setDone(true);
          // Redirect after showing the success screen briefly
          setTimeout(() => navigate("/student/study-plan", { replace: true }), 2200);
        },
      }
    );
  }

  // If user skips (has existing examTarget), mark done
  useEffect(() => {
    if (user?.id && localStorage.getItem(`student_onboarded_${user.id}`) === "1") {
      navigate("/student", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 font-poppins flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-300/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-purple-300/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <EddvaLogo className="h-12 w-auto" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

          {/* Progress header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {step === 1 ? "Step 1 of 2 — Exam Goal"
                  : step === 2 ? "Step 2 of 2 — Target Year"
                  : "Setting up your plan"}
              </p>
              <StepDots step={step} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {step === 1 && "Which exam are you preparing for?"}
              {step === 2 && "Which year are you targeting?"}
              {step === 3 && (done ? "Your plan is ready! 🎉" : "Generating your plan…")}
            </h1>
            {step === 1 && (
              <p className="text-sm text-slate-500 mt-1">
                We'll personalise your study plan around your goal.
              </p>
            )}
            {step === 2 && (
              <p className="text-sm text-slate-500 mt-1">
                Knowing your target year helps us pace your study correctly.
              </p>
            )}
          </div>

          {/* Step content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* ── Step 1: Exam selection ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {EXAMS.map((exam) => (
                      <button
                        key={exam.key}
                        onClick={() => setExamTarget(exam.key)}
                        className={cn(
                          "group relative p-4 rounded-2xl border-2 text-left transition-all duration-200",
                          examTarget === exam.key
                            ? exam.selected
                            : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
                        )}
                      >
                        <span className="text-2xl mb-2 block">{exam.emoji}</span>
                        <p className={cn(
                          "font-bold text-sm leading-tight mb-0.5",
                          examTarget === exam.key ? exam.textColor : "text-slate-800"
                        )}>
                          {exam.label}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-snug">{exam.desc}</p>
                        {examTarget === exam.key && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle2 className={cn("w-4 h-4", exam.textColor)} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={goToStep2}
                    disabled={!examTarget}
                    className="mt-6 w-full h-14 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Continue <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* ── Step 2: Year selection ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Show selected exam */}
                  {selectedExam && (
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border",
                      selectedExam.bg, selectedExam.border
                    )}>
                      <span className="text-xl">{selectedExam.emoji}</span>
                      <div>
                        <p className={cn("font-bold text-sm", selectedExam.textColor)}>{selectedExam.full}</p>
                        <button
                          onClick={() => setStep(1)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 underline underline-offset-2"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {years.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setExamYear(yr)}
                        className={cn(
                          "relative py-4 rounded-2xl border-2 font-bold text-lg transition-all duration-200",
                          examYear === yr
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-400/30"
                            : "border-slate-100 bg-white text-slate-700 hover:border-slate-200"
                        )}
                      >
                        {yr}
                        {examYear === yr && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-500 absolute top-2 right-2" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="h-14 px-6 rounded-2xl border-2 border-slate-100 text-slate-600 font-bold hover:border-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => { setStep(3); handleFinish(); }}
                      className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Sparkles className="w-5 h-5" /> Build My Study Plan
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Generation / Done ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="py-8"
                >
                  {!done ? (
                    <div className="flex flex-col items-center gap-6 text-center">
                      {/* Animated ring */}
                      <div className="relative w-24 h-24">
                        <div className="absolute inset-0 rounded-full bg-indigo-50 flex items-center justify-center">
                          <Sparkles className="w-10 h-10 text-indigo-500" />
                        </div>
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                        />
                      </div>
                      <div>
                        <p className="font-extrabold text-lg text-slate-900">Crafting your plan…</p>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">
                          We're curating a personalised schedule for {selectedExam?.full ?? examTarget.toUpperCase()}, targeting {examYear}.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 text-left w-full max-w-xs">
                        {[
                          "Analysing your exam syllabus",
                          "Building subject-wise schedule",
                          "Calibrating daily study hours",
                        ].map((item, i) => (
                          <motion.div
                            key={item}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.4 }}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                            {item}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-5 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                      </motion.div>
                      <div>
                        <p className="font-extrabold text-xl text-slate-900">Plan is ready!</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Your personalised study plan for {selectedExam?.full ?? examTarget.toUpperCase()} is all set.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting to your study plan…
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skip link */}
        {step < 3 && (
          <p className="text-center mt-5 text-sm text-slate-400">
            <button
              onClick={() => {
                if (user?.id) localStorage.setItem(`student_onboarded_${user.id}`, "1");
                navigate("/student", { replace: true });
              }}
              className="hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              Skip for now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
