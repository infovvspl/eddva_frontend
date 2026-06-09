import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { motion } from 'framer-motion';
import StudentAvatar from '@/assets/images/Student_Avatar.png';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import { readStudentDashboardCache, writeStudentDashboardCache } from '@/lib/school/student-dashboard-cache';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  FileText,
  GraduationCap,
  Megaphone,
  Radio,
  Target,
  CalendarDays,
  Flame,
  Star,
  UserCheck,
  Sparkles,
} from 'lucide-react';

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
        <h2 className="text-base font-bold text-slate-950 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, tone = 'slate' }) {
  const palette = tones[tone] || tones.slate;
  return (
    <Link
      to={to}
      className="group flex flex-col items-center justify-center gap-3 rounded-[20px] border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${palette.icon} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-7 w-7" />
      </span>
      <span className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
        {label}
      </span>
    </Link>
  );
}

function EmptyMini({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-800 dark:bg-slate-900/50">
      <Icon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
      <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{text}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, institute } = useAuth();
  const initialCache = readStudentDashboardCache();
  const [loading, setLoading] = useState(!initialCache);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(initialCache?.dashboardData ?? null);
  const [assignments, setAssignments] = useState(initialCache?.assignments ?? []);
  const [mockTests, setMockTests] = useState(initialCache?.mockTests ?? []);
  const [notices, setNotices] = useState(initialCache?.notices ?? []);
  const [courses, setCourses] = useState(initialCache?.courses ?? []);
  const [weekEvents, setWeekEvents] = useState(initialCache?.weekEvents ?? []);

  const fetchData = async () => {
    if (!initialCache) setLoading(true);
    else setRefreshing(true);
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
      const nextNotices = noticeRes.status === 'fulfilled' ? (noticeRes.value.data?.data || noticeRes.value.data || []) : [];
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
      setRefreshing(false);
    }
  };

  useLiveRefresh(fetchData, [], 20000);

  const todayPlan = dashboardData?.todayPlan || [];
  const rawAttendance =
    dashboardData?.attendancePercentage ?? dashboardData?.attendance?.percentage ?? null;
  const hasAttendance = rawAttendance != null && Number.isFinite(Number(rawAttendance));
  const attendancePct = hasAttendance ? pct(rawAttendance) : null;
  const attendanceSummary = dashboardData?.attendanceSummary || dashboardData?.attendance || null;
  const todayClassesCount = dashboardData?.todayClasses ?? dashboardData?.classesToday ?? todayPlan.length ?? 0;

  const pendingAssignments = assignments.filter(
    (a) => a.status !== 'completed' && a.status !== 'submitted' && a.status !== 'evaluated'
  );
  const pendingAssignmentsCount = pendingAssignments.length;
  const upcomingExamsCount = mockTests.length;

  const profile = user?.studentProfile || user?.profile || dashboardData?.student || {};
  const className =
    profile.className ||
    profile.class ||
    dashboardData?.student?.className ||
    dashboardData?.student?.class ||
    null;
  const sectionName =
    profile.sectionName ||
    profile.section ||
    dashboardData?.student?.sectionName ||
    dashboardData?.student?.section ||
    null;

  const calendarWeek = useMemo(() => {
    const monday = new Date();
    const day = monday.getDay();
    const diff = (day + 6) % 7;
    monday.setDate(monday.getDate() - diff);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const events = weekEvents
        .filter(ev => ev.startTime && ev.startTime.split('T')[0] === key)
        .map(ev => ({ t: ev.title || 'Event', tone: ev.priority === 'HIGH' ? 'bg-rose-500' : 'bg-blue-500' }));
      return { day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], events };
    });
  }, [weekEvents]);

  const quickActions = [
    { label: 'Join Live Class', to: '/school/student/live-classes', icon: Radio, tone: 'blue' },
    { label: 'View Notes', to: '/school/student/study-materials', icon: FileText, tone: 'emerald' },
    { label: 'My Doubts', to: '/school/student/doubts', icon: HelpCircle, tone: 'violet' },
    { label: 'View Assignments', to: '/school/student/assignments', icon: ClipboardList, tone: 'amber' },
    { label: 'Take Test', to: '/school/student/assessments', icon: Target, tone: 'rose' },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {refreshing && (
        <div className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-400">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Updating…
        </div>
      )}
      {/* Top Grid for Welcome Card and Smart Calendar */}
      <div className="grid gap-6 lg:grid-cols-4 items-stretch">
        {/* Welcome Card Wrapper */}
        <div className="lg:col-span-3 relative flex flex-col justify-between">
          <section className="relative overflow-hidden h-full rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 md:p-8 text-white shadow-lg ring-1 ring-white/10 flex flex-col justify-between">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

            {/* Elegant bubble style translucent overlays matching the screenshot */}
            <div className="absolute top-[20px] left-[320px] w-24 h-24 rounded-full bg-white/[0.08] pointer-events-none"></div>
            <div className="absolute top-[-30px] right-[280px] w-28 h-28 rounded-full bg-white/[0.08] pointer-events-none"></div>
            <div className="absolute bottom-[-55px] left-[50%] w-36 h-36 rounded-full bg-white/[0.08] pointer-events-none"></div>
            <div className="absolute bottom-[-30px] right-[40px] w-24 h-24 rounded-full bg-white/[0.08] pointer-events-none"></div>

            <div className="relative z-10 flex h-full flex-col justify-between space-y-6 md:pr-72">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-white/90 backdrop-blur-sm">
                    Student Dashboard
                  </span>
                  <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-200 backdrop-blur-sm">
                    School Module
                  </span>
                </div>
                <h1 className="font-display text-2xl font-black md:text-3xl text-white">
                  Welcome back, {user?.name || 'Student'}! 👋 🌟
                </h1>
                <p className="mt-2 text-white/90 font-medium text-sm">
                  {className && sectionName
                    ? `${className} · Section ${sectionName}`
                    : className || 'Your class schedule loads from your section assignment.'}
                </p>
                <p className="mt-1 text-white/90 font-medium text-sm">
                  {todayClassesCount > 0
                    ? `You have ${todayClassesCount} class${todayClassesCount === 1 ? '' : 'es'} scheduled today.`
                    : 'No classes scheduled for today.'}
                  {pendingAssignmentsCount > 0
                    ? ` ${pendingAssignmentsCount} assignment${pendingAssignmentsCount === 1 ? '' : 's'} pending.`
                    : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {/* Current Streak Badge */}
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-inner">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f97316] shadow-sm">
                    <Flame className="h-5 w-5 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200/80">Current Streak</p>
                    <p className="text-sm font-black text-white">{user?.currentStreak || dashboardData?.currentStreak || 0} Days</p>
                  </div>
                </div>

                {/* Total XP Badge */}
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-inner">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eab308] shadow-sm">
                    <Star className="h-5 w-5 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200/80">Total XP</p>
                    <p className="text-sm font-black text-white">{dashboardData?.xpTotal || user?.xpTotal || 0} XP</p>
                  </div>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                className="mt-4 self-start inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-2 backdrop-blur-md border border-white/20 shadow-sm"
              >
                <Sparkles className="h-5 w-5 text-blue-200" />
                <span className="text-base font-semibold tracking-wide text-white">Manage Smarter. Educate Better.</span>
              </motion.div>
            </div>
          </section>

          {/* Floating Illustrations allowing overflow (outside the overflow-hidden section) */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[280px] h-[210px] pointer-events-none hidden md:block z-20">
            <motion.div
              className="w-full h-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src={StudentAvatar}
                alt="Student Avatar"
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>
        </div>

        {/* Smart Calendar (matching Institute Admin Panel exactly) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
        >
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Smart calendar</h3>
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-widest text-surface-400 dark:text-slate-500">
              {calendarWeek.map((d) => (
                <div key={d.day}>{d.day}</div>
              ))}
            </div>
            <div className="mt-2 grid min-h-[180px] grid-cols-7 gap-2">
              {calendarWeek.map((d) => (
                <div key={d.day} className="rounded-lg border border-[rgba(37,99,235,0.08)] bg-white/50 p-1.5 dark:border-slate-700 dark:bg-slate-800/40">
                  {d.events.map((ev, idx) => (
                    <div key={`${ev.t}-${idx}`} className={`mb-1 truncate rounded px-1 py-0.5 text-[9px] font-bold text-white ${ev.tone}`}>
                      {ev.t}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {quickActions.map((action) => (
          <QuickAction key={action.label} {...action} />
        ))}
      </section>

      {/* Simplified Widgets */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        {/* Left main widgets */}
        <div className="space-y-6">

          {/* Today's Classes */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader
              title="Today's Classes"
              subtitle="Your schedule and live classes for today."
              action={
                <Link to="/school/student/live-classes" className="text-sm font-black text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Join live
                </Link>
              }
            />
            <div className="mt-5 space-y-4">
              {todayPlan.length > 0 ? (
                todayPlan.slice(0, 5).map((item, index) => (
                  <div key={`${item.id || item.subject || item.title}-${index}`} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                      <Radio className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                        {item.subjectName || item.subject || item.title || 'Class'}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.startTime
                          ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : item.type || 'Scheduled'}
                        {item.teacherName ? ` · ${item.teacherName}` : ''}
                        {item.room ? ` · ${item.room}` : ''}
                      </p>
                    </div>
                    <Link to="/school/student/live-classes" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700">
                      Join
                    </Link>
                  </div>
                ))
              ) : (
                <EmptyMini icon={Radio} title="No classes scheduled" text="You are all caught up for today!" />
              )}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader
              title="Upcoming Assignments"
              subtitle="Pending homework and project submissions."
              action={
                <Link to="/school/student/assignments" className="text-sm font-black text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View all
                </Link>
              }
            />
            <div className="mt-5 space-y-4">
              {pendingAssignmentsCount > 0 ? (
                pendingAssignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">{assignment.title}</h4>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Due: {assignment.dueDate || assignment.due_date
                          ? new Date(assignment.dueDate || assignment.due_date).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                    <Link to="/school/student/assignments" className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700">
                      Submit
                    </Link>
                  </div>
                ))
              ) : (
                <EmptyMini icon={FileText} title="No pending assignments" text="Good job! You have submitted all homework." />
              )}
            </div>
          </div>

        </div>

        {/* Right side widgets */}
        <div className="space-y-6">

          {/* Attendance Summary */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader title="Attendance Summary" />
            <div className="mt-5 space-y-4">
              {hasAttendance ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Attendance Rate</span>
                    <span className="text-lg font-black text-slate-950 dark:text-white">{attendancePct}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${attendancePct < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${attendancePct}%` }}
                    />
                  </div>
                  {attendanceSummary?.total != null && (
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 dark:border-slate-800 dark:bg-slate-800/50">P {attendanceSummary.present ?? 0}</div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 dark:border-slate-800 dark:bg-slate-800/50">A {attendanceSummary.absent ?? 0}</div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 dark:border-slate-800 dark:bg-slate-800/50">L {attendanceSummary.leave ?? 0}</div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 dark:border-slate-800 dark:bg-slate-800/50">T {attendanceSummary.total ?? 0}</div>
                    </div>
                  )}
                  <p className="text-xs font-semibold text-slate-500">
                    {attendancePct < 75 ? 'Warning: Attendance is below 75% requirement!' : 'Status: On track'}
                  </p>
                </>
              ) : (
                <EmptyMini icon={UserCheck} title="No attendance yet" text="Records appear once your school marks attendance." />
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader
              title="Recent Announcements"
              action={
                <Link to="/school/student/announcements" className="text-sm font-black text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View all
                </Link>
              }
            />
            <div className="mt-5 space-y-4">
              {notices.length > 0 ? (
                notices.slice(0, 3).map((notice) => (
                  <div key={notice.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{notice.title}</p>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{notice.content}</p>
                  </div>
                ))
              ) : (
                <EmptyMini icon={Megaphone} title="No announcements" text="No new notices from the school administration." />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
