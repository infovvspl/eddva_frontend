import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Users,
  ClipboardList,
  MessageSquare,
  Sparkles,
  Megaphone,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Ticket,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trophy,
  IndianRupee,
  ChevronRight,
  Award,
  Cake,
  Gift,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import adminBanner from '@/assets/images/new_admin_banner.png';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SmartCalendar from '@/components/school/SmartCalendar';
import { useQuery } from '@tanstack/react-query';
import { birthdaysApi, birthdaySubtitle } from '@/lib/api/birthdays';
import FeeNoticesCard from '@/components/school/admin/FeeNoticesCard';
import api from '@/lib/api/school-client';
import { cn } from '@/lib/utils';

// ─── EDDVA brand palette (scoped to this dashboard, not the shared theme tokens) ──
const EDDVA_BLUE = '#013889';
const STUDENT_COLOR = '#013889'; // blue — students
const TEACHER_COLOR = '#8B5CF6'; // violet — teachers
const ATTENDANCE_COLOR = '#10B981'; // green — attendance

const performanceChartConfig = {
  score: { label: 'Avg score', color: EDDVA_BLUE },
  attendance: { label: 'Attendance', color: ATTENDANCE_COLOR },
};

const attendanceChartConfig = {
  studentPresent: { label: 'Students', color: STUDENT_COLOR },
  teacherPresent: { label: 'Teachers', color: TEACHER_COLOR },
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

function formatINR(n) {
  const v = Math.round(Number(n) || 0);
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

/**
 * Attention flags arrive as free-text { title: "Attendance flag: Rohit Sharma",
 * message: "Rohit Sharma has 62% attendance over the last 30 days (below 75%)." }
 * — this pulls the name and the one metric number out so the row can be laid
 * out as distinct columns instead of two stacked lines of prose repeated
 * per item (the "visually repetitive" list the redesign asks to fix).
 */
function parseFlag(flag) {
  const name = (flag.title || '').split(':').slice(1).join(':').trim() || flag.title;
  const metricMatch = (flag.message || '').match(/(\d+%|\d+(?:,\d{3})*)/);
  const metric = metricMatch ? metricMatch[0] : '';
  const isPerf = flag.category === 'PERFORMANCE';
  return { name, metric, isPerf };
}

/** "overdue since" phrasing (e.g. "2d overdue", "3mo overdue") — same relative-time
 * style as Recent Activity's "3d ago", applied to how long a fee has been unpaid. */
function overdueSince(dueDateStr) {
  if (!dueDateStr) return '';
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return '';
  const days = Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000));
  if (days < 1) return 'due today';
  if (days < 30) return `${days}d overdue`;
  if (days < 365) return `${Math.floor(days / 30)}mo overdue`;
  return `${Math.floor(days / 365)}y overdue`;
}

// ─── A. Summary KPI card ────────────────────────────────────────────────────
function KpiCard({ title, value, sub, subTone, icon: Icon, iconBg, iconColor }) {
  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 flex items-center justify-between font-semibold hover:shadow-md transition-shadow">
      <div className="flex flex-col min-w-0 flex-1 pr-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
          {title}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
          {value}
        </p>
        {sub && (
          <p className={cn('text-xs font-semibold mt-1 truncate', subTone || 'text-emerald-600 dark:text-emerald-400')}>
            {sub}
          </p>
        )}
      </div>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs', iconBg)}>
        <Icon className={cn('w-6 h-6', iconColor)} />
      </div>
    </Card>
  );
}

// ─── Shared section header (icon badge + title + description) ─────────────
function SectionHeading({ icon: Icon, title, description, iconBg, iconColor, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-1">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-4.5 h-4.5', iconColor)} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">{title}</h2>
          {description && <p className="text-xs font-semibold text-slate-400 truncate">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export default function InstituteDashboardWorkspace({ stats, institute, loading }) {
  const [flags, setFlags] = useState([]);
  useEffect(() => {
    let alive = true;
    api.get('/notifications', { params: { flagged: true, limit: 5 } })
      .then((res) => { const d = res.data?.data ?? res.data; if (alive) setFlags(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const navigate = useNavigate();
  const { data: todaysBirthdays } = useQuery({
    queryKey: ['school-birthdays', 1],
    queryFn: () => birthdaysApi.upcoming(1),
    staleTime: 5 * 60_000,
  });
  // Auto-scrolls the birthday list, pausing while the pointer is over it, looping at the bottom.
  const birthdayListRef = useRef(null);
  useEffect(() => {
    const el = birthdayListRef.current;
    if (!el || (todaysBirthdays?.length || 0) <= 3) return;
    let paused = false;
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    const id = window.setInterval(() => {
      if (paused) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) el.scrollTop = 0;
      else el.scrollTop += 1;
    }, 40);
    return () => {
      window.clearInterval(id);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [todaysBirthdays]);
  // Live flags computed by the dashboard API; the stored notifications are only a fallback
  // for an older backend that does not send them.
  const attentionFlags = Array.isArray(stats?.attentionFlags) ? stats.attentionFlags : flags;
  // Fee flags get their own card, separate from attendance/performance flags.
  const feeAttentionFlags = attentionFlags.filter((fl) => fl.category === 'FEE');
  const otherAttentionFlags = attentionFlags.filter((fl) => fl.category !== 'FEE');

  const students = stats?.totalStudents ?? 0;
  const teachers = stats?.totalTeachers ?? 0;
  const attendancePct = Math.round(stats?.studentAttendancePercentage || 0);
  const teacherAttendancePct = Math.round(stats?.teacherAttendancePercentage || 0);
  const presentToday = stats?.presentStudentsToday ?? 0;
  const absentToday = Math.max(0, students - presentToday);
  const attendanceDayLabel = stats?.attendanceDate
    ? new Date(`${stats.attendanceDate}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    : 'Today';

  // Average score: latest month in the performance trend, so the KPI card
  // isn't left blank just because no dedicated "avg score" field exists yet.
  const avgScore = useMemo(() => {
    const trend = stats?.performanceTrend;
    if (!Array.isArray(trend) || !trend.length) return null;
    return Math.round(trend[trend.length - 1]?.score ?? NaN) || null;
  }, [stats?.performanceTrend]);

  const animStudents = useAnimatedNumber(students);
  const animTeachers = useAnimatedNumber(teachers);

  const attendanceSeries = useMemo(() => {
    if (stats?.attendanceHistory && Array.isArray(stats.attendanceHistory) && stats.attendanceHistory.length > 0) {
      return stats.attendanceHistory;
    }
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => ({ name, att: 0 }));
  }, [stats?.attendanceHistory]);

  // One bar per role per day, so it's never ambiguous whether "attendance" means
  // students, teachers, or both — hovering a bar shows that role's percentage.
  const attendancePresentAbsentSeries = useMemo(() => {
    return attendanceSeries.map((s) => ({
      name: s.name,
      studentPresent: s.att,
      teacherPresent: s.teacherAtt ?? null,
    }));
  }, [attendanceSeries]);

  // Clearly-defined 2-segment donut: Present vs Absent (today), real counts only —
  // no fabricated "Late" slice the center % can't be traced back to.
  const attendanceSummaryData = [
    { name: 'Present', value: presentToday, color: ATTENDANCE_COLOR },
    { name: 'Absent', value: absentToday, color: '#F43F5E' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 pb-16 p-6">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="pb-12 bg-[#F5F7FC] dark:bg-slate-950 min-h-screen font-semibold text-slate-800 dark:text-slate-200">

      {/* ── Top Hero Section ── */}
      <div className="w-full px-4 md:px-6 pt-4 sm:pt-6 mb-6">
        <Card className="relative w-full overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-9 flex flex-col justify-between min-h-[200px] sm:min-h-[230px] shadow-sm border border-white/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="absolute inset-0 z-0">
            <img src={adminBanner} alt="Admin Banner" className="size-full object-cover object-[center_35%]" />
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
                <Sparkles className="w-3.5 h-3.5" style={{ color: EDDVA_BLUE }} />
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

      {/* ══════════════ A. SUMMARY KPI CARDS ══════════════ */}
      <div className="px-4 md:px-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            title="Students"
            value={formatNumber(animStudents)}
            sub={`${formatNumber(animTeachers)} teachers on roll`}
            subTone="text-slate-500 dark:text-slate-400"
            icon={GraduationCap}
            iconBg="bg-[#013889]/10"
            iconColor="text-[#013889]"
          />
          <KpiCard
            title="Attendance"
            value={`${attendancePct}%`}
            sub={`${presentToday} / ${students} present ${attendanceDayLabel.toLowerCase()}`}
            subTone="text-emerald-600 dark:text-emerald-400"
            icon={ClipboardList}
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            iconColor="text-emerald-600"
          />
          <KpiCard
            title="Avg. Score"
            value={avgScore != null ? `${avgScore}%` : '—'}
            sub={avgScore != null ? 'Latest month, all classes' : 'No assessments graded yet'}
            subTone="text-slate-500 dark:text-slate-400"
            icon={Award}
            iconBg="bg-violet-50 dark:bg-violet-950/40"
            iconColor="text-violet-600"
          />
          <KpiCard
            title="Pending Fees"
            value={formatINR((Number(stats?.feesPending) || 0) + (Number(stats?.feesOverdue) || 0))}
            sub={Number(stats?.feesOverdue) > 0 ? `incl. ${formatINR(stats?.feesOverdue)} overdue` : 'Nothing overdue'}
            subTone={Number(stats?.feesOverdue) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}
            icon={IndianRupee}
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            iconColor="text-amber-600"
          />
        </div>
      </div>

      {/* ══════════════ B. ANALYTICS SECTION — two balanced columns ══════════════ */}
      <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Attendance Trends */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 font-semibold">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Attendance Trends</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Students vs teachers, daily</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold text-xs px-2.5 py-1 gap-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              Live
            </Badge>
          </div>

          <ChartContainer config={attendanceChartConfig} className="h-[220px] w-full aspect-auto">
            <BarChart accessibilityLayer data={attendancePresentAbsentSeries} barCategoryGap="22%" barGap={3} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">{value}%</span>
                </div>
              )} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="studentPresent" name="Students" fill="var(--color-studentPresent)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="teacherPresent" name="Teachers" fill="var(--color-teacherPresent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>

          {(() => {
            const days = (attendancePresentAbsentSeries || []).filter((d) => d.studentPresent != null);
            if (!days.length) return null;
            const best = days.reduce((a, b) => (b.studentPresent > a.studentPresent ? b : a));
            const low = days.reduce((a, b) => (b.studentPresent < a.studentPresent ? b : a));
            const avg = Math.round(days.reduce((t, d) => t + d.studentPresent, 0) / days.length);
            return (
              <div className="grid grid-cols-3 gap-3 pt-4 mt-1 border-t border-slate-100 dark:border-slate-800">
                {[['Weekly average', `${avg}%`], ['Best day', `${best.name} · ${Math.round(best.studentPresent)}%`], ['Lowest day', `${low.name} · ${Math.round(low.studentPresent)}%`]].map(([label, value]) => (
                  <div key={label} className="pt-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>

        {/* Academic Performance */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 font-semibold">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Academic Performance</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Avg. scores vs attendance, monthly</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-[#013889] dark:bg-blue-950/40 dark:text-blue-300 font-semibold text-xs px-2.5 py-1 gap-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              6 months
            </Badge>
          </div>

          {(stats?.performanceTrend || []).length > 1 ? (
            <>
              <ChartContainer config={performanceChartConfig} className="h-[220px] w-full aspect-auto">
                <LineChart accessibilityLayer data={stats.performanceTrend} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} unit="%" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line dataKey="attendance" type="monotone" stroke="var(--color-attendance)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
              {(() => {
                const months = stats.performanceTrend;
                const latest = months[months.length - 1];
                const prev = months[months.length - 2];
                const delta = prev ? Math.round((latest?.score ?? 0) - (prev?.score ?? 0)) : 0;
                return (
                  <div className="grid grid-cols-3 gap-3 pt-4 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Latest avg. score</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{Math.round(latest?.score ?? 0)}%</p>
                    </div>
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Month-on-month</p>
                      <p className={cn('text-sm font-bold mt-0.5 flex items-center gap-1', delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                        {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {delta >= 0 ? '+' : ''}{delta}%
                      </p>
                    </div>
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Latest attendance</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{Math.round(latest?.attendance ?? 0)}%</p>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-center">
              <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-400 max-w-[220px]">Not enough graded assessments yet to show a monthly trend.</p>
            </div>
          )}
        </Card>
      </div>

      {/* ══════════════ C. ACTION CENTER — prioritize issues needing action ══════════════ */}
      <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Attention Required — compact rows: severity, name, metric, action */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 font-semibold">
          <SectionHeading
            icon={AlertCircle}
            iconBg="bg-rose-50 dark:bg-rose-950/40"
            iconColor="text-rose-500"
            title="Attention Required"
            description="Low attendance, low scores, missing work"
            action={
              <button onClick={() => navigate('/school/admin/attention-required')} className="text-xs font-semibold text-[#013889] hover:underline flex items-center gap-1 shrink-0">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />

          {otherAttentionFlags.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {otherAttentionFlags.map((fl) => (
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
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No flags need attention right now.</p>
            </div>
          )}
        </Card>

        {/* Fee Follow-ups — total overdue, account count, reminders, direct action */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 font-semibold flex flex-col">
          <SectionHeading
            icon={IndianRupee}
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            iconColor="text-amber-600"
            title="Fee Follow-ups"
            description="Overdue payments needing contact"
            action={
              <button onClick={() => navigate('/school/admin/fee-defaulters')} className="text-xs font-semibold text-[#013889] hover:underline flex items-center gap-1 shrink-0">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          />

          <div className="grid grid-cols-2 gap-3 mt-4 mb-1">
            <div className="rounded-xl bg-rose-50/70 dark:bg-rose-950/20 px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Total Overdue</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatINR(stats?.feesOverdue)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Accounts</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{formatNumber(stats?.feesOverdueAccounts)}</p>
            </div>
          </div>

          {feeAttentionFlags.length > 0 ? (
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {feeAttentionFlags.map((fl) => {
                const { name } = parseFlag(fl);
                const since = overdueSince(fl.dueDate);
                return (
                  <li key={fl.id}>
                    <button
                      type="button"
                      onClick={() => navigate(fl.actionUrl || '/school/admin/fee-defaulters')}
                      className="w-full text-left flex items-center gap-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-1.5 -mx-1.5 transition-colors"
                    >
                      <span className="size-2 rounded-full shrink-0 bg-amber-400" />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-900 dark:text-white">{name}</span>
                      {since && <span className="shrink-0 rounded-md bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">{since}</span>}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center flex-1">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No overdue fees right now.</p>
            </div>
          )}
        </Card>
      </div>

      {/* ══════════════ D. ROLE-WISE ATTENDANCE & DETAILED RECORDS ══════════════ */}
      <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Attendance Summary (donut) + Attendance by Role */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 font-semibold">
          <SectionHeading
            icon={Users}
            iconBg="bg-blue-50 dark:bg-blue-950/40"
            iconColor="text-[#013889]"
            title="Attendance Summary"
            description={`${attendanceDayLabel} · all students`}
          />

          <div className="flex items-center gap-5 mt-3">
            <div className="h-[130px] w-[130px] shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendanceSummaryData} cx="50%" cy="50%" innerRadius="68%" outerRadius="94%" paddingAngle={students ? 4 : 0} dataKey="value">
                    {attendanceSummaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{attendancePct}%</p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-1">Present</p>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2">
                <span className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ATTENDANCE_COLOR }} />Present</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatNumber(presentToday)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rose-50/60 dark:bg-rose-950/20 px-3 py-2">
                <span className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Absent</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{formatNumber(absentToday)}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Attendance by Role</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STUDENT_COLOR }} />Students</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{attendancePct}%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TEACHER_COLOR }} />Teachers</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{teacherAttendancePct}%</span>
            </div>
          </div>
        </Card>

        {/* Today's Birthdays — always light, regardless of app theme */}
        <Card className="bg-white border border-slate-200/70 shadow-sm rounded-2xl p-4 font-semibold flex flex-col w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex w-7 h-7 items-center justify-center rounded-full bg-pink-500 text-white shrink-0">
                <Cake className="w-3.5 h-3.5" />
              </span>
              <p className="text-sm font-bold text-slate-900">Today's Birthdays</p>
            </div>
            <button onClick={() => navigate('/school/admin/notices')} className="text-[11px] font-semibold text-[#013889] hover:underline flex items-center gap-1 shrink-0">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div ref={birthdayListRef} className="mt-3 space-y-1.5 flex-1 max-h-64 overflow-y-auto pr-1">
            {!todaysBirthdays?.length ? (
              <div className="flex items-center gap-2 py-1.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-xs font-semibold text-slate-400">No birthdays today</p>
              </div>
            ) : (
              todaysBirthdays.map((b) => (
                <div key={b.userId} className="flex items-center gap-2 py-1.5">
                  {b.avatar ? (
                    <img src={b.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">
                      {b.name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{b.name}</p>
                    <p className="text-[10px] font-semibold text-slate-400 truncate">{birthdaySubtitle(b)}</p>
                  </div>
                  <span className="flex w-6 h-6 items-center justify-center rounded-full bg-pink-500 text-white shrink-0">
                    <Gift className="w-3 h-3" />
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Fee Notices — deposits + what's due next, own row so it can't stretch siblings ── */}
      <div className="px-4 md:px-6 mb-6">
        <FeeNoticesCard />
      </div>

      {/* ── Calendar & Notices ── */}
      <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-7 flex">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 w-full font-semibold">
            <SmartCalendar />
          </Card>
        </div>

        <div className="lg:col-span-5 flex">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 w-full flex flex-col justify-between font-semibold">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Notices</CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Recent announcements</CardDescription>
                </div>
                <MessageSquare className="w-5 h-5" style={{ color: EDDVA_BLUE }} />
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
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60 cursor-pointer transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Megaphone className="w-4 h-4" style={{ color: EDDVA_BLUE }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{n.title}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">{n.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/school/admin/notices')}
              className="mt-4 w-full rounded-xl border-slate-200 font-semibold text-xs py-2.5 gap-2 text-slate-800 dark:text-slate-200"
            >
              Open all notices <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </div>


      {/* ── Fee Overview, Star Students, Support & Security ── */}
      <div className="px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 flex flex-col justify-between font-semibold">
          <div>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Fee Overview</CardTitle>
              <button onClick={() => navigate('/school/admin/erp')} className="text-[11px] font-semibold text-[#013889] hover:underline flex items-center gap-0.5">
                View Reports <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {Number(stats?.feesTotal) > 0 ? (
              <div className="space-y-3 text-left">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{Math.round(stats?.feesCollectedPercentage || 0)}%</p>
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
            className="w-full text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm mt-4"
            style={{ backgroundColor: EDDVA_BLUE }}
          >
            View Fees Report
          </Button>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 flex flex-col justify-between font-semibold">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Star Students</CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-400 mt-0.5">Top XP earners this term</CardDescription>
              </div>
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>

            {(stats?.topStudents || []).length > 0 ? (
              <ul className="space-y-2">
                {stats.topStudents.slice(0, 5).map((st, i) => (
                  <li key={st.userId || i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
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

        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-2xl p-5 flex flex-col justify-between font-semibold">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Support & Security</CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-400 mt-0.5">Assigned and open tickets</CardDescription>
              </div>
              <Ticket className="w-5 h-5 text-amber-500" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">In Progress Tickets</span>
                <span className="text-slate-900 dark:text-white font-bold">2</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Open Tickets</span>
                <span className="text-slate-900 dark:text-white font-bold">0</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300">Closed Tickets</span>
                <span className="text-slate-900 dark:text-white font-bold">1</span>
              </div>
            </div>
          </div>
        </Card>

      </div>

    </motion.div>
  );
}
