import { motion } from "framer-motion";
import { Building2, Users, DollarSign, ArrowUpRight, ChevronRight, Zap, Loader2, AlertCircle } from "lucide-react";
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
    if (n == null) return "—";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const stats = [
    { label: "Total Institutes", value: platformStats?.totalTenants ?? platformStats?.totalInstitutes ?? "—", trend: 12, icon: Building2, color: "indigo" },
    { label: "Active Institutes", value: platformStats?.activeTenants ?? platformStats?.activeInstitutes ?? "—", trend: 5, icon: Building2, color: "emerald" },
    { label: "Total Students", value: formatCount(platformStats?.totalStudents), trend: 18, icon: Users, color: "sky" },
    { label: "Platform MRR", value: platformStats?.mrrEstimate != null ? `₹${(platformStats.mrrEstimate / 100000).toFixed(1)}L` : platformStats?.platformMrr != null ? `₹${(platformStats.platformMrr / 100000).toFixed(1)}L` : "—", trend: 22, icon: DollarSign, color: "amber" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 font-sans"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Super Admin</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Managing the EDVA ecosystem and institute growth.</p>
        </div>
        <Button
          onClick={() => navigate("/super-admin/tenants/new")}
          className="bg-foreground hover:bg-foreground/90 text-background rounded-2xl h-12 px-6 shadow-xl transition-all font-bold"
        >
          Add New Institute
        </Button>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card p-6 rounded-[32px] border border-border shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-secondary rounded-full group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-secondary text-muted-foreground">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  {s.trend}%
                </div>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {statsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : String(s.value)}
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

      {/* Recent Institutes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden"
      >
        <div className="p-6 md:px-8 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground text-lg">Recent Institutes</h3>
          <button
            onClick={() => navigate("/super-admin/tenants")}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:gap-2 transition-all"
          >
            VIEW ALL <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {tenantsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tenantsError ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Failed to load institutes.
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              No institutes found. Create your first institute to get started.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Institute</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Subdomain</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Plan</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Students</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((inst: any) => {
                  const status = (inst.status || "active") as keyof typeof statusStyles;
                  return (
                    <tr
                      key={inst.id}
                      className="group hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
                    >
                      <td className="px-8 py-5 font-bold text-foreground text-sm">{inst.name}</td>
                      <td className="px-8 py-5 text-muted-foreground font-medium text-sm">
                        <span className="bg-secondary px-2 py-1 rounded text-xs">{inst.subdomain}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-foreground font-semibold text-sm capitalize">{inst.plan}</span>
                      </td>
                      <td className="px-8 py-5 text-foreground font-bold text-sm">
                        {(inst.studentCount ?? inst.maxStudents ?? 0).toLocaleString()}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusStyles[status] || statusStyles.active}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuperAdminDashboard;
