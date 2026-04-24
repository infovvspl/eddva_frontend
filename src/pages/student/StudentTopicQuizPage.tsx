import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Clock, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertTriangle, BarChart3,
  Target, ArrowLeft, Flame, BookOpen, Sparkles,
  Brain, Trophy, Search, Play, Monitor, Zap, Layers,
  ArrowRight, ShieldCheck, BrainCircuit, Activity, Info
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
      key={question.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
      className="space-y-10"
    >
      <CardGlass className="p-10 sm:p-14 border-white relative overflow-hidden bg-white/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-10 flex-wrap">
          <span className="text-[10px] font-black px-4 py-2 rounded-xl bg-slate-900 text-white uppercase tracking-[0.2em] shadow-xl">
            Probe {index + 1} / {total}
          </span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-3 py-1.5 rounded-xl bg-slate-50">Impact: {question.difficulty}</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">+{question.marksCorrect} Pts</span>
            {question.marksWrong > 0 && <span className="text-[10px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">-{question.marksWrong} Pts</span>}
          </div>
        </div>
        
        <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed uppercase italic tracking-tighter select-none">
           {question.content}
        </p>
      </CardGlass>

      {isInteger ? (
        <CardGlass className="p-12 border-indigo-500/10 bg-indigo-50/50">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 block text-center italic">Numerical Identity Entry</label>
          <input
            type="number" value={intVal}
            onChange={e => { setIntVal(e.target.value); onSelect(e.target.value); }}
            placeholder="0"
            className="w-full max-w-sm mx-auto block bg-white border border-slate-100 rounded-[2.5rem] px-10 py-8 text-5xl font-black text-slate-900 text-center focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder-slate-100 shadow-inner"
          />
        </CardGlass>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {question.options?.map((opt, i) => {
            const isSelected = selected.includes(opt.id);
            return (
              <motion.button
                whileHover={{ scale: 1.01, x: 10 }} whileTap={{ scale: 0.99 }}
                key={opt.id} onClick={() => onSelect(opt.id)}
                className={cn(
                  "w-full flex items-center gap-6 px-8 py-6 rounded-[2rem] border-2 text-left transition-all",
                  isSelected ? "bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]" : "bg-white/60 border-white text-slate-800 hover:bg-white hover:border-slate-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-sm font-black border-2 transition-colors",
                  isSelected ? "bg-white text-slate-900 border-transparent shadow-lg" : "bg-slate-50 border-slate-100 text-slate-300"
                )}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="text-lg font-black uppercase italic tracking-tight flex-1">{opt.content}</span>
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
  const isLast = currentQ === questions.length - 1;
  const selected = q ? (answers[q.id] || []) : [];

  return (
    <div className="flex flex-col space-y-12">
        <CardGlass className="px-5 sm:px-6 py-3 border-slate-200 bg-white shadow-sm flex items-center justify-between sticky top-0 z-50">
           <div className="flex items-center gap-6">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-xl", isAi ? "bg-purple-600 text-white" : "bg-slate-900 text-white")}>
                 {isAi ? <Sparkles className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{isAi ? "AI GENERATED PROBE" : "CURRICULUM SYNC"}</p>
                 <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none truncate max-w-[200px] sm:max-w-none">{title}</h3>
              </div>
           </div>

           <div className="flex items-center gap-8">
              <div className={cn(
                 "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shadow-sm",
                 timerDanger ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-white border-slate-100 text-slate-900"
              )}>
                 <Clock className="w-3.5 h-3.5" />
                 <span className="text-xs sm:text-sm font-semibold tabular-nums leading-none">{fmt(seconds)}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onSubmit}
                className="hidden sm:flex px-10 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
              >
                Finalize Sync
              </motion.button>
           </div>
        </CardGlass>

        <div className="h-1.5 bg-slate-200/50 rounded-full relative overflow-hidden">
           <motion.div initial={{ width: 0 }} animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
             className={cn("h-full shadow-lg", isAi ? "bg-purple-600 shadow-purple-500/20" : "bg-blue-600 shadow-blue-500/20")} />
        </div>

        <div className="max-w-4xl mx-auto w-full">
           <AnimatePresence mode="wait">
              <QuestionCard
                key={q.id} question={q} index={currentQ} total={questions.length}
                selected={selected} onSelect={onSelect}
              />
           </AnimatePresence>
        </div>

        <div className="max-w-4xl mx-auto w-full">
           <CardGlass className="p-5 border-white bg-white/60 flex items-center justify-between gap-10 shadow-2xl">
              <button
                onClick={() => setCurrentQ(Math.max(currentQ - 1, 0))}
                disabled={currentQ === 0}
                className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-950 hover:text-white transition-all disabled:opacity-20 shadow-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <div className="flex-1 flex justify-center items-center gap-3 overflow-x-auto scrollbar-none px-4">
                 {questions.map((_, i) => (
                   <button key={i} onClick={() => setCurrentQ(i)}
                     className={cn(
                        "shrink-0 transition-all border shadow-sm",
                        i === currentQ ? "w-8 h-8 rounded-lg bg-slate-900 border-slate-900 scale-110" : 
                        answers[questions[i].id]?.length > 0 ? (isAi ? "w-5 h-5 rounded bg-purple-500/40 border-purple-500/10" : "w-5 h-5 rounded bg-blue-500/40 border-blue-500/10") : "w-5 h-5 rounded bg-white border-slate-100"
                     )}
                   />
                 ))}
              </div>

              <button
                onClick={onNext}
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                  isLast ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                  selected.length > 0 ? (isAi ? "bg-purple-600 text-white shadow-purple-500/20" : "bg-blue-600 text-white shadow-blue-500/20") : "bg-white border border-slate-100 text-slate-200"
                )}
              >
                {isLast ? <CheckCircle className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
              </button>
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

  const handleTeacherSelect = async (optionId: string) => {
    const q = questions[currentQ] as QuizQuestion;
    if (!q || !session) return;
    const isMulti = q.type === "mcq_multi";
    const next = q.type === "integer" ? [optionId] : isMulti ? (answers[q.id]?.includes(optionId) ? answers[q.id].filter(id => id !== optionId) : [...(answers[q.id] || []), optionId]) : [optionId];
    setAnswers(a => ({ ...a, [q.id]: next }));
    try { await submitAnswer(session.id, { questionId: q.id, selectedOptionIds: q.type === "integer" ? undefined : next, integerResponse: q.type === "integer" ? optionId : undefined }); } catch {}
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
    if (stage !== "ai_results") {
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

  if (stage === "quiz" || stage === "ai_quiz") {
    return <QuizRunner title={stage === "ai_quiz" ? aiQuizData?.topicName ?? "" : mockTest?.title ?? ""}
      isAi={stage === "ai_quiz"} questions={questions} seconds={seconds} timerDanger={timerDanger} answers={answers}
      currentQ={currentQ} setCurrentQ={setCurrentQ} onSelect={stage === "quiz" ? handleTeacherSelect : handleAiSelect}
      onNext={() => { if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1); else stage === "quiz" ? handleTeacherSubmit(false) : handleAiSubmit(false); }}
      onSubmit={() => stage === "quiz" ? handleTeacherSubmit(false) : handleAiSubmit(false)} />;
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
                           return (
                              <div key={i} className={cn("p-6 rounded-[2rem] border transition-all", isRight ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100")}>
                                 <div className="flex gap-4 mb-4">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm", isRight ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                                       {isRight ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    </div>
                                    <p className="text-base font-black text-slate-900 uppercase italic">{q.content}</p>
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
