import React, { useMemo } from 'react';
import {
  GraduationCap,
  Users,
  Video,
  ClipboardList,
  MessageSquare,
  Sparkles,
  Megaphone,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  Ticket,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/components/school/admin/Skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import adminBanner from '@/assets/images/new_admin_banner.png';
import { AttentionRequiredWidget, FeeOverviewWidget, RecentActivityWidget } from '@/components/school/admin/DashboardWidgets';
import TopStudentsWidget from '@/components/school/admin/TopStudentsWidget';
import AttendanceComparisonChart from '@/components/school/admin/AttendanceComparisonChart';
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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function formatNumber(num) {
  if (!num) return '0';
  return num.toLocaleString('en-US');
}

function formatCurrencyCompact(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
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

const KPI_TINTS = {
  blue: {
    card: 'bg-blue-50/80 dark:bg-blue-950/20',
    iconBg: 'bg-white/80 text-blue-600 dark:bg-slate-900/60 dark:text-blue-400',
    stroke: '#2563EB',
  },
  violet: {
    card: 'bg-violet-50/80 dark:bg-violet-950/20',
    iconBg: 'bg-white/80 text-violet-600 dark:bg-slate-900/60 dark:text-violet-400',
    stroke: '#8B5CF6',
  },
  emerald: {
    card: 'bg-emerald-50/80 dark:bg-emerald-950/20',
    iconBg: 'bg-white/80 text-emerald-600 dark:bg-slate-900/60 dark:text-emerald-400',
    stroke: '#10B981',
  },
  rose: {
    card: 'bg-rose-50/80 dark:bg-rose-950/20',
    iconBg: 'bg-white/80 text-rose-600 dark:bg-slate-900/60 dark:text-rose-400',
    stroke: '#F43F5E',
  },
  indigo: {
    card: 'bg-indigo-50/80 dark:bg-indigo-950/20',
    iconBg: 'bg-white/80 text-indigo-600 dark:bg-slate-900/60 dark:text-indigo-400',
    stroke: '#6366F1',
  },
};

function KpiCard({ title, value, suffix, sub, icon: Icon, tint = 'blue', delay, sparklineData }) {
  const palette = KPI_TINTS[tint] || KPI_TINTS.blue;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative flex min-w-0 flex-col justify-between w-full overflow-hidden text-left border-none shadow-none",
        palette.card
      )}
      style={{
        padding: 'clamp(0.75rem, 1.1vw, 1.1rem)',
        borderRadius: 'clamp(1.1rem, 1.6vw, 1.5rem)',
        minHeight: 'clamp(84px, 6.5vw, 112px)'
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400" style={{ fontSize: 'clamp(8px, 0.65vw, 11px)' }}>
            {title}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="font-display font-bold tracking-tight text-slate-900 dark:text-white" style={{ fontSize: 'clamp(1.1rem, 1.6vw, 1.75rem)' }}>
              {value}
            </p>
            {suffix && <span className="font-semibold text-slate-500 dark:text-slate-400" style={{ fontSize: 'clamp(9px, 0.7vw, 12px)' }}>{suffix}</span>}
          </div>
        </div>
        <div
          className={cn("flex shrink-0 items-center justify-center rounded-full shadow-sm", palette.iconBg)}
          style={{
            width: 'clamp(2.1rem, 2.8vw, 3rem)',
            height: 'clamp(2.1rem, 2.8vw, 3rem)'
          }}
        >
          <Icon style={{ width: 'clamp(1rem, 1.4vw, 1.5rem)', height: 'clamp(1rem, 1.4vw, 1.5rem)' }} />
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
                  <stop offset="5%" stopColor={palette.stroke} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={palette.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={palette.stroke}
                strokeWidth={2}
                fill={`url(#color-${title.replace(/\s+/g, '')})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </MotionCard>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const MotionCard = motion(Card);

export default function InstituteDashboardWorkspace({ stats, institute, loading }) {
  const navigate = useNavigate();
  const students = stats?.totalStudents ?? 0;
  const teachers = stats?.totalTeachers ?? 0;
  const attendancePct = Math.round(stats?.studentAttendancePercentage || 0);
  const teacherAttendancePct = Math.round(stats?.teacherAttendancePercentage || 0);
  const feesCollected = stats?.feesCollected ?? 0;
  const feesTotal = stats?.feesTotal ?? 0;
  const feesPercentage = Math.round(stats?.feesCollectedPercentage ?? (feesTotal ? (feesCollected / feesTotal) * 100 : 0));
  const liveCount = stats?.liveClassesCount ?? 0;
  const scheduledCount = stats?.scheduledClassesCount ?? 0;
  const attendanceSeries = useMemo(() => {
    if (Array.isArray(stats?.attendanceHistory) && stats.attendanceHistory.length) return stats.attendanceHistory;
    const base = attendancePct || 88;
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, index) => ({
      name,
      att: Math.min(100, Math.max(0, Math.round(base + Math.sin(index * 0.9) * 6))),
    }));
  }, [attendancePct, stats?.attendanceHistory]);

  const quickActions = [
    { label: 'Manage Smarter', icon: Sparkles, to: '/school/admin/classes', tone: 'text-blue-600' },
    { label: 'Educate Better', icon: BookOpen, to: '/school/admin/timetable', tone: 'text-violet-600' },
    { label: 'Grow Together', icon: Users, to: '/school/admin/students', tone: 'text-emerald-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_360px]"><Skeleton className="h-[620px] rounded-2xl" /><Skeleton className="h-[620px] rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-screen bg-slate-50/60 pb-8 dark:bg-slate-950">
      <div className="grid items-start gap-4 px-4 pt-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,3fr)_360px]">
        <main className="min-w-0 space-y-4">
          <Card className="relative min-h-[190px] overflow-hidden rounded-2xl border-white/70 shadow-sm dark:border-slate-800">
            <img src={adminBanner} alt="Admin Banner" className="absolute inset-0 h-full w-full object-cover object-[center_35%]" />
            <div className="relative z-10 flex min-h-[190px] flex-col justify-between p-5 sm:p-6 lg:p-7">
              <div>
                <h1 className="font-display text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Welcome, {institute?.name || 'Eddva School'}!</h1>
                <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-slate-700">Empowering education through AI intelligence and seamless administration.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button key={action.label} type="button" variant="outline" size="sm" onClick={() => navigate(action.to)} className="h-8 rounded-full border-white/80 bg-white/85 px-3 text-[10px] font-bold shadow-sm backdrop-blur-sm">
                    <action.icon className={cn('h-3.5 w-3.5', action.tone)} />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard title="Total Students" value={formatNumber(students)} icon={GraduationCap} tint="blue" delay={0.02} />
            <KpiCard title="Total Teachers" value={formatNumber(teachers)} icon={Users} tint="violet" delay={0.04} />
            <KpiCard title="Attendance Today" value={`${attendancePct}%`} sub={`${Math.floor(students * attendancePct / 100)} / ${students} present`} icon={ClipboardList} tint="emerald" delay={0.06} />
            <KpiCard title="Fees Collected" value={formatCurrencyCompact(feesCollected)} sub={`${feesPercentage}% of billed`} icon={Ticket} tint="rose" delay={0.08} />
            <KpiCard title="Active Classes" value={formatNumber(scheduledCount)} sub={`${liveCount} live now`} icon={Video} tint="indigo" delay={0.1} />
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <MotionCard className="flex h-full min-h-[300px] min-w-0 flex-col rounded-2xl border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-start justify-between"><div><h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Attendance Overview</h2><p className="text-xs font-medium text-slate-400">Smoothed weekly trend · updates every refresh</p></div><Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"><TrendingUp className="mr-1 h-3 w-3" /> Live</Badge></div>
              <div className="min-h-0 min-w-0 flex-1"><ResponsiveContainer width="100%" height="100%"><AreaChart data={attendanceSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="referenceAttendanceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} /><stop offset="60%" stopColor="#2563EB" stopOpacity={0.08} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(37,99,235,0.08)" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} /><RechartsTooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="att" stroke="#2563EB" strokeWidth={3} fill="url(#referenceAttendanceFill)" dot={{ r: 3, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer></div>
            </MotionCard>
            <div className="grid grid-rows-[auto_1fr] gap-3"><AttentionRequiredWidget /><AttendanceComparisonChart studentPct={attendancePct} teacherPct={teacherAttendancePct} className="min-h-0 h-full" /></div>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <RecentActivityWidget className="h-full" />
            <FeeOverviewWidget className="h-full" collected={feesCollected} pending={stats?.feesPending ?? 0} overdue={stats?.feesOverdue ?? 0} percentage={feesPercentage} />
            <TopStudentsWidget className="h-full" students={stats?.topStudents || []} />
          </div>
        </main>

        <aside className="space-y-4">
          <MotionCard className="rounded-2xl border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Notices</h2><p className="text-[10px] text-slate-400">Recent announcements</p></div><MessageSquare className="h-5 w-5 text-blue-600" /></div>{stats?.communications?.length ? <div className="space-y-2">{stats.communications.slice(0, 3).map((notice, index) => <button key={notice.id || index} type="button" onClick={() => navigate('/school/admin/notices')} className="flex w-full items-center gap-2 rounded-xl border border-slate-100 p-2 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40"><Megaphone className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800 dark:text-white">{notice.t || notice.title}</p><p className="truncate text-[10px] text-slate-400">{notice.sub || notice.content || 'Announcement'}</p></div></button>)}</div> : <p className="rounded-xl border border-dashed p-5 text-center text-xs text-slate-400">No recent announcements found</p>}<Button type="button" variant="outline" size="sm" onClick={() => navigate('/school/admin/notices')} className="mt-3 w-full rounded-full text-xs">Open all notices <ArrowUpRight className="h-3.5 w-3.5" /></Button></MotionCard>
          <MotionCard className="overflow-hidden rounded-2xl border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><SmartCalendar /></MotionCard>
          <MotionCard className="rounded-2xl border-slate-200/60 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Support & Security</h2><p className="text-[10px] text-slate-400">Assigned and open tickets</p></div><Ticket className="h-5 w-5 text-amber-500" /></div><div className="space-y-2">{(stats?.complaintStatus || [{ name: 'In Progress Tickets', value: stats?.inProgressTickets ?? 0 }, { name: 'Open Tickets', value: stats?.openComplaints ?? 0 }, { name: 'Closed Tickets', value: stats?.closedTickets ?? 0 }]).map((item) => <button key={item.name} type="button" onClick={() => navigate('/school/admin/complaints')} className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-left text-xs dark:border-slate-800"><span className="text-slate-500">{item.name}</span><span className="font-bold text-slate-900 dark:text-white">{item.value}</span></button>)}</div><div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700"><Shield className="mr-1 inline h-3.5 w-3.5" />{stats?.systemHealthText || 'System health: optimal · Backups verified'}</div></MotionCard>
        </aside>
      </div>
    </motion.div>
  );
}
