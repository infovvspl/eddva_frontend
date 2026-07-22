import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Video, BookOpen, MessageSquare, Users, Layout,
  ChevronRight, Loader2, CheckCircle, Clock,
  AlertTriangle, Info, BarChart3, Bell, X, BellOff, UserCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import {
  useTeacherDashboard, useSmartInsights, useTeacherOverview,
  useTeacherDoubtAnalytics, useBatchComparison, useMyBatches,
  useAllDoubts,
} from "@/hooks/use-teacher";
import { useTeacherPresenceStats } from "@/hooks/use-presence";
import { useIsCompactLayout } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/* ── colours ────────────────────────────────────────────────────────────── */
const C = {
  indigo: "#6366f1",
  blue:   "#3b82f6",
  teal:   "#14b8a6",
  green:  "#10b981",
  amber:  "#f59e0b",
  red:    "#ef4444",
  violet: "#8b5cf6",
  pink:   "#ec4899",
};

const DOUBT_COLORS: Record<string, string> = {
  open: C.amber,
  ai_resolved: C.blue,
  teacher_resolved: C.green,
  escalated: C.red,
};

const statusBadge: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400",
  inactive:  "bg-slate-500/15 text-slate-400",
  completed: "bg-blue-500/15 text-blue-400",
};

/* ── custom tooltip ─────────────────────────────────────────────────────── */
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b] border border-gray-200 rounded-xl px-3 py-2 text-xs shadow-xl">
      {label && <p className="font-semibold text-white/80 mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 font-medium" style={{ color: p.fill || p.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill || p.color }} />
          {p.name}: <span className="text-white">{Number(p.value).toFixed(1)}</span>
        </p>
      ))}
    </div>
  );
};

/* ── mini stat card ─────────────────────────────────────────────────────── */
const KpiBar = ({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-sm font-bold text-white">{value.toFixed(1)}%</span>
    </div>
    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const TeacherDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isCompactLayout = useIsCompactLayout();
  const prefersReducedMotion = useReducedMotion();
  const lightMotion = isCompactLayout || !!prefersReducedMotion;

  const [showAllTopics, setShowAllTopics] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [showAllDoubts, setShowAllDoubts] = useState(false);

  const { data, isLoading }           = useTeacherDashboard();
  const { data: presence }            = useTeacherPresenceStats();
  const { data: allBatches }          = useMyBatches();
  const { data: insights }            = useSmartInsights();
  const { data: overview }            = useTeacherOverview();
  const { data: doubtAnalytics }      = useTeacherDoubtAnalytics();
  const { data: batchComparison }     = useBatchComparison();
  const { data: allDoubts }           = useAllDoubts();

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today    = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats   = data ?? { totalBatches: 0, activeBatches: 0, totalStudents: 0, totalLectures: 0, openDoubts: 0, recentBatches: [] };
  const batches = allBatches ?? stats.recentBatches;
  const doubts  = allDoubts ?? [];

  /* derived chart data */
  const batchFillData = batches.map(b => ({
    name:     b.name,
    enrolled: b.studentCount ?? 0,
  }));

  const doubtsByStatus = (() => {
    const src = doubtAnalytics?.byStatus?.length
      ? doubtAnalytics.byStatus
      : Object.entries(doubts.reduce<Record<string, number>>((a, d) => { a[d.status] = (a[d.status] ?? 0) + 1; return a; }, {}))
          .map(([status, count]) => ({ status, count }));
    return src.map(s => ({
      name:  String((s as any).status).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      value: (s as any).count as number,
      fill:  DOUBT_COLORS[(s as any).status] ?? C.violet,
    }));
  })();

  const topTopics = (doubtAnalytics?.byTopic ?? []).slice(0, 6).map(t => ({
    name:   t.topicName.length > 16 ? t.topicName.slice(0, 16) + "…" : t.topicName,
    doubts: t.count,
  }));

  const compData = (batchComparison ?? []).map(b => ({
    name:    b.batchName.length > 12 ? b.batchName.slice(0, 12) + "…" : b.batchName,
    score:   b.avgScore,
    watch:   b.avgWatchPercentage,
  }));

  const openDoubts = doubts.filter(d => d.status === "open").length || stats.openDoubts;
  const kpiScore   = overview?.quizzes.avgScore ?? 0;
  const kpiWatch   = overview?.lectures.avgWatchPercentage ?? 0;
  const kpiResolve = overview?.doubts.resolutionRate ?? 0;

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={lightMotion ? undefined : { opacity: 0, y: 10 }}
      animate={lightMotion ? undefined : { opacity: 1, y: 0 }}
      className="space-y-6"
    >

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {user?.name?.split(" ")[0] ?? "Teacher"}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>

        <div className="flex items-center gap-3">
          {openDoubts > 0 && (
            <div className="hidden sm:flex flex-col items-end bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2">
              <p className="text-xl font-bold text-amber-400">{openDoubts}</p>
              <p className="text-xs text-amber-500/80">doubts pending</p>
            </div>
          )}

        </div>
      </div>

      {/* ── Stat Cards (Desktop Only) ── */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "My Batches",       value: stats.totalBatches,    sub: `${stats.activeBatches} active`,    icon: Layout,       color: C.indigo, path: "/teacher/batches" },
          { label: "Lectures",         value: stats.totalLectures,   sub: "uploaded",                         icon: Video,        color: C.blue,   path: "/teacher/recorded-lectures" },
          { label: "Open Doubts",      value: openDoubts,            sub: "need response",                    icon: MessageSquare,color: openDoubts > 0 ? C.amber : C.green, path: "/teacher/doubts" },
          { label: "Total Students",   value: (overview?.totalStudents ?? stats.totalStudents) || "—", sub: "all batches", icon: Users, color: C.violet, path: "/teacher/batches" },
          { label: "Students Online",  value: presence?.studentsOnline ?? "—", sub: "right now", icon: UserCheck, color: C.teal, path: "/teacher/batches", live: true },
        ].map((s, i) => (
          <motion.button
            key={s.label}
            onClick={() => navigate(s.path)}
            initial={lightMotion ? undefined : { opacity: 0, y: 12 }}
            animate={lightMotion ? undefined : { opacity: 1, y: 0 }}
            transition={lightMotion ? undefined : { delay: i * 0.06 }}
            className="bg-card border border-border rounded-2xl p-5 text-left hover:bg-secondary/30 transition-colors group relative"
          >
            {(s as any).live && (
              <span className="absolute top-3 right-3 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color + "22" }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </motion.button>
        ))}
      </div>

      {/* ── KPI Strip / Analytics Overview ── */}
      {(kpiScore > 0 || kpiWatch > 0 || kpiResolve > 0) && (() => {
        const analyticsItems = [
          { label: "Avg Quiz Score",    value: `${kpiScore.toFixed(1)}%`,   sub: `${overview?.quizzes.totalAttempts ?? 0} attempts`,        color: C.violet, icon: BarChart3 },
          { label: "Avg Watch",         value: `${kpiWatch.toFixed(1)}%`,   sub: `${overview?.lectures.completedCount ?? 0} lectures done`,  color: C.blue,   icon: Video },
          { label: "Doubt Resolution",  value: `${kpiResolve.toFixed(1)}%`, sub: `${overview?.doubts.resolved ?? 0}/${overview?.doubts.total ?? 0} resolved`, color: C.green, icon: CheckCircle },
        ];
        return (
          <>
            {/* ── Mobile Analytics Overview Card ── */}
            <div className="md:hidden bg-card border border-border/80 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground">Analytics Overview</h2>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                  Swipe →
                </span>
              </div>
              <div className="flex overflow-x-auto gap-2.5 pb-1 -mx-1 px-1 scrollbar-none snap-x snap-mandatory">
                {analyticsItems.map((k, i) => (
                  <motion.button
                    key={k.label}
                    onClick={() => navigate("/teacher/analytics")}
                    initial={lightMotion ? undefined : { opacity: 0, scale: 0.95 }}
                    animate={lightMotion ? undefined : { opacity: 1, scale: 1 }}
                    transition={lightMotion ? undefined : { delay: i * 0.04 }}
                    className="w-[130px] shrink-0 snap-start bg-secondary/30 border border-border/70 rounded-xl p-2.5 flex flex-col justify-between text-left hover:bg-secondary/60 active:scale-[0.97] transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: k.color + "22" }}>
                        <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                      </div>
                      <div className="w-5 h-5 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-all">
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xl font-black text-foreground tracking-tight leading-none">{k.value}</p>
                      <p className="text-[11px] font-bold text-foreground/90 truncate leading-tight">{k.label}</p>
                      <div className="pt-0.5">
                        <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-md truncate max-w-full" style={{ background: k.color + "18", color: k.color }}>
                          {k.sub}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Desktop Analytics Strip ── */}
            <div className="hidden md:grid grid-cols-3 gap-3">
              {analyticsItems.map((k) => (
                <button
                  key={k.label}
                  onClick={() => navigate("/teacher/analytics")}
                  className="bg-card border border-border rounded-2xl p-4 text-left hover:bg-secondary/30 transition-colors group relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-2xl font-bold text-foreground">{k.value}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: k.color }}>{k.label}</p>
                  <p className="text-xs text-muted-foreground">{k.sub}</p>
                </button>
              ))}
            </div>
          </>
        );
      })()}

      {/* ── Unified Performance & Activity Overview Card (No Chart Canvases) ── */}
      <motion.div
        initial={lightMotion ? undefined : { opacity: 0, y: 8 }}
        animate={lightMotion ? undefined : { opacity: 1, y: 0 }}
        transition={lightMotion ? undefined : { delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-6"
      >
        {/* Card Main Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-4 gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">Performance & Insights Overview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Comprehensive summary across enrollment, doubts, performance, and topics</p>
          </div>
          <button
            onClick={() => navigate("/teacher/analytics")}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline self-start sm:self-auto"
          >
            <span>Full Analytics</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Sections Grid inside Single Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Section 1: Batch Enrollment */}
          <div className="bg-secondary/20 border border-border/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                  <Layout className="w-4 h-4 text-indigo-500" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Batch Enrollment</h3>
              </div>
              <button onClick={() => navigate("/teacher/batches")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {batchFillData.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {batchFillData.map(b => (
                  <div key={b.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground truncate">{b.name}</span>
                      <span className="font-bold text-indigo-400">{b.enrolled} Enrolled</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/80 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((b.enrolled / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">No active batches</p>
            )}
          </div>

          {/* Section 2: Doubt Status */}
          <div className="bg-secondary/20 border border-border/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Doubt Status</h3>
              </div>
              <button onClick={() => navigate("/teacher/doubts")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                Respond <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {doubtsByStatus.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {doubtsByStatus.map(d => (
                  <div key={d.name} className="bg-card border border-border/60 rounded-lg p-2.5 flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.fill }} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight">{d.value}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{d.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500 py-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">No pending doubts</span>
              </div>
            )}
          </div>

          {/* Section 3: Performance Overview */}
          <div className="bg-secondary/20 border border-border/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Performance Overview</h3>
              </div>
              <button onClick={() => navigate("/teacher/analytics")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3 pt-1">
              <KpiBar label="Avg Quiz Score"     value={kpiScore}   color={C.indigo} />
              <KpiBar label="Avg Lecture Watch"  value={kpiWatch}   color={C.blue} />
              <KpiBar label="Doubt Resolution"   value={kpiResolve} color={C.green} />
            </div>
          </div>

          {/* Section 4: Top Confusing Topics */}
          <div className="bg-secondary/20 border border-border/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Top Confusing Topics</h3>
              </div>
              <button onClick={() => navigate("/teacher/analytics")} className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {topTopics.length > 0 ? (
              <div className="space-y-2 pt-1">
                {(showAllTopics ? topTopics : topTopics.slice(0, 3)).map((t, idx) => (
                  <div key={t.name} className="flex items-center justify-between bg-card border border-border/60 rounded-lg px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-foreground truncate">{t.name}</span>
                    </div>
                    <span className="font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full text-[10px] shrink-0">
                      {t.doubts} doubts
                    </span>
                  </div>
                ))}
                {topTopics.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllTopics(v => !v)}
                    className="w-full text-center py-1.5 text-xs text-primary font-semibold hover:underline flex items-center justify-center gap-1 mt-1 bg-primary/5 rounded-lg border border-primary/10 transition-colors"
                  >
                    <span>{showAllTopics ? "Show Less" : `More (${topTopics.length - 3} more)`}</span>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showAllTopics ? "-rotate-90" : "rotate-90")} />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">No topic doubt trends recorded</p>
            )}
          </div>

        </div>
      </motion.div>

      {/* ── Smart Insights ── */}
      {insights && insights.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Smart Insights</h2>
            <button onClick={() => navigate("/teacher/analytics")}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {(showAllInsights ? insights : insights.slice(0, 3)).map((ins, i) => {
              const clr = ins.severity === "critical" ? C.red : ins.severity === "warning" ? C.amber : C.blue;
              return (
                <motion.div key={i}
                  initial={lightMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={lightMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={lightMotion ? undefined : { delay: i * 0.06 }}
                  onClick={() => navigate("/teacher/analytics")}
                  className="p-4 rounded-2xl bg-card border border-border cursor-pointer hover:bg-secondary/30 transition-colors"
                  style={{ borderLeft: `3px solid ${clr}` }}
                >
                  <div className="flex items-start gap-2">
                    {ins.severity === "info"
                      ? <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: clr }} />
                      : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: clr }} />}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ins.description}</p>
                      <p className="text-xs font-medium mt-1.5" style={{ color: clr }}>→ {ins.action}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {insights.length > 3 && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowAllInsights(v => !v)}
                className="px-4 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>{showAllInsights ? "Show Less" : `More (${insights.length - 3} more insights)`}</span>
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showAllInsights ? "-rotate-90" : "rotate-90")} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Recent Doubts ── */}
      {doubts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground">Recent Doubts</h2>
            <button onClick={() => navigate("/teacher/doubts")}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-border">
            {(showAllDoubts ? doubts : doubts.slice(0, 3)).map(d => (
              <div key={d.id} onClick={() => navigate("/teacher/doubts")}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition-colors cursor-pointer gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.questionText ?? d.ocrExtractedText ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.student?.fullName ?? d.studentName ?? "Student"}
                    {(d.topic?.name ?? d.topicName) && <> · {d.topic?.name ?? d.topicName}</>}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: (DOUBT_COLORS[d.status] ?? C.violet) + "22", color: DOUBT_COLORS[d.status] ?? C.violet }}>
                  {d.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
          {doubts.length > 3 && (
            <div className="p-3 text-center border-t border-border/60 bg-secondary/10">
              <button
                type="button"
                onClick={() => setShowAllDoubts(v => !v)}
                className="px-4 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>{showAllDoubts ? "Show Less" : `More (${doubts.length - 3} more doubts)`}</span>
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showAllDoubts ? "-rotate-90" : "rotate-90")} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Row: Batches list + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground">My Batches</h2>
            <button onClick={() => navigate("/teacher/batches")}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {stats.recentBatches.length === 0
            ? <p className="text-center py-10 text-muted-foreground text-sm">No batches assigned yet.</p>
            : (
              <div className="divide-y divide-border">
                {stats.recentBatches.map(b => (
                  <div key={b.id} onClick={() => navigate(`/teacher/batches?id=${b.id}`)}
                    className="flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground uppercase mt-0.5 tracking-wide">{b.examTarget} · Class {b.class}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-foreground">{b.studentCount ?? 0}</p>
                        <p className="text-xs text-muted-foreground">students</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge[b.status] ?? statusBadge.inactive}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Upload Lecture",  icon: Video,        path: "/teacher/recorded-lectures",   color: C.blue },
                { label: "View Doubts",     icon: MessageSquare,path: "/teacher/doubts",     color: C.amber },
                { label: "My Batches",      icon: Layout,       path: "/teacher/batches",    color: C.indigo },
                { label: "Analytics",       icon: BarChart3,    path: "/teacher/analytics",  color: C.violet },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border hover:bg-secondary/50 transition-colors text-sm font-medium text-foreground">
                  <a.icon className="w-4 h-4" style={{ color: a.color }} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Doubt Queue Alert */}
          <div className={`rounded-2xl p-5 border ${openDoubts > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
            <div className="flex items-center gap-2 mb-2">
              {openDoubts > 0 ? <Clock className="w-5 h-5 text-amber-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
              <h3 className="font-bold text-foreground">Doubt Queue</h3>
            </div>
            {openDoubts > 0 ? (
              <>
                <p className="text-4xl font-bold text-amber-400 mt-1">{openDoubts}</p>
                <p className="text-xs text-muted-foreground mt-1">awaiting your response</p>
                <button onClick={() => navigate("/teacher/doubts")} className="mt-3 text-xs font-semibold text-amber-500 hover:underline">
                  Respond now →
                </button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">All caught up! No pending doubts.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TeacherDashboard;
