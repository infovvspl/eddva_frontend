import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Radio, Clock, Calendar, Search, Loader2,
  Video, ChevronRight, CheckCircle,
} from "lucide-react";
import { useStudentMe, useAllBatchLectures } from "@/hooks/use-student";
import type { StudentLecture } from "@/lib/api/student";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  live:     { icon: <Radio className="w-3.5 h-3.5" />, label: "Live",     color: "#ef4444", bg: "#FEF2F2" },
  recorded: { icon: <Play  className="w-3.5 h-3.5" />, label: "Recorded", color: BLUE,      bg: BLUE_L   },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  published:  { label: "Available",  color: "#059669", bg: "#ECFDF5" },
  live:       { label: "Live Now",   color: "#ef4444", bg: "#FEF2F2" },
  scheduled:  { label: "Upcoming",   color: "#7c3aed", bg: "#F5F3FF" },
  draft:      { label: "Coming Soon",color: "#d97706", bg: "#FFFBEB" },
  ended:      { label: "Ended",      color: "#64748b", bg: "#F8FAFC" },
  processing: { label: "Processing", color: BLUE_M,    bg: BLUE_L   },
};

type TabFilter = "all" | "live" | "recorded" | "scheduled";

const tabs: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all",       label: "All",      icon: <Video    className="w-3.5 h-3.5" /> },
  { key: "live",      label: "Live",     icon: <Radio    className="w-3.5 h-3.5" /> },
  { key: "recorded",  label: "Recorded", icon: <Play     className="w-3.5 h-3.5" /> },
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

// ─── Live Banner ───────────────────────────────────────────────────────────────
function LiveBanner({ lectures, onWatch }: { lectures: StudentLecture[]; onWatch: (id: string) => void }) {
  if (!lectures.length) return null;
  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-black text-red-500 uppercase tracking-widest">Live Now</span>
      </div>
      {lectures.map(lec => (
        <motion.button
          key={lec.id}
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01, boxShadow: "0 8px 24px rgba(239,68,68,0.15)" }}
          onClick={() => onWatch(lec.id)}
          className="w-full text-left rounded-3xl p-5 border border-red-200 transition-all group"
          style={{ background: "linear-gradient(135deg, #FEF2F2 0%, #fff 80%)" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative bg-red-100">
              <Radio className="w-6 h-6 text-red-500" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-base truncate">{lec.title}</p>
              <div className="flex items-center gap-3 mt-1">
                {lec.topic && <span className="text-xs text-gray-400">{lec.topic.name}</span>}
                {lec.scheduledAt && <span className="text-xs text-red-400 font-medium">Started at {fmtTime(lec.scheduledAt)}</span>}
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-500 text-white text-sm font-black group-hover:bg-red-600 transition-colors">
              <Play className="w-4 h-4" /> Join Live
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Lecture Card ──────────────────────────────────────────────────────────────
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
    <motion.button
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={isClickable ? { y: -2, boxShadow: "0 8px 24px rgba(1,56,137,0.1)" } : {}}
      disabled={!isClickable}
      onClick={() => isClickable && onWatch(lecture.id)}
      className={`w-full bg-white border rounded-2xl p-4 text-left transition-all group overflow-hidden shadow-sm
        ${isDone ? "border-green-100" : watchPct > 0 ? "border-blue-100" : "border-gray-100"}
        ${isClickable ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
    >
      <div className="flex items-center gap-4">
        {/* Thumbnail / Icon */}
        <div
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: type.bg }}
        >
          {lecture.thumbnailUrl ? (
            <img src={lecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: type.color }}>
              {lecture.type === "live" ? <Radio className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </span>
          )}
          {isDone && (
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{lecture.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg" style={{ background: type.bg, color: type.color }}>
              {type.icon} {type.label}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
            {lecture.topic && <span className="text-xs text-gray-400 truncate">{lecture.topic.name}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {lecture.videoDurationSeconds && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {fmtDuration(lecture.videoDurationSeconds)}
              </span>
            )}
            {lecture.scheduledAt && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {fmtDate(lecture.scheduledAt)} {fmtTime(lecture.scheduledAt)}
              </span>
            )}
            {watchPct > 0 && !isDone && (
              <span className="text-xs font-bold" style={{ color: BLUE }}>{Math.round(watchPct)}% watched</span>
            )}
            {isDone && <span className="text-xs font-bold text-green-500">Completed ✓</span>}
          </div>
          {watchPct > 0 && (
            <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: BLUE_L }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(watchPct, 100)}%`, background: isDone ? "#10b981" : BLUE_M }}
              />
            </div>
          )}
        </div>

        {/* CTA Arrow */}
        {isClickable && (
          isLive && lecture.status === "scheduled"
            ? <span className="shrink-0 text-[10px] font-black px-2.5 py-1.5 rounded-xl border" style={{ background: "#F5F3FF", color: "#7c3aed", borderColor: "#DDD6FE" }}>Wait Room</span>
            : isLive && lecture.status === "live"
            ? <span className="shrink-0 text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-red-500 text-white animate-pulse">Join Live</span>
            : <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        )}
      </div>
    </motion.button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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
    <div className="min-h-screen p-5 sm:p-6" style={{ background: "#F5F7FB" }}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 60%, #0388d1 100%)` }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-5" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Lectures</h1>
              <p className="text-white/60 text-sm font-medium mt-0.5">
                {counts.all} lecture{counts.all !== 1 ? "s" : ""} available
                {counts.live > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-red-300 font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                    {counts.live} live
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Live Banner ── */}
        <LiveBanner lectures={liveLectures} onWatch={handleWatch} />

        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lectures..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm"
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          {tabs.map(t => (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={tab === t.key
                ? { background: BLUE, color: "#fff", boxShadow: `0 4px 12px ${BLUE}25` }
                : { color: "#9CA3AF" }}
            >
              {t.icon} {t.label}
              {counts[t.key] > 0 && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={tab === t.key ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : { background: BLUE_L, color: BLUE }}
                >
                  {counts[t.key]}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
            <p className="text-sm text-gray-400 font-medium">Loading lectures…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: BLUE_L }}>
              <Video className="w-8 h-8" style={{ color: BLUE }} />
            </div>
            <p className="font-black text-gray-800 text-base">
              {search ? "No matching lectures" : tab !== "all" ? `No ${tab} lectures` : "No lectures yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? "Try a different search term" : "Your teacher hasn't uploaded lectures yet"}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filtered.map((lec, i) => (
                <motion.div
                  key={lec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <LectureCard lecture={lec} onWatch={handleWatch} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
