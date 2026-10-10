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
  Clock,
  AlertCircle,
  CheckCircle2,
  Trophy,
  IndianRupee,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import adminBanner from '@/assets/images/new_admin_banner.png';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SmartCalendar from '@/components/school/SmartCalendar';
import api from '@/lib/api/school-client';
import { cn } from '@/lib/utils';

const attendanceChartConfig = {
  present: {
    label: 'Present',
    color: '#2563EB',
  },
  absent: {
    label: 'Absent',
    color: '#F43F5E',
  },
};

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

// ─── KPI Card matching exact UI screenshot ────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, iconBg, iconColor }) {
  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between font-semibold hover:shadow-md transition-shadow">
      <div className="flex flex-col min-w-0 flex-1 pr-2">
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
          {title}
        </p>
        <p className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight mt-1">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            {sub}
          </p>
        )}
      </div>

      <div className={cn("w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-xs", iconBg)}>
        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", iconColor)} />
      </div>
    </Card>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const formatINR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export default function InstituteDashboardWorkspace({ stats, institute, loading }) {
  const [flags, setFlags] = useState([]);
  useEffect(() => {
    let alive = true;
    api.get('/notifications', { params: { flagged: true, isRead: false, limit: 5 } })
      .then((res) => { const d = res.data?.data ?? res.data; if (alive) setFlags(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const navigate = useNavigate();

  const students = stats?.totalStudents ?? 150;
  const teachers = stats?.totalTeachers ?? 41;
  const attendancePct = Math.round(stats?.studentAttendancePercentage || 0);
  const teacherAttendancePct = Math.round(stats?.teacherAttendancePercentage || 0);
  const avgAttendancePct = Math.round((attendancePct + teacherAttendancePct) / 2);
  const attendanceDayLabel = stats?.attendanceDate
    ? new Date(`${stats.attendanceDate}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : 'Today';

  const animStudents = useAnimatedNumber(students);
  const animTeachers = useAnimatedNumber(teachers);

  const attendanceSeries = useMemo(() => {
    if (stats?.attendanceHistory && Array.isArray(stats.attendanceHistory) && stats.attendanceHistory.length > 0) {
      return stats.attendanceHistory;
    }
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => ({
      name,
      att: 0,
    }));
  }, [stats?.attendanceHistory]);

  const attendancePresentAbsentSeries = useMemo(() => {
    return attendanceSeries.map((s) => ({
      name: s.name,
      present: s.att,
      absent: s.att == null ? null : Math.max(0, 100 - s.att),
    }));
  }, [attendanceSeries]);

  const roleAttendanceData = [
    { name: 'Students', value: attendancePct || 0, color: '#2563EB' },
    { name: 'Teachers', value: teacherAttendancePct || 0, color: '#A855F7' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-16 p-6">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
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
    <motion.div variants={container} initial="hidden" animate="show" className="pb-12 bg-slate-50/60 dark:bg-slate-950 min-h-screen font-semibold text-slate-800 dark:text-slate-200">
      
      {/* ── Top Hero Section ── */}
      <div className="w-full px-4 md:px-6 pt-4 sm:pt-6 mb-6">
        <Card className="relative w-full overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-9 flex flex-col justify-between min-h-[220px] sm:min-h-[260px] lg:min-h-[280px] shadow-sm border border-white/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="absolute inset-0 z-0">
            <img
              src={adminBanner}
              alt="Admin Banner"
              className="size-full object-cover object-[center_35%]"
            />
          </div>

          <div className="relative z-10 flex flex-col justify-between size-full py-1">
            <div className="flex flex-col items-start gap-1.5 min-w-0 w-full md:max-w-[70%]">
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 leading-snug">
                Welcome, {institute?.name || 'Eddva School'}!
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-700 font-semibold mt-1 max-w-[500px] leading-relaxed">
                Empowering education through AI intelligence and seamless administration.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-white/90 text-slate-800 border-slate-200/80 px-3.5 py-1.5 backdrop-blur-md shadow-xs font-semibold text-xs rounded-full gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Manage Smarter
              </Badge>
              <Badge variant="outline" className="bg-white/90 text-slate-800 border-slate-200/80 px-3.5 py-1.5 backdrop-blur-md shadow-xs font-semibold text-xs rounded-full gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                Educate Better
              </Badge>
              <Badge variant="outline" className="bg-white/90 text-slate-800 border-slate-200/80 px-3.5 py-1.5 backdrop-blur-md shadow-xs font-semibold text-xs rounded-full gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Grow Together
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* ── KPI Cards Row (4 Cards) ── */}
      <div className="px-4 md:px-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="TOTAL STUDENTS"
            value={formatNumber(animStudents)}
            icon={GraduationCap}
            iconBg="bg-blue-50 text-blue-600"
            iconColor="text-blue-600"
          />
          <KpiCard
            title="TOTAL TEACHERS"
            value={formatNumber(animTeachers)}
            icon={Users}
            iconBg="bg-purple-50 text-purple-600"
            iconColor="text-purple-600"
          />
          <KpiCard
            title="ATTENDANCE"
            value={`${attendancePct}%`}
            sub={`↑ ${stats?.presentStudentsToday ?? 0} / ${students} present`}
            icon={ClipboardList}
            iconBg="bg-emerald-50 text-emerald-600"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="ACTIVE LECTURES"
            value="0"
            sub="0 live now"
            icon={Video}
            iconBg="bg-indigo-50 text-indigo-600"
            iconColor="text-indigo-600"
          />
        </div>
      </div>

      {/* ── Main Dashboard Row 1 ── */}
      <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Attendance Overview (Span 7) */}
        <div className="lg:col-span-7 flex">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 sm:p-6 w-full flex flex-col justify-between font-semibold">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Attendance Overview</CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Smoothed weekly trend · updates every refresh</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold text-xs px-2.5 py-1 gap-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                Live
              </Badge>
            </div>

            <ChartContainer config={attendanceChartConfig} className="mt-4 min-h-[220px] w-full flex-1 aspect-auto">
              <BarChart accessibilityLayer data={attendancePresentAbsentSeries} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="present" fill="var(--color-present)" radius={4} />
                <Bar dataKey="absent" fill="var(--color-absent)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Card>
        </div>

        {/* Middle Column: Attention Required & Attendance by Role (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Attention Required Card */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 font-semibold">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Attention Required</CardTitle>
              </div>
              <button onClick={() => navigate('/school/admin/students')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {flags.length > 0 ? (
              <ul className="space-y-2">
                {flags.map((fl) => (
                  <li key={fl.id}>
                    <button
                      type="button"
                      onClick={() => navigate(fl.actionUrl || '/school/admin/students')}
                      className="w-full text-left flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2.5 transition-colors"
                    >
                      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', String(fl.priority).toUpperCase() === 'HIGH' ? 'bg-rose-500' : 'bg-amber-400')} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-900 dark:text-white">{fl.title}</span>
                        <span className="block line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{fl.message}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No flags need attention right now.</p>
              </div>
            )}
          </Card>

          {/* Attendance by Role Card */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 font-semibold flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Attendance by Role</CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{attendanceDayLabel} · students vs teachers</CardDescription>
              </div>
              <Users className="w-5 h-5 text-slate-400" />
            </div>

            <div className="h-[140px] w-full flex items-center justify-center relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleAttendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius="68%"
                    outerRadius="90%"
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {roleAttendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-xl font-semibold text-slate-900 dark:text-white leading-none">{avgAttendancePct}%</p>
                 <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-1">AVG PRESENT</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs font-semibold pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600 dark:text-slate-300">Students {attendancePct}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-slate-600 dark:text-slate-300">Teachers {teacherAttendancePct}%</span>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* ── Main Dashboard Row 2: Calendar & Notices ── */}
      <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Smart Calendar (Span 7) */}
        <div className="lg:col-span-7 flex">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 sm:p-6 w-full font-semibold">
            <SmartCalendar />
          </Card>
        </div>

        {/* Notices (Span 5) */}
        <div className="lg:col-span-5 flex">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 sm:p-6 w-full flex flex-col justify-between font-semibold">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white uppercase tracking-wider">NOTICES</CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Recent announcements</CardDescription>
                </div>
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Science Exhibition', sub: 'Please refer to the notice for details of science ...' },
                  { title: 'Final Exam', sub: 'Last exam' },
                  { title: 'Summer vacation 2027', sub: 'Summer Vacation2027' }
                ].map((n, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/school/admin/notices')}
                    className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 cursor-pointer transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">{n.title}</p>
                      <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">{n.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/school/admin/notices')}
              className="mt-4 w-full rounded-2xl border-slate-200 font-semibold text-xs py-2.5 gap-2 text-slate-800 dark:text-slate-200"
            >
              Open all notices <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </div>

      {/* ── Main Dashboard Row 3: Recent Activity, Fee Overview, Star Students, Support & Security ── */}
      <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Recent Activity Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 flex flex-col justify-between font-semibold">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</CardTitle>
              </div>
              <button onClick={() => navigate('/school/admin/notices')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Syllabus behind...</p>
                    <p className="text-[10px] font-semibold text-slate-400">3d ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Fee Overview Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 flex flex-col justify-between font-semibold text-center">
          <div>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">Fee Overview</CardTitle>
              <button onClick={() => navigate('/school/admin/erp')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                View Reports <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {Number(stats?.feesTotal) > 0 ? (
              <div className="space-y-3 text-left">
                <div>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">{Math.round(stats?.feesCollectedPercentage || 0)}%</p>
                  <p className="text-[11px] text-slate-500">collected of {formatINR(stats?.feesTotal)}</p>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.round(stats?.feesCollectedPercentage || 0))}%` }} />
                </div>
                {[['Collected', stats?.feesCollected, 'bg-emerald-500'], ['Pending', stats?.feesPending, 'bg-amber-400'], ['Overdue', stats?.feesOverdue, 'bg-rose-500']].map(([label, v, dot]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className={`size-2 rounded-full ${dot}`} />{label}</span>
                    <span className="text-slate-900 dark:text-white">{formatINR(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center">
                <span className="text-4xl font-light text-slate-300 dark:text-slate-600 mb-2">₹</span>
                <p className="text-xs font-semibold text-slate-500">No fee records yet.</p>
              </div>
            )}
          </div>

          <Button
            onClick={() => navigate('/school/admin/erp')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-2xl shadow-sm"
          >
            View Fees Report
          </Button>
        </Card>

        {/* Star Students Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 flex flex-col justify-between font-semibold">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white">Star Students</CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-400 mt-0.5">Top XP earners this term</CardDescription>
              </div>
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>

            {(stats?.topStudents || []).length > 0 ? (
              <ul className="space-y-2">
                {stats.topStudents.slice(0, 5).map((st, i) => (
                  <li key={st.userId || i} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-xs text-slate-900 dark:text-white">{i + 1}. {st.name}</span>
                      {st.className && <span className="block text-[10px] text-slate-400">{st.className}{st.sectionName ? ` · ${st.sectionName}` : ''}</span>}
                    </span>
                    <span className="text-xs text-amber-600">{st.xp} XP</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-10 flex items-center justify-center text-center">
                <p className="text-xs font-semibold text-slate-400 max-w-[160px]">No XP activity recorded yet.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Support & Security Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl p-5 flex flex-col justify-between font-semibold">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">SUPPORT & SECURITY</CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-400 mt-0.5">Assigned and open tickets</CardDescription>
              </div>
              <Ticket className="w-5 h-5 text-amber-500" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">In Progress Tickets</span>
                <span className="text-slate-900 dark:text-white font-semibold">2</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Open Tickets</span>
                <span className="text-slate-900 dark:text-white font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Closed Tickets</span>
                <span className="text-slate-900 dark:text-white font-semibold">1</span>
              </div>
            </div>
          </div>

          {/* <div className="mt-3 p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-[10px] font-semibold">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">System health: optimal · Backups verified · API latency 42ms</span>
          </div> */}
        </Card>

      </div>

    </motion.div>
  );
}
