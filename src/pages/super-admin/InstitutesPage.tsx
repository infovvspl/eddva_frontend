import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenants } from "@/hooks/use-tenants";

const InstitutesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const { data: tenantsData, isLoading, error } = useTenants({
    search: search || undefined,
    plan: planFilter !== "all" ? planFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit: perPage,
  });

  const allInstitutes = (tenantsData as any)?.items || (Array.isArray(tenantsData) ? tenantsData : []);
  const totalCount = (tenantsData as any)?.meta?.total || allInstitutes.length;
  const totalPages = (tenantsData as any)?.meta?.totalPages || Math.max(1, Math.ceil(totalCount / perPage));

  const planStyles: Record<string, string> = {
    starter: "bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    growth: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    scale: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    enterprise: "bg-slate-900 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-slate-100",
    STARTER: "bg-slate-50 text-slate-500 border-slate-100",
    GROWTH: "bg-indigo-50 text-indigo-600 border-indigo-100",
    SCALE: "bg-purple-50 text-purple-600 border-purple-100",
    ENTERPRISE: "bg-slate-900 text-white border-slate-800",
  };

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.05)]",
    trial: "bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.05)]",
    suspended: "bg-rose-50 text-rose-600 border-rose-100 shadow-[0_0_12px_rgba(225,29,72,0.05)]",
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 border-b border-slate-100 pb-10">
          <div>
            <h1 className="text-[42px] font-black text-slate-900 tracking-tight leading-tight">Institute Directory</h1>
            <p className="text-slate-400 text-[17px] mt-1 font-semibold uppercase tracking-tight">Active Governance & Compliance Monitoring</p>
          </div>
          <Button
            onClick={() => navigate("/super-admin/tenants/new")}
            className="h-14 px-10 rounded-[20px] bg-slate-900 hover:bg-slate-800 text-white font-black shadow-2xl transition-all text-[15px] flex gap-2"
          >
            <Plus className="w-5 h-5 stroke-[3]" /> Deploy New Institute
          </Button>
        </header>

        {/* Filters */}
        <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 mb-8 flex flex-wrap items-center gap-6">
          <div className="relative flex-1 min-w-[320px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              placeholder="Search by organization name or subdomain..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-[20px] text-[15px] font-semibold text-slate-800 placeholder:text-slate-300 focus:border-indigo-500/30 focus:shadow-xl focus:shadow-indigo-500/5 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
              className="h-14 px-6 bg-white border border-slate-100 rounded-[20px] text-[14px] font-black text-slate-600 outline-none hover:bg-slate-50 transition-all cursor-pointer shadow-sm uppercase tracking-tight"
            >
              <option value="all">Global Pricing</option>
              <option value="STARTER">Starter Tier</option>
              <option value="GROWTH">Growth Hub</option>
              <option value="SCALE">Scale Dynamic</option>
              <option value="ENTERPRISE">Cloud Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-14 px-6 bg-white border border-slate-100 rounded-[20px] text-[14px] font-black text-slate-600 outline-none hover:bg-slate-50 transition-all cursor-pointer shadow-sm uppercase tracking-tight"
            >
              <option value="all">Platform Status</option>
              <option value="active">Operational</option>
              <option value="trial">Trial Period</option>
              <option value="suspended">Suspended Hub</option>
            </select>
          </div>
        </div>

        {/* Table/List View */}
        <motion.div layout className="bg-white rounded-[44px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                Failed to load institutes. Please try again.
              </div>
            ) : allInstitutes.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                No institutes found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Institute</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Subdomain</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Plan</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Capacity</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence mode="popLayout">
                    {allInstitutes.map((inst: any) => {
                      const students = inst.studentCount ?? 0;
                      const limit = inst.studentLimit ?? inst.maxStudents ?? 500;
                      const status = inst.status || "active";
                      const plan = inst.plan || "growth";
                      return (
                        <motion.tr
                          key={inst.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
                        >
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-[18px] bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                {(inst.name || "?")[0]}
                              </div>
                              <div>
                                <p className="text-[15px] font-black text-slate-900 leading-tight mb-1">{inst.name}</p>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                  {inst.createdAt ? `Partnered ${new Date(inst.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : "Onboarding"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-[13px] font-black text-slate-400 tracking-tight">
                            {inst.subdomain}<span className="opacity-40">.edva.in</span>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border ${planStyles[plan] || planStyles.growth}`}>
                              {plan}
                            </span>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex flex-col gap-2 w-40">
                              <div className="flex justify-between text-[11px] font-black text-slate-900 tracking-tight">
                                <span>{students.toLocaleString()}</span>
                                <span className="text-slate-300">/ {limit.toLocaleString()}</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }} 
                                  animate={{ width: `${Math.min((students / limit) * 100, 100)}%` }} 
                                  className={`h-full rounded-full ${students/limit > 0.9 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <div className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 w-fit px-4 py-1.5 rounded-full border shadow-sm ${statusStyles[status] || statusStyles.active}`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-current" />
                              {status === 'active' ? 'Operational' : status === 'trial' ? 'Trial Hub' : 'Suspended'}
                            </div>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-3 bg-white border border-slate-100 hover:border-indigo-500/30 hover:shadow-lg rounded-[14px] transition-all text-slate-300 hover:text-indigo-600"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && allInstitutes.length > 0 && (
            <div className="px-8 py-6 bg-secondary/30 flex items-center justify-between border-t border-border">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Showing <span className="text-foreground">{(page - 1) * perPage + 1}</span> to{" "}
                <span className="text-foreground">{Math.min(page * perPage, totalCount)}</span> of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-primary disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border shadow-sm">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        p === page ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-primary disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default InstitutesPage;
