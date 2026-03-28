import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getMockTestById,
  getMockTestSessions,
  getMockTestQuestionStats,
  updateMockTest,
  type MockTest,
  type MockTestSession,
  type QuestionStat,
} from "@/lib/api/teacher";
import {
  X, RefreshCw, Download, Play, BookOpen, Clock, Target, Users,
  CheckCircle2, XCircle, Minus, BarChart2, Settings2, ListOrdered,
  Loader2, Calendar, Shuffle, Eye, RotateCcw, Trophy, TrendingUp,
  AlertTriangle, Brain, Zap, Timer, HelpCircle, Share2,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(seconds: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function accuracy(correct?: number, wrong?: number, skipped?: number) {
  const total = (correct ?? 0) + (wrong ?? 0) + (skipped ?? 0);
  if (!total) return 0;
  return Math.round(((correct ?? 0) / total) * 100);
}

function scorePercent(score?: number, total?: number) {
  if (!score || !total) return 0;
  return Math.round((score / total) * 100);
}

function avgOf(arr: number[]) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// ─── Score Distribution ────────────────────────────────────────────────────────

function ScoreHistogram({ sessions, totalMarks }: { sessions: MockTestSession[]; totalMarks: number }) {
  const submitted = sessions.filter(s => s.status === "completed" && s.totalScore !== undefined);
  if (!submitted.length) return <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>;

  const buckets = ["0–20%", "20–40%", "40–60%", "60–80%", "80–100%"];
  const counts = [0, 0, 0, 0, 0];
  submitted.forEach(s => {
    const pct = scorePercent(s.totalScore, totalMarks);
    const idx = Math.min(Math.floor(pct / 20), 4);
    counts[idx]++;
  });
  const max = Math.max(...counts, 1);
  const colors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];

  return (
    <div className="space-y-2">
      {buckets.map((label, i) => (
        <div key={label} className="flex items-center gap-3 text-sm">
          <span className="w-14 text-xs text-muted-foreground text-right shrink-0">{label}</span>
          <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden">
            <div
              className={cn("h-full rounded-md transition-all", colors[i])}
              style={{ width: `${(counts[i] / max) * 100}%` }}
            />
          </div>
          <span className="w-5 text-xs font-medium text-right shrink-0">{counts[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Error Breakdown ────────────────────────────────────────────────────────────

const ERROR_META: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  conceptual: { label: "Conceptual", color: "bg-red-400", icon: Brain },
  silly:      { label: "Silly Mistake", color: "bg-orange-400", icon: AlertTriangle },
  time:       { label: "Time Pressure", color: "bg-amber-400", icon: Timer },
  guess:      { label: "Guessed Wrong", color: "bg-purple-400", icon: HelpCircle },
  skip:       { label: "Skipped", color: "bg-slate-400", icon: Minus },
};

function ErrorBreakdownBars({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (!total) return <p className="text-sm text-muted-foreground text-center py-4">No error data available</p>;

  return (
    <div className="space-y-2.5">
      {Object.entries(ERROR_META).map(([key, meta]) => {
        const count = breakdown[key] ?? 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        const Icon = meta.icon;
        return (
          <div key={key} className="flex items-center gap-3 text-sm">
            <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="w-24 text-xs text-muted-foreground shrink-0">{meta.label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", meta.color)} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-xs font-medium text-right shrink-0">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.FC<{ className?: string }>; accent?: string;
}) {
  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", accent ?? "bg-primary/10")}>
          <Icon className={cn("w-3.5 h-3.5", accent ? "text-white" : "text-primary")} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Tab Button ────────────────────────────────────────────────────────────────

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      {children}
    </button>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ quiz, sessions }: { quiz: MockTest; sessions: MockTestSession[] }) {
  const submitted = sessions.filter(s => s.status === "completed");
  const inProgress = sessions.filter(s => s.status === "in_progress");
  const scores = submitted.map(s => s.totalScore ?? 0);
  const avgScore = avgOf(scores);
  const avgAcc = avgOf(submitted.map(s => accuracy(s.correctCount, s.wrongCount, s.skippedCount)));
  const passCount = submitted.filter(s => (s.totalScore ?? 0) >= (quiz.passingMarks ?? 0)).length;
  const passRate = submitted.length ? Math.round((passCount / submitted.length) * 100) : 0;
  const highScore = scores.length ? Math.max(...scores) : 0;

  // Aggregate error breakdown across all sessions
  const aggregatedErrors: Record<string, number> = { conceptual: 0, silly: 0, time: 0, guess: 0, skip: 0 };

  return (
    <div className="space-y-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Attempted" value={sessions.length} sub={inProgress.length ? `${inProgress.length} in progress` : "all submitted"} icon={Users} />
        <StatCard label="Submitted" value={submitted.length} sub={`of ${sessions.length} students`} icon={CheckCircle2} accent="bg-emerald-500" />
        <StatCard label="Avg Score" value={submitted.length ? `${avgScore}/${quiz.totalMarks}` : "—"} sub={`${avgAcc}% accuracy`} icon={TrendingUp} accent="bg-blue-500" />
        <StatCard label="Pass Rate" value={submitted.length ? `${passRate}%` : "—"} sub={`${passCount} passed`} icon={Trophy} accent="bg-amber-500" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-border rounded-xl p-3 bg-card text-center">
          <p className="text-lg font-bold text-emerald-600">{highScore}</p>
          <p className="text-xs text-muted-foreground mt-0.5">High Score</p>
        </div>
        <div className="border border-border rounded-xl p-3 bg-card text-center">
          <p className="text-lg font-bold text-blue-600">{scores.length ? Math.min(...scores) : "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Low Score</p>
        </div>
        <div className="border border-border rounded-xl p-3 bg-card text-center">
          <p className="text-lg font-bold">{quiz.questionIds?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Questions</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Score Distribution
          </h4>
          <ScoreHistogram sessions={sessions} totalMarks={quiz.totalMarks} />
        </div>
        <div className="border border-border rounded-xl p-4 bg-card">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Error Breakdown
          </h4>
          <ErrorBreakdownBars breakdown={aggregatedErrors} />
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Detailed error analysis available after AI grading
          </p>
        </div>
      </div>

      {/* Quiz meta strip */}
      <div className="border border-border rounded-xl p-4 bg-muted/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Type</p>
          <p className="font-medium capitalize mt-0.5">{quiz.type?.replace(/_/g, " ") ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="font-medium mt-0.5">{quiz.durationMinutes} min</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Marks</p>
          <p className="font-medium mt-0.5">{quiz.totalMarks}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Passing Marks</p>
          <p className="font-medium mt-0.5">{quiz.passingMarks ?? "Not set"}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Students Tab ──────────────────────────────────────────────────────────────

function StudentsTab({ sessions, quiz }: { sessions: MockTestSession[]; quiz: MockTest }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"score" | "accuracy" | "name">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...sessions]
    .filter(s => {
      const name = s.student?.fullName?.toLowerCase() ?? s.studentId;
      return name.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === "score") diff = (a.totalScore ?? 0) - (b.totalScore ?? 0);
      else if (sortKey === "accuracy") diff = accuracy(a.correctCount, a.wrongCount, a.skippedCount) - accuracy(b.correctCount, b.wrongCount, b.skippedCount);
      else diff = (a.student?.fullName ?? "").localeCompare(b.student?.fullName ?? "");
      return sortDir === "asc" ? diff : -diff;
    });

  const exportCsv = () => {
    const rows = [["Rank", "Student", "Status", "Score", "Correct", "Wrong", "Skipped", "Accuracy", "Submitted At"]];
    sorted.forEach((s, i) => {
      rows.push([
        String(i + 1),
        s.student?.fullName ?? s.studentId,
        s.status,
        String(s.totalScore ?? ""),
        String(s.correctCount ?? ""),
        String(s.wrongCount ?? ""),
        String(s.skippedCount ?? ""),
        `${accuracy(s.correctCount, s.wrongCount, s.skippedCount)}%`,
        s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "",
      ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quiz.title.replace(/\s+/g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortBtn = ({ k, label }: { k: typeof sortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn("flex items-center gap-1 hover:text-foreground transition-colors",
        sortKey === k ? "text-primary font-semibold" : "text-muted-foreground")}
    >
      {label}
      <span className="text-xs">{sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students…"
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="font-medium">No students have attempted yet</p>
          <p className="text-sm mt-1">Results will appear here once students submit.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-xs font-semibold">
                  <SortBtn k="name" label="Student" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-right">
                  <SortBtn k="score" label="Score" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-right text-emerald-600">✓</th>
                <th className="px-4 py-3 text-xs font-semibold text-right text-red-500">✗</th>
                <th className="px-4 py-3 text-xs font-semibold text-right text-muted-foreground">—</th>
                <th className="px-4 py-3 text-xs font-semibold text-right">
                  <SortBtn k="accuracy" label="Accuracy" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-right text-muted-foreground">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((s, i) => {
                const acc = accuracy(s.correctCount, s.wrongCount, s.skippedCount);
                const pct = scorePercent(s.totalScore, quiz.totalMarks);
                const isSubmitted = s.status === "completed";
                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {s.student?.fullName ?? (
                        <span className="text-muted-foreground font-mono text-xs">{s.studentId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                        s.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                        s.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
                        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                        {s.status === "completed" ? "Submitted" : s.status === "in_progress" ? "In Progress" : "Abandoned"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSubmitted ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400")}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-semibold text-xs w-10 text-right">{s.totalScore}/{quiz.totalMarks}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium text-xs">{isSubmitted ? (s.correctCount ?? 0) : "—"}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium text-xs">{isSubmitted ? (s.wrongCount ?? 0) : "—"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">{isSubmitted ? (s.skippedCount ?? 0) : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {isSubmitted ? (
                        <span className={cn("font-semibold text-xs",
                          acc >= 70 ? "text-emerald-600" : acc >= 40 ? "text-amber-600" : "text-red-500")}>
                          {acc}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Questions Tab ─────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  hard:   "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

function AccuracyBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">No data</span>;
  const color = value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[60px]">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-xs font-semibold w-9 text-right shrink-0",
        value >= 70 ? "text-emerald-600" : value >= 40 ? "text-amber-600" : "text-red-500")}>
        {value}%
      </span>
    </div>
  );
}

function QuestionsTab({ quiz }: { quiz: MockTest }) {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ["mock-test-question-stats", quiz.id],
    queryFn: () => getMockTestQuestionStats(quiz.id),
  });

  const exportCsv = () => {
    const rows = [["#", "Question", "Type", "Difficulty", "Attempts", "Correct", "Accuracy", "Avg Time"]];
    stats.forEach(s => {
      rows.push([
        String(s.order),
        `"${s.content.replace(/"/g, '""').slice(0, 100)}"`,
        s.type,
        s.difficulty,
        String(s.totalAttempts),
        String(s.correctCount),
        s.accuracy !== null ? `${s.accuracy}%` : "—",
        s.avgTimeSeconds !== null ? `${s.avgTimeSeconds}s` : "—",
      ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quiz.title.replace(/\s+/g, "_")}_question_stats.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading question stats…
      </div>
    );
  }

  if (!stats.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="font-medium">No questions found for this quiz.</p>
      </div>
    );
  }

  // Sort by accuracy ascending so hardest questions appear first
  const sorted = [...stats].sort((a, b) => {
    if (a.accuracy === null && b.accuracy === null) return 0;
    if (a.accuracy === null) return 1;
    if (b.accuracy === null) return -1;
    return a.accuracy - b.accuracy;
  });

  const withData = stats.filter(s => s.accuracy !== null);
  const hardest = withData.length ? sorted[0] : null;
  const easiest = withData.length ? sorted[withData.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      {withData.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-border rounded-xl p-3 bg-card text-center">
            <p className="text-lg font-bold">{stats.length}</p>
            <p className="text-xs text-muted-foreground">Total Questions</p>
          </div>
          <div className="border border-red-200 rounded-xl p-3 bg-red-50 dark:bg-red-950/20 text-center">
            <p className="text-lg font-bold text-red-600">{hardest?.accuracy ?? "—"}%</p>
            <p className="text-xs text-muted-foreground">Lowest Accuracy</p>
          </div>
          <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/20 text-center">
            <p className="text-lg font-bold text-emerald-600">{easiest?.accuracy ?? "—"}%</p>
            <p className="text-xs text-muted-foreground">Highest Accuracy</p>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Question list */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Question</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Difficulty</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right hidden md:table-cell">Attempts</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right hidden md:table-cell">Correct</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Avg Time</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map(s => (
              <tr key={s.questionId} className={cn("hover:bg-muted/20 transition-colors",
                s.accuracy !== null && s.accuracy < 40 ? "bg-red-50/40 dark:bg-red-950/10" : "")}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.order}</td>
                <td className="px-4 py-3 max-w-[220px]">
                  <p className="line-clamp-2 text-sm">{s.content || "—"}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5 sm:hidden">
                    {s.difficulty}
                  </p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded capitalize font-medium",
                    DIFFICULTY_COLOR[s.difficulty] ?? "bg-muted text-muted-foreground")}>
                    {s.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-xs font-medium hidden md:table-cell">
                  {s.totalAttempts}
                </td>
                <td className="px-4 py-3 text-right text-xs font-medium text-emerald-600 hidden md:table-cell">
                  {s.correctCount}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                  {s.avgTimeSeconds !== null ? `${s.avgTimeSeconds}s` : "—"}
                </td>
                <td className="px-4 py-3 min-w-[120px]">
                  <AccuracyBar value={s.accuracy} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab({ quiz, onPublish }: { quiz: MockTest; onPublish: () => Promise<void> }) {
  const [publishing, setPublishing] = useState(false);

  const Setting = ({ icon: Icon, label, value, active }: {
    icon: React.FC<{ className?: string }>; label: string; value: string; active?: boolean;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn("text-sm font-medium", active === true ? "text-emerald-600" : active === false ? "text-muted-foreground" : "")}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Publish banner */}
      {!quiz.isPublished && (
        <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">This quiz is a draft</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">Students cannot see it until you publish.</p>
          </div>
          <button
            onClick={async () => { setPublishing(true); await onPublish(); setPublishing(false); }}
            disabled={publishing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors shrink-0"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {publishing ? "Publishing…" : "Publish Now"}
          </button>
        </div>
      )}

      {/* Config */}
      <div className="border border-border rounded-xl px-4 bg-card">
        <Setting icon={Clock} label="Duration" value={`${quiz.durationMinutes} minutes`} />
        <Setting icon={Target} label="Total Marks" value={String(quiz.totalMarks)} />
        <Setting icon={Trophy} label="Passing Marks" value={quiz.passingMarks ? String(quiz.passingMarks) : "Not set"} />
        <Setting icon={BookOpen} label="Questions" value={String(quiz.questionIds?.length ?? 0)} />
        <Setting icon={Shuffle} label="Shuffle Questions" value={quiz.shuffleQuestions ? "Enabled" : "Disabled"} active={quiz.shuffleQuestions} />
        <Setting icon={Eye} label="Show Answers After Submit" value={quiz.showAnswersAfterSubmit ? "Yes" : "No"} active={quiz.showAnswersAfterSubmit} />
        <Setting icon={RotateCcw} label="Allow Re-attempt" value={quiz.allowReattempt ? "Yes" : "No"} active={quiz.allowReattempt} />
      </div>

      {/* Scheduled */}
      {quiz.scheduledAt && (
        <div className="border border-border rounded-xl p-4 bg-card flex items-center gap-3">
          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Scheduled for</p>
            <p className="text-sm text-muted-foreground">{new Date(quiz.scheduledAt).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────

type TabId = "overview" | "students" | "questions" | "settings";

export function QuizAnalyticsModal({ quiz, onClose }: { quiz: MockTest; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("overview");
  const queryClient = useQueryClient();

  const { data: fullQuiz } = useQuery({
    queryKey: ["mock-test-detail", quiz.id],
    queryFn: () => getMockTestById(quiz.id),
    initialData: quiz,
  });

  const { data: sessions = [], isLoading: sessionsLoading, refetch } = useQuery({
    queryKey: ["mock-test-sessions", quiz.id],
    queryFn: () => getMockTestSessions(quiz.id),
    refetchInterval: 30_000,
  });

  const publishM = useMutation({
    mutationFn: () => updateMockTest(quiz.id, { isPublished: true }),
    onSuccess: () => {
      toast.success("Quiz published!");
      queryClient.invalidateQueries({ queryKey: ["mock-tests"] });
      queryClient.invalidateQueries({ queryKey: ["mock-test-detail", quiz.id] });
    },
    onError: () => toast.error("Failed to publish quiz."),
  });

  const q = fullQuiz ?? quiz;
  const status = q.isPublished ? "published" : q.scheduledAt ? "scheduled" : "draft";
  const statusStyle = status === "published"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
    : status === "scheduled"
    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-border">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", statusStyle)}>{status}</span>
              <span className="text-xs text-muted-foreground capitalize">{q.type?.replace(/_/g, " ")}</span>
            </div>
            <h2 className="text-xl font-bold truncate">{q.title}</h2>
          </div>
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", sessionsLoading && "animate-spin")} />
            </button>
            <button
              onClick={() => {
                const text = `Quiz: ${q.title}\nType: ${q.type?.replace(/_/g, " ")}\nQuestions: ${q.questionIds?.length ?? 0}\nDuration: ${q.durationMinutes} min\nTotal Marks: ${q.totalMarks}\nStatus: ${q.isPublished ? "Published" : "Draft"}`;
                navigator.clipboard.writeText(text).then(() => toast.success("Quiz summary copied to clipboard"));
              }}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
              title="Share / Copy summary"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 shrink-0">
          <Tab active={tab === "overview"} onClick={() => setTab("overview")}>
            <span className="flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Overview</span>
          </Tab>
          <Tab active={tab === "students"} onClick={() => setTab("students")}>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Students
              {sessions.length > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {sessions.length}
                </span>
              )}
            </span>
          </Tab>
          <Tab active={tab === "questions"} onClick={() => setTab("questions")}>
            <span className="flex items-center gap-1.5"><ListOrdered className="w-3.5 h-3.5" /> Questions</span>
          </Tab>
          <Tab active={tab === "settings"} onClick={() => setTab("settings")}>
            <span className="flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5" /> Settings</span>
          </Tab>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sessionsLoading && tab === "overview" ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading analytics…
            </div>
          ) : tab === "overview" ? (
            <OverviewTab quiz={q} sessions={sessions} />
          ) : tab === "students" ? (
            <StudentsTab quiz={q} sessions={sessions} />
          ) : tab === "questions" ? (
            <QuestionsTab quiz={q} />
          ) : (
            <SettingsTab quiz={q} onPublish={publishM.mutateAsync} />
          )}
        </div>
      </div>
    </div>
  );
}
