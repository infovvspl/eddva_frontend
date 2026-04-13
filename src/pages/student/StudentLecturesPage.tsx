import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Radio, Clock, Calendar, Search, Loader2,
  Video, ChevronRight, CheckCircle, Sparkles, Filter,
  Layers, Zap, Clock3, Layout,
} from "lucide-react";
import { useStudentMe, useAllBatchLectures } from "@/hooks/use-student";
import type { StudentLecture } from "@/lib/api/student";
import { cn } from "@/lib/utils";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";
const INDIGO = "#4F46E5";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  live:     { icon: <Radio className="w-3.5 h-3.5" />, label: "Live",     color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  recorded: { icon: <Play  className="w-3.5 h-3.5" />, label: "Recorded", color: BLUE,      bg: "rgba(37, 99, 237, 0.1)" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  published:  { label: "Available",  color: "#059669", bg: "rgba(5, 150, 105, 0.1)" },
  live:       { label: "Live Now",   color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  scheduled:  { label: "Upcoming",   color: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)" },
  draft:      { label: "Coming Soon",color: "#d97706", bg: "rgba(217, 119, 6, 0.1)" },
  ended:      { label: "Ended",      color: "#64748b", bg: "rgba(100, 116, 139, 0.1)" },
  processing: { label: "Processing", color: BLUE,      bg: "rgba(37, 99, 237, 0.1)" },
};

type TabFilter = "all" | "live" | "recorded" | "scheduled";

const tabs: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all",       label: "Library",  icon: <Layout className="w-3.5 h-3.5" /> },
  { key: "live",      label: "Live",     icon: <Radio  className="w-3.5 h-3.5" /> },
  { key: "recorded",  label: "Recorded", icon: <Play   className="w-3.5 h-3.5" /> },
  { key: "scheduled", label: "Upcoming", icon: <Calendar className="w-3.5 h-3.5" /> },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

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

// ─── Live Banner: Aero Pulse ──────────────────────────────────────────────────
function LiveBanner({ lectures, onWatch }: { lectures: StudentLecture[]; onWatch: (id: string) => void }) {
  if (!lectures.length) return null;
  return (
    <div className="space-y-4 mb-10">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.25em]">Critical Feed • Live Now</span>
      </div>
      {lectures.map(lec => (
        <CardGlass
          key={lec.id}
          onClick={() => onWatch(lec.id)}
          className="p-1 border-red-500/20 bg-red-500/[0.02]"
        >
          <div className="p-5 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center shrink-0 shadow-xl shadow-red-500/20 relative">
               <Radio className="w-8 h-8 text-white animate-pulse" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
               </div>
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none truncate">{lec.title}</h3>
               <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-lg">Stream Active</span>
                  {lec.topic && <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Layers className="w-3 h-3" /> {lec.topic.name}</span>}
               </div>
            </div>
            <button className="px-8 py-4 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/25">
              Enter Stream
            </button>
          </div>
        </CardGlass>
      ))}
    </div>
  );
}

// ─── Lecture Card: Aero Gallery ────────────────────────────────────────────────
function LectureCard({ lecture, onWatch }: { lecture: StudentLecture; onWatch: (id: string) => void }) {
  const type       = typeConfig[lecture.type] ?? typeConfig.recorded;
  const status     = statusConfig[lecture.status] ?? statusConfig.published;
  const isLive     = lecture.type === "live";
  const isClickable = lecture.status === "published" || lecture.status === "live" || lecture.status === "ended"
    || (isLive && lecture.status === "scheduled");
  const prog       = lecture.studentProgress;
  const watchPct   = prog?.watchPercentage ?? 0;
  const isDone     = prog?.isCompleted ?? false;

  return (
    <CardGlass 
      onClick={isClickable ? () => onWatch(lecture.id) : undefined}
      className={cn(
        "p-6 group",
        !isClickable && "opacity-60 grayscale cursor-not-allowed",
        isDone ? "border-emerald-500/10 shadow-emerald-500/5" : watchPct > 0 ? "border-blue-500/10 shadow-blue-500/5" : "border-white/60"
      )}
    >
      <div className="flex items-center gap-6">
        {/* Thumbnail / Icon with Glow */}
        <div className="relative w-20 h-20 rounded-[1.75rem] bg-white flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500 overflow-hidden">
           {lecture.thumbnailUrl ? (
             <img src={lecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
           ) : (
             <div className="flex flex-col items-center gap-1" style={{ color: type.color }}>
                {lecture.type === "live" ? <Radio className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current" />}
             </div>
           )}
           {isDone && (
              <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                 <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
           )}
        </div>

        {/* Dynamic Content Info */}
        <div className="flex-1 min-w-0">
           <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ background: type.bg, color: type.color }}>
                 {type.icon} {type.label}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{ background: status.bg, color: status.color }}>
                 {status.label}
              </span>
           </div>

           <h4 className={cn(
             "text-lg font-black tracking-tight leading-tight mb-2 truncate group-hover:text-blue-600 transition-colors uppercase italic",
             isDone ? "text-slate-400" : "text-slate-900"
           )}>
              {lecture.title}
           </h4>

           <div className="flex items-center gap-4 flex-wrap">
              {lecture.topic && (
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> {lecture.topic.name}
                 </span>
              )}
              {lecture.videoDurationSeconds && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Clock3 className="w-3 h-3" /> {fmtDuration(lecture.videoDurationSeconds)}
                </span>
              )}
              {lecture.scheduledAt && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Calendar className="w-3 h-3" /> {fmtDate(lecture.scheduledAt)}
                </span>
              )}
           </div>

           {/* Progress Pulse */}
           {watchPct > 0 && (
              <div className="mt-4 space-y-1.5">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neural Retention</span>
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{Math.round(watchPct)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(watchPct, 100)}%` }}
                      className={cn("h-full rounded-full shadow-lg", isDone ? "bg-emerald-500" : "bg-blue-600")}
                    />
                 </div>
              </div>
           )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center justify-center p-2">
           <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:border-blue-200 group-hover:scale-110 transition-all shadow-sm">
              <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
           </div>
        </div>
      </div>
    </CardGlass>
  );
}

// ─── Main Page: Aero Library ──────────────────────────────────────────────────
export default function StudentLecturesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");

  const { data: me } = useStudentMe();
  const batchId = me?.student?.batchId;
  const { data: lectures, isLoading } = useAllBatchLectures(batchId);

  const filtered = useMemo(() => {
    let list = lectures ?? [];
    if (tab === "live")      list = list.filter(l => l.type === "live" || l.status === "live");
    else if (tab === "recorded")  list = list.filter(l => l.type === "recorded");
    else if (tab === "scheduled") list = list.filter(l => l.status === "scheduled");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.topic?.name?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const order: Record<string, number> = { live: 0, scheduled: 1, published: 2, ended: 3, draft: 4, processing: 5 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });
  }, [lectures, tab, search]);

  const liveLectures = useMemo(() => (lectures ?? []).filter(l => l.status === "live"), [lectures]);
  const counts = useMemo(() => {
    const all = lectures ?? [];
    return {
      all: all.length,
      live: all.filter(l => l.type === "live" || l.status === "live").length,
      recorded: all.filter(l => l.type === "recorded").length,
      scheduled: all.filter(l => l.status === "scheduled").length,
    };
  }, [lectures]);

  const handleWatch = (id: string) => {
    const lec = (lectures ?? []).find(l => l.id === id);
    if (lec?.type === "live" && (lec?.status === "live" || lec?.status === "scheduled")) {
      navigate(`/live/${id}`);
    } else {
      navigate(`/student/lectures/${id}`);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] custom-scrollbar selection:bg-blue-600/10">
      {/* ── Aero Dynamic Background ── */}

      <div className="relative z-10 px-6 sm:px-10 py-8 max-w-[1700px] mx-auto">
        
        {/* ── Aero Library Header ── */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10 mb-12">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white text-gray-900 w-fit shadow-xl"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural Streams Archive</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Knowledge<br/><span className="not-italic text-blue-600">Gallery</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm sm:text-base max-w-lg leading-relaxed">
              Explore your complete academic roadmap. Access {counts.all} specialized training modules synthesized for your batch.
            </p>
          </div>

          <div className="space-y-6 lg:w-96">
             {/* ── Interactive Search ── */}
             <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Query Streams..."
                  className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white border border-slate-100 shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-900 placeholder-slate-400 transition-all"
                />
             </div>

             {/* ── Modern Tabs ── */}
             <div className="flex gap-2 p-1.5 bg-white/60 backdrop-blur-3xl border border-white/60 rounded-2xl shadow-xl">
               {tabs.map(t => (
                 <motion.button
                   key={t.key}
                   whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                   onClick={() => setTab(t.key)}
                   className={cn(
                     "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                     tab === t.key ? "bg-white text-gray-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   {t.icon} {t.label}
                 </motion.button>
               ))}
             </div>
          </div>
        </header>

        {/* ── Live Stream Highlight ── */}
        <LiveBanner lectures={liveLectures} onWatch={handleWatch} />

        {/* ── Main Gallery Grid ── */}
        {isLoading ? (
          <div className="py-40 flex flex-col items-center gap-6">
             <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-blue-100" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Knowledge Base</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-40 flex flex-col items-center text-center max-w-md mx-auto">
             <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-8">
                <Filter className="w-10 h-10 text-gray-800" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-2">Zero Streams Found</h3>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Your current query resulted in an empty set. Try recalibrating your filters.
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
             <AnimatePresence mode="popLayout">
               {filtered.map((lec, i) => (
                 <motion.div
                   key={lec.id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ delay: i * 0.05 }}
                   layout
                 >
                   <LectureCard lecture={lec} onWatch={handleWatch} />
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Bottom Hub Decoration ── */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
    </div>
  );
}
