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
import { InstituteLogo, SchoolLogo } from '@/components/school/admin/Brand';
import AdminAvatar from '@/assets/images/admin-avatar.png';
import SmartCalendar from '@/components/school/SmartCalendar';
import instituteIllustration from '@/assets/images/intituite_illustation.png';
import vvsplLogo from '@/assets/vvspl_logo.png';
import eddvaLogo from '@/assets/eddva web logo.png';
import { Megaphone } from 'lucide-react';

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

function KpiCard({ title, value, suffix, sub, icon: Icon, color, delay, sparklineData }) {
  let strokeColor = '#2563EB'; // default blue
  if (color?.includes('emerald') || color?.includes('green') || color?.includes('teal')) {
    strokeColor = '#10B981';
  } else if (color?.includes('violet') || color?.includes('purple')) {
    strokeColor = '#8B5CF6';
  } else if (color?.includes('amber') || color?.includes('orange')) {
    strokeColor = '#F59E0B';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative flex flex-col w-full overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-5 text-left shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-200/50 dark:border-slate-800/40"
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            color || "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <p className="font-display text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              {value}
            </p>
            {suffix && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{suffix}</span>}
          </div>
        </div>
      </div>

      {sub && (
        <div className="mb-2">
          {sub.includes('live') ? (
            <span className="inline-flex items-center rounded-full bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 text-[9px] font-extrabold text-violet-650 dark:text-violet-400">
              {sub}
            </span>
          ) : (
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-450">↑ {sub.split(' ')[0]}</span> {sub.split(' ').slice(1).join(' ')}
            </p>
          )}
        </div>
      )}

      {sparklineData?.length ? (
        <div className="mt-auto -mx-4 -mb-4 h-12 w-[calc(100%+2rem)] opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.15} />
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
    </motion.div>
  );
}


const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function InstituteDashboardWorkspace({ stats, institute, loading }) {
  const navigate = useNavigate();
  const instituteName = institute?.name || 'Your Institute';
  const instituteLocation =
    institute?.location ||
    institute?.landMark ||
    institute?.landmark ||
    institute?.city ||
    (instituteName.toLowerCase().includes('army public school') ? 'Happy Valley' : '');
  const welcomeName = instituteLocation ? `${instituteName}, ${instituteLocation}` : instituteName;

  const students = stats?.totalStudents ?? 0;
  const teachers = stats?.totalTeachers ?? 0;
  const attendancePct = Math.round(stats?.studentAttendancePercentage || 0);
  const liveCount = stats?.liveClassesCount ?? 0;
  const scheduledCount = stats?.scheduledClassesCount ?? 0;

  const animStudents = useAnimatedNumber(students);
  const animTeachers = useAnimatedNumber(teachers);

  const attendanceSeries = useMemo(() => {
    if (stats?.attendanceHistory && Array.isArray(stats.attendanceHistory) && stats.attendanceHistory.length > 0) {
      return stats.attendanceHistory;
    }
    const base = attendancePct || 88;
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => ({
      name,
      att: Math.min(100, Math.max(60, Math.round(base + Math.sin(i * 0.9) * 6 + (i - 3) * 1.2))),
    }));
  }, [attendancePct, stats?.attendanceHistory]);

  const feesSeries = useMemo(
    () =>
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => ({
        name,
        collected: 32000 + i * 4200 + (i % 2) * 3100,
        pending: 8000 + (4 - i) * 900,
      })),
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
        const data = res.data?.data ?? res.data;
        setWeekEvents(Array.isArray(data) ? data : []);
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-12 px-6">
      {/* Row 1: Hero Section & Smart Calendar */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
        {/* Hero Section */}
        <section className="lg:col-span-2 xl:col-span-3 relative overflow-hidden rounded-[2.5rem] p-10 pl-12 text-white shadow-xl border border-blue-600/10 flex flex-col justify-between h-full" style={{ background: 'linear-gradient(135deg, #172554 0%, #1E3A8A 50%, #2563EB 100%)' }}>
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
          {/* Mesh Gradients & Glow Effects */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 via-transparent to-indigo-900/30" />
          <div className="absolute -left-16 -top-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 bottom-0 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          {/* Flowing wave shape (using a clean SVG path overlay at bottom) */}
          <svg className="absolute bottom-0 left-0 right-0 w-full h-24 opacity-10 pointer-events-none select-none" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,100 600,20 900,80 C1050,110 1150,90 1200,60 L1200,120 L0,120 Z" fill="white" />
          </svg>

          {/* School Building Graphic placed directly inside section, touching card bottom perfectly with gradient fade mask */}
          <div
            className="hidden md:block absolute right-0 bottom-[-2px] h-[calc(100%+2px)] w-[55%] z-0 select-none pointer-events-none"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 25%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%)'
            }}
          >
            <img src={instituteIllustration} alt="Institute Illustration" className="w-full h-full object-cover object-bottom filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.1)]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-8 h-full">
            <div className="flex-1 flex flex-col justify-between h-full py-2">
              <div className="flex flex-col items-start gap-2 mb-5 min-w-0 w-full">
                <div className="min-w-0 w-full">
                  <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white whitespace-nowrap truncate max-w-full">
                    Welcome, {institute?.name || 'Army Public School'}!
                  </h1>
                  <h3 className="text-lg font-bold text-blue-100 mt-1">
                    {institute?.location || 'Happy Valley'}
                  </h3>
                  <p className="mt-1.5 text-[10px] font-bold text-blue-200 uppercase tracking-widest leading-none">
                    School administration dashboard
                  </p>
                </div>
              </div>
              <p className="mt-4 text-base text-blue-50/95 max-w-lg leading-relaxed font-semibold">
                Empowering education through AI intelligence and seamless administration.
              </p>

              <div className="mt-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 backdrop-blur-md shadow-sm">
                  <Sparkles className="h-4 w-4 text-blue-200" />
                  <span className="text-xs font-bold tracking-wide text-white">Manage Smarter. Educate Better.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Calendar */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col h-full justify-between">
          <SmartCalendar />
        </motion.div>
      </div>

      {/* Row 2: Remaining Dashboard Content */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
        {/* Left Column: Quick Actions, KPIs, Charts */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6 min-w-0">
          {/* Quick Actions Card */}
          <div className="rounded-[2rem] bg-white dark:bg-slate-900 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-200/50 dark:border-slate-800/40">
            <div className="mb-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              {[
                { label: 'Add Student', icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 border border-blue-100/30 dark:border-blue-900/10', to: '/school/admin/students' },
                { label: 'Add Teacher', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 border border-emerald-100/30 dark:border-emerald-900/10', to: '/school/admin/teachers' },
                { label: 'Live Class', icon: Video, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50/50 dark:bg-violet-900/20 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 border border-violet-100/30 dark:border-violet-900/10', to: '/school/admin/timetable' },
                { label: 'Attendance', icon: ClipboardList, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 border border-amber-100/30 dark:border-amber-900/10', to: '/school/admin/attendance' },
                { label: 'Send Notice', icon: MessageSquare, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 border border-rose-100/30 dark:border-rose-900/10', to: '/school/admin/notices' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                >
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:scale-105", action.bg, action.color)}>
                    <action.icon className="h-6 w-6 transition-colors duration-300" />
                  </div>
                  <span className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Students"
              value={formatNumber(animStudents)}
              sub="12.5% this month"
              icon={GraduationCap}
              color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              delay={0.02}
              sparklineData={sparkStudents}
            />
            <KpiCard
              title="Total Teachers"
              value={formatNumber(animTeachers)}
              sub="8.2% this month"
              icon={Users}
              color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
              delay={0.06}
              sparklineData={sparkTeachers}
            />
            <KpiCard
              title="Live Classes"
              value={liveCount}
              sub={`${liveCount} live · ${scheduledCount} scheduled today`}
              icon={Video}
              color="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
              delay={0.1}
              sparklineData={[{ v: 0 }, { v: scheduledCount }, { v: liveCount }]}
            />
            <KpiCard
              title="Attendance Today"
              value={attendancePct}
              suffix="%"
              sub={`${stats?.presentStudentsToday || 0} of ${stats?.totalStudents || 0} students present`}
              icon={ClipboardList}
              color="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
              delay={0.14}
              sparklineData={attendanceSeries.map(s => ({ v: s.att }))}
            />
          </div>

          {/* Charts row */}
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] w-full"
            >
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white">Attendance Overview</h3>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Smoothed weekly trend · updates every refresh</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                  <TrendingUp className="h-3 w-3" />
                  Live
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceSeries} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,99,235,0.05)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} domain={[60, 100]} />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="att" name="Attendance %" stroke="#2563EB" strokeWidth={3} fill="url(#attFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Communications, Support & Security */}
        <div className="space-y-6 w-full lg:col-span-1 flex flex-col">
          {/* Communications Widget */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Communications</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Recent announcements</p>
              </div>
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            {stats?.communications && stats.communications.length > 0 && stats.communications[0]?.t !== 'No recent notices found' ? (
              <ul className="space-y-3">
                {stats.communications.map((n, idx) => {
                  const icons = [Megaphone, CalendarDays, BookOpen];
                  const IconComp = icons[idx % icons.length];
                  const colors = [
                    'text-blue-600 bg-blue-50/70 dark:bg-blue-900/25 border border-blue-100/50 dark:border-blue-900/10',
                    'text-emerald-600 bg-emerald-50/70 dark:bg-emerald-900/25 border border-emerald-100/50 dark:border-emerald-900/10',
                    'text-violet-600 bg-violet-50/70 dark:bg-violet-900/25 border border-violet-100/50 dark:border-violet-900/10',
                  ];
                  const color = colors[idx % colors.length];
                  return (
                    <li
                      key={n.id || idx}
                      onClick={() => navigate('/school/admin/notices')}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 p-3 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className={cn("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center", color)}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{n.t || n.title}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">{n.sub || n.content || 'Announcement'}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        {relativeTime(n.posted_date || n.created_at || n.time)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No recent announcements found
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/school/admin/notices')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 transition hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-900"
            >
              Open all notices
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Support & Security Widget */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Support & Security</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 font-sans">Assigned and open tickets</p>
              </div>
              <Ticket className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              {(stats?.complaintStatus || [
                { name: 'In Progress Tickets', value: stats?.inProgressTickets ?? 0 },
                { name: 'Open Tickets', value: stats?.openComplaints ?? 0 },
                { name: 'Closed Tickets', value: stats?.closedTickets ?? 0 }
              ]).map((c) => (
                <div 
                  key={c.name} 
                  onClick={() => navigate('/school/admin/complaints')}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2 bg-slate-50/30 dark:bg-slate-950/20 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.name}</span>
                  <span className="font-display text-sm font-extrabold text-slate-800 dark:text-white">{c.value}</span>
                </div>
              ))}
            </div>
            <div 
              onClick={() => navigate('/school/admin/security')}
              className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900/35 bg-emerald-50 dark:bg-emerald-950/15 px-3 py-2.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 cursor-pointer hover:bg-emerald-100/50 transition-colors"
            >
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{stats?.systemHealthText || 'System health: optimal · Backups verified · API latency 42ms'}</span>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Dynamic Floating Footer with Dancing Animation */}
      <footer className="w-full flex justify-center items-center py-6 mt-12 border-t border-slate-200/40 dark:border-slate-800/40 select-none">
        <motion.div
          animate={{
            y: [0, -3, 1, -1, 0],
            rotate: [0, -0.5, 0.5, -0.2, 0],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop"
          }}
          className="flex items-center gap-4 text-sm font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase"
        >
          <span>Powered by</span>
          <img src={eddvaLogo} alt="EDDVA" className="h-[40px] w-auto object-contain filter drop-shadow-sm hover:scale-105 transition-transform" />
          <span className="text-slate-350 dark:text-slate-700 font-normal text-base">+</span>
          <img src={vvsplLogo} alt="VVSPL" className="h-[50px] w-auto object-contain bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-slate-100 dark:border-slate-700 shadow-md hover:scale-105 transition-transform" />
        </motion.div>
      </footer>
    </motion.div>
  );
}
