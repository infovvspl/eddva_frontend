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
import AdminAvatar from '@/assets/images/admin-avatar.png';

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
      {/* Hero Section */}
      <section className="lg:col-span-3 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-8 text-white shadow-lg ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 left-20 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl pointer-events-none"></div>
        <motion.div 
          className="absolute right-12 bottom-0 w-56 h-56 pointer-events-none hidden md:block"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src={AdminAvatar} alt="Admin" className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl" />
        </motion.div>

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
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
            className="mt-8 self-start inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-2 backdrop-blur-md border border-white/20 shadow-sm"
          >
            <Sparkles className="h-5 w-5 text-blue-200" />
            <span className="text-base font-semibold tracking-wide text-white">Manage Smarter. Educate Better.</span>
          </motion.div>
        </div>
      </section>

      {/* Smart Calendar (placed beside Welcome Card) */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
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
                {d.events.map((ev) => (
                  <div key={ev.t} className={`mb-1 truncate rounded px-1 py-0.5 text-[9px] font-bold text-white ${ev.tone}`}>
                    {ev.t}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-6 min-w-0">

        {/* Quick Actions Card */}
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mb-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-slate-400">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Add Student', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50 group-hover:bg-blue-600 group-hover:text-white', to: '/school/admin/students' },
              { label: 'Add Teacher', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white', to: '/school/admin/teachers' },
              { label: 'Live Class', icon: Video, color: 'text-violet-600', bg: 'bg-violet-50 group-hover:bg-violet-600 group-hover:text-white', to: '/school/admin/timetable' },
              { label: 'Attendance', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50 group-hover:bg-amber-500 group-hover:text-white', to: '/school/admin/attendance' },
              { label: 'Send Notice', icon: MessageSquare, color: 'text-rose-600', bg: 'bg-rose-50 group-hover:bg-rose-500 group-hover:text-white', to: '/school/admin/notices' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800"
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

        {/* KPI grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        {/* Charts row */}
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 w-full"
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
        </div>
      </div>
      {/* Right Sidebar Area */}
      <div className="space-y-6 w-full shrink-0 lg:col-span-1">

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
      </div>

    </motion.div>
  );
}
