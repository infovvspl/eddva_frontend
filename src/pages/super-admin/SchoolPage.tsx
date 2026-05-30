import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SchoolInstitute {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
};

const SchoolPage = () => {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState<SchoolInstitute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search)       params.set("search", search);
      if (statusFilter) params.set("status", statusFilter.toLowerCase());
      const res = await apiClient.get(`/admin/tenants?${params}`);
      const data = (res.data as any)?.data ?? res.data;
      setInstitutes(data.items ?? data.data ?? []);
      setTotal(data.meta?.total ?? data.total ?? 0);
    } catch {
      toast.error("Failed to load school institutes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, search, statusFilter]);

  const approve = async (id: string) => {
    try {
      await apiClient.patch(`/admin/tenants/${id}`, { status: "active" });
      toast.success("Institute approved");
      load();
    } catch { toast.error("Failed to approve"); }
  };

  const reject = async (id: string) => {
    try {
      await apiClient.patch(`/admin/tenants/${id}`, { status: "suspended" });
      toast.success("Institute suspended");
      load();
    } catch { toast.error("Failed to reject"); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this school institute?")) return;
    try {
      await apiClient.delete(`/admin/tenants/${id}`);
      toast.success("Institute deleted");
      load();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">School Institutes</h1>
            <p className="text-slate-400 text-sm font-semibold mt-1">Manage all registered school tenants</p>
          </div>
          <Button onClick={() => navigate("/super-admin/school/new")} className="flex items-center gap-2 font-bold">
            <Plus className="h-4 w-4 stroke-[3]" /> Register School
          </Button>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
        ) : (
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Institute</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {institutes.map(inst => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/super-admin/school/${inst.id}`)}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{inst.name}</td>
                    <td className="px-4 py-3 text-slate-500">{inst.email}</td>
                    <td className="px-4 py-3 text-slate-500">{inst.city ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[inst.status] ?? ""}`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {inst.status !== "ACTIVE" && (
                          <button onClick={() => approve(inst.id)} title="Approve"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {inst.status !== "SUSPENDED" && (
                          <button onClick={() => reject(inst.id)} title="Suspend"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => remove(inst.id)} title="Delete"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {institutes.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center text-slate-400 font-semibold">No school institutes found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>Showing {institutes.length} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={institutes.length < 15}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolPage;
