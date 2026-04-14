import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, Sparkles, Trophy, Target, Zap,
  RefreshCw, Loader2, Play, SkipForward, CheckCircle,
  CalendarDays, ListChecks, ChevronRight,
  BookOpen, Brain, BarChart2, Swords, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useTodaysPlan, useWeeklyPlanGrouped, useCompletePlanItem,
  useSkipPlanItem, useRegeneratePlan,
} from "@/hooks/use-student";
import type { StudyPlanItem } from "@/lib/api/student";

// ─── Type Config ───────────────────────────────────────────────────────────────
const typeConfig: Record<StudyPlanItem["type"], {
  icon: any; color: string; bg: string; label: string; xp: number;
}> = {
  lecture: { icon: Play, color: "#6366f1", bg: "#6366f118", label: "Lecture", xp: 15 },
  practice: { icon: Target, color: "#10b981", bg: "#10b98118", label: "Practice", xp: 15 },
  revision: { icon: RefreshCw, color: "#f59e0b", bg: "#f59e0b18", label: "Revision", xp: 5 },
  mock_test: { icon: Trophy, color: "#ec4899", bg: "#ec489918", label: "Mock Test", xp: 50 },
  battle: { icon: Swords, color: "#ef4444", bg: "#ef444418", label: "Battle", xp: 30 },
  doubt_session: { icon: MessageSquare, color: "#8b5cf6", bg: "#8b5cf618", label: "Doubt Session", xp: 10 },
};

const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: "Easy", color: "#10b981", bg: "#10b98115" },
  medium: { label: "Medium", color: "#f59e0b", bg: "#f59e0b15" },
  hard: { label: "Hard", color: "#ef4444", bg: "#ef444415" },
};

// ─── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ item }: { item: StudyPlanItem }) {
  const navigate = useNavigate();
  const complete = useCompletePlanItem();
  const skip = useSkipPlanItem();
  const cfg = typeConfig[item.type] ?? typeConfig.lecture;
  const isDone = item.status === "completed";
  const isSkip = item.status === "skipped";
  const diff = (item as any).difficulty as string | undefined;
  const diffCfg = diff ? difficultyConfig[diff] : null;

  const handleStart = () => {
    if (isDone || isSkip) return;
    if (item.type === "lecture" && item.refId) navigate(`/student/lectures/${item.refId}`);
    else if (item.refId) navigate(`/student/quiz?topicId=${item.refId}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDone || isSkip ? 0.5 : 1, y: 0 }}
      whileHover={!isDone && !isSkip ? { y: -2 } : {}}
      className={cn(
        "group rounded-2xl border transition-all duration-300 overflow-hidden",
        isDone
          ? "border-emerald-500/20 bg-emerald-500/5"
          : isSkip
            ? "border-white/6 bg-white/3"
            : "border-white/10 bg-white/6 hover:border-indigo-500/30 hover:bg-white/8",
      )}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Checkbox / status */}
        <button
          onClick={() => !isDone && !isSkip && complete.mutate(item.id)}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
            isDone
              ? "bg-emerald-500 border-emerald-500"
              : "border-white/20 hover:border-emerald-400",
          )}
        >
          {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              <cfg.icon className="w-2.5 h-2.5" />
              {cfg.label}
            </span>
            {diffCfg && (
              <span
                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ color: diffCfg.color, background: diffCfg.bg }}
              >
                {diffCfg.label}
              </span>
            )}
            {(item as any).topic?.name && (
              <span className="text-[9px] text-white/30 truncate max-w-[120px]">
                {(item as any).topic.name}
              </span>
            )}
          </div>
          <p className={cn(
            "text-sm font-semibold leading-snug",
            isDone ? "text-white/30 line-through" : isSkip ? "text-white/25" : "text-white/90",
          )}>
            {item.title}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-yellow-400/70">
              <Zap className="w-3 h-3" />+{cfg.xp} XP
            </span>
            {(item as any).estimatedMinutes && (
              <span className="flex items-center gap-1 text-[10px] text-white/30">
                <Clock className="w-3 h-3" />{(item as any).estimatedMinutes}m
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isDone && !isSkip && (
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => skip.mutate(item.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/6 transition-all"
              title="Skip"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors"
              style={{ background: cfg.color }}
            >
              Start <ChevronRight className="w-3 h-3" />
            </motion.button>
          </div>
        )}
        {isDone && (
          <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />Done
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Weekly Calendar ───────────────────────────────────────────────────────────
function WeeklyView() {
  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { start: fmt(monday), end: fmt(sunday) };
  }, []);

  const { data: weekMap, isLoading } = useWeeklyPlanGrouped(weekDates.start, weekDates.end);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const entries = useMemo((): [string, import("@/lib/api/student").StudyPlanItem[]][] => {
    if (!weekMap) return [];
    return (Object.entries(weekMap) as [string, import("@/lib/api/student").StudyPlanItem[]][])
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  }, [weekMap]);

  const activeDay = selectedDay ?? entries.find(([d]) => new Date(d).toDateString() === new Date().toDateString())?.[0] ?? entries[0]?.[0];
  const activeTasks: import("@/lib/api/student").StudyPlanItem[] = (weekMap && activeDay ? weekMap[activeDay] : null) ?? [];

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400/40" />
    </div>
  );

  if (!entries.length) return (
    <div className="text-center py-16 text-white/30">
      <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-semibold">No weekly plan yet</p>
      <p className="text-xs mt-1">Generate a plan to see your week</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
      {/* Calendar Strip */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
        {entries.map(([dateStr, items]) => {
          const d = new Date(dateStr);
          const isToday = new Date().toDateString() === d.toDateString();
          const isActive = activeDay === dateStr;
          const doneCount = items.filter(i => i.status === "completed").length;
          const pct = items.length > 0 ? (doneCount / items.length) * 100 : 0;

          return (
            <motion.button
              key={dateStr}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedDay(dateStr)}
              className={cn(
                "flex lg:flex-row items-center gap-3 px-3 py-3 rounded-xl border transition-all shrink-0 lg:shrink text-left",
                isActive
                  ? "bg-indigo-500/20 border-indigo-500/40"
                  : "bg-white/4 border-white/8 hover:bg-white/6",
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-center",
                isToday ? "bg-indigo-500 text-white" : "bg-white/8 text-white/60",
              )}>
                <span className="text-[8px] font-bold uppercase leading-none">{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                <span className="text-sm font-black leading-none mt-0.5">{d.getDate()}</span>
              </div>
              <div className="flex-1 min-w-0 hidden lg:block">
                <p className="text-xs font-semibold text-white/70 truncate">
                  {isToday ? "Today" : d.toLocaleDateString("en-IN", { weekday: "long" })}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-white/30 shrink-0">{doneCount}/{items.length}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Day Tasks */}
      <div>
        {activeTasks.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No tasks for this day</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {activeTasks.map(item => <TaskCard key={item.id} item={item} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentStudyPlanPage() {
  const [tab, setTab] = useState<"today" | "week">("today");
  const { data: todayItems, isLoading } = useTodaysPlan();
  const regenerate = useRegeneratePlan();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const items = todayItems ?? [];
    const total = items.length;
    const completed = items.filter(i => i.status === "completed").length;
    const skipped = items.filter(i => i.status === "skipped").length;
    const pending = total - completed - skipped;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const xpPending = items
      .filter(i => i.status === "pending")
      .reduce((s, i) => s + (typeConfig[i.type]?.xp ?? 5), 0);
    return { total, completed, skipped, pending, pct, xpPending };
  }, [todayItems]);

  const pendingItems = todayItems?.filter(i => i.status === "pending") ?? [];
  const doneItems = todayItems?.filter(i => i.status === "completed") ?? [];
  const skipItems = todayItems?.filter(i => i.status === "skipped") ?? [];

  return (
    <div
      className="min-h-screen text-black"
      >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/6 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/6 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />AI Study Planner
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Study Plan</h1>
          <p className="text-white/40 text-sm">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Today's Tasks", value: stats.total, icon: ListChecks, color: "#6366f1" },
            { label: "Completed",     value: stats.completed, icon: CheckCircle2, color: "#10b981" },
            { label: "Pending",       value: stats.pending, icon: Clock, color: "#f59e0b" },
            { label: "XP Available",  value: `+${stats.xpPending}`, icon: Zap, color: "#fbbf24" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">{s.label}</p>
                <p className="text-lg font-black text-white leading-none">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Progress Bar ── */}
        {stats.total > 0 && (
          <div className="mb-6 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
            <div className="flex justify-between text-xs font-semibold text-white/40 mb-2">
              <span>Today's Progress</span>
              <span className="text-indigo-300 font-bold">{stats.pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                initial={{ width: 0 }}
                animate={{ width: `${stats.pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="text-[10px] text-white/25 mt-1">
              {stats.completed} of {stats.total} tasks done · {stats.skipped} skipped
            </p>
          </div>
        )}

        {/* ── Tab + AI Button ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            {[
              { id: "today", label: "Today", icon: ListChecks },
              { id: "week",  label: "This Week", icon: CalendarDays },
            ].map(t => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setTab(t.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  tab === t.id
                    ? "bg-indigo-500/25 border border-indigo-500/40 text-indigo-300"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => regenerate.mutate(undefined, {
              onSuccess: () => toast.success("Study plan regenerated!"),
              onError: () => toast.error("Failed to regenerate plan"),
            })}
            disabled={regenerate.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/30 text-indigo-300 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
          >
            {regenerate.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />
            }
            AI Generate Plan
          </motion.button>
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {tab === "today" ? (
            <motion.div key="today" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400/40" />
                </div>
              ) : stats.total === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-white/10">
                  <Sparkles className="w-10 h-10 text-indigo-400/40 mx-auto mb-3" />
                  <p className="text-base font-bold text-white/50 mb-1">No study plan yet</p>
                  <p className="text-sm text-white/30 mb-5">Let AI build a personalized plan for you</p>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => regenerate.mutate(undefined, { onSuccess: () => toast.success("Plan generated!") })}
                    disabled={regenerate.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  >
                    {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate My Plan
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
                  {/* Tasks */}
                  <div className="space-y-3">
                    {/* Pending */}
                    {pendingItems.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                          <Clock className="w-3 h-3 text-amber-400" />Pending ({pendingItems.length})
                        </p>
                        <div className="space-y-2">
                          <AnimatePresence>
                            {pendingItems.map(item => <TaskCard key={item.id} item={item} />)}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* Completed */}
                    {doneItems.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />Completed ({doneItems.length})
                        </p>
                        <div className="space-y-2">
                          {doneItems.map(item => <TaskCard key={item.id} item={item} />)}
                        </div>
                      </div>
                    )}

                    {/* Skipped */}
                    {skipItems.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                          <SkipForward className="w-3 h-3 text-white/30" />Skipped ({skipItems.length})
                        </p>
                        <div className="space-y-2">
                          {skipItems.map(item => <TaskCard key={item.id} item={item} />)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <aside className="space-y-4 xl:sticky xl:top-6">
                    {/* XP Summary */}
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <p className="text-xs font-black text-yellow-300 uppercase tracking-widest">Today's XP</p>
                      </div>
                      <p className="text-3xl font-black text-white">+{stats.xpPending}</p>
                      <p className="text-[10px] text-white/30 mt-1">Available from pending tasks</p>
                    </div>

                    {/* Type Breakdown */}
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Task Types</p>
                      <div className="space-y-2">
                        {Object.entries(typeConfig).map(([type, cfg]) => {
                          const count = (todayItems ?? []).filter(i => i.type === type).length;
                          if (!count) return null;
                          return (
                            <div key={type} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: cfg.bg }}>
                                <cfg.icon className="w-3 h-3" style={{ color: cfg.color }} />
                              </div>
                              <p className="text-xs text-white/60 flex-1">{cfg.label}</p>
                              <span className="text-xs font-bold text-white/50">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick links */}
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Quick Access</p>
                      <div className="space-y-2">
                        {[
                          { label: "Leaderboard", icon: Trophy, path: "/student/leaderboard", color: "#f59e0b" },
                          { label: "Lectures", icon: BookOpen, path: "/student/lectures", color: "#6366f1" },
                          { label: "Mock Tests", icon: BarChart2, path: "/student/quiz", color: "#8b5cf6" },
                        ].map((l, i) => (
                          <button
                            key={i}
                            onClick={() => navigate(l.path)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/4 hover:bg-white/8 border border-transparent hover:border-white/10 transition-all text-left"
                          >
                            <l.icon className="w-3.5 h-3.5 shrink-0" style={{ color: l.color }} />
                            <span className="text-xs font-semibold text-white/60">{l.label}</span>
                            <ChevronRight className="w-3 h-3 text-white/20 ml-auto" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="week" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <WeeklyView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
}
