import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, ThumbsUp, ThumbsDown, ChevronDown,
  Loader2, AlertCircle, CheckCircle, Clock, X,
  Sparkles, User, Target, Brain, ArrowRight,
  Monitor, Info, Layers, Zap, ArrowLeft,
} from "lucide-react";
import {
  useMyDoubts, useCreateDoubt, useMarkDoubtHelpful,
  useSubjects, useChapters, useTopics, useStudentMe,
} from "@/hooks/use-student";
import { StudentDoubt, DoubtStatus, ExplanationMode } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CardGlass } from "@/components/shared/CardGlass";

// ─── Status Config ─────────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";
const EMERALD = "#10B981";
const ORANGE = "#F59E0B";

const statusConfig: Record<DoubtStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:             { label: "Pending Resolution", color: ORANGE,  bg: "rgba(245, 158, 11, 0.1)", icon: <Clock      className="w-3.5 h-3.5" /> },
  ai_resolved:      { label: "AI Resolved",        color: BLUE,    bg: "rgba(37, 99, 235, 0.1)",  icon: <Sparkles   className="w-3.5 h-3.5" /> },
  escalated:        { label: "Escalated to Hub",   color: PURPLE,  bg: "rgba(124, 58, 237, 0.1)", icon: <User       className="w-3.5 h-3.5" /> },
  teacher_resolved: { label: "Teacher Resolved",   color: EMERALD, bg: "rgba(16, 185, 129, 0.1)", icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const TABS = [
  { key: "all",              label: "Archive"        },
  { key: "open",             label: "Pending"        },
  { key: "ai_resolved",      label: "AI Resolved"    },
  { key: "escalated",        label: "Escalated"      },
  { key: "teacher_resolved", label: "Answered"       },
];

// ─── Doubt Card ────────────────────────────────────────────────────────────────
function DoubtCard({ doubt }: { doubt: StudentDoubt }) {
  const [expanded, setExpanded] = useState(false);
  const markHelpful = useMarkDoubtHelpful();
  const s = statusConfig[doubt.status];
  const subjectName = doubt.topic?.chapter?.subject?.name;
  const topicName   = doubt.topic?.name;

  return (
    <CardGlass className={cn("group p-0 border-white bg-white/60", expanded ? "shadow-blue-500/5 ring-1 ring-blue-500/10" : "hover:border-blue-200")}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-6 p-6 text-left"
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform" style={{ background: s.bg, color: s.color }}>
          <MessageSquare className="w-7 h-7" />
        </div>
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg" style={{ background: s.bg, color: s.color }}>
              {s.icon} {s.label}
            </span>
            {subjectName && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subjectName}</span>}
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-1 italic uppercase tracking-tighter">{doubt.questionText ?? "Query Terminal Out"}</h3>
          <div className="flex items-center gap-4">
             {topicName && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {topicName}</span>}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-4">
           <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:border-blue-200 transition-all shadow-sm">
              <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </motion.div>
           </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/40 bg-slate-50/20"
          >
            <div className="p-8 space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm relative">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">System Entry Query</p>
                 <p className="text-slate-800 font-bold leading-relaxed">{doubt.questionText}</p>
              </div>

              {doubt.aiExplanation && (
                <div className="rounded-[2.5rem] p-8 border border-blue-100 bg-white shadow-xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg"><Sparkles className="w-5 h-5" /></div>
                    <div>
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Neural Resolution Engine</p>
                       <p className="text-base font-black text-slate-950 uppercase italic leading-none">Instant Synthesis</p>
                    </div>
                  </div>
                  <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed mb-6">
                    {doubt.aiExplanation}
                  </div>
                  {doubt.aiConceptLinks && doubt.aiConceptLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                      {doubt.aiConceptLinks.map((c, i) => (
                        <span key={i} className="text-[10px] font-black px-4 py-2 rounded-xl bg-blue-50 text-blue-600 uppercase tracking-widest hover:bg-blue-100 transition-colors">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {doubt.teacherResponse && (
                <div className="rounded-[2.5rem] p-8 border border-emerald-100 bg-emerald-50/40 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><User className="w-5 h-5 fill-current" /></div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Human Node Hub</p>
                       <p className="text-base font-black text-slate-950 uppercase italic leading-none">Faculty Response</p>
                    </div>
                  </div>
                  <p className="text-slate-800 font-bold leading-relaxed italic border-l-4 border-emerald-500/20 pl-6">{doubt.teacherResponse}</p>
                </div>
              )}

              {doubt.status === "ai_resolved" && doubt.isHelpful === undefined && (
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-white border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-1">Calibrate Accuracy Profile</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => markHelpful.mutate({ id: doubt.id, isHelpful: true }, { onSuccess: () => toast.success("Verified") })}
                      disabled={markHelpful.isPending}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> High Precision
                    </button>
                    <button
                      onClick={() => markHelpful.mutate({ id: doubt.id, isHelpful: false }, { onSuccess: () => toast.info("Feedback recorded") })}
                      disabled={markHelpful.isPending}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Low Precision
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CardGlass>
  );
}

// ─── Query Console (Modal Form) ────────────────────────────────────────────────
function AskDoubtForm({ onClose }: { onClose: () => void }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedTopicId, setSelectedTopicId]     = useState("");
  const [question, setQuestion]                   = useState("");
  const [mode, setMode]                           = useState<ExplanationMode>("short");
  const [askMode, setAskMode]                     = useState<"ai" | "teacher">("ai");

  const { data: subjects } = useSubjects();
  const { data: chapters } = useChapters(selectedSubjectId);
  const { data: topics }   = useTopics(selectedChapterId);
  const createDoubt = useCreateDoubt();

  const selClass = "w-full border border-slate-100 rounded-2xl px-5 py-5 text-[11px] font-black uppercase italic text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-3xl"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <CardGlass className="border-white bg-white/95 rounded-[3.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-3xl p-0">
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl"><Monitor className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">Query Terminal</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">New Data Input Sequence</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-10 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: "ai" as const, label: "Neural AI Mode", icon: <Sparkles className="w-5 h-5" /> },
              { val: "teacher" as const, label: "Human Node Hub", icon: <User className="w-5 h-5" /> },
            ].map(opt => (
              <button key={opt.val} onClick={() => setAskMode(opt.val)} className={cn("flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all", askMode === opt.val ? "border-slate-900 bg-white text-gray-900 shadow-2xl" : "border-slate-100 bg-white hover:border-slate-200")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", askMode === opt.val ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400")}>{opt.icon}</div>
                <p className="text-[10px] font-black uppercase tracking-widest">{opt.label}</p>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Context Calibration</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className={selClass}>
                  <option value="">Subject Module</option>
                  {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
               <select value={selectedChapterId} disabled={!selectedSubjectId} onChange={e => setSelectedChapterId(e.target.value)} className={selClass}>
                  <option value="">Chapter</option>
                  {chapters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
            </div>
            <select value={selectedTopicId} disabled={!selectedChapterId} onChange={e => setSelectedTopicId(e.target.value)} className={selClass}>
              <option value="">Specific Research Topic</option>
              {topics?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Data Input</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Describe the cognitive blocker..." rows={4} className="w-full border border-slate-100 rounded-[2.5rem] px-8 py-6 text-sm font-bold text-slate-800 placeholder-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-inner" />
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 bg-white flex flex-col gap-4">
          <motion.button whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} onClick={() => { if (!selectedTopicId || !question.trim()) return; createDoubt.mutate({ topicId: selectedTopicId, questionText: question.trim(), source: "manual", explanationMode: mode, ...(askMode === "teacher" ? { skipAI: true } : {}) }, { onSuccess: () => onClose() }); }} disabled={!selectedTopicId || !question.trim() || createDoubt.isPending}
            className="w-full py-6 rounded-[2.5rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50">
            {createDoubt.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : askMode === "teacher" ? <><User className="w-5 h-5" /> Escalate to Hub</> : <><Sparkles className="w-5 h-5" /> Activate Resolution</>}
          </motion.button>
        </div>
      </CardGlass>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentDoubtsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm]   = useState(false);
  const { data: doubts, isLoading } = useMyDoubts(activeTab === "all" ? undefined : activeTab as any);

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10 mb-12">
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white text-gray-900 w-fit shadow-xl">
              <Monitor className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">Resolution Terminal v2.0</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Resolution<br/><span className="not-italic text-blue-600">Terminal</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
             <CardGlass className="px-8 py-5 border-white bg-white/60 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><Target className="w-6 h-6" /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Blocks Cleared</p>
                   <p className="text-2xl font-black text-slate-900 leading-none">{doubts?.filter(d=>d.status.includes('resolved')).length ?? 0}</p>
                </div>
             </CardGlass>
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowForm(true)} className="flex items-center gap-4 px-10 py-6 rounded-3xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
                <Plus className="w-5 h-5" /> Dispatch Query
             </motion.button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 items-start">
          <div className="xl:col-span-3 space-y-10">
             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none sticky top-0 z-40">
                {TABS.map(tab => (
                  <motion.button key={tab.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab.key)}
                    className={cn("shrink-0 flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm", activeTab === tab.key ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white/60 backdrop-blur-3xl text-slate-400 border-white hover:border-slate-200")}>
                    {tab.label}
                  </motion.button>
                ))}
             </div>

             {isLoading ? (
               <div className="py-40 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-3xl"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Calibrating Resolution Feed</p>
               </div>
             ) : !doubts?.length ? (
               <div className="py-40 flex flex-col items-center text-center max-w-md mx-auto">
                  <div className="w-24 h-24 rounded-[3.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10"><Monitor className="w-10 h-10 text-slate-200" /></div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-4">Feed Offline</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">No active resolution threads detected for this frequency. Dispatch a query to activate the terminal.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 {doubts.map(d => <DoubtCard key={d.id} doubt={d} />)}
               </div>
             )}
          </div>

          <aside className="xl:col-span-1 sticky top-32 space-y-10">
             <CardGlass className="p-10 border-white bg-white/60">
                <h4 className="text-sm font-black text-slate-900 uppercase italic mb-8 flex items-center justify-between">Metrics <Brain className="w-5 h-5 text-blue-500" /></h4>
                <div className="space-y-8">
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>AI Precision</span><span className="text-blue-600">88.4%</span></div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden p-0.5"><motion.div initial={{ width: 0 }} animate={{ width: "88%" }} className="h-full bg-blue-600 rounded-full" /></div>
                   </div>
                </div>
                <div className="mt-12 p-6 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                   <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                   <p className="text-[9px] font-bold text-indigo-800 uppercase leading-relaxed tracking-tighter">AI nodes operating at <span className="font-black underline">Optimal Velocity</span>.</p>
                </div>
             </CardGlass>

             <div className="bg-slate-950 rounded-[3rem] p-10 shadow-3xl group relative overflow-hidden transition-all hover:translate-y-[-10px]">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
                <Layers className="w-12 h-12 text-blue-400 mb-8" />
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-[1.1] mb-6">Archive Access</h2>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-10 leading-relaxed">Access the curated resolution archive for your batch.</p>
                <button className="w-full py-5 rounded-2xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3">Sync Archive <ArrowRight className="w-4 h-4" /></button>
             </div>
          </aside>
        </div>

        <AnimatePresence>
          {showForm && <AskDoubtForm onClose={() => setShowForm(false)} />}
        </AnimatePresence>
    </div>
  );
}
