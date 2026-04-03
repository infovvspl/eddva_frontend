import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Clock, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertTriangle, BarChart3,
  Target, ArrowLeft, Flame, BookOpen, Sparkles,
  Brain, Trophy, Search, Play,
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

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

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
      <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-black px-3 py-1 rounded-xl" style={{ background: BLUE_L, color: BLUE }}>
            Q{index + 1} / {total}
          </span>
          <span className="text-xs font-bold text-gray-400 capitalize bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{question.difficulty}</span>
          {"topic" in question && question.topic && (
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 truncate max-w-[150px]">{question.topic.name}</span>
          )}
          <div className="ml-auto flex items-center gap-1.5 text-[11px] font-black tracking-wider">
            <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">+{question.marksCorrect}</span>
            {question.marksWrong > 0 && <span className="text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100">-{question.marksWrong}</span>}
          </div>
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
            const sel = selected.includes(opt.id);
            return (
              <motion.button
                whileHover={!sel ? { scale: 1.01 } : {}} whileTap={{ scale: 0.99 }}
                key={opt.id} onClick={() => onSelect(opt.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all
                  ${sel ? "shadow-md" : "bg-white border-gray-100 text-gray-800 hover:border-blue-200"}`}
                style={sel ? { background: BLUE_L, borderColor: BLUE, color: BLUE } : {}}
              >
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-black border-2 transition-colors
                  ${sel ? "border-transparent" : "border-gray-200 text-gray-500"}`}
                  style={sel ? { background: BLUE, color: "#fff" } : {}}>
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
      className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F5F7FB" }}>
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm w-full max-w-lg p-6 sm:p-8">
        <div className="text-center mb-6">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg"
            style={{ background: passed ? `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` : "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            {passed ? <Trophy className="w-10 h-10 text-white" /> : <Flame className="w-10 h-10 text-white" />}
          </div>
          <h1 className="text-2xl font-black text-gray-900">{passed ? "Topic Unlocked!" : "Quiz Complete"}</h1>
          <p className="text-gray-400 font-medium mt-1 text-sm">{mockTest.title}</p>
        </div>

        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl mb-6 text-sm font-bold
          ${passed ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                   : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
          {passed ? <><CheckCircle className="w-4 h-4" /> Passed — Next topic unlocked</>
                  : <><Target className="w-4 h-4" /> Need {passingPct.toFixed(0)}% to pass — Keep practising</>}
        </div>

        <ScoreRing accuracy={accuracy} score={result.totalScore} outOf={mockTest.totalMarks}
          correct={result.totalCorrect} wrong={result.totalWrong} skipped={result.totalSkipped} />

        {eb && result.totalWrong > 0 && <ErrorBreakdown eb={eb} totalWrong={result.totalWrong} />}

        <div className="mt-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onBack}
            className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}>
            <ArrowLeft className="w-4 h-4" /> Back to Topic
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Results: AI Quiz ─────────────────────────────────────────────────────────
function AiQuizResults({ result, quizData, reviewMap, onBack }: {
  result: AiQuizResult; quizData: AiQuizData;
  reviewMap: Record<string, string[]>; onBack: () => void;
}) {
  const [showReview, setShowReview] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen p-4 py-8" style={{ background: "#F5F7FB" }}>
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm w-full max-w-lg mx-auto p-6 sm:p-8">
        <div className="text-center mb-6">
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg"
            style={{ background: result.passed ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            {result.passed ? <Trophy className="w-10 h-10 text-white" /> : <Flame className="w-10 h-10 text-white" />}
          </div>
          <h1 className="text-2xl font-black text-gray-900">{result.passed ? "Passed!" : "Quiz Complete"}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-600 px-3 py-1 rounded-full text-xs font-bold border border-violet-100">
              <Sparkles className="w-3.5 h-3.5" /> AI-Generated Quiz
            </span>
          </div>
        </div>

        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl mb-6 text-sm font-bold
          ${result.passed ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
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
          <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-6">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-amber-600">+{result.xpEarned} XP Earned!</span>
          </div>
        )}

        <button onClick={() => setShowReview(v => !v)}
          className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 mb-4 text-sm font-bold hover:bg-gray-100 transition-colors text-gray-800">
          <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-violet-500" /> Review Answers</span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showReview ? "rotate-90" : ""}`} />
        </button>

        <AnimatePresence>
          {showReview && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6">
              <div className="space-y-3">
                {quizData.questions.map((q, i) => {
                  const selected = reviewMap[q.id] ?? [];
                  const correctOpts = q.options.filter(o => o.isCorrect);
                  const correct = correctOpts.map(o => o.id);
                  const isRight = selected.length > 0 && selected.every(s => correct.includes(s));
                  const skipped = selected.length === 0;
                  return (
                    <div key={q.id} className={`rounded-2xl border p-4 ${isRight ? "border-emerald-100 bg-emerald-50" : !skipped ? "border-red-100 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                      <div className="flex items-start gap-2 mb-3">
                        <span className={`mt-0.5 shrink-0 ${isRight ? "text-emerald-500" : !skipped ? "text-red-500" : "text-gray-400"}`}>
                          {isRight ? <CheckCircle className="w-4 h-4" /> : !skipped ? <XCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        </span>
                        <p className="text-sm font-bold text-gray-900 leading-relaxed">Q{i + 1}. {q.content}</p>
                      </div>

                      <div className="space-y-1.5 ml-6 mb-3">
                        {q.options.map(opt => {
                          const wasSelected = selected.includes(opt.id);
                          let cls = "text-gray-500";
                          if (opt.isCorrect && wasSelected) cls = "bg-emerald-100 text-emerald-700 font-bold border border-emerald-200";
                          else if (opt.isCorrect) cls = "bg-emerald-50 text-emerald-600 font-bold border border-emerald-100";
                          else if (wasSelected) cls = "bg-red-100 text-red-700 line-through border border-red-200";
                          return (
                            <div key={opt.id} className={`text-xs px-3 py-2 rounded-xl flex items-center gap-2 ${cls}`}>
                              <span className="shrink-0 font-black">{opt.optionLabel}.</span>
                              <span className="flex-1 font-medium">{opt.content}</span>
                              {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />}
                              {wasSelected && !opt.isCorrect && <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />}
                            </div>
                          );
                        })}
                      </div>

                      {!isRight && (
                        <div className="ml-6 mb-3 flex items-start gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-emerald-700">
                            <span className="font-black">Correct answer: </span>
                            <span className="font-medium">{correctOpts.map(o => `${o.optionLabel}. ${o.content}`).join(", ")}</span>
                          </p>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="ml-6 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onBack}
          className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}>
          <ArrowLeft className="w-4 h-4" /> Back to Topic
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function ScoreRing({ accuracy, score, outOf, correct, wrong, skipped }: {
  accuracy: number; score: number; outOf: number;
  correct: number; wrong: number; skipped: number;
}) {
  const color = accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 mb-6 flex items-center gap-6">
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
          <circle cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - accuracy / 100)}`}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-gray-900">{accuracy.toFixed(0)}%</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-3xl font-black text-gray-900">{score}</p>
        <p className="text-xs font-bold text-gray-400 mb-2 tracking-wide uppercase">out of {outOf} pts</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg"><CheckCircle className="w-3 h-3" />{correct}</span>
          <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg"><XCircle className="w-3 h-3" />{wrong}</span>
          {skipped > 0 && <span className="text-xs font-bold text-gray-500">{skipped} skipped</span>}
        </div>
      </div>
    </div>
  );
}

function ErrorBreakdown({ eb, totalWrong }: { eb: any; totalWrong: number }) {
  return (
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
          const val = eb[key] ?? 0;
          if (!val) return null;
          return (
            <div key={key}>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-500">{label}</span>
                <span className="text-xs font-black text-gray-900">{val} / {totalWrong}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
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
  currentQ: number; setCurrentQ: (i: number) => void;
  onSelect: (v: string) => void; onNext: () => void; onSubmit: () => void;
}) {
  const q = questions[currentQ];
  if (!q) return null;
  const selected = answers[q.id] ?? [];
  const isLast = currentQ === questions.length - 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F7FB" }}>
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              {isAi ? <Sparkles className="w-4 h-4 text-violet-500 shrink-0" /> : <ClipboardList className="w-4 h-4 text-gray-400 shrink-0" style={{ color: BLUE }} />}
              <span className="font-black text-gray-900 text-sm truncate">{title}</span>
            </div>
            {isAi && <span className="text-[10px] font-bold text-violet-500 mt-0.5">AI QUIZ</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-sm shrink-0 border
              ${timerDanger ? "bg-red-50 border-red-100 text-red-500 animate-pulse" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
              <Clock className="w-3.5 h-3.5" />{fmt(seconds)}
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onSubmit}
              className="px-4 py-2 rounded-xl text-white text-xs font-black transition-colors shrink-0 shadow-sm"
              style={{ background: BLUE }}>
              Submit
            </motion.button>
          </div>
        </div>
        <div className="h-1 bg-gray-100">
          <div className="h-full transition-all duration-300"
            style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, background: BLUE }} />
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <QuestionCard key={q.id} question={q} index={currentQ} total={questions.length}
              selected={selected} onSelect={onSelect} />
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between bg-white border border-gray-100 rounded-3xl p-3 shadow-sm">
          <button onClick={() => setCurrentQ(Math.max(currentQ - 1, 0))} disabled={currentQ === 0}
            className="px-5 py-2.5 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30">
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
          <button onClick={onNext}
            className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all shadow-sm
              ${isLast ? "bg-emerald-500 text-white"
                : selected.length ? "text-white"
                : "bg-gray-100 text-gray-400"}`}
            style={!isLast && selected.length ? { background: BLUE } : {}}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Stage = "loading" | "no_quiz" | "ai_generating" | "info" | "ai_info" | "quiz" | "ai_quiz" | "submitting" | "ai_submitting" | "results" | "ai_results";

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
  const timerDanger = isRunning && seconds < 120;

  const handleTimeUp = useCallback(() => {
    if (stage === "quiz" && session) handleTeacherSubmit(true);
    if (stage === "ai_quiz") handleAiSubmit(true);
  }, [stage, session]); // eslint-disable-line

  const seconds = useTimer(durationSec, isRunning, handleTimeUp);

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
      setSession(sess); setQuestions(sess.questions ?? []); setCurrentQ(0); setAnswers({}); setStage("quiz");
    } catch (err: any) { setError(err?.response?.data?.message ?? "Failed to start quiz."); setStage("info"); }
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
    try { const res = await submitSession(session.id); setTeacherResult(res); setStage("results"); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? "Submit failed."); setStage("quiz"); }
  };

  // ── AI quiz ───────────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    setStage("ai_generating"); setError("");
    try { const data = await generateAiQuiz(topicId); setAiQuizData(data); setStage("ai_info"); }
    catch (err: any) { setError(err?.response?.data?.message ?? "AI failed to generate quiz."); setStage("no_quiz"); }
  };

  const handleAiStart = () => {
    if (!aiQuizData) return;
    setQuestions(aiQuizData.questions); setCurrentQ(0); setAnswers({}); setStage("ai_quiz");
  };

  const handleAiSelect = (optionId: string) => {
    const q = questions[currentQ]; if (!q) return;
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
      const res = await completeAiQuiz(topicId, { score: Math.max(0, score), totalMarks: aiQuizData.totalMarks, accuracy, correctCount: correct, wrongCount: wrong });
      setAiResult(res); setStage("ai_results");
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Submit failed."); setStage("ai_quiz"); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (stage === "loading" || stage === "ai_generating" || stage === "submitting" || stage === "ai_submitting") {
    const msgs: Record<string, string> = { loading: "Preparing quiz...", ai_generating: "AI is crafting your quiz questions…", submitting: "Analysing your answers...", ai_submitting: "Calculating your score..." };
    const isAiGen = stage === "ai_generating";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-5">
        {isAiGen ? (
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-violet-100 flex items-center justify-center shadow-inner">
              <Sparkles className="w-10 h-10 text-violet-500 animate-pulse" />
            </div>
            <div className="absolute -inset-4 rounded-3xl border-2 border-violet-200 animate-ping opacity-50" />
          </div>
        ) : (
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: BLUE }} />
        )}
        <p className="text-gray-500 font-bold tracking-wide uppercase text-sm mt-2">{msgs[stage]}</p>
      </div>
    );
  }

  if (stage === "no_quiz") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F5F7FB" }}>
        <div className="w-full max-w-lg">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center mb-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gray-50 border border-gray-100">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-1">No Quiz Available</h2>
            <p className="text-sm text-gray-400 font-medium tracking-wide">Your teacher hasn't created a quiz for this topic yet.</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl px-5 py-4 mb-5 shadow-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}
          <div className="relative overflow-hidden rounded-3xl shadow-lg border-2 border-violet-200 p-8" style={{ background: "linear-gradient(135deg, #F5F3FF, #EEF2FF)" }}>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm text-violet-500">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">AI-Generated Quiz</h3>
                  <p className="text-sm font-bold text-violet-500">Instant personalized practice</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                Our AI will instantly generate 5 targeted questions. Complete it to update your progress exactly like a real quiz.
              </p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAiGenerate}
                className="w-full py-4 rounded-2xl text-white text-sm font-black transition-all shadow-md flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                <Sparkles className="w-4 h-4" /> Generate Practice Quiz
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (stage === "ai_info" && aiQuizData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F5F7FB" }}>
        <div className="w-full max-w-lg">
          <button onClick={() => setStage("no_quiz")} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-violet-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">AI Quiz Ready</h1>
            <p className="text-sm font-bold text-gray-400 mb-6">{aiQuizData.topicName}</p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-black text-gray-900">{aiQuizData.durationMinutes} minutes</p>
                  <p className="text-xs font-bold text-gray-400 tracking-wide uppercase">Time limit</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-gray-900">{aiQuizData.passingMarks} / {aiQuizData.totalMarks} marks</p>
                  <p className="text-xs font-bold text-gray-400 tracking-wide uppercase">Passing score (70%)</p>
                </div>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAiStart}
              className="w-full py-4 rounded-2xl text-white font-black text-base shadow-md flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
              Start AI Quiz <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (stage === "info" && mockTest) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F5F7FB" }}>
        <div className="w-full max-w-lg">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: BLUE_L }}>
              <ClipboardList className="w-8 h-8" style={{ color: BLUE }} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">{mockTest.title}</h1>
            <p className="text-sm font-bold text-gray-400 mb-6 tracking-wide uppercase">Topic Quiz</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl px-5 py-4 mb-5 shadow-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-black text-gray-900">{mockTest.durationMinutes} min</p>
                  <p className="text-xs font-bold text-gray-400 tracking-wide uppercase">Time Limit</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-gray-900">{mockTest.passingMarks ?? Math.ceil(mockTest.totalMarks * 0.7)} / {mockTest.totalMarks}</p>
                  <p className="text-xs font-bold text-gray-400 tracking-wide uppercase">Passing Score</p>
                </div>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTeacherStart}
              className="w-full py-4 rounded-2xl text-white font-black text-base shadow-md flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}>
              Start Quiz <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (stage === "quiz" || stage === "ai_quiz") {
    return <QuizRunner title={stage === "ai_quiz" ? aiQuizData?.topicName ?? "AI Quiz" : mockTest?.title ?? "Topic Quiz"}
      isAi={stage === "ai_quiz"} questions={questions} seconds={seconds} timerDanger={timerDanger} answers={answers}
      currentQ={currentQ} setCurrentQ={setCurrentQ} onSelect={stage === "quiz" ? handleTeacherSelect : handleAiSelect}
      onNext={() => { if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1); else stage === "quiz" ? handleTeacherSubmit(false) : handleAiSubmit(false); }}
      onSubmit={() => stage === "quiz" ? handleTeacherSubmit(false) : handleAiSubmit(false)} />;
  }

  if (stage === "results" && teacherResult && mockTest) {
    return <TeacherQuizResults result={teacherResult} mockTest={mockTest} onBack={() => navigate(`/student/learn/topic/${topicId}`)} />;
  }

  if (stage === "ai_results" && aiResult && aiQuizData) {
    return <AiQuizResults result={aiResult} quizData={aiQuizData} reviewMap={answers} onBack={() => navigate(`/student/learn/topic/${topicId}`)} />;
  }

  return null;
}
