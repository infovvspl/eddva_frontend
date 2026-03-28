import { useState } from "react";
import {
  Users, BookOpen, MessageCircle, TrendingUp, Download,
  AlertTriangle, CheckCircle, Clock, BarChart3, Zap, Flame,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useTeacherOverview,
  useClassPerformance,
  useTopicCoverage,
  useTeacherDoubtAnalytics,
  useBatchComparison,
  useExportTeacherAnalytics,
  useEngagementHeatmap,
  useSmartInsights,
  useMyLectures,
} from "@/hooks/use-teacher";
import { ClassPerformanceQuery } from "@/lib/api/teacher";

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
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  };
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-1" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Smart Insights Panel ─────────────────────────────────────────────────────

function SmartInsightsPanel({ batchId }: { batchId?: string }) {
  const { data: insights, isLoading } = useSmartInsights(batchId ? { batchId } : undefined);
  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!insights?.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Smart Insights</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border-l-4 bg-card ${
              insight.severity === "critical"
                ? "border-red-500"
                : insight.severity === "warning"
                ? "border-orange-500"
                : "border-blue-500"
            }`}
          >
            <p className="text-sm font-semibold">{insight.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
            <p
              className={`text-xs mt-1.5 font-medium ${
                insight.severity === "critical"
                  ? "text-red-600"
                  : insight.severity === "warning"
                  ? "text-orange-600"
                  : "text-blue-600"
              }`}
            >
              → {insight.action}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ batchId }: { batchId?: string }) {
  const { data, isLoading } = useTeacherOverview(batchId ? { batchId } : undefined);

  return (
    <div className="space-y-6">
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

// ─── Class Performance Tab ────────────────────────────────────────────────────

function ClassPerformanceTab({ batchId }: { batchId?: string }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("avgScore");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const exportM = useExportTeacherAnalytics();

  const query: ClassPerformanceQuery = { batchId, sortBy, order, page, limit: 20 };
  const { data, isLoading } = useClassPerformance(query);
  const students = data?.data ?? [];
  const meta = data?.meta;

  const filtered = search
    ? students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : students;

  // Bar chart data — abbreviated names
  const chartData = students.map((s) => ({
    name: s.name.split(" ")[0].slice(0, 8),
    score: s.avgScore,
    fill:
      s.avgScore >= 70 ? "#22c55e" : s.avgScore >= 50 ? "#f97316" : "#ef4444",
  }));

  return (
    <div className="space-y-4">
      {/* Score bar chart */}
      {!isLoading && students.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Student Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: number) => [`${v}%`, "Avg Score"]} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 justify-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> ≥70%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> 50–69%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt;50%</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avgScore">Avg Score</SelectItem>
              <SelectItem value="accuracy">Accuracy</SelectItem>
              <SelectItem value="avgWatchPercentage">Watch %</SelectItem>
              <SelectItem value="doubtCount">Doubts</SelectItem>
              <SelectItem value="quizzesTaken">Quizzes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setOrder(order === "desc" ? "asc" : "desc")}>
            {order === "desc" ? "↓" : "↑"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportM.mutate({ type: "class-performance", batchId })}
            disabled={exportM.isPending}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Quizzes</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead className="text-right">Watch %</TableHead>
              <TableHead className="text-right">Doubts</TableHead>
              <TableHead className="text-right hidden md:table-cell">Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>
                      <span className={`text-sm font-bold ${student.rank === 1 ? "text-yellow-500" : student.rank === 2 ? "text-gray-400" : student.rank === 3 ? "text-amber-600" : "text-muted-foreground"}`}>
                        #{student.rank}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{student.quizzesTaken}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full hidden sm:block">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(student.avgScore, 100)}%` }} />
                        </div>
                        <span className="text-sm font-medium">{student.avgScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-medium ${student.accuracy >= 70 ? "text-green-600" : student.accuracy >= 50 ? "text-orange-500" : "text-red-500"}`}>
                        {student.accuracy}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{student.avgWatchPercentage}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm">{student.doubtCount}</span>
                        {student.openDoubts > 0 && (
                          <Badge variant="destructive" className="text-xs px-1">{student.openDoubts}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {student.errorBreakdown && (
                        <div className="flex items-center justify-end gap-1">
                          {student.errorBreakdown.conceptual > 0 && (
                            <span title={`Conceptual: ${student.errorBreakdown.conceptual}`} className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">C</span>
                          )}
                          {student.errorBreakdown.silly > 0 && (
                            <span title={`Silly: ${student.errorBreakdown.silly}`} className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center font-bold">S</span>
                          )}
                          {student.errorBreakdown.guess > 0 && (
                            <span title={`Guessed: ${student.errorBreakdown.guess}`} className="w-4 h-4 rounded-full bg-gray-400 text-white text-[9px] flex items-center justify-center font-bold">G</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Topic Coverage Tab ───────────────────────────────────────────────────────

function TopicCoverageTab({ batchId }: { batchId?: string }) {
  const { data: topics, isLoading } = useTopicCoverage(batchId ? { batchId } : undefined);
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
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportM.mutate({ type: "topic-coverage", batchId })} disabled={exportM.isPending}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
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

// ─── Engagement Heatmap Tab ───────────────────────────────────────────────────

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function interpolateColor(ratio: number): string {
  // 0 = green (#22c55e), 1 = red (#ef4444)
  const r = Math.round(0x22 + ratio * (0xef - 0x22));
  const g = Math.round(0xc5 + ratio * (0x44 - 0xc5));
  const b = Math.round(0x5e + ratio * (0x44 - 0x5e));
  return `rgb(${r},${g},${b})`;
}

function EngagementHeatmapTab() {
  const [selectedLectureId, setSelectedLectureId] = useState<string>("");
  const { data: lecturesData } = useMyLectures();
  const lectures = lecturesData ?? [];

  const { data: heatmap, isLoading: heatmapLoading } = useEngagementHeatmap(selectedLectureId);

  const maxConfusion = heatmap?.segments
    ? Math.max(...heatmap.segments.map((s) => s.confusionCount), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Lecture selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <label className="text-sm font-medium whitespace-nowrap">Select Lecture:</label>
        <Select value={selectedLectureId} onValueChange={setSelectedLectureId}>
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder="Choose a lecture to view heatmap" />
          </SelectTrigger>
          <SelectContent>
            {lectures.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.title}
                {l.batchId && <span className="text-xs text-muted-foreground ml-1">({l.batchId})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedLectureId ? (
        <Card className="p-12 text-center">
          <Flame className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Select a lecture to view engagement data</p>
        </Card>
      ) : heatmapLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !heatmap?.lecture ? (
        <Card className="p-8 text-center text-muted-foreground">No data available for this lecture.</Card>
      ) : (
        <>
          {/* Lecture meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={BookOpen} label="Duration" value={formatSeconds(heatmap.lecture.durationSeconds)} color="blue" />
            <StatCard icon={Users} label="Total Viewers" value={heatmap.lecture.totalViewers} color="green" />
            <StatCard icon={TrendingUp} label="Avg Watch" value={`${Math.round(heatmap.lecture.avgWatchPercentage)}%`} color="purple" />
            <StatCard icon={Flame} label="Confusion Peaks" value={heatmap.confusionPeaks.length} color={heatmap.confusionPeaks.length > 0 ? "red" : "green"} />
          </div>

          {/* Heatmap grid */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Confusion Heatmap</CardTitle>
              <p className="text-xs text-muted-foreground">
                Green = low confusion, Red = high confusion. Hover over a cell to see the time range.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex rounded-lg overflow-hidden h-14 w-full">
                {heatmap.segments.map((seg) => {
                  const ratio = seg.confusionCount / maxConfusion;
                  return (
                    <div
                      key={seg.segmentIndex}
                      title={`${formatSeconds(seg.startSeconds)}–${formatSeconds(seg.endSeconds)}\nConfusion: ${seg.confusionCount}\nRewatched: ${seg.rewindCount}`}
                      style={{
                        flex: 1,
                        backgroundColor: interpolateColor(ratio),
                        opacity: seg.confusionCount === 0 ? 0.35 : 1,
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0:00</span>
                <span>{formatSeconds(heatmap.lecture.durationSeconds)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Confusion Peaks */}
          {heatmap.confusionPeaks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Confusion Peaks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200">
                  Plan to re-explain these sections in next class
                </div>
                {heatmap.confusionPeaks.map((peak, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div>
                      <span className="text-sm font-medium">
                        {formatSeconds(peak.startSeconds)} – {formatSeconds(peak.endSeconds)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">Segment {peak.segmentIndex + 1}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-red-600 font-medium">{peak.confusionCount} confusion events</span>
                      <span>{peak.rewindCount} rewinds</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Doubt Analytics Tab ──────────────────────────────────────────────────────

function DoubtAnalyticsTab({ batchId }: { batchId?: string }) {
  const { data, isLoading } = useTeacherDoubtAnalytics(batchId ? { batchId } : undefined);
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
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => exportM.mutate({ type: "doubt-analytics", batchId })} disabled={exportM.isPending}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={MessageCircle} label="Total Doubts" value={data?.summary.total ?? 0} color="blue" />
            <StatCard icon={AlertTriangle} label="Open / Escalated" value={data?.summary.openEscalated ?? 0} color="red" />
            <StatCard icon={Zap} label="AI Resolved" value={data?.summary.aiResolved ?? 0} sub={`${data?.summary.aiResolutionRate ?? 0}% rate`} color="purple" />
            <StatCard icon={CheckCircle} label="Teacher Resolved" value={data?.summary.teacherResolved ?? 0} color="green" />
            <StatCard icon={Clock} label="Avg Resolution" value={data ? `${data.summary.avgResolutionMinutes}m` : "—"} color="orange" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">By Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data?.byStatus.map((s) => (
                  <div key={s.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{statusLabels[s.status] || s.status}</span>
                      <span className="font-medium">{s.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${statusColors[s.status] || "bg-gray-400"}`}
                        style={{ width: `${data.summary.total ? (s.count / data.summary.total) * 100 : 0}%` }}
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

// ─── Batch Comparison Tab ─────────────────────────────────────────────────────

function BatchComparisonTab() {
  const { data: batches, isLoading } = useBatchComparison();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (!batches?.length) return <Card className="p-8 text-center text-muted-foreground">No batch data available.</Card>;

  const maxScore = Math.max(...batches.map((b) => b.avgScore), 1);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Avg Score by Batch</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {batches.map((batch) => (
            <div key={batch.batchId}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{batch.batchName}</span>
                <span>{batch.avgScore}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(batch.avgScore / maxScore) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
              <TableHead className="text-right">Watch %</TableHead>
              <TableHead className="text-right">Quizzes</TableHead>
              <TableHead className="text-right">Doubts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.batchId}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{batch.batchName}</p>
                    <p className="text-xs text-muted-foreground">{batch.examTarget}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm">{batch.studentCount}</TableCell>
                <TableCell className="text-right text-sm font-medium">{batch.avgScore}%</TableCell>
                <TableCell className="text-right text-sm">{batch.avgWatchPercentage}%</TableCell>
                <TableCell className="text-right text-sm">{batch.quizAttempts}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-sm">{batch.doubtCount}</span>
                    {batch.openDoubts > 0 && (
                      <Badge variant="destructive" className="text-xs px-1">{batch.openDoubts}</Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherAnalyticsPage() {
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const { data: overview } = useTeacherOverview();

  const activeBatchId = batchFilter === "all" ? undefined : batchFilter;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track student progress, quiz performance, and engagement across your classes.
          </p>
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {overview?.batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Class Performance</TabsTrigger>
          <TabsTrigger value="topics">Topic Coverage</TabsTrigger>
          <TabsTrigger value="heatmap">Engagement Heatmap</TabsTrigger>
          <TabsTrigger value="doubts">Doubt Analytics</TabsTrigger>
          <TabsTrigger value="batches">Batch Comparison</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview"><OverviewTab batchId={activeBatchId} /></TabsContent>
          <TabsContent value="performance"><ClassPerformanceTab batchId={activeBatchId} /></TabsContent>
          <TabsContent value="topics"><TopicCoverageTab batchId={activeBatchId} /></TabsContent>
          <TabsContent value="heatmap"><EngagementHeatmapTab /></TabsContent>
          <TabsContent value="doubts"><DoubtAnalyticsTab batchId={activeBatchId} /></TabsContent>
          <TabsContent value="batches"><BatchComparisonTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
