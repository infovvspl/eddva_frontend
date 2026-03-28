import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Flame, Trophy, Video,
  Brain, TrendingUp, TrendingDown, CheckCircle,
  XCircle, Clock, BarChart2, Flag, UserMinus, MessageCircle,
  Target, Zap, BookOpen,
} from "lucide-react";
import ProgressReportTree from "@/components/shared/ProgressReportTree";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getStudentDetail,
  type StudentDetail,
  type WeakTopicSeverity,
  type EngagementState,
} from "@/lib/api/teacher";
import { useStudentDeepDive } from "@/hooks/use-teacher";
import FlagStudentModal from "@/components/teacher/FlagStudentModal";
import RemoveStudentDialog from "@/components/teacher/RemoveStudentDialog";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const severityColor: Record<WeakTopicSeverity, string> = {
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
};

const engagementConfig: Record<EngagementState, { label: string; color: string; icon: React.ReactNode }> = {
  engaged:    { label: "Engaged",    color: "text-green-400",  icon: <CheckCircle className="w-4 h-4" /> },
  thriving:   { label: "Thriving",   color: "text-emerald-400", icon: <TrendingUp className="w-4 h-4" /> },
  bored:      { label: "Bored",      color: "text-yellow-400", icon: <Clock className="w-4 h-4" /> },
  confused:   { label: "Confused",   color: "text-orange-400", icon: <Brain className="w-4 h-4" /> },
  frustrated: { label: "Frustrated", color: "text-red-400",    icon: <TrendingDown className="w-4 h-4" /> },
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function daysAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-surface p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-10 text-right text-foreground">{score}</span>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="card-surface p-6 flex gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get("batchId") ?? "";
  const navigate = useNavigate();

  const [flagOpen, setFlagOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<StudentDetail>({
    queryKey: ["teacher", "student-detail", batchId, studentId],
    queryFn: () => getStudentDetail(batchId, studentId!),
    enabled: !!batchId && !!studentId,
    staleTime: 60_000,
  });

  const { data: deepDive } = useStudentDeepDive(studentId ?? "", batchId ? { batchId } : undefined);

  if (!batchId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Missing batchId query parameter.
      </div>
    );
  }

  if (isLoading) return (
    <div className="p-6 max-w-5xl mx-auto">
      <DetailSkeleton />
    </div>
  );

  if (isError || !data) return (
    <div className="p-8 text-center space-y-3">
      <p className="text-destructive font-medium">Failed to load student data.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
    </div>
  );

  const { profile, attendance, engagementLogs, weakTopics, lectures, testScores } = data;
  const engagement = profile.aiEngagementState ? engagementConfig[profile.aiEngagementState] : null;
  const avgScore = testScores.length
    ? Math.round(testScores.reduce((s, t) => s + t.totalScore, 0) / testScores.length)
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Student Detail</h1>
          <p className="text-sm text-muted-foreground">Full profile & performance overview</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card-surface p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {getInitials(profile.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">{profile.name ?? "Unknown"}</h2>
              {engagement && (
                <span className={`flex items-center gap-1 text-xs font-medium ${engagement.color}`}>
                  {engagement.icon} {engagement.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.phone && <span>📞 {profile.phone}</span>}
              {profile.email && <span>✉️ {profile.email}</span>}
              <span>Class {profile.class} · {profile.examTarget?.toUpperCase()}</span>
              {profile.targetCollege && <span>🎯 {profile.targetCollege}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                Enrolled {new Date(profile.enrolledAt).toLocaleDateString("en-IN")}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Last active: {daysAgo(profile.lastLoginAt)}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {profile.subscriptionPlan}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
              onClick={() => setFlagOpen(true)}
            >
              <Flag className="w-3.5 h-3.5 mr-1.5" /> Flag
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setRemoveOpen(true)}
            >
              <UserMinus className="w-3.5 h-3.5 mr-1.5" /> Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="Current Streak"
          value={`${profile.streakDays} days`}
          sub={`Best: ${profile.longestStreak} days`}
        />
        <StatCard
          icon={<Trophy className="w-4 h-4" />}
          label="XP Total"
          value={profile.xpTotal.toLocaleString()}
        />
        <StatCard
          icon={<Video className="w-4 h-4" />}
          label="Attendance"
          value={`${attendance.attendancePct}%`}
          sub={`${attendance.watchedLectures} / ${attendance.totalLectures} lectures`}
        />
        <StatCard
          icon={<BarChart2 className="w-4 h-4" />}
          label="Avg Test Score"
          value={avgScore !== null ? avgScore : "—"}
          sub={testScores.length ? `${testScores.length} tests taken` : "No tests yet"}
        />
      </div>

      {/* Analytics Deep Dive Strip */}
      {deepDive && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-foreground text-sm">Analytics Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: BarChart2, label: "Avg Quiz Score", value: `${deepDive.performance.avgScore}%`, color: "text-purple-500", bg: "bg-purple-500/10" },
              { icon: Target, label: "Accuracy", value: `${deepDive.performance.accuracy}%`, color: deepDive.performance.accuracy >= 70 ? "text-emerald-500" : deepDive.performance.accuracy >= 50 ? "text-yellow-500" : "text-red-500", bg: "bg-muted" },
              { icon: Video, label: "Avg Watch", value: `${deepDive.performance.avgWatchPercentage}%`, color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: MessageCircle, label: "Doubts", value: deepDive.performance.doubtCount, color: "text-orange-500", bg: "bg-orange-500/10" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-base font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Error Breakdown */}
          {deepDive.recentQuizzes.length > 0 && (() => {
            const totals = { conceptual: 0, silly: 0, time: 0, guess: 0 };
            // We don't have per-student error breakdown in deepDive but show quiz activity
            return null;
          })()}

          {/* Accuracy Per Subject */}
          {deepDive.weakTopics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Weak Topics</p>
              <div className="space-y-2">
                {deepDive.weakTopics.slice(0, 4).map((wt) => (
                  <div key={wt.topicId} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-foreground truncate">{wt.topicName}</span>
                        <span className={`text-xs font-bold ml-2 ${wt.accuracy >= 70 ? "text-emerald-500" : wt.accuracy >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                          {Math.round(wt.accuracy)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${wt.accuracy >= 70 ? "bg-emerald-500" : wt.accuracy >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${Math.round(wt.accuracy)}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize shrink-0 ${
                      wt.severity === "critical" ? "border-red-500/50 text-red-500" :
                      wt.severity === "high" ? "border-orange-500/50 text-orange-500" :
                      wt.severity === "medium" ? "border-yellow-500/50 text-yellow-500" :
                      "border-blue-500/50 text-blue-500"
                    }`}>{wt.severity}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="progress">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="progress"><BookOpen className="w-3.5 h-3.5 mr-1.5" />Progress</TabsTrigger>
          <TabsTrigger value="lectures"><Video className="w-3.5 h-3.5 mr-1.5" />Lectures</TabsTrigger>
          <TabsTrigger value="tests"><BarChart2 className="w-3.5 h-3.5 mr-1.5" />Tests</TabsTrigger>
          <TabsTrigger value="weak"><Brain className="w-3.5 h-3.5 mr-1.5" />Weak</TabsTrigger>
          <TabsTrigger value="doubts"><MessageCircle className="w-3.5 h-3.5 mr-1.5" />Doubts</TabsTrigger>
          <TabsTrigger value="engagement"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Engage</TabsTrigger>
        </TabsList>

        {/* Progress Report Tab */}
        <TabsContent value="progress" className="mt-4">
          <ProgressReportTree studentId={studentId} />
        </TabsContent>

        {/* Lectures Tab */}
        <TabsContent value="lectures" className="mt-4">
          {lectures.length === 0 ? (
            <div className="card-surface p-8 text-center text-muted-foreground">
              No lectures in this batch yet.
            </div>
          ) : (
            <div className="card-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium">Lecture</th>
                    <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Date</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Watch %</th>
                    <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Quiz</th>
                    <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lectures.map((lec) => (
                    <tr key={lec.lectureId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <p className="font-medium text-foreground truncate max-w-[200px]">{lec.title}</p>
                        {lec.rewindCount > 0 && (
                          <p className="text-xs text-orange-400 mt-0.5">⟲ {lec.rewindCount} rewinds</p>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">
                        {lec.scheduledAt ? new Date(lec.scheduledAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="p-3 w-36">
                        <ScoreBar score={lec.watchPercentage} />
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        {lec.quizTotal > 0 ? (
                          <span className={`text-xs font-semibold ${lec.quizScore! >= 70 ? "text-green-400" : lec.quizScore! >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                            {lec.quizCorrect}/{lec.quizTotal} ({lec.quizScore}%)
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {lec.isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                        ) : lec.watchPercentage > 0 ? (
                          <Clock className="w-4 h-4 text-yellow-400 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Test Scores Tab */}
        <TabsContent value="tests" className="mt-4">
          {testScores.length === 0 ? (
            <div className="card-surface p-8 text-center text-muted-foreground">
              No test submissions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Score trend chart (simple bars) */}
              <div className="card-surface p-4">
                <p className="text-xs text-muted-foreground mb-3">Last {testScores.length} test scores</p>
                <div className="flex items-end gap-1.5 h-24">
                  {[...testScores].reverse().map((s, i) => {
                    const h = Math.max(8, Math.round((s.totalScore / 100) * 96));
                    const color = s.totalScore >= 70 ? "bg-green-500" : s.totalScore >= 40 ? "bg-yellow-500" : "bg-red-500";
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">{s.totalScore}</span>
                        <div className={`w-full rounded-t ${color}`} style={{ height: `${h}px` }} title={`Score: ${s.totalScore}`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score list */}
              <div className="card-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Score</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Correct</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Wrong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testScores.map((s) => (
                      <tr key={s.sessionId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-muted-foreground">
                          {new Date(s.submittedAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${s.totalScore >= 70 ? "text-green-400" : s.totalScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                            {s.totalScore}
                          </span>
                        </td>
                        <td className="p-3 text-green-400">{s.correctCount}</td>
                        <td className="p-3 text-red-400">{s.wrongCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Weak Topics Tab */}
        <TabsContent value="weak" className="mt-4">
          {weakTopics.length === 0 ? (
            <div className="card-surface p-8 text-center text-muted-foreground">
              No weak topics identified yet.
            </div>
          ) : (
            <div className="card-surface p-4 space-y-3">
              {weakTopics.map((wt) => (
                <div key={wt.topicId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">{wt.topicName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${severityColor[wt.severity]}`}>
                        {wt.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Accuracy: {Math.round(wt.accuracy)}%</span>
                      <span>{wt.wrongCount} wrong</span>
                      {wt.lastAttemptedAt && <span>Last: {daysAgo(wt.lastAttemptedAt)}</span>}
                    </div>
                  </div>
                  <div className="w-20">
                    <ScoreBar score={Math.round(wt.accuracy)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Doubts Tab */}
        <TabsContent value="doubts" className="mt-4">
          {!deepDive?.recentDoubts?.length ? (
            <div className="card-surface p-8 text-center text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No doubts raised yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="card-surface p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{deepDive.performance.doubtCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Doubts</p>
                </div>
                <div className="card-surface p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-500">
                    {deepDive.recentDoubts.filter(d => d.status === "teacher_resolved" || d.status === "ai_resolved").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Resolved</p>
                </div>
                <div className="card-surface p-4 text-center">
                  <p className="text-2xl font-bold text-orange-500">
                    {deepDive.recentDoubts.filter(d => d.status === "escalated" || d.status === "open").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Open</p>
                </div>
              </div>
              <div className="card-surface overflow-hidden">
                {deepDive.recentDoubts.map((d) => {
                  const statusMap: Record<string, { label: string; cls: string }> = {
                    open: { label: "Open", cls: "bg-yellow-500/15 text-yellow-500" },
                    ai_resolved: { label: "AI Resolved", cls: "bg-blue-500/15 text-blue-500" },
                    escalated: { label: "Escalated", cls: "bg-red-500/15 text-red-500" },
                    teacher_resolved: { label: "Resolved", cls: "bg-emerald-500/15 text-emerald-500" },
                  };
                  const s = statusMap[d.status] ?? { label: d.status, cls: "" };
                  return (
                    <div key={d.id} className="flex items-start gap-3 p-4 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{d.questionText}</p>
                        {d.topicName && (
                          <p className="text-xs text-muted-foreground mt-0.5">Topic: {d.topicName}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="mt-4">
          {engagementLogs.length === 0 ? (
            <div className="card-surface p-8 text-center text-muted-foreground">
              No engagement data recorded yet.
            </div>
          ) : (
            <div className="card-surface p-4 space-y-3">
              {engagementLogs.map((log, i) => {
                const cfg = engagementConfig[log.state];
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className={cfg.color}>{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
                        <Badge variant="outline" className="text-xs capitalize">{log.context}</Badge>
                        {log.confidence && (
                          <span className="text-xs text-muted-foreground">{Math.round(log.confidence * 100)}% confidence</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(log.loggedAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <FlagStudentModal
        open={flagOpen}
        onOpenChange={setFlagOpen}
        batchId={batchId}
        studentId={studentId!}
        studentName={profile.name}
        onSuccess={() => toast.success("Student flagged — notifications sent")}
      />
      <RemoveStudentDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        batchId={batchId}
        studentId={studentId!}
        studentName={profile.name}
        onSuccess={() => {
          toast.success("Student removed from batch");
          navigate(-1);
        }}
      />
    </div>
  );
}
