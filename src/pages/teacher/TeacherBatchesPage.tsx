import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Users, BarChart3, ChevronDown, ChevronRight,
  Layout, Flame, BookOpen, Target, Eye, WifiOff,
  Bell, AlertTriangle, CheckCircle, BarChart3,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMyBatches, useBatchRoster, useBatchPerformance } from "@/hooks/use-teacher";
import { getInactiveStudents, sendBulkReminder, type InactiveStudent } from "@/lib/api/teacher";

// ─── Types & helpers ──────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  inactive: "bg-gray-400/10 text-gray-500",
  completed: "bg-blue-500/10 text-blue-600",
};

type Tab = "roster" | "performance" | "inactive";

function daysAgoLabel(dateStr: string | null, daysInactive: number | null) {
  if (!dateStr) return "Never logged in";
  if (daysInactive === null) return "Unknown";
  if (daysInactive === 0) return "Today";
  if (daysInactive === 1) return "Yesterday";
  return `${daysInactive} days ago`;
}

// ─── Inactive Tab ─────────────────────────────────────────────────────────────

function InactiveTab({ batchId }: { batchId: string }) {
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["teacher", "inactive", batchId],
    queryFn: () => getInactiveStudents(batchId),
    staleTime: 60_000,
  });

  async function handleBulkRemind() {
    setSending(true);
    try {
      const result = await sendBulkReminder(batchId);
      toast.success(result.message);
      refetch();
    } catch {
      toast.error("Failed to send reminders. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (isLoading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (isError) return (
    <div className="text-center py-10 text-muted-foreground text-sm">
      Failed to load inactive students.
    </div>
  );

  const students: InactiveStudent[] = data?.students ?? [];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""} inactive for 3+ days
          </span>
        </div>
        {students.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/10"
            onClick={handleBulkRemind}
            disabled={sending}
          >
            {sending
              ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              : <Bell className="w-3.5 h-3.5 mr-1.5" />}
            Send Bulk Reminder
          </Button>
        )}
      </div>

      {students.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">All students are active!</p>
          <p className="text-xs text-muted-foreground mt-1">No one has been inactive for 3+ days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map(s => (
            <div key={s.studentId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center text-sm font-bold text-orange-400 shrink-0">
                {(s.name ?? "?").charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{s.name ?? "Unknown"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{s.phone ?? "No phone"}</span>
                  <span>·</span>
                  <span className="text-orange-400 font-medium">
                    {daysAgoLabel(s.lastLoginAt, s.daysInactive)}
                  </span>
                  {s.streakDays > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-orange-500" /> {s.streakDays}d streak
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Days badge */}
              <div className="shrink-0">
                {s.daysInactive !== null && s.daysInactive >= 7 ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-medium">
                    {s.daysInactive}d
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 font-medium">
                    {s.daysInactive ?? "?"}d
                  </span>
                )}
              </div>

              {/* View detail */}
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(`/teacher/students/${s.studentId}?batchId=${batchId}`)}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Batch Detail (3 tabs) ────────────────────────────────────────────────────

const BatchDetail = ({ batchId }: { batchId: string }) => {
  const [tab, setTab] = useState<Tab>("roster");
  const navigate = useNavigate();
  const { data: roster, isLoading: rosterLoading } = useBatchRoster(batchId);
  const { data: performance, isLoading: perfLoading } = useBatchPerformance(batchId);

  const tabs: { key: Tab; label: string }[] = [
    { key: "roster", label: "Student Roster" },
    { key: "performance", label: "Performance" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mt-2">
      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.key ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            {t.key === "inactive" && (
              <AlertTriangle className="w-3 h-3 ml-1.5 text-orange-400 inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* Roster */}
      {tab === "roster" && (
        rosterLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !roster?.length ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No students enrolled yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-muted-foreground">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-muted-foreground hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-muted-foreground">Streak</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-muted-foreground hidden sm:table-cell">Lectures (7d)</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-muted-foreground">Last Score</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-muted-foreground hidden lg:table-cell">Last Login</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase text-muted-foreground">Detail</th>
                </tr>
              </thead>
              <tbody>
                {roster.map(s => (
                  <tr key={s.studentId} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(s.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{s.name || "Unknown Student"}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{s.phone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <p className="text-muted-foreground text-xs">{s.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-foreground font-semibold">{s.streakDays ?? 0}d</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-center">
                      <span className="text-foreground font-medium">{s.lecturesWatchedThisWeek ?? 0}</span>
                    </td>
                    <td className="px-5 py-3">
                      {s.lastTestScore != null ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.lastTestScore >= 60 ? "bg-emerald-500/10 text-emerald-600" : s.lastTestScore >= 40 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-500"}`}>
                          {s.lastTestScore}%
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Never"}
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2.5 gap-1.5"
                        onClick={() => navigate(`/teacher/students/${s.studentId}?batchId=${batchId}`)}
                      >
                        <BarChart3 className="w-3 h-3" /> Progress
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Performance */}
      {tab === "performance" && (
        perfLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !performance ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No test data yet.</div>
        ) : (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Avg Accuracy", value: `${(performance.avgAccuracy ?? 0).toFixed(1)}%`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Avg Score", value: `${(performance.avgScore ?? 0).toFixed(1)}%`, icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Tests Taken", value: performance.testCount ?? 0, icon: BookOpen, color: "text-violet-500", bg: "bg-violet-500/10" },
              ].map(m => (
                <div key={m.label} className="bg-secondary/50 rounded-xl p-4">
                  <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Top Performers
                </h4>
                <div className="space-y-2">
                  {(performance.topStudents ?? []).slice(0, 5).map((s, i) => (
                    <div key={s.studentId} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">{s.name ?? "Unknown"}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{(s.score ?? 0).toFixed(0)}%</span>
                    </div>
                  ))}
                  {!performance.topStudents?.length && <p className="text-xs text-muted-foreground">No data</p>}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Needs Attention
                </h4>
                <div className="space-y-2">
                  {(performance.bottomStudents ?? []).slice(0, 5).map((s, i) => (
                    <div key={s.studentId} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">{s.name ?? "Unknown"}</span>
                      </div>
                      <span className="text-sm font-bold text-orange-500">{(s.score ?? 0).toFixed(0)}%</span>
                    </div>
                  ))}
                  {!performance.bottomStudents?.length && <p className="text-xs text-muted-foreground">No data</p>}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Inactive */}
      {tab === "inactive" && <InactiveTab batchId={batchId} />}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const TeacherBatchesPage = () => {
  const [searchParams] = useSearchParams();
  const defaultId = searchParams.get("id") || "";
  const [expandedId, setExpandedId] = useState<string>(defaultId);
  const { data: batches, isLoading } = useMyBatches();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const batchList = batches ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground">My Batches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{batchList.length} batches assigned to you</p>
      </div>

      {batchList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Layout className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No batches assigned yet</p>
          <p className="text-sm mt-1">Contact your institute admin to get assigned to a batch.</p>
        </div>
      ) : (
        batchList.map(batch => (
          <div key={batch.id}>
            <button
              onClick={() => setExpandedId(expandedId === batch.id ? "" : batch.id)}
              className="w-full bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Layout className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{batch.name}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-0.5">{batch.examTarget} · Class {batch.class}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{batch.studentCount ?? 0} enrolled</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor[batch.status] ?? statusColor.inactive}`}>
                  {batch.status}
                </span>
                {expandedId === batch.id
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            <AnimatePresence>
              {expandedId === batch.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <BatchDetail batchId={batch.id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default TeacherBatchesPage;
