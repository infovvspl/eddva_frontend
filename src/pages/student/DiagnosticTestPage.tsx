/**
 * DiagnosticTestPage
 *
 * Mandatory first-login diagnostic test for students.
 * Flow:  INFO → LOADING → QUIZ → SUBMITTING → RESULTS → STUDY PLAN (backend auto-generates)
 *
 * Back button is disabled during the quiz. The test cannot be skipped.
 * On completion the backend marks student.diagnosticCompleted = true.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Clock, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertTriangle, Flame,
  BarChart3, Sparkles, BookOpen, Target, Brain,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { patchDiagnosticCompleted } from "@/lib/auth-store";
import {
  generateDiagnosticSession, submitAnswer,
  submitSession,
} from "@/lib/api/student";
import type { QuizQuestion, TestSession, SessionResult } from "@/lib/api/student";
import { toast } from "sonner";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "info" | "loading" | "quiz" | "submitting" | "results" | "generating_plan";

// ─── Countdown Timer Hook ─────────────────────────────────────────────────────

function useTimer(initialSeconds: number, onExpire: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const cbRef = useRef(onExpire);
  cbRef.current = onExpire;

  useEffect(() => {
    if (seconds <= 0) { cbRef.current(); return; }
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const reset = (s: number) => setSeconds(s);
  return { seconds, reset };
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Info Screen ──────────────────────────────────────────────────────────────

function InfoScreen({ batchName, onStart }: { batchName: string; onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#F5F7FB" }}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50 -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] opacity-40 -z-10 -translate-x-1/2 translate-y-1/2" style={{ background: BLUE_L }} />

      <div className="w-full max-w-lg">
        {/* Icon */}
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border" style={{ background: BLUE_L, borderColor: `${BLUE}20` }}>
          <ClipboardList className="w-12 h-12" style={{ color: BLUE }} />
        </div>

        <h1 className="text-3xl font-black text-gray-900 text-center mb-2 tracking-tight">
          Diagnostic Test
        </h1>
        <p className="text-center text-gray-500 font-bold mb-10">
          Before you start, let's understand your level
        </p>

        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6 mb-8 relative">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-inner">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <div className="pt-1">
              <p className="font-black text-gray-900 text-base">AI-generated for your syllabus</p>
              <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">
                Questions are automatically created from <span className="text-gray-900 font-black bg-gray-50 px-1 rounded">{batchName || "your batch"}</span> topics — no teacher setup needed
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-50" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 shadow-inner">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="pt-1">
              <p className="font-black text-gray-900 text-base">~20 minutes · AI-adaptive</p>
              <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">Difficulty adjusts as you answer to find your true level</p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-50" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-violet-500" />
            </div>
            <div className="pt-1">
              <p className="font-black text-gray-900 text-base">Unlocks your AI study plan</p>
              <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">Results build your personalised 30-day schedule</p>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-4 py-3 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-600">
                This test is mandatory. You cannot skip or go back during the test.
              </p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}
        >
          Start Diagnostic Test 🧪
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: string[];
  onSelect: (optionId: string) => void;
}) {
  const isInteger = question.type === "integer";
  const [intVal, setIntVal] = useState("");
  useEffect(() => { setIntVal(""); }, [question.id]);

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-black px-3 py-1 rounded-xl" style={{ background: BLUE_L, color: BLUE }}>
            Q{index + 1} / {total}
          </span>
          <span className="text-xs font-bold text-gray-400 capitalize bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{question.difficulty}</span>
          {"topic" in question && question.topic && (
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 truncate max-w-[150px]">{question.topic.name}</span>
          )}
        </div>
        <p className="text-base font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">{question.content}</p>
      </div>

      {isInteger ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 block text-center">Type your integer answer</label>
          <input
            type="number" value={intVal}
            onChange={e => { setIntVal(e.target.value); onSelect(e.target.value); }}
            placeholder="0"
            className="w-full max-w-xs mx-auto block bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-3xl font-black text-gray-900 text-center focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-300"
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {question.options?.map(opt => {
            const isSelected = selected.includes(opt.id);
            return (
              <motion.button
                whileHover={!isSelected ? { scale: 1.01 } : {}} whileTap={{ scale: 0.99 }}
                key={opt.id} onClick={() => onSelect(opt.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all
                  ${isSelected ? "shadow-md" : "bg-white border-gray-100 text-gray-800 hover:border-blue-200"}`}
                style={isSelected ? { background: BLUE_L, borderColor: BLUE, color: BLUE } : {}}
              >
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-black border-2 transition-colors
                  ${isSelected ? "border-transparent" : "border-gray-200 text-gray-500"}`}
                  style={isSelected ? { background: BLUE, color: "#fff" } : {}}>
                  {opt.optionLabel}
                </div>
                <span className="text-sm font-medium leading-relaxed flex-1">{opt.content}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  result,
  onContinue,
}: {
  result: SessionResult;
  onContinue: () => void;
}) {
  const accuracy = result.accuracy ?? (result.totalCorrect / Math.max(result.totalCorrect + result.totalWrong, 1)) * 100;
  const eb = result.errorBreakdown;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F5F7FB" }}
    >
      <div className="w-full max-w-lg bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 mx-auto flex items-center justify-center mb-4 shadow-sm relative">
            <CheckCircle className="w-10 h-10 text-emerald-500 relative z-10" />
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl blur-xl opacity-50 z-0" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Diagnostic Complete!</h1>
          <p className="text-gray-400 font-bold mt-2">Here's how you performed</p>
        </div>

        {/* Score ring */}
        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 mb-6 flex items-center gap-6 shadow-inner">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle cx="48" cy="48" r="40" fill="none"
                stroke={accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444"}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - accuracy / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-gray-900">{accuracy.toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-3xl font-black text-gray-900 mb-1">{result.totalScore}</p>
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Total Points</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                <CheckCircle className="w-3 h-3" />{result.totalCorrect}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                <XCircle className="w-3 h-3" />{result.totalWrong}
              </span>
              {result.totalSkipped > 0 && <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">{result.totalSkipped} skip</span>}
            </div>
          </div>
        </div>

        {/* Error breakdown */}
        {eb && result.totalWrong > 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <p className="text-base font-black text-gray-900">Error Analysis</p>
            </div>
            <div className="space-y-3">
              {[
                { key: "conceptual", label: "Concept gaps",   color: "#ef4444" },
                { key: "silly",      label: "Silly mistakes", color: "#f59e0b" },
                { key: "time",       label: "Time pressure",  color: "#6366f1" },
                { key: "guess",      label: "Guessed",        color: "#8b5cf6" },
              ].map(({ key, label, color }) => {
                const val = (eb as any)[key] ?? 0;
                const pct = result.totalWrong > 0 ? (val / result.totalWrong) * 100 : 0;
                if (!val) return null;
                return (
                  <div key={key}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-500">{label}</span>
                      <span className="text-xs font-black text-gray-900">{val}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI study plan */}
        <div className="bg-violet-50 border-2 border-violet-100 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-white border border-violet-200 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5 text-violet-500" />
          </div>
          <div className="pt-0.5">
             <p className="text-sm font-black text-gray-900 mb-1">Study Plan Generated!</p>
             <p className="text-[13px] font-medium text-gray-600 leading-relaxed">
               AI has built your personalised 30-day schedule based on these exact results.
             </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}
        >
          View My Study Plan <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiagnosticTestPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const authState   = useAuthStore();
  const student     = authState.user?.studentProfile;
  const batchId     = student?.batchId ?? "";

  const [stage, setStage]           = useState<Stage>("info");
  const [session, setSession]       = useState<TestSession | null>(null);
  const [questions, setQuestions]   = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ]     = useState(0);
  const [answers, setAnswers]       = useState<Record<string, string[]>>({}); // questionId → selectedOptionIds
  const [result, setResult]         = useState<SessionResult | null>(null);
  const [error, setError]           = useState("");
  const [batchName, setBatchName]   = useState("");

  const durationMinutes = 20;

  // ── Timer ────────────────────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    if (stage === "quiz" && session) {
      handleSubmit(true);
    }
  }, [stage, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const { seconds } = useTimer(durationMinutes * 60, handleTimeUp);

  // ── Disable browser back button during quiz ──────────────────────────────
  useEffect(() => {
    if (stage !== "quiz") return;
    const preventBack = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventBack);
    return () => window.removeEventListener("popstate", preventBack);
  }, [stage]);

  // ── Start: auto-generate diagnostic from question bank ───────────────────
  const handleStart = async () => {
    setStage("loading");
    setError("");
    try {
      const result = await generateDiagnosticSession();

      if (result.alreadyCompleted) {
        // Diagnostic already done — sync state and redirect to study plan
        patchDiagnosticCompleted(useAuthStore.getState());
        queryClient.setQueryData(authKeys.me, (prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            studentProfile: prev.studentProfile
              ? { ...prev.studentProfile, diagnosticCompleted: true }
              : null,
          };
        });
        navigate("/student/study-plan");
        return;
      }

      const sess = result.session!;
      setBatchName(sess.mockTest?.title ?? "Diagnostic Test");
      setSession(sess);
      setQuestions(sess.questions ?? []);
      setStage("quiz");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to start diagnostic. Please try again.";
      setError(msg);
      setStage("info");
    }
  };

  // ── Select answer ────────────────────────────────────────────────────────
  const handleSelectOption = async (optionId: string) => {
    const q = questions[currentQ];
    if (!q || !session) return;

    const isMulti   = q.type === "mcq_multi";
    const isInteger = q.type === "integer";

    let next: string[];
    if (isInteger) {
      next = [optionId]; // raw number string
    } else if (isMulti) {
      const prev = answers[q.id] ?? [];
      next = prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId];
    } else {
      next = [optionId];
    }

    setAnswers(a => ({ ...a, [q.id]: next }));

    // Fire-and-forget answer submission
    try {
      await submitAnswer(session.id, {
        questionId: q.id,
        selectedOptionIds: isInteger ? undefined : next,
        integerResponse: isInteger ? optionId : undefined,
      });
    } catch {
      // non-critical — answers are saved on submit too
    }
  };

  // ── Navigate questions ────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(i => i + 1);
    } else {
      handleSubmit(false);
    }
  };

  // ── Submit test ───────────────────────────────────────────────────────────
  const handleSubmit = async (timedOut: boolean) => {
    if (!session) return;
    if (timedOut) toast.warning("Time's up! Submitting your answers...");
    setStage("submitting");
    try {
      const res = await submitSession(session.id);
      setResult(res);
      // Backend marks diagnosticCompleted = true — patch local store immediately
      patchDiagnosticCompleted(useAuthStore.getState());
      // Sync the React Query /me cache directly
      queryClient.setQueryData(authKeys.me, (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          studentProfile: prev.studentProfile
            ? { ...prev.studentProfile, diagnosticCompleted: true }
            : null,
        };
      });
      setStage("results");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to submit. Please try again.";
      toast.error(msg);
      setStage("quiz");
    }
  };

  // ── Navigate to study plan ────────────────────────────────────────────────
  const handleViewPlan = () => {
    navigate("/student/study-plan");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (stage === "info") {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl px-5 py-4 flex items-center gap-2 shadow-sm">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
        )}
        <InfoScreen batchName={batchName} onStart={handleStart} />
      </>
    );
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#F5F7FB" }}>
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-white border border-gray-100 flex items-center justify-center shadow-sm z-10 relative">
             <Loader2 className="w-10 h-10 animate-spin" style={{ color: BLUE }} />
             <Sparkles className="w-6 h-6 text-violet-400 absolute -top-3 -right-3 animate-pulse drop-shadow-md" />
          </div>
          <div className="absolute inset-0 bg-blue-100 rounded-3xl animate-ping opacity-50 z-0" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-black text-xl mb-1 mt-2">Building diagnostic test...</p>
          <p className="text-gray-500 font-bold text-sm">AI is generating personalised questions from your syllabus</p>
        </div>
      </div>
    );
  }

  if (stage === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: "#F5F7FB" }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: BLUE }} />
        <p className="text-gray-500 font-black tracking-widest uppercase text-xs mt-2">Analysing your answers...</p>
      </div>
    );
  }

  if (stage === "results" && result) {
    return <ResultsScreen result={result} onContinue={handleViewPlan} />;
  }

  if (stage === "generating_plan") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: "#F5F7FB" }}>
        <Sparkles className="w-12 h-12 animate-pulse text-violet-500" />
        <div>
          <p className="text-gray-900 font-black text-xl mb-1">Building your study plan...</p>
          <p className="text-gray-500 font-bold text-sm">This takes a few seconds</p>
        </div>
      </div>
    );
  }

  // ── QUIZ stage ────────────────────────────────────────────────────────────
  const q = questions[currentQ];
  if (!q) return null;

  const selectedOpts = answers[q.id] ?? [];
  const isAnswered   = selectedOpts.length > 0;
  const isLast       = currentQ === questions.length - 1;
  const timerDanger  = seconds <= 60;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F7FB" }}>
      {/* Fixed top bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 mr-auto bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
            <ClipboardList className="w-4 h-4" style={{ color: BLUE }} />
            <span className="font-black text-gray-900 text-xs uppercase tracking-widest">Diagnostic</span>
          </div>

          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-sm shrink-0 border
               ${timerDanger ? "bg-red-50 border-red-100 text-red-500 animate-pulse" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
               <Clock className="w-3.5 h-3.5" />{formatTime(seconds)}
             </div>
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleSubmit(false)}
               className="px-4 py-2 rounded-xl text-white text-xs font-black transition-colors shrink-0 shadow-sm"
               style={{ background: BLUE }}>
               Submit
             </motion.button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, background: BLUE }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <QuestionCard
              key={q.id}
              question={q}
              index={currentQ}
              total={questions.length}
              selected={selectedOpts}
              onSelect={handleSelectOption}
            />
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between bg-white border border-gray-100 rounded-3xl p-3 shadow-sm">
          <button
            onClick={() => setCurrentQ(i => Math.max(i - 1, 0))}
            disabled={currentQ === 0}
            className="px-5 py-2.5 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
          >
            Prev
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto px-2 scrollbar-none">
            {questions.map((_, i) => {
               const isAns = answers[questions[i].id]?.length > 0;
               const isCurr = i === currentQ;
               return (
                 <button key={i} onClick={() => setCurrentQ(i)}
                   className={`shrink-0 rounded-full transition-all
                     ${isCurr ? "w-6 h-2.5" : "w-2.5 h-2.5"}
                     ${isCurr ? "" : isAns ? "" : "bg-gray-200 hover:bg-gray-300"}`}
                   style={isCurr ? { background: BLUE } : isAns ? { background: BLUE_M, opacity: 0.5 } : {}}
                 />
               );
             })}
          </div>

          <button
            onClick={handleNext}
            className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all shadow-sm
              ${isLast
                ? "bg-emerald-500 text-white"
                : isAnswered
                  ? "text-white"
                  : "bg-gray-100 text-gray-400"}`}
            style={!isLast && isAnswered ? { background: BLUE } : {}}
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
