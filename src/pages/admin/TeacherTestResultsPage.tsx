import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Users, Trophy, TrendingUp, CheckCircle2, XCircle, Minus,
  Download, Search, ChevronUp, ChevronDown, BarChart2, ClipboardEdit,
  Loader2, AlertCircle, Clock, Target, RefreshCw, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMockTest, getMockTestSessions } from "@/lib/api/admin";
import { getBatchRoster } from "@/lib/api/admin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function pct(a?: number, b?: number) {
  if (!b) return 0;
  return Math.round(((a ?? 0) / b) * 100);
}

function accPct(correct?: number, wrong?: number, skipped?: number) {
  const total = (correct ?? 0) + (wrong ?? 0);
  if (!total) return null;
  return Math.round(((correct ?? 0) / total) * 100);
}

function calcTimeSpent(start?: string | null, end?: string | null) {
  if (!start || !end) return "—";
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const diffMs = e - s;
  if (diffMs < 0) return "—";
  const diffSecs = Math.floor(diffMs / 1000);
  const h = Math.floor(diffSecs / 3600);
  const m = Math.floor((diffSecs % 3600) / 60);
  const sRem = diffSecs % 60;
  if (h > 0) return `${h}h ${m}m ${sRem}s`;
  return `${m}m ${sRem}s`;
}

type SortKey = "name" | "score" | "accuracy" | "status" | "time";
type SortDir = "asc" | "desc";

// ─── Score Histogram ──────────────────────────────────────────────────────────

function ScoreHistogram({ rows, totalMarks }: { rows: StudentRow[]; totalMarks: number }) {
  const submitted = rows.filter(r => r.status === "completed" || r.status === "auto_submitted");
  if (!submitted.length) return <p className="text-sm text-muted-foreground text-center py-6">No submissions yet</p>;

  const buckets = ["0–20%", "21–40%", "41–60%", "61–80%", "81–100%"];
  const counts = [0, 0, 0, 0, 0];
  submitted.forEach(r => {
    const p = pct(r.totalScore, totalMarks);
    counts[Math.min(Math.floor(p / 20), 4)]++;
  });
  const maxC = Math.max(...counts, 1);
  const colors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-600"];

  return (
    <div className="space-y-2.5">
      {buckets.map((label, i) => (
        <div key={label} className="flex items-center gap-3 text-sm">
          <span className="w-14 text-xs text-muted-foreground text-right shrink-0">{label}</span>
          <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(counts[i] / maxC) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={cn("h-full rounded-md", colors[i])}
            />
          </div>
          <span className="w-5 text-xs font-bold text-right shrink-0">{counts[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRow {
  studentId: string;
  name: string;
  sessionId: string | null;
  status: "completed" | "auto_submitted" | "in_progress" | "abandoned" | "not_started";
  totalScore: number | null;
  correctCount: number | null;
  wrongCount: number | null;
  skippedCount: number | null;
  submittedAt: string | null;
  startedAt: string | null;
  isLate?: boolean;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StudentRow["status"] }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    completed:      { label: "Submitted", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    auto_submitted: { label: "Auto-submitted", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    in_progress:    { label: "In Progress", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    abandoned:      { label: "Abandoned", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
    not_started:    { label: "Not Started", cls: "bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400" },
  };
  const { label, cls } = cfg[status] ?? cfg.not_started;
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap", cls)}>{label}</span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.FC<{ className?: string }>; accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl p-4 bg-card"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accent ?? "bg-primary/10")}>
          <Icon className={cn("w-4 h-4", accent ? "text-white" : "text-primary")} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeacherTestResultsPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterStatus, setFilterStatus] = useState<"all" | "submitted" | "not_started">("all");

  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ["mock-test-detail", testId],
    queryFn: () => getMockTest(testId!),
    enabled: !!testId,
  });

  const { data: sessions = [], isLoading: sessionsLoading, refetch } = useQuery({
    queryKey: ["mock-test-sessions-results", testId],
    queryFn: () => getMockTestSessions(testId!),
    enabled: !!testId,
    refetchInterval: 60_000,
  });

  const batchId = (test as any)?.batchId ?? "";
  const { data: rosterRaw, isLoading: rosterLoading } = useQuery({
    queryKey: ["batch-roster", batchId],
    queryFn: () => getBatchRoster(batchId),
    enabled: !!batchId,
  });

  const roster: { studentId: string; name: string | null }[] = useMemo(() => {
    if (!rosterRaw) return [];
    if (Array.isArray(rosterRaw)) return rosterRaw as any[];
    if ((rosterRaw as any).data) return (rosterRaw as any).data;
    return [];
  }, [rosterRaw]);

  // Merge roster with sessions so ALL enrolled students appear
  const rows: StudentRow[] = useMemo(() => {
    const deadlineTime = (test as any)?.deadlineAt ? new Date((test as any).deadlineAt).getTime() : null;
    // Pick the FIRST attempt (earliest startedAt) for each student — retakes are student practice only
    const sessionMap = new Map<string, any>();
    for (const s of sessions) {
      const sid = s.studentId ?? s.student_id;
      const existing = sessionMap.get(sid);
      if (!existing) {
        sessionMap.set(sid, s);
      } else {
        const existingTime = new Date(existing.startedAt ?? 0).getTime();
        const thisTime = new Date(s.startedAt ?? 0).getTime();
        if (thisTime < existingTime) {
          sessionMap.set(sid, s);
        }
      }
    }

    const seen = new Set<string>();
    const result: StudentRow[] = [];

    // Students from roster
    for (const r of roster) {
      seen.add(r.studentId);
      const s = sessionMap.get(r.studentId);
      result.push({
        studentId: r.studentId,
        name: r.name ?? "Unknown",
        sessionId: s?.id ?? null,
        status: s ? (s.status as any) : "not_started",
        totalScore: s?.totalScore ?? null,
        correctCount: s?.correctCount ?? null,
        wrongCount: s?.wrongCount ?? null,
        skippedCount: s?.skippedCount ?? null,
        submittedAt: s?.submittedAt ?? null,
        startedAt: s?.startedAt ?? null,
        isLate: s?.submittedAt && deadlineTime ? new Date(s.submittedAt).getTime() > deadlineTime : false,
      });
    }

    // Students in sessions but not in roster (edge case)
    for (const s of sessions) {
      const sid = s.studentId ?? s.student_id;
      if (!seen.has(sid)) {
        seen.add(sid);
        const name = s.student?.fullName ?? s.student?.name ?? s.studentName ?? `Student ${sid.slice(0, 6)}`;
        result.push({
          studentId: sid,
          name,
          sessionId: s.id,
          status: s.status,
          totalScore: s.totalScore ?? null,
          correctCount: s.correctCount ?? null,
          wrongCount: s.wrongCount ?? null,
          skippedCount: s.skippedCount ?? null,
          submittedAt: s.submittedAt ?? null,
          startedAt: s.startedAt ?? null,
          isLate: s.submittedAt && deadlineTime ? new Date(s.submittedAt).getTime() > deadlineTime : false,
        });
      }
    }

    return result;
  }, [roster, sessions, test]);

  const totalMarks = test?.totalMarks ?? 0;
  const submitted = rows.filter(r => r.status === "completed" || r.status === "auto_submitted");
  const scores = submitted.map(r => r.totalScore ?? 0);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const passCount = submitted.filter(r => (r.totalScore ?? 0) >= ((test as any)?.passingMarks ?? 0)).length;
  const passRate = submitted.length ? Math.round((passCount / submitted.length) * 100) : 0;

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(s => s.name.toLowerCase().includes(q));
    }
    if (filterStatus === "submitted") r = r.filter(s => s.status === "completed" || s.status === "auto_submitted");
    if (filterStatus === "not_started") r = r.filter(s => s.status === "not_started");

    return [...r].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name);
      else if (sortKey === "score") diff = (a.totalScore ?? -1) - (b.totalScore ?? -1);
      else if (sortKey === "accuracy") diff = (accPct(a.correctCount ?? 0, a.wrongCount ?? 0) ?? -1) - (accPct(b.correctCount ?? 0, b.wrongCount ?? 0) ?? -1);
      else if (sortKey === "time") {
        const timeA = (a.startedAt && a.submittedAt) ? new Date(a.submittedAt).getTime() - new Date(a.startedAt).getTime() : -1;
        const timeB = (b.startedAt && b.submittedAt) ? new Date(b.submittedAt).getTime() - new Date(b.startedAt).getTime() : -1;
        diff = timeA - timeB;
      }
      else if (sortKey === "status") {
        const order: Record<string, number> = { completed: 0, auto_submitted: 1, in_progress: 2, abandoned: 3, not_started: 4 };
        diff = (order[a.status] ?? 5) - (order[b.status] ?? 5);
      }
      return sortDir === "asc" ? diff : -diff;
    });
  }, [rows, search, filterStatus, sortKey, sortDir]);

  const exportCsv = () => {
    const cols = ["#", "Student", "Status", "Score", "Correct", "Wrong", "Skipped", "Accuracy %", "Time Spent", "Submitted At"];
    const data = filtered.map((r, i) => [
      i + 1,
      r.name,
      r.status.replace(/_/g, " "),
      r.totalScore ?? "",
      r.correctCount ?? "",
      r.wrongCount ?? "",
      r.skippedCount ?? "",
      accPct(r.correctCount ?? 0, r.wrongCount ?? 0) ?? "",
      calcTimeSpent(r.startedAt, r.submittedAt),
      fmtDate(r.submittedAt),
    ]);
    const csv = [cols, ...data].map(row => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${test?.title ?? "results"}.csv` });
    a.click(); URL.revokeObjectURL(url);
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn("flex items-center gap-1 text-xs font-semibold transition-colors hover:text-foreground",
        sortKey === k ? "text-primary" : "text-muted-foreground")}
    >
      {label}
      {sortKey === k
        ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
        : <ChevronDown className="w-3 h-3 opacity-30" />}
    </button>
  );

  const isLoading = testLoading || sessionsLoading || rosterLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading results…</span>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <AlertCircle className="w-10 h-10 opacity-30" />
        <p>Test not found.</p>
        <button onClick={() => navigate(from || "/admin/mock-tests", { state: { restoreBatchId: batchId } })} className="text-sm text-primary underline">Back to Course</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(from || "/admin/mock-tests", { state: { restoreBatchId: batchId } })}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                (test as any).isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              )}>
                {(test as any).isPublished ? "Published" : "Draft"}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{(test as any).type?.replace(/_/g, " ")}</span>
            </div>
            <h1 className="text-lg font-bold truncate">{test.title}</h1>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Meta strip ── */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{(test as any).durationMinutes} min</span>
          <span className="flex items-center gap-1.5"><Target className="w-4 h-4" />{totalMarks} marks</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{(test as any).questionIds?.length ?? 0} questions</span>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Enrolled" value={rows.length} sub="total students" icon={Users} />
          <StatCard label="Submitted" value={submitted.length} sub={`of ${rows.length} students`} icon={CheckCircle2} accent="bg-emerald-500" />
          <StatCard label="Avg Score" value={submitted.length ? `${avgScore}/${totalMarks}` : "—"} sub="submitted students" icon={TrendingUp} accent="bg-blue-500" />
          <StatCard label="Pass Rate" value={submitted.length ? `${passRate}%` : "—"} sub={`${passCount} passed`} icon={Trophy} accent="bg-amber-500" />
        </div>

        {/* ── Histogram ── */}
        <div className="border border-border rounded-xl p-5 bg-card">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Score Distribution
          </h3>
          <ScoreHistogram rows={rows} totalMarks={totalMarks} />
        </div>

        {/* ── Filters & search ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "submitted", "not_started"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={cn("px-3 py-2 text-xs rounded-lg border font-medium transition-colors whitespace-nowrap",
                  filterStatus === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-secondary")}
              >
                {f === "all" ? "All" : f === "submitted" ? "Submitted" : "Not Started"}
              </button>
            ))}
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-medium hover:bg-secondary transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        {/* ── Results table ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filterStatus + search}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-border rounded-xl overflow-hidden"
          >
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No students match the filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs text-muted-foreground font-semibold w-10">#</th>
                      <th className="px-4 py-3"><SortBtn k="name" label="Student" /></th>
                      <th className="px-4 py-3"><SortBtn k="status" label="Status" /></th>
                      <th className="px-4 py-3 text-right"><SortBtn k="score" label="Score" /></th>
                      <th className="px-4 py-3 text-right text-emerald-600 font-semibold text-xs hidden sm:table-cell">✓</th>
                      <th className="px-4 py-3 text-right text-red-500 font-semibold text-xs hidden sm:table-cell">✗</th>
                      <th className="px-4 py-3 text-right text-muted-foreground font-semibold text-xs hidden sm:table-cell">—</th>
                      <th className="px-4 py-3 text-right hidden md:table-cell"><SortBtn k="accuracy" label="Accuracy" /></th>
                      <th className="px-4 py-3 text-right hidden lg:table-cell"><SortBtn k="time" label="Time" /></th>
                      <th className="px-4 py-3 text-right text-muted-foreground text-xs hidden lg:table-cell">Submitted</th>
                      <th className="px-4 py-3 text-center text-xs text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((row, i) => {
                      const scorePct = pct(row.totalScore ?? 0, totalMarks);
                      const acc = accPct(row.correctCount ?? 0, row.wrongCount ?? 0);
                      const isSubmitted = row.status === "completed" || row.status === "auto_submitted";
                      return (
                        <motion.tr
                          key={row.studentId}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            row.status === "not_started" && "opacity-75"
                          )}
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{i + 1}</td>
                          <td className="px-4 py-3 font-medium max-w-[180px] truncate">{row.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <StatusBadge status={row.status} />
                              {row.isLate && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Late</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isSubmitted ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={cn("h-full rounded-full", scorePct >= 70 ? "bg-emerald-500" : scorePct >= 40 ? "bg-amber-500" : "bg-red-400")}
                                    style={{ width: `${scorePct}%` }}
                                  />
                                </div>
                                <span className="font-semibold text-xs">{row.totalScore}/{totalMarks}</span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-medium text-xs hidden sm:table-cell">
                            {isSubmitted ? (row.correctCount ?? 0) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-red-500 font-medium text-xs hidden sm:table-cell">
                            {isSubmitted ? (row.wrongCount ?? 0) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden sm:table-cell">
                            {isSubmitted ? (row.skippedCount ?? 0) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right hidden md:table-cell">
                            {acc !== null ? (
                              <span className={cn("text-xs font-semibold",
                                acc >= 70 ? "text-emerald-600" : acc >= 40 ? "text-amber-600" : "text-red-500"
                              )}>{acc}%</span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-mono text-muted-foreground hidden lg:table-cell">
                            {calcTimeSpent(row.startedAt, row.submittedAt)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">
                            {fmtDate(row.submittedAt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.sessionId ? (
                              <button
                                onClick={() => navigate(`/admin/mock-tests/${testId}/sessions/${row.sessionId}/grade`)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors"
                              >
                                <ClipboardEdit className="w-3.5 h-3.5" />
                                Grade
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Footer summary ── */}
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {rows.length} students • {submitted.length} submitted • {rows.filter(r => r.status === "not_started").length} not started
        </p>
      </div>
    </div>
  );
}
