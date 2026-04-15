import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Users, Video, BookOpen, FileText, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, Loader2, Download,
  Layout, Award, Zap, Activity,
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/use-admin";
import { useBatches } from "@/hooks/use-admin";
import { useLectures } from "@/hooks/use-admin";
import { useTeachers } from "@/hooks/use-admin";
import { useMockTests } from "@/hooks/use-admin";
import { useAdminPresenceStats } from "@/hooks/use-presence";
import { cn } from "@/lib/utils";

const BLUE = "#013889";
const BLUE_M = "#0257c8";

/* ── helpers ─────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
  bg = "bg-primary/10",
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  bg?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-[2rem] border border-slate-100 shadow-lg p-6 flex flex-col gap-4"
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", bg)}>
        <Icon className={cn("w-6 h-6", color)} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── simple bar ──────────────────────────────────────────────────── */
function MiniBar({ pct, color = "#013889" }: { pct: number; color?: string }) {
  return (
    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────────── */
export default function ReportsPage() {
  const { data: dash, isLoading: dashLoading } = useAdminDashboard();
  const { data: batches, isLoading: batchLoading } = useBatches();
  const { data: lectures, isLoading: lecLoading } = useLectures();
  const { data: teachers, isLoading: teachLoading } = useTeachers();
  const { data: mockTests, isLoading: testLoading } = useMockTests();
  const { data: presence } = useAdminPresenceStats();

  const loading = dashLoading || batchLoading || lecLoading || teachLoading || testLoading;

  const batchList: any[] = Array.isArray(batches) ? batches : [];
  const lecList: any[] = Array.isArray(lectures) ? lectures : [];
  const teachList: any[] = Array.isArray(teachers) ? teachers : [];
  const testList: any[] = Array.isArray(mockTests) ? mockTests : [];
  const stats = (dash?.stats ?? {}) as { totalStudents?: number; openDoubts?: number; [key: string]: any };

  const activeBatches = batchList.filter((b) => b.status === "active").length;
  const publishedLecs = lecList.filter((l) => l.status === "published").length;
  const publishedTests = testList.filter((t) => t.isPublished).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#013889]" />
          <p className="text-sm font-bold text-slate-500 animate-pulse">Generating Reports…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-20 space-y-10">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[#013889]" />
            Institute Reports
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Real-time overview of your institute's performance & operations
          </p>
        </div>
        <button
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
          onClick={() => window.print()}
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* ── Live Pulse Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] p-6 flex flex-wrap items-center gap-8"
        style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}
      >
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white/70">Live Right Now</span>
        </div>
        {[
          { label: "Students Online", val: presence?.studentsOnline ?? 0 },
          { label: "Active Classes", val: presence?.liveClassesRunning ?? 0 },
          { label: "Total Students", val: stats.totalStudents ?? 0 },
          { label: "Open Doubts", val: stats.openDoubts ?? 0 },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <p className="text-2xl font-extrabold text-white leading-none">{val}</p>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Top KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Layout} label="Total Batches" value={batchList.length}
          sub={`${activeBatches} currently active`} color="text-blue-600" bg="bg-blue-500/10" delay={0} />
        <StatCard icon={Video} label="Lectures" value={lecList.length}
          sub={`${publishedLecs} published`} color="text-indigo-600" bg="bg-indigo-500/10" delay={0.05} />
        <StatCard icon={FileText} label="Mock Tests" value={testList.length}
          sub={`${publishedTests} live`} color="text-emerald-600" bg="bg-emerald-500/10" delay={0.1} />
        <StatCard icon={Users} label="Teachers" value={teachList.length}
          sub="Onboarded educators" color="text-violet-600" bg="bg-violet-500/10" delay={0.15} />
      </div>

      {/* ── Batch Health Table ── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Batch Health Overview</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {batchList.length} batches enrolled
              </p>
            </div>
          </div>
        </div>

        {batchList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Layout className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">No batches created yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  {["Batch", "Class / Exam", "Students", "Capacity", "Status"].map((h) => (
                    <th key={h} className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {batchList.map((b: any) => {
                  const fillPct = b.maxStudents > 0 ? (b.studentCount / b.maxStudents) * 100 : 0;
                  const statusStyle: Record<string, string> = {
                    active: "bg-emerald-50 text-emerald-600 border-emerald-200",
                    inactive: "bg-slate-100 text-slate-500 border-slate-200",
                    completed: "bg-blue-50 text-blue-600 border-blue-200",
                  };
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">{b.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          {b.examTarget} · Class {b.class}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{b.studentCount}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <MiniBar pct={fillPct} color={fillPct > 90 ? "#EF4444" : BLUE} />
                          <span className="text-xs font-bold text-slate-500">{b.maxStudents}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border", statusStyle[b.status] ?? statusStyle.inactive)}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bottom Two Columns ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Lecture Breakdown */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-7 border-b border-slate-50 flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Video className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Lecture Activity</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Recent uploads & status</p>
            </div>
          </div>

          {lecList.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <Video className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No lectures yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {lecList.slice(0, 20).map((lec: any) => {
                const badgeMap: Record<string, string> = {
                  published: "bg-emerald-50 text-emerald-600",
                  draft: "bg-slate-100 text-slate-500",
                  processing: "bg-amber-50 text-amber-600",
                  live: "bg-rose-50 text-rose-600",
                };
                return (
                  <div key={lec.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{lec.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {lec.teacher?.fullName ?? "—"} {lec.batch?.name ? `· ${lec.batch.name}` : ""}
                      </p>
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ml-4 shrink-0", badgeMap[lec.status] ?? badgeMap.draft)}>
                      {lec.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Teacher Roster & Mock Tests */}
        <div className="space-y-6">
          {/* Teachers */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-7 border-b border-slate-50 flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Teacher Roster</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{teachList.length} educators onboarded</p>
              </div>
            </div>
            {teachList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No teachers added yet</p>
            ) : (
              <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
                {teachList.slice(0, 10).map((t: any) => {
                  const name = t.fullName || t.name || "—";
                  const subj = t.teacherProfile?.subjectExpertise?.join(", ") || t.subjects?.join(", ") || "—";
                  return (
                    <div key={t.id} className="flex items-center gap-4 px-6 py-3.5">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-xs font-extrabold text-violet-700 shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{subj}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full shrink-0",
                        t.teacherProfile?.onboardingComplete
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      )}>
                        {t.teacherProfile?.onboardingComplete ? "Active" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mock Tests */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-7 border-b border-slate-50 flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Assessment Modules</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {publishedTests} live · {testList.length} total
                </p>
              </div>
            </div>
            {testList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No mock tests created yet</p>
            ) : (
              <div className="divide-y divide-slate-50 max-h-44 overflow-y-auto">
                {testList.slice(0, 8).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-400">{t.totalMarks ? `${t.totalMarks} marks` : ""} {t.duration ? `· ${t.duration} min` : ""}</p>
                    </div>
                    <span className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ml-3 shrink-0",
                      t.isPublished ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {t.isPublished ? "Live" : "Draft"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
