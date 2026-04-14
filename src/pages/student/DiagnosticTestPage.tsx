import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Clock, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertTriangle, Flame,
  BarChart3, Sparkles, BookOpen, Target, Brain,
  Monitor, Zap, Layers, Info, ArrowLeft, ArrowRight,
  ShieldCheck, BrainCircuit, Activity
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { patchDiagnosticCompleted } from "@/lib/auth-store";
import {
  generateDiagnosticSession, submitAnswer,
  submitSession,
} from "@/lib/api/student";
import type { QuizQuestion, TestSession, SessionResult } from "@/lib/api/student";
import { toast } from "sonner";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";

// ─── Stage Types ──────────────────────────────────────────────────────────────
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

// ─── Info Screen: Baseline Briefing ───────────────────────────────────────────
function InfoScreen({ batchName, onStart }: { batchName: string; onStart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex items-center justify-center p-6">
      <div className="relative z-10 w-full max-w-4xl">
         <header className="text-center mb-16">
            <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center mx-auto mb-10 shadow-3xl">
               <ShieldCheck className="w-12 h-12 text-blue-600" />
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
               <Monitor className="w-4 h-4 text-blue-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Baseline Assessment Protocol</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-6">
               Diagnostic <span className="text-blue-600">Nexus</span>
            </h1>
            <p className="text-slate-500 font-bold text-lg uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
               Calibrating your neural path. Establish your cognitive baseline to activate the <span className="text-slate-900 italic underline decoration-blue-500/30">Aero Synthesis Engine</span>.
            </p>
         </header>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
               { icon: BrainCircuit, label: "AI ADAPTIVE", desc: `Personalized nodes for ${batchName || "your sector"} syllabus.`, color: "text-blue-500", bg: "bg-blue-50/50" },
               { icon: Activity, label: "60 SYNC", desc: "60 minutes to complete the cognitive scan.", color: "text-amber-500", bg: "bg-amber-50/50" },
               { icon: Zap, label: "PLAN ACTIVATE", desc: "Unlocks your 30-day structural study plan.", color: "text-purple-500", bg: "bg-purple-50/50" },
            ].map((feature, i) => (
              <CardGlass key={i} className={cn("p-8 border-white", feature.bg)}>
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-lg bg-white", feature.color)}>
                    <feature.icon className="w-7 h-7" />
                 </div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-slate-900">{feature.label}</h3>
                 <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-wide">{feature.desc}</p>
              </CardGlass>
            ))}
         </div>

         <CardGlass className="p-8 border-amber-500/20 bg-amber-50 text-amber-900 mb-12">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg"><AlertTriangle className="w-6 h-6" /></div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Warning: Mandatory Protocol</p>
                  <p className="text-base font-black uppercase italic leading-none">Termination during scan will result in data corruption. Backlinks disabled.</p>
               </div>
            </div>
         </CardGlass>

         <motion.button
           whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(37,99,235,0.4)" }} whileTap={{ scale: 0.98 }}
           onClick={onStart}
           className="w-full py-8 rounded-[3rem] bg-blue-600 text-white text-xs font-black uppercase tracking-[0.5em] shadow-2xl transition-all"
         >
           Initialize Baseline Scan
         </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Question Card: Immersive Probe ───────────────────────────────────────────
function QuestionCard({
  question, index, total, selected, onSelect,
}: {
  question: QuizQuestion; index: number; total: number; selected: string[]; onSelect: (optionId: string) => void;
}) {
  const isInteger = question.type === "integer";
  const [intVal, setIntVal] = useState("");
  useEffect(() => { setIntVal(""); }, [question.id]);

  return (
    <motion.div
      key={question.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
      className="space-y-10"
    >
      <CardGlass className="p-10 sm:p-14 border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-10 flex-wrap">
          <span className="text-[10px] font-black px-4 py-2 rounded-xl bg-slate-900 text-white uppercase tracking-[0.2em] shadow-xl">
            Probe {index + 1} / {total}
          </span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-3 py-1.5 rounded-xl bg-slate-50">Intensity: {question.difficulty}</span>
          {"topic" in question && question.topic && (
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100 px-3 py-1.5 rounded-xl bg-blue-50/50">{question.topic.name}</span>
          )}
        </div>
        
        <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed uppercase italic tracking-tighter select-none">
           {question.content}
        </p>
      </CardGlass>

      {isInteger ? (
        <CardGlass className="p-12 border-indigo-500/10 bg-indigo-50/50">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 block text-center italic">Numerical Matrix Input</label>
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

// ─── Results Screen: Diagnosis Manifest ───────────────────────────────────────
function ResultsScreen({ result, onContinue }: { result: SessionResult; onContinue: () => void; }) {
  const accuracy = result.accuracy ?? (result.totalCorrect / Math.max(result.totalCorrect + result.totalWrong, 1)) * 100;
  const eb = result.errorBreakdown;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex items-center justify-center p-6">
      <div className="relative z-10 w-full max-w-4xl">
         <header className="text-center mb-16">
            <div className="w-24 h-24 rounded-[3rem] bg-emerald-500 text-white flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
               <CheckCircle className="w-12 h-12" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4">
               Baseline <span className="text-emerald-500">Established</span>
            </h1>
            <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Diagnostic Assessment Finalized</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            {/* Core Metrics */}
            <CardGlass className="p-10 border-white bg-slate-900 text-white relative overflow-hidden">
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
               
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Neural Fidelity Score</h3>
               
               <div className="flex items-center gap-10">
                  <div className="relative w-32 h-32 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                      <motion.circle cx="50" cy="50" r="45" fill="none"
                        stroke={accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="10"
                        strokeDasharray="283"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 283 * (1 - accuracy/100) }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-3xl font-black italic">{accuracy.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-5xl font-black italic text-emerald-400 leading-none mb-2">{result.totalScore}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Aggregate Sync Points</p>
                    <div className="flex items-center gap-4">
                       <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-black italic border border-emerald-500/20">+{result.totalCorrect} Valid</div>
                       <div className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-black italic border border-red-500/20">-{result.totalWrong} Error</div>
                    </div>
                  </div>
               </div>
            </CardGlass>

            {/* Error Synthesis */}
            {eb && result.totalWrong > 0 ? (
               <CardGlass className="p-10 border-white bg-white/60">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Cognitive Drift Analysis</h3>
                  <div className="space-y-6">
                    {[
                      { key: "conceptual", label: "CORRE CONCEPT GAPS", color: "#ef4444" },
                      { key: "silly",      label: "SILLY SYNAPSE ERRORS", color: "#f59e0b" },
                      { key: "time",       label: "TEMPORAL PRESSURE", color: "#6366f1" },
                    ].map(({ key, label, color }) => {
                      const val = (eb as any)[key] ?? 0;
                      const pct = (val / result.totalWrong) * 100;
                      if (!val) return null;
                      return (
                        <div key={key}>
                          <div className="flex justify-between items-end mb-3">
                             <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{label}</span>
                             <span className="text-sm font-black text-slate-400 italic">{val}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden p-0.5 shadow-inner">
                             <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full shadow-lg" style={{ background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </CardGlass>
            ) : (
                <CardGlass className="p-10 border-white bg-white/60 flex flex-col items-center justify-center text-center">
                   <Zap className="w-12 h-12 text-yellow-400 fill-yellow-400 mb-6 animate-pulse" />
                   <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2">Pristine Protocol</h3>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No significant cognitive drift detected. Neural paths are aligned.</p>
                </CardGlass>
            )}
         </div>

         <CardGlass className="p-10 border-purple-500/20 bg-purple-500/10 mb-12 flex flex-col sm:flex-row items-center gap-10">
            <div className="w-20 h-20 rounded-[2rem] bg-white border border-purple-200 flex items-center justify-center shrink-0 shadow-xl">
               <Sparkles className="w-10 h-10 text-purple-600" />
            </div>
            <div>
               <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Study Plan Generated</h4>
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  The AI has successfully mapped your results into a <span className="text-purple-600 font-black italic decoration-purple-600/30 underline">30-day structural schedule</span>. Activation requested.
               </p>
            </div>
         </CardGlass>

         <motion.button
           whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
           onClick={onContinue}
           className="w-full py-8 rounded-[3rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6"
         >
           Access Study Plan <ArrowRight className="w-6 h-6" />
         </motion.button>
      </div>
    </motion.div>
  );
}

export default function DiagnosticTestPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const authState   = useAuthStore();

  const [stage, setStage]           = useState<Stage>("info");
  const [session, setSession]       = useState<TestSession | null>(null);
  const [questions, setQuestions]   = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ]     = useState(0);
  const [answers, setAnswers]       = useState<Record<string, string[]>>({});
  const [result, setResult]         = useState<SessionResult | null>(null);
  const [batchName, setBatchName]   = useState("");

  const durationMinutes = 60;

  const handleTimeUp = useCallback(() => {
    if (stage === "quiz" && session) handleSubmit(true);
  }, [stage, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const { seconds } = useTimer(durationMinutes * 60, handleTimeUp);

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

  const handleStart = async () => {
    setStage("loading");
    try {
      const result = await generateDiagnosticSession();
      if (result.alreadyCompleted) {
        patchDiagnosticCompleted(useAuthStore.getState());
        queryClient.setQueryData(authKeys.me, (prev: any) => {
          if (!prev) return prev;
          return { ...prev, studentProfile: prev.studentProfile ? { ...prev.studentProfile, diagnosticCompleted: true } : null };
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
      toast.error(err?.response?.data?.message || "Failed to start diagnostic.");
      setStage("info");
    }
  };

  const handleSelectOption = async (optionId: string) => {
    const q = questions[currentQ];
    if (!q || !session) return;
    let next: string[] = q.type === "mcq_multi" ? (answers[q.id]?.includes(optionId) ? answers[q.id].filter(id => id !== optionId) : [...(answers[q.id] || []), optionId]) : [optionId];
    setAnswers(a => ({ ...a, [q.id]: next }));
    try {
      await submitAnswer(session.id, { questionId: q.id, selectedOptionIds: q.type === "integer" ? undefined : next, integerResponse: q.type === "integer" ? optionId : undefined });
    } catch {}
  };

  const handleSubmit = async (timedOut: boolean) => {
    if (!session) return;
    if (timedOut) toast.warning("Protocol Timeout: Submitting Data...");
    setStage("submitting");
    try {
      const res = await submitSession(session.id);
      setResult(res);
      patchDiagnosticCompleted(useAuthStore.getState());
      queryClient.setQueryData(authKeys.me, (prev: any) => {
        if (!prev) return prev;
        return { ...prev, studentProfile: prev.studentProfile ? { ...prev.studentProfile, diagnosticCompleted: true } : null };
      });
      setStage("results");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Submit Failure.");
      setStage("quiz");
    }
  };

  if (stage === "info") return <InfoScreen batchName={batchName} onStart={handleStart} />;

  if (stage === "loading" || stage === "submitting" || stage === "generating_plan") {
    return (
      <div className="py-40 flex flex-col items-center justify-center text-center gap-10">
         <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
         </div>
         <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
              {stage === "loading" ? "Synthesizing Diagnostic Matrix" : stage === "submitting" ? "Analyzing Neural Feed" : "Constructing Study Plan"}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Structural integrity verification in progress...</p>
         </div>
      </div>
    );
  }

  if (stage === "results" && result) return <ResultsScreen result={result} onContinue={() => navigate("/student/study-plan")} />;

  const q = questions[currentQ];
  const selectedOpts = q ? (answers[q.id] ?? []) : [];
  const timerDanger = seconds <= 180;

  return (
    <div className="flex flex-col space-y-12">
       {/* Diagnostic Status Header */}
       <CardGlass className="px-10 py-6 border-white bg-white/60 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-6">
             <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
                <ClipboardList className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Sector 01: Baseline</p>
                <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">Diagnostic Scan</h3>
             </div>
          </div>

          <div className="flex items-center gap-10">
             <div className={cn(
                "flex items-center gap-4 px-6 py-2.5 rounded-xl border transition-all shadow-xl",
                timerDanger ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-white border-slate-100 text-slate-900"
             )}>
                <Clock className="w-5 h-5" />
                <span className="text-xl font-black italic tracking-tighter tabular-nums leading-none">{formatTime(seconds)}</span>
             </div>
             <motion.button
               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
               onClick={() => handleSubmit(false)}
               className="hidden sm:flex px-10 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
             >
               Finalize Scan
             </motion.button>
          </div>
       </CardGlass>

       {/* Progress Tracker */}
       <div className="h-1.5 bg-slate-200/50 rounded-full relative overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            className="h-full bg-blue-600 shadow-lg shadow-blue-500/20"
          />
       </div>

       {/* Question Core */}
       <div className="max-w-4xl mx-auto w-full">
          <AnimatePresence mode="wait">
             {q && (
                <QuestionCard
                  key={q.id} question={q} index={currentQ} total={questions.length}
                  selected={selectedOpts} onSelect={handleSelectOption}
                />
             )}
          </AnimatePresence>
       </div>

       {/* Navigation Terminal */}
       <div className="max-w-4xl mx-auto w-full">
          <CardGlass className="p-5 border-white bg-white/60 flex items-center justify-between gap-10 shadow-2xl">
             <button
               onClick={() => setCurrentQ(i => Math.max(i - 1, 0))}
               disabled={currentQ === 0}
               className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-950 hover:text-white transition-all disabled:opacity-20 shadow-sm"
             >
               <ArrowLeft className="w-6 h-6" />
             </button>

             <div className="flex-1 flex justify-center items-center gap-3 overflow-x-auto scrollbar-none px-4">
                {questions.map((qId, i) => (
                  <button 
                    key={i} onClick={() => setCurrentQ(i)}
                    className={cn(
                       "shrink-0 transition-all border shadow-sm",
                       i === currentQ ? "w-8 h-8 rounded-lg bg-slate-900 border-slate-900 scale-110" : 
                       (answers[questions[i].id]?.length > 0) ? "w-5 h-5 rounded bg-blue-500/40 border-blue-500/10" : "w-5 h-5 rounded bg-white border-slate-100"
                    )}
                  />
                ))}
             </div>

             <button
               onClick={() => currentQ < questions.length - 1 ? setCurrentQ(i => i + 1) : handleSubmit(false)}
               className={cn(
                 "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                 currentQ === questions.length - 1 ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                 selectedOpts.length > 0 ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-white border border-slate-100 text-slate-200"
               )}
             >
               {currentQ === questions.length - 1 ? <CheckCircle className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
             </button>
          </CardGlass>
       </div>
    </div>
  );
}
