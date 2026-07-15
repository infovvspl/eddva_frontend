import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie } from 'recharts';
import { Building2, Users, LifeBuoy, TrendingUp, Calendar, CalendarDays, CalendarRange, UserCheck, UserCog, UserSquare2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api/school-client';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { cn } from '@/lib/utils';


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
      <div className="space-y-6 px-3 sm:px-5 lg:px-8">
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
    { label: 'Parents', value: users?.parents, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  const ticketSummary = [
    { label: 'Total Tickets', value: tickets?.total, icon: LifeBuoy, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Resolved', value: tickets?.resolved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Open / Pending', value: tickets?.open, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const categoryColors = ['#0ea5e9', '#8b5cf6', '#f43f5e'];

  const hasTickets = tickets?.total > 0;
  const chartData = hasTickets
    ? (tickets?.categories || []).filter(c => c.count > 0)
    : [{ name: 'No Tickets', count: 1 }];

  return (
    <div className="w-full px-0 sm:px-5 lg:px-8 xl:px-10 pb-12 space-y-8 sm:space-y-10">
      <div>
        <h1 className="font-display text-xl sm:text-3xl font-bold text-surface-955">Super Admin Analytics</h1>
        <p className="mt-1 text-xs sm:text-sm font-medium text-surface-500">Platform-wide insights into institutes, users, and support.</p>
      </div>

      {/* Institute Registration Report */}
      <section>
        <h2 className="mb-4 font-display text-base sm:text-xl font-bold text-surface-950">Institute Registration Report</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4">
          {instituteSummary.map((item) => (
            <div key={item.label} className="glass-panel rounded-lg p-3 sm:p-5 shadow-soft">
              <div className={`mb-2 sm:mb-4 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-lg ${item.bg} shrink-0`}>
                <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} />
              </div>
              <p className="text-xs sm:text-sm font-bold text-surface-500">{item.label}</p>
              <p className="mt-0.5 sm:mt-1 font-display text-lg sm:text-3xl font-bold text-surface-955">{number(item.value)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Users Report */}
      <section>
        <h2 className="mb-4 font-display text-base sm:text-xl font-bold text-surface-950">Active Users Report</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4 mb-5">
          {userSummary.map((item, idx) => (
            <div key={item.label} className={cn("glass-panel rounded-lg p-3 sm:p-5 shadow-soft", idx === 4 && "col-span-2 md:col-span-1")}>
              <div className={`mb-2 sm:mb-4 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-lg ${item.bg} shrink-0`}>
                <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} />
              </div>
              <p className="text-xs sm:text-sm font-bold text-surface-500">{item.label}</p>
              <p className="mt-0.5 sm:mt-1 font-display text-lg sm:text-3xl font-bold text-surface-955">{number(item.value)}</p>
            </div>
          ))}
        </div>
        <div className="glass-panel rounded-lg p-4 sm:p-6 shadow-soft">
          <div className="mb-6">
            <h3 className="font-display text-base sm:text-lg font-bold text-surface-955">Institute-wise User Activity (Top 5)</h3>
            <p className="text-xs sm:text-sm font-medium text-surface-500">Users registered per institute</p>
          </div>
          <div className="h-60 sm:h-80">
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
        <h2 className="mb-4 font-display text-base sm:text-xl font-bold text-surface-955">Support Ticket Report</h2>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel rounded-lg p-4 sm:p-6 shadow-soft flex flex-col justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {ticketSummary.map((item, idx) => (
                <div key={item.label} className={cn("rounded-lg border border-surface-200 p-3 sm:p-5", item.bg, idx === 2 && "col-span-2 sm:col-span-1")}>
                  <div className="mb-1.5"><item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color}`} /></div>
                  <p className="text-xs sm:text-sm font-bold text-surface-600">{item.label}</p>
                  <p className={`mt-0.5 sm:mt-1 font-display text-xl sm:text-3xl font-bold ${item.color}`}>{number(item.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-lg p-6 shadow-soft flex flex-col">
            <div className="mb-2">
              <h3 className="font-display text-lg font-bold text-surface-950">Issue Categories</h3>
              <p className="text-sm font-medium text-surface-500">Distribution of tickets</p>
            </div>
            
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
              <div className="relative w-40 h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {hasTickets && <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #D8E7FA' }} />}
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={hasTickets && chartData.length > 1 ? 5 : 0}
                      dataKey="count"
                      nameKey="name"
                      label={false}
                    >
                      {chartData.map((entry, index) => {
                        if (!hasTickets) {
                          return <Cell key={`cell-${index}`} fill="#f1f5f9" />;
                        }
                        const originalIndex = (tickets?.categories || []).findIndex(c => c.name === entry.name);
                        const colorIndex = originalIndex !== -1 ? originalIndex : index;
                        return <Cell key={`cell-${index}`} fill={categoryColors[colorIndex % categoryColors.length]} />;
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-surface-950 leading-tight">
                    {tickets?.total || 0}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-surface-400 font-bold">
                    Total
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2">
                {(tickets?.categories || []).map((category, index) => {
                  const percentage = tickets?.total > 0 ? Math.round((category.count / tickets.total) * 100) : 0;
                  const color = categoryColors[index % categoryColors.length];
                  return (
                    <div key={category.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 transition-colors duration-150">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-semibold text-surface-700 truncate">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-3 pl-2 flex-shrink-0">
                        <span className="text-xs font-bold text-surface-900">{category.count}</span>
                        <span className="text-xs font-medium text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
