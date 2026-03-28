import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame, Swords, Trophy, Brain, BookOpen, Video,
  Zap, ChevronRight, CheckCircle, Target,
  Loader2, Bell, Play, RefreshCw, MessageSquare,
  TrendingUp, Clock, Award, ArrowUpRight, Sparkles,
  Calendar, BarChart3, HelpCircle, CircleDot,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  useStudentMe, useTodaysPlan, useMyPerformance,
  useLeaderboard, useCompletePlanItem, useDailyBattle,
  useNextAction,
} from "@/hooks/use-student";
import ProgressReportTree from "@/components/shared/ProgressReportTree";
import {
  useUnreadNotificationCount,
} from "@/hooks/use-teacher";
import { StudyPlanItem, PlanItemType } from "@/lib/api/student";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeIcon: Record<PlanItemType, React.ReactNode> = {
  lecture:        <Video className="w-4 h-4" />,
  practice:       <Brain className="w-4 h-4" />,
  mock_test:      <BookOpen className="w-4 h-4" />,
  battle:         <Swords className="w-4 h-4" />,
  revision:       <RefreshCw className="w-4 h-4" />,
  doubt_session:  <MessageSquare className="w-4 h-4" />,
};

const typeColor: Record<PlanItemType, string> = {
  lecture:        "text-blue-400 bg-blue-500/10",
  practice:       "text-violet-400 bg-violet-500/10",
  mock_test:      "text-amber-400 bg-amber-500/10",
  battle:         "text-red-400 bg-red-500/10",
  revision:       "text-teal-400 bg-teal-500/10",
  doubt_session:  "text-pink-400 bg-pink-500/10",
};

const typeNav: Record<PlanItemType, (refId: string) => string> = {
  lecture:        id => `/student/lectures/${id}`,
  practice:       id => `/student/learn/topic/${id}`,
  mock_test:      id => `/student/quiz?mockTestId=${id}`,
  battle:         ()  => `/student/battle`,
  revision:       id => `/student/learn/topic/${id}`,
  doubt_session:  ()  => `/student/doubts`,
};

const tierConfig: Record<string, { gradient: string; bg: string; text: string }> = {
  champion: { gradient: "from-amber-400 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-400" },
  diamond:  { gradient: "from-cyan-400 to-blue-500",    bg: "bg-cyan-500/10",   text: "text-cyan-400" },
  platinum: { gradient: "from-violet-400 to-purple-600", bg: "bg-violet-500/10", text: "text-violet-400" },
  gold:     { gradient: "from-yellow-400 to-amber-500",  bg: "bg-yellow-500/10", text: "text-yellow-400" },
  silver:   { gradient: "from-slate-300 to-slate-500",   bg: "bg-slate-500/10",  text: "text-slate-400" },
  bronze:   { gradient: "from-amber-700 to-orange-800",  bg: "bg-orange-500/10", text: "text-orange-400" },
  iron:     { gradient: "from-slate-500 to-slate-700",   bg: "bg-slate-500/10",  text: "text-slate-400" },
};

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
};

// ─── Animated Circular Progress ──────────────────────────────────────────────

function CircularProgress({ value, size = 56, stroke = 5, color = "#6366f1" }: {
  value: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        className="text-border" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }} />
    </svg>
  );
}

// ─── Plan Task Row ──────────────────────────────────────────────────────────

function TaskRow({ item }: { item: StudyPlanItem }) {
  const navigate  = useNavigate();
  const complete  = useCompletePlanItem();
  const isDone    = item.status === "completed";
  const isSkipped = item.status === "skipped";
  const classes   = typeColor[item.type] ?? "text-primary bg-primary/10";

  const handleDone = () => complete.mutate(item.id, {
    onSuccess: () => toast.success("Task complete! +XP"),
    onError:   () => toast.error("Failed"),
  });

  return (
    <motion.div variants={stagger.item}
      className={`group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 transition-all ${isDone || isSkipped ? "opacity-40" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${classes}`}>
        {typeIcon[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{item.estimatedMinutes}m</span>
          {item.xpReward && <span className="text-xs text-amber-400 font-medium">+{item.xpReward} XP</span>}
        </div>
      </div>
      {isDone ? (
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : isSkipped ? (
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">Skipped</span>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleDone} disabled={complete.isPending}
            className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
            {complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button onClick={() => navigate(typeNav[item.type](item.refId))}
            className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
            <Play className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub, onClick }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; sub?: string; onClick?: () => void;
}) {
  const Wrapper = onClick ? motion.button : motion.div;
  return (
    <Wrapper variants={stagger.item} onClick={onClick}
      className={`bg-card border border-border rounded-2xl p-4 text-left ${onClick ? "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer" : ""} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {onClick && <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
    </Wrapper>
  );
}

// ─── Subject Progress Bar ───────────────────────────────────────────────────

const subjectColors = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function SubjectBar({ name, accuracy, index }: { name: string; accuracy: number; index: number }) {
  const color = subjectColors[index % subjectColors.length];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-sm font-medium text-foreground">{name}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{accuracy.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${accuracy}%` }}
          transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const StudentDashboard = () => {
  const [showProgress, setShowProgress] = useState(false);
  const { user }          = useAuthStore();
  const navigate          = useNavigate();

  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: plan, isLoading: planLoading } = useTodaysPlan();
  const { data: perf }       = useMyPerformance();
  const { data: lb }         = useLeaderboard({ scope: "global" });
  const { data: unread }     = useUnreadNotificationCount();
  const { data: daily }      = useDailyBattle();
  const { data: nextAction } = useNextAction();
  const student   = me?.student;
  const tier      = student?.currentEloTier?.toLowerCase() ?? "iron";
  const tc        = tierConfig[tier] ?? tierConfig.iron;
  const streak    = student?.streakDays ?? 0;
  const longest   = student?.longestStreak ?? streak;
  const xp        = student?.xpPoints ?? 0;
  const accuracy  = perf?.overallAccuracy ?? 0;
  const rank      = lb?.currentStudentRank?.rank;
  const weakTopics = perf?.weakTopics ?? [];

  const completed = plan?.filter(i => i.status === "completed").length ?? 0;
  const total     = plan?.length ?? 0;
  const planPct   = total > 0 ? Math.round((completed / total) * 100) : 0;

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name      = me?.fullName?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "Student";

  const subjects  = perf?.subjectAccuracy ? Object.entries(perf.subjectAccuracy) : [];

  if (meLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tc.gradient} p-[2px]`}>
              <div className="w-full h-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
                {me?.profilePictureUrl
                  ? <img src={me.profilePictureUrl} className="w-full h-full object-cover" alt="" />
                  : <span className="text-xl font-bold text-foreground">{name.charAt(0)}</span>}
              </div>
            </div>
            {streak >= 3 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-card flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{greeting}, {name}!</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
              </span>
              <span className="text-muted-foreground/30">|</span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${tc.bg} ${tc.text}`}>
                <Trophy className="w-3 h-3" />
                <span className="capitalize">{tier}</span>
              </span>
              {student?.examTarget && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="text-xs text-muted-foreground font-medium">{student.examTarget} {student.examYear && `'${String(student.examYear).slice(-2)}`}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button onClick={() => navigate("/student/notifications")}
          className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors shrink-0">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {(unread?.count ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-background">
              {unread!.count > 9 ? "9+" : unread!.count}
            </span>
          )}
        </button>
      </motion.div>

      {/* ── Stat Cards Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Day Streak" value={`${streak}d`} sub={`Best: ${longest}d`}
          icon={<Flame className="w-5 h-5 text-amber-400" />}
          color="bg-amber-500/10"
        />
        <StatCard
          label="Total XP" value={xp > 9999 ? `${(xp / 1000).toFixed(1)}k` : xp.toLocaleString()}
          icon={<Zap className="w-5 h-5 text-primary" />}
          color="bg-primary/10"
        />
        <StatCard
          label="Global Rank" value={rank ? `#${rank}` : "—"}
          icon={<Award className="w-5 h-5 text-blue-400" />}
          color="bg-blue-500/10"
          onClick={() => navigate("/student/leaderboard")}
        />
        <StatCard
          label="Accuracy" value={`${accuracy.toFixed(0)}%`} sub={`${perf?.totalTestsTaken ?? 0} tests`}
          icon={<Target className="w-5 h-5 text-emerald-400" />}
          color="bg-emerald-500/10"
        />
      </div>

      {/* ── Next Action Banner ────────────────────────────────────────────── */}
      {nextAction && (
        <motion.div variants={stagger.item}
          className="flex items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl px-5 py-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${typeColor[nextAction.type]}`}>
            {typeIcon[nextAction.type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-0.5">Continue where you left off</p>
            <p className="text-sm font-bold text-foreground truncate">{nextAction.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />{nextAction.estimatedMinutes}m
              {nextAction.xpReward && <span className="text-amber-400 font-medium ml-1">· +{nextAction.xpReward} XP</span>}
            </p>
          </div>
          <button
            onClick={() => navigate(typeNav[nextAction.type](nextAction.refId))}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Start
          </button>
        </motion.div>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ═══ Left: Today's Plan ═══ */}
        <motion.div variants={stagger.item} className="lg:col-span-5 xl:col-span-5">
          <div className="bg-card border border-border rounded-2xl overflow-hidden h-full flex flex-col">
            {/* Plan header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-foreground">Today's Plan</h2>
                {total > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {completed}/{total}
                  </span>
                )}
              </div>
              <button onClick={() => navigate("/student/study-plan")}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Circular progress + percentage */}
            {total > 0 && (
              <div className="flex items-center gap-4 px-5 pb-4">
                <div className="relative">
                  <CircularProgress value={planPct} size={52} stroke={5}
                    color={planPct === 100 ? "#10b981" : "#6366f1"} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                    {planPct}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {planPct === 100 ? "All done! Great work." : planPct >= 50 ? "Good progress, keep going!" : "Let's get started!"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {total - completed} task{total - completed !== 1 ? "s" : ""} remaining today
                  </p>
                </div>
              </div>
            )}

            {/* Task list */}
            <div className="flex-1 px-2 pb-3 overflow-y-auto max-h-[360px]">
              {planLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : !plan?.length ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No tasks scheduled</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate a personalized AI study plan</p>
                  <button onClick={() => navigate("/student/study-plan")}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                    <Sparkles className="w-3.5 h-3.5" /> Generate Plan
                  </button>
                </div>
              ) : (
                <motion.div variants={stagger.container} initial="hidden" animate="show">
                  {plan.slice(0, 6).map(item => <TaskRow key={item.id} item={item} />)}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ Center: Performance + Subjects ═══ */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-5">
          {/* Subject Performance */}
          <motion.div variants={stagger.item} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Subject Performance
              </h2>
              <button onClick={() => navigate("/student/learn")}
                className="text-xs text-primary font-semibold hover:underline">Study</button>
            </div>
            {subjects.length > 0 ? (
              <div className="space-y-4">
                {subjects.slice(0, 5).map(([subj, acc], i) => (
                  <SubjectBar key={subj} name={subj} accuracy={Number(acc)} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Take tests to see performance</p>
              </div>
            )}
          </motion.div>

          {/* Accuracy Ring */}
          <motion.div variants={stagger.item} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Overall Progress
            </h3>
            <div className="flex items-center gap-5">
              <div className="relative">
                <CircularProgress value={accuracy} size={80} stroke={7}
                  color={accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444"} />
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
                  {accuracy.toFixed(0)}%
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <CircleDot className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-muted-foreground">{perf?.totalTestsTaken ?? 0} tests taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <CircleDot className="w-3 h-3 text-primary" />
                  <span className="text-xs text-muted-foreground">{xp.toLocaleString()} total XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <CircleDot className="w-3 h-3 text-amber-400" />
                  <span className="text-xs text-muted-foreground">{streak} day streak</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══ Right: Weak Topics + Quick Actions ═══ */}
        <div className="lg:col-span-3 xl:col-span-3 space-y-5">
          {/* Weak Topics */}
          <motion.div variants={stagger.item} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" /> Focus Areas
              </h3>
            </div>
            {weakTopics.length > 0 ? (
              <div className="space-y-2.5">
                {weakTopics.slice(0, 5).map(wt => (
                  <div key={wt.topicId} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${wt.accuracy < 40 ? "bg-red-400" : wt.accuracy < 60 ? "bg-amber-400" : "bg-yellow-400"}`} />
                    <p className="text-xs text-foreground truncate flex-1">{wt.topicName}</p>
                    <span className={`text-xs font-bold tabular-nums ${wt.accuracy < 40 ? "text-red-400" : wt.accuracy < 60 ? "text-amber-400" : "text-yellow-400"}`}>
                      {wt.accuracy.toFixed(0)}%
                    </span>
                  </div>
                ))}
                <button onClick={() => navigate("/student/learn")}
                  className="w-full mt-2 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" /> Practice Weak Topics
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400/40" />
                <p className="text-xs">No weak areas found</p>
              </div>
            )}
          </motion.div>

          {/* Daily Battle / Battle CTA */}
          <motion.div variants={stagger.item}>
            <button onClick={() => navigate("/student/battle")}
              className="w-full bg-gradient-to-br from-red-500/15 via-violet-500/10 to-blue-500/15 border border-red-500/20 rounded-2xl p-4 text-left hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/5 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-red-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="font-bold text-foreground text-sm">Battle Arena</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {daily?.topicName ? `Daily: ${daily.topicName}` : "Challenge others, win XP"}
              </p>
              {daily?.playerCount && (
                <p className="text-[11px] text-red-400/70 mt-1 font-medium">{daily.playerCount} players online</p>
              )}
            </button>
          </motion.div>

          {/* Quick Nav Grid */}
          <motion.div variants={stagger.item} className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-bold text-sm text-foreground mb-3">Quick Access</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Learn",       icon: BookOpen,       path: "/student/learn",        bg: "bg-indigo-500/10", color: "text-indigo-400" },
                { label: "Doubts",      icon: HelpCircle,     path: "/student/doubts",       bg: "bg-amber-500/10",  color: "text-amber-400" },
                { label: "Study Plan",  icon: Calendar,       path: "/student/study-plan",   bg: "bg-emerald-500/10",color: "text-emerald-400" },
                { label: "Leaderboard", icon: Trophy,         path: "/student/leaderboard",  bg: "bg-blue-500/10",   color: "text-blue-400" },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center`}>
                    <a.icon className={`w-4.5 h-4.5 ${a.color}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Progress Report ───────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowProgress(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold text-foreground text-sm">Detailed Progress Report</p>
              <p className="text-xs text-muted-foreground">Subject → Chapter → Topic breakdown</p>
            </div>
          </div>
          <motion.div animate={{ rotate: showProgress ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
          </motion.div>
        </button>
        {showProgress && (
          <div className="px-5 pb-5 border-t border-border pt-4">
            <ProgressReportTree />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StudentDashboard;
