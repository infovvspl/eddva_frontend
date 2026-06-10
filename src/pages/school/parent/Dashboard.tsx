import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  UserRound,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext, type ParentChild } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import StudentAvatar from "@/assets/images/Student_Avatar.png";
import SmartCalendar from "@/components/school/SmartCalendar";

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

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

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

  const loading = summaryQuery.isLoading || attendanceQuery.isLoading || marksQuery.isLoading || homeworkQuery.isLoading || testsQuery.isLoading;
  const analytics = buildAnalytics(summaryQuery.data, attendanceQuery.data, marksQuery.data, homeworkQuery.data, testsQuery.data);
  const performanceBars = buildTrendBars(analytics.averageMarks);

  return (
    <div className="space-y-5 pb-10">
      {/* Top Grid for Welcome Card and Smart Calendar */}
      <div className="grid gap-6 lg:grid-cols-4 items-stretch">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-3 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white shadow-lg ring-1 ring-white/10 flex flex-col justify-between"
        >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-24 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="grid min-h-[310px] lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-50 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5" />
                    Parent Portal
                  </div>
                  <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {user?.name ? `Welcome, ${user.name}` : "Parent Dashboard"}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-blue-50/90 sm:text-base">
                    A focused view of attendance, marks, homework, tests, and school updates for the week.
                  </p>

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

          <div className="flex items-center gap-5 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="hidden h-32 w-28 shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-white/10 md:flex">
              <img src={StudentAvatar} alt="" className="h-36 object-contain" />
            </div>
            <div className="min-w-[220px]">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/50">Active student</p>
              <div className="mt-3">
                <ChildSwitcher
                  activeChild={activeChild}
                  activeChildId={activeChildId}
                  childrenList={children}
                  setActiveChildId={setActiveChildId}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      </motion.section>

      {/* Smart Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-1 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
      >
        <SmartCalendar />
      </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Attendance"
          value={analytics.attendanceLabel}
          change={`${analytics.presentDays}/${analytics.totalDays || analytics.presentDays + analytics.absentDays} present`}
          icon={CalendarCheck}
          tone={percentTone(analytics.attendancePct, 90, 75)}
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
          value={String(analytics.upcomingTests)}
          change={`${analytics.completedTests} completed`}
          icon={FileText}
          tone="violet"
          loading={loading}
          index={3}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Panel
            title="Attendance Summary"
            action={<Badge tone={percentTone(analytics.attendancePct, 90, 75)}>{analytics.attendanceLabel}</Badge>}
          >
            {loading ? (
              <Skeleton className="h-20 rounded-2xl" />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-800">Class {formatClass(activeChild) || "All Classes"}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      {analytics.presentDays}/{analytics.totalDays || analytics.presentDays + analytics.absentDays} present
                    </p>
                  </div>
                  <p className={`text-sm font-black ${toneStyles[percentTone(analytics.attendancePct, 90, 75)].text}`}>
                    {analytics.attendanceLabel}
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${toneStyles[percentTone(analytics.attendancePct, 90, 75)].bar}`}
                    style={{ width: `${analytics.attendancePct ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Performance Trend" action={<Badge tone={percentTone(analytics.averageMarks, 75, 60)}>Avg score</Badge>}>
            {loading ? (
              <Skeleton className="h-56 rounded-2xl" />
            ) : (
              <div>
                <div className="flex h-56 items-end justify-between gap-4 px-4 sm:px-12">
                  {performanceBars.map((item) => (
                    <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                      <div
                        className="w-10 rounded-t-lg bg-gradient-to-t from-indigo-500 to-violet-400 shadow-lg shadow-indigo-500/20"
                        style={{ height: `${item.value}%` }}
                      />
                      <span className="text-xs font-bold text-slate-500">{item.month}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-500">
                  <span>Avg Score</span>
                  <span className={analytics.averageMarks !== null && analytics.averageMarks >= 60 ? "text-emerald-600" : "text-amber-600"}>
                    {analytics.averageMarksLabel}
                  </span>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Academic Snapshot" action={<LinkBadge to="/school/parent/child">Full report</LinkBadge>}>
            <div className="space-y-3">
              <SnapshotRow icon={CheckCircle2} label="Present days" value={analytics.presentDays} tone="emerald" />
              <SnapshotRow icon={XCircle} label="Absent days" value={analytics.absentDays} tone="rose" />
              <SnapshotRow icon={ClipboardList} label="Homework submitted" value={analytics.submittedHomework} tone="amber" />
              <SnapshotRow icon={FileText} label="Upcoming tests" value={analytics.upcomingTests} tone="violet" />
            </div>
          </Panel>

          <Panel title="Recent Results" action={<Badge tone="blue">{analytics.resultCount} live</Badge>}>
            {loading ? (
              <LoadingRows />
            ) : analytics.recentResults.length ? (
              <div className="space-y-3">
                {analytics.recentResults.slice(0, 4).map((item, index) => (
                  <ResultRow key={item.id || index} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState icon={GraduationCap} title="No results published yet" text="Evaluated marks will appear here after teachers publish results." />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  tone,
  loading,
  index,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  tone: Tone;
  loading: boolean;
  index: number;
}) {
  const style = toneStyles[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20 rounded-xl" />
          ) : (
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          )}
          <span className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs font-black ${style.pill}`}>
            {change}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-base font-black text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${toneStyles[tone].pill}`}>
      {children}
    </span>
  );
}

function LinkBadge({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 hover:bg-indigo-100">
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function SnapshotRow({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: Tone }) {
  const style = toneStyles[tone];
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.pill}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="truncate text-sm font-black text-slate-800">{label}</p>
      </div>
      <p className={`text-lg font-black ${style.text}`}>{value}</p>
    </div>
  );
}

function ResultRow({ item }: { item: any }) {
  const title = item.testName || item.title || item.assessmentName || "Assessment";
  const marks = item.marks || item.score || item.percentage || item.marksObtained || "--";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">{title}</p>
          <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(item.date || item.createdAt || item.updatedAt) || "Recent result"}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-black text-slate-900">{marks}</p>
          {item.grade && <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Grade {item.grade}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <Icon className="h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
    </div>
  );
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
  if (childrenList.length > 1) {
    return (
      <div className="relative">
        <select
          value={activeChildId || ""}
          onChange={(event) => setActiveChildId(event.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-white/20 bg-white px-4 pr-11 text-sm font-black text-slate-800 shadow-sm outline-none focus:border-teal-300 focus:ring-4 focus:ring-white/20"
        >
          {childrenList.map((child) => (
            <option key={child.id} value={child.id}>
              {[child.name, formatClass(child)].filter(Boolean).join(" - ")}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white px-4 py-3 text-slate-900 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-sm font-black text-teal-700">
        {getInitial(activeChild?.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950">{activeChild?.name || "No student linked"}</p>
        <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-widest text-slate-400">
          {formatClass(activeChild) || "Class not set"}
        </p>
      </div>
    </div>
  );
}

function buildAnalytics(summary: any, attendance: any, marks: any, homework: any, tests: any) {
  const attendanceRecords = Array.isArray(attendance?.records) ? attendance.records : [];
  const presentDays = toNumber(attendance?.present) ?? countStatus(attendanceRecords, "present");
  const absentDays = toNumber(attendance?.absent) ?? countStatus(attendanceRecords, "absent");
  const lateDays = toNumber(attendance?.late) ?? countStatus(attendanceRecords, "late");
  const totalDays = attendanceRecords.length || presentDays + absentDays + lateDays;
  const attendancePct = toNumber(summary?.attendancePercentage ?? attendance?.percentage) ?? (totalDays ? Math.round(((presentDays + lateDays) / totalDays) * 100) : null);

  const results = Array.isArray(marks?.results) ? marks.results : Array.isArray(summary?.recentResults) ? summary.recentResults : [];
  const averageMarks = toNumber(summary?.averageMarks ?? marks?.average) ?? deriveAverage(results);

  const homeworkItems = Array.isArray(homework?.homework) ? homework.homework : Array.isArray(homework) ? homework : [];
  const submittedHomework = toNumber(summary?.homeworkSubmitted ?? homework?.submitted) ?? homeworkItems.filter(isSubmitted).length;
  const assignedHomework = toNumber(summary?.homeworkAssigned ?? homework?.assigned) ?? homeworkItems.length;
  const pendingHomework = Math.max(0, assignedHomework - submittedHomework);
  const homeworkPct = assignedHomework ? Math.round((submittedHomework / assignedHomework) * 100) : 0;

  const upcomingTests = Array.isArray(tests?.upcoming) ? tests.upcoming.length : toNumber(summary?.testsThisWeek) ?? 0;
  const completedTests = Array.isArray(tests?.past) ? tests.past.length : 0;

  return {
    attendancePct,
    attendanceLabel: attendancePct === null ? "--" : `${attendancePct}%`,
    presentDays,
    absentDays,
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
  };
}

function buildTrendBars(averageMarks: number | null) {
  const base = averageMarks ?? 60;
  return months.map((month, index) => ({
    month,
    value: Math.max(24, Math.min(96, base - 10 + index * 3)),
  }));
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

function formatDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
