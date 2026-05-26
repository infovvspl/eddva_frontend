import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
};

const SchoolDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [institute, setInstitute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/super-admin/school/institutes/${id}`);
      const data = (res.data as any)?.data ?? res.data;
      setInstitute(data);
    } catch {
      toast.error("Failed to load institute details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const approve = async () => {
    try {
      await apiClient.put(`/super-admin/school/institutes/${id}/approve`);
      toast.success("Institute approved");
      load();
    } catch { toast.error("Failed to approve"); }
  };

  const reject = async () => {
    try {
      await apiClient.put(`/super-admin/school/institutes/${id}/reject`);
      toast.success("Institute suspended");
      load();
    } catch { toast.error("Failed to suspend"); }
  };

  const remove = async () => {
    if (!confirm("Delete this school institute? This action cannot be undone.")) return;
    try {
      await apiClient.delete(`/super-admin/school/institutes/${id}`);
      toast.success("Institute deleted");
      navigate("/super-admin/school");
    } catch { toast.error("Failed to delete"); }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  if (!institute) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400 font-semibold">Institute not found.</div>;
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/super-admin/school")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to School Institutes
        </button>

        <div className="rounded-2xl border border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{institute.name}</h1>
              <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[institute.status] ?? ""}`}>
                {institute.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {institute.status !== "ACTIVE" && (
                <button onClick={approve}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors">
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
              )}
              {institute.status !== "SUSPENDED" && (
                <button onClick={reject}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 transition-colors">
                  <XCircle className="h-4 w-4" /> Suspend
                </button>
              )}
              <button onClick={remove}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-sm hover:bg-rose-100 transition-colors">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["Email",         institute.email],
              ["Phone",         institute.phone ?? "—"],
              ["Address",       institute.address ?? "—"],
              ["City",          institute.city ?? "—"],
              ["State",         institute.state ?? "—"],
              ["Pincode",       institute.pin_code ?? "—"],
              ["Website",       institute.website ?? "—"],
              ["Tenant Domain", institute.tenant_domain ?? "—"],
              ["Registered",    institute.created_at ? new Date(institute.created_at).toLocaleDateString() : "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-900 break-all">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailPage;
