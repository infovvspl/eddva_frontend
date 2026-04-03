import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame, Swords, Trophy, Brain, BookOpen, Video,
  Zap, ChevronRight, CheckCircle, Target,
  Loader2, Bell, Play, RefreshCw, MessageSquare,
  Clock, Sparkles, LogOut, Award, Layers,
  Calendar, BarChart3, HelpCircle,
  Star, Lock, Phone, Mail, MapPin, Search,
  Users, ArrowUpRight,
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
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";

// ─── Design Tokens ────────────────────────────────────────────────────────────

const BLUE    = "#013889";
const BLUE_M  = "#0257c8";
const BLUE_L  = "#E6EEF8";
const BLUE_L2 = "#CCE0F5";

// ─── Config Maps ──────────────────────────────────────────────────────────────

const typeIcon: Record<PlanItemType, React.ReactNode> = {
  lecture:       <Video         className="w-4 h-4" />,
  practice:      <Brain         className="w-4 h-4" />,
  mock_test:     <BookOpen      className="w-4 h-4" />,
  battle:        <Swords        className="w-4 h-4" />,
  revision:      <RefreshCw     className="w-4 h-4" />,
  doubt_session: <MessageSquare className="w-4 h-4" />,
};

const typeStyle: Record<PlanItemType, { bg: string; text: string }> = {
  lecture:       { bg: "bg-blue-50",   text: "text-blue-700"   },
  practice:      { bg: "bg-violet-50", text: "text-violet-700" },
  mock_test:     { bg: "bg-amber-50",  text: "text-amber-700"  },
  battle:        { bg: "bg-red-50",    text: "text-red-700"    },
  revision:      { bg: "bg-teal-50",   text: "text-teal-700"   },
  doubt_session: { bg: "bg-pink-50",   text: "text-pink-700"   },
};

const typeNav: Record<PlanItemType, (refId: string) => string> = {
  lecture:       id => `/student/lectures/${id}`,
  practice:      id => `/student/learn/topic/${id}`,
  mock_test:     id => `/student/quiz?mockTestId=${id}`,
  battle:        ()  => `/student/battle`,
  revision:      id => `/student/learn/topic/${id}`,
  doubt_session: ()  => `/student/doubts`,
};

const tierStyle: Record<string, { gradient: string; pill: string; text: string }> = {
  champion: { gradient: "from-amber-500 to-orange-400",  pill: "bg-amber-100",  text: "text-amber-800"  },
  diamond:  { gradient: "from-cyan-500 to-blue-400",     pill: "bg-cyan-100",   text: "text-cyan-800"   },
  platinum: { gradient: "from-violet-500 to-purple-400", pill: "bg-violet-100", text: "text-violet-800" },
  gold:     { gradient: "from-yellow-500 to-amber-400",  pill: "bg-yellow-100", text: "text-yellow-800" },
  silver:   { gradient: "from-slate-400 to-slate-300",   pill: "bg-slate-100",  text: "text-slate-700"  },
  bronze:   { gradient: "from-orange-600 to-amber-500",  pill: "bg-orange-100", text: "text-orange-800" },
  iron:     { gradient: "from-slate-500 to-slate-400",   pill: "bg-slate-100",  text: "text-slate-700"  },
};

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLevel(xp: number) {
  const level    = Math.floor(xp / 1000) + 1;
  const progress = (xp % 1000) / 10;
  const xpToNext = 1000 - (xp % 1000);
  return { level, progress, xpToNext };
}

interface BadgeDef {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pill: string;
  iconColor: string;
}

function getEarnedBadges(streak: number, xp: number, tests: number, accuracy: number): BadgeDef[] {
  const b: BadgeDef[] = [];
  if (streak  >= 3)  b.push({ icon: Flame,       label: "On Fire",      pill: "bg-orange-100", iconColor: "text-orange-600" });
  if (streak  >= 7)  b.push({ icon: Zap,         label: "Week Warrior", pill: "bg-amber-100",  iconColor: "text-amber-600"  });
  if (xp      >= 1000) b.push({ icon: Star,       label: "1K XP Club",  pill: "bg-yellow-100", iconColor: "text-yellow-600" });
  if (xp      >= 5000) b.push({ icon: Trophy,     label: "XP Legend",   pill: "bg-violet-100", iconColor: "text-violet-600" });
  if (tests   >= 10)  b.push({ icon: BookOpen,    label: "Test Taker",   pill: "bg-blue-100",   iconColor: "text-blue-700"   });
  if (tests   >= 50)  b.push({ icon: Award,       label: "Quiz Master",  pill: "bg-cyan-100",   iconColor: "text-cyan-700"   });
  if (accuracy >= 70) b.push({ icon: Target,      label: "Sharpshooter", pill: "bg-green-100",  iconColor: "text-green-700"  });
  if (accuracy >= 85) b.push({ icon: CheckCircle, label: "Top Scorer",   pill: "bg-teal-100",   iconColor: "text-teal-700"   });
  return b;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_16px_rgba(1,56,137,0.06)] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function TaskRow({ item, index }: { item: StudyPlanItem; index: number }) {
  const navigate = useNavigate();
  const complete = useCompletePlanItem();
  const isDone   = item.status === "completed";
  const isSkip   = item.status === "skipped";
  const ts       = typeStyle[item.type] ?? { bg: "bg-blue-50", text: "text-blue-700" };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
        ${isDone || isSkip ? "opacity-40" : "hover:bg-[#F0F6FF]"}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ts.bg} ${ts.text}`}>
        {typeIcon[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />{item.estimatedMinutes}m
          </span>
          {item.xpReward && (
            <span className="text-[11px] font-bold text-amber-500">+{item.xpReward} XP</span>
          )}
        </div>
      </div>
      {isDone ? (
        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
      ) : isSkip ? (
        <span className="text-[11px] text-gray-400 px-2 py-0.5 rounded-full bg-gray-100 shrink-0">Skip</span>
      ) : (
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
            onClick={() => navigate(typeNav[item.type](item.refId))}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: BLUE_L }}
          >
            <Play className="w-3 h-3" style={{ color: BLUE }} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const StudentDashboard = () => {
  const [showProgress, setShowProgress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuthStore();
  const navigate = useNavigate();

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
  const fullName = me?.fullName ?? user?.name ?? "Student";
  const studentId = student?.id ? `STU-${student.id.slice(0, 8).toUpperCase()}` : "STU-000000";

  // ── Recharts data ──
  const performanceData = subjects.slice(0, 6).map(([subj, acc], i) => ({
    subject: subj.length > 6 ? subj.slice(0, 6) : subj,
    grade: Math.round(Number(acc) * 2),       // map accuracy% → fictive grade
    label: subj,
  }));

  if (!performanceData.length) {
    const defaults = ["Maths", "English", "Science", "ICT", "Sports"];
    defaults.forEach((s, i) => performanceData.push({ subject: s, grade: 60 + i * 20, label: s }));
  }

  const attendancePct = Math.max(10, Math.min(100, planPct > 0 ? planPct : 85));
  const radialData = [{ value: attendancePct, fill: BLUE }];

  const totalAttendance  = 25;
  const lastAttendance   = 10;
  const totalAbsent      = 2;

  if (meLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-9 h-9 animate-spin" style={{ color: BLUE }} />
        <p className="text-sm text-gray-400 font-medium">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="min-h-screen p-5 sm:p-6"
      style={{ background: "#F5F7FB" }}
    >
      {/* ════════════════════════════════════════════════════════
          MAIN 3-COLUMN GRID
      ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* ──────────────────────────────────────────────────────
            LEFT COLUMN  (col-span-3)
        ────────────────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">

          {/* ── Logo / EDVA Branding ── */}
          <motion.div variants={stagger.item}>
            <SectionCard className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}
                >
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-base text-gray-900 leading-tight">EDVA</p>
                  <p className="text-[10px] font-semibold" style={{ color: BLUE_M }}>
                    Education Plus Advancement
                  </p>
                </div>
              </div>

              {/* Quick-nav icons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Dashboard",   icon: BarChart3,  path: "/student",             bg: BLUE_L, color: BLUE    },
                  { label: "Students",    icon: Users,      path: "/student/leaderboard",  bg: "#FFF3E0", color: "#F57C00" },
                  { label: "Attendance",  icon: Calendar,   path: "/student/study-plan",   bg: "#E8F5E9", color: "#2E7D32" },
                  { label: "Report",      icon: Layers,     path: "/student/learn",         bg: "#F3E5F5", color: "#7B1FA2" },
                  { label: "Notices",     icon: Bell,       path: "/student/notifications", bg: "#FBE9E7", color: "#BF360C" },
                ].map((a) => (
                  <motion.button
                    key={a.label}
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(a.path)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: a.bg }}
                    >
                      <a.icon className="w-4 h-4" style={{ color: a.color }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{a.label}</span>
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/student/doubts")}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50">
                    <MessageSquare className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Doubts</span>
                </motion.button>
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Daily Streak Banner ── */}
          <motion.div variants={stagger.item}>
            <SectionCard className="p-4 border-orange-100/30 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFAF0 100%)' }}>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.3)] text-white shrink-0">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <p className="font-black text-gray-900 text-sm">{streak} Day Streak!</p>
                  <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">Complete a lesson today<br/>to keep it going</p>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Help Center / Settings ── */}
          <motion.div variants={stagger.item}>
            <SectionCard className="p-3">
              {[
                { label: "Help Center", icon: HelpCircle, path: "/student/doubts"  },
                { label: "Settings",    icon: Target,     path: "/student/profile"  },
                { label: "Sign Out",    icon: LogOut,     path: null                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => item.path ? navigate(item.path) : {}}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </SectionCard>
          </motion.div>
        </div>

        {/* ──────────────────────────────────────────────────────
            MIDDLE COLUMN  (col-span-6)
        ────────────────────────────────────────────────────── */}
        <div className="xl:col-span-6 space-y-4">

          {/* ── Top Header Row ── */}
          <motion.div variants={stagger.item} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black text-gray-900">{studentId}</p>
              <p className="text-xs text-gray-400 font-medium">Student unique identifier</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/student/notifications")}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center bg-white relative hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => navigate("/student/notifications")}
                className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-4 h-4 text-gray-400" />
                {(unread?.count ?? 0) > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                    style={{ background: "#EF4444" }}
                  >
                    {unread!.count > 9 ? "9+" : unread!.count}
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {/* ── Student Profile Card ── */}
          <motion.div variants={stagger.item}>
            <SectionCard className="p-5">
              <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden text-white text-2xl font-black shadow-md"
                    style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}
                  >
                    {me?.profilePictureUrl
                      ? <img src={me.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                      : name.charAt(0)}
                  </div>
                  {streak >= 3 && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h1 className="text-lg font-black text-gray-900 leading-tight">{fullName}</h1>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="font-semibold text-gray-700">ID</span> {studentId}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user?.phone || "+91 XXXXXXXXXX"}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user?.email || me?.email || "student@edva.in"}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {student?.examTarget || "India"}
                        </span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mini stats */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {[
                      { icon: Calendar,  value: `${totalAttendance} Days`, label: "Total Attendance", color: BLUE     },
                      { icon: CheckCircle, value: `${lastAttendance} Days`, label: "Last Attendance",  color: "#059669" },
                      { icon: Flame,     value: `${totalAbsent} Days`,    label: "Total Absent",     color: "#EF4444" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "#F8FAFF" }}>
                        <s.icon className="w-3.5 h-3.5 shrink-0" style={{ color: s.color }} />
                        <div>
                          <p className="text-xs font-black text-gray-900">{s.value}</p>
                          <p className="text-[10px] text-gray-400">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Learning & Classes Hub ── */}
          <div className="space-y-5">
            <div className="flex items-center justify-between mt-2">
              <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: BLUE_L }}>
                   <Video className="w-4 h-4" style={{ color: BLUE }} />
                </div>
                Active Learning Hub
              </h2>
              <div className="hidden sm:flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-gray-900 shadow-sm border border-gray-200/50">Live</button>
                <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900">Recorded</button>
              </div>
            </div>

            <div className="w-full flex flex-col gap-6">
              {/* Up Next Banner */}
              {nextAction ? (
                <motion.div variants={stagger.item} className="w-full">
                  <div 
                    onClick={() => {
                        const navFn = typeNav[nextAction.type];
                        if (navFn) navigate(navFn(nextAction.refId));
                    }}
                    className="relative overflow-hidden rounded-[1.5rem] bg-gray-900 shadow-[0_12px_24px_rgba(0,0,0,0.15)] border border-gray-800 group h-full cursor-pointer flex flex-col justify-end min-h-[260px] sm:min-h-[300px] border-b-4 border-b-blue-500 hover:border-b-blue-400 transition-all"
                  >
                    <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800" alt="Session" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 group-hover:opacity-40 transition-all duration-700 pointer-events-none" />
                    
                    {/* Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500" />
                    
                    {/* Top Status */}
                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                      <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-blue-500">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> RECOMMENDED NEXT
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 z-20">
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                         {nextAction.type?.replace("_", " ") ?? "TASK"}
                       </span>
                    </div>

                    {/* Play Button Overlay centered visually but animates */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:scale-110 transition-transform cursor-pointer">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                    </div>

                    {/* Content Bottom */}
                    <div className="relative z-20 p-5 sm:p-6 w-full mt-auto">
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight tracking-tight">{nextAction.title}</h2>
                      <p className="text-sm text-gray-300 font-medium flex items-center gap-3 mb-5">
                         <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400"/> {nextAction.estimatedMinutes}m duration</span>
                         •
                         <span className="flex items-center gap-1.5 text-amber-400">+{nextAction.xpReward ?? 0} XP</span>
                      </p>
                      <button className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-black hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2 group-hover:ring-4 ring-white/20">
                         Start Task <ArrowUpRight className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full relative overflow-hidden rounded-[1.5rem] bg-gray-50 border border-gray-200 border-dashed h-[160px] flex items-center justify-center flex-col gap-2">
                   <Target className="w-8 h-8 text-gray-300" />
                   <p className="text-sm font-bold text-gray-400">No pressing tasks up next</p>
                </div>
              )}

              {/* Upcoming Classes Slider */}
              <motion.div variants={stagger.item} className="mt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" /> Upcoming Tasks & Lessons
                  </h3>
                  <div className="flex gap-1.5">
                     <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-white hover:text-blue-600 transition-colors shadow-sm bg-gray-50"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                     <button className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-white hover:text-blue-600 transition-colors shadow-sm bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Horizontal Slider */}
                <div 
                  className="flex gap-4 overflow-x-auto pb-4 snap-x relative z-10" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <style>{`
                    .overflow-x-auto::-webkit-scrollbar { display: none; }
                  `}</style>
                  
                  {plan && plan.filter(p => p.status === 'pending').length > 0 ? (
                    plan.filter(p => p.status === 'pending').map((cls) => (
                      <div 
                        key={cls.id} 
                        onClick={() => {
                            const navFn = typeNav[cls.type];
                            if (navFn) navigate(navFn(cls.refId));
                        }}
                        className="flex-shrink-0 w-[240px] sm:w-[260px] p-4 rounded-[1.25rem] border border-gray-200/80 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group cursor-pointer bg-white snap-center flex flex-col h-full"
                      >
                         <div className="flex items-start justify-between mb-3">
                           <div className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-tight ${cls.type && typeStyle[cls.type] ? typeStyle[cls.type].text : "text-gray-700"} ${cls.type && typeStyle[cls.type] ? typeStyle[cls.type].bg : "bg-gray-100"}`}>
                             {cls.type?.replace("_", " ")?.toUpperCase() ?? "TASK"}
                           </div>
                           {cls.scheduledDate && (
                             <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{new Date(cls.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           )}
                         </div>
                         <h4 className="text-[13px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-3 leading-snug">{cls.title}</h4>
                         
                         <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                           <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded-lg">
                             <Award className="w-3.5 h-3.5" /> +{cls.xpReward ?? 0} XP
                           </div>
                           <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                             <Clock className="w-3 h-3 text-gray-500" /> {cls.estimatedMinutes}m
                           </div>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full flex items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl">
                      <p className="text-sm font-semibold text-gray-400">No upcoming tasks. You're all caught up!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── Academic Performance Chart ── */}

        </div>

        {/* ──────────────────────────────────────────────────────
            RIGHT COLUMN  (col-span-3)
        ────────────────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">

          {/* ── Search ── */}
          <motion.div variants={stagger.item}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 shadow-sm"
              />
            </div>
          </motion.div>

          {/* ── Grades & Assignments Section ── */}
          <motion.div variants={stagger.item}>
            <SectionCard className="overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-bold text-gray-900 text-sm">Grades & Assignments</h2>
                <div className="flex gap-1">
                  <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                    <Users className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grades Table */}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  <span>Subject</span>
                  <span>Last</span>
                  <span>Avg</span>
                  <span>Status</span>
                </div>
                {subjects.length > 0 ? subjects.slice(0, 4).map(([subj, acc], i) => {
                  const pct = Math.round(Number(acc));
                  const lastGrade = pct >= 85 ? "A" : pct >= 70 ? "B+" : pct >= 55 ? "B" : "C";
                  const avgGrade  = pct >= 80 ? "A" : pct >= 65 ? "B+" : pct >= 50 ? "B" : "C";
                  const status    = pct >= 70 ? "Improved" : pct >= 50 ? "Stable" : "At Risk";
                  const color     = pct >= 70 ? "#059669"  : pct >= 50 ? "#F59E0B" : "#EF4444";
                  return (
                    <div
                      key={subj}
                      className="grid grid-cols-4 items-center py-2 border-t border-gray-50 first:border-t-0 px-1"
                    >
                      <span className="text-xs font-semibold text-gray-800 truncate">{subj}</span>
                      <span className="text-xs font-bold text-gray-700">{lastGrade}</span>
                      <span className="text-xs font-bold text-gray-700">{avgGrade}</span>
                      <span className="text-[11px] font-bold" style={{ color }}>{status}</span>
                    </div>
                  );
                }) : (
                  <>
                    {[
                      { subj: "Mathematics", last: "A",  avg: "B+", status: "Improved", color: "#059669" },
                      { subj: "English",     last: "B+", avg: "B",  status: "Stable",   color: "#F59E0B" },
                      { subj: "Science",     last: "C",  avg: "A",  status: "Improved", color: "#059669" },
                      { subj: "Sports",      last: "A",  avg: "A",  status: "Improved", color: "#059669" },
                    ].map((r) => (
                      <div key={r.subj} className="grid grid-cols-4 items-center py-2 border-t border-gray-50 first:border-t-0 px-1">
                        <span className="text-xs font-semibold text-gray-800 truncate">{r.subj}</span>
                        <span className="text-xs font-bold text-gray-700">{r.last}</span>
                        <span className="text-xs font-bold text-gray-700">{r.avg}</span>
                        <span className="text-[11px] font-bold" style={{ color: r.color }}>{r.status}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mx-4 my-1" />

              {/* Assignments */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 mt-2">
                  <span>Subject</span>
                  <span className="col-span-1">Task</span>
                  <span>Due</span>
                  <span>Status</span>
                </div>
                {[
                  { subj: "Maths",   task: "Geometry",        due: "Oct 31", status: "Completed", color: "#059669" },
                  { subj: "English", task: "Char. Profile",   due: "Nov 05", status: "Pending",   color: "#EF4444" },
                ].map((a) => (
                  <div key={a.task} className="grid grid-cols-4 items-start py-2 border-t border-gray-50 px-1">
                    <span className="text-xs font-semibold text-gray-800">{a.subj}</span>
                    <span className="text-xs text-gray-600 col-span-1">{a.task}</span>
                    <span className="text-[11px] text-gray-400">{a.due}</span>
                    <span className="text-[11px] font-bold" style={{ color: a.color }}>{a.status}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Recent Notice + XP Gamification ── */}
          <motion.div variants={stagger.item}>
            <SectionCard className="overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h2 className="font-bold text-gray-900 text-sm">Recent Notice</h2>
              </div>

              {/* Notice item */}
              <div className="px-5 pb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}
                  >
                    T
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Your Teacher</p>
                    <p className="text-[10px] text-gray-400">Subject Teacher</p>
                  </div>
                  <button className="text-xs font-bold flex items-center gap-0.5 shrink-0" style={{ color: BLUE }}>
                    + Comment
                  </button>
                </div>

                <div
                  className="rounded-xl p-3 mb-3"
                  style={{ background: BLUE_L }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold" style={{ color: BLUE }}>
                      {nextAction?.title || "Study Session"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {nextAction
                      ? `Continue your ${nextAction.title}. Estimated time: ${nextAction.estimatedMinutes} minutes. You're doing great — keep up the momentum!`
                      : "Your education path is an adventure filled with challenges, opportunities, and endless possibilities. Embrace each moment, stay focused."}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {xp > 0 ? Math.floor(xp / 100) : 10}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-400" /> {streak}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{badges.length + 24} comments</span>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Battle Arena CTA ── */}
          <motion.div variants={stagger.item}>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(239,68,68,0.15)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/student/battle")}
              className="w-full relative overflow-hidden bg-white rounded-2xl border border-red-100 p-4 text-left group shadow-[0_2px_12px_rgba(239,68,68,0.06)] transition-all hover:border-red-200"
            >
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-red-50 blur-xl pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <Swords className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">Battle Arena</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {daily?.topicName ? `Daily: ${daily.topicName}` : "Challenge & win XP"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.button>
          </motion.div>

          {/* ── Achievements ── */}
          {/* <motion.div variants={stagger.item}>
            <SectionCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" /> Achievements
                </h3>
                <span className="text-xs text-gray-400">{badges.length} earned</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {badges.slice(0, 4).map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.06, y: -1 }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl ${badge.pill} cursor-default`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Icon className={`w-3.5 h-3.5 ${badge.iconColor}`} />
                      </div>
                      <p className={`text-[9px] font-bold ${badge.iconColor} text-center leading-tight`}>{badge.label}</p>
                    </motion.div>
                  );
                })}
                {Array.from({ length: Math.max(0, 4 - badges.length) }).map((_, i) => (
                  <div key={`lock-${i}`} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                    <p className="text-[9px] font-bold text-gray-300 text-center">Locked</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div> */}

          {/* ── XP Level Bar ── */}
          {/* <motion.div variants={stagger.item}>
            <SectionCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BLUE_L }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: BLUE }} />
                  </div>
                  <span className="text-sm font-black text-gray-900">Level {level}</span>
                </div>
                <span className="text-xs font-semibold text-gray-400">{xpToNext} XP to next</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: BLUE_L }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${BLUE}, ${BLUE_M})` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 text-right font-medium">{xp.toLocaleString()} XP total</p>
            </SectionCard>
          </motion.div> */}
        </div>
      </div>

      {/* ── Detailed Progress Report (collapsible) ── */}
      {/* <motion.div variants={stagger.item} className="mt-5">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-[0_2px_12px_rgba(1,56,137,0.06)]">
          <button
            onClick={() => setShowProgress(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BLUE_L }}>
                <BarChart3 className="w-4 h-4" style={{ color: BLUE }} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 text-sm">Detailed Progress Report</p>
                <p className="text-xs text-gray-400">Subject → Chapter → Topic breakdown</p>
              </div>
            </div>
            <motion.div animate={{ rotate: showProgress ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </motion.div>
          </button>
          {showProgress && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">
              <ProgressReportTree />
            </div>
          )}
        </div>
      </motion.div> */}
    </motion.div>
  );
};

export default StudentDashboard;
