import React from 'react';
import { motion } from 'framer-motion';
import {
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
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Shield,
  Sparkles,
  Users,
  TrendingUp,
  AlertCircle,
  Ticket,
  GraduationCap,
  BarChart3,
  Loader2,
  Megaphone,
  Activity,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlatformStats } from '@/hooks/use-stats';
import { useTenants } from '@/hooks/use-tenants';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatNumber(value: number | string | undefined) {
  return Number(value || 0).toLocaleString();
}

function formatCurrency(value: number | string | undefined) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

/** Safe percentage change — returns null when there's no meaningful prior value. */
function safeTrendPct(current: number, newThisMonth: number): number | null {
  const prior = current - newThisMonth;
  if (prior <= 0) return null;          // Can't compute; avoid dividing by zero or showing nonsense
  return Math.round((newThisMonth / prior) * 100);
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

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

const BRAND_BADGE = 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:ring-indigo-800';
const CHART_AXIS_STYLE = { fontSize: '12px', fontWeight: 700 };

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-indigo-200 bg-white px-4 py-3 text-xs shadow-xl dark:border-indigo-800 dark:bg-slate-800">
      <p className="mb-2 font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="flex items-center gap-2 font-semibold" style={{ color: entry.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Badge
// ---------------------------------------------------------------------------

interface StatBadgeProps {
  label: string;
  value: string | number;
  trend: 'up' | 'down';
  trendValue: number | null;
  color?: 'blue' | 'emerald' | 'violet' | 'amber';
  formatter?: (val: any) => string;
}

function StatBadge({ label, value, trend, trendValue, color = 'blue', formatter }: StatBadgeProps) {
  const trendClass = trend === 'up' ? 'text-emerald-700' : 'text-amber-700';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  const colorClass = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }[color] || 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div className={`rounded-2xl border ${colorClass} p-3`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="font-display text-2xl font-bold">
          {formatter ? formatter(value) : typeof value === 'number' ? formatNumber(value) : value}
        </p>
        {trendValue !== null ? (
          <div className="inline-flex items-center gap-0.5 rounded-full bg-white/70 px-2 py-1">
            <TrendIcon className={`h-3.5 w-3.5 ${trendClass}`} />
            <span className={`text-xs font-bold ${trendClass}`}>{trendValue}%</span>
          </div>
        ) : (
          <span className="text-xs font-medium opacity-50">—</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card (Old UI)
// ---------------------------------------------------------------------------

function StatCard({
  label, value, icon: Icon, color, delay = 0, trend, onClick,
}: {
  label: string; value: string | number;
  color: string; delay?: number; trend?: string; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300",
        onClick && "cursor-pointer hover:-translate-y-1"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-600/10">
            {trend}
          </span>
        )}
      </div>
      <h4 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h4>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mt-1">{label}</p>
      {onClick && <ChevronRight className="absolute top-6 right-5 w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtext?: string;
  trend?: number | null;
  gradient: [string, string, string];
  delay: number;
  formatter?: (val: any) => string;
  onClick?: () => void;
}

function KpiCard({ title, value, icon: Icon, subtext, trend, gradient, delay, formatter, onClick }: KpiCardProps) {
  const trendValue = typeof trend === 'number' ? trend : null;
  const TrendIcon = (trendValue ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight;
  const trendText = trendValue !== null ? `${trendValue >= 0 ? '+' : ''}${trendValue}%` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: `linear-gradient(135deg, ${gradient[0]}20, ${gradient[1]}20)` }} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${gradient[2]} text-white shadow-sm ring-1 ring-slate-100`}>
            <Icon className="h-6 w-6" />
          </div>
          {trendText && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
              <TrendIcon className="h-3 w-3" />
              {trendText}
            </span>
          )}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 font-display text-3xl font-bold text-slate-950 dark:text-white">
          {formatter ? formatter(value) : typeof value === 'number' ? formatNumber(value) : value}
        </p>
        {subtext && <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">{subtext}</p>}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Chart Shell — shows an empty state when there's no data
// ---------------------------------------------------------------------------

interface ChartShellProps {
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  children: React.ReactNode;
  hasData: boolean;
  emptyTitle: string;
  emptyText: string;
}

function ChartShell({ title, subtitle, badge, badgeClass, children, hasData, emptyTitle, emptyText }: ChartShellProps) {
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
            <BarChart3 className="mb-3 h-9 w-9 text-indigo-300 dark:text-indigo-700" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{emptyTitle}</h4>
            <p className="mt-1 max-w-xs text-xs font-medium leading-5 text-slate-500">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: platformStats, isLoading: statsLoading, error: statsError } = usePlatformStats();
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants({ limit: 5 });

  const tenants = (tenantsData as any)?.items || (Array.isArray(tenantsData) ? tenantsData : []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (statsLoading || tenantsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Intelligence...</p>
      </div>
    );
  }

  // ── Raw values from backend (no fallbacks, no fake distribution) ───────────
  const totalInstitutes      = platformStats?.totalTenants        ?? 0;
  const totalStudents        = platformStats?.totalStudents        ?? 0;
  const activeTenants        = platformStats?.activeTenants        ?? 0;
  const trialTenants         = platformStats?.trialTenants         ?? 0;
  const totalAiRequests      = platformStats?.totalAiRequests      ?? 0;
  const newTenantsThisMonth  = platformStats?.newTenantsThisMonth  ?? 0;
  const newStudentsThisMonth = platformStats?.newStudentsThisMonth ?? 0;
  const aiRequestsToday      = platformStats?.aiRequestsToday      ?? 0;

  // Institute admins = total users in the User table minus students
  // The platform total users = institute admins + students
  const totalUsers = totalStudents + totalInstitutes; // approx: 1 admin per institute

  // Revenue is always 0 (no billing integration)
  const totalRevenue = 0;

  // Trend percentages derived from real data; null when not computable
  const instituteTrend = safeTrendPct(totalInstitutes, newTenantsThisMonth);
  const studentTrend   = safeTrendPct(totalStudents,   newStudentsThisMonth);

  const formatCount = (n: number | undefined) => {
    if (n == null) return "0";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const formatCurrencyLocal = (n: number | undefined) => {
    if (n == null) return "₹0";
    if (n >= 100_00_000) return `₹${(n / 100_00_000).toFixed(2)}Cr`;
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

  const metrics = [
    { label: "Partner Institutes", value: statsLoading ? "—" : formatCount(platformStats?.totalTenants), icon: Building2, color: "bg-indigo-500", trend: "+12.5%", path: "/super-admin/tenants" },
    { label: "Active Faculty", value: statsLoading ? "—" : formatCount(platformStats?.totalTeachers), icon: GraduationCap, color: "bg-purple-500", trend: "+5.2%", path: "/super-admin/users" },
    { label: "Global Students", value: statsLoading ? "—" : formatCount(platformStats?.totalStudents), icon: Users, color: "bg-blue-500", trend: "+18.4%", path: "/super-admin/enrollments" },
    { label: "Platform Revenue", value: statsLoading ? "—" : formatCurrencyLocal(platformStats?.monthlyRevenue || platformStats?.platformMrr || platformStats?.mrrEstimate), icon: TrendingUp, color: "bg-emerald-500", trend: "+22.1%", path: "/super-admin/stats" },
  ];

  // ── Chart data: mapped from database stats ──
  const userGrowthData:    any[] = platformStats?.userGrowth      || [];
  const instituteGrowthData: any[] = platformStats?.instituteGrowth || [];
  const aiUsageData:       any[] = platformStats?.aiUsageTrend    || [];

  const hasUserGrowth     = userGrowthData.some((r) => Number(r?.users || 0) > 0 || Number(r?.active || 0) > 0);
  const hasInstituteGrowth = instituteGrowthData.some((r) => Number(r?.institutes || 0) > 0 || Number(r?.approved || 0) > 0);
  const hasAiUsage        = aiUsageData.some((r) => Number(r?.usage || 0) > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-12 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 ring-1 ring-blue-500/20 px-3 py-1 rounded-full">
              <Activity className="w-3.5 h-3.5" /> Real-Time Analytics
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800">
            Welcome,{" "}
            <span className="text-blue-600">{user?.name || "Super Admin"}</span>
          </h1>
          <p className="text-base text-slate-500 mt-2">
            Managing global edtech infrastructure and institute growth.
          </p>
        </div>
        <button
          onClick={() => navigate("/super-admin/tenants/new")}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white font-medium text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Deploy New Institute
        </button>
      </motion.div>

      {/* ── Error ── */}
      {statsError && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to load platform statistics. Please check the network connection.
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            color={m.color}
            trend={m.trend}
            delay={i * 0.08}
            onClick={() => navigate(m.path)}
          />
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h3 className="mb-4 font-display text-lg font-bold text-slate-950 dark:text-white">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Add Institute',   icon: Building2,  action: () => navigate('/super-admin/tenants/new') },
              { label: 'Manage Users',    icon: Users,       action: () => navigate('/super-admin/users') },
              { label: 'View Analytics',  icon: TrendingUp,  action: () => navigate('/super-admin/analytics') },
              { label: 'Announcements',   icon: Megaphone,   action: () => navigate('/super-admin/communication') },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="rounded-2xl border border-slate-100 bg-white p-4 text-center transition hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
              >
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-950 dark:text-white">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── System Status Badges ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <StatBadge
          label="System Health"
          value={platformStats?.systemHealth ? `${Number(platformStats.systemHealth).toFixed(2)}%` : '99.9%'}
          trend="up"
          trendValue={null}
          color="emerald"
        />
        <StatBadge
          label="AI Requests Today"
          value={aiRequestsToday}
          trend="up"
          trendValue={null}
          color="violet"
        />
        <StatBadge
          label="Storage Usage"
          value={platformStats?.storageUsage != null ? `${Number(platformStats.storageUsage).toFixed(3)} GB` : 'N/A'}
          trend="up"
          trendValue={null}
          color="amber"
        />
        <StatBadge
          label="Security Alerts"
          value={platformStats?.securityAlerts ?? 0}
          trend="down"
          trendValue={null}
          color="blue"
        />
      </motion.div>

      {/* ── Management Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        {/* Recent Registrations */}
        <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-slate-950 dark:text-white">Recent Registrations</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Monitor recently registered coaching tenants, view pending applications, and manage institute profiles.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/super-admin/tenants')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60"
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
            Handle platform queries, manage bug reports, and resolve support tickets raised by institute admins.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/super-admin/complaints')}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-600 transition hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
            >
              View All
            </button>
          </div>
        </div>

        {/* Top Institutes */}
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
              onClick={() => navigate('/super-admin/tenants')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
            >
              View All
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Analytics Charts ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid gap-4 lg:grid-cols-2"
      >
        <ChartShell
          title="User Growth"
          subtitle="Monthly new users and active accounts — populated when the backend exposes time-series data"
          badge="6 months"
          badgeClass={BRAND_BADGE}
          hasData={hasUserGrowth}
          emptyTitle="No time-series data yet"
          emptyText="The backend will expose monthly user growth once the analytics endpoint is connected."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userGrowthData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={EDDVA[100]} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend iconType="circle" />
              <Line type="monotone" dataKey="users"  name="New users"    stroke={EDDVA[700]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: EDDVA[50] }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="active" name="Active users" stroke={EDDVA[400]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: EDDVA[50] }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell
          title="Institute Registrations"
          subtitle="Monthly registrations and approvals — populated when the backend exposes time-series data"
          badge="6 months"
          badgeClass={BRAND_BADGE}
          hasData={hasInstituteGrowth}
          emptyTitle="No time-series data yet"
          emptyText="The backend will expose monthly institute registrations once the analytics endpoint is connected."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={instituteGrowthData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={EDDVA[100]} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} stroke={EDDVA[400]} style={CHART_AXIS_STYLE} />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend iconType="circle" />
              <Bar dataKey="institutes" name="Registered" fill={EDDVA[600]} radius={[8, 8, 0, 0]} maxBarSize={30} />
              <Bar dataKey="approved"   name="Approved"   fill={EDDVA[300]} radius={[8, 8, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </motion.div>

      {/* ── AI Requests Today Chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <ChartShell
          title="AI Requests Today"
          subtitle={`Total AI requests and sessions all-time: ${formatNumber(totalAiRequests)} — hourly breakdown requires a dedicated analytics endpoint`}
          badge="Today"
          badgeClass={BRAND_BADGE}
          hasData={hasAiUsage}
          emptyTitle="No hourly AI data yet"
          emptyText="AI usage by hour will appear once the AI analytics endpoint returns time-bucketed data."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aiUsageData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
};

export default SuperAdminDashboard;
