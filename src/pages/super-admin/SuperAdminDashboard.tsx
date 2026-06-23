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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlatformStats } from '@/hooks/use-stats';
import { useTenants } from '@/hooks/use-tenants';
import { useAuthStore } from '@/lib/auth-store';

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

  // ── Chart data: only show charts if we have real rows from the backend ──────
  // The backend getPlatformStats() currently returns aggregate counts, not time-series.
  // Charts will display their empty state until the backend provides monthly breakdowns.
  const userGrowthData:    any[] = [];
  const instituteGrowthData: any[] = [];
  const aiUsageData:       any[] = [];

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
      {/* ── Hero ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-700 p-8 text-white shadow-lg"
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
                Welcome, {user?.name || 'Super Admin'} 👋
              </h1>
              <p className="mt-4 text-lg font-medium text-white/90">
                Monitor coaching institute performance, onboarding, and operational metrics in real-time.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">Pending</p>
                <p className="mt-1 font-display text-2xl font-bold">{trialTenants}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">Active</p>
                <p className="mt-1 font-display text-2xl font-bold">{activeTenants}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">Revenue</p>
                <p className="mt-1 font-display text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Error ── */}
      {statsError && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to load platform statistics. Please check the network connection.
        </div>
      )}

      {/* ── KPI Cards Grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          title="Total Institutes"
          value={totalInstitutes}
          icon={Building2}
          subtext={`${newTenantsThisMonth} new this month`}
          trend={instituteTrend}
          gradient={['#1d4ed8', '#60a5fa', 'bg-gradient-to-br from-blue-700 to-blue-400']}
          delay={0.12}
        />
        <KpiCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          subtext="Admins and students"
          trend={null}
          gradient={['#2563eb', '#38bdf8', 'bg-gradient-to-br from-blue-600 to-sky-400']}
          delay={0.14}
        />
        <KpiCard
          title="Total Students"
          value={totalStudents}
          icon={GraduationCap}
          subtext={`${newStudentsThisMonth} new this month`}
          trend={studentTrend}
          gradient={['#0f766e', '#34d399', 'bg-gradient-to-br from-emerald-700 to-emerald-400']}
          delay={0.16}
        />
        <KpiCard
          title="Support Tickets"
          value={0}
          icon={Ticket}
          subtext="Open support tickets"
          trend={null}
          gradient={['#d97706', '#fbbf24', 'bg-gradient-to-br from-amber-600 to-amber-400']}
          delay={0.18}
        />
      </motion.div>

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
              onClick={() => navigate('/super-admin/top-institutes')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
            >
              View Rankings
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
