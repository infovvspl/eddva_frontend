import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Swords, Trophy, Brain, BookOpen, Video,
  Zap, ChevronRight, CheckCircle, Target,
  Loader2, Bell, Play, RefreshCw, MessageSquare,
  TrendingUp, Clock, Award, Sparkles,
  Calendar, BarChart3, HelpCircle,
  Star, Lock, Plus, X, Users, Activity,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  useStudentMe, useTodaysPlan, useMyPerformance,
  useLeaderboard, useCompletePlanItem, useDailyBattle,
  useNextAction,
} from "@/hooks/use-student";
import ProgressReportTree from "@/components/shared/ProgressReportTree";
import { useUnreadNotificationCount } from "@/hooks/use-teacher";
import { StudyPlanItem, PlanItemType } from "@/lib/api/student";
import { toast } from "sonner";

// ─── Design Tokens ────────────────────────────────────────────────────────────

const BLUE    = "#2563EB";
const PURPLE  = "#7C3AED";
const INDIGO  = "#4F46E5";
const SUCCESS = "#22C55E";
const WARN    = "#F59E0B";
const BLUE_L  = "#EFF6FF";
const PURPLE_L = "#F5F3FF";

// ─── Config Maps ──────────────────────────────────────────────────────────────

const typeIcon: Record<PlanItemType, React.ReactNode> = {
  lecture:       <Video      className="w-4 h-4" />,
  practice:      <Brain      className="w-4 h-4" />,
  mock_test:     <BookOpen   className="w-4 h-4" />,
  battle:        <Swords     className="w-4 h-4" />,
  revision:      <RefreshCw  className="w-4 h-4" />,
  doubt_session: <MessageSquare className="w-4 h-4" />,
};

const typeStyle: Record<PlanItemType, { dot: string; bg: string; text: string }> = {
  lecture:       { dot: BLUE,      bg: "bg-blue-50",   text: "text-blue-700"   },
  practice:      { dot: PURPLE,    bg: "bg-violet-50", text: "text-violet-700" },
  mock_test:     { dot: WARN,      bg: "bg-amber-50",  text: "text-amber-700"  },
  battle:        { dot: "#EF4444", bg: "bg-red-50",    text: "text-red-700"    },
  revision:      { dot: SUCCESS,   bg: "bg-green-50",  text: "text-green-700"  },
  doubt_session: { dot: "#EC4899", bg: "bg-pink-50",   text: "text-pink-700"   },
};

const typeNav: Record<PlanItemType, (refId: string) => string> = {
  lecture:       id => `/student/lectures/${id}`,
  practice:      id => `/student/learn/topic/${id}`,
  mock_test:     id => `/student/quiz?mockTestId=${id}`,
  battle:        ()  => `/student/battle`,
  revision:      id => `/student/learn/topic/${id}`,
  doubt_session: ()  => `/student/doubts`,
};

const tierStyle: Record<string, { pill: string; text: string }> = {
  champion: { pill: "bg-amber-100",  text: "text-amber-800"  },
  diamond:  { pill: "bg-cyan-100",   text: "text-cyan-800"   },
  platinum: { pill: "bg-violet-100", text: "text-violet-800" },
  gold:     { pill: "bg-yellow-100", text: "text-yellow-800" },
  silver:   { pill: "bg-slate-100",  text: "text-slate-700"  },
  bronze:   { pill: "bg-orange-100", text: "text-orange-800" },
  iron:     { pill: "bg-gray-100",   text: "text-gray-600"   },
};

const subjectHues = [BLUE, PURPLE, "#0891b2", SUCCESS, WARN, "#EF4444"];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  },
};

// ─── XP Level ────────────────────────────────────────────────────────────────

function getLevel(xp: number) {
  const level    = Math.floor(xp / 1000) + 1;
  const progress = (xp % 1000) / 10;
  const xpToNext = 1000 - (xp % 1000);
  return { level, progress, xpToNext };
}

// ─── Badge System ─────────────────────────────────────────────────────────────

interface BadgeDef {
  icon: React.ComponentType<{ className?: string }>;
  label: string; pill: string; iconColor: string;
}

function getEarnedBadges(streak: number, xp: number, tests: number, accuracy: number): BadgeDef[] {
  const b: BadgeDef[] = [];
  if (streak >= 3)    b.push({ icon: Flame,       label: "On Fire",      pill: "bg-orange-100", iconColor: "text-orange-600" });
  if (streak >= 7)    b.push({ icon: Zap,         label: "Week Warrior", pill: "bg-amber-100",  iconColor: "text-amber-600"  });
  if (xp >= 1000)     b.push({ icon: Star,        label: "1K XP Club",   pill: "bg-yellow-100", iconColor: "text-yellow-600" });
  if (xp >= 5000)     b.push({ icon: Trophy,      label: "XP Legend",    pill: "bg-violet-100", iconColor: "text-violet-600" });
  if (tests >= 10)    b.push({ icon: BookOpen,    label: "Test Taker",   pill: "bg-blue-100",   iconColor: "text-blue-700"   });
  if (tests >= 50)    b.push({ icon: Award,       label: "Quiz Master",  pill: "bg-cyan-100",   iconColor: "text-cyan-700"   });
  if (accuracy >= 70) b.push({ icon: Target,      label: "Sharpshooter", pill: "bg-green-100",  iconColor: "text-green-700"  });
  if (accuracy >= 85) b.push({ icon: CheckCircle, label: "Top Scorer",   pill: "bg-teal-100",   iconColor: "text-teal-700"   });
  return b;
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ value, size = 72, stroke = 6, color = BLUE }: {
  value: number; size?: number; stroke?: number; color?: string;
}) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (value / 100) * circ }}
        transition={{ duration: 1.3, ease: "easeOut" }} />
    </svg>
  );
}

// ─── Weekly Activity Bars ─────────────────────────────────────────────────────

function ActivityBars({ streak }: { streak: number }) {
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  const activeH   = [75, 85, 60, 90, 70, 80, 65];
  const inactiveH = [15, 10, 20,  5, 25, 10, 15];
  const today  = new Date().getDay();
  const offset = today === 0 ? 6 : today - 1;

  return (
    <div className="flex items-end gap-1.5 h-14">
      {labels.map((d, i) => {
        const daysAgo  = (offset - i + 7) % 7;
        const isActive = daysAgo < streak;
        const isToday  = i === offset;
        const h = isActive ? activeH[i] : inactiveH[i];
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${Math.max(h, 8)}%`, opacity: 1 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: "easeOut" }}
              className="w-full rounded-md"
              style={{
                background: isActive
                  ? `linear-gradient(180deg, ${PURPLE}, ${BLUE})`
                  : "#E2E8F0",
                boxShadow: isToday ? `0 0 8px ${BLUE}60` : "none",
              }}
            />
            <span className={`text-[9px] font-semibold ${isToday ? "text-blue-600" : "text-gray-300"}`}>{d}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Badge Chip ───────────────────────────────────────────────────────────────

function BadgeChip({ badge }: { badge: BadgeDef }) {
  const Icon = badge.icon;
  return (
    <motion.div
      variants={stagger.item}
      whileHover={{ scale: 1.07, y: -2 }}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl ${badge.pill} border border-white/80 cursor-default`}
    >
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
        <Icon className={`w-4 h-4 ${badge.iconColor}`} />
      </div>
      <p className={`text-[10px] font-bold ${badge.iconColor} text-center leading-tight`}>{badge.label}</p>
    </motion.div>
  );
}

// ─── Subject Bar ──────────────────────────────────────────────────────────────

function SubjectBar({ name, accuracy, index }: { name: string; accuracy: number; index: number }) {
  const color = subjectHues[index % subjectHues.length];
  const pct   = Math.min(100, Math.max(0, accuracy));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-xs font-semibold text-gray-700 truncate max-w-[130px]">{name}</span>
        </div>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}70, ${color})` }}
        />
      </div>
    </div>
  );
}

// ─── Timeline Task ────────────────────────────────────────────────────────────

function TimelineTask({ item, index, isLast }: {
  item: StudyPlanItem; index: number; isLast: boolean;
}) {
  const navigate = useNavigate();
  const complete = useCompletePlanItem();
  const isDone   = item.status === "completed";
  const isSkip   = item.status === "skipped";
  const ts       = typeStyle[item.type] ?? typeStyle.lecture;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="relative flex gap-4"
    >
      {/* Track */}
      <div className="flex flex-col items-center shrink-0">
        <motion.div
          whileHover={{ scale: 1.3 }}
          className="w-3 h-3 rounded-full mt-0.5 border-2 border-white shadow-sm z-10 shrink-0"
          style={{ background: isDone ? SUCCESS : ts.dot }}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ background: "#E5E7EB", minHeight: "24px" }} />
        )}
      </div>

      {/* Content */}
      <div className={`group flex-1 flex items-start justify-between gap-2 pb-4 min-w-0
        ${isDone || isSkip ? "opacity-40" : ""}`}>
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${ts.bg} ${ts.text}`}>
            {typeIcon[item.type]}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />{item.estimatedMinutes}m
              </span>
              {item.xpReward && (
                <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
                  <Zap className="w-3 h-3" />+{item.xpReward}
                </span>
              )}
            </div>
          </div>
        </div>

        {isDone ? (
          <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        ) : !isSkip ? (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => complete.mutate(item.id, {
                onSuccess: () => toast.success("Task complete! +XP"),
                onError:   () => toast.error("Failed"),
              })}
              disabled={complete.isPending}
              className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
            >
              {complete.isPending
                ? <Loader2 className="w-3 h-3 animate-spin text-green-600" />
                : <CheckCircle className="w-3 h-3 text-green-600" />}
            </button>
            <button
              onClick={() => navigate(typeNav[item.type]?.(item.refId) ?? "/student/learn")}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: BLUE_L }}
            >
              <Play className="w-3 h-3" style={{ color: BLUE }} />
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label, icon, color, bg }: {
  value: string | number; label: string;
  icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <motion.div
      variants={stagger.item}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-base font-black text-gray-900 leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const StudentDashboard = () => {
  const [showProgress, setShowProgress] = useState(false);
  const [fabOpen, setFabOpen]           = useState(false);
  const { user }  = useAuthStore();
  const navigate  = useNavigate();

  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: plan, isLoading: planLoading } = useTodaysPlan();
  const { data: perf }       = useMyPerformance();
  const { data: lb }         = useLeaderboard({ scope: "global" });
  const { data: unread }     = useUnreadNotificationCount();
  const { data: daily }      = useDailyBattle();
  const { data: nextAction } = useNextAction();

  const student    = me?.student;
  const tier       = student?.currentEloTier?.toLowerCase() ?? "iron";
  const ts         = tierStyle[tier] ?? tierStyle.iron;
  const streak     = student?.streakDays ?? 0;
  const longest    = student?.longestStreak ?? streak;
  const xp         = student?.xpPoints ?? 0;
  const accuracy   = perf?.overallAccuracy ?? 0;
  const rank       = lb?.currentStudentRank?.rank;
  const tests      = perf?.totalTestsTaken ?? 0;
  const weakTopics = perf?.weakTopics ?? [];
  const subjects   = perf?.subjectAccuracy ? Object.entries(perf.subjectAccuracy) : [];

  const completed = plan?.filter(i => i.status === "completed").length ?? 0;
  const total     = plan?.length ?? 0;
  const planPct   = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { level, progress: xpProgress, xpToNext } = getLevel(xp);
  const badges = getEarnedBadges(streak, xp, tests, accuracy);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name     = me?.fullName?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "Student";

  const fabActions = [
    { label: "Start Session",   icon: Play,       color: BLUE,   bg: BLUE_L,   path: "/student/learn"    },
    { label: "Ask Doubt",       icon: HelpCircle, color: PURPLE, bg: PURPLE_L, path: "/student/doubts"   },
    { label: "Join Live Class", icon: Users,      color: SUCCESS, bg: "#F0FDF4", path: "/student/lectures" },
  ];

  if (meLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: BLUE }} />
        <p className="text-sm text-gray-400 font-medium">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen" style={{ background: "#F8FAFC" }}>
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="space-y-5 p-5 pb-24"
      >

        {/* ════════════════════════════════════════
            ROW 1 — HERO + PROGRESS PANEL
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ── Hero Learning Card ── */}
          <motion.div variants={stagger.item} className="lg:col-span-8">
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                background: `linear-gradient(135deg, ${BLUE} 0%, ${INDIGO} 48%, ${PURPLE} 100%)`,
                minHeight: "280px",
              }}
            >
              {/* Decorative orbs */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }} />
              <div className="absolute top-10 right-28 w-32 h-32 rounded-full"
                style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full"
                style={{ background: "rgba(0,0,0,0.12)" }} />
              {/* Dot-grid overlay */}
              <div className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }} />
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-28"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }} />

              <div className="relative p-7 flex flex-col" style={{ minHeight: "280px" }}>
                {/* Top: type badge + daily goal + tier */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {nextAction && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-sm text-white text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        {nextAction.type?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) ?? "Task"}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${ts.pill} ${ts.text}`}>
                      <Trophy className="w-3 h-3" /><span className="capitalize">{tier}</span>
                    </span>
                  </div>
                  {/* Daily dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/50 font-medium">Daily</span>
                    {Array.from({ length: Math.min(total || 5, 5) }).map((_, i) => (
                      <div key={i}
                        className={`w-2 h-2 rounded-full transition-all ${i < completed ? "bg-white" : "bg-white/25"}`} />
                    ))}
                    {total > 0 && (
                      <span className="text-[11px] text-white/50 font-medium">{completed}/{Math.min(total, 5)}</span>
                    )}
                  </div>
                </div>

                {/* Main title */}
                <div className="flex-1 flex flex-col justify-end mt-6">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                    Continue Learning
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-snug max-w-lg">
                    {nextAction?.title ?? "No active task — generate your study plan!"}
                  </h2>

                  {/* Progress bar */}
                  {total > 0 && (
                    <div className="mt-4 flex items-center gap-3 max-w-sm">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.2)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${planPct}%` }}
                          transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
                          className="h-full rounded-full bg-white"
                        />
                      </div>
                      <span className="text-xs font-black text-white/80">{planPct}%</span>
                    </div>
                  )}

                  {/* Meta row + CTA */}
                  <div className="mt-5 flex items-center gap-4 flex-wrap">
                    {nextAction?.estimatedMinutes && (
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{nextAction.estimatedMinutes} min
                      </span>
                    )}
                    {nextAction?.xpReward && (
                      <span className="text-xs font-bold flex items-center gap-1" style={{ color: WARN }}>
                        <Zap className="w-3.5 h-3.5" />+{nextAction.xpReward} XP
                      </span>
                    )}
                    {streak > 0 && (
                      <span className="text-xs text-orange-300 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />{streak}-day streak
                      </span>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 32px rgba(255,255,255,0.3)" }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => nextAction && nextAction.type
                        ? navigate(typeNav[nextAction.type]?.(nextAction.refId) ?? "/student/learn")
                        : navigate("/student/study-plan")}
                      className="ml-auto sm:ml-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all bg-white hover:bg-white/90"
                      style={{ color: BLUE, boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}
                    >
                      <Play className="w-4 h-4" />
                      {nextAction ? "Continue Learning" : "Get Started"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Student Progress Panel ── */}
          <motion.div variants={stagger.item} className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(37,99,235,0.07)] p-5 h-full flex flex-col gap-4">
              {/* Profile row */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-2xl p-[2px] shadow-md"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}
                  >
                    <div className="w-full h-full rounded-[13px] bg-white flex items-center justify-center overflow-hidden">
                      {me?.profilePictureUrl
                        ? <img src={me.profilePictureUrl} className="w-full h-full object-cover" alt="" />
                        : <span className="text-lg font-black text-gray-800">{name.charAt(0)}</span>}
                    </div>
                  </div>
                  {streak >= 3 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Flame className="w-3 h-3 text-orange-500" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 font-medium">{greeting} 👋</p>
                  <p className="font-black text-gray-900 text-sm truncate">{name}</p>
                  {student?.examTarget && (
                    <p className="text-[10px] text-gray-400 truncate">
                      {student.examTarget}{student.examYear ? ` · ${student.examYear}` : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate("/student/notifications")}
                  className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                >
                  <Bell className="w-4 h-4 text-gray-500" />
                  {(unread?.count ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {unread!.count > 9 ? "9+" : unread!.count}
                    </span>
                  )}
                </button>
              </div>

              {/* Level + XP bar */}
              <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${BLUE_L}, ${PURPLE_L})` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md"
                      style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}
                    >
                      {level}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800">Level {level}</p>
                      <p className="text-[10px] text-gray-500">{xp.toLocaleString()} XP earned</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: PURPLE }}>
                    {xpToNext} to next
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.6)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${BLUE}, ${PURPLE})` }}
                  />
                </div>
              </div>

              {/* Stat chips */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: `${streak}d`, l: "Streak", icon: <Flame className="w-3.5 h-3.5" />,  c: "#F97316", bg: "#FFF7ED" },
                  { v: rank ? `#${rank}` : "—", l: "Rank", icon: <Trophy className="w-3.5 h-3.5" />, c: BLUE, bg: BLUE_L },
                  { v: `${accuracy.toFixed(0)}%`, l: "Acc", icon: <Target className="w-3.5 h-3.5" />, c: SUCCESS, bg: "#F0FDF4" },
                ].map(s => (
                  <div key={s.l}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border border-gray-100 bg-gray-50/60">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ background: s.bg, color: s.c }}>
                      {s.icon}
                    </div>
                    <p className="text-sm font-black text-gray-900">{s.v}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Weekly activity */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" style={{ color: BLUE }} /> Weekly Activity
                  </p>
                  <span className="text-[10px] text-gray-400">Best: {longest}d</span>
                </div>
                <ActivityBars streak={streak} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ════════════════════════════════════════
            QUICK STATS STRIP
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill value={`${streak}d`} label="Day Streak"
            icon={<Flame className="w-4 h-4" />} color="#F97316" bg="#FFF7ED" />
          <StatPill
            value={xp > 9999 ? `${(xp / 1000).toFixed(1)}k` : xp.toLocaleString()}
            label={`Total XP · Lv.${level}`}
            icon={<Zap className="w-4 h-4" />} color={BLUE} bg={BLUE_L} />
          <StatPill value={rank ? `#${rank}` : "—"} label="Global Rank"
            icon={<Award className="w-4 h-4" />} color={INDIGO} bg="#EEF2FF" />
          <StatPill value={`${tests} Tests`} label={`${accuracy.toFixed(0)}% Accuracy`}
            icon={<Target className="w-4 h-4" />} color={SUCCESS} bg="#F0FDF4" />
        </div>

        {/* ════════════════════════════════════════
            ROW 2 — PLAN + PERFORMANCE + RIGHT
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ── Today's Plan (Timeline) ── */}
          <motion.div variants={stagger.item} className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(37,99,235,0.06)] h-full flex flex-col">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: BLUE_L }}>
                    <Calendar className="w-4 h-4" style={{ color: BLUE }} />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 text-sm">Today's Plan</h2>
                    {total > 0 && <p className="text-[11px] text-gray-400">{completed} of {total} done</p>}
                  </div>
                </div>
                <button
                  onClick={() => navigate("/student/study-plan")}
                  className="text-xs font-bold hover:underline flex items-center gap-0.5"
                  style={{ color: BLUE }}
                >
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {total > 0 && (
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${planPct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: planPct === 100
                            ? `linear-gradient(90deg, ${SUCCESS}, #16a34a)`
                            : `linear-gradient(90deg, ${BLUE}, ${PURPLE})`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-black tabular-nums text-gray-700">{planPct}%</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {planPct === 100
                      ? "🎉 All done! Amazing work today."
                      : planPct >= 50
                      ? "Halfway there — keep going!"
                      : "Let's crush today's goals!"}
                  </p>
                </div>
              )}

              <div className="flex-1 px-5 pb-4 overflow-y-auto max-h-[360px]">
                {planLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                  </div>
                ) : !plan?.length ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                      style={{ background: BLUE_L }}>
                      <Sparkles className="w-6 h-6" style={{ color: BLUE }} />
                    </div>
                    <p className="text-sm font-bold text-gray-700">No tasks yet</p>
                    <p className="text-xs text-gray-400 mt-1">Generate your AI-powered study plan</p>
                    <button
                      onClick={() => navigate("/student/study-plan")}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate Plan
                    </button>
                  </div>
                ) : (
                  <div>
                    {plan.slice(0, 6).map((item, i) => (
                      <TimelineTask
                        key={item.id} item={item} index={i}
                        isLast={i === Math.min(plan.length, 6) - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Subject Performance ── */}
          <div className="lg:col-span-4 space-y-4">
            <motion.div variants={stagger.item}
              className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(37,99,235,0.06)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" style={{ color: BLUE }} /> Performance
                </h2>
                <button onClick={() => navigate("/student/learn")}
                  className="text-xs font-bold hover:underline" style={{ color: BLUE }}>
                  Study →
                </button>
              </div>
              {subjects.length > 0 ? (
                <div className="space-y-3.5">
                  {subjects.slice(0, 5).map(([subj, acc], i) => (
                    <SubjectBar key={subj} name={subj} accuracy={Number(acc)} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm text-gray-400">Take tests to see performance</p>
                </div>
              )}
            </motion.div>

            {/* Overall accuracy ring */}
            <motion.div variants={stagger.item}
              className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_16px_rgba(37,99,235,0.06)] p-5">
              <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Overall Progress
              </h3>
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <CircularProgress value={accuracy} size={80} stroke={7}
                    color={accuracy >= 70 ? SUCCESS : accuracy >= 40 ? WARN : "#EF4444"} />
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-gray-900">
                    {accuracy.toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { dot: SUCCESS,    label: `${tests} tests taken`         },
                    { dot: BLUE,       label: `${xp.toLocaleString()} XP`    },
                    { dot: "#F97316",  label: `${streak}-day streak`         },
                    { dot: PURPLE,     label: `Level ${level}`               },
                  ].map(({ dot, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Focus Areas */}
            <motion.div variants={stagger.item}
              className="rounded-3xl border p-4"
              style={{ background: "linear-gradient(135deg, #FFF1F2, #FFF7ED)", borderColor: "#FED7AA" }}>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-gray-800">
                <Target className="w-4 h-4 text-red-500" /> Focus Areas
              </h3>
              {weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {weakTopics.slice(0, 4).map(wt => (
                    <div key={wt.topicId} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0
                        ${wt.accuracy < 40 ? "bg-red-500" : wt.accuracy < 60 ? "bg-amber-500" : "bg-yellow-400"}`} />
                      <p className="text-xs text-gray-700 font-medium truncate flex-1">{wt.topicName}</p>
                      <span className={`text-[11px] font-bold tabular-nums
                        ${wt.accuracy < 40 ? "text-red-600" : wt.accuracy < 60 ? "text-amber-600" : "text-yellow-600"}`}>
                        {wt.accuracy.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate("/student/learn")}
                    className="w-full mt-1 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, #EF4444, #F97316)" }}
                  >
                    <Brain className="w-3.5 h-3.5" /> Practice Now
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 mx-auto mb-1.5 text-green-400" />
                  <p className="text-xs text-gray-500">No weak areas — keep it up!</p>
                </div>
              )}
            </motion.div>

            {/* Battle Arena */}
            <motion.div variants={stagger.item}>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 12px 32px rgba(124,58,237,0.18)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/student/battle")}
                className="w-full relative overflow-hidden rounded-3xl border border-purple-100 p-4 text-left group transition-all"
                style={{
                  background: "linear-gradient(135deg, #F5F3FF, #EEF2FF)",
                  boxShadow: "0 2px 12px rgba(124,58,237,0.07)",
                }}
              >
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full"
                  style={{ background: `${PURPLE}18` }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${PURPLE}, ${INDIGO})` }}>
                      <Swords className="w-5 h-5 text-white" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="font-black text-gray-900 text-sm">Battle Arena</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {daily?.topicName ? `Daily: ${daily.topicName}` : "Challenge peers, win XP"}
                  </p>
                  {daily?.playerCount && (
                    <p className="text-[11px] font-bold flex items-center gap-1.5 mt-1.5" style={{ color: PURPLE }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: PURPLE }} />
                      {daily.playerCount} online now
                    </p>
                  )}
                </div>
              </motion.button>
            </motion.div>

            {/* Quick Access */}
            <motion.div variants={stagger.item}
              className="bg-white rounded-3xl border border-gray-100 p-4 shadow-[0_2px_12px_rgba(37,99,235,0.06)]">
              <h3 className="font-bold text-sm text-gray-900 mb-3">Quick Access</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Learn",       icon: BookOpen,   path: "/student/learn",       bg: BLUE_L,    color: BLUE    },
                  { label: "Doubts",      icon: HelpCircle, path: "/student/doubts",      bg: "#FFF7ED",  color: "#F97316" },
                  { label: "Study Plan",  icon: Calendar,   path: "/student/study-plan",  bg: "#F0FDF4",  color: SUCCESS  },
                  { label: "Leaderboard", icon: Trophy,     path: "/student/leaderboard", bg: PURPLE_L,   color: PURPLE   },
                ].map(a => (
                  <motion.button key={a.label}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(a.path)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: a.bg }}>
                      <a.icon className="w-4 h-4" style={{ color: a.color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600">{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            ROW 3 — ACHIEVEMENTS + LEADERBOARD
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Achievements */}
          <motion.div variants={stagger.item}
            className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_2px_16px_rgba(37,99,235,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Achievements
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-xl font-bold" style={{ background: BLUE_L, color: BLUE }}>
                {badges.length} earned
              </span>
            </div>
            <motion.div variants={stagger.container} className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {badges.map((badge, i) => <BadgeChip key={i} badge={badge} />)}
              {Array.from({ length: Math.max(0, 4 - badges.length) }).map((_, i) => (
                <div key={`lock-${i}`}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-gray-300" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-300 text-center">Locked</p>
                </div>
              ))}
            </motion.div>
            {badges.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-3">Keep streaks and take tests to unlock badges!</p>
            )}
          </motion.div>

          {/* Leaderboard Preview */}
          <motion.div variants={stagger.item}
            className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_2px_16px_rgba(37,99,235,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> Your Ranking
              </h2>
              <button onClick={() => navigate("/student/leaderboard")}
                className="text-xs font-bold hover:underline flex items-center gap-0.5" style={{ color: BLUE }}>
                Full board <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {rank ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border"
                  style={{ background: BLUE_L, borderColor: "#BFDBFE" }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white font-black shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
                      boxShadow: `0 4px 16px ${BLUE}40`,
                    }}>
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{name}</p>
                    <p className="text-[11px] text-gray-500">{xp.toLocaleString()} XP · Level {level}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black" style={{ color: BLUE }}>#{rank}</p>
                    <p className="text-[10px] text-gray-400">Global</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ l: "Top 10", t: 10 }, { l: "Top 100", t: 100 }, { l: "Top 500", t: 500 }].map(({ l, t }) => (
                    <div key={l}
                      className="py-2 rounded-2xl text-[11px] font-bold text-center border transition-colors"
                      style={rank <= t
                        ? { background: BLUE_L, borderColor: "#BFDBFE", color: BLUE }
                        : { background: "#F8FAFC", borderColor: "#E5E7EB", color: "#CBD5E1" }}>
                      {l}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/student/leaderboard")}
                  className="w-full py-2.5 rounded-2xl text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
                  <Trophy className="w-3.5 h-3.5" /> View Full Leaderboard
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                <p className="text-sm font-semibold text-gray-600">Not ranked yet</p>
                <p className="text-xs text-gray-400 mt-1">Take tests to earn your rank</p>
                <button onClick={() => navigate("/student/quiz")}
                  className="mt-3 text-xs font-bold hover:underline" style={{ color: BLUE }}>
                  Take a test →
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* ════════════════════════════════════════
            PROGRESS REPORT
        ════════════════════════════════════════ */}
        <motion.div variants={stagger.item}
          className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-[0_2px_16px_rgba(37,99,235,0.06)]">
          <button
            onClick={() => setShowProgress(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: BLUE_L }}>
                <BarChart3 className="w-4 h-4" style={{ color: BLUE }} />
              </div>
              <div className="text-left">
                <p className="font-black text-gray-900 text-sm">Detailed Progress Report</p>
                <p className="text-xs text-gray-400">Subject → Chapter → Topic breakdown</p>
              </div>
            </div>
            <motion.div animate={{ rotate: showProgress ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
            </motion.div>
          </button>
          {showProgress && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">
              <ProgressReportTree />
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════
          FLOATING ACTION BUTTON
      ════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex flex-col gap-2 mb-2"
            >
              {fabActions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20, scale: 0.85 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.85 }}
                  transition={{ delay: (fabActions.length - 1 - i) * 0.05 }}
                  onClick={() => { navigate(action.path); setFabOpen(false); }}
                  className="flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-2xl bg-white text-sm font-bold shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow"
                  style={{ color: action.color }}
                >
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: action.bg }}>
                    <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                  </div>
                  {action.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setFabOpen(v => !v)}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl"
          style={{
            background: fabOpen
              ? "linear-gradient(135deg, #EF4444, #F97316)"
              : `linear-gradient(135deg, ${BLUE}, ${PURPLE})`,
            boxShadow: `0 8px 32px ${fabOpen ? "rgba(239,68,68,0.4)" : `${BLUE}55`}`,
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus className="w-6 h-6" />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
};

export default StudentDashboard;
