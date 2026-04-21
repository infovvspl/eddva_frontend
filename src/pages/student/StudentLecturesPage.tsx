import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Clock, Loader2, Video, BookOpen,
  Bookmark, BookmarkCheck, Zap, Brain, AlertTriangle,
  ChevronRight, Radio, Sparkles, RotateCcw,
  MessageCircle, TrendingUp, Star, ArrowRight,
  Eye, CheckCircle2, PlayCircle, ChevronDown,
} from "lucide-react";
import { useAllBatchLectures, useAllEnrolledSubjectNames } from "@/hooks/use-student";
import type { StudentLecture } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { getApiOrigin } from "@/lib/api-config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const _API_ORIGIN = getApiOrigin();
function resolveUrl(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${_API_ORIGIN}${url}`;
}
function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type LectureType = "all" | "live" | "recorded";
type StatusKey   = "all" | "watched" | "unwatched" | "in_progress";

const STATUS_OPTIONS: { key: StatusKey; label: string; icon: React.ReactNode }[] = [
  { key: "all",         label: "All Progress",  icon: <Sparkles className="w-3.5 h-3.5" />    },
  { key: "in_progress", label: "In Progress",   icon: <Play className="w-3.5 h-3.5" />        },
  { key: "unwatched",   label: "Not Started",   icon: <Eye className="w-3.5 h-3.5" />         },
  { key: "watched",     label: "Completed",     icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

// ─── Bookmark store (localStorage) ────────────────────────────────────────────

const BM_KEY = "lecture_bookmarks";
function loadBookmarks(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(BM_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function saveBookmarks(set: Set<string>) {
  localStorage.setItem(BM_KEY, JSON.stringify([...set]));
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

interface DropdownOption<T extends string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
}

function buildSubjectOptions(lectures: StudentLecture[], assignedFromCourses: string[]) {
  const names = new Set<string>();
  for (const n of assignedFromCourses) {
    if (n?.trim()) names.add(n.trim());
  }
  for (const l of lectures) {
    const n = l.topic?.chapter?.subject?.name?.trim();
    if (n) names.add(n);
  }
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  return [
    { key: "all" as const, label: "All Subjects" },
    ...sorted.map(n => ({ key: n.toLowerCase(), label: n })),
  ];
}

function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
  prefix,
  active,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
  prefix?: string;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.key === value) ?? options[0]!;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all shadow-sm whitespace-nowrap",
          active
            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
        )}
      >
        {selected.icon && <span className="opacity-60">{selected.icon}</span>}
        <span>{prefix ? `${prefix}: ` : ""}<span className="font-bold">{selected.label}</span></span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform opacity-50", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 z-50 bg-white rounded-2xl border border-slate-100 shadow-xl py-1.5 min-w-[160px]"
          >
            {options.map(opt => (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors text-left",
                  opt.key === value
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {opt.icon && <span className={opt.key === value ? "text-indigo-500" : "text-slate-400"}>{opt.icon}</span>}
                {opt.label}
                {opt.key === value && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 ml-auto" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Insights Sidebar Panel ─────────────────────────────────────────────────

function InsightPanel({ lectures }: { lectures: StudentLecture[] }) {
  const navigate = useNavigate();

  const weakTopics = useMemo(() => {
    const map = new Map<string, { name: string; pct: number; count: number }>();
    lectures.forEach(l => {
      if (!l.topic) return;
      const pct = l.studentProgress?.watchPercentage ?? 0;
      const existing = map.get(l.topic.id);
      if (!existing) map.set(l.topic.id, { name: l.topic.name, pct, count: 1 });
      else map.set(l.topic.id, { name: l.topic.name, pct: (existing.pct + pct) / 2, count: existing.count + 1 });
    });
    return [...map.values()].filter(t => t.pct < 40 && t.count > 0).slice(0, 3);
  }, [lectures]);

  const strongTopics = useMemo(() => {
    const map = new Map<string, { name: string; pct: number }>();
    lectures.forEach(l => {
      if (!l.topic) return;
      const pct = l.studentProgress?.watchPercentage ?? 0;
      const existing = map.get(l.topic.id);
      if (!existing) map.set(l.topic.id, { name: l.topic.name, pct });
      else map.set(l.topic.id, { name: l.topic.name, pct: Math.max(existing.pct, pct) });
    });
    return [...map.values()].filter(t => t.pct >= 80).slice(0, 3);
  }, [lectures]);

  const suggested = useMemo(() =>
    lectures.find(l => {
      const pct = l.studentProgress?.watchPercentage ?? 0;
      return pct === 0 && l.status === "published";
    }) ?? lectures.find(l => {
      const pct = l.studentProgress?.watchPercentage ?? 0;
      return pct > 0 && pct < 100;
    }),
  [lectures]);

  const pendingDoubts = 0;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        className="bg-white/70 backdrop-blur-xl rounded-2xl border border-amber-100 p-5 shadow-sm"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Needs Attention</p>
            <p className="text-[10px] text-slate-400">Topics below 40% progress</p>
          </div>
        </div>
        {weakTopics.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">Great job — no weak topics! 🎉</p>
        ) : (
          <div className="space-y-2.5">
            {weakTopics.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-700 truncate">{t.name}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-500 shrink-0">{Math.round(t.pct)}%</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
        className="bg-white/70 backdrop-blur-xl rounded-2xl border border-emerald-100 p-5 shadow-sm"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Mastered</p>
            <p className="text-[10px] text-slate-400">Topics at 80%+ progress</p>
          </div>
        </div>
        {strongTopics.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">Keep watching to build mastery</p>
        ) : (
          <div className="space-y-2">
            {strongTopics.map((t, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <Star className="w-3 h-3 text-emerald-500 shrink-0" />
                <p className="text-[11px] font-semibold text-emerald-800 truncate flex-1">{t.name}</p>
                <span className="text-[10px] font-bold text-emerald-600">{Math.round(t.pct)}%</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {suggested && (
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 shadow-lg shadow-indigo-500/20 relative overflow-hidden"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-indigo-200" />
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">AI Recommends</p>
            </div>
            <p className="text-sm font-bold text-white leading-snug mb-3 line-clamp-2">{suggested.title}</p>
            {suggested.topic && (
              <p className="text-[10px] text-indigo-300 mb-3">{suggested.topic.name}</p>
            )}
            <button
              onClick={() => navigate(`/student/lectures/${suggested.id}`)}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors w-full justify-center"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Start Now
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
        className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-100 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Doubts</p>
              <p className="text-[10px] text-slate-400">{pendingDoubts > 0 ? `${pendingDoubts} pending` : "All resolved"}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/student/doubts")}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Lecture Card ─────────────────────────────────────────────────────────────

function LectureCard({
  lecture, bookmarked, onBookmark, onWatch, index,
}: {
  lecture: StudentLecture;
  bookmarked: boolean;
  onBookmark: (id: string) => void;
  onWatch: (id: string) => void;
  index: number;
}) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = resolveUrl(lecture.thumbnailUrl);
  const pct = lecture.studentProgress?.watchPercentage ?? 0;
  const isDone = lecture.studentProgress?.isCompleted ?? false;
  const isLive = lecture.status === "live";
  const isScheduledLive = lecture.type === "live" && lecture.status === "scheduled";
  const isClickable = ["published", "live", "ended"].includes(lecture.status) || isScheduledLive;

  const aiSummary = useMemo(() => {
    if (lecture.aiKeyConcepts?.length) return lecture.aiKeyConcepts.slice(0, 2).join(" · ");
    if (lecture.description) return lecture.description.slice(0, 90) + (lecture.description.length > 90 ? "…" : "");
    return null;
  }, [lecture]);

  const actionLabel = isDone ? "Revise" : pct > 0 ? "Resume" : isScheduledLive ? "Not Started" : "Start";
  const actionIcon = isDone
    ? <RotateCcw className="w-3.5 h-3.5" />
    : pct > 0
      ? <Play className="w-3.5 h-3.5 fill-current" />
      : isScheduledLive
        ? <Clock className="w-3.5 h-3.5" />
        : <PlayCircle className="w-3.5 h-3.5" />;
  const actionColor = isDone
    ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
    : pct > 0
      ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/30"
      : isScheduledLive
        ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 cursor-not-allowed"
        : "bg-slate-900 text-white border-slate-900 hover:bg-indigo-600 hover:border-indigo-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4) }}
      className={cn(
        "bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-100/80 shadow-sm",
        "hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5",
        "transition-all duration-300 overflow-hidden group",
        !isClickable && "opacity-50"
      )}
    >
      <div className="relative h-44 overflow-hidden bg-slate-50">
        {thumb && !imgErr ? (
          <img src={thumb} alt={lecture.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
            <Video className="w-10 h-10 text-indigo-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
            </span>
          )}
          {isScheduledLive && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm">
              <Clock className="w-2.5 h-2.5" /> Scheduled
            </span>
          )}
          {isDone && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold uppercase">
              <CheckCircle2 className="w-2.5 h-2.5" /> Done
            </span>
          )}
          {!isLive && !isDone && pct > 0 && (
            <span className="px-2 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold uppercase">
              {Math.round(pct)}%
            </span>
          )}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onBookmark(lecture.id); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          {bookmarked
            ? <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
            : <Bookmark className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          }
        </button>

        {lecture.videoDurationSeconds && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <Clock className="w-2.5 h-2.5 text-white/80" />
            <span className="text-[9px] font-bold text-white">{fmtDuration(lecture.videoDurationSeconds)}</span>
          </div>
        )}

        {pct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div className="h-full bg-indigo-400 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        )}
      </div>

      <div className="p-4">
        {lecture.topic && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full mb-2">
            <BookOpen className="w-2.5 h-2.5" /> {lecture.topic.name}
          </span>
        )}
        <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors">
          {lecture.title}
        </h4>
        {aiSummary && (
          <div className="flex items-start gap-1.5 mb-3">
            <Sparkles className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{aiSummary}</p>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <button
            onClick={() => !isScheduledLive && isClickable && onWatch(lecture.id)}
            disabled={!isClickable || isScheduledLive}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all",
              actionColor
            )}
          >
            {actionIcon} {actionLabel}
          </button>
          <button
            onClick={() => !isScheduledLive && isClickable && onWatch(lecture.id)}
            disabled={isScheduledLive}
            className={cn(
              "w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 transition-all",
              isScheduledLive ? "opacity-40 cursor-not-allowed" : "hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
            )}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center shadow-sm">
          <Video className="w-9 h-9 text-indigo-300" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">No lectures found</h3>
        <p className="text-sm text-slate-400 max-w-xs">Try adjusting your filters or explore available courses.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <button onClick={() => navigate("/student/courses")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/30">
          <BookOpen className="w-4 h-4" /> Browse Courses
        </button>
        <button onClick={() => navigate("/student/learn")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-colors">
          <Brain className="w-4 h-4" /> Revise Last Lecture
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentLecturesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lectureType, setLectureType] = useState<LectureType>("all");
  const [subject, setSubject]         = useState<string>("all");
  const [status, setStatus]           = useState<StatusKey>("all");
  const [search, setSearch]           = useState("");
  const [bookmarks, setBookmarks]     = useState<Set<string>>(loadBookmarks);

  const { data: lectures, isLoading } = useAllBatchLectures();
  const enrolledSubjectNames = useAllEnrolledSubjectNames();
  const all = useMemo(() => lectures ?? [], [lectures]);

  const subjectOptions = useMemo(() => buildSubjectOptions(all, enrolledSubjectNames), [all, enrolledSubjectNames]);

  useEffect(() => {
    const q = searchParams.get("subject");
    if (!q) return;
    setSubject(decodeURIComponent(q).toLowerCase());
  }, [searchParams]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveBookmarks(next);
      return next;
    });
  }, []);

  const handleWatch = useCallback((id: string) => {
    const lec = all.find(l => l.id === id);
    if (lec?.type === "live" && (lec.status === "live" || lec.status === "scheduled")) {
      navigate(`/live/${id}`);
    } else {
      navigate(`/student/lectures/${id}`);
    }
  }, [all, navigate]);

  const filtered = useMemo(() => {
    let list = all;

    // Lecture type filter
    if (lectureType === "live")
      list = list.filter(l => l.status === "live" || l.type === "live");
    if (lectureType === "recorded")
      list = list.filter(l => l.type !== "live" && l.status !== "live");

    // Subject filter (key is lowercased name from API or legacy slug)
    if (subject !== "all") {
      list = list.filter(l => {
        const subjectName = (l.topic?.chapter?.subject?.name ?? "").toLowerCase();
        const fallback = `${l.title} ${l.description ?? ""}`.toLowerCase();
        return subjectName === subject || subjectName.includes(subject) || fallback.includes(subject);
      });
    }

    // Status filter
    if (status === "watched")     list = list.filter(l => l.studentProgress?.isCompleted);
    if (status === "unwatched")   list = list.filter(l => !(l.studentProgress?.watchPercentage ?? 0));
    if (status === "in_progress") list = list.filter(l => {
      const p = l.studentProgress?.watchPercentage ?? 0;
      return p > 0 && !l.studentProgress?.isCompleted;
    });

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => l.title.toLowerCase().includes(q) || l.topic?.name?.toLowerCase().includes(q));
    }

    // Sort: live first, then in-progress, then unstarted, then completed
    return list.sort((a, b) => {
      const score = (l: StudentLecture) => {
        if (l.status === "live") return 0;
        const p = l.studentProgress?.watchPercentage ?? 0;
        if (p > 0 && !l.studentProgress?.isCompleted) return 1;
        if (p === 0) return 2;
        return 3;
      };
      return score(a) - score(b);
    });
  }, [all, lectureType, subject, status, search, bookmarks]);

  const liveLectures = useMemo(() => all.filter(l => l.status === "live"), [all]);

  return (
    <div className="min-h-screen pb-24 relative">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      <div className="relative max-w-[1600px] mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Lectures Hub</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-none">Lectures</h1>
            <p className="text-sm text-slate-400 mt-1">AI-powered learning sessions</p>
          </div>

          {liveLectures.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={() => liveLectures[0] && handleWatch(liveLectures[0].id)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              {liveLectures.length} Live Now
            </motion.button>
          )}
        </motion.div>

        {/* ── Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative group"
        >
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 opacity-0 group-focus-within:opacity-100 transition-opacity blur-[2px]" />
          <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm group-focus-within:border-transparent transition-colors overflow-hidden">
            <div className="pl-5 pr-2 shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search lectures by title or topic..."
              className="flex-1 py-4 pr-4 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="mr-4 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Filter Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-2 flex-wrap"
        >
          {/* Subject dropdown (built from your enrolled lectures) */}
          <FilterDropdown
            value={subject}
            options={subjectOptions}
            onChange={v => {
              setSubject(v);
              const next = new URLSearchParams(searchParams);
              if (v === "all") next.delete("subject");
              else next.set("subject", v);
              setSearchParams(next, { replace: true });
            }}
            active={subject !== "all"}
          />

          {/* Progress dropdown */}
          <FilterDropdown
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
            active={status !== "all"}
          />

          <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />

          {/* Live Lectures button */}
          <button
            onClick={() => setLectureType(v => v === "live" ? "all" : "live")}
            className={cn(
              "flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all shadow-sm whitespace-nowrap",
              lectureType === "live"
                ? "bg-red-500 text-white border-red-500 shadow-red-500/20"
                : "bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600"
            )}
          >
            <Radio className={cn("w-3.5 h-3.5", lectureType === "live" && "animate-pulse")} />
            Live Lectures
            {liveLectures.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                lectureType === "live" ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
              )}>
                {liveLectures.length}
              </span>
            )}
          </button>

          {/* Recorded Lectures button */}
          <button
            onClick={() => setLectureType(v => v === "recorded" ? "all" : "recorded")}
            className={cn(
              "flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-semibold transition-all shadow-sm whitespace-nowrap",
              lectureType === "recorded"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
            )}
          >
            <Video className="w-3.5 h-3.5" />
            Recorded
          </button>
        </motion.div>

        {/* ── Content ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

          {/* Lecture Feed */}
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-xs text-slate-400 font-medium">Loading your lectures…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <EmptyState />
                  ) : (
                    filtered.map((lec, i) => (
                      <motion.div key={lec.id} layout exit={{ opacity: 0, scale: 0.95 }}>
                        <LectureCard
                          lecture={lec}
                          bookmarked={bookmarks.has(lec.id)}
                          onBookmark={toggleBookmark}
                          onWatch={handleWatch}
                          index={i}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* AI Insights Sidebar */}
          {!isLoading && (
            <div className="xl:block hidden">
              <InsightPanel lectures={all} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
