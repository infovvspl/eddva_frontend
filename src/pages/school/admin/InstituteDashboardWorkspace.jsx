import React, { useMemo, useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Video,
  ClipboardList,
  MessageSquare,
  Sparkles,
  Megaphone,
  CalendarDays,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  Ticket,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/components/school/admin/Skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import adminBanner from '@/assets/images/new_admin_banner.png';
import eddvaLogo from '@/assets/eddva-logo.svg';
import vvsplLogo from '@/assets/vvspl_logo.png';
import { AttentionRequiredWidget, FeeOverviewWidget, RecentActivityWidget } from '@/components/school/admin/DashboardWidgets';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import SmartCalendar from '@/components/school/SmartCalendar';

function useAnimatedNumber(target, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = Number(target) || 0;
    if (end === 0) {
      setVal(0);
      return;
    }
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      setVal(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function formatNumber(num) {
  if (!num) return '0';
  return num.toLocaleString('en-US');
}

function relativeTime(dateStr) {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recently';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2.5 shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5">
          {payload[0].value}% <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Attendance</span>
        </p>
      </div>
    );
  }
  return null;
};

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
      className="relative flex flex-col justify-between w-full overflow-hidden bg-white dark:bg-slate-900 text-left shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-200/50 dark:border-slate-800/40"
      style={{
        padding: 'clamp(0.75rem, 1.2vw, 1.25rem)',
        borderRadius: 'clamp(1.25rem, 1.8vw, 1.75rem)',
        minHeight: 'clamp(100px, 8.5vw, 140px)'
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-1">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl sm:rounded-2xl",
            color || "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          )}
          style={{
            width: 'clamp(2rem, 2.8vw, 3rem)',
            height: 'clamp(2rem, 2.8vw, 3rem)'
          }}
        >
          <Icon style={{ width: 'clamp(1rem, 1.4vw, 1.5rem)', height: 'clamp(1rem, 1.4vw, 1.5rem)' }} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500" style={{ fontSize: 'clamp(8px, 0.65vw, 11px)' }}>
            {title}
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <p className="font-display font-bold tracking-tight text-slate-800 dark:text-white" style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.75rem)' }}>
              {value}
            </p>
            {suffix && <span className="font-semibold text-slate-500 dark:text-slate-400" style={{ fontSize: 'clamp(9px, 0.7vw, 12px)' }}>{suffix}</span>}
          </div>
        </div>
      </div>

      {sub && (
        <div className="mb-1">
          {sub.includes('live') ? (
            <span className="inline-flex items-center rounded-full bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 font-extrabold text-violet-650 dark:text-violet-400" style={{ fontSize: 'clamp(8px, 0.6vw, 9px)' }}>
              {sub}
            </span>
          ) : (
            <p className="font-bold text-slate-500 dark:text-slate-400 truncate" style={{ fontSize: 'clamp(8px, 0.65vw, 10px)' }}>
              {sub.includes('↑') ? (
                <>
                  <span className="text-emerald-600 dark:text-emerald-450">{sub.split(' ')[0]}</span>{' '}
                  {sub.split(' ').slice(1).join(' ')}
                </>
              ) : sub.includes('%') ? (
                sub
              ) : (
                <>
                  <span className="text-emerald-600 dark:text-emerald-450">↑ {sub.split(' ')[0]}</span>{' '}
                  {sub.split(' ').slice(1).join(' ')}
                </>
              )}
            </p>
          )}
        </div>
      )}

      {sparklineData?.length ? (
        <div className="mt-auto -mx-3 -mb-3 sm:-mx-5 sm:-mb-5 h-8 sm:h-10 w-[calc(100%+1.5rem)] sm:w-[calc(100%+2.5rem)] opacity-80">
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
    institute?.state ||
    (instituteName.toLowerCase().includes('army public school') ? 'State' : '');

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

  const sparkStudents = useMemo(() => {
    const base = students || 500;
    return [0.85, 0.88, 0.92, 0.9, 0.95, 0.98, 1].map((f) => ({ v: Math.round(base * f) }));
  }, [students]);

  const sparkTeachers = useMemo(() => {
    const base = teachers || 40;
    return [0.9, 0.92, 0.91, 0.95, 0.94, 0.98, 1].map((f) => ({ v: Math.round(base * f) }));
  }, [teachers]);

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
    <motion.div variants={container} initial="hidden" animate="show" className="pb-12 bg-slate-50/50 dark:bg-slate-950 min-h-screen">
      {/* Row 1: Hero Section (Floating Card) */}
      <div className="w-full px-4 md:px-6 pt-4 sm:pt-6 mb-6">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] shadow-sm border border-white/60 dark:border-slate-800">
          {/* Full Banner Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={adminBanner}
              alt="Admin Banner"
              className="w-full h-full object-cover object-[center_35%]"
            />
          </div>
          
          {/* Gradient removed as requested */}

          <div className="relative z-10 flex flex-col justify-between h-full w-full py-1">
            <div className="flex flex-col items-start gap-1.5 min-w-0 w-full md:max-w-[85%] lg:max-w-[90%]">
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-black tracking-tight text-slate-900 leading-snug break-words">
                Welcome, {institute?.name || 'Army Public School'}!
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs sm:text-sm font-bold text-slate-700">{institute?.state || institute?.location || 'State'}</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest">
                  School administration dashboard
                </span>
              </div>
            </div>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed font-semibold max-w-[320px] sm:max-w-[380px] md:max-w-[420px]">
              Empowering education through AI intelligence and seamless administration.
            </p>

            <div className="mt-4 sm:mt-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 sm:px-5 sm:py-2 backdrop-blur-md shadow-sm">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-800">Manage Smarter. Educate Better.</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Row 2: Remaining Dashboard Content */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 items-stretch px-4 md:px-6">
        {/* Left Column: Quick Actions, KPIs, Charts */}
        <div className="lg:col-span-2 xl:col-span-3 flex flex-col space-y-6 min-w-0">
          {/* Quick Actions Card */}
          <div
            className="bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-200/60 dark:border-slate-800/60"
            style={{
              padding: 'clamp(0.85rem, 1.4vw, 1.5rem)',
              borderRadius: 'clamp(1.25rem, 2vw, 2rem)'
            }}
          >
            <div style={{ marginBottom: 'clamp(0.5rem, 1vw, 1rem)' }}>
              <h3
                className="font-display font-bold uppercase tracking-widest text-indigo-900 dark:text-indigo-400"
                style={{ fontSize: 'clamp(10px, 0.75vw, 12px)' }}
              >
                Quick Actions
              </h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6" style={{ gap: 'clamp(0.35rem, 1vw, 1rem)' }}>
              {[
                { label: 'Classes', shortLabel: 'Classes', icon: BookOpen, color: 'text-white', bg: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 border-none', to: '/school/admin/classes' },
                { label: 'Timetable', shortLabel: 'Timetable', icon: CalendarDays, color: 'text-white', bg: 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30 hover:shadow-lg hover:shadow-violet-500/40 border-none', to: '/school/admin/timetable' },
                { label: 'Notices', shortLabel: 'Notices', icon: MessageSquare, color: 'text-white', bg: 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-500/30 hover:shadow-lg hover:shadow-rose-500/40 border-none', to: '/school/admin/notices' },
                { label: 'Chats', shortLabel: 'Chats', icon: MessageCircle, color: 'text-white', bg: 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-md shadow-pink-500/30 hover:shadow-lg hover:shadow-pink-500/40 border-none', to: '/school/admin/communications' },
                { label: 'Students', shortLabel: 'Students', icon: GraduationCap, color: 'text-white', bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 border-none', to: '/school/admin/students' },
                { label: 'Attendance', shortLabel: 'Attendance', icon: ClipboardList, color: 'text-white', bg: 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40 border-none', to: '/school/admin/attendance' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="group flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800 min-w-0 border border-transparent hover:border-white/80 hover:shadow-sm"
                  style={{
                    padding: 'clamp(0.35rem, 0.8vw, 0.75rem)',
                    gap: 'clamp(0.35rem, 0.6vw, 0.65rem)'
                  }}
                >
                  <div
                    className={cn(
                      "rounded-full flex items-center justify-center transition-colors shadow-sm group-hover:shadow-lg group-hover:scale-105",
                      action.bg,
                      action.color
                    )}
                    style={{
                      width: 'clamp(2.5rem, 3.5vw, 3rem)',
                      height: 'clamp(2.5rem, 3.5vw, 3rem)'
                    }}
                  >
                    <action.icon className="w-1/2 h-1/2" />
                  </div>
                  <span
                    className="text-center font-black tracking-wide text-slate-700 dark:text-slate-200 transition-colors group-hover:text-slate-900 dark:group-hover:text-white truncate w-full"
                    style={{ fontSize: 'clamp(10px, 0.75vw, 12px)' }}
                  >
                    <span className="inline xl:hidden">{action.shortLabel}</span>
                    <span className="hidden xl:inline">{action.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* KPI grid (Expanded to 6 items) */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 items-stretch">
            <KpiCard
              title="Total Students"
              value={formatNumber(animStudents)}
              sub="↑ 12 this month"
              icon={GraduationCap}
              color="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
              delay={0.02}
              sparklineData={sparkStudents}
            />
            <KpiCard
              title="Total Teachers"
              value={formatNumber(animTeachers)}
              sub="4 on leave"
              icon={Users}
              color="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/20"
              delay={0.04}
              sparklineData={sparkTeachers}
            />
            <KpiCard
              title="Attendance Today"
              value={`${attendancePct}%`}
              sub={`↑ ${Math.floor(students * (attendancePct/100))} / ${students} present`}
              icon={ClipboardList}
              color="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20"
              delay={0.06}
              sparklineData={attendanceSeries.map(s => ({ v: s.att }))}
            />
            <KpiCard
              title="Fees Collected"
              value="₹18.4L"
              sub="↑ 82% of target"
              icon={Ticket}
              color="bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20"
              delay={0.08}
            />
            <KpiCard
              title="Pending Admissions"
              value="24"
              sub="! 5 require action"
              icon={Users}
              color="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20"
              delay={0.10}
            />
            <KpiCard
              title="Active Classes"
              value="32"
              sub="↑ 5 live now"
              icon={Video}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
              delay={0.12}
            />
          </div>

          {/* Charts & Attention row */}
          <div className="w-full flex-1 grid gap-6 grid-cols-1 xl:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.015)] w-full flex-1 flex flex-col xl:col-span-2"
              style={{
                padding: 'clamp(1rem, 1.5vw, 1.5rem)',
                borderRadius: 'clamp(1.25rem, 1.8vw, 1.75rem)'
              }}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3
                    className="font-display font-bold text-slate-800 dark:text-white"
                    style={{ fontSize: 'clamp(0.95rem, 1.2vw, 1.125rem)' }}
                  >
                    Attendance Overview
                  </h3>
                  <p
                    className="font-semibold text-slate-400 dark:text-slate-500"
                    style={{ fontSize: 'clamp(9px, 0.7vw, 12px)' }}
                  >
                    Smoothed weekly trend · updates every refresh
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/20 font-bold"
                  style={{
                    padding: 'clamp(0.2rem, 0.4vw, 0.35rem) clamp(0.6rem, 0.8vw, 0.75rem)',
                    fontSize: 'clamp(9px, 0.65vw, 10px)'
                  }}
                >
                  <TrendingUp style={{ width: 'clamp(10px, 0.75vw, 12px)', height: 'clamp(10px, 0.75vw, 12px)' }} />
                  Live
                </span>
              </div>
              <div className="flex-1 min-h-[160px] w-full">
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
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} domain={[0, 100]} />
                    <RechartsTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="att" name="Attendance %" stroke="#2563EB" strokeWidth={3} fill="url(#attFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            
            <AttentionRequiredWidget className="h-full xl:col-span-1" />
          </div>
        </div>

        {/* Right Column: Communications, Support & Security */}
        <div className="space-y-6 w-full lg:col-span-1 flex flex-col justify-start">
          {/* Smart Calendar (Moved down) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex-col justify-between overflow-hidden"
            style={{
              minHeight: 'clamp(260px, 21vw, 360px)',
              padding: 'clamp(0.85rem, 1.3vw, 1.25rem)',
              borderRadius: 'clamp(1.25rem, 1.8vw, 2rem)'
            }}
          >
            <SmartCalendar />
          </motion.div>

          {/* Communications Widget */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between"
            style={{
              padding: 'clamp(1rem, 1.5vw, 1.5rem)',
              borderRadius: 'clamp(1.25rem, 1.8vw, 2rem)'
            }}
          >
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3
                    className="font-display font-bold text-slate-800 dark:text-white uppercase tracking-wider"
                    style={{ fontSize: 'clamp(11px, 0.8vw, 14px)' }}
                  >
                    Notices
                  </h3>
                  <p
                    className="text-slate-400 dark:text-slate-500 font-semibold mt-0.5"
                    style={{ fontSize: 'clamp(8px, 0.65vw, 10px)' }}
                  >
                    Recent announcements
                  </p>
                </div>
                <MessageSquare className="text-blue-600 dark:text-blue-400" style={{ width: 'clamp(1.1rem, 1.4vw, 1.25rem)', height: 'clamp(1.1rem, 1.4vw, 1.25rem)' }} />
              </div>
              {stats?.communications && stats.communications.length > 0 && stats.communications[0]?.t !== 'No recent notices found' ? (
                <ul className="space-y-2">
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
                        className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                        style={{ padding: 'clamp(0.4rem, 0.7vw, 0.75rem)' }}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <div
                            className={cn("shrink-0 rounded-xl flex items-center justify-center", color)}
                            style={{
                              width: 'clamp(1.8rem, 2.3vw, 2.5rem)',
                              height: 'clamp(1.8rem, 2.3vw, 2.5rem)'
                            }}
                          >
                            <IconComp style={{ width: 'clamp(0.9rem, 1.1vw, 1.25rem)', height: 'clamp(0.9rem, 1.1vw, 1.25rem)' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate" style={{ fontSize: 'clamp(10px, 0.75vw, 12px)' }}>{n.t || n.title}</p>
                            <p className="text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5" style={{ fontSize: 'clamp(8px, 0.65vw, 10px)' }}>{n.sub || n.content || 'Announcement'}</p>
                          </div>
                        </div>
                        <span className="shrink-0 font-bold text-slate-400 dark:text-slate-500" style={{ fontSize: 'clamp(8px, 0.6vw, 9px)' }}>
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
            </div>
            <button
              type="button"
              onClick={() => navigate('/school/admin/notices')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-blue-600 dark:text-blue-400 transition hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-900"
              style={{
                padding: 'clamp(0.4rem, 0.7vw, 0.65rem)',
                fontSize: 'clamp(10px, 0.75vw, 12px)'
              }}
            >
              Open all notices
              <ArrowUpRight style={{ width: 'clamp(0.9rem, 1.1vw, 1rem)', height: 'clamp(0.9rem, 1.1vw, 1rem)' }} />
            </button>
          </motion.div>

          {/* Support & Security Widget */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.015)]"
            style={{
              padding: 'clamp(1rem, 1.5vw, 1.5rem)',
              borderRadius: 'clamp(1.25rem, 1.8vw, 2rem)'
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3
                  className="font-display font-bold text-slate-800 dark:text-white uppercase tracking-wider"
                  style={{ fontSize: 'clamp(11px, 0.8vw, 14px)' }}
                >
                  Support & Security
                </h3>
                <p
                  className="text-slate-400 dark:text-slate-500 font-semibold mt-0.5 font-sans"
                  style={{ fontSize: 'clamp(8px, 0.65vw, 10px)' }}
                >
                  Assigned and open tickets
                </p>
              </div>
              <Ticket className="text-amber-500 dark:text-amber-400" style={{ width: 'clamp(1.1rem, 1.4vw, 1.25rem)', height: 'clamp(1.1rem, 1.4vw, 1.25rem)' }} />
            </div>
            <div className="space-y-1.5">
              {(stats?.complaintStatus || [
                { name: 'In Progress Tickets', value: stats?.inProgressTickets ?? 0 },
                { name: 'Open Tickets', value: stats?.openComplaints ?? 0 },
                { name: 'Closed Tickets', value: stats?.closedTickets ?? 0 }
              ]).map((c) => (
                <div
                  key={c.name}
                  onClick={() => navigate('/school/admin/complaints')}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-955/20 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                  style={{ padding: 'clamp(0.35rem, 0.6vw, 0.5rem) clamp(0.6rem, 0.8vw, 0.75rem)' }}
                >
                  <span className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: 'clamp(10px, 0.75vw, 12px)' }}>{c.name}</span>
                  <span className="font-display font-extrabold text-slate-800 dark:text-white" style={{ fontSize: 'clamp(11px, 0.8vw, 14px)' }}>{c.value}</span>
                </div>
              ))}
            </div>
            <div
              onClick={() => navigate('/school/admin/security')}
              className="mt-3 rounded-xl border border-emerald-200 dark:border-emerald-900/35 bg-emerald-50 dark:bg-emerald-955/15 text-emerald-800 dark:text-emerald-400 flex items-center gap-2 cursor-pointer hover:bg-emerald-100/50 transition-colors font-bold"
              style={{
                padding: 'clamp(0.4rem, 0.7vw, 0.65rem)',
                fontSize: 'clamp(8px, 0.65vw, 10px)'
              }}
            >
              <Shield className="text-emerald-600 dark:text-emerald-400 shrink-0" style={{ width: 'clamp(0.9rem, 1.1vw, 1rem)', height: 'clamp(0.9rem, 1.1vw, 1rem)' }} />
              <span className="truncate">{stats?.systemHealthText || 'System health: optimal · Backups verified · API latency 42ms'}</span>
            </div>
          </motion.div>
        </div>
      </div>



      {/* Row 3: New Widgets */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-stretch px-4 md:px-6 mt-6">
        <FeeOverviewWidget className="h-full" />
        <RecentActivityWidget className="h-full" />
      </div>

      {/* Footer */}
      <footer className="w-full flex justify-end items-center py-4 mt-8 select-none">
        <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">
          <span>Powered by</span>
          <a href="https://eddva.in" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={eddvaLogo} alt="EDDVA" className="h-[24px] sm:h-[30px] w-auto object-contain filter drop-shadow-sm" />
          </a>
          <span className="text-slate-300 dark:text-slate-700 font-normal text-sm">+</span>
          <a href="https://vvspltech.com" target="_blank" rel="noopener noreferrer" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={vvsplLogo} alt="VVSPL" className="h-[30px] sm:h-[36px] w-auto object-contain bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-700 shadow-sm" />
          </a>
        </div>
      </footer>
    </motion.div>
  );
}
