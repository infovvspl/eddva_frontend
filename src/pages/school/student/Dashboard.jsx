import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import bgBanner from '@/assets/images/bgbanner4.png';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import { readStudentDashboardCache, writeStudentDashboardCache } from '@/lib/school/student-dashboard-cache';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  Atom,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BookText,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  Leaf,
  Megaphone,
  Pencil,
  Target,
  TrendingUp,
  Pi,
  Radio,
  Trophy,
  Video,
} from 'lucide-react';
import SmartCalendar from '@/components/school/SmartCalendar';
import ScoreTrendChart, { scoreTrendDelta } from '@/components/school/student/ScoreTrendChart';
import BirthdayWidget from '@/components/school/shared/BirthdayWidget';
import './Dashboard.css';

// Shared card shell so every panel on the page has the same surface.
const CARD = 'rounded-3xl border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-5';

function getSubjectConfig(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('physic')) return { Icon: Atom, color: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40', bar: 'bg-purple-500' };
  if (lower.includes('math')) return { Icon: Pi, color: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40', bar: 'bg-amber-500' };
  if (lower.includes('chem')) return { Icon: FlaskConical, color: 'text-blue-600 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40', bar: 'bg-blue-500' };
  if (lower.includes('eng')) return { Icon: BookText, color: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', bar: 'bg-emerald-500' };
  if (lower.includes('bio')) return { Icon: Leaf, color: 'text-green-600 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-950/40', bar: 'bg-green-500' };
  return { Icon: BookOpen, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', bar: 'bg-slate-500' };
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function SectionHeader({ title, subtitle, action, to, isDropdown, icon: Icon, gradient = 'from-indigo-500 to-violet-600' }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient}`}>
            <Icon size={19} />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-black text-slate-900 dark:text-white">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && to && (
        <Link to={to} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70">
          {action} <ArrowRight size={12} />
        </Link>
      )}
      {action && !to && (
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-slate-500">
          {action} {isDropdown && <ChevronRight size={12} className="rotate-90" />}
        </span>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center dark:border-slate-800 dark:bg-slate-950/30">
      <span className="grid size-11 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
        <Icon size={20} />
      </span>
      <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
      {hint && <p className="mt-0.5 text-xs font-medium text-slate-500">{hint}</p>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, to, theme }) {
  const body = (
    <>
      <span aria-hidden className={`pointer-events-none absolute -right-5 -top-5 size-20 rounded-full ${theme.circle}`} />
      <span className={`relative grid size-11 place-items-center rounded-2xl text-white shadow-md ${theme.icon}`}>
        <Icon size={20} />
      </span>
      <div className="relative mt-4 min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black leading-none text-slate-900 dark:text-white sm:text-[28px]">{value}</p>
      </div>
      <p className={`relative mt-3 inline-flex items-center gap-1 text-[11px] font-bold ${theme.link}`}>
        {hint} {to && <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />}
      </p>
    </>
  );
  const cls = `group relative flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 sm:p-5 ${theme.border}`;
  return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

const STAT_THEMES = {
  indigo: { icon: 'bg-gradient-to-br from-indigo-500 to-indigo-700', circle: 'bg-indigo-200/50 dark:bg-indigo-500/10', border: 'border-indigo-100 hover:border-indigo-300 dark:border-indigo-900/50', link: 'text-indigo-600 dark:text-indigo-300' },
  emerald: { icon: 'bg-gradient-to-br from-emerald-500 to-emerald-700', circle: 'bg-emerald-200/50 dark:bg-emerald-500/10', border: 'border-emerald-100 hover:border-emerald-300 dark:border-emerald-900/50', link: 'text-emerald-600 dark:text-emerald-300' },
  amber: { icon: 'bg-gradient-to-br from-amber-400 to-amber-600', circle: 'bg-amber-200/50 dark:bg-amber-500/10', border: 'border-amber-100 hover:border-amber-300 dark:border-amber-900/50', link: 'text-amber-600 dark:text-amber-300' },
  sky: { icon: 'bg-gradient-to-br from-sky-500 to-blue-600', circle: 'bg-sky-200/50 dark:bg-sky-500/10', border: 'border-sky-100 hover:border-sky-300 dark:border-sky-900/50', link: 'text-sky-600 dark:text-sky-300' },
};

function NextClassCard({ schedule }) {
  const liveItem = schedule?.find((i) => i.type?.toLowerCase() === 'live') || schedule?.[0] || null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-4 text-white shadow-md sm:p-5">
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-12 right-10 size-28 rounded-full bg-white/5" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 sm:size-12">
          <Video size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-100">{liveItem ? 'Next class' : 'Today'}</p>
          {liveItem ? (
            <>
              <p className="truncate text-base font-black leading-tight">{liveItem.subjectName || liveItem.subject || liveItem.title || 'Class'}</p>
              <p className="mt-0.5 text-xs font-semibold text-indigo-100">{liveItem.startTime || '--'} – {liveItem.endTime || '--'}</p>
            </>
          ) : (
            <p className="text-sm font-bold leading-snug">No classes scheduled for today</p>
          )}
        </div>
      </div>
      <Link
        to="/school/student/live-classes"
        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-indigo-700 shadow-sm transition hover:bg-indigo-50 sm:w-auto"
      >
        <Radio size={14} /> {liveItem ? 'Join Now' : 'View'}
      </Link>
      </div>
    </div>
  );
}

function TimelineItem({ item, isLast }) {
  const { Icon, color, bg } = getSubjectConfig(item.subjectName || item.subject || item.title || '');
  const isLive = item.type?.toLowerCase() === 'live';

  return (
    <div className="relative flex gap-3 pb-5 last:pb-0 sm:gap-4">
      {!isLast && <div className="absolute bottom-0 left-[19px] top-10 w-0.5 bg-slate-100 dark:bg-slate-800" />}
      <div className={`z-10 grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-white dark:ring-slate-900 ${bg} ${color}`}>
        <Icon size={18} />
      </div>
      <div className="flex min-w-0 flex-1 items-start justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-400">{item.startTime || '--'} – {item.endTime || '--'}</p>
          <p className="truncate text-sm font-black text-slate-900 dark:text-white">{item.subjectName || item.subject || item.title || 'Class'}</p>
          <p className="truncate text-xs font-semibold text-slate-500">{item.teacherName || 'Teacher'}</p>
        </div>
        {isLive ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
          </span>
        ) : item.room ? (
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">Room {item.room}</span>
        ) : null}
      </div>
    </div>
  );
}

function Timeline({ schedule }) {
  if (!schedule?.length) {
    return <EmptyState icon={CalendarDays} title="No classes today" hint="Enjoy the free time or revise a topic." />;
  }
  return (
    <div className="max-h-[420px] overflow-y-auto pr-1">
      {schedule.map((item, idx) => (
        <TimelineItem key={idx} item={item} isLast={idx === schedule.length - 1} />
      ))}
    </div>
  );
}

function CircularProgress({ value }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex size-[120px] shrink-0 items-center justify-center">
      <svg className="size-[120px] -rotate-90" viewBox="0 0 110 110">
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="55" cy="55" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-800" />
        <circle cx="55" cy="55" r={radius} stroke="url(#progressGradient)" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[26px] font-black leading-none text-slate-900 dark:text-white">{value}%</span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Overall</span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, displayValue, colorClass }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[11px] font-bold">
        <span className="text-slate-800 dark:text-slate-200">{label}</span>
        <span className="text-slate-500">{displayValue}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProgressCard({ assignments, mockTests, attendancePct, hasAttendance }) {
  const isDone = (s) => ['completed', 'submitted', 'evaluated'].includes(s);
  const assignmentTotal = assignments.length;
  const assignmentDone = assignments.filter((a) => isDone(a.status)).length;
  const testTotal = mockTests.length;
  const testDone = mockTests.filter((t) => t.status === 'completed' || t.status === 'evaluated').length;

  // Overall = average of whichever measures actually have data.
  const parts = [];
  if (assignmentTotal > 0) parts.push(assignmentDone / assignmentTotal);
  if (testTotal > 0) parts.push(testDone / testTotal);
  if (hasAttendance) parts.push(attendancePct / 100);
  const overall = parts.length ? Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : 0;

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="mx-auto sm:mx-0">
          <CircularProgress value={overall} />
        </div>
        <div className="flex w-full flex-1 flex-col gap-4">
          <ProgressBar label="Assignments" value={assignmentDone} max={assignmentTotal} displayValue={`${assignmentDone}/${assignmentTotal}`} colorClass="bg-emerald-500" />
          <ProgressBar label="Tests" value={testDone} max={testTotal} displayValue={`${testDone}/${testTotal}`} colorClass="bg-indigo-500" />
          <ProgressBar label="Attendance" value={attendancePct} max={100} displayValue={hasAttendance ? `${attendancePct}%` : '—'} colorClass="bg-amber-500" />
        </div>
      </div>
      <div className="relative mt-auto flex items-center justify-between overflow-hidden rounded-2xl bg-[#f8eadd]/40 p-4 dark:bg-amber-950/20">
        <div className="relative z-10">
          <p className="mb-1 text-[11px] font-bold italic leading-snug text-slate-800 dark:text-slate-200">"The expert in anything<br />was once a beginner."</p>
          <p className="text-[9px] font-bold text-amber-700/60 dark:text-amber-300/60">- Helen Hayes</p>
        </div>
        <div className="relative z-10 ml-2 flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100/50 text-emerald-600 dark:bg-amber-900/30">
          <Leaf size={24} />
        </div>
      </div>
    </div>
  );
}

const PRIORITY_STYLE = {
  High: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  Medium: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
  Low: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
};

function PendingAssignmentsList({ assignments }) {
  const items = assignments.slice(0, 4);
  if (items.length === 0) {
    return <EmptyState icon={ClipboardList} title="All caught up" hint="No pending assignments." />;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, idx) => {
        let priority = item.priority;
        if (!priority) {
          const daysToDue = item.dueDate ? Math.ceil((new Date(item.dueDate) - new Date()) / 86400000) : 5;
          priority = daysToDue <= 1 ? 'High' : daysToDue <= 3 ? 'Medium' : 'Low';
        }
        const { Icon, color, bg } = getSubjectConfig(item.subjectName || '');

        return (
          <div key={item.id || idx} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${bg} ${color}`}>
              <Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                Due {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'soon'}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${PRIORITY_STYLE[priority] || PRIORITY_STYLE.Low}`}>{priority}</span>
          </div>
        );
      })}
    </div>
  );
}

function SubjectPerformance({ courses }) {
  const items = courses?.length > 0 ? courses.slice(0, 5) : [
    { subjectName: 'Physics', percentage: 88, grade: 'A' },
    { subjectName: 'Mathematics', percentage: 76, grade: 'B+' },
    { subjectName: 'Chemistry', percentage: 82, grade: 'A' },
    { subjectName: 'English', percentage: 90, grade: 'A+' },
    { subjectName: 'Biology', percentage: 84, grade: 'A' },
  ];

  return (
    <div className="custom-scrollbar hide-scrollbar mt-1 flex gap-4 overflow-x-auto pb-1">
      {items.map((item, idx) => {
        const name = item.subjectName || item.name || 'Subject';
        const config = getSubjectConfig(name);
        const pct = item.percentage || (80 + (idx * 3) % 15);
        const grade = item.grade || 'A';

        return (
          <div key={item.id || idx} className="flex min-w-[120px] flex-1 flex-col items-center justify-center rounded-[1.25rem] border border-slate-100 p-4 dark:border-slate-800">
            <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
              <config.Icon size={20} />
            </div>
            <h4 className="mb-2 w-full truncate text-center text-[11px] font-bold text-slate-800 dark:text-slate-200">{name}</h4>
            <div className="mb-1 text-xl font-black text-slate-900 dark:text-white">{pct}%</div>
            <div className={`text-[9px] font-bold uppercase tracking-wider ${config.color}`}>{grade} Grade</div>
          </div>
        );
      })}
    </div>
  );
}

function Announcements({ notices }) {
  const items = (notices || []).slice(0, 3);
  if (items.length === 0) {
    return <EmptyState icon={Megaphone} title="No new announcements" hint="School notices will appear here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((notice, idx) => {
        const date = new Date(notice.postedDate || notice.date || notice.createdAt || Date.now());
        return (
          <div key={notice.id || idx} className="flex gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-600 text-white">
              <span className="text-base font-black leading-none">{date.getDate()}</span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider opacity-90">{date.toLocaleDateString([], { month: 'short' })}</span>
            </div>
            <div className="min-w-0">
              <p className="line-clamp-1 text-[13px] font-bold text-slate-900 dark:text-white">{notice.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-slate-600 dark:text-slate-300">{notice.content || notice.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const initialCache = readStudentDashboardCache();
  const [loading, setLoading] = useState(!initialCache);
  const [dashboardData, setDashboardData] = useState(initialCache?.dashboardData ?? null);
  const [assignments, setAssignments] = useState(initialCache?.assignments ?? []);
  const [mockTests, setMockTests] = useState(initialCache?.mockTests ?? []);
  const [notices, setNotices] = useState(initialCache?.notices ?? []);
  const [courses, setCourses] = useState(initialCache?.courses ?? []);
  const [weekEvents, setWeekEvents] = useState(initialCache?.weekEvents ?? []);
  const [scoreTrend, setScoreTrend] = useState([]);

  useEffect(() => {
    let active = true;
    api.get('/reports/my-analytics')
      .then((res) => { if (active) setScoreTrend(res.data?.data?.scoreTrend ?? []); })
      .catch(() => { if (active) setScoreTrend([]); });
    return () => { active = false; };
  }, []);

  const fetchData = async () => {
    try {
      const now = new Date();
      const dayNum = now.getDay();
      const diff = (dayNum + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      const from = new Date(monday);
      const to = new Date(monday);
      to.setDate(monday.getDate() + 6);

      const [dashRes, assignRes, testRes, noticeRes, courseRes, eventRes] = await Promise.allSettled([
        api.get('/students/dashboard'),
        api.get('/assignments'),
        api.get('/assessments/mock-tests?status=published'),
        api.get('/notices'),
        api.get('/students/courses/my'),
        api.get('/events', { params: { from: from.toISOString(), to: to.toISOString() } }),
      ]);

      const nextDashboard = dashRes.status === 'fulfilled' ? unwrapSchoolData(dashRes.value, null) : null;
      const nextAssignments = assignRes.status === 'fulfilled' ? unwrapSchoolList(assignRes.value) : [];
      const nextMockTests = testRes.status === 'fulfilled' ? (testRes.value.data?.data || testRes.value.data || []) : [];
      const nextNoticesRaw = noticeRes.status === 'fulfilled' ? (noticeRes.value.data?.data || noticeRes.value.data || []) : [];
      const nextNotices = Array.isArray(nextNoticesRaw) ? nextNoticesRaw.filter((notice) => String(notice?.category || '').toUpperCase() !== 'MAINTENANCE') : [];
      const nextCourses = courseRes.status === 'fulfilled' && Array.isArray(courseRes.value.data?.data)
        ? courseRes.value.data.data
        : courseRes.status === 'fulfilled' && Array.isArray(courseRes.value.data)
          ? courseRes.value.data
          : [];
      const eventData = eventRes.status === 'fulfilled' ? (eventRes.value.data?.data ?? eventRes.value.data) : [];
      const nextWeekEvents = Array.isArray(eventData) ? eventData : [];

      setDashboardData(nextDashboard);
      setAssignments(nextAssignments);
      setMockTests(nextMockTests);
      setNotices(nextNotices);
      setCourses(nextCourses);
      setWeekEvents(nextWeekEvents);

      writeStudentDashboardCache({
        dashboardData: nextDashboard,
        assignments: nextAssignments,
        mockTests: nextMockTests,
        notices: nextNotices,
        courses: nextCourses,
        weekEvents: nextWeekEvents,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useLiveRefresh(fetchData, [], 20000);

  const todayPlan = dashboardData?.todayPlan || [];
  const attendanceSummary = dashboardData?.attendanceSummary || dashboardData?.attendance || null;
  const totalClasses = attendanceSummary?.total ?? 0;
  const present = attendanceSummary?.present ?? 0;
  const attendancePct = totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0;
  const todayClassesCount = dashboardData?.todayClasses ?? dashboardData?.classesToday ?? todayPlan.length ?? 0;
  const points = dashboardData?.eddvaCoins ?? user?.eddvaCoins ?? 0;

  const pendingAssignments = assignments.filter(
    (a) => a.status !== 'completed' && a.status !== 'submitted' && a.status !== 'evaluated'
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const todayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const delta = scoreTrendDelta(scoreTrend);

  return (
    <div className="student-dashboard space-y-5 pb-12 font-sans">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Left column: hero, stats, schedule */}
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-8">
          <div className="relative flex min-h-[190px] flex-col justify-center overflow-hidden rounded-3xl border border-slate-100 shadow-sm dark:border-slate-800">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgBanner})` }} />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />
            <div className="relative z-10 p-5 sm:p-8">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/25 backdrop-blur">
                <CalendarDays size={12} /> {todayLabel}
              </p>
              <h1 className="mt-3 max-w-xl !text-2xl font-black leading-tight text-white sm:!text-3xl">
                {greeting()}, {firstName}!
              </h1>
              <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-white/85 sm:text-[13px]">
                Stay curious, stay focused and keep growing every day.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/school/student/timetable" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-indigo-700 shadow-sm transition hover:bg-indigo-50">
                  <CalendarDays size={14} /> My Timetable
                </Link>
                <Link to="/school/student/assignments" className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25">
                  <FileText size={14} /> {pendingAssignments.length} pending
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard icon={Video} label="Classes Today" value={todayClassesCount} hint="View schedule" to="/school/student/live-classes" theme={STAT_THEMES.indigo} />
            <StatCard icon={CalendarCheck} label="Attendance" value={totalClasses > 0 ? `${attendancePct}%` : '—'} hint="View details" to="/school/student/attendance" theme={STAT_THEMES.emerald} />
            <StatCard icon={Pencil} label="Pending Work" value={pendingAssignments.length} hint="View all" to="/school/student/assignments" theme={STAT_THEMES.amber} />
            <StatCard icon={Award} label="EDDVA Points" value={points} hint="Keep earning" theme={STAT_THEMES.sky} />
          </div>

          <div className={`${CARD} flex flex-1 flex-col`}>
            <SectionHeader icon={CalendarDays} gradient="from-indigo-500 to-blue-600" title="Today's Schedule" subtitle="Your classes for the day" action="Full timetable" to="/school/student/timetable" />
            <Timeline schedule={todayPlan} />
          </div>
        </div>

        {/* Right column: calendar, next class, assignments */}
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-4">
          <div className={`${CARD} min-h-[260px]`}>
            <SmartCalendar />
          </div>
          <NextClassCard schedule={todayPlan} />
          <div className={`${CARD} flex flex-1 flex-col`}>
            <SectionHeader icon={ClipboardList} gradient="from-amber-400 to-orange-600" title="Pending Assignments" action="View all" to="/school/student/assignments" />
            <PendingAssignmentsList assignments={pendingAssignments} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <BirthdayWidget className="rounded-3xl" />
        <div className={CARD}>
          <SectionHeader icon={Target} gradient="from-emerald-400 to-teal-600" title="Your Progress" subtitle="Assignments, tests and attendance" />
          <ProgressCard assignments={assignments} mockTests={mockTests} attendancePct={attendancePct} hasAttendance={totalClasses > 0} />
        </div>
      </div>

      <div className={CARD}>
        <SectionHeader icon={TrendingUp} gradient="from-fuchsia-500 to-purple-600" title="Improvement Metrics" subtitle="How your scores are trending" action="View analytics" to="/school/student/analytics" />
        {delta !== null && (
          <p className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${delta >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'}`}>
            <Trophy size={12} /> {delta >= 0 ? '+' : ''}{delta}% since your first result
          </p>
        )}
        <ScoreTrendChart data={scoreTrend} height={240} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={`${CARD} h-full overflow-hidden lg:col-span-2`}>
          <SectionHeader icon={BarChart3} gradient="from-sky-400 to-blue-600" title="Subject Performance" subtitle="Your current standing per subject" action="This Term" isDropdown />
          <SubjectPerformance courses={courses} />
        </div>
        <div className={`${CARD} h-full`}>
          <SectionHeader icon={Megaphone} gradient="from-rose-400 to-pink-600" title="School Announcements" action="View all" to="/school/student/announcements" />
          <Announcements notices={notices} />
        </div>
      </div>
    </div>
  );
}
