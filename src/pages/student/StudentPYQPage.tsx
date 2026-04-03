import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, XCircle, ChevronRight,
  Trophy, RefreshCw, Play, RotateCcw, Calendar, Zap, Filter,
  Loader2, Target,
} from "lucide-react";
import { useStartPYQSession, useSubmitPYQAnswer } from "@/hooks/use-student";
import type { PYQQuestion, PYQSubmitResult } from "@/lib/api/student";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

const EXAM_LABELS: Record<string, string> = {
  jee_mains: "JEE Mains", jee_advanced: "JEE Advanced", neet: "NEET",
};
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

type QuizPhase = "setup" | "quiz" | "result";
interface SessionResult { questionId: string; isCorrect: boolean; xpAwarded: number; }

const difficultyStyle: Record<string, { color: string; bg: string }> = {
  easy:   { color: "#059669", bg: "#ECFDF5" },
  medium: { color: "#d97706", bg: "#FFFBEB" },
  hard:   { color: "#ef4444", bg: "#FEF2F2" },
};

// ─── Quiz Question ─────────────────────────────────────────────────────────────
function QuizQuestion({ question, qNumber, total, onNext, isLast }: {
  question: PYQQuestion; qNumber: number; total: number;
  onNext: (result: SessionResult) => void; isLast: boolean;
}) {
  const [selected, setSelected]         = useState<string[]>([]);
  const [intInput, setIntInput]         = useState("");
  const [submitResult, setSubmitResult] = useState<PYQSubmitResult | null>(null);
  const [startTime]                     = useState(Date.now());
  const submitMutation = useSubmitPYQAnswer();

  const isAnswered = !!submitResult;
  const correctIds = submitResult?.correctOptionIds ?? [];
  const diff = difficultyStyle[question.difficulty] ?? difficultyStyle.medium;

  async function handleSubmit() {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const payload: Record<string, unknown> = { timeTakenSeconds: timeTaken };
    if (question.type === "integer") payload.integerResponse = intInput;
    else payload.selectedOptionIds = selected;
    const res = await submitMutation.mutateAsync({ topicId: question.topicId, questionId: question.id, payload });
    setSubmitResult(res);
  }

  const canSubmit = question.type === "integer" ? intInput.trim() !== "" : selected.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-gray-500 shrink-0">{qNumber} / {total}</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: BLUE_L }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: BLUE_M }}
            initial={{ width: 0 }}
            animate={{ width: `${(qNumber / total) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
        {/* Meta badges */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black" style={{ background: BLUE_L, color: BLUE }}>
            <Calendar className="w-3 h-3" /> {question.pyqYear}
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 bg-gray-50">
            {EXAM_LABELS[question.pyqExam] ?? question.pyqExam}
          </span>
          {question.pyqShift && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 bg-gray-50">
              {question.pyqShift}
            </span>
          )}
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize" style={diff}>
            {question.difficulty}
          </span>
        </div>

        {/* Question text */}
        <p className="text-sm leading-relaxed text-gray-800 font-medium whitespace-pre-wrap mb-4">
          {question.questionText}
        </p>
        {question.questionImageUrl && (
          <img src={question.questionImageUrl} alt="question" className="max-h-48 rounded-xl object-contain mb-4" />
        )}

        {/* Options / Integer */}
        {question.type === "integer" ? (
          <div className="space-y-3">
            <input
              type="text" value={intInput} onChange={e => setIntInput(e.target.value)}
              disabled={isAnswered} placeholder="Enter integer answer"
              className="border border-gray-200 rounded-2xl px-4 py-3 text-sm w-56 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 disabled:opacity-60 transition-all"
            />
            {submitResult && (
              <p className="text-sm text-gray-700">
                Correct answer: <span className="font-black text-green-600">{submitResult.correctIntegerAnswer}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {question.options.map(opt => {
              const isSel = selected.includes(opt.id);
              const isCorrectOpt = correctIds.includes(opt.id);
              let style: React.CSSProperties = { background: "#F9FAFB", borderColor: "#E5E7EB", color: "#374151" };
              if (isAnswered) {
                if (isCorrectOpt)      style = { background: "#ECFDF5", borderColor: "#6EE7B7", color: "#065F46" };
                else if (isSel)        style = { background: "#FEF2F2", borderColor: "#FCA5A5", color: "#991B1B" };
                else                   style = { background: "#F9FAFB", borderColor: "#E5E7EB", color: "#9CA3AF", opacity: 0.6 };
              } else if (isSel) {
                style = { background: BLUE_L, borderColor: BLUE_M, color: BLUE };
              }
              return (
                <motion.div
                  key={opt.id}
                  whileHover={!isAnswered ? { scale: 1.01 } : {}}
                  onClick={() => {
                    if (isAnswered) return;
                    if (question.type === "mcq_single") setSelected([opt.id]);
                    else setSelected(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]);
                  }}
                  className="rounded-2xl border-2 px-4 py-3.5 text-sm transition-all select-none"
                  style={{ ...style, cursor: isAnswered ? "default" : "pointer" }}
                >
                  {opt.text}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Submit */}
        {!isAnswered && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!canSubmit || submitMutation.isPending}
            className="mt-5 w-full py-3.5 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})`, boxShadow: `0 4px 16px ${BLUE}30` }}
          >
            {submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit Answer"}
          </motion.button>
        )}

        {/* Result */}
        {isAnswered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
            {/* Correct / Wrong banner */}
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm"
              style={submitResult.isCorrect
                ? { background: "#ECFDF5", color: "#065F46" }
                : { background: "#FEF2F2", color: "#991B1B" }}
            >
              {submitResult.isCorrect
                ? <><CheckCircle className="w-5 h-5" /> Correct!
                    {submitResult.xpAwarded > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black">
                        <Zap className="w-3 h-3" /> +{submitResult.xpAwarded} XP
                      </span>
                    )}
                  </>
                : <><XCircle className="w-5 h-5" /> Incorrect</>}
            </div>

            {/* Explanation */}
            {submitResult.explanation && (
              <div className="p-4 rounded-2xl" style={{ background: BLUE_L, border: `1px solid ${BLUE_M}25` }}>
                <span className="font-black text-xs block mb-1" style={{ color: BLUE }}>Explanation</span>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{submitResult.explanation}</p>
              </div>
            )}

            {/* Next button */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onNext({ questionId: question.id, isCorrect: submitResult.isCorrect, xpAwarded: submitResult.xpAwarded })}
              className="w-full py-3.5 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all"
              style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})`, boxShadow: `0 4px 16px ${BLUE}30` }}
            >
              {isLast ? <><Trophy className="w-4 h-4" /> See Results</> : <><ChevronRight className="w-4 h-4" /> Next Question</>}
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Result Screen ─────────────────────────────────────────────────────────────
function ResultScreen({ results, total, onRestart }: {
  results: SessionResult[]; total: number; onRestart: () => void;
}) {
  const correct  = results.filter(r => r.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalXP  = results.reduce((s, r) => s + r.xpAwarded, 0);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm text-center">
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}
        >
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Quiz Complete!</h2>
        <p className="text-gray-400 text-sm mt-1 mb-7">Here's how you did</p>

        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-8">
          {[
            { val: correct, label: "Correct", color: "#059669", bg: "#ECFDF5" },
            { val: `${accuracy}%`, label: "Accuracy", color: BLUE, bg: BLUE_L },
            { val: `+${totalXP}`, label: "XP Earned", color: "#d97706", bg: "#FFFBEB" },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-3.5" style={{ background: stat.bg }}>
              <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.val}</div>
              <div className="text-xs font-semibold text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white text-sm font-black transition-all"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})`, boxShadow: `0 4px 16px ${BLUE}30` }}
        >
          <RotateCcw className="w-4 h-4" /> Practice Again
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────
function buildCacheKey(topicId: string, filters: Record<string, unknown>) {
  return `pyq_session:${topicId}:${JSON.stringify(filters)}`;
}
function readCache(key: string): PYQQuestion[] | null {
  try { const r = sessionStorage.getItem(key); if (!r) return null; const p = JSON.parse(r) as PYQQuestion[]; return p.length > 0 ? p : null; } catch { return null; }
}
function writeCache(key: string, questions: PYQQuestion[]) {
  try { sessionStorage.setItem(key, JSON.stringify(questions)); } catch {}
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentPYQPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate    = useNavigate();

  const [phase, setPhase]               = useState<QuizPhase>("setup");
  const [questions, setQuestions]       = useState<PYQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults]           = useState<SessionResult[]>([]);
  const [startYear, setStartYear]       = useState("all");
  const [endYear, setEndYear]           = useState("all");
  const [exam, setExam]                 = useState("all");
  const [difficulty, setDifficulty]     = useState("all");
  const [questionType, setQuestionType] = useState("all");
  const [cachedCount, setCachedCount]   = useState(0);
  const startSession = useStartPYQSession();

  function activeFilters() {
    const f: Record<string, unknown> = {};
    if (startYear !== "all") f.startYear = parseInt(startYear);
    if (endYear !== "all") f.endYear = parseInt(endYear);
    if (exam !== "all") f.exam = exam;
    if (difficulty !== "all") f.difficulty = difficulty;
    if (questionType !== "all") f.type = questionType;
    return f;
  }

  useEffect(() => {
    const cached = readCache(buildCacheKey(topicId!, activeFilters()));
    setCachedCount(cached?.length ?? 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, startYear, endYear, exam, difficulty, questionType]);

  async function handleStart() {
    const filters = activeFilters();
    const cacheKey = buildCacheKey(topicId!, filters);
    const cached = readCache(cacheKey);
    if (cached) { setQuestions(cached); setCurrentIndex(0); setResults([]); setPhase("quiz"); return; }
    const payload: Record<string, unknown> = { limit: 200, ...filters };
    const data = await startSession.mutateAsync({ topicId: topicId!, payload });
    if (!data.questions.length) { toast.error("Could not generate questions. Please try again."); return; }
    writeCache(cacheKey, data.questions);
    setQuestions(data.questions);
    setCurrentIndex(0);
    setResults([]);
    setPhase("quiz");
  }

  function handleNext(result: SessionResult) {
    const newResults = [...results, result];
    setResults(newResults);
    const next = currentIndex + 1;
    if (next >= questions.length) setPhase("result");
    else setCurrentIndex(next);
  }

  function handleRestart() {
    setPhase("setup"); setQuestions([]); setCurrentIndex(0); setResults([]);
  }

  const selClass = "w-full border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50 focus:border-blue-400 transition-all";

  return (
    <div className="min-h-screen p-5 sm:p-6" style={{ background: "#F5F7FB" }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => phase === "quiz" ? handleRestart() : navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900">PYQ Practice</h1>
            <p className="text-sm text-gray-400 font-medium">Previous Year Questions</p>
          </div>
        </div>

        {/* Setup */}
        {phase === "setup" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: BLUE_L }}>
                  <Filter className="w-5 h-5" style={{ color: BLUE }} />
                </div>
                <div>
                  <h2 className="font-black text-gray-900 text-base">Configure Session</h2>
                  <p className="text-xs text-gray-400">Choose your filters to start practicing</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Year range */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "From Year", val: startYear, set: setStartYear },
                    { label: "To Year",   val: endYear,   set: setEndYear   },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">{f.label}</label>
                      <Select value={f.val} onValueChange={f.set}>
                        <SelectTrigger className={selClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {/* Exam */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Exam</label>
                  <Select value={exam} onValueChange={setExam}>
                    <SelectTrigger className={selClass}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Exams</SelectItem>
                      {Object.entries(EXAM_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Difficulty</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["all", "easy", "medium", "hard"].map(d => (
                      <button key={d}
                        onClick={() => setDifficulty(d)}
                        className="py-2.5 rounded-xl text-xs font-bold border-2 transition-all capitalize"
                        style={difficulty === d
                          ? d === "all" ? { background: BLUE, color: "#fff", borderColor: BLUE }
                          : d === "easy" ? { background: "#ECFDF5", color: "#059669", borderColor: "#6EE7B7" }
                          : d === "medium" ? { background: "#FFFBEB", color: "#d97706", borderColor: "#FCD34D" }
                          : { background: "#FEF2F2", color: "#ef4444", borderColor: "#FCA5A5" }
                          : { background: "#F9FAFB", color: "#9CA3AF", borderColor: "#E5E7EB" }}
                      >
                        {d === "all" ? "All" : d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Type */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Question Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: "all",        label: "All Types"    },
                      { val: "mcq_single", label: "MCQ (Single)" },
                      { val: "mcq_multi",  label: "MCQ (Multi)"  },
                      { val: "integer",    label: "Integer"      },
                    ].map(opt => (
                      <button key={opt.val}
                        onClick={() => setQuestionType(opt.val)}
                        className="py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                        style={questionType === opt.val
                          ? { background: BLUE_L, color: BLUE, borderColor: BLUE_M }
                          : { background: "#F9FAFB", color: "#9CA3AF", borderColor: "#E5E7EB" }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="mt-6 w-full py-4 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})`, boxShadow: `0 4px 16px ${BLUE}30` }}
                onClick={handleStart}
                disabled={startSession.isPending}
              >
                {startSession.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating questions…</>
                ) : cachedCount > 0 ? (
                  <><Play className="w-4 h-4" /> Start Practice <span className="opacity-70 text-xs">({cachedCount} ready)</span></>
                ) : (
                  <><Play className="w-4 h-4" /> Start Practice</>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Quiz */}
        {phase === "quiz" && questions.length > 0 && (
          <QuizQuestion
            key={questions[currentIndex].id}
            question={questions[currentIndex]}
            qNumber={currentIndex + 1}
            total={questions.length}
            onNext={handleNext}
            isLast={currentIndex === questions.length - 1}
          />
        )}

        {/* Results */}
        {phase === "result" && (
          <ResultScreen results={results} total={questions.length} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}
