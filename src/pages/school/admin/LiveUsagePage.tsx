import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Radio, Building2, Users, Clock, TrendingUp, Loader2, CheckCircle2, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getSchoolLiveUsage, type LiveUsageData } from '@/lib/api/live-usage-admin';

function fmtDuration(secs: number): string {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    LIVE: { label: 'Live', cls: 'bg-red-100 text-red-600' },
    ENDED: { label: 'Ended', cls: 'bg-slate-100 text-slate-500' },
    PROCESSED: { label: 'Processed', cls: 'bg-emerald-100 text-emerald-600' },
    SCHEDULED: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-600' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {label}
    </span>
  );
}

export default function SchoolLiveUsagePage() {
  const { data, isLoading } = useQuery<LiveUsageData>({
    queryKey: ['school-live-usage'],
    queryFn: getSchoolLiveUsage,
    refetchInterval: 30_000,
  });

  const s = data?.summary;

  const kpis = [
    {
      label: 'Total Classes',
      value: s?.totalLectures ?? '—',
      icon: Radio,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    },
    {
      label: 'Live Right Now',
      value: s?.liveNow ?? '—',
      icon: TrendingUp,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-500/10',
    },
    {
      label: 'Last 30 Days',
      value: s?.last30Days ?? '—',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Avg Duration',
      value: s ? fmtDuration(s.avgDurationSeconds) : '—',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <div className="w-full">
        <header className="mb-7 md:mb-10 border-b border-slate-100 pb-6">
          <h2 className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2">
            School Platform
          </h2>
          <h1 className="text-[26px] md:text-[34px] font-bold text-slate-900 tracking-tight leading-tight">
            Live Class Usage
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-semibold">
            Realtime and historical live streaming analytics across all schools
          </p>
        </header>

        {/* KPI tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white p-5 md:p-7 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group"
            >
              <div className={`p-3 rounded-[16px] ${k.bg} ${k.color} w-fit mb-4 transition-transform group-hover:scale-110`}>
                <k.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{k.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-xl md:text-[28px] font-bold text-slate-900">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : String(k.value)}
                </h3>
                {k.label === 'Live Right Now' && (s?.liveNow ?? 0) > 0 && (
                  <span className="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    LIVE <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Daily trend chart */}
        <div className="bg-white p-5 md:p-8 rounded-[28px] border border-slate-100 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
              Classes Per Day (Last 30 Days)
            </h3>
            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-medium uppercase tracking-wider">
              Daily Trend
            </div>
          </div>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.dailyTrend ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                  formatter={(v: number) => [v, 'Classes']}
                  labelFormatter={(l: string) => `Date: ${l}`}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Per-school table */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm mb-8 overflow-hidden">
          <div className="p-5 md:p-8 border-b border-slate-100 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">Per School</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['School', 'Total', 'Live', 'Completed', 'Total Duration', 'Viewers', 'Last Class'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : !data?.perInstitute?.length ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No data yet</td>
                  </tr>
                ) : (
                  data.perInstitute.map((row, i) => (
                    <tr key={row.instituteId} className={i % 2 === 0 ? '' : 'bg-slate-50/40'}>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap max-w-[200px] truncate">
                        {row.instituteName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.totalLectures}</td>
                      <td className="px-4 py-3">
                        {row.liveNow > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            {row.liveNow}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.completed}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmtDuration(row.totalDurationSeconds)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {row.uniqueViewers}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {row.lastLectureAt ? new Date(row.lastLectureAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent classes */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-8 border-b border-slate-100 flex items-center gap-3">
            <Radio className="w-5 h-5 text-indigo-500" />
            <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">Recent Classes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Title', 'School', 'Teacher', 'Status', 'Duration', 'Viewers', 'Started'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : !data?.recentLectures?.length ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No classes yet</td>
                  </tr>
                ) : (
                  data.recentLectures.map((lec, i) => (
                    <tr key={lec.id} className={i % 2 === 0 ? '' : 'bg-slate-50/40'}>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate whitespace-nowrap">
                        {lec.title || 'Untitled'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate whitespace-nowrap">
                        {lec.instituteName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{lec.teacherName ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={lec.status} /></td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {lec.durationSeconds ? fmtDuration(lec.durationSeconds) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{lec.participantCount}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {lec.startedAt ? new Date(lec.startedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
