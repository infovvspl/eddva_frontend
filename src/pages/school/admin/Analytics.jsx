import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie } from 'recharts';
import { Building2, Users, LifeBuoy, TrendingUp, Calendar, CalendarDays, CalendarRange, UserCheck, UserCog, UserSquare2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api/school-client';
import { Skeleton } from '@/components/school/admin/Skeleton';

function number(value) {
  return Number(value || 0).toLocaleString();
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    try {
      // Use the new Super Admin stats endpoint
      const res = await api.get('/admin/stats');
      setStats(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 rounded-lg" />)}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  const { institutes, users, tickets } = stats || {
    institutes: {}, users: { instituteActivity: [] }, tickets: { categories: [] }
  };

  const instituteSummary = [
    { label: 'Total Institutes', value: institutes?.total, icon: Building2, color: 'text-brand-700', bg: 'bg-brand-50' },
    { label: 'Daily New', value: institutes?.daily, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Weekly New', value: institutes?.weekly, icon: CalendarDays, color: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Monthly New', value: institutes?.monthly, icon: CalendarRange, color: 'text-amber-700', bg: 'bg-amber-50' },
  ];

  const userSummary = [
    { label: 'Total Users', value: users?.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Admins', value: users?.admins, icon: UserCog, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Teachers', value: users?.teachers, icon: UserCheck, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    { label: 'Students', value: users?.students, icon: UserSquare2, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const ticketSummary = [
    { label: 'Total Tickets', value: tickets?.total, icon: LifeBuoy, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Resolved', value: tickets?.resolved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Open / Pending', value: tickets?.open, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const categoryColors = ['#0ea5e9', '#8b5cf6', '#f43f5e'];

  return (
    <div className="space-y-10 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-surface-950">Super Admin Analytics</h1>
        <p className="mt-2 text-sm font-medium text-surface-500">Platform-wide insights into institutes, users, and support.</p>
      </div>

      {/* Institute Registration Report */}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-surface-950">Institute Registration Report</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {instituteSummary.map((item) => (
            <div key={item.label} className="glass-panel rounded-lg p-5 shadow-soft">
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-lg ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <p className="text-sm font-bold text-surface-500">{item.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-surface-950">{number(item.value)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Users Report */}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-surface-950">Active Users Report</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-5">
          {userSummary.map((item) => (
            <div key={item.label} className="glass-panel rounded-lg p-5 shadow-soft">
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-lg ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <p className="text-sm font-bold text-surface-500">{item.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-surface-950">{number(item.value)}</p>
            </div>
          ))}
        </div>
        <div className="glass-panel rounded-lg p-6 shadow-soft">
          <div className="mb-6">
            <h3 className="font-display text-lg font-bold text-surface-950">Institute-wise User Activity (Top 5)</h3>
            <p className="text-sm font-medium text-surface-500">Users registered per institute</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={users?.instituteActivity || []} margin={{ top: 10, right: 10, left: -22, bottom: 0 }} barSize={40}>
                <CartesianGrid stroke="#D8E7FA" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6887A8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6887A8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#EFF8FF' }} contentStyle={{ borderRadius: 8, border: '1px solid #D8E7FA' }} />
                <Bar dataKey="userCount" name="Users" radius={[6, 6, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Support Ticket Report */}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-surface-950">Support Ticket Report</h2>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel rounded-lg p-6 shadow-soft flex flex-col justify-center">
            <div className="grid gap-4 sm:grid-cols-3">
              {ticketSummary.map((item) => (
                <div key={item.label} className={`rounded-lg border border-surface-200 p-5 ${item.bg}`}>
                  <div className="mb-2"><item.icon className={`h-6 w-6 ${item.color}`} /></div>
                  <p className="text-sm font-bold text-surface-600">{item.label}</p>
                  <p className={`mt-1 font-display text-3xl font-bold ${item.color}`}>{number(item.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-lg p-6 shadow-soft flex flex-col">
            <div className="mb-2">
              <h3 className="font-display text-lg font-bold text-surface-950">Issue Categories</h3>
              <p className="text-sm font-medium text-surface-500">Distribution of tickets</p>
            </div>
            <div className="h-64 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #D8E7FA' }} />
                  <Pie
                    data={tickets?.categories || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(tickets?.categories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
