import { useState, useEffect, useRef } from "react";
import { isAxiosError } from "axios";
import {
  Users, BookOpen, MessageCircle, Download,
  AlertTriangle, CheckCircle, Clock, BarChart3, Zap, Calendar, Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── Spinner ──────────────────────────────────────────────────────────────────

function LoadingSpinner({
  size = "md",
  label = "Loading…",
  fullPage = false,
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullPage?: boolean;
}) {
  const spinnerSizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-14 w-14" };
  const textSizes = { sm: "text-xs", md: "text-sm", label: "text-base" };

  const spinEl = (
    <svg
      className={`animate-spin ${spinnerSizes[size]} text-primary`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        {spinEl}
        <p className="text-muted-foreground text-sm font-medium animate-pulse">{label}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {spinEl}
      <span className={`text-muted-foreground ${textSizes[size] ?? textSizes.md}`}>{label}</span>
    </div>
  );
}

import {
  useTeacherOverview,
  useTopicCoverage,
  useTeacherDoubtAnalytics,
  useExportTeacherAnalytics,
  useSmartInsights,
} from "@/hooks/use-teacher";

function apiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { message?: string } | undefined;
    return body?.message || err.message || "Request failed";
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

function AnalyticsFetchAlert({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <AlertTitle>Could not load this section</AlertTitle>
        <AlertDescription className="break-words">{apiErrorMessage(error)}</AlertDescription>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0 border-destructive/40">
        Retry
      </Button>
    </Alert>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "blue",
  loading = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red";
  loading?: boolean;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900",
    green: "bg-green-50 text-green-600 border-green-100 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900",
    orange: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-900",
    purple: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900",
    red: "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900",
  };
  return (
    <Card className="min-w-0 border-slate-200/80 dark:border-slate-800 shadow-xs">
      <CardContent className="p-3 sm:p-5 flex items-center gap-2.5 sm:gap-4 min-w-0">
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 border ${colors[color]}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-sm text-muted-foreground truncate font-medium">{label}</p>
          {loading ? (
            <Skeleton className="h-5 sm:h-7 w-14 sm:w-20 mt-0.5 sm:mt-1" />
          ) : (
            <p className="text-base sm:text-2xl font-bold text-foreground leading-tight tracking-tight truncate">{value}</p>
          )}
          {sub && <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5 font-normal">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Smart Insights Panel ─────────────────────────────────────────────────────

function SmartInsightsPanel({ batchId }: { batchId?: string }) {
  const { data: insights, isLoading, isError, error, refetch } = useSmartInsights(batchId ? { batchId } : undefined);
  const [showAllMobile, setShowAllMobile] = useState(false);

  if (isLoading)
    return (
      <div className="space-y-2">
        <LoadingSpinner size="sm" label="Fetching smart insights…" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  if (isError) return <AnalyticsFetchAlert error={error} onRetry={() => refetch()} />;
  if (!insights?.length) return null;

  return (
    <div className="space-y-3">
      {/* Single Outer Card Wrapper with no colored background */}
      <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Smart Insights
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {insights.length} total
          </span>
        </div>

        {/* Mobile View: 3 data rows + Show More toggle */}
        <div className="block sm:hidden space-y-2.5">
          {(showAllMobile ? insights : insights.slice(0, 3)).map((insight, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border-l-4 border-y border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 ${
                insight.severity === "critical"
                  ? "border-l-red-500"
                  : insight.severity === "warning"
                  ? "border-l-orange-500"
                  : "border-l-blue-500"
              }`}
            >
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{insight.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{insight.description}</p>
              <p
                className={`text-xs mt-1.5 font-semibold ${
                  insight.severity === "critical"
                    ? "text-red-600 dark:text-red-400"
                    : insight.severity === "warning"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                → {insight.action}
              </p>
            </div>
          ))}

          {insights.length > 3 && (
            <button
              onClick={() => setShowAllMobile((prev) => !prev)}
              className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 py-1.5 border-t border-slate-100 dark:border-slate-800 transition-colors"
            >
              {showAllMobile ? "Show less ↑" : `+ ${insights.length - 3} more insights ↓`}
            </button>
          )}
        </div>

        {/* Desktop View: Grid layout */}
        <div className="hidden sm:grid grid-cols-2 xl:grid-cols-3 gap-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border-l-4 border-y border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 ${
                insight.severity === "critical"
                  ? "border-l-red-500"
                  : insight.severity === "warning"
                  ? "border-l-orange-500"
                  : "border-l-blue-500"
              }`}
            >
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{insight.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{insight.description}</p>
              <p
                className={`text-xs mt-1.5 font-semibold ${
                  insight.severity === "critical"
                    ? "text-red-600 dark:text-red-400"
                    : insight.severity === "warning"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                → {insight.action}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } = useTeacherOverview(batchId ? { batchId } : undefined);

  return (
    <div className="space-y-6">
      {isError && <AnalyticsFetchAlert error={error} onRetry={() => refetch()} />}
      <SmartInsightsPanel batchId={batchId} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={data?.totalStudents ?? 0}
          sub={`${data?.totalBatches ?? 0} batches`}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          icon={BarChart3}
          label="Avg Quiz Score"
          value={data ? `${data.quizzes.avgScore}%` : "—"}
          sub={`${data?.quizzes.totalAttempts ?? 0} attempts`}
          color="purple"
          loading={isLoading}
        />
        <StatCard
          icon={BookOpen}
          label="Avg Watch"
          value={data ? `${data.lectures.avgWatchPercentage}%` : "—"}
          sub={`${data?.lectures.completedCount ?? 0} completed`}
          color="green"
          loading={isLoading}
        />
        <StatCard
          icon={MessageCircle}
          label="Open Doubts"
          value={data?.doubts.open ?? 0}
          sub={`${data?.doubts.resolutionRate ?? 0}% resolved`}
          color={data?.doubts.open && data.doubts.open > 0 ? "red" : "green"}
          loading={isLoading}
        />
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Doubt Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Resolved", value: data.doubts.resolved, color: "bg-green-500" },
                { label: "Open / Escalated", value: data.doubts.open, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value} / {data.doubts.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${data.doubts.total ? (item.value / data.doubts.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Batches</CardTitle>
            </CardHeader>
            <CardContent>
              {data.batches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No batches found.</p>
              ) : (
                <div className="space-y-2">
                  {data.batches.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                      <span className="text-sm font-medium">{b.name}</span>
                      <Badge variant={b.status === "active" ? "default" : "secondary"} className="capitalize">
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Topic Coverage Tab ───────────────────────────────────────────────────────

function TopicCoverageTab({ batchId }: { batchId?: string }) {
  const { data: topics, isLoading, isError, error, refetch } = useTopicCoverage(batchId ? { batchId } : undefined);
  const exportM = useExportTeacherAnalytics();

  const severityColor: Record<string, string> = {
    critical: "text-red-600 bg-red-50 dark:bg-red-950",
    high: "text-orange-600 bg-orange-50 dark:bg-orange-950",
    medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950",
    low: "text-green-600 bg-green-50 dark:bg-green-950",
  };

  const taughtTopics = topics?.filter((t) => t.taught) ?? [];
  const untaughtTopics = topics?.filter((t) => !t.taught) ?? [];

  const gateBarColor = (rate: number) =>
    rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-orange-400" : "bg-red-500";

  return (
    <div className="space-y-6">
      {isError && <AnalyticsFetchAlert error={error} onRetry={() => refetch()} />}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportM.mutate({ type: "topic-coverage", batchId })} disabled={exportM.isPending}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" label="Loading topic coverage…" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : !topics?.length ? (
        <Card className="p-8 text-center text-muted-foreground">No topic data yet.</Card>
      ) : (
        <>
          {/* Taught Topics */}
          {taughtTopics.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Taught Topics ({taughtTopics.length})
              </h3>
              {taughtTopics.map((topic) => (
                <Card key={topic.topicId} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{topic.topicName}</span>
                        <span className="text-xs text-muted-foreground">
                          {topic.subjectName}{topic.chapterName ? ` › ${topic.chapterName}` : ""}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${severityColor[topic.severity] || ""}`}>
                          {topic.severity}
                        </span>
                        {topic.gatePassRate < 60 && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                            Needs revision
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>{topic.affectedStudents} students struggling ({topic.affectedPercentage}%)</span>
                        <span>Avg Accuracy: {topic.avgAccuracy}%</span>
                        {topic.lectureCount > 0 && <span>{topic.lectureCount} lecture{topic.lectureCount > 1 ? "s" : ""}</span>}
                        {topic.estimatedStudyMinutes > 0 && <span>~{topic.estimatedStudyMinutes}m study</span>}
                      </div>
                      {/* Gate Pass Rate */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Gate Pass Rate <span className="text-[10px]">(% mastered)</span></span>
                          <span className={`font-semibold ${topic.gatePassRate >= 80 ? "text-green-600" : topic.gatePassRate >= 60 ? "text-orange-500" : "text-red-600"}`}>
                            {topic.gatePassRate}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${gateBarColor(topic.gatePassRate)}`}
                            style={{ width: `${topic.gatePassRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pending / Untaught Topics */}
          {untaughtTopics.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Pending Topics — Not Yet Covered ({untaughtTopics.length})
              </h3>
              {untaughtTopics.map((topic) => (
                <Card key={topic.topicId} className="p-4 border-dashed">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{topic.topicName}</span>
                    <span className="text-xs text-muted-foreground">
                      {topic.subjectName}{topic.chapterName ? ` › ${topic.chapterName}` : ""}
                    </span>
                    {topic.affectedStudents > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {topic.affectedStudents} struggling
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Doubt Analytics Tab ──────────────────────────────────────────────────────

function DoubtAnalyticsTab({ batchId }: { batchId?: string }) {
  const { data, isLoading, isError, error, refetch } = useTeacherDoubtAnalytics(batchId ? { batchId } : undefined);
  const exportM = useExportTeacherAnalytics();

  const statusColors: Record<string, string> = {
    open: "bg-yellow-500",
    ai_resolved: "bg-blue-500",
    escalated: "bg-red-500",
    teacher_resolved: "bg-green-500",
  };
  const statusLabels: Record<string, string> = {
    open: "Open",
    ai_resolved: "AI Resolved",
    escalated: "Escalated",
    teacher_resolved: "Teacher Resolved",
  };

  return (
    <div className="space-y-6">
      {isError && <AnalyticsFetchAlert error={error} onRetry={() => refetch()} />}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportM.mutate({ type: "doubt-analytics", batchId })} disabled={exportM.isPending}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex justify-center py-3">
            <LoadingSpinner size="md" label="Loading doubt analytics…" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        </div>
      ) : isError ? null : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={MessageCircle} label="Total Doubts" value={data?.summary.total ?? 0} color="blue" />
            <StatCard icon={AlertTriangle} label="Open / Escalated" value={data?.summary.openEscalated ?? 0} color="red" />
            <StatCard icon={Zap} label="AI Resolved" value={data?.summary.aiResolved ?? 0} sub={`${data?.summary.aiResolutionRate ?? 0}% rate`} color="purple" />
            <StatCard icon={CheckCircle} label="Teacher Resolved" value={data?.summary.teacherResolved ?? 0} color="green" />
            <StatCard
              icon={Clock}
              label="Avg Resolution"
              value={data ? `${data.summary.avgResolutionMinutes ?? 0}m` : "—"}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">By Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(data?.byStatus ?? []).map((s) => (
                  <div key={s.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{statusLabels[s.status] || s.status}</span>
                      <span className="font-medium">{s.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${statusColors[s.status] || "bg-gray-400"}`}
                        style={{
                          width: `${(data?.summary.total ?? 0) ? (s.count / (data?.summary.total ?? 1)) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Top Doubt Topics</CardTitle></CardHeader>
              <CardContent>
                {!data?.byTopic.length ? (
                  <p className="text-sm text-muted-foreground">No topic data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.byTopic.map((t, i) => (
                      <div key={t.topicId} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                        <span className="flex-1 text-sm truncate">{t.topicName}</span>
                        <Badge variant="secondary">{t.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {data?.recentDoubts && data.recentDoubts.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Recent Doubts</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recentDoubts.map((d) => (
                    <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{d.questionText}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{d.studentName}</span>
                          {d.topicName && <span>· {d.topicName}</span>}
                        </div>
                      </div>
                      <Badge variant={d.status === "escalated" ? "destructive" : "secondary"} className="text-xs capitalize whitespace-nowrap">
                        {statusLabels[d.status] || d.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherAnalyticsPage() {
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [period, setPeriod] = useState<string>("week");
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewErr,
    error: overviewError,
    refetch: refetchOverview,
  } = useTeacherOverview({ batchId: batchFilter === "all" ? undefined : batchFilter });

  // Track whether this is the very first load (no cached data yet)
  const hasLoadedOnce = useRef(false);
  useEffect(() => {
    if (!overviewLoading) hasLoadedOnce.current = true;
  }, [overviewLoading]);

  const isInitialLoad = overviewLoading && !hasLoadedOnce.current;
  const activeBatchId = batchFilter === "all" ? undefined : batchFilter;

  return (
    <div className="w-full sm:pt-4 sm:pb-24 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {overviewErr && (
        <AnalyticsFetchAlert error={overviewError} onRetry={() => refetchOverview()} />
      )}

      {/* ── Main Header Card ── */}
      <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl px-5 pt-5 pb-3.5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-5 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/15 transition-all duration-300">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" /> Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track student progress, quiz performance, and doubts across your classes.
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 sm:gap-3 shrink-0">
          {/* Period Filter */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 sm:w-36 h-9 font-semibold text-xs sm:text-sm bg-white border border-indigo-200/80 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Batch filter — show a skeleton while batches are loading */}
          {isInitialLoad ? (
            <Skeleton className="h-9 w-32 sm:w-40 rounded-md" />
          ) : (
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-32 sm:w-40 h-9 font-semibold text-xs sm:text-sm bg-white border border-indigo-200/80 shadow-2xs">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {overview?.batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Full-page spinner while the very first request resolves */}
      {isInitialLoad ? (
        <LoadingSpinner size="lg" label="Loading analytics…" fullPage />
      ) : (
        <Tabs defaultValue="overview">
          <div className="w-full overflow-x-auto no-scrollbar py-1 px-1">
            <TabsList className="inline-flex min-w-max items-center gap-1.5 p-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:bg-slate-900/60 dark:border-slate-800 h-auto">
              <TabsTrigger
                value="overview"
                className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold px-4 py-2 text-slate-600 dark:text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:border-indigo-600 data-[state=active]:shadow-sm hover:border-slate-300 transition-all shrink-0 cursor-pointer"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="topics"
                className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold px-4 py-2 text-slate-600 dark:text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:border-indigo-600 data-[state=active]:shadow-sm hover:border-slate-300 transition-all shrink-0 cursor-pointer"
              >
                Topic Coverage
              </TabsTrigger>
              <TabsTrigger
                value="doubts"
                className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold px-4 py-2 text-slate-600 dark:text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:border-indigo-600 data-[state=active]:shadow-sm hover:border-slate-300 transition-all shrink-0 cursor-pointer"
              >
                Doubt Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="overview"><OverviewTab batchId={activeBatchId} /></TabsContent>
            <TabsContent value="topics"><TopicCoverageTab batchId={activeBatchId} /></TabsContent>
            <TabsContent value="doubts"><DoubtAnalyticsTab batchId={activeBatchId} /></TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
