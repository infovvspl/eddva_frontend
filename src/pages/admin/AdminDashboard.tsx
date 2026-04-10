import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Layout, BookOpen, HelpCircle,
  Loader2, ChevronRight, FileText, Radio, UserCheck, Video, 
  Sparkles, Zap, Shield, Activity, Layers
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useAdminDashboard } from "@/hooks/use-admin";
import { useAdminPresenceStats } from "@/hooks/use-presence";
import { cn } from "@/lib/utils";

const BLUE = "#013889";
const BLUE_M = "#0257c8";

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
  inactive: "bg-slate-400/10 text-slate-500 border-slate-200/50",
  completed: "bg-blue-500/10 text-blue-600 border-blue-200/50",
};

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useAdminDashboard();
  const { data: presence } = useAdminPresenceStats();
  const navigate = useNavigate();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#013889]" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  const { stats, recentBatches } = data;
  const today = new Date().toLocaleDateString("en-IN", { 
    weekday: "long", 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  });

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 pb-20">
      
      {/* ── Cinematic Header ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#013889] p-8 lg:p-12 text-white shadow-2xl shadow-[#013889]/20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold tracking-wider uppercase">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Operational Status: Optimal</span>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
                Command Center{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
              </h1>
              <p className="text-blue-100/70 font-medium mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {today} • {user?.tenantName}
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 text-center min-w-[120px]">
              <p className="text-xl font-bold leading-none">{presence?.studentsOnline ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-blue-200">Live Students</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 text-center min-w-[120px]">
              <p className="text-xl shadow-sm font-bold leading-none">{presence?.liveClassesRunning ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-blue-200">Active Classes</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Capacity",
            val: stats.totalStudents,
            sub: `Active Students Across ${stats.totalBatches} Channels`,
            icon: Users,
            gradient: "from-blue-600 to-indigo-700",
            shadow: "shadow-blue-500/20"
          },
          {
            label: "Deployment",
            val: stats.activeBatches,
            sub: `Live Operation Batches • ${stats.totalBatches} Allocated`,
            icon: Layout,
            gradient: "from-indigo-600 to-violet-700",
            shadow: "shadow-indigo-500/20"
          },
          {
            label: "Intelligence Queue",
            val: stats.openDoubts,
            sub: "Unresolved Student Intelligence Queries",
            icon: HelpCircle,
            gradient: stats.openDoubts > 0 ? "from-orange-500 to-rose-600" : "from-emerald-500 to-teal-600",
            shadow: stats.openDoubts > 0 ? "shadow-orange-500/20" : "shadow-emerald-500/20"
          }
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "group relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-8 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl",
              s.shadow
            )}
          >
            <div className={cn("inline-flex p-4 rounded-2xl bg-gradient-to-br text-white mb-6 transform group-hover:scale-110 transition-transform", s.gradient)}>
              <s.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{s.label}</h3>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{s.val}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-4 leading-relaxed">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ── Operational Assets (Left: 2/3) ── */}
        <div className="xl:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-none">Operational Overview</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Active Batch Deployments</p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/admin/batches")}
                className="group flex items-center gap-2 text-[10px] font-bold text-primary hover:opacity-80 transition-all uppercase tracking-widest"
              >
                Global View <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-8 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Batch Code</th>
                    <th className="text-left px-8 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Target Segment</th>
                    <th className="text-left px-8 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Load</th>
                    <th className="text-left px-8 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentBatches.map((b) => (
                    <tr 
                      key={b.id} 
                      onClick={() => navigate("/admin/batches")}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{b.name}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          {b.examTarget} • CL-{b.class}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs font-black text-slate-700">{b.studentCount} / {b.maxStudents}</span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (b.studentCount / b.maxStudents) * 100)}%` }}
                              className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(1,56,137,0.3)]" 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                          statusColor[b.status] || statusColor.inactive
                        )}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentBatches.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <Layers className="w-16 h-16 mb-4" />
                          <p className="text-lg font-black uppercase tracking-widest">No Active Deployments</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* ── Operational Secondary Stats & Actions (Right: 1/3) ── */}
        <div className="space-y-8">
          
          {/* Secondary Stats */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: "Lectures Archive", val: stats.totalLectures, icon: Video, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Assessment Modules", val: stats.totalTestSessions, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" }
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white p-6 rounded-[1.75rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", s.bg)}>
                    <s.icon className={cn("w-6 h-6", s.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-none">{s.val}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tactical Operations */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-400" />
              Tactical Hub
            </h2>
            <div className="space-y-3">
              {[
                { label: "Initialize New Batch", icon: Layout, path: "/admin/batches", color: "bg-blue-500" },
                { label: "Global Content Sync", icon: BookOpen, path: "/admin/content", color: "bg-emerald-500" },
                { label: "Intelligence Roster", icon: Users, path: "/admin/students", color: "bg-violet-500" },
              ].map((a, i) => (
                <motion.button
                  key={a.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(a.path)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", a.color)}>
                    <a.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    {a.label}
                  </span>
                </motion.button>
              ))}
            </div>
            
            <div className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-primary-foreground/80" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">System Assistance</p>
              </div>
              <p className="text-xs font-medium text-blue-100/60 leading-relaxed mb-4 italic">
                "Neural core is synchronizing platform data. Real-time updates are propagated every 30 seconds."
              </p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ x: ["-100%", "200%"] }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-1/3 h-full bg-blue-400 blur-[2px]" 
                />
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
