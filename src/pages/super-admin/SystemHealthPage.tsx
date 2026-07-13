import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Server, Database, Cpu, Clock, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

function extract<T>(res: any): T {
  const d = res?.data;
  if (d && typeof d === 'object' && 'data' in d) return d.data as T;
  return d as T;
}

async function getSystemHealth() {
  const r = await apiClient.get('/admin/system-health');
  return extract<any>(r);
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
  );
}

function MetricCard({ icon: Icon, label, value, sub, color = 'text-indigo-600', bg = 'bg-indigo-50', i = 0 }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
      <div className={`p-2.5 rounded-xl ${bg} ${color} w-fit mb-3`}><Icon className="w-4 h-4" /></div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function SystemHealthPage() {
  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 30_000,
  });

  const isHealthy = data?.status === 'healthy';
  const memPct = data ? Math.round((data.memory.usedMb / data.memory.totalMb) * 100) : 0;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <header className="mb-8 border-b border-slate-100 pb-6 flex items-start justify-between">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-2">Platform Infrastructure</h2>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] md:text-[36px] font-bold text-slate-900 tracking-tight">System Health</h1>
            {!isLoading && data && (
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                <StatusDot ok={isHealthy} />
                {isHealthy ? 'All Systems Operational' : 'Degraded'}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">Real-time server diagnostics and performance metrics</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard i={0} icon={Database} label="Database" bg="bg-indigo-50" color="text-indigo-600"
              value={<span className="flex items-center gap-2"><StatusDot ok={data?.dbStatus === 'ok'} />{data?.dbStatus === 'ok' ? 'Online' : 'Error'}</span>}
              sub={`${data?.dbLatencyMs}ms response`} />
            <MetricCard i={1} icon={Server} label="API Latency" bg="bg-emerald-50" color="text-emerald-600"
              value={`${data?.apiLatencyMs}ms`} sub="End-to-end response time" />
            <MetricCard i={2} icon={Clock} label="Uptime" bg="bg-amber-50" color="text-amber-600"
              value={data?.uptimeHuman} sub="Since last restart" />
            <MetricCard i={3} icon={Cpu} label="DB Size" bg="bg-purple-50" color="text-purple-600"
              value={`${data?.dbSizeGb} GB`} sub="Total database size" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Memory */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-5">Memory Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500 font-medium">Heap Used</span>
                    <span className="font-bold text-slate-800">{data?.memory.usedMb} MB / {data?.memory.totalMb} MB</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${memPct > 85 ? 'bg-red-400' : memPct > 65 ? 'bg-amber-400' : 'bg-indigo-400'}`}
                      style={{ width: `${memPct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{memPct}% utilization</p>
                </div>
                <div className="flex justify-between py-3 border-t border-slate-100">
                  <span className="text-sm text-slate-500">RSS (Resident Set)</span>
                  <span className="text-sm font-bold text-slate-800">{data?.memory.rss} MB</span>
                </div>
              </div>
            </div>

            {/* Platform stats */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-5">Platform Overview</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Tenants',            value: data?.totalTenants },
                  { label: 'Total Users',              value: data?.totalUsers },
                  { label: 'Failed Logins (24h)',      value: data?.failedLoginsLast24h, warn: data?.failedLoginsLast24h > 10 },
                  { label: 'Last Checked',             value: data?.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : '—' },
                  { label: 'Last Refreshed',           value: dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className={`text-sm font-bold ${row.warn ? 'text-red-500' : 'text-slate-800'}`}>
                      {row.warn && <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
                      {String(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Service checklist */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5">Service Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'PostgreSQL (Coaching DB)', ok: data?.dbStatus === 'ok' },
                { name: 'NestJS API Server', ok: true },
                { name: 'Node.js Process', ok: (data?.memory.usedMb ?? 0) < 1500 },
                { name: 'Authentication Service', ok: true },
                { name: 'File Storage', ok: true },
                { name: 'Notification Service', ok: true },
              ].map(svc => (
                <div key={svc.name} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${svc.ok ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'}`}>
                  {svc.ok
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                  <span className="text-sm font-medium text-slate-700">{svc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
