import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Radio, Clock, Calendar, Search, Loader2,
  Video, ChevronRight, BookOpen, Filter,
} from "lucide-react";
import { useStudentMe, useAllBatchLectures } from "@/hooks/use-student";
import type { StudentLecture } from "@/lib/api/student";

// ─── helpers ─────────────────────────────────────────────────────────────────

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
  live:      { icon: <Radio className="w-3.5 h-3.5" />,    label: "Live",      color: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/20" },
  recorded:  { icon: <Play className="w-3.5 h-3.5" />,     label: "Recorded",  color: "text-blue-500",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  published:  { label: "Available",     color: "text-emerald-500", bg: "bg-emerald-500/10" },
  live:       { label: "Live Now",      color: "text-red-500",     bg: "bg-red-500/10" },
  scheduled:  { label: "Upcoming",      color: "text-violet-500",  bg: "bg-violet-500/10" },
  draft:      { label: "Coming Soon",   color: "text-amber-500",   bg: "bg-amber-500/10" },
  ended:      { label: "Ended",         color: "text-slate-500",   bg: "bg-slate-500/10" },
  processing: { label: "Processing",    color: "text-blue-500",    bg: "bg-blue-500/10" },
};

type TabFilter = "all" | "live" | "recorded" | "scheduled";

const tabs: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all",       label: "All",       icon: <Video className="w-3.5 h-3.5" /> },
  { key: "live",      label: "Live",      icon: <Radio className="w-3.5 h-3.5" /> },
  { key: "recorded",  label: "Recorded",  icon: <Play className="w-3.5 h-3.5" /> },
  { key: "scheduled", label: "Upcoming",  icon: <Calendar className="w-3.5 h-3.5" /> },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}

// ─── Live Banner ─────────────────────────────────────────────────────────────

function LiveBanner({ lectures, onWatch }: { lectures: StudentLecture[]; onWatch: (id: string) => void }) {
  if (!lectures.length) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-bold text-red-500 uppercase tracking-wider">Live Now</span>
      </div>
      {lectures.map((lec) => (
        <motion.button
          key={lec.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onWatch(lec.id)}
          className="w-full bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 rounded-2xl p-5 text-left hover:border-red-500/40 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center shrink-0 relative">
              <Radio className="w-6 h-6 text-red-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-base truncate">{lec.title}</p>
              <div className="flex items-center gap-3 mt-1">
                {lec.topic && (
                  <span className="text-xs text-muted-foreground">{lec.topic.name}</span>
                )}
                {lec.scheduledAt && (
                  <span className="text-xs text-red-400">Started at {fmtTime(lec.scheduledAt)}</span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold group-hover:bg-red-600 transition-colors">
                <Play className="w-4 h-4" /> Join Live
              </span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Lecture Card ────────────────────────────────────────────────────────────

function LectureCard({ lecture, onWatch }: { lecture: StudentLecture; onWatch: (id: string) => void }) {
  const type = typeConfig[lecture.type] ?? typeConfig.recorded;
  const status = statusConfig[lecture.status] ?? statusConfig.published;
  const isLiveType = lecture.type === "live";
  const isClickable = lecture.status === "published" || lecture.status === "live" || lecture.status === "ended"
    || (isLiveType && lecture.status === "scheduled");
  const prog = lecture.studentProgress;
  const watchPct = prog?.watchPercentage ?? 0;
  const isCompleted = prog?.isCompleted ?? false;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      disabled={!isClickable}
      onClick={() => isClickable && onWatch(lecture.id)}
      className={`w-full bg-card border rounded-2xl p-4 text-left transition-all group overflow-hidden
        ${isCompleted ? "border-emerald-500/30" : watchPct > 0 ? "border-primary/30" : "border-border"}
        ${isClickable ? "hover:bg-secondary/30 hover:border-primary/40 cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
    >
      <div className="flex items-center gap-4">
        {/* Thumbnail / icon */}
        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${type.bg}`}>
          {lecture.thumbnailUrl ? (
            <img src={lecture.thumbnailUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            <span className={type.color}>{lecture.type === "live" ? <Radio className="w-6 h-6" /> : <Play className="w-6 h-6" />}</span>
          )}
          {isCompleted && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{lecture.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Type badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${type.bg} ${type.color}`}>
              {type.icon} {type.label}
            </span>
            {/* Status badge */}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${status.bg} ${status.color}`}>
              {status.label}
            </span>
            {/* Topic */}
            {lecture.topic && (
              <span className="text-xs text-muted-foreground truncate">{lecture.topic.name}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {lecture.videoDurationSeconds && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {fmtDuration(lecture.videoDurationSeconds)}
              </span>
            )}
            {lecture.scheduledAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {fmtDate(lecture.scheduledAt)} {fmtTime(lecture.scheduledAt)}
              </span>
            )}
            {/* Progress label */}
            {watchPct > 0 && !isCompleted && (
              <span className="text-xs text-primary font-medium">{Math.round(watchPct)}% watched</span>
            )}
            {isCompleted && (
              <span className="text-xs text-emerald-500 font-medium">Completed</span>
            )}
          </div>
          {/* Progress bar */}
          {watchPct > 0 && (
            <div className="mt-2 h-1 w-full bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                style={{ width: `${Math.min(watchPct, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* CTA */}
        {isClickable && (
          isLiveType && lecture.status === "scheduled" ? (
            <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 whitespace-nowrap">
              Wait Room
            </span>
          ) : isLiveType && lecture.status === "live" ? (
            <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-xl bg-red-500 text-white whitespace-nowrap animate-pulse">
              Join Live
            </span>
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          )
        )}
      </div>
    </motion.button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StudentLecturesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");

  const { data: me } = useStudentMe();
  const batchId = me?.student?.batchId;
  const { data: lectures, isLoading } = useAllBatchLectures(batchId);

  // Filter + search
  const filtered = useMemo(() => {
    let list = lectures ?? [];

    // Tab filter
    if (tab === "live") list = list.filter(l => l.type === "live" || l.status === "live");
    else if (tab === "recorded") list = list.filter(l => l.type === "recorded");
    else if (tab === "scheduled") list = list.filter(l => l.status === "scheduled");

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.topic?.name?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    }

    // Sort: live first, then scheduled by date, then published by date
    return list.sort((a, b) => {
      const order: Record<string, number> = { live: 0, scheduled: 1, published: 2, ended: 3, draft: 4, processing: 5 };
      const diff = (order[a.status] ?? 9) - (order[b.status] ?? 9);
      if (diff !== 0) return diff;
      if (a.scheduledAt && b.scheduledAt) return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
      return 0;
    });
  }, [lectures, tab, search]);

  const liveLectures = useMemo(
    () => (lectures ?? []).filter(l => l.status === "live"),
    [lectures]
  );

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
    const lecture = (lectures ?? []).find((l) => l.id === id);
    if (lecture?.type === "live" && (lecture?.status === "live" || lecture?.status === "scheduled")) {
      navigate(`/live/${id}`);
    } else {
      navigate(`/student/lectures/${id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lectures</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {counts.all} lecture{counts.all !== 1 ? "s" : ""} available
            {counts.live > 0 && <span className="text-red-500 font-medium ml-1">({counts.live} live)</span>}
          </p>
        </div>
      </div>

      {/* Live banner */}
      <LiveBanner lectures={liveLectures} onWatch={handleWatch} />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search lectures..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors
              ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon}
            {t.label}
            {counts[t.key] > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? "No matching lectures" : tab !== "all" ? `No ${tab} lectures` : "No lectures yet"}
          </p>
          <p className="text-sm mt-1">
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
  );
}
