import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Clock, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertTriangle, BarChart3,
  Target, ArrowLeft, Flame, BookOpen, Sparkles,
  Brain, Trophy, Search, Play, Monitor, Zap, Layers,
  ArrowRight, ShieldCheck, BrainCircuit, Activity, Info, Check, X,
} from "lucide-react";
import {
  getMockTests, startSession, submitAnswer, submitSession,
  generateAiQuiz, completeAiQuiz,
} from "@/lib/api/student";
import type {
  QuizQuestion, TestSession, SessionResult, MockTestListItem,
  AiQuizData, AiQuizQuestion, AiQuizResult,
} from "@/lib/api/student";
import { toast } from "sonner";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

// ─── Timer ────────────────────────────────────────────────────────────────────
function useTimer(initialSeconds: number, running: boolean, onExpire: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const cbRef = useRef(onExpire);
  cbRef.current = onExpire;
  useEffect(() => { setSeconds(initialSeconds); }, [initialSeconds]);
  useEffect(() => {
    if (!running || seconds <= 0) { if (seconds <= 0 && running) cbRef.current(); return; }
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);
  return seconds;
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function isTopicQuizAnswered(
  q: QuizQuestion | AiQuizQuestion,
  selected: string[] | undefined,
) {
  if (!selected?.length) return false;
  if (q.type === "descriptive") return Boolean(selected[0]?.trim());
  if (q.type === "integer") return Boolean(selected[0]?.toString().trim());
  return true;
}

// ─── Question Card (shared) ───────────────────────────────────────────────────
function QuestionCard({
  question, index, total, selected, onSelect,
}: {
  question: QuizQuestion | AiQuizQuestion;
  index: number; total: number;
  selected: string[];
  onSelect: (v: string) => void;
}) {
  const isInteger = question.type === "integer";
  const isMulti = question.type === "mcq_multi";
  const isDesc = question.type === "descriptive";
  const [intVal, setIntVal] = useState("");
  const [textVal, setTextVal] = useState("");
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setIntVal(selected[0] ?? ""); setTextVal(selected[0] ?? ""); }, [question.id, selected]);
  useEffect(() => () => { if (debRef.current) clearTimeout(debRef.current); }, []);

  return (
    <motion.div
      key={question.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden"
    >
      <CardGlass className="shrink-0 border-slate-200/80 relative overflow-hidden bg-white p-4 shadow-sm sm:p-5">
        
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white sm:text-[11px]">
            Question {index + 1} / {total}
          </span>
          <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 sm:text-[11px]">
            {isDesc ? "Written" : isInteger ? "Integer" : isMulti ? "MSQ" : "MCQ"}
          </span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500 sm:text-[11px]">Difficulty: {question.difficulty}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 sm:text-[11px]">+{question.marksCorrect}</span>
            {question.marksWrong > 0 && <span className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600 sm:text-[11px]">-{question.marksWrong}</span>}
          </div>
        </div>
        
        <div className="text-base font-semibold leading-snug text-slate-900 select-none sm:text-lg">
           <MarkdownRenderer content={question.content} />
        </div>
      </CardGlass>

      {isDesc ? (
        <CardGlass className="min-h-0 shrink-0 border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <label className="text-[11px] font-semibold text-slate-500 mb-3 block">Your answer</label>
          <textarea
            value={textVal}
            onChange={e => {
              const v = e.target.value;
              setTextVal(v);
              if (debRef.current) clearTimeout(debRef.current);
              debRef.current = setTimeout(() => onSelect(v), 450);
            }}
            onBlur={() => {
              if (debRef.current) clearTimeout(debRef.current);
              onSelect(textVal);
            }}
            rows={4}
            className="min-h-[100px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:px-6 sm:text-base"
            placeholder="Type your response…"
          />
        </CardGlass>
      ) : isInteger ? (
        <CardGlass className="shrink-0 border-indigo-200 bg-indigo-50/40 p-4 shadow-sm sm:p-6">
          <label className="mb-4 block text-center text-[11px] font-semibold text-slate-500">Numerical answer</label>
          <input
            type="number" value={intVal}
            onChange={e => { setIntVal(e.target.value); onSelect(e.target.value); }}
            placeholder="0"
            className="mx-auto block w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-2xl font-bold text-slate-900 shadow-sm transition-all placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:py-5 sm:text-3xl"
          />
        </CardGlass>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto overscroll-contain sm:gap-3">
          {isMulti && (
            <p className="shrink-0 px-1 text-xs font-semibold text-slate-500">Select all that apply</p>
          )}
          {question.options?.map((opt, i) => {
            const isSelected = selected.includes(opt.id);
            return (
              <motion.button
                type="button"
                whileHover={{ scale: 1.01, x: 6 }} whileTap={{ scale: 0.99 }}
                key={opt.id} onClick={() => onSelect(opt.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all sm:gap-4 sm:py-3",
                  isSelected ? "scale-[1.01] border-blue-600 bg-blue-600 text-white shadow-md" : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition-colors sm:h-10 sm:w-10",
                  isSelected ? "border-white bg-white text-blue-700" : "border-slate-200 bg-slate-50 text-slate-500"
                )}>
                  {isMulti
                    ? (isSelected ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <span className="text-slate-400">{String.fromCharCode(65 + i)}</span>)
                    : String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1 text-sm font-medium tracking-tight sm:text-base">
                  <MarkdownRenderer content={opt.content} />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ScoreRing({ accuracy, score, outOf, correct, wrong, skipped }: {
  accuracy: number; score: number; outOf: number;
  correct: number; wrong: number; skipped: number;
}) {
  return (
    <CardGlass className="p-10 border-white bg-slate-900 text-white relative overflow-hidden mb-10">
       <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Show Results</h3>
       <div className="flex items-center gap-10 flex-col sm:flex-row">
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <motion.circle cx="50" cy="50" r="45" fill="none"
                stroke={accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444"}
                strokeWidth="10" strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 * (1 - accuracy/100) }}
                transition={{ duration: 2, ease: "easeOut" }}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-3xl font-black italic">{accuracy.toFixed(0)}%</span>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-5xl font-black italic text-emerald-400 leading-none mb-2">{score}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Total Sync Points / {outOf}</p>
            <div className="flex items-center justify-center sm:justify-start gap-4">
               <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-black italic border border-emerald-500/20">{correct} Valid</div>
               <div className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-black italic border border-red-500/20">{wrong} Error</div>
            </div>
          </div>
       </div>
    </CardGlass>
  );
}

function ErrorAnalysis({ eb, totalWrong }: { eb: any; totalWrong: number }) {
  return (
    <CardGlass className="p-10 border-white bg-white/60 mb-10">
       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 flex items-center gap-2">
         <BarChart3 className="w-4 h-4" /> Neural Drift Scan
       </h3>
       <div className="space-y-6">
         {[
           { key: "conceptual", label: "LOGIC VOIDS", color: "#ef4444" },
           { key: "silly",      label: "SILLY SYNAPSE ERRORS", color: "#f59e0b" },
           { key: "time",       label: "TEMPORAL LAG", color: "#6366f1" },
           { key: "guess",      label: "UNVERIFIED GUESSES", color: "#8b5cf6" },
         ].map(({ key, label, color }) => {
           const val = eb[key] ?? 0;
           if (!val) return null;
           return (
             <div key={key}>
               <div className="flex justify-between items-end mb-3">
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{label}</span>
                 <span className="text-sm font-black text-slate-400 italic">{val} / {totalWrong}</span>
               </div>
               <div className="h-2 rounded-full bg-slate-100 overflow-hidden p-0.5">
                 <motion.div initial={{ width: 0 }} animate={{ width: `${(val / totalWrong) * 100}%` }}
                   transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: color }} />
               </div>
             </div>
           );
         })}
       </div>
    </CardGlass>
  );
}

// ─── Quiz Runner ──────────────────────────────────────────────────────────────
function QuizRunner({
  title, isAi, questions, seconds, timerDanger,
  answers, currentQ, setCurrentQ,
  onSelect, onNext, onSubmit, onClose,
}: {
  title: string; isAi: boolean;
  questions: (QuizQuestion | AiQuizQuestion)[];
  seconds: number; timerDanger: boolean;
  answers: Record<string, string[]>;
  currentQ: number; setCurrentQ: (i: number) => void;
  onSelect: (v: string) => void; onNext: () => void; onSubmit: () => void;
  /** Exit quiz without finishing (e.g. during retake). */
  onClose: () => void;
}) {
  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const selected = q ? (answers[q.id] || []) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden sm:gap-3">
        <CardGlass className="flex shrink-0 items-center justify-between border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-5 sm:py-3">
           <div className="flex items-center gap-6">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-sm", isAi ? "bg-purple-600 text-white" : "bg-slate-900 text-white")}>
                 {isAi ? <Sparkles className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                 <p className="text-[10px] font-semibold text-slate-500 leading-none mb-1">{isAi ? "AI Practice Quiz" : "Practice Quiz"}</p>
                 <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-none truncate max-w-[200px] sm:max-w-none">{title}</h3>
              </div>
           </div>

           <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                title="Close quiz"
                aria-label="Close quiz and leave"
              >
                <X className="h-4 w-4" />
              </button>
              <div className={cn(
                 "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                 timerDanger ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-white border-slate-100 text-slate-900"
              )}>
                 <Clock className="w-3.5 h-3.5" />
                 <span className="text-xs sm:text-sm font-semibold tabular-nums leading-none">{fmt(seconds)}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onSubmit}
                className="hidden sm:flex px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm"
              >
                Submit
              </motion.button>
           </div>
        </CardGlass>

        <div className="relative h-1 shrink-0 overflow-hidden rounded-full bg-slate-200/50">
           <motion.div initial={{ width: 0 }} animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
             className={cn("h-full shadow-lg", isAi ? "bg-purple-600 shadow-purple-500/20" : "bg-blue-600 shadow-blue-500/20")} />
        </div>

        <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="min-h-0 flex-1">
              <AnimatePresence mode="wait">
                <QuestionCard
                  key={q.id} question={q} index={currentQ} total={questions.length}
                  selected={selected} onSelect={onSelect}
                />
              </AnimatePresence>
            </div>
            <CardGlass className="shrink-0 border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentQ(Math.max(currentQ - 1, 0))}
                  disabled={currentQ === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={onNext}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors",
                    isLast
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : isAi
                        ? "bg-purple-600 hover:bg-purple-500"
                        : "bg-blue-600 hover:bg-blue-500",
                  )}
                >
                  {isLast ? "Finish Quiz" : "Next Question"}
                  {isLast ? <CheckCircle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </CardGlass>
          </div>

          <CardGlass className="hidden min-h-0 border-slate-200 bg-white p-4 shadow-sm lg:flex lg:flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Question Grid</h4>
              <span className="text-[11px] text-slate-500">
                {questions.filter((question) => isTopicQuizAnswered(question, answers[question.id])).length}/{questions.length} answered
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700">Answered</div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-red-700">Not answered</div>
            </div>

            <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-1">
              {questions.map((question, i) => {
                const answered = isTopicQuizAnswered(question, answers[question.id]);
                const active = i === currentQ;
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentQ(i)}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-semibold transition-all",
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : answered
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
                    )}
                    title={`Question ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </CardGlass>
        </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Stage = "loading" | "no_quiz" | "ai_generating" | "info" | "ai_info" | "quiz" | "ai_quiz" | "submitting" | "ai_submitting" | "results" | "ai_results";

export default function StudentTopicQuizPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const topicId = params.get("topicId") ?? "";
  const [showReview, setShowReview] = useState(false);

  const [stage, setStage]         = useState<Stage>("loading");
  const [mockTest, setMockTest]   = useState<MockTestListItem | null>(null);
  const [session, setSession]     = useState<TestSession | null>(null);
  const [questions, setQuestions] = useState<(QuizQuestion | AiQuizQuestion)[]>([]);
  const [aiQuizData, setAiQuizData] = useState<AiQuizData | null>(null);
  const [currentQ, setCurrentQ]  = useState(0);
  const [answers, setAnswers]     = useState<Record<string, string[]>>({});
  const [teacherResult, setTeacherResult] = useState<SessionResult | null>(null);
  const [aiResult, setAiResult]   = useState<AiQuizResult | null>(null);

  const durationSec = (
    stage === "quiz" ? (mockTest?.durationMinutes ?? 30) :
    stage === "ai_quiz" ? (aiQuizData?.durationMinutes ?? 15) : 30
  ) * 60;

  const isRunning = stage === "quiz" || stage === "ai_quiz";

  const handleTimeUp = useCallback(() => {
    if (stage === "quiz" && session) handleTeacherSubmit(true);
    if (stage === "ai_quiz") handleAiSubmit(true);
  }, [stage, session]); // eslint-disable-line

  const seconds = useTimer(durationSec, isRunning, handleTimeUp);
  const timerDanger = isRunning && seconds < 120;

  useEffect(() => {
    if (!topicId) { setStage("no_quiz"); return; }
    getMockTests({ topicId, isPublished: true })
      .then(tests => {
        if (!tests.length) { setStage("no_quiz"); return; }
        setMockTest(tests[0]);
        setStage("info");
      })
      .catch(() => setStage("no_quiz"));
  }, [topicId]);

  const handleTeacherStart = async () => {
    if (!mockTest) return;
    setStage("loading");
    try {
      const sess = await startSession(mockTest.id);
      setSession(sess); setQuestions(sess.questions ?? []); setCurrentQ(0); setAnswers({}); setStage("quiz");
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Link failure."); setStage("info"); }
  };

  const handleTeacherSelect = async (value: string) => {
    const q = questions[currentQ] as QuizQuestion;
    if (!q || !session) return;
    const isMulti = q.type === "mcq_multi";
    const isInt = q.type === "integer";
    const isDesc = q.type === "descriptive";
    const next =
      isInt || isDesc
        ? [value]
        : isMulti
          ? (answers[q.id]?.includes(value) ? answers[q.id].filter((id) => id !== value) : [...(answers[q.id] || []), value])
          : [value];
    setAnswers((a) => ({ ...a, [q.id]: next }));
    try {
      await submitAnswer(session.id, {
        questionId: q.id,
        selectedOptionIds: isInt || isDesc ? undefined : next,
        integerResponse: isInt || isDesc ? value : undefined,
      });
    } catch { /* best-effort */ }
  };

  const handleTeacherSubmit = async (timedOut: boolean) => {
    if (!session) return;
    if (timedOut) toast.warning("Protocol Timeout!");
    setStage("submitting");
    try { const res = await submitSession(session.id); setTeacherResult(res); setStage("results"); }
    catch (err) { setStage("quiz"); }
  };

  const handleAiGenerate = async () => {
    setStage("ai_generating");
    try { const data = await generateAiQuiz(topicId); setAiQuizData(data); setStage("ai_info"); }
    catch (err) { setStage("no_quiz"); }
  };

  const handleAiStart = () => { if (aiQuizData) { setQuestions(aiQuizData.questions); setCurrentQ(0); setAnswers({}); setStage("ai_quiz"); } };

  const handleAiSelect = (optionId: string) => {
    const q = questions[currentQ]; if (!q) return;
    const isMulti = q.type === "mcq_multi";
    const next = q.type === "integer" ? [optionId] : isMulti ? (answers[q.id]?.includes(optionId) ? answers[q.id].filter(id => id !== optionId) : [...(answers[q.id] || []), optionId]) : [optionId];
    setAnswers(a => ({ ...a, [q.id]: next }));
  };

  const handleAiSubmit = async (timedOut: boolean) => {
    if (timedOut) toast.warning("Timeout!");
    if (!aiQuizData) return;
    setStage("ai_submitting");
    const qs = aiQuizData.questions;
    let correct = 0; let wrong = 0;
    qs.forEach(q => {
      const sel = answers[q.id] ?? [];
      const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id);
      if (sel.length > 0 && sel.every(s => correctIds.includes(s))) correct++;
      else if (sel.length > 0) wrong++;
    });
    try {
      const res = await completeAiQuiz(topicId, { score: Math.max(0, correct * 4 - wrong), totalMarks: aiQuizData.totalMarks, accuracy: qs.length ? (correct/qs.length)*100 : 0, correctCount: correct, wrongCount: wrong });
      setAiResult(res); setStage("ai_results");
    } catch { setStage("ai_quiz"); }
  };

  useEffect(() => {
    if (stage !== "ai_results" && stage !== "results") {
      setShowReview(false);
    }
  }, [stage]);

  if (["loading", "ai_generating", "submitting", "ai_submitting"].includes(stage)) {
    return (
      <div className="py-40 flex flex-col items-center justify-center text-center gap-10">
         <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl">
            <Loader2 className={cn("w-12 h-12 animate-spin", stage.startsWith("ai") ? "text-purple-600" : "text-blue-600")} />
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Neural Modules...</p>
      </div>
    );
  }

  if (stage === "no_quiz") {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-4">
        <div className="w-full max-w-xl">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all mx-auto mb-8 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">No quiz available</h2>
          <p className="text-sm text-slate-500 mb-10">This topic does not have a published quiz yet.</p>

          <CardGlass className="p-8 border-slate-200 bg-white shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md mx-auto mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Try AI Practice</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              Generate a quick personalized quiz to continue your progress.
            </p>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleAiGenerate}
              className="w-full py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-500 transition"
            >
              Generate AI Quiz
            </motion.button>
          </CardGlass>
        </div>
      </div>
    );
  }

  if (stage === "ai_info" && aiQuizData) {
    return (
      <div className="py-20 flex items-center justify-center p-6">
         <div className="w-full max-w-lg">
            <CardGlass className="p-8 border-slate-200 bg-white shadow-sm">
               <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md mb-6"><BrainCircuit className="w-6 h-6" /></div>
               <p className="text-xs font-semibold text-indigo-600 mb-1">AI quiz ready</p>
               <h1 className="text-3xl font-bold text-slate-900 mb-7 leading-tight">{aiQuizData.topicName}</h1>
               <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                     <Clock className="w-4 h-4 text-indigo-600 mb-2" />
                     <p className="text-xs font-semibold text-slate-800">{aiQuizData.durationMinutes} min duration</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                     <Target className="w-4 h-4 text-emerald-500 mb-2" />
                     <p className="text-xs font-semibold text-slate-800">70% target score</p>
                  </div>
               </div>
               <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAiStart}
                 className="w-full py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-500 transition">
                 Start Quiz
               </motion.button>
            </CardGlass>
         </div>
      </div>
    );
  }

  if (stage === "info" && mockTest) {
    return (
      <div className="py-20 flex items-center justify-center p-6 text-center">
         <div className="w-full max-w-lg">
            <CardGlass className="p-8 border-slate-200 bg-white text-center shadow-sm">
               <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md mx-auto mb-7"><ClipboardList className="w-8 h-8" /></div>
               <p className="text-xs font-semibold text-indigo-600 mb-1">Ready to begin</p>
               <h1 className="text-3xl font-bold text-slate-900 mb-8 leading-tight">{mockTest.title}</h1>
               <div className="flex gap-4 mb-10">
                  <div className="flex-1 p-5 rounded-xl bg-slate-50 border border-slate-100">
                     <Activity className="w-5 h-5 text-blue-600 mx-auto mb-3" />
                     <p className="text-xs font-semibold text-slate-800">{mockTest.durationMinutes} min duration</p>
                  </div>
                  <div className="flex-1 p-5 rounded-xl bg-slate-50 border border-slate-100">
                     <Target className="w-5 h-5 text-emerald-500 mx-auto mb-3" />
                     <p className="text-xs font-semibold text-slate-800">70% target score</p>
                  </div>
               </div>
               <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTeacherStart}
                 className="w-full py-3.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-500 transition">
                 Start Quiz
               </motion.button>
            </CardGlass>
         </div>
      </div>
    );
  }

  const handleCloseQuiz = () => {
    const ok = window.confirm(
      "Close this quiz? Your last saved answers are kept; you can open the topic again to continue or start over.",
    );
    if (ok) navigate(-1);
  };

  if (stage === "quiz" || stage === "ai_quiz") {
    return (
      <div className="flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] min-h-0 flex-col overflow-hidden">
        <QuizRunner
          title={stage === "ai_quiz" ? aiQuizData?.topicName ?? "" : mockTest?.title ?? ""}
          isAi={stage === "ai_quiz"}
          questions={questions}
          seconds={seconds}
          timerDanger={timerDanger}
          answers={answers}
          currentQ={currentQ}
          setCurrentQ={setCurrentQ}
          onSelect={stage === "quiz" ? handleTeacherSelect : handleAiSelect}
          onNext={() => {
            if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
            else stage === "quiz" ? handleTeacherSubmit(false) : handleAiSubmit(false);
          }}
          onSubmit={() => (stage === "quiz" ? handleTeacherSubmit(false) : handleAiSubmit(false))}
          onClose={handleCloseQuiz}
        />
      </div>
    );
  }

  if (stage === "results" && teacherResult && mockTest) {
    const accuracy = (teacherResult.totalCorrect / Math.max(questions.length, 1)) * 100;
    const passed = accuracy >= (mockTest.passingMarks ? (mockTest.passingMarks/mockTest.totalMarks)*100 : 70);
    return (
      <div className="py-20 flex items-center justify-center p-6">
         <div className="w-full max-w-4xl">
            <div className="text-center mb-16">
               <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl", passed ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                  {passed ? <CheckCircle className="w-10 h-10" /> : <Flame className="w-10 h-10" />}
               </div>
               <h1 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">{passed ? "Sector Verified" : "Sync Incomplete"}</h1>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{mockTest.title}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <ScoreRing accuracy={accuracy} score={teacherResult.totalScore} outOf={mockTest.totalMarks} correct={teacherResult.totalCorrect} wrong={teacherResult.totalWrong} skipped={teacherResult.totalSkipped} />
               {teacherResult.errorBreakdown && <ErrorAnalysis eb={teacherResult.errorBreakdown} totalWrong={teacherResult.totalWrong} />}
            </div>
            <CardGlass className="p-8 border-white mt-10 mb-10 overflow-hidden">
              <button onClick={() => setShowReview(!showReview)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-4"><Info className="w-5 h-5 text-slate-400" /><span className="text-sm font-black text-slate-900 uppercase italic">Review Answers</span></div>
                <ChevronRight className={cn("w-6 h-6 text-slate-300 transition-transform", showReview && "rotate-90")} />
              </button>
              <AnimatePresence>
                {showReview && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="pt-8 space-y-5">
                    {teacherResult.attempts.map((attempt, i) => {
                      const sourceQuestion =
                        attempt.question
                        ?? questions.find((q) => q.id === attempt.questionId)
                        ?? null;
                      const optionPool = ((attempt.options && attempt.options.length > 0)
                        ? attempt.options
                        : (sourceQuestion?.options ?? [])) as Array<{ id: string; optionLabel?: string; content?: string; isCorrect?: boolean | null }>;
                      const selectedIds = attempt.selectedOptionIds ?? [];
                      const selectedOptions = optionPool.filter((o) => selectedIds.includes(o.id));
                      const correctIds = attempt.correctOptionIds ?? optionPool.filter((o) => Boolean(o.isCorrect)).map((o) => o.id);
                      const correctOptions = optionPool.filter((o) => correctIds.includes(o.id));
                      const sourceQuestionAny = sourceQuestion as any;
                      const explanation =
                        attempt.question?.solutionText?.trim()
                        || sourceQuestionAny?.solutionText?.trim?.()
                        || "Explanation not available.";
                      const prompt = attempt.question?.content || sourceQuestion?.content || attempt.questionContent || `Question ${i + 1}`;
                      const selectedText = selectedOptions.length
                        ? selectedOptions.map((o, oi) => `${o.optionLabel ?? String.fromCharCode(65 + oi)}. ${o.content ?? ""}`.trim()).join(" | ")
                        : (attempt.integerAnswer?.trim() || "Not answered");
                      const correctText = correctOptions.length
                        ? correctOptions.map((o, oi) => `${o.optionLabel ?? String.fromCharCode(65 + oi)}. ${o.content ?? ""}`.trim()).join(" | ")
                        : (attempt.question?.integerAnswer?.trim() || sourceQuestionAny?.integerAnswer?.trim?.() || "Not available");
                      return (
                        <div key={`${attempt.questionId}-${i}`} className={cn("p-6 rounded-[1.5rem] border", attempt.isCorrect ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100")}>
                          <p className="text-sm font-bold text-slate-900 mb-3">{prompt}</p>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Your answer</p>
                          <p className="text-sm text-slate-700 mb-3">{selectedText}</p>
                          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Correct answer</p>
                          <p className="text-sm text-emerald-900 mb-3">{correctText}</p>
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Explanation</p>
                          <MarkdownRenderer content={explanation} className="text-sm text-slate-700 leading-relaxed" />
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardGlass>
            <button onClick={() => navigate(-1)} className="w-full py-8 rounded-[3rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6">Return to Directory <ArrowRight className="w-6 h-6" /></button>
         </div>
      </div>
    );
  }

  if (stage === "ai_results" && aiResult && aiQuizData) {
    return (
      <div className="py-20 px-6">
         <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-16">
               <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl", aiResult.passed ? "bg-emerald-500 text-white" : "bg-purple-600 text-white")}>
                  {aiResult.passed ? <CheckCircle className="w-10 h-10" /> : <Activity className="w-10 h-10" />}
               </div>
               <h1 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">{aiResult.passed ? "Neural Pass" : "Simulation Logged"}</h1>
               <div className="flex items-center justify-center gap-3"><Sparkles className="w-4 h-4 text-purple-500" /><p className="text-xs font-black text-purple-500 uppercase tracking-widest">AI Synthesis Result</p></div>
            </div>
            <ScoreRing accuracy={aiResult.accuracy} score={aiResult.score} outOf={aiResult.totalMarks} correct={Math.round((aiResult.accuracy/100)*questions.length)} wrong={questions.length - Math.round((aiResult.accuracy/100)*questions.length)} skipped={0} />
            
            <CardGlass className="p-8 border-white mb-10 overflow-hidden">
               <button onClick={() => setShowReview(!showReview)} className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-4"><Info className="w-5 h-5 text-slate-400" /><span className="text-sm font-black text-slate-900 uppercase italic">Review Logic Patterns</span></div>
                  <ChevronRight className={cn("w-6 h-6 text-slate-300 transition-transform", showReview && "rotate-90")} />
               </button>
               <AnimatePresence>
                  {showReview && (
                     <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="pt-10 space-y-6">
                        {aiQuizData.questions.map((q, i) => {
                           const sel = answers[q.id] || [];
                           const correct = q.options.filter(o => o.isCorrect).map(o => o.id);
                           const isRight = sel.length > 0 && sel.every(s => correct.includes(s));
                           const selectedLabels = q.options
                             .filter((o) => sel.includes(o.id))
                             .map((o) => `${o.optionLabel}. ${o.content}`);
                           const correctLabels = q.options
                             .filter((o) => correct.includes(o.id))
                             .map((o) => `${o.optionLabel}. ${o.content}`);
                           return (
                              <div key={i} className={cn("p-6 rounded-[2rem] border transition-all", isRight ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100")}>
                                 <div className="flex gap-4 mb-4">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", isRight ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                                       {isRight ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </div>
                                    <p className="text-base font-black text-slate-900 uppercase italic">{q.content}</p>
                                 </div>
                                 <div className="space-y-3">
                                   <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Your answer</p>
                                     <p className="text-sm font-semibold text-slate-700">
                                       {selectedLabels.length ? selectedLabels.join(" | ") : "Not answered"}
                                     </p>
                                   </div>
                                   <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-2">Correct answer</p>
                                     <p className="text-sm font-semibold text-emerald-900">{correctLabels.join(" | ")}</p>
                                   </div>
                                   <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 mb-2">Explanation</p>
                                     <MarkdownRenderer
                                       content={q.explanation?.trim() || "Explanation not available."}
                                       className="text-sm font-medium text-slate-700 leading-relaxed"
                                     />
                                   </div>
                                 </div>
                              </div>
                           );
                        })}
                     </motion.div>
                  )}
               </AnimatePresence>
            </CardGlass>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
               <CardGlass className="p-8 border-amber-400/20 bg-amber-50/60 flex items-center gap-6">
                  <Trophy className="w-10 h-10 text-amber-500" />
                  <div><p className="text-2xl font-black italic text-slate-900">+{aiResult.xpEarned} XP</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank Growth Points</p></div>
               </CardGlass>
               <button onClick={() => navigate(-1)} className="p-8 rounded-[2.5rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6">Return to Sector <ArrowRight className="w-6 h-6" /></button>
            </div>
         </div>
      </div>
    );
  }

  return null;
}
