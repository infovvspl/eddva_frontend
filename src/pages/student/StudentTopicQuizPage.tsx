import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Clock, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertTriangle, BarChart3,
  Target, ArrowLeft, Flame, BookOpen, Sparkles,
  Brain, Trophy,
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
  const [intVal, setIntVal] = useState("");
  useEffect(() => { setIntVal(""); }, [question.id]);

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Q{index + 1} / {total}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{question.difficulty}</span>
          {"topic" in question && question.topic && (
            <span className="text-xs text-muted-foreground">· {question.topic.name}</span>
          )}
          <div className="ml-auto flex items-center gap-1 text-xs">
            <span className="text-emerald-400">+{question.marksCorrect}</span>
            {question.marksWrong > 0 && <span className="text-red-400">  -{question.marksWrong}</span>}
          </div>
        </div>
        <p className="text-base font-medium text-foreground leading-relaxed">{question.content}</p>
      </div>

      {isInteger ? (
        <div className="bg-card border border-border rounded-2xl p-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Enter your answer</label>
          <input
            type="number" value={intVal}
            onChange={e => { setIntVal(e.target.value); onSelect(e.target.value); }}
            placeholder="Integer answer..."
            className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground text-center focus:outline-none focus:border-primary"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {question.options?.map(opt => {
            const sel = selected.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => onSelect(opt.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all
                  ${sel ? "bg-primary/10 border-primary/50 text-primary" : "bg-card border-border text-foreground hover:bg-secondary/40"}`}>
                <span className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold border
                  ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 border-border"}`}>
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

// ─── Results: Teacher Quiz ────────────────────────────────────────────────────

function TeacherQuizResults({ result, mockTest, onBack }: {
  result: SessionResult; mockTest: MockTestListItem; onBack: () => void;
}) {
  const total = result.totalCorrect + result.totalWrong + result.totalSkipped;
  const accuracy = total > 0 ? (result.totalCorrect / total) * 100 : 0;
  const passingPct = mockTest.passingMarks && mockTest.totalMarks
    ? (mockTest.passingMarks / mockTest.totalMarks) * 100 : 70;
  const passed = accuracy >= passingPct;
  const eb = result.errorBreakdown;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{passed ? "🏆" : "💪"}</div>
          <h1 className="text-2xl font-bold text-foreground">{passed ? "Topic Unlocked!" : "Quiz Complete"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{mockTest.title}</p>
        </div>
        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl mb-5 text-sm font-bold
          ${passed ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                   : "bg-amber-500/10 border border-amber-500/30 text-amber-400"}`}>
          {passed ? <><CheckCircle className="w-4 h-4" /> Passed — Next topic unlocked</>
                  : <><Target className="w-4 h-4" /> Need {passingPct.toFixed(0)}% to pass — Keep practising</>}
        </div>
        <ScoreRing accuracy={accuracy} score={result.totalScore} outOf={mockTest.totalMarks}
          correct={result.totalCorrect} wrong={result.totalWrong} skipped={result.totalSkipped} />
        {eb && result.totalWrong > 0 && <ErrorBreakdown eb={eb} totalWrong={result.totalWrong} />}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Flame className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-foreground">
            {passed ? "Great job! Your progress has been saved."
                    : "Review the topic and try again. You're building real understanding!"}
          </p>
        </div>
        <button onClick={onBack}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back to Topic
        </button>
      </div>
    </motion.div>
  );
}

// ─── Results: AI Quiz ─────────────────────────────────────────────────────────

function AiQuizResults({ result, quizData, reviewMap, onBack }: {
  result: AiQuizResult;
  quizData: AiQuizData;
  reviewMap: Record<string, string[]>;  // questionId → selectedOptionIds
  onBack: () => void;
}) {
  const [showReview, setShowReview] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{result.passed ? "🏆" : "💪"}</div>
          <h1 className="text-2xl font-bold text-foreground">{result.passed ? "Passed!" : "Quiz Complete"}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-400 font-medium">AI-Generated Quiz</span>
          </div>
        </div>

        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl mb-5 text-sm font-bold
          ${result.passed ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : "bg-amber-500/10 border border-amber-500/30 text-amber-400"}`}>
          {result.passed ? <><CheckCircle className="w-4 h-4" /> Passed — Next topic unlocked</>
                         : <><Target className="w-4 h-4" /> Need 70%+ to pass — Keep practising</>}
        </div>

        <ScoreRing
          accuracy={result.accuracy} score={result.score} outOf={result.totalMarks}
          correct={Math.round((result.accuracy / 100) * quizData.questions.length)}
          wrong={quizData.questions.length - Math.round((result.accuracy / 100) * quizData.questions.length)}
          skipped={0}
        />

        {result.xpEarned > 0 && (
          <div className="flex items-center justify-center gap-2 bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3 mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">+{result.xpEarned} XP Earned!</span>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mb-5">{result.message}</p>

        {/* Review answers toggle */}
        <button onClick={() => setShowReview(v => !v)}
          className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 mb-4 text-sm font-medium hover:bg-secondary/30 transition-colors">
          <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-violet-400" /> Review Answers</span>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showReview ? "rotate-90" : ""}`} />
        </button>

        <AnimatePresence>
          {showReview && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4">
              <div className="space-y-3">
                {quizData.questions.map((q, i) => {
                  const selected = reviewMap[q.id] ?? [];
                  const correctOpts = q.options.filter(o => o.isCorrect);
                  const correct = correctOpts.map(o => o.id);
                  const isRight = selected.length > 0 && selected.every(s => correct.includes(s));
                  const skipped = selected.length === 0;
                  return (
                    <div key={q.id} className={`rounded-xl border p-4 ${isRight ? "border-emerald-700/30 bg-emerald-950/20" : !skipped ? "border-red-700/30 bg-red-950/20" : "border-border bg-card"}`}>
                      {/* Question header */}
                      <div className="flex items-start gap-2 mb-3">
                        <span className={`mt-0.5 shrink-0 ${isRight ? "text-emerald-400" : !skipped ? "text-red-400" : "text-muted-foreground"}`}>
                          {isRight ? <CheckCircle className="w-4 h-4" /> : !skipped ? <XCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        </span>
                        <p className="text-sm font-medium text-foreground leading-relaxed">Q{i + 1}. {q.content}</p>
                      </div>

                      {/* Options list */}
                      <div className="space-y-1.5 ml-6 mb-3">
                        {q.options.map(opt => {
                          const wasSelected = selected.includes(opt.id);
                          let cls = "text-muted-foreground";
                          if (opt.isCorrect && wasSelected) cls = "bg-emerald-500/20 text-emerald-300 font-semibold ring-1 ring-emerald-600/40";
                          else if (opt.isCorrect) cls = "bg-emerald-500/15 text-emerald-300 font-semibold";
                          else if (wasSelected) cls = "bg-red-500/15 text-red-300 line-through";
                          return (
                            <div key={opt.id} className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 ${cls}`}>
                              <span className="shrink-0 font-bold">{opt.optionLabel}.</span>
                              <span className="flex-1">{opt.content}</span>
                              {opt.isCorrect && <CheckCircle className="w-3 h-3 shrink-0 text-emerald-400" />}
                              {wasSelected && !opt.isCorrect && <XCircle className="w-3 h-3 shrink-0 text-red-400" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Correct answer callout — shown when wrong or skipped */}
                      {!isRight && (
                        <div className="ml-6 mb-2 flex items-start gap-1.5 bg-emerald-500/10 border border-emerald-700/30 rounded-lg px-3 py-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-emerald-300">
                            <span className="font-semibold">Correct answer: </span>
                            {correctOpts.map(o => `${o.optionLabel}. ${o.content}`).join(", ")}
                          </p>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <p className="ml-6 text-xs text-amber-400/80 italic leading-relaxed">{q.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={onBack}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back to Topic
        </button>
      </div>
    </motion.div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ScoreRing({ accuracy, score, outOf, correct, wrong, skipped }: {
  accuracy: number; score: number; outOf: number;
  correct: number; wrong: number; skipped: number;
}) {
  return (
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
        <p className="text-2xl font-bold text-foreground">{score} pts</p>
        <p className="text-xs text-muted-foreground mb-2">out of {outOf}</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="w-3 h-3" />{correct} correct</span>
          <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" />{wrong} wrong</span>
          {skipped > 0 && <span className="text-xs text-muted-foreground">{skipped} skipped</span>}
        </div>
      </div>
    </div>
  );
}

function ErrorBreakdown({ eb, totalWrong }: { eb: any; totalWrong: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Error Analysis</p>
      </div>
      <div className="space-y-2">
        {[
          { key: "conceptual", label: "Concept gaps",   color: "#ef4444" },
          { key: "silly",      label: "Silly mistakes", color: "#f59e0b" },
          { key: "time",       label: "Time pressure",  color: "#6366f1" },
          { key: "guess",      label: "Guessed",        color: "#8b5cf6" },
        ].map(({ key, label, color }) => {
          const val = eb[key] ?? 0;
          if (!val) return null;
          return (
            <div key={key}>
              <div className="flex justify-between mb-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-bold text-foreground">{val}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(val / totalWrong) * 100}%` }}
                  transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quiz runner (shared top bar + question nav) ──────────────────────────────

function QuizRunner({
  title, isAi, questions, seconds, timerDanger,
  answers, currentQ, setCurrentQ,
  onSelect, onNext, onSubmit,
}: {
  title: string; isAi: boolean;
  questions: (QuizQuestion | AiQuizQuestion)[];
  seconds: number; timerDanger: boolean;
  answers: Record<string, string[]>;
  currentQ: number;
  setCurrentQ: (i: number) => void;
  onSelect: (v: string) => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const q = questions[currentQ];
  if (!q) return null;
  const selected = answers[q.id] ?? [];
  const isLast = currentQ === questions.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 mr-auto min-w-0">
            {isAi ? <Sparkles className="w-4 h-4 text-violet-400 shrink-0" /> : <ClipboardList className="w-4 h-4 text-primary shrink-0" />}
            <span className="font-bold text-foreground text-sm truncate">{title}</span>
            {isAi && <span className="text-[10px] font-semibold bg-violet-600/20 text-violet-400 px-1.5 py-0.5 rounded-md shrink-0">AI</span>}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm shrink-0
            ${timerDanger ? "bg-red-500/10 text-red-400 animate-pulse" : "bg-secondary/60 text-foreground"}`}>
            <Clock className="w-3.5 h-3.5" />{fmt(seconds)}
          </div>
          <button onClick={onSubmit}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shrink-0">
            Submit
          </button>
        </div>
        <div className="h-1 bg-secondary/30">
          <div className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <QuestionCard key={q.id} question={q} index={currentQ} total={questions.length}
            selected={selected} onSelect={onSelect} />
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setCurrentQ(Math.max(currentQ - 1, 0))} disabled={currentQ === 0}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors disabled:opacity-30">
            ← Previous
          </button>
          <div className="flex items-center gap-1 overflow-x-auto max-w-[140px]">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`shrink-0 rounded-full transition-all
                  ${i === currentQ ? "w-5 h-2 bg-primary" : answers[questions[i].id]?.length ? "w-2 h-2 bg-primary/50" : "w-2 h-2 bg-secondary"}`} />
            ))}
          </div>
          <button onClick={onNext}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all
              ${isLast ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : selected.length ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary/50 text-muted-foreground"}`}>
            {isLast ? "Submit →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Stage =
  | "loading"       // fetching mock tests
  | "no_quiz"       // no teacher quiz — offer AI option
  | "ai_generating" // calling AI to make questions
  | "info"          // show test info before starting (teacher quiz)
  | "ai_info"       // show AI quiz info before starting
  | "quiz"          // teacher quiz running
  | "ai_quiz"       // AI quiz running
  | "submitting"    // submitting teacher quiz
  | "ai_submitting" // submitting AI quiz result
  | "results"       // teacher quiz results
  | "ai_results";   // AI quiz results

export default function StudentTopicQuizPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const topicId = params.get("topicId") ?? "";

  const [stage, setStage]         = useState<Stage>("loading");
  const [mockTest, setMockTest]   = useState<MockTestListItem | null>(null);
  const [session, setSession]     = useState<TestSession | null>(null);
  const [questions, setQuestions] = useState<(QuizQuestion | AiQuizQuestion)[]>([]);
  const [aiQuizData, setAiQuizData] = useState<AiQuizData | null>(null);
  const [currentQ, setCurrentQ]  = useState(0);
  const [answers, setAnswers]     = useState<Record<string, string[]>>({});
  const [teacherResult, setTeacherResult] = useState<SessionResult | null>(null);
  const [aiResult, setAiResult]   = useState<AiQuizResult | null>(null);
  const [error, setError]         = useState("");

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

  // Prevent back during quiz
  useEffect(() => {
    if (!isRunning) return;
    const stop = (e: PopStateEvent) => { e.preventDefault(); window.history.pushState(null, "", window.location.href); };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", stop);
    return () => window.removeEventListener("popstate", stop);
  }, [isRunning]);

  // Load mock tests
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

  // ── Teacher quiz ──────────────────────────────────────────────────────────

  const handleTeacherStart = async () => {
    if (!mockTest) return;
    setStage("loading"); setError("");
    try {
      const sess = await startSession(mockTest.id);
      setSession(sess);
      setQuestions(sess.questions ?? []);
      setCurrentQ(0); setAnswers({});
      setStage("quiz");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to start quiz.");
      setStage("info");
    }
  };

  const handleTeacherSelect = async (optionId: string) => {
    const q = questions[currentQ] as QuizQuestion;
    if (!q || !session) return;
    const isInteger = q.type === "integer";
    const isMulti = q.type === "mcq_multi";
    let next: string[];
    if (isInteger) next = [optionId];
    else if (isMulti) {
      const prev = answers[q.id] ?? [];
      next = prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId];
    } else next = [optionId];
    setAnswers(a => ({ ...a, [q.id]: next }));
    try { await submitAnswer(session.id, { questionId: q.id, selectedOptionIds: isInteger ? undefined : next, integerResponse: isInteger ? optionId : undefined }); } catch { /* ok */ }
  };

  const handleTeacherSubmit = async (timedOut: boolean) => {
    if (!session) return;
    if (timedOut) toast.warning("Time's up!");
    setStage("submitting");
    try {
      const res = await submitSession(session.id);
      setTeacherResult(res); setStage("results");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Submit failed.");
      setStage("quiz");
    }
  };

  // ── AI quiz ───────────────────────────────────────────────────────────────

  const handleAiGenerate = async () => {
    setStage("ai_generating"); setError("");
    try {
      const data = await generateAiQuiz(topicId);
      setAiQuizData(data);
      setStage("ai_info");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "AI failed to generate quiz.");
      setStage("no_quiz");
    }
  };

  const handleAiStart = () => {
    if (!aiQuizData) return;
    setQuestions(aiQuizData.questions);
    setCurrentQ(0); setAnswers({});
    setStage("ai_quiz");
  };

  const handleAiSelect = (optionId: string) => {
    const q = questions[currentQ];
    if (!q) return;
    const prev = answers[q.id] ?? [];
    const next = prev.includes(optionId) ? prev.filter(id => id !== optionId) : [optionId];
    setAnswers(a => ({ ...a, [q.id]: next }));
  };

  const handleAiSubmit = async (timedOut: boolean) => {
    if (timedOut) toast.warning("Time's up!");
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
    const score = correct * 4 - wrong;
    const accuracy = qs.length > 0 ? (correct / qs.length) * 100 : 0;

    try {
      const res = await completeAiQuiz(topicId, {
        score: Math.max(0, score),
        totalMarks: aiQuizData.totalMarks,
        accuracy,
        correctCount: correct,
        wrongCount: wrong,
      });
      setAiResult(res); setStage("ai_results");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Submit failed.");
      setStage("ai_quiz");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (stage === "loading" || stage === "ai_generating" || stage === "submitting" || stage === "ai_submitting") {
    const msgs: Record<string, string> = {
      loading: "Preparing quiz...",
      ai_generating: "AI is crafting your quiz questions…",
      submitting: "Analysing your answers...",
      ai_submitting: "Calculating your score...",
    };
    const isAiGen = stage === "ai_generating";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-5">
        {isAiGen ? (
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-2xl border border-violet-500/20 animate-ping" />
          </div>
        ) : (
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        )}
        <p className="text-muted-foreground font-medium">{msgs[stage]}</p>
        {isAiGen && (
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-violet-500"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (stage === "no_quiz") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-center mb-6">
            <BookOpen className="w-14 h-14 mx-auto mb-3 text-muted-foreground opacity-30" />
            <h2 className="text-xl font-bold text-foreground mb-1">No Quiz Available</h2>
            <p className="text-sm text-muted-foreground">Your teacher hasn't created a quiz for this topic yet.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* AI quiz offer */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950/60 to-slate-900/80 border border-violet-700/40 p-6 mb-4">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/25 border border-violet-600/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-base mb-1">Take an AI-Generated Quiz</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Our AI will generate 5 topic-specific questions based on your exam target. Results update your progress just like a real quiz.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["5 Questions", "15 mins", "4 marks/correct", "−1 wrong", "+15 XP if passed"].map(tag => (
                    <span key={tag} className="text-xs bg-violet-900/40 border border-violet-700/30 text-violet-300 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <button onClick={handleAiGenerate}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generate AI Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (stage === "ai_info" && aiQuizData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg">
          <button onClick={() => setStage("no_quiz")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-600/30 flex items-center justify-center mb-5">
            <Sparkles className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">AI Quiz Ready</h1>
          <p className="text-sm text-muted-foreground mb-1">{aiQuizData.topicName}</p>
          <div className="flex items-center gap-1.5 text-xs text-violet-400 mb-6">
            <Sparkles className="w-3 h-3" /> AI-Generated · {aiQuizData.questions.length} Questions
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{aiQuizData.durationMinutes} minutes</p>
                <p className="text-xs text-muted-foreground">Time limit</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{aiQuizData.passingMarks} / {aiQuizData.totalMarks} marks to pass (70%)</p>
                <p className="text-xs text-muted-foreground">Passing score · +15 XP if you pass</p>
              </div>
            </div>
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs font-medium text-amber-400">Timer cannot be paused once started.</p>
              </div>
            </div>
          </div>

          <button onClick={handleAiStart}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-700 to-violet-600 text-white font-bold text-base hover:from-violet-600 hover:to-violet-500 transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2">
            Start AI Quiz <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  if (stage === "info" && mockTest) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
            <ClipboardList className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{mockTest.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">Topic Quiz · Test your understanding</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{mockTest.durationMinutes} minutes</p>
                <p className="text-xs text-muted-foreground">Time limit</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {mockTest.passingMarks ?? Math.ceil(mockTest.totalMarks * 0.7)} / {mockTest.totalMarks} marks to pass
                </p>
                <p className="text-xs text-muted-foreground">Passing score</p>
              </div>
            </div>
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs font-medium text-amber-400">Timer cannot be paused once started.</p>
              </div>
            </div>
          </div>

          <button onClick={handleTeacherStart}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
            Start Quiz <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  if (stage === "results" && teacherResult && mockTest) {
    return <TeacherQuizResults result={teacherResult} mockTest={mockTest} onBack={() => navigate(-1)} />;
  }

  if (stage === "ai_results" && aiResult && aiQuizData) {
    return <AiQuizResults result={aiResult} quizData={aiQuizData} reviewMap={answers} onBack={() => navigate(-1)} />;
  }

  // Quiz running
  if (stage === "quiz") {
    return (
      <QuizRunner
        title={mockTest?.title ?? "Topic Quiz"} isAi={false}
        questions={questions} seconds={seconds} timerDanger={seconds <= 60}
        answers={answers} currentQ={currentQ} setCurrentQ={setCurrentQ}
        onSelect={handleTeacherSelect}
        onNext={() => { if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1); else handleTeacherSubmit(false); }}
        onSubmit={() => handleTeacherSubmit(false)}
      />
    );
  }

  if (stage === "ai_quiz") {
    return (
      <QuizRunner
        title={aiQuizData?.topicName ?? "AI Quiz"} isAi={true}
        questions={questions} seconds={seconds} timerDanger={seconds <= 60}
        answers={answers} currentQ={currentQ} setCurrentQ={setCurrentQ}
        onSelect={handleAiSelect}
        onNext={() => { if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1); else handleAiSubmit(false); }}
        onSubmit={() => handleAiSubmit(false)}
      />
    );
  }

  return null;
}
