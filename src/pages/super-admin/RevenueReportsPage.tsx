import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Building2, Users, DollarSign, AlertTriangle, ArrowUpRight, Loader2, Download } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '@/lib/api/client';

function extract<T>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

async function getRevenueDashboard() {
  const r = await apiClient.get('/admin/revenue-dashboard');
  return extract<any>(r);
}

const PLAN_COLORS: Record<string, string> = {
  starter: '#818cf8', growth: '#34d399', scale: '#f59e0b', enterprise: '#f43f5e',
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', growth: 'Growth', scale: 'Scale', enterprise: 'Enterprise',
};

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function exportCSV(data: any) {
  const rows = [
    ['Month', 'New Tenants', 'Plan Revenue'],
    ...(data?.monthlyTrend || []).map((r: any) => [r.month, r.newTenants, r.planRevenue]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv,' + encodeURIComponent(csv);
  a.download = 'revenue-report.csv';
  a.click();
}

export default function RevenueReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['revenue-dashboard'], queryFn: getRevenueDashboard, refetchInterval: 60_000 });

  const kpis = [
    { label: 'MRR', value: data ? fmt(data.mrr) : '—', sub: 'Monthly Recurring', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'ARR', value: data ? fmt(data.arr) : '—', sub: 'Annual Run Rate', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Subscribers', value: data?.activeSubscribers ?? '—', sub: 'Paid tenants', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Trial Tenants', value: data?.trialTenants ?? '—', sub: 'Conversion potential', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <header className="mb-8 border-b border-slate-100 pb-6 flex items-start justify-between">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Coaching Platform</h2>
          <h1 className="text-[28px] md:text-[36px] font-bold text-slate-900 tracking-tight">Revenue Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">MRR, ARR, plan distribution, and expiring subscriptions</p>
        </div>
        <button onClick={() => exportCSV(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm group">
            <div className={`p-3 rounded-2xl ${k.bg} ${k.color} w-fit mb-4`}><k.icon className="w-5 h-5" /></div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : String(k.value)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Course payment summary */}
      {data?.coursePayments && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Course Transactions', value: data.coursePayments.totalTransactions },
            { label: 'Gross Revenue', value: fmt(data.coursePayments.grossRevenue) },
            { label: 'Platform Commission', value: fmt(data.coursePayments.totalCommission) },
            { label: 'Net to Institutes', value: fmt(data.coursePayments.netRevenue) },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly trend */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-5">Monthly Plan Revenue (12 months)</h3>
          {isLoading ? <div className="h-60 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-300" /></div> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.monthlyTrend ?? []} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Revenue']} labelFormatter={l => `Month: ${l}`}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Bar dataKey="planRevenue" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan distribution */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-5">Plan Distribution</h3>
          {isLoading ? <div className="h-60 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-300" /></div> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={data?.planBreakdown?.filter((p: any) => p.count > 0)} dataKey="count" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                    {data?.planBreakdown?.map((p: any) => (
                      <Cell key={p.plan} fill={PLAN_COLORS[p.plan] || '#e2e8f0'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, _: any, props: any) => [v, PLAN_LABELS[props.payload.plan]]}
                    contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {data?.planBreakdown?.map((p: any) => (
                  <div key={p.plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[p.plan] }} />
                      <span className="text-sm font-medium text-slate-700">{PLAN_LABELS[p.plan]}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-800">{p.count}</span>
                      <span className="text-xs text-slate-400 ml-1">tenants</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expiring plans */}
      {(data?.expiringPlans?.length ?? 0) > 0 && (
        <div className="bg-white rounded-[28px] border border-amber-100 shadow-sm mb-8 overflow-hidden">
          <div className="p-5 border-b border-amber-100 flex items-center gap-3 bg-amber-50/60">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900">Expiring Soon ({data.expiringPlans.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50/40">
              {['Institute', 'Plan', 'Status', 'Expiry', 'Days Left'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr></thead>
            <tbody>{data.expiringPlans.map((r: any, i: number) => (
              <tr key={r.id} className={i % 2 === 0 ? '' : 'bg-slate-50/40'}>
                <td className="px-4 py-3 font-medium text-slate-800">{r.name}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{r.plan}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{r.status}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.trialEndsAt || r.planExpiresAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.daysLeft <= 3 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {r.daysLeft}d
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Top tenants by revenue */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-900">Top Tenants by Revenue</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/40">
            {['Institute', 'Plan', 'Monthly Revenue', 'Plan Expiry'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
            ))}
          </tr></thead>
          <tbody>{isLoading ? (
            <tr><td colSpan={4} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-300" /></td></tr>
          ) : (data?.topTenants ?? []).map((t: any, i: number) => (
            <tr key={t.id} className={i % 2 === 0 ? '' : 'bg-slate-50/40'}>
              <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
              <td className="px-4 py-3 capitalize text-slate-600">{t.plan}</td>
              <td className="px-4 py-3 font-semibold text-emerald-600">{fmt(t.monthlyRevenue)}</td>
              <td className="px-4 py-3 text-slate-400 text-xs">{t.planExpiresAt ? new Date(t.planExpiresAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
