import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Radio, Clock, Calendar, Search, Loader2,
  Video, CheckCircle, Filter, Layers, Zap,
  X, ChevronRight, Eye, Monitor, ArrowRight
} from "lucide-react";
import { useAllBatchLectures } from "@/hooks/use-student";
import type { StudentLecture } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { CardGlass } from "@/components/shared/CardGlass";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();
function resolveUrl(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${_API_ORIGIN}${url}`;
}

type TabFilter = "all" | "live" | "recorded" | "scheduled" | "completed";

const TABS: { key: TabFilter; label: string }[] = [
  { key: "all",       label: "ARCHIVE"   },
  { key: "live",      label: "LIVE RADIUS" },
  { key: "recorded",  label: "SYNTHESIZED" },
  { key: "scheduled", label: "PROJECTED" },
  { key: "completed", label: "ANALYZED"  },
];

// ─── Live Pulse Banner ─────────────────────────────────────────────────────────
function LiveBanner({ lectures, onWatch }: { lectures: StudentLecture[]; onWatch: (id: string) => void }) {
  if (!lectures.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      {lectures.map(lec => (
        <CardGlass 
          key={lec.id} 
          onClick={() => onWatch(lec.id)}
          className="p-1 border-indigo-100 bg-white/40 shadow-sm"
        >
          <div className="rounded-3xl p-6 flex items-center gap-6 bg-white/40">
             <div className="relative w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 text-indigo-500 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-indigo-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                </span>
             </div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                   <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50">Neural Feed: Live</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight truncate">{lec.title}</h3>
             </div>
             <motion.button
               whileHover={{ y: -2 }}
               whileTap={{ scale: 0.98 }}
               className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-colors"
             >
                Engage Stream
             </motion.button>
          </div>
        </CardGlass>
      ))}
    </motion.div>
  );
}

// ─── Lecture Card ──────────────────────────────────────────────────────────────
function LectureCard({ lecture, onWatch }: { lecture: StudentLecture; onWatch: (id: string) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = resolveUrl(lecture.thumbnailUrl);
  const prog = lecture.studentProgress;
  const watchPct = prog?.watchPercentage ?? 0;
  const isDone = prog?.isCompleted ?? false;
  const isLive = lecture.status === "live";
  const isScheduled = lecture.status === "scheduled";
  const isClickable = ["published", "live", "ended"].includes(lecture.status)
    || (lecture.type === "live" && isScheduled);

  const statusLabel = isLive ? "LIVE" : isScheduled ? "PROJECTED" : isDone ? "ANALYZED" : "RECAP";
  const statusColor = isLive ? "bg-indigo-600" : isScheduled ? "bg-slate-400" : isDone ? "bg-emerald-500" : "bg-indigo-400";

  return (
    <CardGlass 
      onClick={isClickable ? () => onWatch(lecture.id) : undefined}
      className={cn(
        "p-0 group border-slate-100 bg-white/40 transition-all duration-500",
        !isClickable && "opacity-40 grayscale"
      )}
    >
      <div className="relative aspect-video bg-slate-50 overflow-hidden">
        {thumb && !imgErr ? (
          <img src={thumb} alt={lecture.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <Video className="w-10 h-10 text-slate-300 opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 left-3">
          <span className={cn(
            "text-[7px] font-bold uppercase tracking-widest px-2 py-1 rounded-full text-white shadow-sm",
            statusColor
          )}>
            {statusLabel}
          </span>
        </div>
        {lecture.videoDurationSeconds && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
             <div className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-[7px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {fmtDuration(lecture.videoDurationSeconds)}
             </div>
          </div>
        )}
        {watchPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
            <motion.div
              className="h-full"
              style={{ background: isDone ? "#10b981" : "#6366f1" }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(watchPct, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      <div className="p-5">
        <h4 className="text-sm font-bold text-slate-700 mb-4 line-clamp-2 tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">
          {lecture.title}
        </h4>
        <div className="flex flex-col gap-2.5 mb-5">
          {lecture.topic && (
            <div className="flex items-center gap-2 text-[8px] font-bold text-slate-300 uppercase tracking-widest">
               <Layers className="w-3.5 h-3.5 text-indigo-400/50" /> {lecture.topic.name}
            </div>
          )}
          {watchPct > 0 && !isDone && (
            <div className="flex items-center gap-2 text-[8px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50/50 w-fit px-2 py-0.5 rounded-full border border-indigo-100/50">
               <Eye className="w-3.5 h-3.5" /> {Math.round(watchPct)}% EXTRAPOLATED
            </div>
          )}
        </div>
        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
            <span className="text-[7px] font-bold text-slate-200 uppercase tracking-[0.2em]">{isClickable ? "LINK READY" : "ENCRYPTED"}</span>
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-xs">
                <ArrowRight className="w-4 h-4" />
            </div>
        </div>
      </div>
    </CardGlass>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentLecturesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");

  const { data: lectures, isLoading } = useAllBatchLectures(); // no batchId → all enrolled batches

  const counts = useMemo(() => {
    const all = lectures ?? [];
    return {
      all: all.length,
      live: all.filter(l => l.status === "live").length,
      recorded: all.filter(l => l.type === "recorded").length,
      scheduled: all.filter(l => l.status === "scheduled").length,
      completed: all.filter(l => l.studentProgress?.isCompleted).length,
    };
  }, [lectures]);

  const filtered = useMemo(() => {
    let list = lectures ?? [];
    if (tab === "live")      list = list.filter(l => l.status === "live");
    else if (tab === "recorded")  list = list.filter(l => l.type === "recorded");
    else if (tab === "scheduled") list = list.filter(l => l.status === "scheduled");
    else if (tab === "completed") list = list.filter(l => l.studentProgress?.isCompleted);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.topic?.name?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const order: Record<string, number> = { live: 0, scheduled: 1, published: 2, ended: 3, draft: 4, processing: 5 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });
  }, [lectures, tab, search]);

  const liveLectures = useMemo(() => (lectures ?? []).filter(l => l.status === "live"), [lectures]);

  const handleWatch = (id: string) => {
    const lec = (lectures ?? []).find(l => l.id === id);
    if (lec?.type === "live" && (lec?.status === "live" || lec?.status === "scheduled")) {
      navigate(`/live/${id}`);
    } else {
      navigate(`/student/lectures/${id}`);
    }
  };

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
          <div className="space-y-4">
             <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 px-4 py-1 rounded-full bg-slate-50 border border-slate-100 text-indigo-500 w-fit"
             >
                <Monitor className="w-3 h-3" />
                <span className="text-[8px] font-bold uppercase tracking-widest">KNOWLEDGE ARCHIVE V2.0</span>
             </motion.div>
             <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none uppercase">
                Knowledge <span className="text-indigo-600">Gallery</span>
             </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
             <CardGlass className="px-6 py-4 border-slate-100 bg-white/40 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center shadow-sm">
                   <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ANALYZED</p>
                   <p className="text-xl font-bold text-slate-800 leading-none mt-1">{counts.completed}</p>
                </div>
             </CardGlass>
          </div>
        </header>

        <div className="flex gap-4 flex-col sm:flex-row items-center sticky top-0 z-40">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="QUERY ARCHIVE..."
              className="w-full pl-14 pr-8 py-5 rounded-2xl bg-white border border-slate-100 text-xs font-bold text-slate-700 placeholder:text-slate-200 focus:outline-none focus:border-indigo-100 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-1.5 bg-white/40 p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto hide-scrollbar w-full sm:w-auto">
            {TABS.map(t => {
                const active = tab === t.key;
                return (
                  <motion.button
                    key={t.key}
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                      active ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-900"
                    )}
                  >
                    {t.label}
                    {counts[t.key] > 0 && (
                      <span className={cn("px-1.5 py-0.5 rounded-full text-[7px] font-bold", active ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-400")}>
                        {counts[t.key]}
                      </span>
                    )}
                  </motion.button>
                );
              })}
          </div>
        </div>

        <LiveBanner lectures={liveLectures} onWatch={handleWatch} />

        {isLoading ? (
          <div className="py-40 flex flex-col items-center gap-6">
             <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
             </div>
             <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Synchronizing Archive Data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-40 flex flex-col items-center text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center shadow-sm mb-8">
              <Video className="w-6 h-6 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-2">Frequency Empty</h3>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">No operative visual feeds found in this sector.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filtered.map((lec, i) => (
                <motion.div key={lec.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: Math.min(i * 0.05, 0.4) }} layout>
                  <LectureCard lecture={lec} onWatch={handleWatch} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
    </div>
  );
}
