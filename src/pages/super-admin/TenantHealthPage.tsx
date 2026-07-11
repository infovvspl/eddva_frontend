import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, Users, Clock, Loader2, Download } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

function extract<T>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

async function getTenantHealth() {
  const r = await apiClient.get('/admin/tenant-health');
  return extract<any[]>(r);
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    low:    'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high:   'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${map[risk] ?? 'bg-slate-100 text-slate-500'}`}>
      {risk}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-400' : score >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700">{score}</span>
    </div>
  );
}

function QuotaBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-indigo-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500">{used}/{limit}</span>
    </div>
  );
}

function exportCSV(data: any[]) {
  const rows = [
    ['Name', 'Plan', 'Status', 'Health Score', 'Risk', 'Students', 'Max Students', 'Teachers', 'Max Teachers', 'Last Activity', 'Open Tickets'],
    ...data.map(r => [r.name, r.plan, r.status, r.healthScore, r.risk, r.studentCount, r.maxStudents, r.teacherCount, r.maxTeachers, r.lastActivity ?? 'Never', r.openTickets]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv,' + encodeURIComponent(csv);
  a.download = 'tenant-health.csv';
  a.click();
}

export default function TenantHealthPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['tenant-health'], queryFn: getTenantHealth, refetchInterval: 60_000 });

  const high   = data.filter(t => t.risk === 'high').length;
  const medium = data.filter(t => t.risk === 'medium').length;
  const low    = data.filter(t => t.risk === 'low').length;

  const summary = [
    { label: 'Healthy',  value: low,    icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'At Risk',  value: medium, icon: AlertTriangle, color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Critical', value: high,   icon: Activity,      color: 'text-red-600',     bg: 'bg-red-50' },
    { label: 'Total',    value: data.length, icon: Users,    color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <header className="mb-8 border-b border-slate-100 pb-6 flex items-start justify-between">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Coaching Platform</h2>
          <h1 className="text-[28px] md:text-[36px] font-bold text-slate-900 tracking-tight">Tenant Health</h1>
          <p className="text-slate-400 text-sm mt-1">Activity levels, quota usage, and risk scores across all institutes</p>
        </div>
        {data.length > 0 && (
          <button onClick={() => exportCSV(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summary.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
            <div className={`p-2.5 rounded-xl ${s.bg} ${s.color} w-fit mb-3`}><s.icon className="w-4 h-4" /></div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : s.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {['Institute', 'Plan', 'Status', 'Health', 'Risk', 'Students', 'Teachers', 'Last Active', 'Tickets'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-300" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-slate-400 text-sm">No tenants found</td></tr>
              ) : (
                [...data].sort((a, b) => a.healthScore - b.healthScore).map((t, i) => (
                  <tr key={t.id} className={i % 2 === 0 ? '' : 'bg-slate-50/40'}>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate whitespace-nowrap">
                      {!t.onboardingComplete && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 mb-0.5" title="Onboarding incomplete" />}
                      {t.name}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-500 text-xs">{t.plan}</td>
                    <td className="px-4 py-3 capitalize">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        t.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        t.status === 'trial'  ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-600'
                      }`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3"><ScoreBar score={t.healthScore} /></td>
                    <td className="px-4 py-3"><RiskBadge risk={t.risk} /></td>
                    <td className="px-4 py-3"><QuotaBar used={t.studentCount} limit={t.maxStudents} /></td>
                    <td className="px-4 py-3"><QuotaBar used={t.teacherCount} limit={t.maxTeachers} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {t.lastActivity ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.daysSinceActivity === 0 ? 'Today' : `${t.daysSinceActivity}d ago`}
                        </span>
                      ) : <span className="text-red-400">Never</span>}
                    </td>
                    <td className="px-4 py-3">
                      {t.openTickets > 0
                        ? <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{t.openTickets}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
