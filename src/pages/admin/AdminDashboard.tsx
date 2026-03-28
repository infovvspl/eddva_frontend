import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Layout, BookOpen, GraduationCap, HelpCircle,
  Loader2, BarChart3, Clock, CheckCircle, AlertCircle,
  ChevronRight, TrendingUp, FileText, Radio, UserCheck, Video,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useAdminDashboard } from "@/hooks/use-admin";
import { useAdminPresenceStats } from "@/hooks/use-presence";

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  inactive: "bg-gray-400/10 text-gray-500",
  completed: "bg-blue-500/10 text-blue-600",
};

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useAdminDashboard();
  const { data: presence } = useAdminPresenceStats();
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { stats, recentBatches } = data;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-foreground">{user?.tenantName}</p>
          <p className="text-xs text-muted-foreground">Institute Admin</p>
        </div>
      </div>

      {/* Live Now Row */}
      <div className="bg-card border border-border rounded-2xl px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold text-foreground">Live Now</span>
          <span className="text-xs text-muted-foreground">— updates every 30 s</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Students Online",
              value: presence?.studentsOnline ?? "—",
              icon: UserCheck,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Teachers Online",
              value: presence?.teachersOnline ?? "—",
              icon: GraduationCap,
              color: "text-violet-500",
              bg: "bg-violet-500/10",
            },
            {
              label: "Live Classes",
              value: presence?.liveClassesRunning ?? "—",
              icon: Radio,
              color: presence?.liveClassesRunning ? "text-red-500" : "text-muted-foreground",
              bg: presence?.liveClassesRunning ? "bg-red-500/10" : "bg-muted/40",
            },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Students",
            value: stats.totalStudents,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            sub: `across ${stats.totalBatches} batches`,
          },
          {
            label: "Active Batches",
            value: stats.activeBatches,
            icon: Layout,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            sub: `${stats.totalBatches} total`,
          },
          {
            label: "Teachers",
            value: stats.totalTeachers,
            icon: GraduationCap,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            sub: `${stats.pendingTeachers} pending activation`,
          },
          {
            label: "Open Doubts",
            value: stats.openDoubts,
            icon: HelpCircle,
            color: stats.openDoubts > 0 ? "text-orange-500" : "text-emerald-500",
            bg: stats.openDoubts > 0 ? "bg-orange-500/10" : "bg-emerald-500/10",
            sub: "awaiting resolution",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Lectures Uploaded", value: stats.totalLectures, icon: BookOpen, color: "text-teal-500", bg: "bg-teal-500/10" },
          { label: "Test Sessions", value: stats.totalTestSessions, icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10" },
          { label: "Active Teachers", value: stats.activeTeachers, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Pending Teachers", value: stats.pendingTeachers, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Batches Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Batches Overview</h2>
          <button
            onClick={() => navigate("/admin/batches")}
            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentBatches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Layout className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No batches yet. <button onClick={() => navigate("/admin/batches")} className="text-primary underline">Create one</button></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Batch</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Teacher</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Students</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Dates</th>
                  <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => navigate("/admin/batches")}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                      <p className="text-xs text-muted-foreground uppercase mt-0.5">{b.examTarget} · Class {b.class}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {b.teacherName || <span className="italic text-muted-foreground/50">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{b.studentCount}</span>
                        <span className="text-xs text-muted-foreground">/ {b.maxStudents}</span>
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (b.studentCount / b.maxStudents) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground hidden lg:table-cell">
                      {b.startDate
                        ? `${new Date(b.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${b.endDate ? new Date(b.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "Ongoing"}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor[b.status] || statusColor.inactive}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Add Teacher", icon: GraduationCap, path: "/admin/teachers", color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Create Batch", icon: Layout, path: "/admin/batches", color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Manage Content", icon: BookOpen, path: "/admin/content", color: "text-teal-500", bg: "bg-teal-500/10" },
          { label: "View Students", icon: Users, path: "/admin/students", color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-secondary/50 transition-colors text-center"
          >
            <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
              <a.icon className={`w-5 h-5 ${a.color}`} />
            </div>
            <span className="text-xs font-semibold text-foreground">{a.label}</span>
          </button>
        ))}
      </motion.div>

    </motion.div>
  );
};

export default AdminDashboard;
