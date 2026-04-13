import { motion } from "framer-motion";
import { Building2, Users, DollarSign, ArrowUpRight, ChevronRight, Zap, Loader2, AlertCircle, GraduationCap, Plus, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePlatformStats } from "@/hooks/use-stats";
import { useTenants } from "@/hooks/use-tenants";

const statusStyles = {
  active: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  trial: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  suspended: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { data: platformStats, isLoading: statsLoading, error: statsError } = usePlatformStats();
  const { data: tenantsData, isLoading: tenantsLoading, error: tenantsError } = useTenants({ limit: 5 });

  const tenants = (tenantsData as any)?.items || (Array.isArray(tenantsData) ? tenantsData : []);

  const formatCount = (n: number | undefined) => {
    if (n == null) return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const topMetrics = [
    { label: "Partner Institutes", value: platformStats?.totalTenants ?? 0, trend: "+12.5%", icon: Building2, color: "indigo" },
    { label: "Active Faculty",    value: "1.2K", trend: "+5.2%",  icon: GraduationCap, color: "purple" },
    { label: "Global Students",  value: formatCount(platformStats?.totalStudents), trend: "+18.4%", icon: Users, color: "sky" },
    { label: "Platform Revenue", value: "₹42.8L", trend: "+22.1%", icon: DollarSign, color: "emerald" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto p-4 md:p-10 space-y-10 font-sans text-slate-900 bg-white min-h-[90vh]"
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="h-5 w-5 text-white fill-current" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600">Platform Governance</span>
          </div>
          <h1 className="text-[42px] font-black tracking-tight text-slate-900 leading-tight">Master Ecosystem</h1>
          <p className="text-[17px] font-semibold text-slate-400 mt-1 max-w-xl">
            Managing global edtech infrastructure, billing integrity, and institute growth.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-100 font-black text-slate-600 hover:bg-slate-50 transition-all text-[15px]">
            Platform Logs
          </Button>
          <Button
            onClick={() => navigate("/super-admin/tenants/new")}
            className="h-14 px-10 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-black shadow-2xl transition-all text-[15px] flex gap-2"
          >
            <Plus className="w-5 h-5" /> Deploy New Institute
          </Button>
        </div>
      </header>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topMetrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[36px] bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform">
              <m.icon className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                  <m.icon className="h-6 w-6" />
                </div>
                <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  {m.trend}
                </div>
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{m.label}</p>
              <h3 className="text-[32px] font-black text-slate-900 tracking-tight">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-gray-600" /> : m.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Error state */}
      {statsError && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          Failed to load platform stats. Please check your connection.
        </div>
      )}

      {/* Hierarchy Hub & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Hierarchy Card */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-10 rounded-[44px] bg-white text-gray-900 relative overflow-hidden shadow-2xl shadow-slate-900/20"
          >
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-8">Hierarchy Intelligence</h3>
              <div className="grid grid-cols-3 gap-10">
                <div className="space-y-3">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[60%]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Institutes</p>
                  <p className="text-3xl font-black">{platformStats?.totalTenants ?? "0"}</p>
                </div>
                <div className="space-y-3">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[45%]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Faculty</p>
                  <p className="text-3xl font-black">1,248</p>
                </div>
                <div className="space-y-3">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[82%]" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Learners</p>
                  <p className="text-3xl font-black">{formatCount(platformStats?.totalStudents)}</p>
                </div>
              </div>
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-gray-100 flex items-center justify-center text-[10px] font-black">
                      INST
                    </div>
                  ))}
                </div>
                <p className="text-[13px] font-bold text-white/60 souligne decoration-indigo-500/50 underline-offset-4 decoration-2">
                  Top performing organizations managed by Governance Core.
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-[-10%] h-full w-[40%] bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
          </motion.div>

          <section className="bg-white rounded-[44px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 md:px-10 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-[22px] text-slate-900">Recent Deployments</h3>
                <p className="text-sm font-semibold text-slate-400">Newly onboarded educational partners.</p>
              </div>
              <button
                onClick={() => navigate("/super-admin/tenants")}
                className="h-11 px-5 rounded-2xl border-2 border-slate-100 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                VIEW ALL DIRECTORY <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Institute</th>
                    <th className="px-10 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                    <th className="px-10 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenantsLoading ? (
                    <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-800" /></td></tr>
                  ) : tenants.slice(0, 4).map((inst: any) => (
                    <tr key={inst.id} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {inst.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{inst.name}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{inst.subdomain}.edva.in</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600">
                          {inst.plan || "Growth"}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <p className="text-sm font-black text-slate-900">{(inst.studentCount ?? 0).toLocaleString()} <span className="text-gray-600">/ {(inst.maxStudents ?? 500).toLocaleString()}</span></p>
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(((inst.studentCount ?? 0) / (inst.maxStudents ?? 500)) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Action Sidebar / Hub */}
        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-[44px] border border-slate-100">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 ml-2">Control Hub</h4>
            <div className="space-y-3">
              {[
                { label: "Add New Institute", icon: Building2, path: "/super-admin/tenants/new", color: "bg-indigo-600" },
                { label: "Manage Platform Users", icon: Users, path: "/super-admin/users", color: "bg-purple-600" },
                { label: "Global Announcements", icon: Zap, path: "/super-admin/announcements", color: "bg-emerald-600" },
                { label: "System Health & API", icon: Server, path: "/super-admin/stats", color: "bg-white" },
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={() => navigate(act.path)}
                  className="w-full flex items-center justify-between p-5 rounded-[24px] bg-white border border-slate-100 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-white ${act.color} shadow-lg shadow-current/20`}>
                      <act.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[13px] font-black text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{act.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-800 group-hover:text-indigo-500 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-[44px] border-2 border-indigo-50 bg-white relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">Governance Note</h4>
              <p className="text-[14px] font-semibold text-slate-600 leading-relaxed italic">
                "Growth is not just about numbers, but the stability of the foundation." 
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-gray-900">SA</div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Platform Core Admin</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default SuperAdminDashboard;
