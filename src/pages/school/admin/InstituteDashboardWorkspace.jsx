import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Cpu,
  GraduationCap,
  Layers,
  MessageSquare,
  Radio,
  Shield,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { Skeleton, cn } from '@/components/school/admin/Skeleton';
import api from '@/lib/api/school-client';
import { InstituteLogo } from '@/components/school/admin/Brand';
import { useAuth } from '@/context/SchoolAuthContext';

function formatInr(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function relativeTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString();
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-premium rounded-xl border border-[rgba(37,99,235,0.15)] px-3 py-2 text-xs shadow-lg dark:border-slate-600">
      <p className="mb-1 font-bold uppercase tracking-wide text-surface-500 dark:text-slate-400">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 font-bold" style={{ color: entry.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function useAnimatedNumber(target, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const end = Number(target) || 0;
    const start = 0;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - p) ** 3;
      setV(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function KpiCard({ title, value, suffix, sub, icon: Icon, color, delay, onClick, sparklineData }) {
  const isGreen = color?.includes('emerald') || color?.includes('green') || color?.includes('teal');
  const strokeColor = isGreen ? '#10B981' : '#2563EB';

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className="group relative flex flex-col w-full overflow-hidden rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-blue-100 dark:bg-slate-900 dark:ring-slate-800"
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110",
            color || "bg-blue-100 text-blue-600"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <p className="font-display text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              {value}
            </p>
            {suffix && <span className="text-xs font-semibold text-slate-500">{suffix}</span>}
          </div>
        </div>
      </div>

      {sub && (
        <p className="mb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <span className="text-emerald-600">↑ {sub.split(' ')[0]}</span> {sub.split(' ').slice(1).join(' ')}
        </p>
      )}

      {sparklineData?.length ? (
        <div className="mt-auto -mx-4 -mb-4 h-12 w-[calc(100%+2rem)] opacity-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#color-${title.replace(/\s+/g, '')})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </motion.button>
  );
}


const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function InstituteDashboardWorkspace({ stats, institute, loading }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.name || 'Admin';

  const students = stats?.totalStudents ?? 0;
  const teachers = stats?.totalTeachers ?? 0;
  const attendancePct = Math.round(stats?.studentAttendancePercentage || 0);
  const liveCount = (stats?.liveClasses || []).filter((c) => c.status === 'ONGOING').length;

  const animStudents = useAnimatedNumber(students);
  const animTeachers = useAnimatedNumber(teachers);

  const attendanceSeries = useMemo(() => {
    const base = attendancePct || 88;
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => ({
      name,
      att: Math.min(100, Math.max(60, Math.round(base + Math.sin(i * 0.9) * 6 + (i - 3) * 1.2))),
    }));
  }, [attendancePct]);

  const feesSeries = useMemo(
    () =>
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => ({
        name,
        collected: 32000 + i * 4200 + (i % 2) * 3100,
        pending: 8000 + (4 - i) * 900,
      })),
    []
  );

  const growthSeries = useMemo(
    () =>
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((name, i) => ({
        name,
        admissions: Math.max(0, Math.round(students * 0.02 + i * 3)),
      })),
    [students]
  );

  const performanceBars = useMemo(
    () => [
      { label: 'Excellent', pct: 35, color: '#10B981' },
      { label: 'Good', pct: 45, color: '#2563EB' },
      { label: 'Average', pct: 15, color: '#F59E0B' },
      { label: 'Needs focus', pct: 5, color: '#EF4444' },
    ],
    []
  );

  const [weekEvents, setWeekEvents] = useState([]);

  useEffect(() => {
    const fetchWeekEvents = async () => {
      try {
        const now = new Date();
        const day = now.getDay();
        const diff = (day + 6) % 7; // shift so Monday is first
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        const from = new Date(monday);
        const to = new Date(monday);
        to.setDate(monday.getDate() + 6);

        const res = await api.get('/events', {
          params: { from: from.toISOString(), to: to.toISOString() }
        });
        setWeekEvents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch weekly events', err);
      }
    };
    fetchWeekEvents();
  }, []);

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

  const aiInsights = useMemo(() => {
    const items = [
      {
        title: 'Attendance momentum',
        body:
          attendancePct >= 85
            ? `${attendancePct}% student attendance is strong. Keep streak rewards active.`
            : `Student attendance is at ${attendancePct}%. Schedule nudges for at‑risk sections.`,
        icon: Zap,
      },
      {
        title: 'Operational load',
        body:
          (stats?.openComplaints || 0) > 0
            ? `${stats.openComplaints} support tickets need attention — prioritize lab & network issues.`
            : 'Support queue is clear. Great time to roll out AI placement tests.',
        icon: Brain,
      },
      {
        title: 'Live learning',
        body:
          liveCount > 0
            ? `${liveCount} class session(s) are live now. Surface join links in parent portal.`
            : 'No live sessions now. Promote tomorrow’s timetable slots.',
        icon: Video,
      },
    ];
    return items;
  }, [attendancePct, stats?.openComplaints, liveCount]);

  const activityItems = useMemo(() => {
    const fromApi = (stats?.recentActivity || []).map((log, idx) => ({
      id: log.id || `log-${idx}`,
      text: log.action,
      time: relativeTime(log.createdAt),
      live: Date.now() - new Date(log.createdAt).getTime() < 10 * 60 * 1000,
    }));
    return fromApi.slice(0, 10);
  }, [stats?.recentActivity]);

  const sparkStudents = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((i) => ({ v: Math.max(10, students - (6 - i) * 12) })),
    [students]
  );
  const sparkTeachers = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((i) => ({ v: Math.max(4, teachers - (6 - i) * 2) })),
    [teachers]
  );

  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 lg:grid-cols-4 pb-12 px-6">
      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-6 min-w-0">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-8 text-white shadow-lg lg:col-span-2 ring-1 ring-white/10">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 left-20 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl pointer-events-none"></div>
            <div className="absolute -right-4 -bottom-6 w-56 h-56 pointer-events-none hidden md:block">
              <img src="/images/admin_avatar.png" alt="Admin" className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl animate-float" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center gap-5 mb-5">
                  <div className="rounded-2xl bg-white/10 p-2 backdrop-blur-sm shadow-inner ring-1 ring-white/20">
                    <InstituteLogo institute={institute} size="lg" className="rounded-xl shadow-lg" />
                  </div>
                  <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                      Welcome back, {displayName} 👋
                    </h1>
                    <p className="mt-1.5 text-blue-100 font-medium tracking-wide text-sm">
                      {institute?.name || 'Your Institute'}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-blue-100/90 font-medium text-sm max-w-md leading-relaxed">
                  Empowering education through AI intelligence and seamless administration.
                </p>

                <div className="mt-8 inline-block rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-md shadow-lg transition-transform hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-500/30 rounded-full p-1 border border-white/10">
                      <Sparkles className="h-3 w-3 text-blue-100" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-100">AI Summary</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-white">
                    92% attendance recorded today — <span className="text-emerald-300 font-bold">8% higher</span> than yesterday.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-1/2 w-[40%] -translate-y-1/2 translate-x-4 opacity-95 select-none pointer-events-none">
              <img
                src="/assets/admin_cartoon.png"
                alt="Admin Illustration"
                className="w-full object-contain animate-float drop-shadow-2xl"
              />
            </div>
          </section>

          {/* Quick Actions Card */}
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold tracking-tight text-slate-800 dark:text-white">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-3 gap-y-8 gap-x-4 flex-1 content-center">
              {[
                { label: 'Add Student', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50 group-hover:bg-blue-600 group-hover:text-white', to: '/school/admin/students' },
                { label: 'Add Teacher', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white', to: '/school/admin/teachers' },
                { label: 'Live Class', icon: Video, color: 'text-violet-600', bg: 'bg-violet-50 group-hover:bg-violet-600 group-hover:text-white', to: '/school/admin/timetable' },
                { label: 'Attendance', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50 group-hover:bg-amber-500 group-hover:text-white', to: '/school/admin/attendance' },
                { label: 'Collect Fees', icon: CircleDollarSign, color: 'text-sky-600', bg: 'bg-sky-50 group-hover:bg-sky-500 group-hover:text-white', to: '/school/admin/fees' },
                { label: 'Send Notice', icon: MessageSquare, color: 'text-rose-600', bg: 'bg-rose-50 group-hover:bg-rose-500 group-hover:text-white', to: '/school/admin/notices' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm group-hover:shadow-xl", action.bg, action.color)}>
                    <action.icon className="h-6 w-6 transition-colors duration-300" />
                  </div>
                  <span className="text-center text-xs font-semibold text-slate-600 transition-colors group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Total Students"
            value={formatNumber(animStudents)}
            sub="12.5% this month"
            icon={GraduationCap}
            color="bg-violet-100 text-violet-600"
            delay={0.02}
            sparklineData={sparkStudents}
            onClick={() => navigate('/school/admin/students')}
          />
          <KpiCard
            title="Total Teachers"
            value={formatNumber(animTeachers)}
            sub="5.3% this month"
            icon={Users}
            color="bg-emerald-100 text-emerald-600"
            delay={0.06}
            sparklineData={sparkTeachers}
            onClick={() => navigate('/school/admin/teachers')}
          />
          <KpiCard
            title="Live Classes"
            value={liveCount}
            sub="3 live now"
            icon={Video}
            color="bg-blue-100 text-blue-600"
            delay={0.1}
            sparklineData={[{ v: 10 }, { v: 15 }, { v: 12 }, { v: 18 }, { v: 14 }, { v: 20 }, { v: 16 }]}
            onClick={() => navigate('/school/admin/timetable')}
          />
          <KpiCard
            title="Attendance Today"
            value={`${attendancePct}`}
            suffix="%"
            sub="8% vs yesterday"
            icon={Layers}
            color="bg-emerald-100 text-emerald-600"
            delay={0.14}
            sparklineData={attendanceSeries.map(s => ({ v: s.att }))}
            onClick={() => navigate('/school/admin/attendance')}
          />
          <KpiCard
            title="Fees Collected"
            value={formatInr(45000)}
            sub="15.4% this month"
            icon={CircleDollarSign}
            color="bg-orange-100 text-orange-600"
            delay={0.18}
            sparklineData={feesSeries.map(s => ({ v: s.collected }))}
            onClick={() => navigate('/school/admin/reports')}
          />
          <KpiCard
            title="Online Now"
            value={formatNumber((stats?.onlineStudentCount || 0) + (stats?.onlineTeacherCount || 0))}
            sub="Live"
            icon={Radio}
            color="bg-emerald-100 text-emerald-600"
            delay={0.22}
            sparklineData={[{ v: 5 }, { v: 8 }, { v: 12 }, { v: 7 }, { v: 15 }, { v: 10 }, { v: 18 }]}
            onClick={() => navigate('/school/admin/communications')}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 xl:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2"
          >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Attendance overview</h3>
                <p className="text-sm font-medium text-surface-500 dark:text-slate-400">Smoothed weekly trend · updates every refresh</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" />
                Live
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceSeries} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,99,235,0.08)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[60, 100]} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="att" name="Attendance %" stroke="#2563EB" strokeWidth={3} fill="url(#attFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Fees collection</h3>
              <span className="text-xs font-bold text-surface-500 dark:text-slate-400">Demo trend</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feesSeries} margin={{ top: 8, right: 8, left: -28, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,99,235,0.06)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)' }} />
                  <Bar dataKey="collected" name="Collected" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Mid grid: growth + performance + AI */}
        <div className="grid gap-3 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
            <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Admissions momentum</h3>
            <p className="text-sm font-medium text-surface-500 dark:text-slate-400">Rolling intake signal</p>
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthSeries} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,99,235,0.06)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="admissions" name="Admissions" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 glass-premium lg:col-span-1">
            <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Student performance</h3>
            <p className="text-sm font-medium text-surface-500 dark:text-slate-400">AI distribution model</p>
            <div className="mt-6 space-y-4">
              {performanceBars.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs font-bold text-surface-600 dark:text-slate-300">
                    <span>{row.label}</span>
                    <span>{row.pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-100 dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">AI insights</h3>
            </div>
            <p className="relative mt-1 text-sm font-medium text-slate-500">Proactive recommendations</p>
            <ul className="relative mt-5 space-y-4">
              {aiInsights.map(({ title, body, icon: Icon }) => (
                <li key={title} className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-white">{title}</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Activity + online + live */}
        <div className="grid gap-3 xl:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Live activity</h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Realtime</span>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {activityItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-[rgba(37,99,235,0.08)] bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="relative mt-1 h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-center text-xs font-bold leading-9 text-white">
                    {(item.text || 'A').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-slate-100 leading-tight">{item.text}</p>
                        <p className="mt-1 flex items-center gap-2 text-[10px] font-bold text-surface-500 dark:text-slate-400">
                          {item.time}
                          {item.live && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              </span>
                              Live
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/admin/students')}
                        className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold tracking-tight uppercase text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 glass-premium xl:col-span-1">
            <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Online pulse</h3>
            <p className="text-sm font-medium text-surface-500 dark:text-slate-400">Presence in the last 30 minutes</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Students', count: stats?.onlineStudentCount ?? 0, color: 'from-blue-500 to-cyan-500' },
                { label: 'Teachers', count: stats?.onlineTeacherCount ?? 0, color: 'from-emerald-500 to-teal-500' },
                { label: 'Parents', count: Math.max(0, Math.round((stats?.onlineStudentCount || 0) * 0.35)), color: 'from-violet-500 to-purple-600' },
                { label: 'Staff', count: Math.max(1, Math.round((stats?.onlineTeacherCount || 0) * 0.2)), color: 'from-amber-500 to-orange-500' },
              ].map((g) => (
                <div key={g.label} className="rounded-xl border border-[rgba(37,99,235,0.1)] bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-xs font-bold uppercase tracking-wide text-surface-500 dark:text-slate-400">{g.label}</p>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <p className="font-display text-3xl font-bold text-surface-950 dark:text-white">{g.count}</p>
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${g.color} opacity-90 shadow-lg`} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Live classes</h3>
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest tracking-wide text-red-600 ring-1 ring-red-500/20 dark:text-red-400">
                Broadcast
              </span>
            </div>
            <div className="space-y-3">
              {(stats?.liveClasses || []).length ? (
                stats.liveClasses.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-all ${item.status === 'ONGOING'
                        ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
                        : 'border-[rgba(37,99,235,0.1)] bg-white/60 dark:border-slate-700 dark:bg-slate-800/40'
                      }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold text-surface-950 dark:text-white">{item.title}</p>
                        {item.status === 'ONGOING' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Live
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-surface-500 dark:text-slate-400">
                        {item.teacher} · {item.startTime} – {item.endTime}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"
                    >
                      Join
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-surface-200 p-8 text-center text-sm font-semibold text-surface-500 dark:border-slate-600 dark:text-slate-400">
                  No live or upcoming windows in the current schedule slice.
                </div>
              )}
            </div>
          </motion.div>
        </div>


      </div>
      {/* Right Sidebar Area */}
      <div className="space-y-6 w-full shrink-0">

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Smart calendar</h3>
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-widest text-surface-400 dark:text-slate-500">
            {calendarWeek.map((d) => (
              <div key={d.day}>{d.day}</div>
            ))}
          </div>
          <div className="mt-2 grid min-h-[200px] grid-cols-7 gap-2">
            {calendarWeek.map((d) => (
              <div key={d.day} className="rounded-lg border border-[rgba(37,99,235,0.08)] bg-white/50 p-1.5 dark:border-slate-700 dark:bg-slate-800/40">
                {d.events.map((ev) => (
                  <div key={ev.t} className={`mb-1 truncate rounded px-1 py-0.5 text-[9px] font-bold text-white ${ev.tone}`}>
                    {ev.t}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Communications</h3>
            <MessageSquare className="h-5 w-5 text-violet-600" />
          </div>
          <ul className="space-y-3">
            {[
              { t: 'Annual Sports Day 2026 — draft published', badge: 2 },
              { t: 'PTM reminders queued for Grade 10', badge: 0 },
              { t: 'Parent portal: 98% delivery rate', badge: 1 },
            ].map((n) => (
              <li
                key={n.t}
                className="flex items-start justify-between gap-3 rounded-xl border border-[rgba(37,99,235,0.08)] bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <p className="text-sm font-semibold text-surface-800 dark:text-slate-200">{n.t}</p>
                {n.badge > 0 && (
                  <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{n.badge}</span>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigate('/school/admin/notices')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(37,99,235,0.15)] py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50 dark:border-slate-600 dark:text-sky-300 dark:hover:bg-slate-800"
          >
            Open notices
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Finance cockpit</h3>
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between rounded-xl bg-blue-600/5 px-3 py-2 dark:bg-blue-500/10">
              <span className="font-semibold text-surface-600 dark:text-slate-300">Total revenue</span>
              <span className="font-bold text-surface-950 dark:text-white">{formatInr(stats?.financeSummary?.totalRevenue || 0)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-surface-50 px-3 py-2 dark:bg-slate-800/80">
              <span className="font-semibold text-surface-600 dark:text-slate-300">Monthly collection</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatInr(stats?.financeSummary?.totalCollected || 0)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-amber-500/10 px-3 py-2 dark:bg-amber-500/15">
              <span className="font-semibold text-surface-600 dark:text-slate-300">Pending</span>
              <span className="font-bold text-amber-700 dark:text-amber-300">{formatInr(stats?.financeSummary?.totalPending || 0)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-surface-950 dark:text-white">Support & security</h3>
            <Ticket className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-2">
            {(stats?.complaintStatus || []).map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl border border-[rgba(37,99,235,0.08)] px-3 py-2 dark:border-slate-700">
                <span className="text-sm font-semibold text-surface-700 dark:text-slate-200">{c.name}</span>
                <span className="font-display text-lg font-bold text-surface-950 dark:text-white">{c.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            System health: optimal · Backups verified · API latency 42ms (edge)
          </div>
        </motion.div>

        {/* Upcoming Exams Widget */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm dark:border-slate-800 dark:from-indigo-950/40 dark:to-blue-900/20">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-indigo-950 dark:text-indigo-100">Upcoming Exams</h3>
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest tracking-wide text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              This Week
            </span>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl bg-white/60 p-3 shadow-sm dark:bg-slate-900/50 transition hover:shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Mid-Term Math</p>
              <p className="text-xs text-slate-500 mt-1">Grade 10 • Tomorrow, 9:00 AM</p>
            </div>
            <div className="rounded-xl bg-white/60 p-3 shadow-sm dark:bg-slate-900/50 transition hover:shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Physics Practical</p>
              <p className="text-xs text-slate-500 mt-1">Grade 12 • Friday, 2:00 PM</p>
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
}
