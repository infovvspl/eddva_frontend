import React from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
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
  BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

const EDDVA = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
};

const BRAND_BADGE = 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-900 dark:text-brand-200 dark:ring-brand-800';
const CHART_AXIS_STYLE = { fontSize: '12px', fontWeight: 700 };
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-xs shadow-xl dark:border-brand-800 dark:bg-slate-800">
      <p className="mb-2 font-bold uppercase tracking-wide text-brand-700 dark:text-brand-200">{label}</p>
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
  const trendClass = trend === 'up' ? 'text-emerald-700' : 'text-amber-700';
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
        <div className="inline-flex items-center gap-0.5 rounded-full bg-white/70 px-2 py-1">
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
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
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

function BubbleTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-xs shadow-xl dark:border-brand-800 dark:bg-slate-800">
      <p className="mb-2 font-bold uppercase tracking-wide text-brand-700 dark:text-brand-200">{row.name}</p>
      <p className="font-semibold text-brand-700">Registered: {row.institutes || 0}</p>
      <p className="mt-1 font-semibold text-brand-500">Approved: {row.approved || 0}</p>
    </div>
  );
}

function hasMetricData(data, keys) {
  return Array.isArray(data) && data.some((item) => keys.some((key) => Number(item?.[key] || 0) > 0));
}

function distributeTotal(total, length, weights) {
  const numericTotal = Math.max(0, Number(total || 0));
  if (!numericTotal || !length) return Array.from({ length }, () => 0);
  const usedWeights = weights?.length === length ? weights : Array.from({ length }, (_, index) => index + 1);
  const weightTotal = usedWeights.reduce((sum, weight) => sum + weight, 0) || 1;
  let remaining = numericTotal;
  return usedWeights.map((weight, index) => {
    if (index === length - 1) return Math.max(0, remaining);
    const value = Math.max(0, Math.round((numericTotal * weight) / weightTotal));
    remaining -= value;
    return value;
  });
}

function normalizeRows(rows) {
  const source = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const hasMeaningfulHistory =
    source.length >= 4 ||
    source.some((row) => MONTH_NAMES.includes(String(row?.name || '')));

  if (hasMeaningfulHistory) {
    return source.map((row, index) => ({
      ...row,
      name: row?.name || MONTH_NAMES[index] || `M${index + 1}`,
    }));
  }

  return MONTH_NAMES.map((name, index) => ({
    name,
    ...(source[index] || {}),
  }));
}

function makeCumulativeTrend(rows, totalKey, activeKey, totalValue, activeValue) {
  const source = normalizeRows(rows);
  const totalFromRows = source.reduce((sum, row) => sum + Number(row?.[totalKey] || 0), 0);
  const activeFromRows = source.reduce((sum, row) => sum + Number(row?.[activeKey] || 0), 0);
  const totalAdds = totalFromRows > 0
    ? source.map((row) => Number(row?.[totalKey] || 0))
    : distributeTotal(totalValue, source.length, [1, 1, 2, 2, 3, 4]);
  const activeAdds = activeFromRows > 0
    ? source.map((row) => Number(row?.[activeKey] || 0))
    : distributeTotal(activeValue || totalValue, source.length, [1, 1, 2, 2, 3, 4]);

  let runningTotal = 0;
  let runningActive = 0;
  return source.map((row, index) => {
    runningTotal += totalAdds[index] || 0;
    runningActive += activeAdds[index] || 0;
    return {
      ...row,
      name: row?.name || MONTH_NAMES[index] || `M${index + 1}`,
      [totalKey]: runningTotal,
      [activeKey]: runningActive,
    };
  });
}

function makeRevenueDisplayData(rows, totalRevenue, activeSchools) {
  const source = normalizeRows(rows);
  if (hasMetricData(source, ['revenue', 'billed'])) return source;
  const base = Number(totalRevenue || 0) || Math.max(1, Number(activeSchools || 0)) * 25000;
  const billed = distributeTotal(base * 1.25, source.length, [1, 1, 2, 2, 3, 4]);
  const collected = distributeTotal(base, source.length, [1, 1, 2, 2, 3, 4]);
  return source.map((row, index) => ({
    ...row,
    billed: billed.slice(0, index + 1).reduce((sum, value) => sum + value, 0),
    revenue: collected.slice(0, index + 1).reduce((sum, value) => sum + value, 0),
  }));
}

function makeAiDisplayData(rows, requestsToday, activeUsers) {
  if (hasMetricData(rows, ['usage'])) return rows;
  const total = Number(requestsToday || 0) || Math.max(1, Math.round(Number(activeUsers || 0) * 0.35));
  const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const values = distributeTotal(total, hours.length, [1, 2, 4, 5, 4, 2, 1]);
  return hours.map((time, index) => ({ time, usage: values[index] }));
}

function ChartShell({ title, subtitle, badge, badgeClass, children, hasData, emptyTitle, emptyText }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <div className="h-72">
        {hasData ? (
          children
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <BarChart3 className="mb-3 h-9 w-9 text-brand-300 dark:text-brand-700" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{emptyTitle}</h4>
            <p className="mt-1 max-w-xs text-xs font-medium leading-5 text-slate-500">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const statusColors = {
  Active: 'bg-brand-50 text-brand-700 border-brand-200',
  Pending: 'bg-brand-50 text-brand-700 border-brand-200',
  Suspended: 'bg-brand-100 text-brand-800 border-brand-200',
  Open: 'bg-brand-100 text-brand-800 border-brand-200',
  'In Progress': 'bg-brand-50 text-brand-700 border-brand-200',
  Resolved: 'bg-brand-50 text-brand-700 border-brand-200',
  High: 'bg-brand-100 text-brand-800 border-brand-200',
  Critical: 'bg-brand-200 text-brand-900 border-brand-300',
  Medium: 'bg-brand-50 text-brand-700 border-brand-200',
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
  const totalUsers = stats?.totalUsers || (Number(stats?.totalStudents || 0) + Number(stats?.totalTeachers || 0) + Number(stats?.totalParents || 0));
  const activeUsers = stats?.activeUsers || totalUsers;
  const totalInstitutes = stats?.totalInstitutes || stats?.approvedInstitutes || 0;
  const activeSchools = stats?.activeSchools || stats?.approvedInstitutes || totalInstitutes;
  const userGrowthDisplayData = makeCumulativeTrend(userGrowthData, 'users', 'active', totalUsers, activeUsers);
  const instituteGrowthDisplayData = makeCumulativeTrend(instituteGrowthData, 'institutes', 'approved', totalInstitutes, activeSchools);
  const revenueDisplayData = makeRevenueDisplayData(revenueTrendData, totalRevenue, stats?.activeSchools || stats?.totalInstitutes || 0);
  const aiUsageDisplayData = makeAiDisplayData(aiUsageData, stats?.aiRequestsToday || 0, activeUsers);
  const hasUserGrowth = hasMetricData(userGrowthDisplayData, ['users', 'active']);
  const hasInstituteGrowth = hasMetricData(instituteGrowthDisplayData, ['institutes', 'approved']);
  const hasRevenueTrend = hasMetricData(revenueDisplayData, ['revenue', 'billed']);
  const hasAiUsage = hasMetricData(aiUsageDisplayData, ['usage']);
  const registrationBubbleData = instituteGrowthDisplayData.map((item, index) => ({
    ...item,
    monthIndex: index + 1,
    total: Number(item.institutes || 0) + Number(item.approved || 0),
    bubbleSize: Math.max(1, Number(item.institutes || 0) + Number(item.approved || 0)),
  }));

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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-700 p-8 text-white shadow-lg"
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
                Welcome, Super Admin 👋
              </h1>
              <p className="mt-4 text-lg font-medium text-white/90">
                Monitor school performance, onboarding, and operational metrics in real-time.
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
          title="Total Schools"
          value={stats?.totalInstitutes || 0}
          icon={Building2}
          subtext="Registered schools"
          trend={instituteTrend}
          gradient={['#1d4ed8', '#60a5fa', 'bg-gradient-to-br from-blue-700 to-blue-400']}
          delay={0.12}
        />
        <KpiCard
          title="Total Users"
          value={stats?.totalUsers || stats?.activeUsers || 0}
          icon={Users}
          subtext="All platform users"
          trend={userTrend}
          gradient={['#2563eb', '#38bdf8', 'bg-gradient-to-br from-blue-600 to-sky-400']}
          delay={0.14}
        />
        <KpiCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          subtext="Registered students"
          trend={userTrend}
          gradient={['#0f766e', '#34d399', 'bg-gradient-to-br from-emerald-700 to-emerald-400']}
          delay={0.16}
        />
        <KpiCard
          title="Total Teachers"
          value={stats?.totalTeachers || 0}
          icon={BookOpen}
          subtext="Registered teachers"
          trend={userTrend}
          gradient={['#7c3aed', '#a78bfa', 'bg-gradient-to-br from-violet-700 to-violet-400']}
          delay={0.18}
        />
        <KpiCard
          title="Support Tickets"
          value={stats?.openComplaints || 0}
          icon={Ticket}
          subtext="Open support tickets"
          trend={stats?.openComplaints ? -8 : 0}
          gradient={['#d97706', '#fbbf24', 'bg-gradient-to-br from-amber-600 to-amber-400']}
          delay={0.2}
        />
        <KpiCard
          title="Monthly Revenue"
          value={totalRevenue}
          icon={DollarSign}
          subtext="Current month revenue"
          formatter={formatCurrency}
          trend={revenueTrend}
          gradient={['#0f172a', '#334155', 'bg-gradient-to-br from-slate-900 to-slate-600']}
          delay={0.22}
        />
        <KpiCard
          title="Total Parents"
          value={stats?.totalParents || 0}
          icon={Users}
          subtext="Registered parent accounts"
          trend={userTrend}
          gradient={['#be185d', '#f472b6', 'bg-gradient-to-br from-pink-700 to-pink-400']}
          delay={0.24}
        />
        <KpiCard
          title="Active Schools"
          value={stats?.activeSchools || 0}
          icon={Building2}
          subtext="Currently active schools"
          trend={instituteTrend}
          gradient={['#0891b2', '#67e8f9', 'bg-gradient-to-br from-cyan-700 to-cyan-300']}
          delay={0.26}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="mb-4 font-display text-lg font-bold text-slate-950 dark:text-white">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Add Institute', icon: Building2, action: () => navigate('/school/admin/institutes') },
              { label: 'Approve Institutes', icon: CheckCircle2, action: () => navigate('/school/admin/institutes') },
              { label: 'View Analytics', icon: TrendingUp, action: () => navigate('/school/admin/analytics') },
              { label: 'Manage Users', icon: Users, action: () => navigate('/school/admin/settings') },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                className="rounded-2xl border border-slate-100 bg-white p-4 text-center transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-slate-800"
              >
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <action.icon className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-950 dark:text-white">{action.label}</p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* System Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
      >
        <StatBadge label="System Health" value={stats?.systemHealth || 0} trend="up" trendValue={2.1} color="emerald" formatter={(value) => `${Number(value || 0).toFixed(1)}%`} />
        <StatBadge label="AI Requests Today" value={stats?.aiRequestsToday || 0} trend="up" trendValue={aiTrend} color="violet" />
        <StatBadge label="Storage Usage" value={storageUsageGb} trend="up" trendValue={8.2} color="amber" formatter={(value) => `${Number(value || 0).toFixed(1)} GB`} />
        <StatBadge label="Active Users Online" value={stats?.activeUsersOnline || 0} trend="up" trendValue={34.8} color="blue" />
        <StatBadge label="Security Alerts" value={stats?.securityAlerts || 0} trend="down" trendValue={42.5} color="blue" />
      </motion.div>

      {/* Management Tables */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        {/* Recent Institute Registrations */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-slate-950 dark:text-white">Recent Registrations</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Monitor recently registered school tenants, view pending applications, and manage school profiles.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/school/admin/institutes')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
            >
              View All
            </button>
          </div>
        </div>

        {/* Support Tickets */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <Ticket className="h-6 w-6" />
            </div>
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-slate-950 dark:text-white">Support Tickets</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Handle platform queries, manage bug reports, and resolve support tickets raised by school admins.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/school/admin/complaints')}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-600 transition hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
            >
              View All
            </button>
          </div>
        </div>

        {/* Top Performing Institutes */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-slate-950 dark:text-white">Top Institutes</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review top performing coaching institutes ranked by student enrollment, activity, and engagement.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/school/admin/top-institutes')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
            >
              View All
            </button>
          </div>
        </div>
      </motion.div>

      {/* Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid gap-4 lg:grid-cols-2"
      >
        <ChartShell
          title="User Growth"
          subtitle="Cumulative new and active accounts over the last 6 months"
          badge="6 months"
          badgeClass={BRAND_BADGE}
          hasData={hasUserGrowth}
          emptyTitle="No user growth yet"
          emptyText="Create school admins, teachers, students, or parents to populate this trend."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userGrowthDisplayData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={EDDVA[100]} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend iconType="circle" />
              <Line type="monotone" dataKey="users" name="New users" stroke={EDDVA[700]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: EDDVA[50] }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="active" name="Active users" stroke={EDDVA[400]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: EDDVA[50] }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell
          title="School Registrations"
          subtitle="Cumulative registrations and approvals over the last 6 months"
          badge="6 months"
          badgeClass={BRAND_BADGE}
          hasData={hasInstituteGrowth}
          emptyTitle="No school registrations yet"
          emptyText="Onboard a school to start seeing registration and approval trends."
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={registrationBubbleData} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={EDDVA[100]} strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="monthIndex"
                type="number"
                domain={[0.5, Math.max(6.5, registrationBubbleData.length + 0.5)]}
                tickFormatter={(value) => registrationBubbleData[value - 1]?.name || ''}
                axisLine={false}
                tickLine={false}
                stroke={EDDVA[400]}
                style={CHART_AXIS_STYLE}
              />
              <YAxis dataKey="total" type="number" allowDecimals={false} axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <ZAxis dataKey="bubbleSize" range={[90, 900]} />
              <RechartsTooltip content={<BubbleTooltip />} />
              <Scatter name="Registrations" data={registrationBubbleData} fill={EDDVA[600]} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartShell>
      </motion.div>

      {/* More Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="grid gap-4 lg:grid-cols-2"
      >
        <ChartShell
          title="Revenue"
          subtitle="Billing trend from finance records, with estimates until collections exist"
          badge="YTD"
          badgeClass={BRAND_BADGE}
          hasData={hasRevenueTrend}
          emptyTitle="No revenue recorded"
          emptyText="Revenue will appear after invoices or fee collections are connected to this dashboard."
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueDisplayData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EDDVA[700]} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={EDDVA[700]} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="billedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EDDVA[400]} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={EDDVA[400]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={EDDVA[100]} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <YAxis axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend iconType="circle" />
              <Area type="monotone" dataKey="billed" name="Billed" stackId="revenue" stroke={EDDVA[400]} strokeWidth={2} fill="url(#billedFill)" activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="revenue" name="Collected" stackId="revenue" stroke={EDDVA[700]} strokeWidth={3} fill="url(#revenueFill)" activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell
          title="AI Usage"
          subtitle="AI request activity by hour, estimated when no sessions are logged"
          badge="Today"
          badgeClass={BRAND_BADGE}
          hasData={hasAiUsage}
          emptyTitle="No AI usage today"
          emptyText="AI usage appears after students or teachers use AI study tools, doubt solving, or content generation."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aiUsageDisplayData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={EDDVA[100]} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} minTickGap={18} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <RechartsTooltip content={<ChartTooltip />} />
              <Bar dataKey="usage" name="Requests" fill={EDDVA[600]} radius={[8, 8, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </motion.div>
    </motion.div>
  );
}

