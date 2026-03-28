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
    starter: "bg-secondary text-muted-foreground border-border",
    growth: "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    scale: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    enterprise: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    STARTER: "bg-secondary text-muted-foreground border-border",
    GROWTH: "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    SCALE: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    ENTERPRISE: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  };

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    trial: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    suspended: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans text-foreground">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Institutes</h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium">Manage and monitor educational partners</p>
          </div>
          <Button
            onClick={() => navigate("/super-admin/tenants/new")}
            className="bg-foreground hover:bg-foreground/90 text-background rounded-[18px] h-12 px-6 shadow-xl transition-all font-bold flex gap-2"
          >
            <Plus className="w-5 h-5" /> New Institute
          </Button>
        </header>

        {/* Filters */}
        <div className="bg-card p-4 rounded-[28px] border border-border shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or subdomain..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-12 pl-11 pr-4 bg-secondary/50 border border-border rounded-[18px] text-sm text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
              className="h-12 px-4 bg-secondary/50 border border-border rounded-[18px] text-sm font-bold text-foreground outline-none hover:bg-background transition-all cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="STARTER">Starter</option>
              <option value="GROWTH">Growth</option>
              <option value="SCALE">Scale</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-12 px-4 bg-secondary/50 border border-border rounded-[18px] text-sm font-bold text-foreground outline-none hover:bg-background transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <motion.div layout className="bg-card rounded-[32px] border border-border shadow-sm overflow-hidden">
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
                          className="group hover:bg-secondary/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                {(inst.name || "?")[0]}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground leading-tight">{inst.name}</p>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                  {inst.createdAt ? `Joined ${new Date(inst.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm font-semibold text-muted-foreground italic">
                            {inst.subdomain}.edva.in
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${planStyles[plan] || planStyles.growth}`}>
                              {plan}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1.5 w-32">
                              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                <span>{students.toLocaleString()}</span>
                                <span className="opacity-50">/ {limit.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((students / limit) * 100, 100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit px-3 py-1 rounded-full border ${statusStyles[status] || statusStyles.active}`}>
                              <div className="w-1 h-1 rounded-full bg-current" />
                              {status}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 hover:bg-secondary hover:shadow-sm rounded-xl transition-all text-muted-foreground hover:text-primary"
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
