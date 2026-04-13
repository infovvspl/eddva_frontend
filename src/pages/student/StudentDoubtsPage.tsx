import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, ThumbsUp, ThumbsDown, ChevronDown,
  Loader2, AlertCircle, CheckCircle, Clock, X,
  Sparkles, User, Send, Target, Brain, ArrowRight,
  Monitor, Info, Layers, Zap, ArrowLeft,
} from "lucide-react";
import {
  useMyDoubts, useCreateDoubt, useMarkDoubtHelpful,
  useSubjects, useChapters, useTopics, useStudentMe,
} from "@/hooks/use-student";
import { StudentDoubt, DoubtStatus, ExplanationMode } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";
const EMERALD = "#10B981";
const ORANGE = "#F59E0B";
const SLATE  = "#64748B";

// ─── Status Config ─────────────────────────────────────────────────────────────
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

// ─── Shared Components ──────────────────────────────────────────────────────────

const CardGlass = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={onClick ? { y: -5, scale: 1.01 } : {}}
    onClick={onClick}
    className={cn(
      "bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-500",
      onClick ? "cursor-pointer" : "",
      className
    )}
  >
    {children}
  </motion.div>
);

// ─── Doubt Card ────────────────────────────────────────────────────────────────
function DoubtCard({ doubt }: { doubt: StudentDoubt }) {
  const [expanded, setExpanded] = useState(false);
  const markHelpful = useMarkDoubtHelpful();
  const s = statusConfig[doubt.status];
  const subjectName = doubt.topic?.chapter?.subject?.name;
  const topicName   = doubt.topic?.name;

  return (
    <CardGlass className={cn("group", expanded ? "shadow-blue-500/5 ring-1 ring-blue-500/10" : "hover:border-blue-200")}>
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
            {subjectName && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subjectName}</span>}
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 line-clamp-1">{doubt.questionText ?? "Query Terminal: Visual Feed Only"}</h3>
          
          <div className="flex items-center gap-4">
             {topicName && <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Layers className="w-3 h-3" /> {topicName}</span>}
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(doubt.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-2 pt-4">
           <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:border-blue-200 transition-all shadow-sm">
              <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
              </motion.div>
           </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50/30"
          >
            <div className="p-8 space-y-6">
              {/* Question Detail */}
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm relative">
                 <div className="absolute top-4 right-4"><Info className="w-4 h-4 text-gray-800" /></div>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 opacity-60">System Entry Query</p>
                 <p className="text-slate-800 font-medium leading-relaxed">{doubt.questionText}</p>
              </div>

              {/* AI Explanation: Resolution Engine */}
              {doubt.aiExplanation && (
                <div className="rounded-[2rem] p-8 border border-blue-100 bg-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full -mr-16 -mt-16" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                       <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.25em]">Neural Resolution Engine</p>
                       <p className="text-base font-black text-slate-900 uppercase italic leading-none">Instant Synthesis</p>
                    </div>
                  </div>
                  <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed mb-6">
                    {doubt.aiExplanation}
                  </div>
                  {doubt.aiConceptLinks && doubt.aiConceptLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                      {doubt.aiConceptLinks.map((c, i) => (
                        <span key={i} className="text-[10px] font-black px-4 py-2 rounded-xl bg-blue-50 text-blue-600 uppercase tracking-widest hover:bg-blue-100 transition-colors cursor-pointer">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Teacher Response: Human Hub */}
              {doubt.teacherResponse && (
                <div className="rounded-[2rem] p-8 border border-emerald-100 bg-emerald-50/40 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                       <User className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em]">Human Node Verification</p>
                       <p className="text-base font-black text-slate-900 uppercase italic leading-none">Faculty Response</p>
                    </div>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed italic border-l-4 border-emerald-500/20 pl-6">{doubt.teacherResponse}</p>
                </div>
              )}

              {/* Feedback Loop */}
              {doubt.status === "ai_resolved" && doubt.isHelpful === undefined && (
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-white border border-slate-100">
                  <div className="flex items-center gap-4 flex-1">
                     <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <Target className="w-4 h-4" />
                     </div>
                     <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Calibrate Accuracy Profile</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => markHelpful.mutate({ id: doubt.id, isHelpful: true }, {
                        onSuccess: () => toast.success("Accuracy verified"),
                        onError: () => toast.error("Profile sync failed"),
                      })}
                      disabled={markHelpful.isPending}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> High Precision
                    </button>
                    <button
                      onClick={() => markHelpful.mutate({ id: doubt.id, isHelpful: false }, {
                        onSuccess: () => toast.info("Feedback recorded. Escalating to human hub."),
                        onError: () => toast.error("Profile sync failed"),
                      })}
                      disabled={markHelpful.isPending}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
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

  const { data: subjects, isLoading: subLoading } = useSubjects();
  const { data: chapters, isLoading: chLoading }  = useChapters(selectedSubjectId);
  const { data: topics, isLoading: topLoading }   = useTopics(selectedChapterId);
  const createDoubt = useCreateDoubt();

  const selClass = "w-full border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/60 backdrop-blur-xl"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }}
        className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-3xl relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[60px] rounded-full -mr-32 -mt-32 pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-900">
                <Monitor className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">Query Terminal</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">New Data Input Sequence</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-10 space-y-8 relative z-10 custom-scrollbar">
          {/* Ask Mode */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { val: "ai" as const, label: "Neural AI Mode", sub: "Instant Resolution", icon: <Sparkles className="w-5 h-5" />, color: BLUE },
              { val: "teacher" as const, label: "Human Node Hub", sub: "Manual Escalation", icon: <User className="w-5 h-5" />, color: PURPLE },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setAskMode(opt.val)}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all group",
                  askMode === opt.val ? "border-slate-900 bg-white text-gray-900 shadow-2xl" : "border-slate-100 bg-white hover:border-slate-200"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", askMode === opt.val ? "bg-white/10" : "bg-slate-50 group-hover:scale-110 transition-transform")}>
                   <div style={{ color: askMode === opt.val ? "#fff" : opt.color }}>{opt.icon}</div>
                </div>
                <div className="text-center">
                   <p className="text-xs font-black uppercase tracking-widest">{opt.label}</p>
                   <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", askMode === opt.val ? "text-white/40" : "text-slate-400")}>{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Context Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Context Calibration</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <select value={selectedSubjectId}
                    onChange={e => { setSelectedSubjectId(e.target.value); setSelectedChapterId(""); setSelectedTopicId(""); }}
                    className={selClass}>
                    <option value="">Subject Module</option>
                    {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
               <div>
                  <select value={selectedChapterId}
                    disabled={!selectedSubjectId}
                    onChange={e => { setSelectedChapterId(e.target.value); setSelectedTopicId(""); }}
                    className={cn(selClass, !selectedSubjectId && "opacity-50 grayscale")}>
                    <option value="">Structural Chapter</option>
                    {chapters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
            </div>
            <select value={selectedTopicId} 
              disabled={!selectedChapterId}
              onChange={e => setSelectedTopicId(e.target.value)} 
              className={cn(selClass, !selectedChapterId && "opacity-50 grayscale")}>
              <option value="">Specific Research Topic</option>
              {topics?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Question Interface */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Data Input</label>
            <textarea
              value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Describe the cognitive blocker..."
              rows={5}
              className="w-full border border-slate-100 rounded-[2rem] px-8 py-6 text-sm font-bold text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-inner"
            />
          </div>

          {askMode === "ai" && (
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Resolution Depth</label>
              <div className="grid grid-cols-2 gap-4">
                {(["short", "detailed"] as ExplanationMode[]).map(m => (
                  <button key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      mode === m ? "bg-blue-600 text-white border-blue-600 shadow-xl" : "bg-white text-slate-400 border-slate-100 hover:border-blue-200"
                    )}
                  >
                    {m === "short" ? "⚡ Optimized Blast" : "📚 Deep Extraction"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-slate-100 relative z-10 bg-white">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!selectedTopicId || !question.trim()) return;
              createDoubt.mutate(
                { topicId: selectedTopicId, questionText: question.trim(), source: "manual", explanationMode: mode, ...(askMode === "teacher" ? { skipAI: true } : {}) },
                {
                  onSuccess: () => { toast.success("Resolution request dispatched"); onClose(); },
                  onError: () => toast.error("Dispatch failure"),
                }
              );
            }}
            disabled={!selectedTopicId || !question.trim() || createDoubt.isPending}
            className={cn(
              "w-full py-6 rounded-3xl text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all disabled:opacity-50 shadow-2xl",
              askMode === "ai" ? "bg-white text-white shadow-blue-500/20" : "bg-blue-600 text-white shadow-blue-600/20"
            )}
          >
            {createDoubt.isPending
              ? <><Loader2 className="w-5 h-5 animate-spin" /> DISPATCHING DATA...</>
              : askMode === "teacher"
              ? <><User className="w-5 h-5" /> ESCALATE TO HUB</>
              : <><Sparkles className="w-5 h-5" /> ACTIVATE RESOLUTION</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page: Resolution Terminal ───────────────────────────────────────────
export default function StudentDoubtsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm]   = useState(false);
  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const { data: doubts, isLoading } = useMyDoubts(statusFilter);
  const { data: me } = useStudentMe();

  const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
    if (tab.key === "all") acc[tab.key] = doubts?.length ?? 0;
    else acc[tab.key] = doubts?.filter(d => d.status === tab.key).length ?? 0;
    return acc;
  }, {});

  const totalResolved = (doubts?.filter(d => d.status === "ai_resolved" || d.status === "teacher_resolved").length ?? 0);
  const pendingCount = counts["open"] + counts["escalated"];

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] custom-scrollbar selection:bg-blue-600/10">
      <div className="relative z-10 px-6 sm:px-10 py-8 max-w-[1700px] mx-auto">
        
        {/* ── Terminal Header ── */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10 mb-12">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white text-gray-900 w-fit shadow-xl"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural Block Resonator Interface</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Resolution<br/><span className="not-italic text-blue-600">Terminal</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm sm:text-base max-w-lg leading-relaxed">
               Sync your cognitive blocks with the Hub. Currently maintaining a <span className="text-emerald-500 font-black">94.8% resolution accuracy</span> across your curriculum.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
             <CardGlass className="px-8 py-5 border-emerald-500/10 bg-emerald-500/[0.02] flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                   <Target className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Blocks Cleared</p>
                   <p className="text-2xl font-black text-slate-900 leading-none">{totalResolved}</p>
                </div>
             </CardGlass>
             <CardGlass className="px-8 py-5 border-orange-500/10 bg-orange-500/[0.02] flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                   <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Sync Pending</p>
                   <p className="text-2xl font-black text-slate-900 leading-none">{pendingCount}</p>
                </div>
             </CardGlass>
             <motion.button
               whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(37,99,235,0.2)" }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowForm(true)}
               className="flex items-center gap-4 px-10 py-6 rounded-3xl bg-white text-gray-900 text-xs font-black uppercase tracking-[0.2em] shadow-2xl group"
             >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Dispatch Query
             </motion.button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 items-start">
          <div className="xl:col-span-3 space-y-10">
             
             {/* ── Active Filters ── */}
             <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                {TABS.map(tab => (
                  <motion.button
                    key={tab.key}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      activeTab === tab.key ? "bg-white text-gray-900 border-slate-900 shadow-xl" : "bg-white text-slate-400 border-slate-100 hover:border-blue-200"
                    )}
                  >
                    {tab.label}
                    {counts[tab.key] > 0 && (
                      <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-black", activeTab === tab.key ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600")}>
                         {counts[tab.key]}
                      </span>
                    )}
                  </motion.button>
                ))}
             </div>

             {/* ── Resolution Feed ── */}
             {isLoading ? (
               <div className="py-40 flex flex-col items-center gap-6">
                  <div className="relative">
                     <Loader2 className="w-16 h-16 animate-spin text-blue-50" />
                     <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Calibrating Resolution Feed</p>
               </div>
             ) : !doubts?.length ? (
               <div className="py-32 flex flex-col items-center text-center max-w-md mx-auto">
                  <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10">
                     <Monitor className="w-10 h-10 text-gray-800" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-3">Feed Offline</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">
                    No active resolution threads detected for this frequency. Dispatch a new query to activate the terminal.
                  </p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                  >
                     <Zap className="w-4 h-4 fill-white" /> Activate Terminal
                  </button>
               </div>
             ) : (
               <div className="space-y-6">
                 {doubts.map(d => <DoubtCard key={d.id} doubt={d} />)}
               </div>
             )}
          </div>

          {/* ⚡ Hub Intelligence Sideboard */}
          <aside className="xl:col-span-1 sticky top-32 space-y-10 min-w-0">
             <CardGlass className="p-10">
                <h4 className="text-sm font-black text-slate-900 uppercase italic mb-8 flex items-center justify-between">
                   Intelligence Metrics
                   <Brain className="w-5 h-5 text-blue-500" />
                </h4>
                <div className="space-y-8">
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                         <span>AI Resolved %</span>
                         <span className="text-blue-600">88.4%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden p-0.5">
                         <motion.div initial={{ width: 0 }} animate={{ width: "88%" }} className="h-full bg-blue-600 rounded-full" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                         <span>Median Resolution Time</span>
                         <span className="text-purple-600">4.2m</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden p-0.5">
                         <motion.div initial={{ width: 0 }} animate={{ width: "95%" }} className="h-full bg-purple-600 rounded-full" />
                      </div>
                   </div>
                </div>
                
                <div className="mt-12 p-6 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                   <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-indigo-800 leading-relaxed uppercase tracking-tighter">
                      Resolution Hub is currently operating at <span className="font-black underline decoration-indigo-400">Optimal Velocity</span>. AI nodes are synchronized.
                   </p>
                </div>
             </CardGlass>

             <CardGlass className="p-0 bg-white overflow-hidden shadow-indigo-500/20">
                <div className="p-8 pb-4">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-6">
                      <Layers className="w-7 h-7 text-white" />
                   </div>
                   <h4 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Knowledge Base</h4>
                   <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-10 leading-loose">Access your curated resolution archive. <span className="text-blue-400 font-black">42 common unit blocks</span> verified for your batch.</p>
                </div>
                <button className="w-full py-5 bg-white/5 border-t border-white/5 text-xs font-black text-gray-900 hover:bg-white/10 uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                   Query Archive <ArrowRight className="w-4 h-4" />
                </button>
             </CardGlass>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {showForm && <AskDoubtForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}
