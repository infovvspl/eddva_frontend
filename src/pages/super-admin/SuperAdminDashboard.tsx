import { motion } from "framer-motion";
import {
  Building2, Users, GraduationCap, ChevronRight,
  Plus, Server, Megaphone, BarChart3, Loader2, AlertCircle,
  TrendingUp, Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlatformStats } from "@/hooks/use-stats";
import { useTenants } from "@/hooks/use-tenants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

function StatCard({
  label, value, icon: Icon, color, delay = 0, trend, onClick,
}: {
  label: string; value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string; delay?: number; trend?: string; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300",
        onClick && "cursor-pointer hover:-translate-y-1"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            {trend}
          </span>
        )}
      </div>
      <h4 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h4>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-0.5">{label}</p>
      {onClick && <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />}
    </motion.div>
  );
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: platformStats, isLoading: statsLoading, error: statsError } = usePlatformStats();
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants({ limit: 5 });

  const tenants = (tenantsData as any)?.items || (Array.isArray(tenantsData) ? tenantsData : []);

  const formatCount = (n: number | undefined) => {
    if (n == null) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const metrics = [
    { label: "Partner Institutes", value: statsLoading ? "—" : formatCount(platformStats?.totalTenants), icon: Building2,     color: "bg-indigo-500",  trend: "+12.5%", path: "/super-admin/tenants"     },
    { label: "Active Faculty",     value: "1.2K",                                                         icon: GraduationCap, color: "bg-purple-500",  trend: "+5.2%",  path: "/super-admin/users"        },
    { label: "Global Students",    value: statsLoading ? "—" : formatCount(platformStats?.totalStudents),  icon: Users,         color: "bg-blue-500",    trend: "+18.4%", path: "/super-admin/enrollments"  },
    { label: "Platform Revenue",   value: "₹42.8L",                                                       icon: TrendingUp,    color: "bg-emerald-500", trend: "+22.1%", path: "/super-admin/stats"        },
  ];

  const quickActions = [
    { label: "Add New Institute",    icon: Building2, path: "/super-admin/tenants/new",    color: "bg-indigo-500" },
    { label: "Manage Users",         icon: Users,     path: "/super-admin/users",           color: "bg-purple-500" },
    { label: "Announcements",        icon: Megaphone, path: "/super-admin/announcements",   color: "bg-amber-500"  },
    { label: "Platform Stats",       icon: Server,    path: "/super-admin/stats",           color: "bg-slate-700"  },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              <Activity className="w-3 h-3" /> Real-Time Analytics
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            Welcome,{" "}
            <span className="text-blue-600">{user?.name || "Super Admin"}</span>
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            Managing global edtech infrastructure and institute growth.
          </p>
        </div>
        <button
          onClick={() => navigate("/super-admin/tenants/new")}
          className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-4 h-4" /> Deploy New Institute
        </button>
      </motion.div>

      {/* Error */}
      {statsError && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to load platform stats. Please check your connection.
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            color={m.color}
            trend={m.trend}
            delay={i * 0.08}
            onClick={() => navigate(m.path)}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Institutes table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-lg text-slate-900">Recent Deployments</h3>
              <p className="text-xs font-semibold text-slate-400">Newly onboarded educational partners</p>
            </div>
            <button
              onClick={() => navigate("/super-admin/tenants")}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl border-2 border-slate-100 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all"
            >
              VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Institute</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tenantsLoading ? (
                  <tr>
                    <td colSpan={3} className="py-14 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-14 text-center text-sm font-semibold text-slate-400">
                      No institutes yet. Deploy your first one!
                    </td>
                  </tr>
                ) : tenants.slice(0, 5).map((inst: any, i: number) => (
                  <tr
                    key={inst.id}
                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {(inst.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{inst.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400">{inst.subdomain}.edva.in</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600">
                        {inst.plan || "Starter"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-slate-900">
                        {(inst.studentCount ?? 0).toLocaleString()}
                        <span className="text-slate-400 font-semibold"> / {(inst.maxStudents ?? 500).toLocaleString()}</span>
                      </p>
                      <div className="mt-1.5 h-1.5 w-20 ml-auto bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(((inst.studentCount ?? 0) / (inst.maxStudents ?? 500)) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Control Hub</h4>
            <div className="space-y-2.5">
              {quickActions.map((act) => (
                <button
                  key={act.label}
                  onClick={() => navigate(act.path)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm", act.color)}>
                      <act.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-slate-700 group-hover:text-slate-900 uppercase tracking-tight">
                      {act.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Platform Health</p>
                <p className="text-[10px] font-semibold text-emerald-500">All systems operational</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Institutes",  value: statsLoading ? "—" : String(platformStats?.totalTenants ?? 0), color: "bg-indigo-500" },
                { label: "Students",    value: statsLoading ? "—" : formatCount(platformStats?.totalStudents), color: "bg-blue-500"   },
                { label: "Enrollments", value: statsLoading ? "—" : formatCount(platformStats?.totalEnrollments), color: "bg-emerald-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", row.color)} />
                    <span className="text-xs font-semibold text-slate-500">{row.label}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
