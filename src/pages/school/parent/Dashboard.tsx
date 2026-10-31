import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useAuth } from "@/context/SchoolAuthContext";
import { parentClient } from "@/lib/api/parent-client";
import { formatDurationShort } from "@/lib/format";
import { useParentContext, type ParentChild } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import SmartCalendar from "@/components/school/SmartCalendar";
import MaintenanceBroadcastBanner from "@/components/shared/MaintenanceBroadcastBanner";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { cn } from "@/lib/utils";
import BgBanner from "@/assets/images/bgbanner6.png";

type Tone = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";

const toneStyles: Record<Tone, { icon: string; text: string; pill: string; bar: string }> = {
  blue: {
    icon: "bg-indigo-500 text-white",
    text: "text-indigo-600",
    pill: "bg-indigo-50 text-indigo-700",
    bar: "bg-indigo-500",
  },
  emerald: {
    icon: "bg-emerald-500 text-white",
    text: "text-emerald-600",
    pill: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  amber: {
    icon: "bg-amber-500 text-white",
    text: "text-amber-600",
    pill: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
  },
  rose: {
    icon: "bg-rose-500 text-white",
    text: "text-rose-600",
    pill: "bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
  },
  violet: {
    icon: "bg-violet-500 text-white",
    text: "text-violet-600",
    pill: "bg-violet-50 text-violet-700",
    bar: "bg-violet-500",
  },
  slate: {
    icon: "bg-slate-900 text-white",
    text: "text-slate-700",
    pill: "bg-slate-100 text-slate-600",
    bar: "bg-slate-500",
  },
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const { activeChildId, setActiveChildId, children } = useParentContext();
  const activeChild = children.find((child) => child.id === activeChildId);

  const summaryQuery = useQuery<any>({
    queryKey: ["parent-dashboard-summary", activeChildId],
    queryFn: () => activeChildId ? parentClient.getStudentSummary(activeChildId) : Promise.resolve(null),
    enabled: !!activeChildId,
    retry: 1,
  });

  const attendanceQuery = useQuery<any>({
    queryKey: ["parent-dashboard-attendance", activeChildId, currentMonth()],
    queryFn: () => activeChildId ? parentClient.getAttendance(activeChildId, currentMonth()) : Promise.resolve(null),
    enabled: !!activeChildId,
    retry: 1,
  });

  const marksQuery = useQuery<any>({
    queryKey: ["parent-dashboard-marks", activeChildId],
    queryFn: () => activeChildId ? parentClient.getMarks(activeChildId) : Promise.resolve(null),
    enabled: !!activeChildId,
    retry: 1,
  });

  const homeworkQuery = useQuery<any>({
    queryKey: ["parent-dashboard-homework", activeChildId],
    queryFn: () => activeChildId ? parentClient.getHomework(activeChildId, "All") : Promise.resolve(null),
    enabled: !!activeChildId,
    retry: 1,
  });

  const testsQuery = useQuery<any>({
    queryKey: ["parent-dashboard-tests", activeChildId],
    queryFn: () => activeChildId ? parentClient.getTests(activeChildId) : Promise.resolve(null),
    enabled: !!activeChildId,
    retry: 1,
  });

  const feeQuery = useQuery<any>({
    queryKey: ["parent-dashboard-fees", activeChildId],
    queryFn: () => activeChildId ? parentClient.getFeeSummary(activeChildId) : Promise.resolve(null),
    enabled: !!activeChildId,
    retry: 1,
  });

  const screenTimeQuery = useQuery<any>({
    queryKey: ["parent-dashboard-screentime", activeChildId],
    queryFn: () => activeChildId ? parentClient.getScreenTime(activeChildId, "week") : Promise.resolve(null),
    enabled: !!activeChildId,
    retry: 1,
  });

  const loading = summaryQuery.isLoading || attendanceQuery.isLoading || marksQuery.isLoading || homeworkQuery.isLoading || testsQuery.isLoading;
  const screenTime = screenTimeQuery.data as { todaySeconds?: number; totalSeconds?: number; days?: Array<{ date: string; activeSeconds: number }> } | null;
  const screenTimeDays = screenTime?.days ?? [];
  const screenTimeMaxSeconds = Math.max(1, ...screenTimeDays.map((d) => d.activeSeconds));
  const analytics = buildAnalytics(summaryQuery.data, attendanceQuery.data, marksQuery.data, homeworkQuery.data, testsQuery.data);
  const feeNotice = buildFeeNotice(feeQuery.data);

  const attTone = attendanceTone(analytics.attendancePct);
  const attendanceChart = [
    { name: "Present", value: analytics.presentDays, color: "#10B981" },
    { name: "Absent", value: analytics.absentDays, color: "#EF4444" },
    { name: "Leave", value: analytics.leaveDays, color: "#F59E0B" },
  ].filter((slice) => slice.value > 0);

  return (
    <div className="space-y-6 pb-10">
      <MaintenanceBroadcastBanner />

      {/* Welcome + active child */}
      <section className="relative min-h-[280px] overflow-hidden rounded-[2rem] shadow-xl shadow-blue-900/10">
        <div className="absolute inset-0 bg-cover bg-[center_35%] bg-no-repeat" style={{ backgroundImage: `url(${BgBanner})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
        <div className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 flex min-h-[280px] flex-col justify-center gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-xl flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white ring-1 ring-white/30 backdrop-blur">
                <ShieldCheck className="size-3.5 shrink-0" /> Parent Oversight Hub
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-400/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-100 ring-1 ring-emerald-300/40 backdrop-blur">
                Academic Year {academicYear()}
              </span>
            </div>

            <div>
              <h1 className="flex flex-wrap items-center gap-x-2 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
                Welcome,
                <span className="text-white">{user?.name || "Parent"}!</span>
                {/* <Sparkles className="size-6 shrink-0 text-sky-300" /> */}
              </h1>
              <p className="mt-1.5 max-w-md text-sm font-medium leading-relaxed text-white/85">
                Weekly academic progress, attendance logs, homework tasks, and school notices for your children.
              </p>
            </div>
          </div>

          <ChildSwitcher
            activeChild={activeChild}
            activeChildId={activeChildId}
            childrenList={children}
            setActiveChildId={setActiveChildId}
          />
        </div>
      </section>

      {/* Key numbers */}
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Attendance"
          value={analytics.attendanceLabel}
          change={`${analytics.presentDays}/${analytics.totalDays || analytics.presentDays + analytics.absentDays} present`}
          icon={CalendarCheck}
          tone={attTone}
          loading={loading}
          index={0}
        />
        <MetricCard
          title="Avg Marks"
          value={analytics.averageMarksLabel}
          change={`${analytics.resultCount} results`}
          icon={TrendingUp}
          tone={percentTone(analytics.averageMarks, 75, 60)}
          loading={loading}
          index={1}
        />
        <MetricCard
          title="Homework"
          value={analytics.homeworkLabel}
          change={`${analytics.pendingHomework} pending`}
          icon={ClipboardList}
          tone={analytics.homeworkTone}
          loading={loading}
          index={2}
        />
        <MetricCard
          title="Assessments"
          value={analytics.assessmentsLabel}
          change={`${analytics.upcomingTests} pending`}
          icon={FileText}
          tone="violet"
          loading={loading}
          index={3}
        />
        <MetricCard
          title="Screen Time"
          value={formatDurationShort(screenTime?.todaySeconds)}
          change={`${formatDurationShort(screenTime?.totalSeconds)} this week`}
          icon={Clock}
          tone="blue"
          loading={screenTimeQuery.isLoading}
          index={4}
          to="/school/parent/child?tab=screentime"
          className="min-[480px]:col-span-2 sm:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Panel
            icon={CalendarCheck}
            iconClass="from-blue-500 to-indigo-600 shadow-blue-500/30"
            title="Attendance Summary"
            subtitle={`Class ${formatClass(activeChild) || "All Classes"} · this month`}
            action={<Badge tone={attTone}>{getAttendanceStatusLabel(analytics.attendancePct)}</Badge>}
          >
            {loading ? (
              <Skeleton className="h-44 rounded-2xl" />
            ) : analytics.totalDays === 0 ? (
              <EmptyState icon={CalendarCheck} text="No attendance recorded this month yet." />
            ) : (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative size-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={attendanceChart} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={3} cornerRadius={6} stroke="none">
                        {attendanceChart.map((slice) => <Cell key={slice.name} fill={slice.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${toneStyles[attTone].text}`}>{analytics.attendanceLabel}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present</span>
                  </div>
                </div>
                <div className="grid w-full flex-1 grid-cols-2 gap-2.5">
                  {[
                    { label: "Present", value: analytics.presentDays, dot: "bg-emerald-500", box: "bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] text-emerald-700 ring-[#BBF0D6]" },
                    { label: "Absent", value: analytics.absentDays, dot: "bg-rose-500", box: "bg-gradient-to-br from-[#FEF2F2] to-[#FFE0E0] text-rose-700 ring-[#FBCFCF]" },
                    { label: "Leave", value: analytics.leaveDays, dot: "bg-amber-500", box: "bg-gradient-to-br from-[#FFF7ED] to-[#FFEAD2] text-amber-700 ring-[#FFDDB8]" },
                    { label: "Total", value: analytics.totalDays, dot: "bg-slate-400", box: "bg-gradient-to-br from-[#F8FAFC] to-[#EEF2F7] text-slate-600 ring-slate-200" },
                  ].map((row) => (
                    <div key={row.label} className={`flex items-center justify-between rounded-2xl px-4 py-3.5 ring-1 transition-transform hover:-translate-y-0.5 ${row.box}`}>
                      <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider">
                        <span className={`size-2 rounded-full ${row.dot}`} /> {row.label}
                      </span>
                      <span className="text-xl font-black">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel
            icon={Clock}
            iconClass="from-rose-500 to-red-600 shadow-rose-500/30"
            title="Screen Time"
            subtitle="Active time per day"
            action={
              <div className="flex items-center gap-3">
                <Badge tone="blue">{formatDurationShort(screenTime?.totalSeconds)} this week</Badge>
                <Link to="/school/parent/child?tab=screentime" className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-black text-indigo-600 hover:text-indigo-700">
                  Details <ChevronRight className="size-3.5" />
                </Link>
              </div>
            }
          >
            {screenTimeQuery.isLoading ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : screenTimeDays.length === 0 ? (
              <EmptyState icon={Clock} text="No screen-time data yet." />
            ) : (
              <div className="flex items-end gap-2 sm:gap-3">
                {screenTimeDays.map((day) => {
                  const heightPct = Math.max(6, Math.round((day.activeSeconds / screenTimeMaxSeconds) * 100));
                  const label = new Date(`${day.date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
                  return (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                      <p className="text-[9px] font-bold text-slate-400">{formatDurationShort(day.activeSeconds)}</p>
                      <div className="flex h-28 w-full items-end overflow-hidden rounded-lg bg-slate-100">
                        <div className="w-full rounded-lg bg-gradient-to-t from-indigo-600 to-blue-400" style={{ height: `${heightPct}%` }} />
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100">
            <SmartCalendar />
          </div>

          <Panel
            icon={Wallet}
            iconClass="from-amber-400 to-orange-500 shadow-amber-500/30"
            title="Fee Notice"
            subtitle="Latest payment and next due date"
            action={<Link to="/school/parent/fees" className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-black text-indigo-600 hover:text-indigo-700">View all <ChevronRight className="size-3.5" /></Link>}
          >
            {feeQuery.isLoading ? (
              <Skeleton className="h-28 rounded-2xl" />
            ) : (
              <div className="grid gap-3">
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] p-4 ring-1 ring-[#BBF0D6]">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">Last Deposited</p>
                    {feeNotice.lastPayment ? (
                      <>
                        <p className="text-sm font-black text-emerald-700">{formatINR(feeNotice.lastPayment.amountPaid)}</p>
                        <p className="truncate text-xs font-semibold text-emerald-700/70">
                          {feeNotice.lastPayment.title} · {formatDate(feeNotice.lastPayment.paidDate)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold italic text-slate-400">No payments yet.</p>
                    )}
                  </div>
                </div>
                <div className={cn("flex items-center gap-4 rounded-2xl p-4 ring-1", feeNotice.nextDue ? "bg-gradient-to-br from-[#FFF7ED] to-[#FFEAD2] ring-[#FFDDB8]" : "bg-gradient-to-br from-[#F8FAFC] to-[#EEF2F7] ring-slate-200")}>
                  <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg", feeNotice.nextDue ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/30" : "bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30")}>
                    <CalendarClock className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70">Next Due Date</p>
                    {feeNotice.nextDue ? (
                      <>
                        <p className="text-sm font-black text-amber-700">{formatINR(feeNotice.nextDue.balance)}</p>
                        <p className="truncate text-xs font-semibold text-amber-700/70">
                          {feeNotice.nextDue.title} · {formatDate(feeNotice.nextDue.dueDate)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold italic text-slate-400">Nothing due right now.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

const metricStyles: Record<Tone, { card: string; tile: string; foot: string; dot: string }> = {
  blue: { card: "from-[#F0F7FF] to-[#DCEBFF] border-[#CFE3FB]", tile: "from-blue-500 to-blue-600 shadow-blue-500/30", foot: "text-[#2563EB]", dot: "bg-[#3B82F6]" },
  emerald: { card: "from-[#ECFDF5] to-[#D1FAE5] border-[#BBF0D6]", tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30", foot: "text-[#059669]", dot: "bg-[#10B981]" },
  amber: { card: "from-[#FFF7ED] to-[#FFEAD2] border-[#FFDDB8]", tile: "from-orange-400 to-orange-600 shadow-orange-500/30", foot: "text-[#EA580C]", dot: "bg-[#F97316]" },
  rose: { card: "from-[#FEF2F2] to-[#FFE0E0] border-[#FBCFCF]", tile: "from-rose-500 to-red-600 shadow-rose-500/30", foot: "text-[#DC2626]", dot: "bg-[#EF4444]" },
  violet: { card: "from-[#F5F3FF] to-[#E7E0FF] border-[#DDD3FB]", tile: "from-violet-500 to-purple-600 shadow-violet-500/30", foot: "text-[#7C3AED]", dot: "bg-[#8B5CF6]" },
  slate: { card: "from-[#F8FAFC] to-[#EEF2F7] border-[#E2E8F0]", tile: "from-slate-600 to-slate-800 shadow-slate-500/30", foot: "text-slate-600", dot: "bg-slate-400" },
};

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  tone,
  loading,
  index,
  to,
  className,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  tone: Tone;
  loading: boolean;
  index: number;
  to?: string;
  className?: string;
}) {
  const style = metricStyles[tone];
  const body = (
    <>
      <div className="pointer-events-none absolute -bottom-8 -right-8 size-28 rounded-full bg-white/50 transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex items-start gap-3.5">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.tile} text-white shadow-lg`}>
          <Icon className="size-6" />
        </span>
        <div className="flex min-w-0 flex-col">
          {loading ? (
            <Skeleton className="h-8 w-16 rounded-xl" />
          ) : (
            <p className="truncate text-3xl font-black leading-none text-[#1E293B]">{value}</p>
          )}
          <p className="mt-1.5 truncate text-sm font-bold text-[#64748B]">{title}</p>
        </div>
      </div>
      <div className={`relative mt-4 flex items-center gap-1.5 text-[12px] font-bold ${style.foot}`}>
        <span className={`size-2 shrink-0 rounded-full ${style.dot}`} />
        <span className="truncate">{change}</span>
        {to && <ChevronRight className="ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
      </div>
    </>
  );
  const cardClass = cn(
    "group relative block overflow-hidden rounded-[1.5rem] border bg-gradient-to-br p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5",
    style.card,
    className,
  );
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.04 }} className={cardClass}>
      {to ? <Link to={to} className="block">{body}</Link> : body}
    </motion.div>
  );
}

function Panel({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${iconClass} text-white shadow-lg`}>
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-extrabold leading-tight tracking-tight text-[#112A46]">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-5" />
      </span>
      <p className="text-xs font-semibold text-slate-400">{text}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${toneStyles[tone].pill}`}>
      {children}
    </span>
  );
}

function academicYear() {
  const d = new Date();
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}–${String(start + 1).slice(2)}`;
}

function ChildSwitcher({
  childrenList,
  activeChild,
  activeChildId,
  setActiveChildId,
}: {
  childrenList: ParentChild[];
  activeChild?: ParentChild;
  activeChildId: string | null;
  setActiveChildId: (id: string) => void;
}) {
  const multiple = childrenList.length > 1;
  const [imageFailed, setImageFailed] = React.useState(false);
  React.useEffect(() => setImageFailed(false), [activeChild?.id, activeChild?.profileImage]);
  return (
    <div className="w-full shrink-0 overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30 ring-1 ring-white/60 lg:w-80">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Active Student
          </span>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600">
            {multiple ? `${childrenList.length} children` : "Linked"}
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-500/30">
            {activeChild?.profileImage && !imageFailed ? (
              <img
                src={activeChild.profileImage}
                alt={activeChild.name || "Student"}
                onError={() => setImageFailed(true)}
                className="size-full object-cover"
              />
            ) : (
              getInitial(activeChild?.name)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black leading-tight text-slate-950">{activeChild?.name || "No student linked"}</p>
            <span className="mt-1 inline-flex max-w-full truncate rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm shadow-blue-500/30">
              {formatClass(activeChild) || "Class not set"}
            </span>
          </div>
        </div>

        {multiple && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Switch student</p>
            <CustomSelect
              value={activeChildId || ""}
              onChange={setActiveChildId}
              options={childrenList.map((child) => ({ value: child.id, label: [child.name, formatClass(child)].filter(Boolean).join(" - ") }))}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function buildAnalytics(summary: any, attendance: any, marks: any, homework: any, tests: any) {
  const attendanceRecords = Array.isArray(attendance?.records) ? attendance.records : [];
  const presentDays = toNumber(summary?.attendanceSummary?.present ?? attendance?.present) ?? (countStatus(attendanceRecords, "present") + countStatus(attendanceRecords, "late"));
  const absentDays = toNumber(summary?.attendanceSummary?.absent ?? attendance?.absent) ?? countStatus(attendanceRecords, "absent");
  const leaveDays = toNumber(summary?.attendanceSummary?.leave ?? attendance?.leave) ?? countStatus(attendanceRecords, "leave");
  const totalDays = toNumber(summary?.attendanceSummary?.total ?? attendance?.total) ?? (attendanceRecords.length || (presentDays + absentDays + leaveDays));
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null;

  const results = Array.isArray(marks?.results) ? marks.results : Array.isArray(summary?.recentResults) ? summary.recentResults : [];
  const averageMarks = toNumber(summary?.averageMarks ?? marks?.average) ?? deriveAverage(results);

  const homeworkItems = Array.isArray(homework?.homework) ? homework.homework : Array.isArray(homework) ? homework : [];
  const submittedHomework = toNumber(summary?.homeworkSubmitted ?? homework?.submitted) ?? homeworkItems.filter(isSubmitted).length;
  const assignedHomework = toNumber(summary?.homeworkAssigned ?? homework?.assigned) ?? homeworkItems.length;
  const pendingHomework = Math.max(0, assignedHomework - submittedHomework);
  const homeworkPct = assignedHomework ? Math.round((submittedHomework / assignedHomework) * 100) : 0;

  const upcomingTests = Array.isArray(tests?.upcoming) ? tests.upcoming.length : toNumber(summary?.testsThisWeek) ?? 0;
  const completedTests = Array.isArray(tests?.past) ? tests.past.length : 0;
  const totalTests = upcomingTests + completedTests;

  return {
    attendancePct,
    attendanceLabel: attendancePct === null ? "--" : `${attendancePct}%`,
    presentDays,
    absentDays,
    leaveDays,
    totalDays,
    averageMarks,
    averageMarksLabel: averageMarks === null ? "--" : `${averageMarks}%`,
    resultCount: results.length,
    recentResults: results.slice(0, 5),
    submittedHomework,
    pendingHomework,
    homeworkPct,
    homeworkLabel: assignedHomework ? `${submittedHomework}/${assignedHomework}` : "--",
    homeworkTone: assignedHomework === 0 ? "slate" as Tone : homeworkPct >= 80 ? "emerald" as Tone : homeworkPct >= 50 ? "amber" as Tone : "rose" as Tone,
    upcomingTests,
    completedTests,
    totalTests,
    assessmentsLabel: totalTests ? `${completedTests}/${totalTests}` : "--",
  };
}

function formatINR(n: number) {
  return `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Last deposit + nearest due date, derived from the same payload the Fees page renders. */
function buildFeeNotice(fees: any) {
  const recentPayments = Array.isArray(fees?.recentPayments) ? fees.recentPayments : [];
  const dueFees = Array.isArray(fees?.dueFees) ? fees.dueFees : [];
  const upcomingFees = Array.isArray(fees?.upcomingFees) ? fees.upcomingFees : [];
  return {
    lastPayment: recentPayments[0] || null,
    nextDue: dueFees[0] || upcomingFees[0] || null,
  };
}

function countStatus(records: any[], status: string) {
  return records.filter((item) => String(item.status || "").toLowerCase() === status).length;
}

function deriveAverage(results: any[]) {
  const values = results
    .map((item) => toNumber(item.percentage ?? item.marks ?? item.score ?? item.marksObtained))
    .filter((value): value is number => value !== null);
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isSubmitted(item: any) {
  const status = String(item.status || item.submissionStatus || "").toLowerCase();
  return status.includes("submitted") || status.includes("complete") || Boolean(item.submittedAt);
}

function percentTone(value: number | null, strong: number, warning: number): Tone {
  if (value === null) return "slate";
  if (value >= strong) return "emerald";
  if (value >= warning) return "amber";
  return "rose";
}

function attendanceTone(value: number | null): Tone {
  if (value === null) return "slate";
  if (value >= 90) return "emerald";
  if (value >= 75) return "blue";
  if (value >= 60) return "amber";
  return "rose";
}

function getAttendanceStatusLabel(value: number | null): string {
  if (value === null) return "--";
  if (value >= 90) return "Excellent";
  if (value >= 75) return "Good";
  if (value >= 60) return "On Track";
  return "Needs Improvement";
}

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getInitial(name?: string | null) {
  return name?.trim()?.charAt(0).toUpperCase() || "?";
}

function formatClass(child?: ParentChild) {
  if (!child) return "";
  return [child.className, child.section].filter(Boolean).join(" - ");
}
