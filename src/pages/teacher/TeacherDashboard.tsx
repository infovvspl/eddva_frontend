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
  useNotifications, useUnreadNotificationCount,
  useMarkNotificationRead, useMarkAllNotificationsRead,
} from "@/hooks/use-teacher";
import { useTeacherPresenceStats } from "@/hooks/use-presence";
import { useIsCompactLayout } from "@/hooks/use-mobile";

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

  const { data, isLoading }           = useTeacherDashboard();
  const { data: presence }            = useTeacherPresenceStats();
  const { data: allBatches }          = useMyBatches();
  const { data: insights }            = useSmartInsights();
  const { data: overview }            = useTeacherOverview();
  const { data: doubtAnalytics }      = useTeacherDoubtAnalytics();
  const { data: batchComparison }     = useBatchComparison();
  const { data: allDoubts }           = useAllDoubts();
  const { data: unreadCount }         = useUnreadNotificationCount();
  const { data: notifResult }         = useNotifications({ limit: 15 });
  const markRead                      = useMarkNotificationRead();
  const markAllRead                   = useMarkAllNotificationsRead();

  const [showNotif, setShowNotif] = useState(false);

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
  const notifs  = notifResult?.data ?? [];
  const unread  = unreadCount?.count ?? 0;

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

          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(v => !v)}
              className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={lightMotion ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
                  animate={lightMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                  exit={lightMotion ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">
                      Notifications
                      {unread > 0 && <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{unread}</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <button onClick={() => markAllRead.mutate()} className="text-xs text-primary font-medium hover:underline">
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotif(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifs.length === 0 ? (
                      <div className="flex flex-col items-center py-10 text-muted-foreground">
                        <BellOff className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : notifs.map(n => (
                      <button key={n.id}
                        onClick={() => { if (!n.readAt) markRead.mutate(n.id); }}
                        className={`w-full text-left px-4 py-3 hover:bg-secondary/30 transition-colors ${!n.readAt ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex gap-2">
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.readAt ? "bg-primary" : "bg-transparent"}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1">
                              {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "My Batches",       value: stats.totalBatches,    sub: `${stats.activeBatches} active`,    icon: Layout,       color: C.indigo, path: "/teacher/batches" },
          { label: "Lectures",         value: stats.totalLectures,   sub: "uploaded",                         icon: Video,        color: C.blue,   path: "/teacher/lectures" },
          { label: "Open Doubts",      value: openDoubts,            sub: "need response",                    icon: MessageSquare,color: openDoubts > 0 ? C.amber : C.green, path: "/teacher/doubts" },
          { label: "Total Students",   value: (overview?.totalStudents ?? stats.totalStudents) || "—", sub: "all batches", icon: Users, color: C.violet, path: "/teacher/batches" },
          { label: "Students Online",  value: presence?.studentsOnline ?? "—", sub: "right now", icon: UserCheck, color: C.teal, path: "/teacher/batches", live: true },
        ].map((s, i) => (
          <motion.button key={s.label} onClick={() => navigate(s.path)}
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: s.color + "22" }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </motion.button>
        ))}
      </div>

      {/* ── KPI Strip (from overview) ── */}
      {(kpiScore > 0 || kpiWatch > 0 || kpiResolve > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Avg Quiz Score",    value: `${kpiScore.toFixed(1)}%`,   sub: `${overview?.quizzes.totalAttempts ?? 0} attempts`,        color: C.violet },
            { label: "Avg Watch",         value: `${kpiWatch.toFixed(1)}%`,   sub: `${overview?.lectures.completedCount ?? 0} lectures done`,  color: C.blue },
            { label: "Doubt Resolution",  value: `${kpiResolve.toFixed(1)}%`, sub: `${overview?.doubts.resolved ?? 0}/${overview?.doubts.total ?? 0} resolved`, color: C.green },
          ].map(k => (
            <button key={k.label} onClick={() => navigate("/teacher/analytics")}
              className="bg-card border border-border rounded-2xl p-4 text-left hover:bg-secondary/30 transition-colors">
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: k.color }}>{k.label}</p>
              <p className="text-xs text-muted-foreground">{k.sub}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Charts Row 1: Batch Fill + Doubt Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Batch Enrollment — Stacked Bar */}
        {batchFillData.length > 0 && (
          <motion.div initial={lightMotion ? undefined : { opacity: 0, y: 8 }} animate={lightMotion ? undefined : { opacity: 1, y: 0 }} transition={lightMotion ? undefined : { delay: 0.1 }}
            className="lg:col-span-3 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-foreground">Batch Enrollment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Enrolled vs remaining capacity</p>
              </div>
              <button onClick={() => navigate("/teacher/batches")}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={batchFillData} layout="vertical" margin={{ left: 8, right: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: "rgba(255,255,255,0.7)", fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="enrolled" name="Enrolled" fill={C.indigo} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* % fill pills */}
            <div className="flex gap-3 mt-4">
              {batchFillData.map(b => (
                <div key={b.name} className="flex-1 bg-secondary/30 rounded-xl px-3 py-2">
                  <p className="text-xs text-muted-foreground truncate">{b.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{b.enrolled} enrolled</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Doubt Status Pie */}
        <motion.div initial={lightMotion ? undefined : { opacity: 0, y: 8 }} animate={lightMotion ? undefined : { opacity: 1, y: 0 }} transition={lightMotion ? undefined : { delay: 0.12 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-foreground">Doubt Status</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{doubts.length || doubtAnalytics?.summary.total || 0} total</p>
            </div>
            <button onClick={() => navigate("/teacher/doubts")}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              Respond <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {doubtsByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={doubtsByStatus} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                    paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {doubtsByStatus.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {doubtsByStatus.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                    <span className="text-xs text-muted-foreground flex-1">{d.name}</span>
                    <span className="text-xs font-bold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-44 text-muted-foreground">
              <CheckCircle className="w-10 h-10 text-emerald-500/50 mb-2" />
              <p className="text-sm">No doubts yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Charts Row 2: KPI bars + Top Confusing Topics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* KPI Progress bars */}
        <motion.div initial={lightMotion ? undefined : { opacity: 0, y: 8 }} animate={lightMotion ? undefined : { opacity: 1, y: 0 }} transition={lightMotion ? undefined : { delay: 0.14 }}
          className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-foreground">Performance Overview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Across all your batches</p>
            </div>
            <button onClick={() => navigate("/teacher/analytics")}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              Full analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4">
            <KpiBar label="Avg Quiz Score"     value={kpiScore}   color={C.indigo} />
            <KpiBar label="Avg Lecture Watch"  value={kpiWatch}   color={C.blue} />
            <KpiBar label="Doubt Resolution"   value={kpiResolve} color={C.green} />
          </div>
          {overview && (
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Quiz Attempts", value: overview.quizzes.totalAttempts, color: C.indigo },
                { label: "Lectures Done", value: overview.lectures.completedCount, color: C.blue },
                { label: "Doubts Resolved", value: overview.doubts.resolved, color: C.green },
              ].map(s => (
                <div key={s.label} className="bg-secondary/30 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Confusing Topics */}
        {topTopics.length > 0 ? (
          <motion.div initial={lightMotion ? undefined : { opacity: 0, y: 8 }} animate={lightMotion ? undefined : { opacity: 1, y: 0 }} transition={lightMotion ? undefined : { delay: 0.16 }}
            className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-foreground">Top Confusing Topics</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Most doubts raised by students</p>
              </div>
              <button onClick={() => navigate("/teacher/analytics")}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topTopics} layout="vertical" margin={{ left: 0, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="doubts" name="Doubts" fill={C.red} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          /* Batch Comparison fallback */
          compData.length > 0 && (
            <motion.div initial={lightMotion ? undefined : { opacity: 0, y: 8 }} animate={lightMotion ? undefined : { opacity: 1, y: 0 }} transition={lightMotion ? undefined : { delay: 0.16 }}
              className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-foreground">Batch Comparison</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Quiz score vs watch %</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={compData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="score" name="Avg Score %" fill={C.indigo} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="watch" name="Avg Watch %" fill={C.blue}   radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )
        )}
      </div>

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
            {insights.slice(0, 6).map((ins, i) => {
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
            {doubts.slice(0, 5).map(d => (
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
                { label: "Upload Lecture",  icon: Video,        path: "/teacher/lectures",   color: C.blue },
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
