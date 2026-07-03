import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sparkles, Activity, Coins, Clock, Building2, Save,
  Loader2, Search, ChevronDown, Shield, AlertTriangle,
  TrendingUp, TrendingDown, Users, CheckCircle2, XCircle,
  Download, Eye, Bell, Info, SlidersHorizontal,
  RefreshCw, ChevronUp, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import schoolApi from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth-store';
import {
  getGlobalFeatureFlags,
  getInstituteUsageDetail,
  updateGlobalFeatureFlag,
  updateInstituteFeature,
  getRawAiLogs,
  getBillingReport,
  type RawAiLog,
  type BillingReportRow,
  type GlobalFeatureFlag,
  type InstituteUsageDetail,
  type InstituteFeatureDetail,
} from '@/lib/api/ai-usage-admin';
import { useAuth } from '@/context/SchoolAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/context/ConfirmContext';
import { Switch } from '@/components/ui/switch';

import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
// Sheet is still used by AuditLogSheet for the log detail pop-out

// ── Constants ──────────────────────────────────────────────────────────────────

const AI_FEATURES = [
  // ── Teacher features ───────────────────────────────────────────────────────
  { id: 'lecture_transcription', label: 'Lecture Transcription', category: 'teacher' },
  { id: 'ai_lecture_notes', label: 'AI Lecture Notes', category: 'teacher' },
  { id: 'in_video_quiz_generator', label: 'In-Video Quiz Generator', category: 'teacher' },
  { id: 'notes_image_enrichment', label: 'Notes Image Enrichment', category: 'teacher' },
  { id: 'retranscribe_regenerate', label: 'Retranscribe / Regenerate', category: 'teacher' },
  // ── Content Generation (9 types, each logged separately) ──────────────────
  { id: 'content_dpp', label: 'Daily Assessment (DPP)', category: 'content' },
  { id: 'content_mindmap', label: 'Mindmap', category: 'content' },
  { id: 'content_pyq', label: 'PYQ Practice', category: 'content' },
  { id: 'content_study_guide', label: 'Study Guide', category: 'content' },
  { id: 'content_key_concepts', label: 'Key Concepts', category: 'content' },
  { id: 'content_flashcard', label: 'Flashcards', category: 'content' },
  { id: 'content_revision_checklist', label: 'Revision Checklist', category: 'content' },
  { id: 'content_faq', label: 'FAQ', category: 'content' },
  // ── Student features ───────────────────────────────────────────────────────
  { id: 'doubt_resolver', label: 'Doubt Resolver', category: 'student' },
  { id: 'personalised_study_plan', label: 'Personalised Study Plan', category: 'student' },
  { id: 'career_guidance_report', label: 'Career Guidance Report', category: 'student' },
  { id: 'resume_analyser', label: 'Resume Analyser', category: 'student' },
  { id: 'interview_prep', label: 'Interview Prep', category: 'student' },
  // ── Shared features ────────────────────────────────────────────────────────
  { id: 'multilingual_translation', label: 'Multilingual Translation', category: 'shared' },
  { id: 'image_ocr_handwriting', label: 'Image OCR / Handwriting', category: 'shared' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  teacher: 'Teacher Features',
  content: 'Content Generation',
  student: 'Student Features',
  shared: 'Shared Features',
};

// Backwards-compat map for old/alternative feature IDs that may appear in logs
const FEATURE_LABELS: Record<string, string> = {
  // Content generation — old single-bucket ID kept for historical data
  content_generate: 'Content Generation (legacy)',
  // Individual content types (new, per-type logging)
  content_dpp: 'Daily Assessment (DPP)',
  content_mindmap: 'Mindmap',
  content_pyq: 'PYQ Practice',
  content_study_guide: 'Study Guide',
  content_key_concepts: 'Key Concepts',
  content_flashcard: 'Flashcards',
  content_revision_checklist: 'Revision Checklist',
  content_faq: 'FAQ',
  // Other legacy / alternative keys
  doubt_resolve: 'Doubt Resolver',
  image_ocr: 'Image OCR / Handwriting',
  tutor: 'AI Tutor',
  stt_transcribe: 'Lecture Transcription',
  stt_notes: 'Lecture Notes (audio)',
  notes_from_text: 'Notes from Transcript',
  notes_from_youtube: 'YouTube Notes',
  quiz_generate: 'Quiz Generation',
  translate: 'Multilingual Translation',
  plan_generate: 'Study Plan',
  syllabus_generate: 'Syllabus',
  test_generate: 'Mock Test',
  recommend: 'Recommendations',
  feedback: 'Feedback',
  notes_analyze: 'Notes Analysis',
  resume_analyze: 'Resume Analyser',
  interview: 'Interview Prep',
  career_guidance: 'Career Guidance Report',
  ai_doubt_solver: 'AI Doubt Solver',
  ai_notes_generator: 'AI Lecture Notes',
  ai_quiz_generator: 'AI Quiz Generator',
  ai_study_planner: 'AI Study Planner',
  ai_career_guidance: 'Career Guidance AI',
  topic_content_generation: 'Content Generation',
};

// Maps every known feature ID (old + new) → its display category
const FEATURE_CATEGORY_MAP: Record<string, 'teacher' | 'content' | 'student' | 'shared'> = {
  // Teacher
  lecture_transcription: 'teacher', ai_lecture_notes: 'teacher',
  in_video_quiz_generator: 'teacher', notes_image_enrichment: 'teacher',
  retranscribe_regenerate: 'teacher', stt_transcribe: 'teacher',
  stt_notes: 'teacher', notes_from_text: 'teacher', notes_from_youtube: 'teacher',
  quiz_generate: 'teacher', notes_analyze: 'teacher',
  ai_notes_generator: 'teacher', ai_quiz_generator: 'teacher',
  // Content Generation (new per-type + legacy bucket)
  content_generate: 'content', topic_content_generation: 'content',
  content_dpp: 'content', content_mindmap: 'content', content_pyq: 'content',
  content_study_guide: 'content', content_key_concepts: 'content',
  content_flashcard: 'content', content_revision_checklist: 'content',
  content_faq: 'content',
  // Student
  doubt_resolver: 'student', doubt_resolve: 'student', ai_doubt_solver: 'student',
  personalised_study_plan: 'student', plan_generate: 'student',
  career_guidance_report: 'student', career_guidance: 'student',
  ai_career_guidance: 'student', resume_analyser: 'student', resume_analyze: 'student',
  interview_prep: 'student', interview: 'student', ai_study_planner: 'student',
  syllabus_generate: 'student', test_generate: 'student',
  recommend: 'student', feedback: 'student',
  // Shared
  multilingual_translation: 'shared', image_ocr_handwriting: 'shared',
  image_ocr: 'shared', translate: 'shared', tutor: 'shared',
};

// Resolve category for any feature ID (API response or lookup)
function resolveCategory(featureId: string): 'teacher' | 'content' | 'student' | 'shared' {
  const fromConst = AI_FEATURES.find(x => x.id === featureId)?.category;
  if (fromConst) return fromConst as 'teacher' | 'content' | 'student' | 'shared';
  if (FEATURE_CATEGORY_MAP[featureId]) return FEATURE_CATEGORY_MAP[featureId];
  if (featureId.startsWith('content_')) return 'content';
  if (featureId.startsWith('stt_') || featureId.startsWith('notes_')) return 'teacher';
  return 'student';
}

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#14b8a6'];

// ── Helpers ────────────────────────────────────────────────────────────────────

const num = (v: unknown) => Number(v || 0);
const money = (v: unknown) => `$${num(v).toFixed(4)}`;
const moneyShort = (v: unknown) => `$${num(v).toFixed(2)}`;
const featureLabel = (f: string) => AI_FEATURES.find(x => x.id === f)?.label ?? FEATURE_LABELS[f] ?? f;
const pct = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0;

function successBadge(rate: number) {
  if (rate >= 95) return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold">{rate}%</Badge>;
  if (rate >= 80) return <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-semibold">{rate}%</Badge>;
  return <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-semibold">{rate}%</Badge>;
}

function latencyBadge(ms: number) {
  if (ms < 1000) return <span className="text-emerald-600 font-semibold">{ms}ms</span>;
  if (ms < 3000) return <span className="text-amber-600 font-semibold">{ms}ms</span>;
  return <span className="text-rose-600 font-semibold">{ms}ms</span>;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type PageTab = 'overview' | 'billing' | 'logs' | 'feature-control';
type SortKey = 'cost' | 'requests' | 'tokens' | 'latency' | 'successRate';
type SortDir = 'asc' | 'desc';

interface SchoolRow {
  institute_id: string;
  institute_name: string;
  requests: number;
  tokens: number;
  cost: number;
  avg_latency_ms?: number;
  success_rate?: number;
  last_activity?: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  school: string;
  message: string;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon, title, value, subtitle, tone = 'brand', trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  tone?: 'brand' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string; positive?: boolean };
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  const trendColor = trend?.positive === false
    ? 'text-rose-500' : trend?.positive === true ? 'text-emerald-500' : 'text-slate-400';
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`inline-flex rounded-xl p-2.5 ${tones[tone]}`}>{icon}</div>
        {trend && TrendIcon && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />{trend.label}
          </div>
        )}
      </div>
      <p className="mt-4 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-400">{title}</p>
      {subtitle && <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}
    </div>
  );
}

// ── Skeleton KPI ───────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="mt-4 h-7 w-24" />
      <Skeleton className="mt-1 h-3 w-32" />
    </div>
  );
}

// ── Filter Bar ─────────────────────────────────────────────────────────────────

function FilterBar({
  fromDate, toDate, search, featureFilter,
  onFromDate, onToDate, onSearch, onFeatureFilter, onClear,
}: {
  fromDate: string; toDate: string; search: string; featureFilter: string;
  onFromDate: (v: string) => void; onToDate: (v: string) => void;
  onSearch: (v: string) => void; onFeatureFilter: (v: string) => void;
  onClear: () => void;
}) {
  const isCoaching = useAuthStore(s => s.tenantType) === 'coaching';
  const hasFilters = fromDate || toDate || search || featureFilter;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <SlidersHorizontal size={15} className="shrink-0 text-slate-400" />

      {/* Date range */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm">
        <input
          type="date" value={fromDate} max={toDate || undefined}
          onChange={e => onFromDate(e.target.value)}
          className="bg-transparent text-sm font-medium text-slate-700 outline-none w-[130px]"
          aria-label="From date"
        />
        <span className="text-slate-300">→</span>
        <input
          type="date" value={toDate} min={fromDate || undefined}
          onChange={e => onToDate(e.target.value)}
          className="bg-transparent text-sm font-medium text-slate-700 outline-none w-[130px]"
          aria-label="To date"
        />
      </div>

      {/* Search school */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={e => onSearch(e.target.value)}
          placeholder={isCoaching ? "Search institute…" : "Search school…"}
          className="h-9 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-brand-400 w-44"
        />
      </div>

      {/* Feature filter */}
      <div className="relative">
        <select
          value={featureFilter}
          onChange={e => onFeatureFilter(e.target.value)}
          className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-brand-400"
        >
          <option value="">All Features</option>
          {AI_FEATURES.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
        >
          <RefreshCw size={12} /> Clear filters
        </button>
      )}
    </div>
  );
}

// ── School Detail View (full page) ────────────────────────────────────────────

function SchoolDetailView({
  schoolId, schoolName, onBack,
}: {
  schoolId: string; schoolName: string; onBack: () => void;
}) {
  const { toast } = useToast();
  const confirm = useConfirm();
  const tenantType = useAuthStore(s => s.tenantType);
  const isCoaching = tenantType === 'coaching';
  const productType = isCoaching ? 'coaching' : 'school';

  const [detail, setDetail] = useState<InstituteUsageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [limits, setLimits] = useState<Record<string, { req: string; cost: string }>>({});
  const [savingLimits, setSavingLimits] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'teacher' | 'content' | 'student' | 'shared' | ''>('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await getInstituteUsageDetail(schoolId, productType);
      setDetail(d);
      const apiMap = new Map(d.features.map(f => [f.featureId, f]));
      const t: Record<string, boolean> = {};
      const l: Record<string, { req: string; cost: string }> = {};
      // Seed toggles/limits for ALL known features (not just those with usage)
      AI_FEATURES.forEach(f => {
        const api = apiMap.get(f.id);
        t[f.id] = api?.isEnabled ?? true;
        l[f.id] = { req: api?.monthlyLimit != null ? String(api.monthlyLimit) : '', cost: '' };
      });
      // Also cover any API-returned features outside our list (legacy IDs)
      d.features.forEach(f => {
        if (!(f.featureId in t)) {
          t[f.featureId] = f.isEnabled;
          l[f.featureId] = { req: f.monthlyLimit != null ? String(f.monthlyLimit) : '', cost: '' };
        }
      });
      setToggles(t); setLimits(l);
      setActiveCategory('content');
    } catch { setError('Failed to load school details.'); }
    finally { setLoading(false); }
  }, [schoolId, productType]);

  useEffect(() => { void load(); }, [load]);

  const handleToggle = async (feature: InstituteFeatureDetail, next: boolean) => {
    if (!next) {
      const ok = await confirm({
        title: 'Disable Feature?', subtitle: isCoaching ? 'Institute-level override' : 'School-level override',
        message: `Disabling "${feature.featureLabel}" for ${schoolName} will block access immediately.`,
        confirmLabel: 'Disable', cancelLabel: 'Keep enabled', variant: 'destructive',
      });
      if (!ok) return;
    }
    setToggles(prev => ({ ...prev, [feature.featureId]: next }));
    try {
      await updateInstituteFeature(schoolId, feature.featureId, { product: productType, isEnabled: next });
      toast({ title: next ? 'Feature enabled' : 'Feature disabled' });
    } catch {
      setToggles(prev => ({ ...prev, [feature.featureId]: !next }));
      toast({ title: 'Failed to update feature', variant: 'destructive' });
    }
  };

  const handleSaveLimits = async () => {
    if (!detail) return;
    setSavingLimits(true);
    // Save ALL features in the current category tab (both used and unused)
    const toSave = grouped[activeCategory as string] ?? [];
    const tasks = toSave.map(f =>
      updateInstituteFeature(schoolId, f.featureId, {
        product: productType, isEnabled: toggles[f.featureId] ?? f.isEnabled,
        monthlyRequestLimit: limits[f.featureId]?.req ? Number(limits[f.featureId].req) : undefined,
        monthlyCostCap: limits[f.featureId]?.cost ? Number(limits[f.featureId].cost) : undefined,
      })
    );
    try {
      await Promise.all(tasks);
      toast({ title: 'Changes saved' });
      await load();
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }); }
    finally { setSavingLimits(false); }
  };

  // Merge API usage data with the full AI_FEATURES list so every feature is visible
  // even if the school hasn't used it yet (shows 0s, still allows toggle/limits).
  const mergedFeatures = useMemo((): InstituteFeatureDetail[] => {
    if (!detail) return [];
    const apiMap = new Map(detail.features.map(f => [f.featureId, f]));
    // All known features from our constant (in order)
    const fromConst: InstituteFeatureDetail[] = AI_FEATURES.map(f => {
      const api = apiMap.get(f.id);
      if (api) return api;
      return {
        featureId: f.id,
        featureLabel: f.label,
        category: f.category,
        requests: 0, tokens: 0, cost: 0, avgLatencyMs: 0,
        isEnabled: toggles[f.id] ?? true,
        monthlyLimit: null, currentUsage: 0, successRate: 0,
      };
    });
    // Aggregate legacy IDs that are superseded by per-type logging — hide from table
    const SKIP_IDS = new Set(['content_generate', 'topic_content_generation']);
    const knownIds = new Set(AI_FEATURES.map(f => f.id));
    const legacy = detail.features.filter(
      f => !knownIds.has(f.featureId as typeof AI_FEATURES[number]['id']) && !SKIP_IDS.has(f.featureId)
    );
    return [...fromConst, ...legacy];
  }, [detail, toggles]);

  const grouped = useMemo(() => {
    return mergedFeatures.reduce((acc, f) => {
      const cat = resolveCategory(f.featureId);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(f);
      return acc;
    }, {} as Record<string, InstituteFeatureDetail[]>);
  }, [mergedFeatures]);

  const chartData = useMemo(() => {
    return mergedFeatures
      .filter(f => f.requests > 0)
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)
      .map(f => {
        const label = featureLabel(f.featureId);
        return {
          name: label.length > 22 ? label.slice(0, 22) + '…' : label,
          requests: f.requests,
          tokens: num(f.tokens),
          cost: f.cost,
        };
      });
  }, [mergedFeatures]);

  const avgLatency = useMemo(() => {
    const active = mergedFeatures.filter(f => f.requests > 0);
    if (!active.length) return 0;
    const totalR = active.reduce((s, f) => s + f.requests, 0);
    if (!totalR) return 0;
    return Math.round(active.reduce((s, f) => s + f.avgLatencyMs * f.requests, 0) / totalR);
  }, [detail]);

  const activeFeatures = mergedFeatures.filter(f => f.requests > 0).length;

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-5 p-1 pb-12">
        <Skeleton className="h-8 w-36" />
        <div className="grid grid-cols-5 gap-3">{[1, 2, 3, 4, 5].map(i => <KpiSkeleton key={i} />)}</div>
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="space-y-4 p-1">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
          <ChevronLeft size={15} /> Back to Dashboard
        </button>
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-600">
          {error} <button onClick={() => void load()} className="ml-2 font-bold underline">Retry</button>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="space-y-5 p-1 pb-12">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            <ChevronLeft size={13} /> Back to Dashboard
          </button>
          <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-slate-900">
            <Building2 size={22} className="text-brand-500" />
            {schoolName}
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">{schoolId}</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={<Activity size={18} />} title="Total Requests" value={num(detail.totalRequests).toLocaleString()} tone="brand" />
        <KpiCard icon={<Sparkles size={18} />} title="Total Tokens" value={num(detail.totalTokens) >= 1_000_000 ? `${(num(detail.totalTokens) / 1_000_000).toFixed(1)}M` : num(detail.totalTokens).toLocaleString()} tone="violet" subtitle="Prompt + completion" />
        <KpiCard icon={<Coins size={18} />} title="Estimated Cost" value={moneyShort(detail.totalCost)} tone="amber" />
        <KpiCard icon={<CheckCircle2 size={18} />} title="Success Rate" value={`${num(detail.successRate)}%`} tone={num(detail.successRate) >= 95 ? 'emerald' : num(detail.successRate) >= 80 ? 'amber' : 'rose'} />
        <KpiCard icon={<Clock size={18} />} title="Avg Latency" value={`${avgLatency.toLocaleString()}ms`} tone="slate" />
        <KpiCard icon={<Activity size={18} />} title="Active Features" value={String(activeFeatures)} tone="brand" subtitle="features with usage" />
      </div>

      {/* ── Charts ── */}
      {chartData.some(d => d.requests > 0) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Requests by Feature</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="requests" name="Requests" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Tokens by Feature</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip formatter={(v: number) => [v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v), 'Tokens']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="tokens" name="Tokens" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Cost by Feature (USD)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v.toFixed(3)}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(4)}`, 'Cost']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Feature Detail Table ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-x-1 border-b border-slate-100 px-5 pt-4">
          {(['teacher', 'content', 'student', 'shared'] as const).map(cat => {
            const count = grouped[cat]?.length ?? 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`mr-4 pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeCategory === cat
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
              >
                {CATEGORY_LABELS[cat]}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${count > 0 ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-[10px] uppercase text-slate-400">
                <th className="px-5 py-3 font-semibold">Feature</th>
                <th className="px-4 py-3 text-right font-semibold">Requests</th>
                <th className="px-4 py-3 text-right font-semibold">Tokens</th>
                <th className="px-4 py-3 text-right font-semibold">Est. Cost</th>
                <th className="px-4 py-3 text-right font-semibold">Avg Latency</th>
                <th className="px-4 py-3 text-right font-semibold">Success Rate</th>
                <th className="px-4 py-3 text-right font-semibold">Req Limit / mo</th>
                <th className="px-4 py-3 text-right font-semibold">Budget Cap ($)</th>
                <th className="px-5 py-3 text-right font-semibold">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(grouped[activeCategory] ?? []).length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-sm text-slate-400">No features in this category.</td></tr>
              ) : (
                (grouped[activeCategory] ?? []).map(f => {
                  const enabled = toggles[f.featureId] ?? f.isEnabled;
                  const tokensVal = num(f.tokens);
                  return (
                    <tr key={f.featureId} className={`transition-colors hover:bg-slate-50/50 ${!enabled ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                          <span className="font-semibold text-slate-700">{featureLabel(f.featureId)}</span>
                        </div>
                        {f.monthlyLimit != null && f.monthlyLimit > 0 && (
                          <div className="mt-1.5 flex items-center gap-2 pl-4">
                            <Progress value={pct(f.currentUsage, f.monthlyLimit)} className="h-1 w-20" />
                            <span className="text-[10px] text-slate-400">{f.currentUsage}/{f.monthlyLimit}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{f.requests.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {tokensVal >= 1_000_000
                          ? <span className="font-semibold text-violet-600">{(tokensVal / 1_000_000).toFixed(2)}M</span>
                          : tokensVal >= 1_000
                            ? <span className="font-semibold text-violet-600">{(tokensVal / 1_000).toFixed(1)}K</span>
                            : <span className={tokensVal > 0 ? 'font-semibold text-violet-600' : 'text-slate-300'}>{tokensVal > 0 ? tokensVal.toLocaleString() : '—'}</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">{money(f.cost)}</td>
                      <td className="px-4 py-3 text-right">{latencyBadge(f.avgLatencyMs)}</td>
                      <td className="px-4 py-3 text-right">{successBadge(num(f.successRate))}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number" min="0" placeholder="Unlimited"
                          value={limits[f.featureId]?.req ?? ''}
                          onChange={e => setLimits(p => ({ ...p, [f.featureId]: { ...p[f.featureId], req: e.target.value } }))}
                          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-xs text-right outline-none focus:border-brand-400"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number" min="0" step="0.01" placeholder="No cap"
                          value={limits[f.featureId]?.cost ?? ''}
                          onChange={e => setLimits(p => ({ ...p, [f.featureId]: { ...p[f.featureId], cost: e.target.value } }))}
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs text-right outline-none focus:border-brand-400"
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Switch
                          checked={enabled}
                          onCheckedChange={next => void handleToggle(f, next)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-400">Limit/budget changes apply to all features visible above.</p>
          <button
            onClick={() => void handleSaveLimits()} disabled={savingLimits}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {savingLimits ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {savingLimits ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Audit Log Detail Sheet ─────────────────────────────────────────────────────

function AuditLogSheet({ log, open, onClose }: { log: RawAiLog | null; open: boolean; onClose: () => void }) {
  if (!log) return null;
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full max-w-lg overflow-y-auto" side="right">
        <SheetHeader className="pb-4 border-b border-slate-100">
          <SheetTitle className="text-sm font-black">Log Detail</SheetTitle>
          <p className="text-xs text-slate-400">{log.id}</p>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Feature', value: featureLabel(log.feature) },
              { label: 'Provider', value: log.provider || 'unknown' },
              { label: 'Model', value: log.model || '—' },
              { label: 'Status', value: log.success ? '✓ Success' : `✗ Failed (${log.status_code})` },
              { label: 'Prompt Tokens', value: num(log.prompt_tokens).toLocaleString() },
              { label: 'Completion Tokens', value: num(log.completion_tokens).toLocaleString() },
              { label: 'Total Tokens', value: num(log.total_tokens).toLocaleString() },
              { label: 'Est. Cost', value: money(log.est_cost) },
              { label: 'Latency', value: `${num(log.latency_ms)}ms` },
              { label: 'Timestamp', value: new Date(log.created_at).toLocaleString() },
            ].map(r => (
              <div key={r.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{r.label}</p>
                <p className={`mt-0.5 text-sm font-semibold ${r.label === 'Status' ? (log.success ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-800'}`}>{r.value}</p>
              </div>
            ))}
          </div>
          {/* TODO: Add prompt/response/trace_id fields when backend returns them */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-400">
            Prompt and response payloads are not included in the current log API response.
            Extend <code>/super-admin/ai-usage/logs</code> to include <code>prompt</code>, <code>response</code>, <code>trace_id</code>, <code>retry_count</code>.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

interface OverviewProps {
  loading: boolean;
  overview: Record<string, unknown> | null;
  features: Record<string, unknown>[];
  trend: Record<string, unknown>[];
  schools: SchoolRow[];
  filteredSchools: SchoolRow[];
  search: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  onViewSchool: (id: string, name: string) => void;
  isSuper: boolean;
}

function OverviewTab({
  loading, overview, features, trend, schools, filteredSchools,
  search, sortKey, sortDir, onSort, onViewSchool, isSuper,
}: OverviewProps) {
  const isCoaching = useAuthStore(s => s.tenantType) === 'coaching';
  const successRate = overview && num(overview.requests) > 0
    ? Math.round((num(overview.success) / num(overview.requests)) * 100) : 100;

  const trendData = useMemo(() => trend.map(d => {
    const dt = new Date(String(d.day));
    const date = Number.isNaN(dt.getTime())
      ? String(d.day).slice(5, 10)
      : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return { date, requests: num(d.requests), cost: num(d.cost) };
  }), [trend]);

  const pieData = useMemo(() =>
    features.slice(0, 20).map(f => ({
      name: featureLabel(String(f.feature)),
      value: num(f.cost),
    })).filter(f => f.value > 0),
    [features]);

  const totalCost = num(overview?.cost);
  const totalReq = num(overview?.requests);
  const totalTok = num(overview?.tokens);
  const avgLat = num(overview?.avg_latency_ms);

  // Derive alerts from school data
  const alerts: Alert[] = useMemo(() => {
    const a: Alert[] = [];
    schools.forEach(s => {
      const sr = num(s.success_rate);
      if (sr > 0 && sr < 70) {
        a.push({ id: `${s.institute_id}-fail`, severity: 'critical', school: s.institute_name, message: `High failure rate: ${sr}% success` });
      } else if (sr >= 70 && sr < 85) {
        a.push({ id: `${s.institute_id}-warn`, severity: 'warning', school: s.institute_name, message: `Below average success rate: ${sr}%` });
      }
      const lat = num(s.avg_latency_ms);
      if (lat > 5000) {
        a.push({ id: `${s.institute_id}-lat`, severity: 'warning', school: s.institute_name, message: `High latency: ${lat}ms average` });
      }
    });
    // Cost spike — top school cost > 50% of total
    if (schools.length > 1) {
      const top = [...schools].sort((a, b) => num(b.cost) - num(a.cost))[0];
      if (top && totalCost > 0 && num(top.cost) / totalCost > 0.5) {
        a.push({ id: `${top.institute_id}-spike`, severity: 'info', school: top.institute_name, message: `Accounts for ${Math.round((num(top.cost) / totalCost) * 100)}% of total AI cost` });
      }
    }
    return a.slice(0, 6);
  }, [schools, totalCost]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={<Users size={18} />} title={isCoaching ? "Active Institutes" : "Active Schools"}
          value={schools.length.toString()}
          subtitle="Using AI this period" tone="brand"
        />
        <KpiCard
          icon={<Activity size={18} />} title="Total Requests"
          value={totalReq.toLocaleString()}
          subtitle="AI API calls" tone="violet"
        />
        <KpiCard
          icon={<Sparkles size={18} />} title="Total Tokens"
          value={totalTok >= 1_000_000 ? `${(totalTok / 1_000_000).toFixed(1)}M` : totalTok.toLocaleString()}
          subtitle="Prompt + completion" tone="brand"
        />
        <KpiCard
          icon={<Coins size={18} />} title="Estimated Cost"
          value={moneyShort(totalCost)}
          subtitle="USD this period" tone="amber"
        />
        <KpiCard
          icon={<CheckCircle2 size={18} />} title="Success Rate"
          value={`${successRate}%`}
          subtitle="API success" tone={successRate >= 95 ? 'emerald' : successRate >= 80 ? 'amber' : 'rose'}
        />
        <KpiCard
          icon={<Clock size={18} />} title="Avg Latency"
          value={`${avgLat.toLocaleString()}ms`}
          subtitle="Per request" tone="slate"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={15} className="text-amber-500" />
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">AI Usage Alerts</h3>
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{alerts.length}</span>
          </div>
          <div className="space-y-2">
            {alerts.map(a => {
              const { bg, border, icon: Icon, textColor } = a.severity === 'critical'
                ? { bg: 'bg-rose-50', border: 'border-rose-100', icon: XCircle, textColor: 'text-rose-700' }
                : a.severity === 'warning'
                  ? { bg: 'bg-amber-50', border: 'border-amber-100', icon: AlertTriangle, textColor: 'text-amber-700' }
                  : { bg: 'bg-blue-50', border: 'border-blue-100', icon: Info, textColor: 'text-blue-700' };
              return (
                <div key={a.id} className={`flex items-start gap-3 rounded-xl border ${border} ${bg} px-4 py-3`}>
                  <Icon size={14} className={`mt-0.5 shrink-0 ${textColor}`} />
                  <div>
                    <p className={`text-xs font-bold ${textColor}`}>{a.school}</p>
                    <p className={`text-xs ${textColor} opacity-80`}>{a.message}</p>
                  </div>
                  <span className={`ml-auto text-[10px] font-bold uppercase ${textColor}`}>{a.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Daily Requests — Bar */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Daily Requests</h3>
          {trendData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="requests" name="Requests" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feature Cost — Pie */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Cost by Feature</h3>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No cost data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value">
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [moneyShort(v), 'Cost']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {pieData.length > 0 && (
            <div className="mt-2 space-y-1">
              {pieData.slice(0, 8).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-600 truncate max-w-[110px]">{d.name}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{moneyShort(d.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Cost — Line */}
      {trendData.some(d => d.cost > 0) && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Daily AI Cost (USD)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toFixed(2)}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(4)}`, 'Cost']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Feature Analytics Cards */}
      {features.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Feature Analytics</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.slice(0, 20).map(f => {
              const sr = num(f.success_rate ?? 100);
              return (
                <div key={String(f.feature)} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-black text-slate-700 truncate">{featureLabel(String(f.feature))}</p>
                  <div className="mt-3 space-y-2">
                    {[
                      { label: 'Requests', value: num(f.requests).toLocaleString() },
                      { label: 'Tokens', value: num(f.tokens).toLocaleString() },
                      { label: 'Est. Cost', value: moneyShort(f.cost) },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between text-xs">
                        <span className="text-slate-400">{r.label}</span>
                        <span className="font-bold text-slate-700">{r.value}</span>
                      </div>
                    ))}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Success</span>
                        <span className={`font-bold ${sr >= 95 ? 'text-emerald-600' : sr >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{sr}%</span>
                      </div>
                      <Progress value={sr} className="h-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Schools Table */}
      {isSuper && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-slate-400" />
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">{isCoaching ? "Top AI Consuming Institutes" : "Top AI Consuming Schools"}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{filteredSchools.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[10px] uppercase text-slate-400">
                  <th className="px-5 py-3 font-semibold">{isCoaching ? "Institute" : "School"}</th>
                  {([
                    ['requests', 'Requests'],
                    ['tokens', 'Tokens'],
                    ['cost', 'Est. Cost'],
                    ['successRate', 'Success'],
                    ['latency', 'Avg Latency'],
                  ] as [SortKey, string][]).map(([k, label]) => (
                    <th key={k} className="px-4 py-3 font-semibold text-right cursor-pointer select-none hover:text-slate-600" onClick={() => onSort(k)}>
                      <span className="inline-flex items-center gap-1 justify-end">
                        {label}
                        {sortKey === k ? (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />) : <ChevronDown size={11} className="opacity-30" />}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSchools.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400">{search ? (isCoaching ? 'No institutes match your search.' : 'No schools match your search.') : 'No AI usage this period.'}</td></tr>
                ) : (
                  filteredSchools.map(s => (
                    <tr key={s.institute_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Building2 size={13} />
                          </div>
                          <p className="font-semibold text-slate-700">{s.institute_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{num(s.requests).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{num(s.tokens).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">{moneyShort(s.cost)}</td>
                      <td className="px-4 py-3 text-right">{successBadge(num(s.success_rate))}</td>
                      <td className="px-4 py-3 text-right">{latencyBadge(num(s.avg_latency_ms))}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => onViewSchool(s.institute_id, s.institute_name)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredSchools.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-400">{filteredSchools.length} {isCoaching ? (filteredSchools.length !== 1 ? 'institutes' : 'institute') : (filteredSchools.length !== 1 ? 'schools' : 'school')} · Sorted by {sortKey}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Billing Tab ────────────────────────────────────────────────────────────────

function BillingTab({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const tenantType = useAuthStore(s => s.tenantType);
  const isCoaching = tenantType === 'coaching';
  const productType = isCoaching ? 'coaching' : 'school';

  const [rows, setRows] = useState<BillingReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterFeature, setFilterFeature] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getBillingReport(productType, fromDate || undefined, toDate || undefined);
      setRows(data);
    } catch { setError('Failed to load billing report.'); }
    finally { setLoading(false); }
  }, [fromDate, toDate, productType]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterSchool && !String(r.institute_name ?? '').toLowerCase().includes(filterSchool.toLowerCase())) return false;
    if (filterFeature && r.feature !== filterFeature) return false;
    return true;
  }), [rows, filterSchool, filterFeature]);

  const totals = useMemo(() => ({
    requests: filtered.reduce((s, r) => s + (Number(r.requests) || 0), 0),
    tokens: filtered.reduce((s, r) => s + (Number(r.tokens) || 0), 0),
    cost: filtered.reduce((s, r) => s + (Number(r.cost) || 0), 0),
  }), [filtered]);

  const exportCsv = () => {
    const header = `Month,${isCoaching ? 'Institute' : 'School'},Feature,Requests,Tokens,Est. Cost,Cost/Request\n`;
    const csv = filtered.map(r => {
      const cpr = r.requests > 0 ? (r.cost / r.requests) : 0;
      return `${r.month},"${r.institute_name || r.institute_id}","${featureLabel(r.feature)}",${r.requests},${r.tokens},${r.cost.toFixed(4)},${cpr.toFixed(6)}`;
    }).join('\n');
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `billing_report_${isCoaching ? 'institute' : 'school'}_${fromDate || 'all'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={filterSchool} onChange={e => setFilterSchool(e.target.value)} placeholder={isCoaching ? "Filter institute…" : "Filter school…"}
            className="h-9 rounded-xl border border-slate-200 pl-8 pr-3 text-sm outline-none focus:border-brand-400 w-44" />
        </div>
        <div className="relative">
          <select value={filterFeature} onChange={e => setFilterFeature(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-slate-200 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-brand-400">
            <option value="">All Features</option>
            {AI_FEATURES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <button onClick={exportCsv} disabled={filtered.length === 0}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading report…
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-600">{error} <button onClick={() => void load()} className="font-bold underline">Retry</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 sticky top-0">
                <tr className="text-left text-[10px] uppercase text-slate-400">
                  <th className="px-5 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">{isCoaching ? "Institute" : "School"}</th>
                  <th className="px-4 py-3 font-semibold">Feature</th>
                  <th className="px-4 py-3 text-right font-semibold">Requests</th>
                  <th className="px-4 py-3 text-right font-semibold">Tokens</th>
                  <th className="px-4 py-3 text-right font-semibold">Est. Cost</th>
                  <th className="px-5 py-3 text-right font-semibold">Cost/Req</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No billing data for this period.</td></tr>
                ) : (
                  filtered.map((r, i) => {
                    const cpr = r.requests > 0 ? r.cost / r.requests : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-slate-500 font-medium whitespace-nowrap">{r.month}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{r.institute_name || r.institute_id}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{featureLabel(r.feature)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{r.requests.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{r.tokens.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-black text-amber-600">{money(r.cost)}</td>
                        <td className="px-5 py-3 text-right text-slate-400 text-xs">{money(cpr)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">Grand Total</td>
                    <td className="px-4 py-3 text-right font-black text-slate-700">{totals.requests.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-700">{totals.tokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-amber-600">{moneyShort(totals.cost)}</td>
                    <td className="px-5 py-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Audit Logs Tab ─────────────────────────────────────────────────────────────

function AuditLogsTab({
  fromDate, toDate, schools, isSuper, onViewSchool,
}: {
  fromDate: string; toDate: string;
  schools: SchoolRow[]; isSuper: boolean;
  onViewSchool: (id: string, name: string) => void;
}) {
  const schoolNameMap = useMemo(
    () => new Map(schools.map(s => [s.institute_id, s.institute_name])),
    [schools]
  );
  const [logs, setLogs] = useState<RawAiLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterSchool, setFilterSchool] = useState('');
  const [filterFeature, setFilterFeature] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedLog, setSelectedLog] = useState<RawAiLog | null>(null);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const limit = 50;

  const tenantType = useAuthStore(s => s.tenantType);
  const isCoaching = tenantType === 'coaching';
  const productType = isCoaching ? 'coaching' : 'school';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRawAiLogs({
        instituteId: filterSchool || undefined,
        product: productType,
        feature: filterFeature || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit,
        offset: page * limit,
      }, isSuper);
      setLogs(res.data);
      setTotal(res.total);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filterSchool, filterFeature, fromDate, toDate, page, isSuper, productType]);

  useEffect(() => { setPage(0); }, [filterSchool, filterFeature, filterStatus, fromDate, toDate]);
  useEffect(() => { void load(); }, [load]);

  const filteredByStatus = useMemo(() => {
    if (!filterStatus) return logs;
    return logs.filter(l => filterStatus === 'success' ? l.success : !l.success);
  }, [logs, filterStatus]);

  const openLog = (log: RawAiLog) => { setSelectedLog(log); setLogSheetOpen(true); };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        {isSuper && (
          <div className="relative">
            <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)}
              className="h-9 appearance-none rounded-xl border border-slate-200 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-brand-400 max-w-[180px]">
              <option value="">{isCoaching ? "All Institutes" : "All Schools"}</option>
              {schools.map(s => <option key={s.institute_id} value={s.institute_id}>{s.institute_name}</option>)}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        )}
        <div className="relative">
          <select value={filterFeature} onChange={e => setFilterFeature(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-slate-200 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-brand-400">
            <option value="">All Features</option>
            {AI_FEATURES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-slate-200 pl-3 pr-8 text-sm text-slate-700 outline-none focus:border-brand-400">
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <button onClick={() => void load()} className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="mr-2 animate-spin" size={18} /> Fetching logs…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 sticky top-0">
                <tr className="text-left text-[10px] uppercase text-slate-400">
                  <th className="px-5 py-3 font-semibold">Timestamp</th>
                  {isSuper && <th className="px-4 py-3 font-semibold">{isCoaching ? "Institute" : "School"}</th>}
                  <th className="px-4 py-3 font-semibold">Feature</th>
                  <th className="px-4 py-3 font-semibold">Provider / Model</th>
                  <th className="px-4 py-3 text-right font-semibold">Prompt</th>
                  <th className="px-4 py-3 text-right font-semibold">Completion</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Tokens</th>
                  <th className="px-4 py-3 text-right font-semibold">Est. Cost</th>
                  <th className="px-4 py-3 text-right font-semibold">Latency</th>
                  <th className="px-5 py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredByStatus.length === 0 ? (
                  <tr><td colSpan={isSuper ? 10 : 9} className="py-12 text-center text-sm text-slate-400">No logs found.</td></tr>
                ) : (
                  filteredByStatus.map(log => (
                    <tr key={log.id} onClick={() => openLog(log)} className="hover:bg-slate-50/70 transition-colors cursor-pointer">
                      <td className="px-5 py-2.5 text-slate-500 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      {isSuper && (
                        <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                          {log.institute_id ? (
                            <button
                              onClick={e => { e.stopPropagation(); onViewSchool(log.institute_id, schoolNameMap.get(log.institute_id) ?? log.institute_id); }}
                              className="max-w-[140px] truncate font-semibold text-brand-600 hover:underline text-left"
                              title={schoolNameMap.get(log.institute_id) ?? log.institute_id}
                            >
                              {schoolNameMap.get(log.institute_id) ?? log.institute_id.slice(0, 12) + '…'}
                            </button>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                      )}
                      <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap text-xs">{featureLabel(log.feature)}</td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                        <span className="capitalize font-semibold text-slate-600">{log.provider || '—'}</span>
                        {log.model && <span className="ml-1 text-slate-400">({log.model})</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-500">{(log.prompt_tokens || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-500">{(log.completion_tokens || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold text-slate-700">{(log.total_tokens || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold text-amber-600">{money(log.est_cost)}</td>
                      <td className="px-4 py-2.5 text-right text-xs">{latencyBadge(num(log.latency_ms))}</td>
                      <td className="px-5 py-2.5 text-right">
                        {log.success
                          ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">Success</Badge>
                          : <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-[10px]">Failed {log.status_code ? `(${log.status_code})` : ''}</Badge>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs font-semibold text-slate-400">
              Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total.toLocaleString()} logs
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50">
                <ChevronLeft size={12} /> Previous
              </button>
              <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50">
                Next <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AuditLogSheet log={selectedLog} open={logSheetOpen} onClose={() => setLogSheetOpen(false)} />
    </div>
  );
}

// ── Feature Control Tab ────────────────────────────────────────────────────────

function FeatureControlTab() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const tenantType = useAuthStore(s => s.tenantType);
  const isCoaching = tenantType === 'coaching';
  const productType = isCoaching ? 'coaching' : 'school';

  const [flags, setFlags] = useState<GlobalFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setFlags(await getGlobalFeatureFlags(productType)); }
    catch { setError('Failed to load feature flags.'); }
    finally { setLoading(false); }
  }, [productType]);

  useEffect(() => { void load(); }, [load]);

  const handleToggle = async (flag: GlobalFeatureFlag, next: boolean) => {
    if (!next) {
      const ok = await confirm({
        title: `Disable ${flag.label}?`, subtitle: 'Global override',
        message: `Disabling "${flag.label}" will immediately block this feature for ALL ${isCoaching ? 'institutes' : 'schools'}.`,
        confirmLabel: 'Disable globally', cancelLabel: 'Cancel', variant: 'destructive',
      });
      if (!ok) return;
    }
    setFlags(prev => prev.map(f => f.featureId === flag.featureId ? { ...f, isEnabled: next } : f));
    try {
      await updateGlobalFeatureFlag(flag.featureId, productType, next);
      toast({ title: next ? `${flag.label} enabled globally` : `${flag.label} disabled globally` });
    } catch {
      setFlags(prev => prev.map(f => f.featureId === flag.featureId ? { ...f, isEnabled: !next } : f));
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5">
          <Skeleton className="mb-4 h-3 w-28" />
          {[1, 2, 3].map(j => (
            <div key={j} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <Skeleton className="h-4 w-48" /><Skeleton className="h-6 w-11" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-600">
      {error} <button onClick={() => void load()} className="ml-2 font-bold underline">Retry</button>
    </div>
  );

  const flagMap = new Map(flags.map(f => [f.featureId, f]));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm flex items-start gap-2">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-amber-700">
          <span className="font-bold">Master switches</span> — disabling a feature turns it OFF for all {isCoaching ? 'institutes' : 'schools'} immediately, regardless of individual {isCoaching ? 'institute' : 'school'} settings.
        </p>
      </div>

      {(['teacher', 'content', 'student', 'shared'] as const).map(cat => {
        const catFeatures = AI_FEATURES.filter(f => f.category === cat);
        return (
          <div key={cat} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{CATEGORY_LABELS[cat]}</p>
            <div className="divide-y divide-slate-50">
              {catFeatures.map(f => {
                const flag = flagMap.get(f.id);
                const enabled = flag?.isEnabled ?? true;
                return (
                  <div key={f.id} className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{f.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {enabled ? (isCoaching ? 'Available to all institutes' : 'Available to all schools') : (isCoaching ? 'Blocked for all institutes' : 'Blocked for all schools')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Switch checked={enabled} onCheckedChange={next => void handleToggle(
                        flag ?? { featureId: f.id, label: f.label, category: f.category, isEnabled: enabled }, next
                      )} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AiUsage() {
  const { user } = useAuth();
  const isSuper = String((user as Record<string, unknown>)?.role ?? '').toUpperCase() === 'SUPER_ADMIN';

  // Global filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchSchool, setSearchSchool] = useState('');
  const [featureFilter, setFeatureFilter] = useState('');

  // Tab
  const [activeTab, setActiveTab] = useState<PageTab>('overview');

  // Overview data
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [features, setFeatures] = useState<Record<string, unknown>[]>([]);
  const [trend, setTrend] = useState<Record<string, unknown>[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('cost');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // School detail view (full page)
  const [schoolDetailId, setSchoolDetailId] = useState<string | null>(null);
  const [schoolDetailName, setSchoolDetailName] = useState('');

  const tenantType = useAuthStore(s => s.tenantType);
  const isCoaching = tenantType === 'coaching';
  const productType = isCoaching ? 'coaching' : 'school';

  const vq = useMemo(() => {
    const p = new URLSearchParams({ vertical: productType });
    if (fromDate) p.set('from', fromDate);
    if (toDate) p.set('to', toDate);
    return `?${p.toString()}`;
  }, [fromDate, toDate, productType]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = isCoaching ? apiClient : schoolApi;
      
      const [ov, byF, tr] = await Promise.all([
        client.get(`/ai-usage/overview${vq}`),
        client.get(`/ai-usage/by-feature${vq}`),
        client.get(`/ai-usage/trend${vq}`),
      ]);
      setOverview((ov.data as { data?: Record<string, unknown> })?.data ?? null);
      setFeatures(((byF.data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[]);
      setTrend(((tr.data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[]);
      if (isSuper) {
        const inst = await client.get(`/ai-usage/by-institute${vq}`);
        const list = ((inst.data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[];
        setSchools(list.map(i => ({
          institute_id: String(i.institute_id ?? ''),
          institute_name: String(i.institute_name ?? i.institute_id ?? ''),
          requests: num(i.requests),
          tokens: num(i.tokens),
          cost: num(i.cost),
          avg_latency_ms: num(i.avg_latency_ms),
          success_rate: num(i.success_rate),
          last_activity: String(i.last_activity ?? ''),
        })));
      }
    } catch (e) {
      console.error('AI usage load error', e);
    } finally {
      setLoading(false);
    }
  }, [vq, isSuper]);

  useEffect(() => { void load(); }, [load]);

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const sortedFilteredSchools = useMemo(() => {
    let list = [...schools];
    if (searchSchool.trim()) {
      const q = searchSchool.toLowerCase();
      list = list.filter(s => s.institute_name.toLowerCase().includes(q));
    }
    if (featureFilter) {
      // Can't filter school table by feature without a different endpoint.
      // TODO: add ?feature= param to /ai-usage/by-institute when backend supports it.
    }
    const dir = sortDir === 'desc' ? -1 : 1;
    list.sort((a, b) => {
      if (sortKey === 'requests') return dir * (a.requests - b.requests);
      if (sortKey === 'tokens') return dir * (a.tokens - b.tokens);
      if (sortKey === 'latency') return dir * (num(a.avg_latency_ms) - num(b.avg_latency_ms));
      if (sortKey === 'successRate') return dir * (num(a.success_rate) - num(b.success_rate));
      return dir * (a.cost - b.cost);
    });
    return list;
  }, [schools, searchSchool, featureFilter, sortKey, sortDir]);

  const rangeLabel = fromDate && toDate && fromDate === toDate
    ? fromDate
    : fromDate || toDate
      ? `${fromDate || '…'} → ${toDate || 'now'}`
      : 'this month';

  const TABS: [PageTab, string][] = isSuper
    ? [['overview', 'Usage Overview'], ['billing', 'Billing Report'], ['logs', 'Audit Logs'], ['feature-control', 'Feature Control']]
    : [['overview', 'Usage Overview'], ['logs', 'Audit Logs']];

  const handleViewSchool = (id: string, name: string) => {
    setSchoolDetailId(id);
    setSchoolDetailName(name || id);
  };

  // ── School Detail full-page view ──
  if (schoolDetailId) {
    return (
      <SchoolDetailView
        schoolId={schoolDetailId}
        schoolName={schoolDetailName}
        onBack={() => { setSchoolDetailId(null); setSchoolDetailName(''); }}
      />
    );
  }

  return (
    <div className="space-y-5 p-1 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <Sparkles size={22} className="text-brand-500" />
            AI Analytics
          </h1>
          <p className="mt-0.5 text-sm font-medium text-slate-400">
            {isCoaching ? 'Institute AI usage dashboard' : 'School AI usage dashboard'} · {rangeLabel}
          </p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Global Filter Bar */}
      <FilterBar
        fromDate={fromDate} toDate={toDate} search={searchSchool} featureFilter={featureFilter}
        onFromDate={setFromDate} onToDate={setToDate} onSearch={setSearchSchool} onFeatureFilter={setFeatureFilter}
        onClear={() => { setFromDate(''); setToDate(''); setSearchSchool(''); setFeatureFilter(''); }}
      />

      {/* Tab Nav */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
        {TABS.map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${activeTab === tab ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
          >
            {tab === 'feature-control' && <Shield size={13} />}
            {tab === 'billing' && <Coins size={13} />}
            {tab === 'logs' && <Activity size={13} />}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          loading={loading}
          overview={overview}
          features={features}
          trend={trend}
          schools={schools}
          filteredSchools={sortedFilteredSchools}
          search={searchSchool}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onViewSchool={handleViewSchool}
          isSuper={isSuper}
        />
      )}
      {activeTab === 'billing' && isSuper && (
        <BillingTab fromDate={fromDate} toDate={toDate} />
      )}
      {activeTab === 'logs' && (
        <AuditLogsTab
          fromDate={fromDate} toDate={toDate}
          schools={schools} isSuper={isSuper}
          onViewSchool={handleViewSchool}
        />
      )}
      {activeTab === 'feature-control' && isSuper && (
        <FeatureControlTab />
      )}
    </div>
  );
}
