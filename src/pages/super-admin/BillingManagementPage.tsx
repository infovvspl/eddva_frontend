import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Users, Edit2, LogIn, Loader2, X, Save, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { tokenStorage } from '@/lib/api/client';
import { useNavigate } from 'react-router-dom';

function extract<T>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

const PLAN_PRICES: Record<string, number> = {
  STARTER: 4999, GROWTH: 14999, SCALE: 34999, ENTERPRISE: 99999, PLATFORM: 0,
};
const PLANS = Object.keys(PLAN_PRICES);

async function getTenants() {
  const r = await apiClient.get('/admin/tenants?limit=200');
  return extract<any>(r);
}

async function updateSubscription(id: string, body: any) {
  const r = await apiClient.patch(`/admin/tenants/${id}/subscription`, body);
  return extract<any>(r);
}

async function impersonate(id: string) {
  const r = await apiClient.post(`/admin/tenants/${id}/impersonate`, {});
  return extract<any>(r);
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    STARTER: 'bg-slate-100 text-slate-600',
    GROWTH: 'bg-indigo-100 text-indigo-700',
    SCALE: 'bg-amber-100 text-amber-700',
    ENTERPRISE: 'bg-purple-100 text-purple-700',
    PLATFORM: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[plan] ?? 'bg-slate-100 text-slate-500'}`}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trial: 'bg-blue-100 text-blue-700',
    suspended: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

function EditModal({ tenant, onClose }: { tenant: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    plan: tenant.plan || 'STARTER',
    status: tenant.status || 'active',
    trialEndsAt: tenant.trialEndsAt ? tenant.trialEndsAt.slice(0, 10) : '',
    planExpiresAt: tenant.planExpiresAt ? tenant.planExpiresAt.slice(0, 10) : '',
    maxStudents: String(tenant.maxStudents ?? 100),
    maxTeachers: String(tenant.maxTeachers ?? 10),
  });

  const mut = useMutation({
    mutationFn: (body: any) => updateSubscription(tenant.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-tenants'] });
      onClose();
    },
  });

  function save() {
    mut.mutate({
      plan: form.plan,
      status: form.status,
      trialEndsAt: form.trialEndsAt || null,
      planExpiresAt: form.planExpiresAt || null,
      maxStudents: parseInt(form.maxStudents),
      maxTeachers: parseInt(form.maxTeachers),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-900 text-lg">Edit Subscription</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-6">{tenant.name}</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Plan</label>
            <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
              {PLANS.map(p => <option key={p} value={p}>{p} — ₹{PLAN_PRICES[p].toLocaleString()}/mo</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Trial Ends</label>
              <input type="date" value={form.trialEndsAt} onChange={e => setForm(f => ({ ...f, trialEndsAt: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Plan Expires</label>
              <input type="date" value={form.planExpiresAt} onChange={e => setForm(f => ({ ...f, planExpiresAt: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Max Students</label>
              <input type="number" value={form.maxStudents} onChange={e => setForm(f => ({ ...f, maxStudents: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Max Teachers</label>
              <input type="number" value={form.maxTeachers} onChange={e => setForm(f => ({ ...f, maxTeachers: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>
        </div>

        {mut.isError && (
          <p className="mt-4 text-xs text-red-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Failed to update. Please try again.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={save} disabled={mut.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function BillingManagementPage() {
  const navigate = useNavigate();
  const [editTenant, setEditTenant] = useState<any>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['billing-tenants'],
    queryFn: getTenants,
    refetchInterval: 60_000,
  });

  const tenants: any[] = Array.isArray(data) ? data : (data?.items ?? data?.tenants ?? []);

  async function handleImpersonate(tenant: any) {
    setImpersonating(tenant.id);
    try {
      const result = await impersonate(tenant.id);
      if (result?.token) {
        tokenStorage.setToken(result.token);
        navigate('/admin');
      }
    } catch {
      alert('Failed to impersonate tenant');
    } finally {
      setImpersonating(null);
    }
  }

  function daysLeft(dateStr: string | null) {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
    return diff;
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <header className="mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Coaching Platform</h2>
        <h1 className="text-[28px] md:text-[36px] font-bold text-slate-900 tracking-tight">Billing & Subscriptions</h1>
        <p className="text-slate-400 text-sm mt-1">Manage plans, trial periods, seat limits, and impersonate tenants</p>
      </header>

      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Institute', 'Plan', 'Status', 'Trial Ends', 'Plan Expires', 'Students', 'Teachers', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-300" /></td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-slate-400">No tenants found</td></tr>
              ) : (
                tenants.map((t, i) => {
                  const trialLeft = daysLeft(t.trialEndsAt);
                  const planLeft = daysLeft(t.planExpiresAt);
                  const isExpiringSoon = (trialLeft !== null && trialLeft <= 7 && trialLeft >= 0) || (planLeft !== null && planLeft <= 7 && planLeft >= 0);
                  return (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className={`border-b border-slate-50 last:border-0 ${isExpiringSoon ? 'bg-amber-50/30' : i % 2 !== 0 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px] truncate whitespace-nowrap">
                        {isExpiringSoon && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline mr-1.5 mb-0.5" />}
                        {t.name}
                      </td>
                      <td className="px-4 py-3"><PlanBadge plan={t.plan} /></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {t.trialEndsAt ? (
                          <span className={trialLeft !== null && trialLeft <= 3 ? 'text-red-500 font-semibold' : 'text-slate-500'}>
                            {new Date(t.trialEndsAt).toLocaleDateString()}
                            {trialLeft !== null && <span className="ml-1 text-[10px]">({trialLeft}d)</span>}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {t.planExpiresAt ? (
                          <span className={planLeft !== null && planLeft <= 7 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                            {new Date(t.planExpiresAt).toLocaleDateString()}
                            {planLeft !== null && <span className="ml-1 text-[10px]">({planLeft}d)</span>}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.maxStudents ?? '∞'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.maxTeachers ?? '∞'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditTenant(t)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition">
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleImpersonate(t)} disabled={impersonating === t.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition disabled:opacity-50">
                            {impersonating === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />}
                            Login As
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editTenant && <EditModal tenant={editTenant} onClose={() => setEditTenant(null)} />}
      </AnimatePresence>
    </div>
  );
}
