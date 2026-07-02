import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  FileText,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext, type ParentChild } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import StudentAvatar from "@/assets/images/Student_Avatar.png";
import SmartCalendar from "@/components/school/SmartCalendar";
import MaintenanceBroadcastBanner from "@/components/shared/MaintenanceBroadcastBanner";
import { CustomSelect } from "@/components/ui/CustomSelect";

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

  const loading = summaryQuery.isLoading || attendanceQuery.isLoading || marksQuery.isLoading || homeworkQuery.isLoading || testsQuery.isLoading;
  const analytics = buildAnalytics(summaryQuery.data, attendanceQuery.data, marksQuery.data, homeworkQuery.data, testsQuery.data);

  return (
    <div className="space-y-5 pb-10">
      <MaintenanceBroadcastBanner />
      {/* Top Grid for Welcome Card and Smart Calendar */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 xl:col-span-3 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white shadow-lg ring-1 ring-white/10 flex flex-col justify-between"
        >
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
                    Parent Portal
                  </span>
                  <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-200 backdrop-blur-sm">
                    School Module
                  </span>
                </div>
                <h1 className="font-display text-2xl font-black md:text-3xl text-white">
                  Welcome, {user?.name || "Parent"}! 👋 🌟
                </h1>
                <p className="mt-2 text-white/90 font-medium text-sm">
                  A focused view of attendance, marks, homework, tests, and school updates for the week.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md border border-white/20 shadow-inner">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200/80 mb-2">Active student</p>
                  <div className="min-w-[220px]">
                    <ChildSwitcher
                      activeChild={activeChild}
                      activeChildId={activeChildId}
                      childrenList={children}
                      setActiveChildId={setActiveChildId}
                    />
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
          tone={attendanceTone(analytics.attendancePct)}
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

      <div className="grid gap-5">
        <div className="space-y-5">
          <Panel
            title="Attendance Summary"
            action={<Badge tone={attendanceTone(analytics.attendancePct)}>{analytics.attendanceLabel}</Badge>}
          >
            {loading ? (
              <Skeleton className="h-20 rounded-2xl" />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-800">Class {formatClass(activeChild) || "All Classes"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Status: <span className={`font-bold ${toneStyles[attendanceTone(analytics.attendancePct)].text}`}>{getAttendanceStatusLabel(analytics.attendancePct)}</span>
                    </p>
                  </div>
                  <p className={`text-lg font-black ${toneStyles[attendanceTone(analytics.attendancePct)].text}`}>
                    {analytics.attendanceLabel}
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${toneStyles[attendanceTone(analytics.attendancePct)].bar}`}
                    style={{ width: `${analytics.attendancePct ?? 0}%` }}
                  />
                </div>
                {analytics.totalDays > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider mt-4">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-2 py-2 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
                      Present {analytics.presentDays}
                    </div>
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 px-2 py-2 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400">
                      Absent {analytics.absentDays}
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-2 py-2 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
                      Leave {analytics.leaveDays}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                      Total {analytics.totalDays}
                    </div>
                  </div>
                )}
              </div>
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
        <CustomSelect
          value={activeChildId || ""}
          options={childrenList.map((child) => ({ value: child.id, label: [child.name, formatClass(child)].filter(Boolean).join(" - ") }))}
          className="w-full"
        />
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
