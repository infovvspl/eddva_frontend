import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, BookOpen, HelpCircle, Loader2, ChevronRight,
  Video, Sparkles, Radio, Plus, BarChart2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useAdminDashboard, useBatches } from "@/hooks/use-admin";
import { useAdminPresenceStats } from "@/hooks/use-presence";
import { cn } from "@/lib/utils";

// ─── Thumbnail generator ──────────────────────────────────────────────────────

const EXAM_STYLES: Record<string, { from: string; to: string; badge: string }> = {
  jee: { from: "#1D4ED8", to: "#4F46E5", badge: "JEE" },
  neet: { from: "#059669", to: "#0D9488", badge: "NEET" },
  both: { from: "#7C3AED", to: "#C026D3", badge: "ALL" },
  default: { from: "#0F172A", to: "#334155", badge: "—" },
};

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").origin; }
  catch { return "http://localhost:3000"; }
})();
function resolveMediaUrl(url?: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${_API_ORIGIN}${url}`;
}

function CourseThumbnail({ name, examTarget, imageUrl, className = "" }: { name: string; examTarget: string; imageUrl?: string; className?: string }) {
  const [imgError, setImgError] = React.useState(false);
  const style = EXAM_STYLES[examTarget?.toLowerCase()] ?? EXAM_STYLES.default;
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  const resolvedUrl = resolveMediaUrl(imageUrl);
  if (resolvedUrl && !imgError) {
    return (
      <div className={cn("rounded-2xl overflow-hidden shrink-0", className)}>
        <img src={resolvedUrl} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  return (
    <div
      className={cn("rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shrink-0", className)}
      style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
      <span className="text-white font-black text-xl relative z-10 leading-none">{initials}</span>
      <span className="text-white/60 text-[9px] font-black uppercase tracking-widest mt-1 relative z-10">{style.badge}</span>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color, delay = 0, onClick }: {
  label: string; value: string | number; sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; delay?: number; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={cn(
        "bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5"
      )}
    >
      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center mb-4", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">{label}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </motion.div>
  );
}

// ─── Course card for dashboard ────────────────────────────────────────────────

function CourseCard({ course, index, onClick }: { course: any; index: number; onClick: () => void }) {
  const enrolled = course.studentCount ?? course.enrolledCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all cursor-pointer group"
    >
      <CourseThumbnail name={course.name} examTarget={course.examTarget} imageUrl={course.thumbnailUrl} className="w-14 h-14" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{course.name}</p>
          <span className={cn(
            "shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
            course.status === "active"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-slate-50 text-slate-400 border-slate-100"
          )}>
            {course.status}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-semibold uppercase">
          {course.examTarget?.toUpperCase()} · Class {course.class}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-500 shrink-0">{enrolled} enrolled</span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-blue-500 shrink-0 transition-colors" />
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useAdminDashboard();
  const { data: batchesRaw } = useBatches();
  const { data: presence } = useAdminPresenceStats();
  const navigate = useNavigate();

  const courses: any[] = Array.isArray(batchesRaw) ? batchesRaw : [];

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const { stats } = data;
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-8 space-y-8 pb-20">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <p className="text-sm font-semibold text-slate-400">{today}</p>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">
            Welcome back{firstName ? `, ${user?.name}` : ""} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{user?.tenantName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 border border-red-100">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-600">{presence?.studentsOnline ?? 0} online</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-100">
            <Radio className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">{presence?.liveClassesRunning ?? 0} live</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard delay={0.0} label="Total Students" value={stats.totalStudents} sub="Enrolled across all courses"
          icon={Users} color="bg-blue-600" onClick={() => navigate("/admin/students")} />
        <StatCard delay={0.08} label="Active Courses" value={`${stats.activeBatches}/${stats.totalBatches}`} sub="Courses running now"
          icon={BookOpen} color="bg-indigo-600" onClick={() => navigate("/admin/batches")} />
        <StatCard delay={0.16} label="Total Lectures" value={stats.totalLectures} sub="Published & recorded"
          icon={Video} color="bg-violet-600" onClick={() => navigate("/teacher/lectures")} />
        <StatCard delay={0.24} label="Open Doubts" value={stats.openDoubts} sub="Awaiting your response"
          icon={HelpCircle} color={stats.openDoubts > 0 ? "bg-orange-500" : "bg-emerald-600"}
          onClick={() => navigate("/teacher/doubts")} />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ── Course list (2/3) ── */}
        <div className="xl:col-span-2 space-y-4 ">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Your Courses</h2>
              <p className="text-xs text-slate-400 mt-0.5">{courses.length} course{courses.length !== 1 ? "s" : ""} · click to manage</p>
            </div>
            <button
              onClick={() => navigate("/admin/batches")}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200 ">
              {/* <BookOpen className="w-10 h-10 text-gray-800 mb-3" /> */}
              <p className="text-sm font-bold text-slate-400">No courses yet</p>
              <button onClick={() => navigate("/admin/batches")}
                className="mt-4 text-xs  font-black text-blue-600 hover:underline">
                Create your first course →
              </button>
            </div>
          ) : (
            <div className="space-y-3 shadow-lg rounded-xl">
              {courses.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} onClick={() => navigate("/admin/batches")} />
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar (1/3) ── */}
        <div className="space-y-6">

          {/* Quick actions */}
          <div className="bg-white rounded-3xl p-6 text-gray-900 shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 mb-5">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { label: "Create Course", icon: Plus, path: "/admin/batches", color: "bg-blue-500" },
                { label: "Build Content", icon: BookOpen, path: "/admin/content", color: "bg-indigo-500" },
                { label: "Schedule Class", icon: Radio, path: "/teacher/lectures", color: "bg-red-500" },
                { label: "View Analytics", icon: BarChart2, path: "/teacher/analytics", color: "bg-violet-500" },
                { label: "AI Tools", icon: Sparkles, path: "/teacher/ai-tools", color: "bg-amber-500" },
              ].map((a) => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-gray-200 hover:bg-white/10 transition-colors group text-left">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", a.color)}>
                    <a.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 transition-colors">{a.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 ml-auto transition-colors" />
                </button>
              ))}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
