import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  CreditCard,
  FileText,
  Landmark,
  TrendingUp,
  Users,
  Wallet2,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { cn } from '@/components/school/admin/Skeleton';
import { getResponseData } from '@/lib/school/apiData';

function formatInr(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function percent(collected, total) {
  if (!total) return 0;
  return Math.round((Number(collected || 0) / Number(total || 0)) * 100);
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-800 dark:bg-slate-950">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-sm font-bold" style={{ color: entry.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {formatInr(entry.value)}
        </p>
      ))}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, tone, helper, positive = true }) {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className={cn('grid h-12 w-12 place-items-center rounded-2xl', tone)}>
          <Icon className="h-6 w-6" />
        </div>
        <span className={cn('inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.25em]', positive ? 'text-emerald-600' : 'text-rose-600')}>
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          Live
        </span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{title}</p>
      <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</h3>
      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}

export default function Finance() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/fees/analytics');
      setAnalytics(getResponseData(res));
    } catch (error) {
      console.error('Failed to load finance analytics', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    window.addEventListener('eddva:data-changed', loadAnalytics);
    const interval = window.setInterval(loadAnalytics, 30000);

    return () => {
      window.removeEventListener('eddva:data-changed', loadAnalytics);
      window.clearInterval(interval);
    };
  }, []);

  const summary = analytics?.summary || {
    totalRevenue: 0,
    totalCollected: 0,
    totalPending: 0,
    overdueCount: 0,
  };

  const monthlyData = analytics?.monthlyCollections || [];
  const classData = analytics?.classWiseCollections || [];
  const studentData = analytics?.studentWisePaymentStatus || [];
  const defaulters = analytics?.feeDefaulters || [];
  const trends = analytics?.paymentTrends || [];

  const classPie = useMemo(
    () => classData.map((item, index) => ({
      name: item.className,
      value: Number(item.collected || 0),
      color: ['#2563EB', '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#0EA5E9'][index % 6],
    })),
    [classData]
  );

  if (loading) {
    return <div className="px-4 py-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading finance analytics...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Finance Overview</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Real-time collections, dues, trends, and payment status from the school database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]', refreshing ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300')}>
            {refreshing ? 'Refreshing' : 'Live'}
          </span>
          <button
            type="button"
            onClick={loadAnalytics}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110 dark:bg-white dark:text-slate-950"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatInr(summary.totalRevenue)}
          icon={CircleDollarSign}
          tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
          helper="Total fee demand from issued invoices"
        />
        <StatCard
          title="Collected"
          value={formatInr(summary.totalCollected)}
          icon={Wallet2}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
          helper={`${percent(summary.totalCollected, summary.totalRevenue)}% of demand collected`}
        />
        <StatCard
          title="Pending Fees"
          value={formatInr(summary.totalPending)}
          icon={Banknote}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
          helper={`${defaulters.length} fee records still open`}
          positive={false}
        />
        <StatCard
          title="Overdue"
          value={String(summary.overdueCount || 0)}
          icon={CreditCard}
          tone="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
          helper="Students with dues past due date"
          positive={false}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Monthly Collections</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Payment flow from transaction history</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <TrendingUp className="h-4 w-4" />
              Live chart
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectionsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#2563EB" strokeWidth={3} fill="url(#collectionsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Class-wise Collections</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue split by class</p>
            </div>
            <Landmark className="h-5 w-5 text-blue-600" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={classPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={4}>
                  {classPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatInr(value)} />
                <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Student Payment Status</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Live balances by student</p>
            </div>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950">
                  <tr className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    <th className="px-4 py-4">Student</th>
                    <th className="px-4 py-4">Class</th>
                    <th className="px-4 py-4 text-right">Due</th>
                    <th className="px-4 py-4 text-right">Paid</th>
                    <th className="px-4 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentData.map((row) => (
                    <tr key={row.studentId} className="text-sm">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-950 dark:text-white">{row.studentName}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{row.enrollmentNo}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{row.className}</td>
                      <td className="px-4 py-4 text-right font-bold text-slate-900 dark:text-white">{formatInr(row.totalDue)}</td>
                      <td className="px-4 py-4 text-right font-bold text-emerald-600">{formatInr(row.totalPaid)}</td>
                      <td className="px-4 py-4 text-right font-bold text-rose-600">{formatInr(row.remainingBalance)}</td>
                    </tr>
                  ))}
                  {studentData.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                        No student finance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Fee Defaulters</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Open dues needing follow-up</p>
              </div>
              <FileText className="h-5 w-5 text-rose-600" />
            </div>
            <div className="space-y-3">
              {defaulters.map((row) => (
                <div key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950 dark:text-white">{row.studentName}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{row.enrollmentNo}</p>
                    </div>
                    <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{row.title}</p>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Due {new Date(row.dueDate).toLocaleDateString()}</span>
                    <span>{formatInr(row.balance)}</span>
                  </div>
                </div>
              ))}
              {defaulters.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-semibold text-slate-400 dark:border-slate-700">
                  No current defaulters.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-black text-slate-950 dark:text-white">Payment Trends</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Collections vs pending pressure</p>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="collected" name="Collected" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="pending" name="Pending" stroke="#F59E0B" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
