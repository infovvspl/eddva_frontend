import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle, SkipForward, Play, BookOpen, Swords,
  MessageSquare, Brain, Loader2, RefreshCw, ChevronLeft,
  ChevronRight, Clock, Zap, Calendar,
} from "lucide-react";
import {
  useTodaysPlan, useWeeklyPlan, useCompletePlanItem,
  useSkipPlanItem, useRegeneratePlan,
} from "@/hooks/use-student";
import { StudyPlanItem, PlanItemType } from "@/lib/api/student";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeConfig: Record<PlanItemType, { icon: React.ReactNode; color: string; bg: string; xp: number }> = {
  lecture:       { icon: <Play className="w-4 h-4" />,        color: "text-blue-400",   bg: "bg-blue-500/10",   xp: 10 },
  practice:      { icon: <Brain className="w-4 h-4" />,       color: "text-violet-400", bg: "bg-violet-500/10", xp: 5  },
  mock_test:     { icon: <BookOpen className="w-4 h-4" />,    color: "text-amber-400",  bg: "bg-amber-500/10",  xp: 15 },
  battle:        { icon: <Swords className="w-4 h-4" />,      color: "text-red-400",    bg: "bg-red-500/10",    xp: 20 },
  revision:      { icon: <RefreshCw className="w-4 h-4" />,   color: "text-teal-400",   bg: "bg-teal-500/10",   xp: 5  },
  doubt_session: { icon: <MessageSquare className="w-4 h-4" />,color: "text-pink-400",  bg: "bg-pink-500/10",   xp: 5  },
};

function validId(id: string | null | undefined): string | null {
  if (!id || id === "null" || id === "undefined") return null;
  return id;
}

const typeNav: Record<PlanItemType, (refId: string | null | undefined) => string> = {
  lecture:       (id) => validId(id) ? `/student/lectures/${validId(id)}` : `/student/learn`,
  practice:      (id) => validId(id) ? `/student/learn/topic/${validId(id)}` : `/student/learn`,
  mock_test:     (id) => validId(id) ? `/student/quiz?mockTestId=${validId(id)}` : `/student/learn`,
  battle:        ()   => `/student/battle`,
  revision:      (id) => validId(id) ? `/student/learn/topic/${validId(id)}` : `/student/learn`,
  doubt_session: ()   => `/student/doubts`,
};

function getWeekDates(offset = 0) {
  const today = new Date();
  today.setDate(today.getDate() + offset * 7);
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end:   sunday.toISOString().split("T")[0],
    label: `${monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
  };
}

// ─── Plan Item Card ───────────────────────────────────────────────────────────

function PlanItemCard({ item }: { item: StudyPlanItem }) {
  const navigate    = useNavigate();
  const complete    = useCompletePlanItem();
  const skip        = useSkipPlanItem();
  const cfg         = typeConfig[item.type];
  const isDone      = item.status === "completed";
  const isSkipped   = item.status === "skipped";

  const handleComplete = () => {
    complete.mutate(item.id, {
      onSuccess: () => toast.success(`+${cfg.xp} XP earned! ✨`),
      onError:   () => toast.error("Failed to update"),
    });
  };

  const handleSkip = () => {
    skip.mutate(item.id, {
      onSuccess: () => toast.info("Rescheduled to tomorrow"),
      onError:   () => toast.error("Failed to skip"),
    });
  };

  const handleOpen = () => navigate(typeNav[item.type](item.refId));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-2xl p-4 flex items-center gap-3 transition-opacity
        ${isDone || isSkipped ? "opacity-60" : ""}`}
    >
      {/* Type icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <span className={cfg.color}>{cfg.icon}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-medium ${cfg.color}`}>
            {item.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />{item.estimatedMinutes}m
          </span>
          {!isDone && !isSkipped && (
            <span className="text-xs text-amber-400 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />+{cfg.xp} XP
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {isDone ? (
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : isSkipped ? (
        <span className="text-xs text-muted-foreground shrink-0">Rescheduled</span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleSkip} disabled={skip.isPending}
            className="p-1.5 rounded-lg bg-secondary/40 hover:bg-secondary/80 transition-colors">
            <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleComplete} disabled={complete.isPending}
            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
            {complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button onClick={handleOpen}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
            Start
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Weekly View ──────────────────────────────────────────────────────────────

function WeeklyView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { start, end, label } = getWeekDates(weekOffset);
  const { data: items, isLoading } = useWeeklyPlan(start, end);

  const grouped = useMemo(() => {
    const m: Record<string, StudyPlanItem[]> = {};
    (items ?? []).forEach(item => {
      const d = item.scheduledDate?.split("T")[0] ?? start;
      if (!m[d]) m[d] = [];
      m[d].push(item);
    });
    return m;
  }, [items, start]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset(v => v - 1)}
          className="p-2 rounded-xl bg-card border border-border hover:bg-secondary/40 transition-colors">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{label}</p>
          {weekOffset === 0 && <p className="text-xs text-primary">This week</p>}
        </div>
        <button onClick={() => setWeekOffset(v => v + 1)}
          className="p-2 rounded-xl bg-card border border-border hover:bg-secondary/40 transition-colors">
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No tasks scheduled this week</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).sort().map(([date, dayItems]) => {
            const isToday = date === today;
            const d = new Date(date);
            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <p className={`text-sm font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                    {isToday ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <span className="text-xs text-muted-foreground">{dayItems.length} tasks</span>
                </div>
                <div className="space-y-2">
                  {dayItems.map(item => <PlanItemCard key={item.id} item={item} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentStudyPlanPage() {
  const [tab, setTab] = useState<"today" | "week">("today");
  const { data: todayItems, isLoading } = useTodaysPlan();
  const regenerate = useRegeneratePlan();

  const completed  = todayItems?.filter(i => i.status === "completed").length ?? 0;
  const total      = todayItems?.length ?? 0;
  const pct        = total > 0 ? (completed / total) * 100 : 0;
  const totalXP    = todayItems?.filter(i => i.status !== "skipped")
    .reduce((sum, i) => sum + (typeConfig[i.type]?.xp ?? 5), 0) ?? 0;

  const handleRegenerate = () => {
    regenerate.mutate(undefined, {
      onSuccess: () => toast.success("📅 Your plan has been updated by AI"),
      onError:   () => toast.error("Failed to regenerate plan"),
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Plan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI-generated daily tasks</p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerate.isPending}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors disabled:opacity-50"
        >
          {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate
        </button>
      </div>

      {/* Progress ring + stats */}
      {tab === "today" && total > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 flex items-center gap-5">
          {/* Circle */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#6366f1" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">{Math.round(pct)}%</span>
            </div>
          </div>
          {/* Stats */}
          <div className="flex-1">
            <p className="font-bold text-foreground">Today's Progress</p>
            <p className="text-sm text-muted-foreground mt-0.5">{completed} of {total} tasks done</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />{totalXP} XP available
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["today", "week"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${tab === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {t === "today" ? "Today" : "This Week"}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "today" ? (
        isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : todayItems?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Brain className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-foreground">No plan for today</p>
            <p className="text-sm mt-1">Click Regenerate to have AI create your plan</p>
            <button onClick={handleRegenerate} disabled={regenerate.isPending}
              className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto">
              {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Generate Plan
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayItems.map(item => <PlanItemCard key={item.id} item={item} />)}
          </div>
        )
      ) : (
        <WeeklyView />
      )}
    </div>
  );
}