import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, Plus, Building2, MoreHorizontal, Eye, Ban, ArrowUpCircle, 
  Trash2, Filter, ChevronLeft, ChevronRight, Users, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

const allInstitutes = [
  { id: "1", name: "Elite IIT Academy", subdomain: "elite-iit", plan: "Scale", students: 1284, studentLimit: 2000, teachers: 24, status: "active" as const, joined: "2024-12-15", billingEmail: "admin@eliteiit.com" },
  { id: "2", name: "MedPrep Institute", subdomain: "medprep", plan: "Growth", students: 856, studentLimit: 1000, teachers: 16, status: "active" as const, joined: "2025-01-08", billingEmail: "billing@medprep.in" },
  { id: "3", name: "Quantum Coaching", subdomain: "quantum", plan: "Starter", students: 234, studentLimit: 500, teachers: 8, status: "trial" as const, joined: "2025-02-20", billingEmail: "hello@quantum.edu" },
  { id: "4", name: "Apex Science Hub", subdomain: "apex-sci", plan: "Growth", students: 0, studentLimit: 1000, teachers: 5, status: "suspended" as const, joined: "2024-11-03", billingEmail: "info@apexsci.com" },
  { id: "5", name: "Pinnacle JEE Center", subdomain: "pinnacle", plan: "Enterprise", students: 3420, studentLimit: 5000, teachers: 45, status: "active" as const, joined: "2024-08-12", billingEmail: "admin@pinnacle.in" },
  { id: "6", name: "NeetPro Academy", subdomain: "neetpro", plan: "Growth", students: 678, studentLimit: 1000, teachers: 14, status: "active" as const, joined: "2024-10-28", billingEmail: "contact@neetpro.com" },
  { id: "7", name: "Vedanta Classes", subdomain: "vedanta", plan: "Starter", students: 120, studentLimit: 500, teachers: 6, status: "trial" as const, joined: "2025-03-01", billingEmail: "vedanta@classes.in" },
  { id: "8", name: "Target IIT Mumbai", subdomain: "target-iit", plan: "Scale", students: 1890, studentLimit: 2000, teachers: 32, status: "active" as const, joined: "2024-06-15", billingEmail: "ops@targetiit.com" },
  { id: "9", name: "BioMaster NEET", subdomain: "biomaster", plan: "Growth", students: 445, studentLimit: 1000, teachers: 10, status: "active" as const, joined: "2024-09-22", billingEmail: "admin@biomaster.in" },
  { id: "10", name: "Sigma Prep", subdomain: "sigma-prep", plan: "Starter", students: 89, studentLimit: 500, teachers: 4, status: "suspended" as const, joined: "2024-07-10", billingEmail: "info@sigmaprep.com" },
];

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  trial: "bg-warning/10 text-warning border-warning/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

const planColors: Record<string, string> = {
  Starter: "bg-muted text-muted-foreground",
  Growth: "bg-info/10 text-info border-info/20",
  Scale: "bg-primary/10 text-primary border-primary/20",
  Enterprise: "bg-ai/10 text-ai border-ai/20",
};

const InstitutesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const perPage = 8;

  const filtered = allInstitutes.filter((inst) => {
    const matchSearch = inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.subdomain.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || inst.plan === planFilter;
    const matchStatus = statusFilter === "all" || inst.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="All Institutes"
        subtitle={`${allInstitutes.length} institutes on the platform`}
        actions={
          <Button onClick={() => navigate("/super-admin/tenants/new")}>
            <Plus className="w-4 h-4" /> New Institute
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search institutes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none"
        >
          <option value="all">All Plans</option>
          <option value="Starter">Starter</option>
          <option value="Growth">Growth</option>
          <option value="Scale">Scale</option>
          <option value="Enterprise">Enterprise</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Institute</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Subdomain</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Students</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Teachers</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Joined</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((inst) => (
                <tr
                  key={inst.id}
                  className="border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{inst.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inst.subdomain}.apexiq.in</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${planColors[inst.plan]}`}>
                      {inst.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{inst.students.toLocaleString()}</span>
                      <span className="text-muted-foreground/50">/ {inst.studentLimit.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inst.teachers}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyles[inst.status]}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(inst.joined).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === inst.id ? null : inst.id); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {menuOpen === inst.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-lg z-20 py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/super-admin/tenants/${inst.id}`); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Detail
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                          >
                            <ArrowUpCircle className="w-3.5 h-3.5" /> Upgrade Plan
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning hover:bg-secondary transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InstitutesPage;
