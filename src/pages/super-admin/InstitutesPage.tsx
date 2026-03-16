import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, Plus, Building2, MoreHorizontal, Eye, Ban, ArrowUpCircle, 
  Trash2, Filter, ChevronLeft, ChevronRight, Users, Calendar, Globe,
  ShieldAlert, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";

const InstitutesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const perPage = 8;

  // Your original data array
  const allInstitutes = [
    { id: "1", name: "Elite IIT Academy", subdomain: "elite-iit", plan: "Scale", students: 1284, studentLimit: 2000, teachers: 24, status: "active" as const, joined: "2024-12-15" },
    { id: "2", name: "MedPrep Institute", subdomain: "medprep", plan: "Growth", students: 856, studentLimit: 1000, teachers: 16, status: "active" as const, joined: "2025-01-08" },
    { id: "3", name: "Quantum Coaching", subdomain: "quantum", plan: "Starter", students: 234, studentLimit: 500, teachers: 8, status: "trial" as const, joined: "2025-02-20" },
    { id: "4", name: "Apex Science Hub", subdomain: "apex-sci", plan: "Growth", students: 0, studentLimit: 1000, teachers: 5, status: "suspended" as const, joined: "2024-11-03" },
    { id: "5", name: "Pinnacle JEE Center", subdomain: "pinnacle", plan: "Enterprise", students: 3420, studentLimit: 5000, teachers: 45, status: "active" as const, joined: "2024-08-12" },
    // ... items continue per your list
  ];

  const planStyles: Record<string, string> = {
    Starter: "bg-slate-100 text-slate-600 border-slate-200",
    Growth: "bg-sky-50 text-sky-600 border-sky-100",
    Scale: "bg-indigo-50 text-indigo-600 border-indigo-100",
    Enterprise: "bg-purple-50 text-purple-600 border-purple-100",
  };

  const statusStyles = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    trial: "bg-amber-50 text-amber-600 border-amber-100",
    suspended: "bg-rose-50 text-rose-600 border-rose-100",
  };

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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Institutes</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Manage and monitor {allInstitutes.length} educational partners</p>
          </div>
          <Button 
            onClick={() => navigate("/super-admin/tenants/new")}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-[18px] h-12 px-6 shadow-xl shadow-slate-200 transition-all font-bold flex gap-2"
          >
            <Plus className="w-5 h-5" /> New Institute
          </Button>
        </header>

        {/* Filters Bento Box */}
        <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or subdomain..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-12 pl-11 pr-4 bg-slate-50/50 border border-slate-100 rounded-[18px] text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-200 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
              className="h-12 px-4 bg-slate-50/50 border border-slate-100 rounded-[18px] text-sm font-bold text-slate-600 outline-none hover:bg-white transition-all cursor-pointer"
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
              className="h-12 px-4 bg-slate-50/50 border border-slate-100 rounded-[18px] text-sm font-bold text-slate-600 outline-none hover:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <motion.div 
          layout
          className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Institute</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subdomain</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Capacity</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {paginated.map((inst) => (
                    <motion.tr
                      key={inst.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {inst.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{inst.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">Joined {new Date(inst.joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-semibold text-slate-500 italic">
                        {inst.subdomain}.apexiq.in
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${planStyles[inst.plan]}`}>
                          {inst.plan}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1.5 w-32">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>{inst.students.toLocaleString()}</span>
                            <span className="text-slate-300">/ {inst.studentLimit.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${(inst.students / inst.studentLimit) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit px-3 py-1 rounded-full border ${statusStyles[inst.status]}`}>
                          <div className={`w-1 h-1 rounded-full bg-current`} />
                          {inst.status}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === inst.id ? null : inst.id); }}
                          className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-indigo-600"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Polished Pagination */}
          <div className="px-8 py-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-900">{((page - 1) * perPage) + 1}</span> to <span className="text-slate-900">{Math.min(page * perPage, filtered.length)}</span> of {filtered.length}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      p === page ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InstitutesPage;