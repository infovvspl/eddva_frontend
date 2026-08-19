import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Mail, Phone, Building2, RefreshCw } from 'lucide-react';
import { getLeads, updateLead, type Lead, type LeadStatus, type LeadVertical } from '@/lib/api/leads';

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'];

const statusStyle: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-amber-100 text-amber-700',
  CONVERTED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-500',
};

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [verticalFilter, setVerticalFilter] = useState<LeadVertical | ''>('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeads({
        status: statusFilter || undefined,
        vertical: verticalFilter || undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, verticalFilter, search]);

  useEffect(() => { load(); }, [statusFilter, verticalFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (lead: Lead, status: LeadStatus) => {
    const prev = lead.status;
    setItems((list) => list.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try {
      await updateLead(lead.id, { status });
    } catch (e: any) {
      setItems((list) => list.map((l) => (l.id === lead.id ? { ...l, status: prev } : l)));
      toast.error('Could not update status');
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Leads</h1>
          <p className="text-sm text-slate-500">Demo requests from the marketing site · {total} total</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search name, email, org…"
            className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={verticalFilter} onChange={(e) => setVerticalFilter(e.target.value as any)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          <option value="">All verticals</option>
          <option value="SCHOOL">School</option>
          <option value="COACHING">Coaching</option>
        </select>
      </div>

      {loading ? (
        <div className="grid h-64 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : items.length === 0 ? (
        <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-slate-200 text-slate-400 dark:border-slate-700">No leads yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((l) => (
            <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{l.name}</h3>
                    {l.vertical && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800">{l.vertical}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusStyle[l.status]}`}>{l.status}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-blue-600"><Mail className="h-3.5 w-3.5" /> {l.email}</a>
                    {l.phone && <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 hover:text-blue-600"><Phone className="h-3.5 w-3.5" /> {l.phone}</a>}
                    {l.organization && <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {l.organization}{l.role ? ` · ${l.role}` : ''}</span>}
                    <span>{new Date(l.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {l.interestedFeature && <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300"><b>Interested in:</b> {l.interestedFeature}</p>}
                  {l.message && <p className="mt-1 max-w-2xl text-xs text-slate-600 dark:text-slate-300">{l.message}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(l, s)}
                      disabled={l.status === s}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${l.status === s ? statusStyle[s] : 'border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}
                    >
                      {s === 'NEW' ? 'New' : s === 'CONTACTED' ? 'Contacted' : s === 'CONVERTED' ? 'Converted' : 'Closed'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
