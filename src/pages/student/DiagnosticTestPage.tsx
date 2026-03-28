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
  BarChart3, Sparkles, BookOpen,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { patchDiagnosticCompleted } from "@/lib/auth-store";
import {
  generateDiagnosticSession, submitAnswer,
  submitSession,
} from "@/lib/api/student";
import type { QuizQuestion, TestSession, SessionResult } from "@/lib/api/student";
import { toast } from "sonner";

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
      className="min-h-screen flex items-center justify-center bg-background p-4"
    >
      <div className="w-full max-w-lg">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
          <ClipboardList className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-3xl font-bold text-foreground text-center mb-2">
          Diagnostic Test
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Before you start, let's understand your level
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">AI-generated for your syllabus</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Questions are automatically created from <span className="text-foreground font-medium">{batchName || "your batch"}</span> topics — no teacher setup needed
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">~20 minutes · AI-adaptive</p>
              <p className="text-xs text-muted-foreground mt-0.5">Difficulty adjusts as you answer</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Unlocks your AI study plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">Results build your 30-day personalised schedule</p>
            </div>
          </div>
          <div className="mt-2 rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs font-medium text-amber-400">
                This test is mandatory. You cannot skip or go back during the test.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
        >
          Start Diagnostic Test 🧪
        </button>
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

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Question number + content */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Q{index + 1} / {total}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{question.difficulty}</span>
          {question.topic && (
            <span className="text-xs text-muted-foreground">· {question.topic.name}</span>
          )}
        </div>
        <p className="text-base font-medium text-foreground leading-relaxed">{question.content}</p>
      </div>

      {/* Options */}
      {isInteger ? (
        <div className="bg-card border border-border rounded-2xl p-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
            Enter your answer
          </label>
          <input
            type="number"
            value={intVal}
            onChange={e => { setIntVal(e.target.value); onSelect(e.target.value); }}
            placeholder="Type integer answer..."
            className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground text-center focus:outline-none focus:border-primary"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {question.options?.map(opt => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all
                  ${isSelected
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "bg-card border-border text-foreground hover:bg-secondary/40"}`}
              >
                <span className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold border
                  ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 border-border"}`}>
                  {opt.optionLabel}
                </span>
                <span className="text-sm font-medium">{opt.content}</span>
              </button>
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
  const wrongTopics = result.attempts
    .filter(a => !a.isCorrect && a.questionContent)
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-background p-4"
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-3xl font-bold text-foreground">Diagnostic Complete!</h1>
          <p className="text-muted-foreground mt-1">Here's how you performed</p>
        </div>

        {/* Score ring */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4 flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              <circle cx="48" cy="48" r="40" fill="none"
                stroke={accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444"}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - accuracy / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-foreground">{accuracy.toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{result.totalScore} pts</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle className="w-3 h-3" />{result.totalCorrect} correct
              </span>
              <span className="flex items-center gap-1 text-xs text-red-400">
                <XCircle className="w-3 h-3" />{result.totalWrong} wrong
              </span>
              <span className="text-xs text-muted-foreground">{result.totalSkipped} skipped</span>
            </div>
          </div>
        </div>

        {/* Error breakdown */}
        {eb && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">Error Breakdown</p>
            </div>
            <div className="space-y-2">
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
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-bold text-foreground">{val}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
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
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
          <p className="text-sm text-foreground">
            AI is building your <span className="font-bold text-violet-400">personalised 30-day study plan</span> based on these results
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
        >
          <>View My Study Plan <ChevronRight className="w-5 h-5" /></>
        </button>
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
      // so ProtectedRoute doesn't redirect while still on this page, then
      // invalidate the React Query /me cache so next navigation gets fresh data.
      patchDiagnosticCompleted(useAuthStore.getState());
      // Sync the React Query /me cache directly so ProtectedRoute's useMe(hasToken)
      // sees diagnosticCompleted=true without needing a network refetch.
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

  // ── Navigate to study plan (backend already auto-generated it on diagnostic submit) ──
  const handleViewPlan = () => {
    navigate("/student/study-plan");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (stage === "info") {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
        <InfoScreen batchName={batchName} onStart={handleStart} />
      </>
    );
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <Sparkles className="w-5 h-5 text-violet-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-foreground font-bold text-lg">Building your diagnostic test...</p>
          <p className="text-muted-foreground text-sm mt-1">
            AI is generating personalised questions based on your syllabus
          </p>
        </div>
        <div className="flex items-center gap-6 mt-2">
          {["Analysing syllabus", "Generating questions", "Setting difficulty"].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Analysing your answers...</p>
      </div>
    );
  }

  if (stage === "results" && result) {
    return <ResultsScreen result={result} onContinue={handleViewPlan} />;
  }

  if (stage === "generating_plan") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        <p className="text-foreground font-bold text-lg">Building your study plan...</p>
        <p className="text-muted-foreground text-sm">This takes a few seconds</p>
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed top bar */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo / title */}
          <div className="flex items-center gap-2 mr-auto">
            <ClipboardList className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground text-sm">Diagnostic Test</span>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm
            ${timerDanger ? "bg-red-500/10 text-red-400 animate-pulse" : "bg-secondary/60 text-foreground"}`}>
            <Clock className="w-4 h-4" />
            {formatTime(seconds)}
          </div>

          {/* Submit button */}
          <button
            onClick={() => handleSubmit(false)}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            Submit Test
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-secondary/30">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
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

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentQ(i => Math.max(i - 1, 0))}
            disabled={currentQ === 0}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors disabled:opacity-30"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-2 h-2 rounded-full transition-all
                  ${i === currentQ ? "w-5 bg-primary" : answers[questions[i].id]?.length ? "bg-primary/50" : "bg-secondary"}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all
              ${isLast
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : isAnswered
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary/50 text-muted-foreground"}`}
          >
            {isLast ? "Submit →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
