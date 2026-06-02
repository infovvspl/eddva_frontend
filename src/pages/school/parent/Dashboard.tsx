import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  MessageCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext, type ParentChild } from "@/components/school/parent/ParentAuthGuard";
import { useAuth } from "@/context/SchoolAuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentSummary {
  attendancePercentage?: number | null;
  averageMarks?: number | null;
  homeworkSubmitted?: number | null;
  homeworkAssigned?: number | null;
  testsThisWeek?: number | null;
  upcomingEvents?: Array<{ month?: string; date?: string; title?: string; type?: string }>;
  recentResults?: Array<{ testName?: string; date?: string; marks?: string; grade?: string }>;
}

interface ParentNotification {
  title?: string;
  message?: string;
  time?: string;
}

export default function ParentDashboard() {
  const {
    activeChildId,
    setActiveChildId,
    children,
    childrenError,
    refetchChildren,
  } = useParentContext();
  const { user } = useAuth();

  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    refetch: refetchSummary,
  } = useQuery<StudentSummary | null>({
    queryKey: ["parent-student-summary", activeChildId],
    queryFn: () => (activeChildId ? parentClient.getStudentSummary(activeChildId) as Promise<StudentSummary> : Promise.resolve(null)),
    enabled: !!activeChildId,
    retry: 1,
  });

  const { data: notifications, isLoading: isLoadingNotifs } = useQuery<ParentNotification[]>({
    queryKey: ["parent-notifications", activeChildId],
    queryFn: () => parentClient.getNotifications() as Promise<ParentNotification[]>,
    retry: 1,
  });

  const activeChild = children.find((c) => c.id === activeChildId);
  const attendanceValue = formatPercent(summary?.attendancePercentage);
  const averageMarksValue = formatPercent(summary?.averageMarks);
  const homeworkValue = hasValue(summary?.homeworkSubmitted) && hasValue(summary?.homeworkAssigned)
    ? `${summary?.homeworkSubmitted}/${summary?.homeworkAssigned}`
    : null;
  const testsValue = hasValue(summary?.testsThisWeek) ? String(summary?.testsThisWeek) : null;
  const homeworkProgress = getProgress(summary?.homeworkSubmitted, summary?.homeworkAssigned);
  const updates = Array.isArray(notifications) ? notifications.slice(0, 4) : [];
  const readiness = getReadiness(summary);

  return (
    <div className="relative left-1/2 w-screen max-w-[1680px] -translate-x-1/2 px-4 pb-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto space-y-6">
        {childrenError && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <p className="text-sm font-semibold text-rose-700">Could not load your children. Please try again.</p>
            <button
              type="button"
              onClick={() => refetchChildren()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white shadow-lg ring-1 ring-white/10"
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
                </div>

                <ChildSwitcher
                  childrenList={children}
                  activeChild={activeChild}
                  activeChildId={activeChildId}
                  setActiveChildId={setActiveChildId}
                />
              </div>
            </div>

            <div className="relative border-t border-white/10 bg-slate-950/25 p-6 text-white backdrop-blur-sm sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Active student</p>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white text-2xl font-bold text-indigo-600 shadow-lg shadow-black/20">
                      {getInitial(activeChild?.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-2xl font-bold tracking-tight">{activeChild?.name || "—"}</h3>
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white/55">
                        <GraduationCap className="h-4 w-4 text-emerald-300" />
                        {formatClass(activeChild) || "—"}
                      </p>
                      {activeChild?.admissionNo && (
                        <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-wider text-white/40">
                          Adm. {activeChild.admissionNo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <WeeklyReadiness loading={isLoadingSummary} readiness={readiness} />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            title="Attendance"
            value={attendanceValue}
            caption="Monthly presence"
            icon={<Calendar className="h-5 w-5" />}
            loading={isLoadingSummary}
            error={isErrorSummary}
            onRetry={() => refetchSummary()}
            tone={getPercentTone(summary?.attendancePercentage, 85, 75)}
          />
          <StatCard
            title="Avg Marks"
            value={averageMarksValue}
            caption="Academic average"
            icon={<TrendingUp className="h-5 w-5" />}
            loading={isLoadingSummary}
            error={isErrorSummary}
            onRetry={() => refetchSummary()}
            tone={getPercentTone(summary?.averageMarks, 75, 60)}
          />
          <StatCard
            title="Homework"
            value={homeworkValue}
            caption={`${homeworkProgress}% submitted`}
            icon={<FileText className="h-5 w-5" />}
            loading={isLoadingSummary}
            error={isErrorSummary}
            onRetry={() => refetchSummary()}
            tone="blue"
            progress={homeworkProgress}
          />
          <StatCard
            title="Tests This Week"
            value={testsValue}
            caption="Scheduled assessments"
            icon={<CheckCircle2 className="h-5 w-5" />}
            loading={isLoadingSummary}
            error={isErrorSummary}
            onRetry={() => refetchSummary()}
            tone="violet"
          />
        </motion.section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
          <Panel
            icon={<Bell className="h-5 w-5 text-indigo-600" />}
            title="Today's Updates"
            subtitle="Latest communication and school activity"
            action={<Link to="/school/parent/notifications" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">Open alerts <ArrowRight className="h-3.5 w-3.5" /></Link>}
          >
            {isLoadingNotifs ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-28 w-full rounded-3xl" />
              </div>
            ) : updates.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {updates.map((n: any, i: number) => (
                  <UpdateCard key={i} item={n} />
                ))}
              </div>
            ) : (
              <EmptyShowcase
                icon={<CheckCircle2 className="h-10 w-10 text-emerald-500" />}
                title="All caught up"
                message="No new updates right now. Important notices, attendance changes, and messages will appear here."
              />
            )}
          </Panel>

          <div className="grid gap-5">
            <QuickActions />

            <Panel
              icon={<Calendar className="h-5 w-5 text-violet-600" />}
              title="Upcoming"
              subtitle="Events and reminders"
              compact
            >
              {isLoadingSummary ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : summary?.upcomingEvents?.length > 0 ? (
                <div className="space-y-3">
                  {summary.upcomingEvents.map((evt: any, i: number) => (
                    <EventRow key={i} item={evt} />
                  ))}
                </div>
              ) : (
                <CompactEmpty title="No upcoming events" message="Your calendar is clear for now." />
              )}
            </Panel>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            title="Recent Results"
            subtitle="Latest test performance"
          >
            {isLoadingSummary ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : summary?.recentResults?.length > 0 ? (
              <div className="space-y-3">
                {summary.recentResults.map((res: any, i: number) => (
                  <ResultRow key={i} item={res} />
                ))}
              </div>
            ) : (
              <EmptyShowcase
                icon={<FileText className="h-10 w-10 text-slate-300" />}
                title="No recent results"
                message="Published marks and grades will appear here with subject-wise context."
              />
            )}
          </Panel>

          <section className="rounded-[30px] border border-slate-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Progress focus</p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">What to watch next</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <FocusTile label="Attendance" value={attendanceValue || "Pending"} tone={getPercentTone(summary?.attendancePercentage, 85, 75)} />
              <FocusTile label="Homework" value={homeworkValue || "Pending"} tone="blue" />
              <FocusTile label="Tests" value={testsValue || "Pending"} tone="violet" />
            </div>
          </section>
        </section>
      </div>
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
      <div className="relative w-full md:w-72">
        <select
          className="h-13 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm font-bold text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
          value={activeChildId || ""}
          onChange={(e) => setActiveChildId(e.target.value)}
        >
          {childrenList.map((child) => (
            <option key={child.id} value={child.id}>
              {[child.name, formatClass(child)].filter(Boolean).join(" · ")}
              {child.admissionNo ? ` (${child.admissionNo})` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm md:w-auto">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700">
        {getInitial(activeChild?.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight text-slate-950">{activeChild?.name || "—"}</p>
        <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">{formatClass(activeChild) || "—"}</p>
      </div>
    </div>
  );
}

function WeeklyReadiness({ loading, readiness }: { loading: boolean; readiness: Readiness }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">Weekly readiness</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-40 rounded-xl bg-white/20" />
          ) : (
            <p className="mt-2 text-3xl font-bold">{readiness.headline}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${readinessTone[readiness.tone].badge}`}>
          <BookOpenCheck className="h-5 w-5" />
        </div>
      </div>

      {loading ? (
        <Skeleton className="mt-4 h-2.5 w-full rounded-full bg-white/20" />
      ) : (
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${readinessTone[readiness.tone].bar}`}
              style={{ width: `${(readiness.score / 3) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
            {readiness.hasData ? `${readiness.score}/3 signals on track` : "No signals yet"}
          </p>
        </div>
      )}

      <p className="mt-3 text-sm font-medium leading-6 text-white/55">{readiness.message}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  caption,
  icon,
  tone,
  loading,
  error,
  progress,
  onRetry,
}: {
  title: string;
  value: string | null;
  caption: string;
  icon: React.ReactNode;
  tone: Tone;
  loading: boolean;
  error: boolean;
  progress?: number;
  onRetry?: () => void;
}) {
  const styles = toneStyles[tone];
  const showValue = !loading && !error && !!value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950"
    >
      <div className={`absolute inset-0 opacity-0 transition group-hover:opacity-100 ${styles.wash}`} />
      <div className="relative">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-13 w-13 items-center justify-center rounded-3xl border ${styles.soft} ${styles.text}`}>
          {icon}
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${styles.pill}`}>
          <ArrowUpRight className="h-3 w-3" />
          Live
        </span>
      </div>
      <p className="mt-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      {loading ? (
        <Skeleton className="mt-3 h-10 w-24 rounded-xl" />
      ) : showValue ? (
        <p className={`mt-3 text-4xl font-bold tracking-tight ${styles.text}`}>{value}</p>
      ) : (
        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-300">—</p>
      )}
      {error ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-rose-600 transition hover:text-rose-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Couldn't load · Retry
        </button>
      ) : (
        <p className="mt-2 text-sm font-semibold text-slate-500">{showValue ? caption : "No data yet"}</p>
      )}
      {typeof progress === "number" && (
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${progress}%` }} />
        </div>
      )}
      </div>
    </motion.div>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
  action,
  compact = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <div className={`flex items-start justify-between gap-4 border-b border-slate-100 ${compact ? "p-5" : "p-6"}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-950">{title}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className={compact ? "p-5" : "p-6"}>{children}</div>
    </motion.div>
  );
}

function UpdateCard({ item }: { item: any }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 transition hover:border-indigo-100 hover:bg-indigo-50/40">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <p className="line-clamp-1 text-sm font-bold text-slate-950">{item.title}</p>
            <span className="shrink-0 text-[11px] font-bold text-slate-400">{item.time}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">{item.message}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Child Report", href: "/school/parent/child", icon: GraduationCap, tone: "indigo" },
    { label: "Message", href: "/school/parent/communication", icon: MessageCircle, tone: "emerald" },
    { label: "Alerts", href: "/school/parent/notifications", icon: Bell, tone: "amber" },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold tracking-tight text-slate-800 dark:text-white">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-6">
        {actions.map((action) => {
          const Icon = action.icon;
          const styles = actionStyles[action.tone];
          return (
            <Link key={action.label} to={action.href} className="group flex flex-col items-center gap-3 text-center transition-all duration-300 hover:-translate-y-1">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 group-hover:shadow-xl ${styles}`}>
                  <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-slate-600 transition-colors group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

function EventRow({ item }: { item: any }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border border-violet-100 bg-white text-violet-700 shadow-sm">
        <span className="text-[10px] font-bold uppercase leading-none">{item.month}</span>
        <span className="mt-0.5 text-sm font-bold leading-none">{item.date}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{item.title}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{item.type}</p>
      </div>
    </div>
  );
}

function ResultRow({ item }: { item: any }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{item.testName}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-slate-950">{item.marks}</p>
        <span className="mt-1 inline-flex rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
          Grade {item.grade}
        </span>
      </div>
    </div>
  );
}

function EmptyShowcase({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">{icon}</div>
      <p className="text-base font-bold text-slate-800">{title}</p>
      <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">{message}</p>
    </div>
  );
}

function CompactEmpty({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
}

function FocusTile({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const styles = toneStyles[tone];
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 truncate text-lg font-bold ${styles.text}`}>{value}</p>
    </div>
  );
}

type Tone = "emerald" | "amber" | "rose" | "blue" | "violet";

const toneStyles = {
  emerald: {
    text: "text-emerald-600",
    soft: "border-emerald-100 bg-emerald-50",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bar: "bg-emerald-500",
    wash: "bg-gradient-to-br from-emerald-500/10 to-transparent",
  },
  amber: {
    text: "text-amber-600",
    soft: "border-amber-100 bg-amber-50",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    bar: "bg-amber-500",
    wash: "bg-gradient-to-br from-amber-500/10 to-transparent",
  },
  rose: {
    text: "text-rose-600",
    soft: "border-rose-100 bg-rose-50",
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
    bar: "bg-rose-500",
    wash: "bg-gradient-to-br from-rose-500/10 to-transparent",
  },
  blue: {
    text: "text-blue-600",
    soft: "border-blue-100 bg-blue-50",
    pill: "bg-blue-50 text-blue-700 ring-blue-200",
    bar: "bg-blue-500",
    wash: "bg-gradient-to-br from-blue-500/10 to-transparent",
  },
  violet: {
    text: "text-violet-600",
    soft: "border-violet-100 bg-violet-50",
    pill: "bg-violet-50 text-violet-700 ring-violet-200",
    bar: "bg-violet-500",
    wash: "bg-gradient-to-br from-violet-500/10 to-transparent",
  },
} as const;

const actionStyles = {
  indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
  amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
} as const;

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function formatPercent(value: unknown) {
  return hasValue(value) ? `${value}%` : null;
}

function getPercentTone(value: unknown, strong: number, warning: number): "emerald" | "amber" | "rose" {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "rose";
  if (numericValue > strong) return "emerald";
  if (numericValue > warning) return "amber";
  return "rose";
}

function getProgress(current: unknown, total: unknown) {
  const numericCurrent = Number(current);
  const numericTotal = Number(total);
  if (!Number.isFinite(numericCurrent) || !Number.isFinite(numericTotal) || numericTotal <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((numericCurrent / numericTotal) * 100)));
}

function getInitial(name?: string | null) {
  return name?.trim()?.charAt(0).toUpperCase() || "?";
}

/** "Class 8 · Section A" from whatever class/section fields are present. */
function formatClass(child?: ParentChild): string {
  if (!child) return "";
  const cls = child.className?.trim();
  const section = child.section?.trim();
  if (cls && section) return `${cls} · ${section}`;
  return cls || section || "";
}

type ReadinessTone = "emerald" | "amber" | "rose";

interface Readiness {
  score: number;
  tone: ReadinessTone;
  headline: string;
  message: string;
  hasData: boolean;
}

const readinessTone: Record<ReadinessTone, { bar: string; badge: string }> = {
  emerald: { bar: "bg-emerald-400", badge: "bg-emerald-400/15 text-emerald-200" },
  amber: { bar: "bg-amber-400", badge: "bg-amber-400/15 text-amber-200" },
  rose: { bar: "bg-rose-400", badge: "bg-rose-400/15 text-rose-200" },
};

/**
 * Compute a simple weekly readiness score from the three available signals.
 * Each signal counts as "good" when present and above its threshold:
 *   attendance >= 90, marks >= 75, homework submission >= 70%.
 */
function getReadiness(summary?: StudentSummary | null): Readiness {
  const signals: boolean[] = [];

  const attendance = Number(summary?.attendancePercentage);
  if (Number.isFinite(attendance)) signals.push(attendance >= 90);

  const marks = Number(summary?.averageMarks);
  if (Number.isFinite(marks)) signals.push(marks >= 75);

  const homeworkPct = getProgress(summary?.homeworkSubmitted, summary?.homeworkAssigned);
  if (hasValue(summary?.homeworkSubmitted) && hasValue(summary?.homeworkAssigned)) {
    signals.push(homeworkPct >= 70);
  }

  const hasData = signals.length > 0;
  const score = signals.filter(Boolean).length;

  if (!hasData) {
    return {
      score: 0,
      tone: "rose",
      headline: "Awaiting data",
      hasData: false,
      message: "Once the school publishes records, this dashboard will fill with live progress.",
    };
  }
  if (score >= 3) {
    return { score, tone: "emerald", headline: "Excellent week", hasData, message: "Excellent week! Keep it up 🌟" };
  }
  if (score === 2) {
    return { score, tone: "emerald", headline: "Good progress", hasData, message: "Good progress this week 👍" };
  }
  if (score === 1) {
    return { score, tone: "amber", headline: "Needs focus", hasData, message: "Needs improvement this week 📚" };
  }
  return { score, tone: "rose", headline: "Needs attention", hasData, message: "Let's turn things around this week 📚" };
}
