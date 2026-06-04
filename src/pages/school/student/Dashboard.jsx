import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import api from '@/lib/api/school-client';
import {
  AlertCircle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  LineChart,
  Medal,
  MessageSquare,
  PlayCircle,
  Radio,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UploadCloud,
  UserCheck,
  Video,
} from 'lucide-react';
import './Dashboard.css';

const tones = {
  blue: {
    card: 'border-blue-100 bg-blue-50/70 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300',
    icon: 'bg-blue-600 text-white',
    bar: 'bg-blue-600',
  },
  emerald: {
    card: 'border-emerald-100 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
    icon: 'bg-emerald-600 text-white',
    bar: 'bg-emerald-600',
  },
  amber: {
    card: 'border-amber-100 bg-amber-50/70 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
    icon: 'bg-amber-500 text-white',
    bar: 'bg-amber-500',
  },
  rose: {
    card: 'border-rose-100 bg-rose-50/70 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
    icon: 'bg-rose-600 text-white',
    bar: 'bg-rose-600',
  },
  violet: {
    card: 'border-violet-100 bg-violet-50/70 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-300',
    icon: 'bg-violet-600 text-white',
    bar: 'bg-violet-600',
  },
  slate: {
    card: 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
    icon: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
    bar: 'bg-slate-700 dark:bg-slate-200',
  },
};

function pct(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = 'slate' }) {
  const palette = tones[tone] || tones.slate;
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${palette.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${palette.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="mt-1 h-4 w-4 opacity-50" />
      </div>
      <p className="mt-4 text-[11px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      {detail && <p className="mt-1 text-xs font-semibold opacity-80">{detail}</p>}
    </div>
  );
}

function ProgressLine({ label, value, detail, tone = 'blue' }) {
  const palette = tones[tone] || tones.blue;
  const progress = pct(value);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
        <span className="truncate text-slate-700 dark:text-slate-300">{label}</span>
        <span className="shrink-0 text-slate-950 dark:text-white">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${progress}%` }} />
      </div>
      {detail && <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{detail}</p>}
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, tone = 'slate' }) {
  const palette = tones[tone] || tones.slate;
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${palette.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

function EmptyMini({ icon: Icon, title, text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-800 dark:bg-slate-900/50">
      <Icon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
      <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{text}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, institute } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [continueLearning, setContinueLearning] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, contRes, actRes] = await Promise.all([
          api.get('/students/dashboard'),
          api.get('/students/continue-learning').catch(() => ({ data: null })),
          api.get('/students/activity/weekly').catch(() => ({ data: null })),
        ]);

        setDashboardData(dashRes.data || null);
        setContinueLearning(contRes.data || null);
        setActivity(actRes.data || null);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const {
    overallAccuracy = 0,
    currentStreak = 0,
    xpTotal = 0,
    globalRank,
    pendingLectures = 0,
    testsAttempted = 0,
    weakTopics = [],
    recommendations = [],
    todayPlan = [],
  } = dashboardData || {};

  const subjectProgress = useMemo(() => {
    const subjects =
      dashboardData?.subjectProgress ||
      dashboardData?.subjectWiseProgress ||
      dashboardData?.subjects ||
      [];

    return subjects
      .map((subject) => ({
        name: subject.subjectName || subject.name || subject.title || 'Subject',
        progress: pct(subject.progress ?? subject.accuracy ?? subject.percentage ?? subject.score),
        detail: subject.teacherName || subject.chapterName || subject.status || '',
      }))
      .filter((subject) => subject.name);
  }, [dashboardData]);

  const notifications = dashboardData?.notifications || [];
  const attendancePct = pct(dashboardData?.attendancePercentage ?? dashboardData?.attendance?.percentage);
  const assignmentCounts = dashboardData?.assignments || {};
  const examCounts = dashboardData?.exams || {};
  const weeklyMinutes = activity?.totalMinutes ?? dashboardData?.weeklyLearningMinutes ?? 0;
  const weeklyHours = Math.floor(Number(weeklyMinutes || 0) / 60);
  const weeklyRemainder = Number(weeklyMinutes || 0) % 60;
  const aiScore = pct(dashboardData?.aiLearningScore ?? dashboardData?.aiScore ?? overallAccuracy);
  const performanceScore = pct(dashboardData?.overallPerformanceScore ?? overallAccuracy);

  const academicSummary = [
    {
      label: "Today's Classes",
      value: dashboardData?.todayClasses ?? dashboardData?.classesToday ?? 0,
      detail: 'Live and scheduled sessions',
      icon: Radio,
      tone: 'blue',
    },
    {
      label: 'Upcoming Classes',
      value: dashboardData?.upcomingClasses ?? 0,
      detail: 'Next timetable items',
      icon: Video,
      tone: 'violet',
    },
    {
      label: 'Attendance',
      value: `${attendancePct}%`,
      detail: attendancePct < 75 ? 'Needs attention' : 'On track',
      icon: UserCheck,
      tone: attendancePct < 75 ? 'rose' : 'emerald',
    },
    {
      label: 'Assignment Status',
      value: assignmentCounts.submitted ?? dashboardData?.submittedAssignments ?? 0,
      detail: 'Submitted work',
      icon: CheckCircle2,
      tone: 'emerald',
    },
    {
      label: 'Pending Homework',
      value: assignmentCounts.pending ?? dashboardData?.pendingHomework ?? 0,
      detail: 'Needs submission',
      icon: ClipboardList,
      tone: 'amber',
    },
    {
      label: 'Upcoming Exams',
      value: examCounts.upcoming ?? dashboardData?.upcomingExams ?? 0,
      detail: 'Assessment calendar',
      icon: Calendar,
      tone: 'rose',
    },
  ];

  const quickActions = [
    { label: 'Join Live Class', to: '/school/student/live-classes', icon: Radio, tone: 'blue' },
    { label: 'View Homework', to: '/school/student/assignments', icon: ClipboardList, tone: 'amber' },
    { label: 'Take Test', to: '/school/student/assessments', icon: Target, tone: 'rose' },
    { label: 'Ask AI Doubt', to: '/school/student/ai-assistant', icon: Bot, tone: 'violet' },
    { label: 'View Notes', to: '/school/student/study-materials', icon: FileText, tone: 'emerald' },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="student-dashboard space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Student Dashboard
              </span>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                School Module
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white md:text-3xl">
              Welcome back, {user?.name || 'Student'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
              Your academics, AI assistance, homework, attendance, performance, communication, and growth tools are in one place for {institute?.name || 'EDDVA'}.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={TrendingUp} label="Performance Score" value={`${performanceScore}%`} detail="Overall progress" tone="blue" />
              <MetricCard icon={Sparkles} label="AI Learning Score" value={`${aiScore}%`} detail="Personalized coaching" tone="violet" />
              <MetricCard icon={Star} label="Total XP" value={xpTotal} detail={`${currentStreak} day streak`} tone="amber" />
              <MetricCard icon={Trophy} label="Rank" value={globalRank ? `#${globalRank}` : '-'} detail="Class leaderboard" tone="emerald" />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">This Week</p>
                <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                  {weeklyHours}h {weeklyRemainder}m
                </p>
              </div>
              <LineChart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-5 space-y-3">
              <ProgressLine label="Weekly learning report" value={activity?.completionPct ?? dashboardData?.weeklyCompletion ?? 0} tone="blue" />
              <ProgressLine label="Attendance impact" value={attendancePct} tone={attendancePct < 75 ? 'rose' : 'emerald'} />
              <ProgressLine label="Tests attempted" value={testsAttempted ? Math.min(100, testsAttempted * 10) : 0} detail={`${testsAttempted} completed`} tone="amber" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {quickActions.map((action) => (
          <QuickAction key={action.label} {...action} />
        ))}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Academic Summary"
          subtitle="Classes, attendance, homework, and exams at a glance."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {academicSummary.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader
              title="My Learning"
              subtitle="Live classes, recorded lessons, materials, and subject explorer."
              action={
                <Link to="/school/student/classes" className="text-sm font-black text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Open explorer
                </Link>
              }
            />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Link to="/school/student/live-classes" className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-blue-950/20">
                <Radio className="h-7 w-7 text-blue-600" />
                <h3 className="mt-4 text-sm font-black text-slate-950 dark:text-white">Live Classes</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Join sessions, auto attendance, raise hand, polls, and quizzes.</p>
              </Link>
              <Link to="/school/student/recorded-classes" className="rounded-lg border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50 dark:border-slate-800 dark:hover:bg-violet-950/20">
                <PlayCircle className="h-7 w-7 text-violet-600" />
                <h3 className="mt-4 text-sm font-black text-slate-950 dark:text-white">Recorded Classes</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Track watch progress and resume from the last point.</p>
              </Link>
              <Link to="/school/student/study-materials" className="rounded-lg border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-emerald-950/20">
                <BookOpen className="h-7 w-7 text-emerald-600" />
                <h3 className="mt-4 text-sm font-black text-slate-950 dark:text-white">Study Materials</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Notes, PDFs, PPTs, videos, and question banks by subject.</p>
              </Link>
            </div>

            <div className="mt-5">
              {continueLearning ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex h-20 w-full shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 md:w-28">
                      {continueLearning.thumbnailUrl ? (
                        <img src={continueLearning.thumbnailUrl} alt={continueLearning.lectureTitle} className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        <Video className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Continue Learning
                      </p>
                      <h3 className="mt-1 truncate text-base font-black text-slate-950 dark:text-white">{continueLearning.lectureTitle}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {continueLearning.subjectName || 'Subject'} - {continueLearning.chapterName || 'Chapter'}
                      </p>
                      <div className="mt-3">
                        <ProgressLine label="Watch progress" value={continueLearning.watchPercentage} tone="blue" />
                      </div>
                    </div>
                    <Link to="/school/student/classes" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700">
                      Resume
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyMini icon={BookOpen} title="No lesson in progress" text="Open a class to start tracking your study journey." />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Performance Snapshot" subtitle="Subject progress, weak areas, and AI guidance." />
            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                {subjectProgress.length > 0 ? (
                  subjectProgress.slice(0, 5).map((subject, index) => (
                    <ProgressLine
                      key={`${subject.name}-${index}`}
                      label={subject.name}
                      value={subject.progress}
                      detail={subject.detail}
                      tone={['blue', 'emerald', 'amber', 'violet', 'rose'][index % 5]}
                    />
                  ))
                ) : (
                  <EmptyMini icon={BarChart3} title="Subject progress will appear here" text="Complete classes and tests to unlock reports." />
                )}
              </div>

              <div className="space-y-3">
                <MetricCard icon={Target} label="Accuracy Rate" value={`${pct(overallAccuracy)}%`} detail="Across assessments" tone="emerald" />
                <MetricCard icon={AlertCircle} label="Weak Areas" value={weakTopics.length} detail="Topics to revise" tone={weakTopics.length ? 'rose' : 'slate'} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <SectionHeader
                title="Homework & Assignments"
                subtitle="Pending, submitted, evaluated, and overdue work."
                action={<Link to="/school/student/assignments" className="text-sm font-black text-blue-600">View all</Link>}
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MetricCard icon={ClipboardList} label="Pending" value={assignmentCounts.pending ?? 0} detail="Due soon" tone="amber" />
                <MetricCard icon={UploadCloud} label="Submitted" value={assignmentCounts.submitted ?? 0} detail="Awaiting review" tone="blue" />
                <MetricCard icon={CheckCircle2} label="Evaluated" value={assignmentCounts.evaluated ?? 0} detail="Feedback ready" tone="emerald" />
                <MetricCard icon={AlertCircle} label="Overdue" value={assignmentCounts.overdue ?? 0} detail="Needs action" tone="rose" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <SectionHeader
                title="Assessments & Exams"
                subtitle="Practice, topic, unit, subject, mock, and final exams."
                action={<Link to="/school/student/assessments" className="text-sm font-black text-blue-600">Take test</Link>}
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MetricCard icon={Target} label="Practice Tests" value={examCounts.practice ?? 0} detail="Open now" tone="blue" />
                <MetricCard icon={ClipboardList} label="Topic Tests" value={examCounts.topic ?? 0} detail="Adaptive checks" tone="violet" />
                <MetricCard icon={GraduationCap} label="Mock Exams" value={examCounts.mock ?? 0} detail="Timed exams" tone="amber" />
                <MetricCard icon={Award} label="Final Exams" value={examCounts.final ?? 0} detail="Upcoming" tone="rose" />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Today's Plan" subtitle="Daily study plan and smart revision." />
            <div className="mt-5 space-y-4">
              {todayPlan?.length > 0 ? (
                todayPlan.slice(0, 5).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="flex gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.type || 'Study'} - {item.durationMinutes || 0} min
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyMini icon={Calendar} title="No plan for today" text="Generate a study plan to get daily targets." />
              )}
              <Link to="/school/student/planner" className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                Open Planner
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="AI Performance Coach" subtitle="Learning gaps and next steps." />
            <div className="mt-5 space-y-3">
              {recommendations?.length > 0 ? (
                recommendations.slice(0, 4).map((recommendation, index) => (
                  <div key={`${recommendation}-${index}`} className="flex gap-3 rounded-lg bg-violet-50 p-3 dark:bg-violet-950/20">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <p className="text-sm font-semibold leading-5 text-slate-700 dark:text-slate-300">{recommendation}</p>
                  </div>
                ))
              ) : (
                <EmptyMini icon={Sparkles} title="AI recommendations are warming up" text="More activity will unlock personalized suggestions." />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Gamification Center" subtitle="XP, level, rewards, and ranks." />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MetricCard icon={Star} label="XP" value={xpTotal} detail="Earned" tone="amber" />
              <MetricCard icon={Medal} label="Level" value={dashboardData?.level || 'Learner'} detail="Current stage" tone="violet" />
              <MetricCard icon={Award} label="Badges" value={dashboardData?.badges ?? 0} detail="Achievements" tone="emerald" />
              <MetricCard icon={Trophy} label="Rank" value={globalRank ? `#${globalRank}` : '-'} detail="Leaderboard" tone="blue" />
            </div>
            <Link to="/school/student/gamification" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
              View rewards
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Recent Notifications" subtitle="Assignments, notices, exams, and messages." />
            <div className="mt-5 space-y-3">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((note, index) => (
                  <div key={note.id || index} className="flex gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{note.title || note.message}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{note.type || 'Notification'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <EmptyMini icon={Bell} title="No new notifications" text="New assignments, notices, exam alerts, and teacher messages will appear here." />
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <Link to="/school/student/assignments" className="rounded-md bg-slate-100 px-3 py-2 text-center dark:bg-slate-800">Assignments</Link>
                    <Link to="/school/student/announcements" className="rounded-md bg-slate-100 px-3 py-2 text-center dark:bg-slate-800">Notices</Link>
                    <Link to="/school/student/assessments" className="rounded-md bg-slate-100 px-3 py-2 text-center dark:bg-slate-800">Exams</Link>
                    <Link to="/school/student/chat" className="rounded-md bg-slate-100 px-3 py-2 text-center dark:bg-slate-800">Messages</Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Link to="/school/student/attendance" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-black text-slate-800 dark:text-white">Attendance Center</span>
            </Link>
            <Link to="/school/student/chat" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-black text-slate-800 dark:text-white">Communication Center</span>
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
