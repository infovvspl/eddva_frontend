import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, TrendingUp, BadgePercent, IndianRupee,
  Loader2, AlertCircle, RefreshCcw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, RotateCcw, Save,
} from "lucide-react";
import { apiClient, extractData } from "@/lib/api/client";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PaymentTx {
  id: string;
  batchName: string | null;
  studentName: string | null;
  instituteName: string | null;
  amount: number;
  commissionPercent: number;
  commissionAmount: number;
  netAmount: number;
  razorpayPaymentId: string | null;
  status: "success" | "failed" | "refunded";
  createdAt: string;
}

interface PaymentsResponse {
  data: PaymentTx[];
  pagination: { total: number; page: number; limit: number };
  summary: { totalRevenue: number; totalCommission: number; totalNet: number };
}

interface PlatformConfig {
  commissionPercent: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  success:  { label: "Success",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed:   { label: "Failed",   cls: "bg-red-50 text-red-600 border-red-200",             icon: <XCircle className="w-3 h-3" /> },
  refunded: { label: "Refunded", cls: "bg-amber-50 text-amber-700 border-amber-200",       icon: <RotateCcw className="w-3 h-3" /> },
};

// ─── Commission Editor ─────────────────────────────────────────────────────────

function CommissionEditor({ current, onSaved }: { current: number; onSaved: (v: number) => void }) {
  const [val, setVal] = useState(String(current));
  const [saving, setSaving] = useState(false);

  useEffect(() => setVal(String(current)), [current]);

  const handleSave = async () => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0 || n > 100) {
      toast.error("Commission must be between 0% and 100%");
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch("/admin/platform-config", { commissionPercent: n });
      toast.success(`Platform commission updated to ${n}%`);
      onSaved(n);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update commission");
    } finally {
      setSaving(false);
    }
  };

  const preview = parseFloat(val);
  const institutePct = isNaN(preview) ? null : (100 - preview).toFixed(1);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <BadgePercent className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-foreground">Platform Commission</p>
          <p className="text-xs text-muted-foreground">% of every course sale that goes to the platform</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={val}
            onChange={e => setVal(e.target.value)}
            className="w-full h-11 pl-4 pr-10 rounded-xl border-2 border-border bg-background text-base font-black focus:border-amber-400 outline-none transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      {!isNaN(preview) && preview >= 0 && preview <= 100 && (
        <div className="rounded-xl overflow-hidden border border-slate-100">
          <div className="flex h-2">
            <div className="bg-amber-400 transition-all" style={{ width: `${preview}%` }} />
            <div className="bg-emerald-500 flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform gets</p>
              <p className="text-base font-black text-amber-600">{preview}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institute earns</p>
              <p className="text-base font-black text-emerald-600">{institutePct}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const PaymentsPage = () => {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const fetchConfig = useCallback(async () => {
    try {
      const r = await apiClient.get("/admin/platform-config");
      setConfig(extractData<PlatformConfig>(r));
    } catch { /* non-fatal */ }
  }, []);

  const fetchPayments = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await apiClient.get(`/admin/payments?page=${p}&limit=${LIMIT}`);
      setData(extractData<PaymentsResponse>(r));
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchPayments(page);
  }, [fetchConfig, fetchPayments, page]);

  const totalPages = data ? Math.ceil(data.pagination.total / LIMIT) : 1;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-10 font-sans text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="border-b border-border pb-6">
          <h2 className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Super Admin</h2>
          <h1 className="text-[26px] md:text-[34px] font-bold tracking-tight leading-tight">Payments & Revenue</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all course payments, commissions, and configure revenue splits.</p>
        </header>

        {/* Commission + Stats grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Commission editor */}
          {config && (
            <CommissionEditor
              current={config.commissionPercent}
              onSaved={v => setConfig({ commissionPercent: v })}
            />
          )}

          {/* Summary stats */}
          {[
            {
              label: "Total Revenue",
              value: data ? fmtINR(data.summary.totalRevenue) : "—",
              icon: <IndianRupee className="w-5 h-5 text-indigo-600" />,
              bg: "bg-indigo-50",
              sub: `${data?.pagination.total ?? 0} transactions`,
            },
            {
              label: "Platform Commission",
              value: data ? fmtINR(data.summary.totalCommission) : "—",
              icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
              bg: "bg-amber-50",
              sub: "Your earnings",
            },
            {
              label: "Institute Earnings",
              value: data ? fmtINR(data.summary.totalNet) : "—",
              icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
              bg: "bg-emerald-50",
              sub: "Paid to institutes",
            },
          ].slice(0, 2).map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Third stat row */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Revenue", value: fmtINR(data.summary.totalRevenue), color: "text-indigo-600" },
              { label: "Platform Commission", value: fmtINR(data.summary.totalCommission), color: "text-amber-600" },
              { label: "Institute Earnings", value: fmtINR(data.summary.totalNet), color: "text-emerald-600" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold mb-1">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Transactions table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-bold text-foreground">Transaction History</h2>
            <button
              onClick={() => fetchPayments(page)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <CreditCard className="w-14 h-14 text-muted-foreground/20 mb-4" />
              <p className="font-bold text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Payments will appear here once students purchase paid courses.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Date", "Student", "Course", "Institute", "Amount", "Commission", "Net", "Status", "Payment ID"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-black text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map(tx => {
                      const sm = STATUS_META[tx.status] ?? STATUS_META.success;
                      return (
                        <tr key={tx.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {fmtDate(tx.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {tx.studentName ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-foreground max-w-[180px] truncate">
                            {tx.batchName ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {tx.instituteName ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-black text-foreground whitespace-nowrap">
                            {fmtINR(tx.amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-amber-600 font-bold">{fmtINR(tx.commissionAmount)}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({tx.commissionPercent}%)</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">
                            {fmtINR(tx.netAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${sm.cls}`}>
                              {sm.icon} {sm.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono">
                            {tx.razorpayPaymentId ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages} · {data.pagination.total} transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
