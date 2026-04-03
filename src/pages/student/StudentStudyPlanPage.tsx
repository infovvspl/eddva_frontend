import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle, SkipForward, Play, BookOpen, Swords,
  MessageSquare, Brain, Loader2, RefreshCw, ChevronLeft,
  ChevronRight, Clock, Zap, Calendar, Sparkles,
} from "lucide-react";
import {
  useTodaysPlan, useWeeklyPlan, useCompletePlanItem,
  useSkipPlanItem, useRegeneratePlan,
} from "@/hooks/use-student";
import { StudyPlanItem, PlanItemType } from "@/lib/api/student";
import { toast } from "sonner";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const typeConfig: Record<PlanItemType, { icon: React.ReactNode; color: string; bg: string; xp: number }> = {
  lecture:       { icon: <Play         className="w-4 h-4" />, color: BLUE,       bg: BLUE_L,          xp: 10 },
  practice:      { icon: <Brain        className="w-4 h-4" />, color: "#7c3aed",  bg: "#F5F3FF",       xp: 5  },
  mock_test:     { icon: <BookOpen     className="w-4 h-4" />, color: "#d97706",  bg: "#FFFBEB",       xp: 15 },
  battle:        { icon: <Swords       className="w-4 h-4" />, color: "#ef4444",  bg: "#FEF2F2",       xp: 20 },
  revision:      { icon: <RefreshCw    className="w-4 h-4" />, color: "#0f766e",  bg: "#F0FDFA",       xp: 5  },
  doubt_session: { icon: <MessageSquare className="w-4 h-4" />, color: "#db2777", bg: "#FDF2F8",       xp: 5  },
};

function validId(id: string | null | undefined): string | null {
  if (!id || id === "null" || id === "undefined") return null;
  return id;
}

const typeNav: Record<PlanItemType, (refId: string | null | undefined) => string> = {
  lecture:       id => validId(id) ? `/student/lectures/${validId(id)}` : `/student/learn`,
  practice:      id => validId(id) ? `/student/learn/topic/${validId(id)}` : `/student/learn`,
  mock_test:     id => validId(id) ? `/student/quiz?mockTestId=${validId(id)}` : `/student/learn`,
  battle:        ()  => `/student/battle`,
  revision:      id => validId(id) ? `/student/learn/topic/${validId(id)}` : `/student/learn`,
  doubt_session: ()  => `/student/doubts`,
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

// ─── Plan Item Card ────────────────────────────────────────────────────────────
function PlanItemCard({ item }: { item: StudyPlanItem }) {
  const navigate  = useNavigate();
  const complete  = useCompletePlanItem();
  const skip      = useSkipPlanItem();
  const cfg       = typeConfig[item.type];
  const isDone    = item.status === "completed";
  const isSkipped = item.status === "skipped";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={!isDone && !isSkipped ? { y: -1, boxShadow: `0 6px 20px rgba(1,56,137,0.08)` } : {}}
      className={`bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 transition-all shadow-sm ${isDone || isSkipped ? "opacity-60" : ""}`}
    >
      {/* Type icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-semibold capitalize" style={{ color: cfg.color }}>
            {item.type.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />{item.estimatedMinutes}m
          </span>
          {!isDone && !isSkipped && (
            <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />+{cfg.xp} XP
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {isDone ? (
        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
      ) : isSkipped ? (
        <span className="text-xs text-gray-400 shrink-0 px-2 py-1 rounded-lg bg-gray-50">Rescheduled</span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => skip.mutate(item.id, { onSuccess: () => toast.info("Rescheduled"), onError: () => toast.error("Failed") })}
            disabled={skip.isPending}
            className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={() => complete.mutate(item.id, { onSuccess: () => toast.success(`+${cfg.xp} XP earned! ✨`), onError: () => toast.error("Failed") })}
            disabled={complete.isPending}
            className="w-8 h-8 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
          >
            {complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" /> : <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
          </button>
          <button
            onClick={() => navigate(typeNav[item.type](item.refId))}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: BLUE, boxShadow: `0 2px 8px ${BLUE}30` }}
          >
            Start
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Weekly View ───────────────────────────────────────────────────────────────
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
      <div className="flex items-center justify-between mb-5">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setWeekOffset(v => v - 1)}
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </motion.button>
        <div className="text-center">
          <p className="text-sm font-black text-gray-900">{label}</p>
          {weekOffset === 0 && <p className="text-xs font-bold" style={{ color: BLUE }}>This week</p>}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setWeekOffset(v => v + 1)}
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </motion.button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: BLUE }} />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-semibold">No tasks scheduled this week</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort().map(([date, dayItems]) => {
            const isToday = date === today;
            const d = new Date(date);
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={isToday ? { background: BLUE_L } : { background: "#F8FAFF" }}
                  >
                    <Calendar className="w-3.5 h-3.5" style={{ color: isToday ? BLUE : "#9CA3AF" }} />
                    <p className={`text-sm font-black ${isToday ? "" : "text-gray-500"}`} style={isToday ? { color: BLUE } : {}}>
                      {isToday ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{dayItems.length} tasks</span>
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentStudyPlanPage() {
  const [tab, setTab] = useState<"today" | "week">("today");
  const { data: todayItems, isLoading } = useTodaysPlan();
  const regenerate = useRegeneratePlan();

  const completed = todayItems?.filter(i => i.status === "completed").length ?? 0;
  const total     = todayItems?.length ?? 0;
  const pct       = total > 0 ? (completed / total) * 100 : 0;
  const totalXP   = todayItems?.filter(i => i.status !== "skipped")
    .reduce((sum, i) => sum + (typeConfig[i.type]?.xp ?? 5), 0) ?? 0;

  return (
    <div className="min-h-screen p-5 sm:p-6" style={{ background: "#F5F7FB" }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Study Plan</h1>
            <p className="text-sm text-gray-400 font-medium mt-0.5">AI-generated daily tasks</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => regenerate.mutate(undefined, {
              onSuccess: () => toast.success("📅 Your plan has been updated by AI"),
              onError:   () => toast.error("Failed to regenerate plan"),
            })}
            disabled={regenerate.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate
          </motion.button>
        </div>

        {/* ── Progress Card ── */}
        {tab === "today" && total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white border border-gray-100 rounded-3xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-6">
              {/* SVG Ring */}
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke={BLUE_L} strokeWidth="8" />
                  <motion.circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={pct === 100 ? "#10b981" : BLUE}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - pct / 100) }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-gray-900">{Math.round(pct)}%</span>
                </div>
              </div>
              {/* Stats */}
              <div className="flex-1">
                <p className="font-black text-gray-900 text-base">Today's Progress</p>
                <p className="text-sm text-gray-400 mt-0.5">{completed} of {total} tasks done</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: BLUE_L }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: BLUE }} />
                    <span className="text-xs font-black" style={{ color: BLUE }}>{totalXP} XP available</span>
                  </div>
                  {pct === 100 && (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                      🎉 All done!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-2">
          {(["today", "week"] as const).map(t => (
            <motion.button
              key={t} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={tab === t
                ? { background: BLUE, color: "#fff", boxShadow: `0 4px 12px ${BLUE}30` }
                : { background: "#fff", color: "#9CA3AF", border: "1px solid #E5E7EB" }}
            >
              {t === "today" ? "Today" : "This Week"}
            </motion.button>
          ))}
        </div>

        {/* ── Content ── */}
        {tab === "today" ? (
          isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
            </div>
          ) : todayItems?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: BLUE_L }}>
                <Brain className="w-8 h-8" style={{ color: BLUE }} />
              </div>
              <p className="font-black text-gray-800 text-base">No plan for today</p>
              <p className="text-sm text-gray-400 mt-1">Let AI create your personalized plan</p>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => regenerate.mutate(undefined, {
                  onSuccess: () => toast.success("📅 Plan generated!"),
                  onError:   () => toast.error("Failed to generate plan"),
                })}
                disabled={regenerate.isPending}
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: BLUE, boxShadow: `0 4px 16px ${BLUE}30` }}
              >
                {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Plan
              </motion.button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayItems.map(item => <PlanItemCard key={item.id} item={item} />)}
            </div>
          )
        ) : (
          <WeeklyView />
        )}
      </div>
    </div>
  );
}