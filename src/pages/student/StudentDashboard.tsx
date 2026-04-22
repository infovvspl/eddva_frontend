import { Loader2, BookOpen, ChevronRight, Flame, Zap, Trophy, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStudentMe, useMyCourses, useStudentDashboard, useMyPerformance } from "@/hooks/use-student";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import student from "@/assets/undraw_studying-science_kk9e.svg"
import StatsGrid from "@/components/student/dashboard/StatsGrid";
import ContinueLearning from "@/components/student/dashboard/ContinueLearning";
import TodayStudyPlan from "@/components/student/dashboard/TodayStudyPlan";
import PerformanceChart from "@/components/student/dashboard/PerformanceChart";
import LeaderboardPreview from "@/components/student/dashboard/LeaderboardPreview";
import Recommendations from "@/components/student/dashboard/Recommendations";
import QuickActions from "@/components/student/dashboard/QuickActions";
import { getApiOrigin } from "@/lib/api-config";

// ── Helpers ───────────────────────────────────────────────────────────────────
const _API_ORIGIN = getApiOrigin();

function resolveUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

const EXAM_COLORS: Record<string, string> = {
  jee:     "from-orange-500 to-red-600",
  neet:    "from-emerald-500 to-teal-600",
  cbse_10: "from-blue-500 to-indigo-600",
  cbse_12: "from-violet-500 to-purple-600",
  default: "from-indigo-500 to-purple-600",
};

function examGradient(t?: string) {
  return EXAM_COLORS[(t ?? "").toLowerCase()] ?? EXAM_COLORS.default;
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  title, action, actionLabel, children, className,
}: {
  title: string;
  action?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {action && (
          <button onClick={action} className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
            {actionLabel ?? "See all"} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-5 gap-4">
        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-12 gap-6">
        <Skeleton className="col-span-8 h-64 rounded-2xl" />
        <Skeleton className="col-span-4 h-64 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: rawCourses = [], isLoading: coursesLoading } = useMyCourses();
  const { data: dash, isLoading: dashLoading } = useStudentDashboard();
  const { data: perf, isLoading: perfLoading } = useMyPerformance();

  const isLoading = meLoading || coursesLoading || dashLoading || perfLoading;

  if (isLoading) return <DashboardSkeleton />;

  const firstName         = me?.fullName?.split(" ")[0] || "Student";
  const avatar            = resolveUrl(me?.profilePictureUrl);
  const streak            = me?.student?.streakDays ?? 0;
  const xp                = me?.student?.xpPoints ?? 0;
  const tier              = me?.student?.currentEloTier ?? "Iron";
  const weakTopics = dash?.weakTopics ?? [];
  const activeExamTarget = me?.student?.examTarget || "";
  const pendingFromCourses = rawCourses.reduce((acc: number, c: any) => {
    const t = c.progress?.totalLectures ?? 0;
    const w = c.progress?.watchedLectures ?? 0;
    return acc + Math.max(0, t - w);
  }, 0);
  const pendingLectures = (dash?.pendingLectures ?? 0) > 0 ? dash!.pendingLectures : pendingFromCourses;
  const testsAttempted = Math.max(dash?.testsAttempted ?? 0, perf?.totalTestsTaken ?? 0);
  const accuracy = Math.round(dash?.overallAccuracy ?? perf?.overallAccuracy ?? 0);
  const grad              = examGradient(activeExamTarget);

  const courses = rawCourses.map((c: any) => ({
    id: c.id,
    name: c.name ?? c.title ?? "Course",
    lastLecture: c.lastAccessedAt ? new Date(c.lastAccessedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : undefined,
    progress: Math.round(c.progress?.overallPct ?? 0),
    thumbnailUrl: resolveUrl(c.thumbnailUrl),
  }));

  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((s: number, c: any) => s + c.progress, 0) / courses.length)
    : 0;

  const fade = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="space-y-6 pb-10"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* ── HERO BANNER ───────────────────────────────────────────────────── */}
<motion.div variants={fade}>
  <div className="relative rounded-3xl p-8 overflow-hidden text-white shadow-2xl 
    bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500">

    {/* Glass overlay */}
    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />

    {/* Glow effects */}
    <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl" />
    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl" />

    <div className="relative z-10 flex items-center justify-between gap-6">

      {/* LEFT CONTENT */}
      <div className="space-y-4 max-w-lg">
        
        {activeExamTarget && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 uppercase tracking-wider">
            {activeExamTarget}
          </span>
        )}

        <h1 className="text-3xl font-extrabold leading-tight">
          Welcome back, {firstName}! 👋
        </h1>

        <p className="text-white/80 text-sm">
          {courses.length > 0
            ? `You've completed ${avgProgress}% of your journey. Stay consistent 🚀`
            : "Enroll in a course to start tracking progress here."}
        </p>

        {courses.length > 0 && (
          <div className="w-56 space-y-1">
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-1000"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/60">
              {avgProgress}% overall progress
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() =>
              navigate(
                courses.length > 0
                  ? "/student/courses"
                  : "/student/courses?discover=1"
              )
            }
            className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-sm 
              hover:scale-105 hover:shadow-xl transition-all duration-200"
          >
            {courses.length > 0 ? "Continue Learning" : "Browse Courses"}
          </button>

          <button
            onClick={() => navigate("/student/tests")}
            className="px-5 py-2.5 bg-white/20 border border-white/30 text-white font-semibold rounded-xl text-sm 
              hover:bg-white/30 transition-all duration-200"
          >
            Take a Test
          </button>
        </div>
      </div>

      {/* RIGHT SIDE (SVG + STATS) */}
      <div className="hidden lg:flex items-center gap-6">

        {/* STUDENT SVG */}
        <div className="w-48">
          <img
            src={student}
            alt="student"
            className="w-full drop-shadow-2xl"
          />
        </div>

        {/* STATS */}
        <div className="flex flex-col gap-3">
          {[
            { icon: <Flame className="w-4 h-4" />, value: streak, label: "Day Streak" },
            { icon: <Zap className="w-4 h-4" />, value: xp.toLocaleString(), label: "XP Points" },
            { icon: <Trophy className="w-4 h-4" />, value: tier, label: "ELO Tier" },
          ].map((chip) => (
            <div
              key={chip.label}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl 
                bg-white/20 border border-white/20 backdrop-blur-md hover:scale-105 transition"
            >
              <span>{chip.icon}</span>
              <div>
                <p className="text-sm font-bold">{chip.value}</p>
                <p className="text-[10px] text-white/60">{chip.label}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  </div>
</motion.div>

      {/* ── STATS GRID ────────────────────────────────────────────────────── */}
      <motion.div variants={fade}>
        <StatsGrid
          coursesEnrolled={courses.length}
          pendingLectures={pendingLectures}
          testsAttempted={testsAttempted}
          accuracy={accuracy}
          streak={streak}
        />
      </motion.div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────────────────── */}
      {/* <motion.div variants={fade}>
        <Section title="Quick Actions">
          <QuickActions />
        </Section>
      </motion.div> */}

      {/* ── MAIN CONTENT GRID ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT — 8 cols */}
        <div className="lg:col-span-8 space-y-6">

          {/* Continue Learning */}
          <motion.div variants={fade}>
            <Card>
              <Section
                title="Continue Learning"
                action={() => navigate("/student/courses")}
                actionLabel="All courses"
              >
                <ContinueLearning courses={courses} />
              </Section>
            </Card>
          </motion.div>

          {/* Performance Chart */}
          <motion.div variants={fade}>
            <Card>
              <Section title="Performance Overview">
                <PerformanceChart
                  subjectAccuracy={perf?.subjectAccuracy}
                  totalTestsTaken={perf?.totalTestsTaken}
                  overallAccuracy={accuracy}
                />
              </Section>
            </Card>
          </motion.div>

          {/* Recommendations */}
          <motion.div variants={fade}>
            <Section
              title="Recommended for You"
              action={() => navigate("/student/learn")}
              actionLabel="Explore"
            >
              <Recommendations weakTopics={weakTopics} suggestions={dash?.recommendations} />
            </Section>
          </motion.div>
        </div>

        {/* RIGHT — 4 cols */}
        <div className="lg:col-span-4 space-y-6">

          {/* Today's Study Plan */}
          <motion.div variants={fade}>
            <Card>
              <Section title="Today's Study Plan" action={() => navigate("/student/study-plan")}>
                <TodayStudyPlan />
              </Section>
            </Card>
          </motion.div>

          {/* Leaderboard */}
          <motion.div variants={fade}>
            <Card>
              <Section title="Leaderboard" action={() => navigate("/student/leaderboard")}>
                <LeaderboardPreview />
              </Section>
            </Card>
          </motion.div>

          {/* My Courses mini list */}
          {courses.length > 0 && (
            <motion.div variants={fade}>
              <Card>
                <Section title="My Courses" action={() => navigate("/student/courses")}>
                  <div className="space-y-3">
                    {courses.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 cursor-pointer transition-colors"
                        onClick={() => navigate(`/student/courses/${c.id}`)}
                      >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${c.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-primary shrink-0">{c.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
