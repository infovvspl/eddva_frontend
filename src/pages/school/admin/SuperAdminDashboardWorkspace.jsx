import React from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  CheckCircle2,
  Shield,
  Sparkles,
  Users,
  TrendingUp,
  AlertCircle,
  Activity,
  Server,
  Lock,
  HardDrive,
  Zap,
  Clock,
  DollarSign,
  Ticket,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs shadow-xl dark:border-slate-600 dark:bg-slate-800">
      <p className="mb-2 font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 font-semibold" style={{ color: entry.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function StatBadge({ label, value, trend, trendValue, color = 'blue', formatter }) {
  const trendClass = trend === 'up' ? 'text-emerald-600' : 'text-red-600';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  const colorClass = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }[color] || 'bg-blue-50 text-blue-700 border-blue-200';
  
  return (
    <div className={`rounded-2xl border ${colorClass} p-4`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="font-display text-2xl font-bold">{formatter ? formatter(value) : typeof value === 'number' ? formatNumber(value) : value}</p>
        <div className={`inline-flex items-center gap-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-100' : 'bg-red-100'} px-2 py-1`}>
          <TrendIcon className={`h-3.5 w-3.5 ${trendClass}`} />
          <span className={`text-xs font-bold ${trendClass}`}>{trendValue}%</span>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, subtext, trend, gradient, delay, formatter }) {
  const trendValue = typeof trend === 'number' ? trend : 0;
  const TrendIcon = trendValue >= 0 ? ArrowUpRight : ArrowDownRight;
  const trendText = `${trendValue >= 0 ? '+' : ''}${trendValue}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: `linear-gradient(135deg, ${gradient[0]}20, ${gradient[1]}20)` }} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${gradient[2]} text-white shadow-sm ring-1 ring-slate-100`}>
            <Icon className="h-6 w-6" />
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${trendValue >= 0 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800' : 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800'}`}>
            <TrendIcon className="h-3 w-3" />
            {trendText}
          </span>
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 font-display text-3xl font-bold text-slate-950 dark:text-white">{formatter ? formatter(value) : typeof value === 'number' ? formatNumber(value) : value}</p>
        {subtext && <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">{subtext}</p>}
      </div>
    </motion.div>
  );
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function percentChange(current, previous) {
  const prev = Number(previous || 0);
  if (!prev) return 0;
  return Math.round(((Number(current || 0) - prev) / prev) * 100);
}

const statusColors = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Suspended: 'bg-red-50 text-red-700 border-red-200',
  Open: 'bg-red-50 text-red-700 border-red-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  High: 'bg-red-50 text-red-700 border-red-200',
  Critical: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function SuperAdminDashboardWorkspace({ stats }) {
  const navigate = useNavigate();
  const userGrowthData = stats?.userGrowth || [];
  const instituteGrowthData = stats?.instituteGrowth || [];
  const revenueTrendData = stats?.revenueTrend || [];
  const aiUsageData = stats?.aiUsageTrend || [];
  const recentInstitutes = stats?.recentInstitutes || [];
  const recentTickets = stats?.recentTickets || [];
  const topInstitutes = stats?.topInstitutes || [];
  const recentActivity = stats?.recentActivity || [];
  const totalRevenue = stats?.monthlyRevenue ?? stats?.financeSummary?.totalRevenue ?? 0;
  const storageUsageGb = Number(stats?.storageUsageBytes || 0) / (1024 * 1024 * 1024);
  const userTrend = userGrowthData.length > 1 ? percentChange(userGrowthData[userGrowthData.length - 1]?.users, userGrowthData[userGrowthData.length - 2]?.users) : 0;
  const instituteTrend = instituteGrowthData.length > 1 ? percentChange(instituteGrowthData[instituteGrowthData.length - 1]?.institutes, instituteGrowthData[instituteGrowthData.length - 2]?.institutes) : 0;
  const revenueTrend = revenueTrendData.length > 1 ? percentChange(revenueTrendData[revenueTrendData.length - 1]?.revenue, revenueTrendData[revenueTrendData.length - 2]?.revenue) : 0;
  const aiTrend = aiUsageData.length > 1 ? percentChange(aiUsageData[aiUsageData.length - 1]?.usage, aiUsageData[aiUsageData.length - 2]?.usage) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12"
    >
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-8 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white, transparent 50%)' }} />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Super Admin Dashboard</span>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight">
                Welcome back, Super Admin 👋
              </h1>
              <p className="mt-4 text-lg font-medium text-white/90">
                Monitor platform performance, institute onboarding, and operational metrics in real-time.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">Pending</p>
                <p className="mt-2 font-display text-2xl font-bold">{stats?.pendingApprovals || 0}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">Active</p>
                <p className="mt-2 font-display text-2xl font-bold">{stats?.activeUsers || 0}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">Revenue</p>
                <p className="mt-2 font-display text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* KPI Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"
      >
        <KpiCard
          title="Total Institutes"
          value={stats?.totalInstitutes || 0}
          icon={Building2}
          subtext="Live institute count"
          trend={instituteTrend}
          gradient={['#2563EB', '#60A5FA', 'bg-gradient-to-br from-blue-600 to-blue-500']}
          delay={0.12}
        />
        <KpiCard
          title="Total Users"
          value={stats?.totalUsers || stats?.activeUsers || 0}
          icon={Users}
          subtext="All platform users"
          trend={userTrend}
          gradient={['#7C3AED', '#A78BFA', 'bg-gradient-to-br from-violet-600 to-violet-500']}
          delay={0.14}
        />
        <KpiCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          subtext="Registered students"
          trend={userTrend}
          gradient={['#06B6D4', '#22D3EE', 'bg-gradient-to-br from-cyan-600 to-cyan-500']}
          delay={0.16}
        />
        <KpiCard
          title="Total Faculty"
          value={stats?.totalTeachers || 0}
          icon={BookOpen}
          subtext="Registered teachers"
          trend={userTrend}
          gradient={['#10B981', '#34D399', 'bg-gradient-to-br from-emerald-600 to-emerald-500']}
          delay={0.18}
        />
        <KpiCard
          title="Support Tickets"
          value={stats?.openComplaints || 0}
          icon={Ticket}
          subtext="Open support tickets"
          trend={stats?.openComplaints ? -8 : 0}
          gradient={['#F59E0B', '#FBBF24', 'bg-gradient-to-br from-amber-600 to-amber-500']}
          delay={0.2}
        />
        <KpiCard
          title="Monthly Revenue"
          value={totalRevenue}
          icon={DollarSign}
          subtext="Current month revenue"
          formatter={formatCurrency}
          trend={revenueTrend}
          gradient={['#EC4899', '#F472B6', 'bg-gradient-to-br from-rose-600 to-pink-500']}
          delay={0.22}
        />
      </motion.div>

      {/* Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid gap-4 lg:grid-cols-2"
      >
        {/* User Growth Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">User Growth Trend</h3>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Active users over the last 6 months</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800">
              6M
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 5 }} />
                <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Institute Registration Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">Institute Registrations</h3>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">New institutes registered per week</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
              This Month
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={instituteGrowthData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="institutes" fill="#2563EB" radius={[8, 8, 0, 0]} />
                <Bar dataKey="approved" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* More Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid gap-4 lg:grid-cols-2"
      >
        {/* Revenue Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">Revenue Trend</h3>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Monthly revenue and projections</p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800">
              YTD
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="revenue" fill="#EC4899" radius={[8, 8, 0, 0]} />
                <Bar dataKey="billed" fill="#F472B6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Usage Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">AI Usage Trend</h3>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">API requests by hour</p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800">
              Today
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiUsageData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="usage" stroke="#7C3AED" strokeWidth={3} fill="url(#aiGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Management Tables */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        {/* Recent Institute Registrations */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-100 p-6 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">Recent Registrations</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">View All</button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentInstitutes.map((inst) => (
              <div key={inst.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{inst.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{inst.principalName || 'No principal assigned'}</p>
                    <p className="mt-1 text-xs text-slate-400">{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ${statusColors[inst.status] || statusColors.Active}`}>
                    {inst.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Support Tickets */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-100 p-6 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">Support Tickets</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">View All</button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{ticket.id}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-white">{ticket.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{ticket.instituteName}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColors[ticket.status] || statusColors.Open}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Institutes */}
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-100 p-6 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">Top Institutes</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">View All</button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topInstitutes.map((inst, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900">
                <p className="text-sm font-bold text-slate-950 dark:text-white">{inst.name}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{inst.users}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Users</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{inst.faculty}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Faculty</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{formatCurrency(inst.revenue)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* System Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
      >
        <StatBadge label="System Health" value={stats?.systemHealth || 0} trend="up" trendValue={2.1} color="emerald" formatter={(value) => `${Number(value || 0).toFixed(1)}%`} />
        <StatBadge label="AI Requests Today" value={stats?.aiRequestsToday || 0} trend="up" trendValue={aiTrend} color="violet" />
        <StatBadge label="Storage Usage" value={storageUsageGb} trend="up" trendValue={8.2} color="amber" formatter={(value) => `${Number(value || 0).toFixed(1)} GB`} />
        <StatBadge label="Active Users Online" value={stats?.activeUsersOnline || 0} trend="up" trendValue={34.8} color="blue" />
        <StatBadge label="Security Alerts" value={stats?.securityAlerts || 0} trend="down" trendValue={42.5} color="blue" />
      </motion.div>

      {/* Quick Actions & AI Assistant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h3 className="mb-4 font-display text-lg font-bold text-slate-950 dark:text-white">Quick Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Add Institute', icon: Building2, action: () => navigate('/admin/institutes') },
                { label: 'Approve Institutes', icon: CheckCircle2, action: () => navigate('/admin/institutes') },
                { label: 'View Analytics', icon: TrendingUp, action: () => navigate('/admin/analytics') },
                { label: 'Manage Users', icon: Users, action: () => navigate('/admin/settings') },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="rounded-2xl border border-slate-100 bg-white p-4 text-center transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 mx-auto text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-950 dark:text-white">{action.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-sm dark:border-slate-800 dark:from-violet-950 dark:to-indigo-950">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-500/20 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">EDDVA AI Assistant</h3>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">Your intelligent admin companion</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110">
                Ask EDDVA AI
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

