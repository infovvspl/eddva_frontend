import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, Sparkles, Trophy, Target, Zap,
  RefreshCw, Loader2, Play, SkipForward, CheckCircle,
  BookOpen, Brain, Swords, MessageSquare, Flame, Calendar,
  ChevronRight, X, Atom, FlaskConical, Calculator, Dna,
  BarChart3, ArrowRight, Lock, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useTodaysPlan, useWeeklyPlanGrouped, useCompletePlanItem,
  useSkipPlanItem, useRegeneratePlan, useStudentMe, useGeneratePlan,
} from "@/hooks/use-student";
import type { StudyPlanItem } from "@/lib/api/student";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYoutubeEmbed(url?: string | null): string | null {
  if (!url) return null;
  const raw = String(url).trim();
  const id =
    raw.match(/[?&]v=([^&]+)/)?.[1] ||
    raw.match(/youtu\.be\/([^?&/]+)/)?.[1] ||
    raw.match(/youtube\.com\/embed\/([^?&/]+)/)?.[1] ||
    raw.match(/youtube\.com\/shorts\/([^?&/]+)/)?.[1] ||
    raw.match(/youtube\.com\/live\/([^?&/]+)/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1` : null;
}

function daysUntilExam(examYear?: number): number | null {
  if (!examYear) return null;
  const target = new Date(`${examYear}-04-01`);
  const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
  return diff > 0 ? diff : null;
}

function fmtExam(target?: string) {
  const map: Record<string, string> = {
    jee: "JEE Main & Advanced",
    neet: "NEET UG",
    cbse_10: "CBSE Class 10",
    cbse_12: "CBSE Class 12",
  };
  return map[target ?? ""] ?? "Your Exam";
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<StudyPlanItem["type"], { icon: any; color: string; bg: string; label: string; xp: number }> = {
  lecture:       { icon: Play,         color: "#4f46e5", bg: "#e0e7ff", label: "Lecture",       xp: 15 },
  practice:      { icon: Target,       color: "#10b981", bg: "#d1fae5", label: "Practice",      xp: 15 },
  revision:      { icon: BookOpen,     color: "#f59e0b", bg: "#fef3c7", label: "Notes / Video", xp: 5  },
  mock_test:     { icon: Trophy,       color: "#ec4899", bg: "#fce7f3", label: "Mock Test",     xp: 50 },
  battle:        { icon: Swords,       color: "#ef4444", bg: "#fee2e2", label: "Battle",        xp: 30 },
  doubt_session: { icon: MessageSquare,color: "#8b5cf6", bg: "#ede9fe", label: "Doubt Session", xp: 10 },
};

const SUBJECT_CFG: Record<string, { color: string; lightBg: string; dot: string; Icon: any }> = {
  physics:     { color: "text-indigo-700", lightBg: "bg-indigo-50",  dot: "bg-indigo-500",  Icon: Atom       },
  chemistry:   { color: "text-emerald-700",lightBg: "bg-emerald-50", dot: "bg-emerald-500", Icon: FlaskConical},
  mathematics: { color: "text-violet-700", lightBg: "bg-violet-50",  dot: "bg-violet-500",  Icon: Calculator },
  math:        { color: "text-violet-700", lightBg: "bg-violet-50",  dot: "bg-violet-500",  Icon: Calculator },
  biology:     { color: "text-teal-700",   lightBg: "bg-teal-50",    dot: "bg-teal-500",    Icon: Dna        },
  default:     { color: "text-slate-700",  lightBg: "bg-slate-50",   dot: "bg-slate-400",   Icon: Brain      },
};

function getSubjectCfg(name: string) {
  const key = name.toLowerCase().trim();
  return SUBJECT_CFG[key] ?? SUBJECT_CFG.default;
}

const EXAM_OPTS = [
  { key: "jee",     label: "JEE",     sub: "Main & Advanced", from: "from-orange-500", to: "to-amber-400",   Icon: Atom       },
  { key: "neet",    label: "NEET",    sub: "UG",              from: "from-emerald-500",to: "to-teal-400",    Icon: Dna        },
  { key: "cbse_10", label: "CBSE 10", sub: "Class 10",        from: "from-blue-500",   to: "to-indigo-400",  Icon: BookOpen   },
  { key: "cbse_12", label: "CBSE 12", sub: "Class 12",        from: "from-violet-500", to: "to-purple-400",  Icon: Calculator },
];

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

function SetupWizard({ examTarget, examYear, dailyHours, onGenerate, isGenerating }: {
  examTarget?: string; examYear?: number; dailyHours?: number;
  onGenerate: () => void; isGenerating: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Your AI Study Plan</h1>
        <p className="text-slate-500 text-sm font-medium">
          A 30-day personalized schedule crafted around your exam target, weak areas, and daily availability.
        </p>
      </motion.div>

      {/* Exam summary card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5"
      >
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Your profile</h2>

        <div className="grid grid-cols-2 gap-3">
          {EXAM_OPTS.map(opt => (
            <div key={opt.key}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all",
                opt.key === examTarget
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-100 bg-slate-50 opacity-50"
              )}
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shrink-0", opt.from, opt.to)}>
                <opt.Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">{opt.label}</p>
                <p className="text-[10px] text-slate-500">{opt.sub}</p>
              </div>
              {opt.key === examTarget && <CheckCircle2 className="w-4 h-4 text-indigo-500 ml-auto shrink-0" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Target Year</p>
            <p className="text-lg font-black text-slate-800">{examYear ?? "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Daily Hours</p>
            <p className="text-lg font-black text-slate-800">{dailyHours ?? 4} hrs</p>
          </div>
        </div>
      </motion.div>

      {/* What you'll get */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="w-full grid grid-cols-3 gap-3 text-center"
      >
        {[
          { icon: Calendar, label: "30-Day Plan", sub: "Day-by-day tasks" },
          { icon: Brain,    label: "AI Adaptive", sub: "Based on weak areas" },
          { icon: Flame,    label: "Streak Goals", sub: "Daily consistency" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xs font-black text-slate-800">{label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full max-w-sm h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-base flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isGenerating
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating…</>
          : <><Sparkles className="w-5 h-5" /> Generate My 30-Day Plan</>}
      </motion.button>

      <p className="text-xs text-slate-400 text-center -mt-4">
        Your plan updates automatically as you complete tasks and take tests.
      </p>
    </div>
  );
}

// ─── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 64, stroke = 6 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="currentColor" strokeWidth={stroke} className="text-white/20" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="currentColor" strokeWidth={stroke}
        strokeLinecap="round" className="text-white"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ item, onOpenVideo }: { item: StudyPlanItem; onOpenVideo: (url: string, title: string) => void }) {
  const navigate = useNavigate();
  const complete = useCompletePlanItem();
  const skip     = useSkipPlanItem();
  const cfg    = TYPE_CFG[item.type] ?? TYPE_CFG.lecture;
  const isDone = item.status === "completed";
  const isSkip = item.status === "skipped";
  const mins   = (item as any).estimatedMinutes ?? 15;

  const handleStart = () => {
    if (isDone || isSkip) return;
    const kind    = item.content?.taskKind;
    const topicId = item.content?.topicId || item.refId;
    if (kind === "youtube_video") {
      const embed = toYoutubeEmbed(item.content?.videoUrl);
      return embed
        ? onOpenVideo(embed, item.content?.videoTitle || item.title)
        : toast.error("No YouTube video found for this topic yet.");
    }
    if (kind === "ai_notes" && topicId) return void navigate(`/student/ai-study/${topicId}`);
    if (item.type === "lecture" && item.refId) return void navigate(`/student/lectures/${item.refId}`);
    if (item.type === "revision" && topicId) return void navigate(`/student/ai-study/${topicId}`);
    if (topicId) return void navigate(`/student/quiz?topicId=${topicId}`);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl bg-white border transition-all duration-200 group",
        isDone ? "border-emerald-100 opacity-70" : isSkip ? "border-slate-100 opacity-50" : "border-slate-100 hover:border-indigo-200 hover:shadow-sm hover:shadow-indigo-500/5"
      )}
    >
      {/* Type icon */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        style={(!isDone && !isSkip) ? { background: cfg.bg, color: cfg.color } : undefined}
        {...(isDone ? { className: "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100" } : {})}
        {...(isSkip ? { className: "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-slate-100" } : {})}
      >
        {isDone
          ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          : isSkip
            ? <SkipForward className="w-5 h-5 text-slate-400" />
            : <cfg.icon className="w-5 h-5" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{cfg.label}</span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">+{cfg.xp} XP</span>
        </div>
        <p className={cn("text-sm font-bold text-slate-800 truncate leading-snug", (isDone || isSkip) && "line-through text-slate-400")}>
          {item.title}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
            <Clock className="w-3 h-3" />{mins} min
          </span>
          {item.content?.chapterName && (
            <span className="text-[11px] text-slate-400 font-semibold truncate max-w-[120px]">{item.content.chapterName}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1.5">
        {isDone ? (
          <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </span>
        ) : isSkip ? (
          <span className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold">Skipped</span>
        ) : (
          <>
            <button onClick={() => skip.mutate(item.id)} title="Skip"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-all"
            ><SkipForward className="w-4 h-4" /></button>
            <button onClick={() => complete.mutate(item.id)} title="Mark done"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 transition-all"
            ><CheckCircle className="w-4 h-4" /></button>
            <button onClick={handleStart}
              className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-indigo-600 transition-all shadow-sm"
            ><Play className="w-3.5 h-3.5 fill-current" /> Start</button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Subject Section ───────────────────────────────────────────────────────────

function SubjectSection({ subject, items, onOpenVideo }: {
  subject: string; items: StudyPlanItem[];
  onOpenVideo: (url: string, title: string) => void;
}) {
  const cfg      = getSubjectCfg(subject);
  const done     = items.filter(i => i.status === "completed").length;
  const pct      = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
  const totalMin = items.reduce((s, i) => s + ((i as any).estimatedMinutes ?? 15), 0);

  return (
    <div className="mb-8">
      {/* Subject header */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", cfg.lightBg)}>
          <cfg.Icon className={cn("w-4 h-4", cfg.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={cn("text-sm font-black uppercase tracking-wide", cfg.color)}>{subject}</h3>
            <span className="text-[10px] font-bold text-slate-400">{done}/{items.length} done</span>
          </div>
          <div className="w-32 h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
            <motion.div className={cn("h-full rounded-full", cfg.dot)}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
          <Clock className="w-3 h-3" />{totalMin} min
        </span>
      </div>

      <div className="space-y-2">
        {items.map(item => <TaskCard key={item.id} item={item} onOpenVideo={onOpenVideo} />)}
      </div>
    </div>
  );
}

// ─── Week Strip ────────────────────────────────────────────────────────────────

function WeekStrip({
  weekDates, weekMap, selectedDay, onSelect,
}: {
  weekDates: { start: string; end: string };
  weekMap: Record<string, StudyPlanItem[]> | undefined;
  selectedDay: string; onSelect: (d: string) => void;
}) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((label, i) => {
        const d = new Date(weekDates.start);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split("T")[0];
        const tasks = weekMap?.[key] ?? [];
        const done  = tasks.filter(t => t.status === "completed").length;
        const isPast = key < today;
        const isToday = key === today;
        const isSel = key === selectedDay;
        const allDone = tasks.length > 0 && done === tasks.length;
        const missed  = isPast && tasks.length > 0 && done < tasks.length;

        return (
          <button key={key} onClick={() => onSelect(key)}
            className={cn(
              "flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border transition-all min-w-[68px]",
              isSel
                ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/20"
                : isToday
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-white border-slate-100 hover:border-indigo-200"
            )}
          >
            <span className={cn("text-[10px] font-black uppercase tracking-wider",
              isSel ? "text-indigo-200" : isToday ? "text-indigo-600" : "text-slate-400")}>{label}</span>
            <span className={cn("text-base font-black",
              isSel ? "text-white" : isToday ? "text-indigo-700" : "text-slate-700")}>{d.getDate()}</span>
            {tasks.length > 0 ? (
              <div className={cn("w-6 h-1.5 rounded-full",
                allDone ? "bg-emerald-400" : missed ? "bg-rose-300" : isSel ? "bg-white/40" : "bg-indigo-200")} />
            ) : (
              <div className="w-6 h-1.5 rounded-full bg-slate-100" />
            )}
            <span className={cn("text-[9px] font-bold",
              isSel ? "text-indigo-200" : "text-slate-400")}>{tasks.length > 0 ? `${done}/${tasks.length}` : "—"}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Time Distribution Bar ─────────────────────────────────────────────────────

function TimeDistributionBar({ items }: { items: StudyPlanItem[] }) {
  const map: Record<string, number> = {};
  items.forEach(i => {
    const sub = i.content?.subjectName ?? "General";
    map[sub] = (map[sub] ?? 0) + ((i as any).estimatedMinutes ?? 15);
  });
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  if (!total) return null;

  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const colors = ["bg-indigo-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-teal-500", "bg-rose-500"];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <BarChart3 className="w-3.5 h-3.5" /> Study Time Distribution
      </h3>
      <div className="flex rounded-xl overflow-hidden h-3 mb-3 gap-0.5">
        {entries.map(([sub, mins], i) => (
          <div key={sub} title={`${sub}: ${mins} min`}
            className={cn("h-full transition-all", colors[i % colors.length])}
            style={{ width: `${(mins / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {entries.map(([sub, mins], i) => (
          <div key={sub} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", colors[i % colors.length])} />
            <span className="text-[11px] text-slate-600 font-semibold">{sub}</span>
            <span className="text-[11px] text-slate-400">{mins}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentStudyPlanPage() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: todayItems = [], isLoading } = useTodaysPlan();
  const generate    = useGeneratePlan();
  const regenerate  = useRegeneratePlan();

  const [tab, setTab]               = useState<"today" | "week">("today");
  const [videoPlayer, setVideoPlayer] = useState<{ url: string; title: string } | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(() => new Date().toISOString().split("T")[0]);

  // Week date range (Mon–Sun of current week)
  const weekDates = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { start: fmt(monday), end: fmt(sunday) };
  }, []);
  const { data: weekMap } = useWeeklyPlanGrouped(weekDates.start, weekDates.end);

  // Stats
  const stats = useMemo(() => {
    const total     = todayItems.length;
    const completed = todayItems.filter(i => i.status === "completed").length;
    const skipped   = todayItems.filter(i => i.status === "skipped").length;
    const pending   = total - completed - skipped;
    const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalMins = todayItems.reduce((s, i) => s + ((i as any).estimatedMinutes ?? 15), 0);
    const xpPending = todayItems
      .filter(i => i.status === "pending")
      .reduce((s, i) => s + (TYPE_CFG[i.type]?.xp ?? 5), 0);
    return { total, completed, skipped, pending, pct, totalMins, xpPending };
  }, [todayItems]);

  // Subject groups for today
  const subjectGroups = useMemo(() => {
    const map: Record<string, StudyPlanItem[]> = {};
    todayItems.forEach(i => {
      const sub = i.content?.subjectName ?? "General";
      if (!map[sub]) map[sub] = [];
      map[sub].push(i);
    });
    return map;
  }, [todayItems]);

  // Tomorrow's tasks
  const tomorrowItems = useMemo(() => {
    const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
    return weekMap?.[tmrw.toISOString().split("T")[0]] ?? [];
  }, [weekMap]);

  // Day items for week tab
  const dayItems = useMemo(() => weekMap?.[selectedDay] ?? [], [weekMap, selectedDay]);

  const student      = me?.student;
  const dayCountdown = daysUntilExam(student?.examYear);

  // ── Handle generate ──────────────────────────────────────────────────────────
  const handleGenerate = () => {
    generate.mutate(undefined, {
      onSuccess: () => toast.success("Your 30-day plan is ready! 🎉"),
      onError:   () => toast.error("Could not generate plan right now. Please try again."),
    });
  };
  const handleRegenerate = () => {
    regenerate.mutate(undefined, {
      onSuccess: () => toast.success("Plan refreshed with latest AI insights."),
      onError:   () => toast.error("Could not regenerate plan. Please try again."),
    });
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold text-slate-400">Loading your plan…</p>
      </div>
    );
  }

  // ── No plan → Setup Wizard ────────────────────────────────────────────────────
  if (todayItems.length === 0 && !generate.isPending) {
    return (
      <SetupWizard
        examTarget={student?.examTarget}
        examYear={student?.examYear}
        dailyHours={student?.dailyStudyHours}
        onGenerate={handleGenerate}
        isGenerating={generate.isPending}
      />
    );
  }

  // ── Generating state ──────────────────────────────────────────────────────────
  if (generate.isPending || regenerate.isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-slate-800 mb-1">AI is crafting your plan…</h2>
          <p className="text-sm text-slate-400 font-medium">Analysing your weak areas & exam schedule</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-500"
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Main plan view ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto pb-24">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl mx-4 mt-4 p-6 md:p-8 mb-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-8 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          {/* Left: greeting + exam */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              {dayCountdown && (
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-black">
                  {dayCountdown}d to exam
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">
              {me?.fullName ? `Hey, ${me.fullName.split(" ")[0]} 👋` : "Today's Focus 🚀"}
            </h1>
            <p className="text-indigo-200 text-sm font-semibold">
              {fmtExam(student?.examTarget)}
              {student?.examYear ? ` • ${student.examYear}` : ""}
            </p>
          </div>

          {/* Center: progress ring */}
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center">
              <ProgressRing pct={stats.pct} size={80} stroke={7} />
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-white">{stats.pct}%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white text-sm font-bold">{stats.completed} done</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <span className="text-indigo-200 text-sm font-semibold">{stats.pending} pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-200 text-sm font-semibold">+{stats.xpPending} XP left</span>
              </div>
            </div>
          </div>

          {/* Right: streak + time */}
          <div className="flex gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center min-w-[72px]">
              <p className="text-2xl font-black text-white leading-none">{student?.streakDays ?? 0}</p>
              <p className="text-[10px] text-orange-300 font-black uppercase mt-0.5 flex items-center justify-center gap-0.5">
                <Flame className="w-3 h-3" /> Streak
              </p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center min-w-[72px]">
              <p className="text-2xl font-black text-white leading-none">{stats.totalMins}</p>
              <p className="text-[10px] text-indigo-200 font-black uppercase mt-0.5">min</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-4 mb-6">
        <div className="inline-flex bg-white border border-slate-100 rounded-2xl p-1 shadow-sm gap-1">
          {(["today", "week"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-black transition-all",
                tab === t
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {t === "today" ? "Today" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column */}
        <div className="lg:col-span-8">

          {/* TODAY TAB */}
          {tab === "today" && (
            <>
              <TimeDistributionBar items={todayItems} />

              {Object.keys(subjectGroups).length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-black text-slate-700 mb-1">All done for today!</h3>
                  <p className="text-sm text-slate-400">Your dedication is paying off. Come back tomorrow.</p>
                </div>
              ) : (
                Object.entries(subjectGroups).map(([sub, items]) => (
                  <SubjectSection key={sub} subject={sub} items={items} onOpenVideo={(u, t) => setVideoPlayer({ url: u, title: t })} />
                ))
              )}
            </>
          )}

          {/* WEEK TAB */}
          {tab === "week" && (
            <>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Weekly Overview
                </h3>
                <WeekStrip
                  weekDates={weekDates} weekMap={weekMap}
                  selectedDay={selectedDay} onSelect={setSelectedDay}
                />
              </div>

              {dayItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                  <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-black text-slate-500 mb-1">No tasks for this day</h3>
                  <p className="text-sm text-slate-400">Rest day or tasks haven't been scheduled yet.</p>
                </div>
              ) : (
                (() => {
                  const dayGroups: Record<string, StudyPlanItem[]> = {};
                  dayItems.forEach(i => {
                    const sub = i.content?.subjectName ?? "General";
                    if (!dayGroups[sub]) dayGroups[sub] = [];
                    dayGroups[sub].push(i);
                  });
                  return (
                    <>
                      <TimeDistributionBar items={dayItems} />
                      {Object.entries(dayGroups).map(([sub, items]) => (
                        <SubjectSection key={sub} subject={sub} items={items} onOpenVideo={(u, t) => setVideoPlayer({ url: u, title: t })} />
                      ))}
                    </>
                  );
                })()
              )}
            </>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 space-y-4">

          {/* AI Regenerate */}
          <div className="p-[2px] rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-500 to-pink-500 shadow-md">
            <div className="bg-white rounded-[14px] p-5 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-black text-slate-800 mb-1">AI Smart Plan</h3>
              <p className="text-xs text-slate-400 font-medium mb-4 leading-relaxed">
                Re-generates based on your latest test results and weak areas.
              </p>
              <button onClick={handleRegenerate} disabled={regenerate.isPending}
                className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-black flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {regenerate.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating…</>
                  : <><RefreshCw className="w-4 h-4" /> Regenerate Plan</>}
              </button>
            </div>
          </div>

          {/* Streak card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-50 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-orange-400 to-red-500 flex items-center justify-center shadow-sm">
                <Flame className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Day Streak</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{student?.streakDays ?? 0}</p>
              </div>
            </div>
            <div className="flex gap-1 mb-3 relative z-10">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className={cn("flex-1 h-2 rounded-full",
                  i < (student?.streakDays ?? 0) % 7 ? "bg-orange-400" : "bg-slate-100")}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400 font-medium relative z-10">
              {stats.pending > 0 ? "Complete today's tasks to keep your streak alive!" : "Great! Streak is safe for today ✓"}
            </p>
          </div>

          {/* XP card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Today's Rewards</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: Zap, label: "Task XP available", value: `+${stats.xpPending}`, bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
                { icon: Flame, label: "Streak bonus", value: "+1 day", bg: "bg-orange-50", text: "text-orange-600", iconBg: "bg-orange-100" },
                { icon: Star, label: "Total XP", value: (student?.xpPoints ?? 0).toLocaleString(), bg: "bg-violet-50", text: "text-violet-600", iconBg: "bg-violet-100" },
              ].map(({ icon: Icon, label, value, bg, text, iconBg }) => (
                <div key={label} className={cn("flex items-center justify-between p-3 rounded-xl border border-transparent", bg)}>
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", iconBg)}>
                      <Icon className={cn("w-3.5 h-3.5", text)} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                  </div>
                  <span className={cn("text-sm font-black", text)}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tomorrow preview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tomorrow</h3>
              </div>
              {tomorrowItems.length > 0 && (
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {tomorrowItems.length} tasks
                </span>
              )}
            </div>
            {tomorrowItems.length > 0 ? (
              <div className="space-y-2.5">
                {tomorrowItems.slice(0, 4).map((task, i) => {
                  const cfg = TYPE_CFG[task.type] ?? TYPE_CFG.lecture;
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-slate-100"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <cfg.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{task.title}</p>
                        <p className="text-[10px] text-slate-400">{(task as any).estimatedMinutes ?? 15} min</p>
                      </div>
                    </div>
                  );
                })}
                {tomorrowItems.length > 4 && (
                  <p className="text-center text-xs font-bold text-indigo-500 pt-1">
                    +{tomorrowItems.length - 4} more tasks
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                <Lock className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-400">No tasks yet</p>
              </div>
            )}
          </div>

          {/* Quick navigate */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Practice Tests", icon: Target,   path: "/student/quiz"       },
                { label: "AI Study",        icon: Brain,    path: "/student/learn"      },
                { label: "Battle Arena",    icon: Swords,   path: "/student/battle"     },
                { label: "Doubts",          icon: MessageSquare, path: "/student/doubts" },
              ].map(({ label, icon: Icon, path }) => (
                <button key={label} onClick={() => navigate(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 flex-1">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Video Modal ── */}
      <AnimatePresence>
        {videoPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setVideoPlayer(null)}
          >
            <motion.div initial={{ y: 24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 12, scale: 0.97 }}
              className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
                <p className="text-sm font-bold text-white truncate pr-4">{videoPlayer.title}</p>
                <button onClick={() => setVideoPlayer(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="aspect-video">
                <iframe src={videoPlayer.url} title={videoPlayer.title} className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
