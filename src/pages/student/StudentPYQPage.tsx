import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, XCircle, ChevronRight,
  Trophy, RotateCcw, Play, Calendar, Zap, Filter,
  Loader2, Target, Monitor, Info, Layers, ArrowRight, Brain, Sparkles,
} from "lucide-react";
import { useStartPYQSession, useSubmitPYQAnswer } from "@/hooks/use-student";
import type { PYQQuestion, PYQSubmitResult } from "@/lib/api/student";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const EMERALD = "#10B981";
const ORANGE = "#F59E0B";

const EXAM_LABELS: Record<string, string> = {
  jee_mains: "JEE Mains", 
  jee_advanced: "JEE Advanced", 
  neet: "NEET",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

type QuizPhase = "setup" | "quiz" | "result";
interface SessionResult { questionId: string; isCorrect: boolean; xpAwarded: number; }

const difficultyStyle: Record<string, { color: string; bg: string }> = {
  easy:   { color: EMERALD, bg: "rgba(16, 185, 129, 0.1)" },
  medium: { color: ORANGE,  bg: "rgba(245, 158, 11, 0.1)"  },
  hard:   { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)"  },
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
    const payload: Record<string, any> = { timeTakenSeconds: timeTaken };
    if (question.type === "integer") payload.integerResponse = intInput;
    else payload.selectedOptionIds = selected;
    const res = await submitMutation.mutateAsync({ topicId: question.topicId, questionId: question.id, payload });
    setSubmitResult(res);
  }

  const canSubmit = question.type === "integer" ? intInput.trim() !== "" : selected.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between gap-6">
         <div className="flex items-center gap-4 flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Node: {qNumber} / {total}</span>
            <div className="w-full h-1.5 rounded-full bg-white border border-slate-100 overflow-hidden relative shadow-inner">
               <motion.div className="absolute inset-0 bg-blue-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${(qNumber / total) * 100}%` }} />
            </div>
         </div>
      </div>

      <CardGlass className="p-10 border-white bg-white/60 shadow-3xl">
        <div className="relative">
          <div className="flex items-center gap-3 flex-wrap mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 italic">
              <Calendar className="w-3.5 h-3.5" /> Paper: {question.pyqYear}
            </span>
            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 text-white">
              {EXAM_LABELS[question.pyqExam] ?? question.pyqExam}
            </span>
            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest" style={{ background: diff.bg, color: diff.color }}>
              Intensity: {question.difficulty}
            </span>
          </div>

          <div className="text-xl font-bold text-slate-900 leading-relaxed mb-8 select-all">
            <MarkdownRenderer content={question.questionText} />
          </div>

          {question.questionImageUrl && (
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 mb-8 overflow-hidden">
               <img src={question.questionImageUrl} alt="Optical Feed" className="max-h-64 rounded-xl object-contain mx-auto" />
            </div>
          )}

          {question.type === "integer" ? (
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Numerical Matrix Input</label>
              <input
                type="text" value={intInput} onChange={e => setIntInput(e.target.value)}
                disabled={isAnswered} placeholder="Input Float/Integer..."
                className="w-full sm:w-64 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 bg-white focus:border-blue-500 outline-none transition-all shadow-inner uppercase tracking-widest"
              />
              {submitResult && (
                <div className="p-6 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50 text-emerald-900 mt-4">
                  <p className="text-sm font-black uppercase italic tracking-widest">Verification Complete: <span className="text-xl underline">{submitResult.correctIntegerAnswer}</span></p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((opt, i) => {
                const isSel = selected.includes(opt.id);
                const isCorrectOpt = correctIds.includes(opt.id);
                
                let cardStyle = "bg-white border-slate-100 text-slate-900 shadow-sm";
                if (isAnswered) {
                  if (isCorrectOpt)      cardStyle = "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20";
                  else if (isSel)        cardStyle = "bg-red-500 text-white border-red-600 shadow-red-500/20";
                  else                   cardStyle = "bg-slate-50 border-slate-200 text-slate-300 opacity-60 shadow-none";
                } else if (isSel) {
                  cardStyle = "bg-slate-950 text-white border-slate-950 shadow-xl";
                }

                return (
                  <motion.div
                    key={opt.id}
                    whileHover={!isAnswered ? { x: 8 } : {}}
                    onClick={() => {
                      if (isAnswered) return;
                      if (question.type === "mcq_single") setSelected([opt.id]);
                      else setSelected(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]);
                    }}
                    className={cn("flex items-center gap-6 rounded-2xl border-2 px-6 py-5 transition-all select-none cursor-pointer", cardStyle)}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border transition-colors", isAnswered && isCorrectOpt ? "bg-white text-emerald-600" : isAnswered && isSel ? "bg-white text-red-600" : isSel ? "bg-white/10 text-white" : "bg-slate-50 text-slate-400")}>{String.fromCharCode(65 + i)}</div>
                    <div className="text-base font-black uppercase italic tracking-tight">
                      <MarkdownRenderer content={opt.text} />
                    </div>
                    {(isAnswered && isCorrectOpt) && <CheckCircle className="ml-auto w-6 h-6 text-white" />}
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-10 pt-10 border-t border-slate-100">
             {!isAnswered ? (
               <button onClick={handleSubmit} disabled={!canSubmit || submitMutation.isPending} className="w-full py-6 rounded-3xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-xl">
                 {submitMutation.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> DISPATCHING DATA...</> : <><Sparkles className="w-5 h-5" /> VERIFY SOLUTION</>}
               </button>
             ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   <div className={cn("flex items-center gap-6 p-8 rounded-3xl border-2", submitResult.isCorrect ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl", submitResult.isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>{submitResult.isCorrect ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}</div>
                      <div>
                         <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", submitResult.isCorrect ? "text-emerald-600" : "text-red-600")}>{submitResult.isCorrect ? "Precision: Optimal" : "Sequence Error"}</p>
                         <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">{submitResult.isCorrect ? "Neural Link Verified" : "Module Correction Required"}</h3>
                      </div>
                      {submitResult.xpAwarded > 0 && <div className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 text-white shadow-lg"><Zap className="w-4 h-4 fill-white" /><span className="text-sm font-black uppercase tracking-widest">+{submitResult.xpAwarded} XP</span></div>}
                   </div>

                   {submitResult.explanation && (
                     <CardGlass className="p-8 border-blue-500/10 bg-white/60">
                        <div className="flex items-center gap-3 mb-6"><Brain className="w-5 h-5 text-blue-500" /><div><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Synthesis</p><p className="text-base font-black text-slate-900 uppercase italic leading-none">Path Reconstruction</p></div></div>
                        <div className="text-slate-700 font-bold leading-relaxed">
                           <MarkdownRenderer content={submitResult.explanation} />
                         </div>
                     </CardGlass>
                   )}

                   <button onClick={() => onNext({ questionId: question.id, isCorrect: submitResult.isCorrect, xpAwarded: submitResult.xpAwarded })} className="w-full py-6 rounded-3xl bg-slate-950 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-xl">
                     {isLast ? <><Trophy className="w-5 h-5" /> TERMINATE SESSION</> : <><ArrowRight className="w-5 h-5" /> NEXT MODULE SCAN</>}
                   </button>
                </motion.div>
             )}
          </div>
        </div>
      </CardGlass>
    </motion.div>
  );
}

function ResultScreen({ results, total, onRestart }: { results: SessionResult[]; total: number; onRestart: () => void }) {
  const correct  = results.filter(r => r.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalXP  = results.reduce((s, r) => s + r.xpAwarded, 0);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <CardGlass className="p-12 text-center border-white bg-white/60 shadow-3xl">
         <div className="w-24 h-24 rounded-[3rem] mx-auto mb-8 flex items-center justify-center shadow-2xl bg-indigo-600 text-white"><Trophy className="w-10 h-10" /></div>
         <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Simulation <span className="text-blue-600">Complete</span></h2>
         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-12">Data Extraction: Successful</p>

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-16">
           {[
             { val: correct, label: "Resolved", color: EMERALD, bg: "bg-emerald-500/5", icon: <CheckCircle className="w-5 h-5" /> },
             { val: `${accuracy}%`, label: "Accuracy", color: BLUE, bg: "bg-blue-500/5", icon: <Target className="w-5 h-5" /> },
             { val: `+${totalXP}`, label: "XP Yield", color: ORANGE, bg: "bg-amber-500/5", icon: <Zap className="w-5 h-5 fill-current" /> },
           ].map(stat => (
             <div key={stat.label} className={cn("rounded-3xl p-8 border border-white shadow-xl bg-white", stat.bg)}>
               <div className="flex justify-center mb-4" style={{ color: stat.color }}>{stat.icon}</div>
               <div className="text-3xl font-black italic tracking-tighter mb-1" style={{ color: stat.color }}>{stat.val}</div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
             </div>
           ))}
         </div>

         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onRestart} className="flex items-center gap-4 px-12 py-6 rounded-3xl bg-slate-950 text-white text-xs font-black uppercase tracking-widest shadow-xl"><RotateCcw className="w-5 h-5" /> New Session</button>
            <button onClick={() => window.history.back()} className="flex items-center gap-4 px-12 py-6 rounded-3xl bg-white border border-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest">Return to Nexus</button>
         </div>
      </CardGlass>
    </motion.div>
  );
}

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
  const startSession = useStartPYQSession();

  function activeFilters() {
    const f: Record<string, any> = {};
    if (startYear !== "all") f.startYear = parseInt(startYear);
    if (endYear !== "all") f.endYear = parseInt(endYear);
    if (exam !== "all") f.exam = exam;
    if (difficulty !== "all") f.difficulty = difficulty;
    if (questionType !== "all") f.type = questionType;
    return f;
  }

  async function handleStart() {
    const payload: Record<string, any> = { limit: 200, ...activeFilters() };
    const data = await startSession.mutateAsync({ topicId: topicId!, payload });
    if (!data.questions.length) { toast.error("No modules retrieved for these parameters."); return; }
    setQuestions(data.questions); setCurrentIndex(0); setResults([]); setPhase("quiz");
  }

  const handleNext = (result: SessionResult) => {
    const updated = [...results, result];
    setResults(updated);
    if (currentIndex >= questions.length - 1) {
      setPhase("result");
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <button onClick={() => phase === "quiz" ? setPhase("setup") : navigate(-1)} className="w-14 h-14 rounded-2xl bg-white border border-white flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-xl group"><ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /></button>
            <div>
               <div className="flex items-center gap-3 mb-1"><Monitor className="w-4 h-4 text-blue-600" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Archive Lab</span></div>
               <h1 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">PYQ <span className="not-italic text-blue-600">Practice</span> Unit</h1>
            </div>
          </div>
          {phase === "quiz" && (
             <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white shadow-xl border border-white">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center"><Zap className="w-5 h-5 fill-white" /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. XP Yield</p><p className="text-lg font-black text-slate-900 leading-none">+{questions.length * 15}</p></div>
             </div>
          )}
        </header>

        <div className="max-w-4xl mx-auto w-full">
          {phase === "setup" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <CardGlass className="p-12 border-white bg-white/60 shadow-3xl">
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-950 text-white shadow-xl"><Filter className="w-8 h-8" /></div>
                  <div><h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Configure Simulation</h2><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Calibration Nodes</p></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6"><label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-2">Temporal Range</label><div className="grid grid-cols-2 gap-4"><Select value={startYear} onValueChange={setStartYear}><SelectTrigger className="w-full h-16 rounded-2xl border-white bg-white font-black uppercase text-[10px] tracking-widest px-6 shadow-sm"><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select><Select value={endYear} onValueChange={setEndYear}><SelectTrigger className="w-full h-16 rounded-2xl border-white bg-white font-black uppercase text-[10px] tracking-widest px-6 shadow-sm"><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div></div>
                  <div className="space-y-6"><label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-2">Examination Node</label><Select value={exam} onValueChange={setExam}><SelectTrigger className="w-full h-16 rounded-2xl border-white bg-white font-black uppercase text-[10px] tracking-widest px-6 shadow-sm"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EXAM_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l.toUpperCase()}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-6 md:col-span-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-2">Matrix Structure</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[{v:"all",l:"ALL"},{v:"mcq_single",l:"MCQ_S"},{v:"mcq_multi",l:"MCQ_M"},{v:"integer",l:"NUMERICAL"}].map(opt => <button key={opt.v} onClick={() => setQuestionType(opt.v)} className={cn("py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all shadow-sm", questionType === opt.v ? "bg-blue-600 text-white border-blue-600 shadow-xl" : "bg-white text-slate-400 border-white hover:border-blue-100")}>{opt.l}</button>)}</div></div>
                </div>

                <button className="mt-16 w-full py-8 rounded-3xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl shadow-blue-500/20" onClick={handleStart} disabled={startSession.isPending}>{startSession.isPending ? <><Loader2 className="w-6 h-6 animate-spin" /> DISPATCHING QUERY…</> : <><Play className="w-6 h-6" /> INITIALIZE SIMULATION</>}</button>
              </CardGlass>
            </motion.div>
          )}

          {phase === "quiz" && questions.length > 0 && (
            <QuizQuestion key={questions[currentIndex].id} question={questions[currentIndex]} qNumber={currentIndex + 1} total={questions.length} onNext={handleNext} isLast={currentIndex === questions.length - 1} />
          )}

          {phase === "result" && <ResultScreen results={results} total={questions.length} onRestart={() => setPhase("setup")} />}
        </div>
    </div>
  );
}
