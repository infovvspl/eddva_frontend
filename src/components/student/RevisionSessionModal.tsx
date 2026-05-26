"use client";

import { useState, useEffect } from "react";
import {
  X, Brain, ChevronRight, ChevronDown, CheckCircle2,
  XCircle, RefreshCw, Clock, Target, Sparkles, Zap,
  AlertTriangle, Trophy, ArrowRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { RevisionSessionData, RevisionDrillQuestion } from "@/lib/api/student";
import { startRevisionSession } from "@/lib/api/student";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  topic: {
    topicId: string;
    topicName: string;
    subjectName: string;
    accuracy: number;
    intervalDays: 1 | 3 | 7 | 21;
  };
  onClose: () => void;
}

type Phase = "loading" | "recall" | "concept" | "drill" | "results";

const SESSION_META = {
  INTENSIVE: { label: "Intensive",  color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    icon: "🔴", desc: "20 min · Full re-explain + drill" },
  STANDARD:  { label: "Standard",   color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: "🟠", desc: "15 min · Concept check + questions" },
  QUICK:     { label: "Quick",      color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  icon: "🟡", desc: "10 min · Targeted questions only" },
  FLASH:     { label: "Flash",      color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200",   icon: "🟢", desc: "5 min · Rapid recall only" },
} as const;

function intervalLabel(acc: number) {
  if (acc < 40) return { days: 1, status: "🔴 Critical" };
  if (acc < 55) return { days: 3, status: "🟠 Weak" };
  if (acc < 65) return { days: 7, status: "🟡 Moderate" };
  if (acc < 75) return { days: 21, status: "🟢 Strong" };
  return { days: 0, status: "✅ Mastered" };
}

function nextReviewLabel(days: number): string {
  if (days === 0) return "Cleared from queue";
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ phase }: { phase: Phase }) {
  const steps: Phase[] = ["recall", "concept", "drill", "results"];
  const idx = steps.indexOf(phase);
  const pct = phase === "loading" ? 0 : Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function RecallPhase({
  session,
  onDone,
}: {
  session: RevisionSessionData;
  onDone: () => void;
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setChecked(prev => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">Notes Recall</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Before seeing new questions, mentally recall these points. Check each one you can answer.
        </p>
      </div>

      <div className="space-y-2">
        {session.recallPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3
              ${checked.has(i)
                ? "border-teal-300 bg-teal-50"
                : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
              ${checked.has(i) ? "border-teal-500 bg-teal-500" : "border-gray-300"}`}>
              {checked.has(i) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-sm text-gray-800 leading-snug">{prompt}</span>
          </button>
        ))}
      </div>

      {session.sessionType === "FLASH" && (
        <p className="text-xs text-gray-400 italic text-center">
          Flash session — skipping concept check, going straight to rapid-fire drill.
        </p>
      )}

      <button
        onClick={onDone}
        className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ConceptPhase({
  session,
  onDone,
}: {
  session: RevisionSessionData;
  onDone: () => void;
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (session.conceptQuestions.length === 0) {
    onDone();
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">Concept Verification</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Try to answer each question from memory, then reveal the answer to check.
        </p>
      </div>

      <div className="space-y-3">
        {session.conceptQuestions.map((q, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-3.5">
              <p className="text-sm font-medium text-gray-900 leading-snug">{q.question}</p>
            </div>
            {revealed.has(i) ? (
              <div className="border-t border-green-100 bg-green-50 p-3.5 space-y-1">
                <p className="text-xs font-semibold text-green-700">Answer</p>
                <p className="text-sm text-gray-800">{q.answer}</p>
                {q.explanation && (
                  <p className="text-xs text-gray-500 mt-1">{q.explanation}</p>
                )}
              </div>
            ) : (
              <button
                onClick={() => setRevealed(prev => new Set([...prev, i]))}
                className="w-full px-3.5 py-2.5 border-t border-gray-100 bg-gray-50 hover:bg-indigo-50 text-xs font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" /> Reveal Answer
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onDone}
        disabled={revealed.size < session.conceptQuestions.length}
        className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start Practice Drill <ArrowRight className="w-4 h-4" />
      </button>
      {revealed.size < session.conceptQuestions.length && (
        <p className="text-xs text-center text-gray-400">Reveal all answers to continue</p>
      )}
    </div>
  );
}

function DrillPhase({
  session,
  onDone,
}: {
  session: RevisionSessionData;
  onDone: (correct: number, total: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Array<{ q: string; chosen: string; correct: string; ok: boolean }>>([]);

  const questions = session.drillQuestions;
  if (questions.length === 0) {
    onDone(0, 0);
    return null;
  }

  const q: RevisionDrillQuestion = questions[current];
  const confirmed = selected !== null;
  const isLast = current === questions.length - 1;

  const handleSelect = (opt: string) => {
    if (confirmed) return;
    setSelected(opt);
  };

  const handleNext = () => {
    if (!selected) return;
    const ok = selected.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    const updated = [...answers, { q: q.question, chosen: selected, correct: q.correctAnswer, ok }];
    setAnswers(updated);

    if (isLast) {
      const correct = updated.filter(a => a.ok).length;
      onDone(correct, updated.length);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  const diffColor =
    q.difficulty === "easy" ? "text-green-600 bg-green-50 border-green-200" :
    q.difficulty === "hard" ? "text-red-600 bg-red-50 border-red-200" :
    "text-amber-600 bg-amber-50 border-amber-200";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Practice Drill</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Question {current + 1} of {questions.length}
          </p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${diffColor}`}>
          {q.difficulty}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1">
        {questions.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors
            ${i < current ? "bg-teal-500" : i === current ? "bg-indigo-500" : "bg-gray-200"}`} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question}</p>
      </div>

      <div className="space-y-2">
        {q.options.map((opt, oi) => {
          const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
          const isSelected = opt === selected;
          let cls = "border-gray-200 bg-white hover:border-gray-300";
          if (confirmed) {
            if (isCorrect) cls = "border-green-400 bg-green-50";
            else if (isSelected && !isCorrect) cls = "border-red-400 bg-red-50";
            else cls = "border-gray-100 bg-gray-50 opacity-60";
          } else if (isSelected) {
            cls = "border-indigo-400 bg-indigo-50";
          }

          return (
            <button
              key={oi}
              onClick={() => handleSelect(opt)}
              disabled={confirmed}
              className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all flex items-start gap-2.5 ${cls}`}
            >
              <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {String.fromCharCode(65 + oi)}
              </span>
              <span className="leading-snug">{opt}</span>
              {confirmed && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0 mt-0.5" />}
              {confirmed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {confirmed && q.explanation && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
          <span className="font-semibold">Explanation: </span>{q.explanation}
        </div>
      )}

      {selected && (
        <button
          onClick={handleNext}
          className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 flex items-center justify-center gap-2 transition-colors"
        >
          {isLast ? "See Results" : "Next Question"} <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function ResultsPhase({
  session,
  correct,
  total,
  onClose,
}: {
  session: RevisionSessionData;
  correct: number;
  total: number;
  onClose: () => void;
}) {
  const newAccuracy = total > 0 ? Math.round((correct / total) * 100) : session.previousAccuracy;
  const improved = newAccuracy >= session.previousAccuracy + 15;
  const dropped = newAccuracy < 40 && session.previousAccuracy >= 40;

  const { days, status } = intervalLabel(newAccuracy);
  const nextReview = nextReviewLabel(days);

  const resultColor =
    newAccuracy < 40 ? "text-red-600" :
    newAccuracy < 55 ? "text-orange-500" :
    newAccuracy < 65 ? "text-amber-600" :
    newAccuracy < 75 ? "text-teal-600" : "text-green-600";

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        {newAccuracy >= 75 ? (
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        ) : improved ? (
          <Zap className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
        ) : (
          <Target className="w-12 h-12 text-teal-500 mx-auto mb-2" />
        )}
        <h3 className="text-lg font-bold text-gray-900">Session Complete</h3>
        <p className="text-xs text-gray-500 mt-0.5">{session.topicName} — {session.subjectName}</p>
      </div>

      {/* Accuracy block */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Previous</p>
            <p className="text-2xl font-black text-gray-400">{session.previousAccuracy}%</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
          <div className="text-center flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">This Session</p>
            <p className={`text-2xl font-black ${resultColor}`}>{newAccuracy}%</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
          <div className="text-center flex-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Target</p>
            <p className="text-2xl font-black text-gray-400">{session.targetAccuracy}%</p>
          </div>
        </div>
        {total > 0 && (
          <div className="text-center text-sm text-gray-600">
            <span className="font-bold text-gray-900">{correct}</span> / {total} correct
          </div>
        )}
      </div>

      {/* Queue decision */}
      <div className={`rounded-xl border-2 p-3.5 space-y-1
        ${improved ? "border-teal-300 bg-teal-50" : dropped ? "border-red-300 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex items-center gap-2">
          {improved
            ? <CheckCircle2 className="w-4 h-4 text-teal-600" />
            : dropped
            ? <AlertTriangle className="w-4 h-4 text-red-600" />
            : <RefreshCw className="w-4 h-4 text-amber-600" />}
          <span className="text-sm font-bold text-gray-900">
            {improved ? "Extended to next interval" : dropped ? "Reset to 1-Day review" : "Repeat same interval"}
          </span>
        </div>
        <p className="text-xs text-gray-600 pl-6">
          Status: <strong>{status}</strong>
        </p>
        <p className="text-xs text-gray-600 pl-6">
          Next review: <strong>{nextReview}</strong>
        </p>
      </div>

      {/* Tip */}
      {newAccuracy < 65 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700 leading-relaxed">
          <span className="font-semibold">Tip: </span>
          {newAccuracy < 40
            ? `Re-read your AI notes for "${session.topicName}" and attempt again tomorrow.`
            : `Focus on the questions you got wrong — try re-explaining the concept in your own words.`}
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
      >
        Done
      </button>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function RevisionSessionModal({ topic, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<RevisionSessionData | null>(null);
  const [drillResult, setDrillResult] = useState<{ correct: number; total: number } | null>(null);

  useEffect(() => {
    startRevisionSession({
      topicId: topic.topicId,
      accuracy: topic.accuracy,
      intervalDays: topic.intervalDays,
    })
      .then(data => {
        setSession(data);
        setPhase("recall");
      })
      .catch(() => {
        toast.error("Failed to start revision session");
        onClose();
      });
  }, []);

  const meta = session ? SESSION_META[session.sessionType] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Brain className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-bold text-sm text-gray-900 truncate">{topic.topicName}</span>
              {meta && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
                  {meta.icon} {meta.label}
                </span>
              )}
            </div>
            {meta && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {meta.desc}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-2 shrink-0">
          <ProgressBar phase={phase} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
              <p className="text-sm text-gray-500">Building your revision session…</p>
              <p className="text-xs text-gray-400">Generating fresh practice questions</p>
            </div>
          )}

          {phase === "recall" && session && (
            <RecallPhase
              session={session}
              onDone={() => session.conceptQuestions.length > 0 ? setPhase("concept") : setPhase("drill")}
            />
          )}

          {phase === "concept" && session && (
            <ConceptPhase
              session={session}
              onDone={() => setPhase("drill")}
            />
          )}

          {phase === "drill" && session && (
            <DrillPhase
              session={session}
              onDone={(correct, total) => {
                setDrillResult({ correct, total });
                setPhase("results");
              }}
            />
          )}

          {phase === "results" && session && drillResult && (
            <ResultsPhase
              session={session}
              correct={drillResult.correct}
              total={drillResult.total}
              onClose={onClose}
            />
          )}

          {phase === "results" && session && !drillResult && (
            <ResultsPhase
              session={session}
              correct={0}
              total={0}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
