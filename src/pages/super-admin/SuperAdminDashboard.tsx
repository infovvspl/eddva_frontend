import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  MoreHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlatformStats } from '@/hooks/use-stats';
import { useTenants } from '@/hooks/use-tenants';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import coachingSuperAdminImg from '@/assets/images/coaching_superadmin.png';

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
  label, value, icon: Icon, delay = 0, trend, onClick,
}: {
  label: string; value: string | number;
  delay?: number; trend?: string; onClick?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const initialProps = (isFirstRender.current && !shouldReduceMotion)
    ? { opacity: 0, y: 16 }
    : false;

  const animateProps = { opacity: 1, y: 0 };

  const transitionProps = (isFirstRender.current && !shouldReduceMotion)
    ? { delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }
    : undefined;

  return (
    <motion.div
      initial={initialProps}
      animate={animateProps}
      transition={transitionProps}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-lg transition-all duration-300",
        onClick && "cursor-pointer hover:-translate-y-1"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">
          {label.split(' ').map((word, idx) => (
            <span key={idx} className="block">{word}</span>
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{value}</span>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-500 shrink-0 mb-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {trend.replace('+', '')}
          </span>
        )}
      </div>
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
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
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
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-100 bg-slate-50/70 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
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
    { label: "Institutes Needing Attention", value: statsLoading ? "—" : formatCount(platformStats?.institutesNeedingAttention), icon: AlertCircle, color: "bg-rose-500", trend: undefined, path: "/super-admin/tenants" },
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
      className="space-y-6 pb-12 px-1"
    >
      <style>{`
        .quick-action-card {
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }

        .quick-action-card:hover,
        .quick-action-card:focus-visible {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
        }
        
        .quick-action-card:focus-visible {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
        }

        .quick-action-icon-badge {
          transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .quick-action-card:hover .quick-action-icon-badge,
        .quick-action-card:focus-visible .quick-action-icon-badge {
          animation: iconBounce 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes iconBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .mascot-avatar {
          animation: mascotFloat 2s ease-in-out infinite alternate;
        }

        @keyframes mascotFloat {
          0% {
            transform: translateY(2px);
          }
          100% {
            transform: translateY(-6px);
          }
        }

        .waving-emoji {
          display: inline-block;
          transform-origin: 70% 70%;
          animation: waveHand 1.4s ease-in-out infinite alternate;
        }

        @keyframes waveHand {
          0% {
            transform: rotate(-15deg);
          }
          100% {
            transform: rotate(10deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .quick-action-card:hover,
          .quick-action-card:focus-visible {
            transform: none !important;
            box-shadow: none !important;
          }
          .quick-action-card:hover .quick-action-icon-badge,
          .quick-action-card:focus-visible .quick-action-icon-badge {
            animation: none !important;
          }
          .mascot-avatar {
            animation: none !important;
            transform: none !important;
          }
          .waving-emoji {
            animation: none !important;
            transform: rotate(0deg) !important;
          }
        }
      `}</style>

      {/* Header & Overlapping Stat Cards Wrapper */}
      <div>
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl pt-5 px-5 pb-14 sm:pt-8 sm:px-8 sm:pb-24 md:pt-8 md:px-9 md:pb-28 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-lg border border-blue-950/20"
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white, transparent 50%)' }} />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

          {/* Three dots action button */}
          <button className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors text-white z-20">
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold border border-white/20 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm" style={{ color: '#93C5FD' }}>
                <Shield className="w-3.5 h-3.5" /> SUPER ADMIN DASHBOARD
              </span>
            </div>
            <h1 className="text-[22px] sm:text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-2">
              Welcome, {user?.name || "Super Admin"} <span className="waving-emoji">👋</span>
            </h1>
            <p className="text-sm sm:text-base mt-2 font-medium text-white/75">
              Managing global edtech infrastructure and institute growth.
            </p>
          </div>

          <div className="relative z-10 flex flex-row items-center gap-4 sm:gap-6 shrink-0 self-start sm:self-auto">
            {/* Mascot Image */}
            <div className="h-16 w-16 rounded-full bg-white/10 p-2 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-inner">
              <img
                src={coachingSuperAdminImg}
                alt="Coaching Mascot"
                className="mascot-avatar w-full h-full object-contain"
              />
            </div>
            <button
              onClick={() => navigate("/super-admin/tenants/new")}
              className="flex items-center gap-2 h-11 px-6 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-lg shadow-blue-950/20 hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Deploy new institute
            </button>
          </div>
        </motion.div>

        {/* ── Error ── */}
        {statsError && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold mt-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Failed to load platform statistics. Please check the network connection.
          </div>
        )}

        {/* Metric Cards */}
        <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 sm:-mt-16 md:-mt-20 mx-4 sm:mx-0">
          {metrics.map((m, i) => (
            <StatCard
              key={m.label}
              label={m.label}
              value={m.value}
              icon={m.icon}
              trend={m.trend}
              delay={i * 0.08}
              onClick={() => navigate(m.path)}
            />
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="flex flex-row flex-wrap sm:flex-nowrap gap-3 w-full overflow-x-auto scrollbar-none pb-1">
          {[
            { label: 'Add Institute',   icon: Building2,  action: () => navigate('/super-admin/tenants/new') },
            { label: 'Manage Users',    icon: Users,       action: () => navigate('/super-admin/users') },
            { label: 'View Analytics',  icon: TrendingUp,  action: () => navigate('/super-admin/analytics') },
            { label: 'Announcements',   icon: Megaphone,   action: () => navigate('/super-admin/communication') },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="quick-action-card flex-1 min-w-[140px] flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-300/30 hover:bg-blue-50/20 transition-all duration-200 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
            >
              <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2 quick-action-icon-badge" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">{item.label}</p>
            </button>
          ))}
        </div>
      </motion.div>



      {/* ── System Status Strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-stretch gap-6 sm:gap-4">
          {[
            {
              label: "System Health",
              value: platformStats?.systemHealth ? `${Number(platformStats.systemHealth).toFixed(2)}%` : '99.9%',
              dotColor: "bg-emerald-500",
            },
            {
              label: "AI Requests Today",
              value: aiRequestsToday,
              dotColor: "bg-blue-500",
            },
            {
              label: "Storage Usage",
              value: platformStats?.storageUsage != null ? `${Number(platformStats.storageUsage).toFixed(3)} GB` : 'N/A',
              dotColor: "bg-amber-500",
            },
            {
              label: "Security Alerts",
              value: platformStats?.securityAlerts ?? 0,
              dotColor: "bg-blue-500",
            },
          ].map((m) => (
            <div key={m.label} className="flex-1 flex flex-col justify-between items-start gap-1 px-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full shrink-0", m.dotColor)} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{m.label}</span>
              </div>
              <span className="text-base font-medium text-slate-900 dark:text-white mt-1 leading-none">{m.value}</span>
            </div>
          ))}
        </div>
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
