import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Sparkles, Activity, Coins, Clock, Building2, Save, Trash2,
  Loader2, Search, ChevronDown, X, Shield, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api/school-client';
import {
  getGlobalFeatureFlags,
  getInstituteUsageDetail,
  updateGlobalFeatureFlag,
  updateInstituteFeature,
  type GlobalFeatureFlag,
  type InstituteUsageDetail,
  type InstituteFeatureDetail,
  type Product,
} from '@/lib/api/ai-usage-admin';
import { useAuth } from '@/context/SchoolAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/context/ConfirmContext';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from '@/components/ui/sheet';

// ── AI feature metadata (mirrors backend AI_FEATURES constant) ─────────────────
const AI_FEATURES = [
  { id: 'lecture_transcription',    label: 'Lecture Transcription',      category: 'teacher' },
  { id: 'ai_lecture_notes',         label: 'AI Lecture Notes',           category: 'teacher' },
  { id: 'in_video_quiz_generator',  label: 'In-Video Quiz Generator',    category: 'teacher' },
  { id: 'notes_image_enrichment',   label: 'Notes Image Enrichment',     category: 'teacher' },
  { id: 'retranscribe_regenerate',  label: 'Retranscribe / Regenerate',  category: 'teacher' },
  { id: 'doubt_resolver',           label: 'Doubt Resolver',             category: 'student' },
  { id: 'topic_content_generation', label: 'Topic Content Generation',   category: 'student' },
  { id: 'personalised_study_plan',  label: 'Personalised Study Plan',    category: 'student' },
  { id: 'career_guidance_report',   label: 'Career Guidance Report',     category: 'student' },
  { id: 'resume_analyser',          label: 'Resume Analyser',            category: 'student' },
  { id: 'interview_prep',           label: 'Interview Prep',             category: 'student' },
  { id: 'multilingual_translation', label: 'Multilingual Translation',   category: 'shared'  },
  { id: 'image_ocr_handwriting',    label: 'Image OCR / Handwriting',    category: 'shared'  },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  teacher: 'Teacher Features',
  student: 'Student Features',
  shared:  'Shared Features',
};

// ── Legacy label map for existing /school/ai-usage/* feature keys ──────────────
const FEATURE_LABELS: Record<string, string> = {
  doubt_resolve: 'Doubt Resolver', image_ocr: 'Image OCR / Handwriting', tutor: 'AI Tutor',
  content_generate: 'Content Generation', stt_transcribe: 'Lecture Transcription',
  stt_notes: 'Lecture Notes (audio)', notes_from_text: 'Notes from Transcript',
  notes_from_youtube: 'YouTube Notes', quiz_generate: 'Quiz Generation',
  translate: 'Multilingual Translation', plan_generate: 'Study Plan', syllabus_generate: 'Syllabus',
  test_generate: 'Mock Test', recommend: 'Recommendations', feedback: 'Feedback',
  notes_analyze: 'Notes Analysis', resume_analyze: 'Resume Analyser', interview: 'Interview Prep',
  career_guidance: 'Career Guidance Report',
  ai_doubt_solver: 'AI Doubt Solver', ai_notes_generator: 'AI Lecture Notes',
  ai_quiz_generator: 'AI Quiz Generator', ai_study_planner: 'AI Study Planner',
  ai_career_guidance: 'Career Guidance AI',
};

const featureLabel = (f: string) =>
  AI_FEATURES.find(x => x.id === f)?.label ?? FEATURE_LABELS[f] ?? f;

const num  = (v: unknown) => Number(v || 0);
const money = (v: unknown) => `$${num(v).toFixed(2)}`;

function toProduct(vertical: string): Product {
  if (vertical === 'school')   return 'school';
  if (vertical === 'coaching') return 'coaching';
  return 'all';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, tone = 'brand' }: {
  icon: React.ReactNode; label: string; value: string; tone?: string;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600', emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-xl p-2 ${tones[tone] ?? tones.brand}`}>{icon}</div>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-2 py-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// ── Institute Detail Sheet ─────────────────────────────────────────────────────

interface FeatureToggleState {
  [featureId: string]: boolean;
}

function InstituteDetailSheet({
  instituteId, instituteName, product, open, onClose,
}: {
  instituteId: string; instituteName: string; product: Product;
  open: boolean; onClose: () => void;
}) {
  const { toast } = useToast();
  const confirm  = useConfirm();

  const [detail, setDetail]   = useState<InstituteUsageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [toggles, setToggles] = useState<FeatureToggleState>({});
  const [savingLimits, setSavingLimits] = useState(false);
  const [limits, setLimits]   = useState<Record<string, { req: string; cost: string }>>({});

  const loadDetail = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true); setError('');
    try {
      const d = await getInstituteUsageDetail(
        instituteId, product === 'all' ? 'school' : product,
      );
      setDetail(d);
      const t: FeatureToggleState = {};
      const l: Record<string, { req: string; cost: string }> = {};
      d.features.forEach((f) => {
        t[f.featureId] = f.isEnabled;
        l[f.featureId] = {
          req: f.monthlyLimit != null ? String(f.monthlyLimit) : '',
          cost: '',
        };
      });
      setToggles(t);
      setLimits(l);
    } catch {
      setError('Failed to load institute details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [instituteId, product]);

  useEffect(() => { if (open) void loadDetail(); }, [open, loadDetail]);

  const handleToggle = async (feature: InstituteFeatureDetail, next: boolean) => {
    if (!next) {
      const ok = await confirm({
        title: 'Disable Feature?',
        subtitle: 'Institute-level override',
        message: `Disabling "${feature.featureLabel}" for ${instituteName} will prevent their users from accessing this feature.`,
        confirmLabel: 'Disable',
        cancelLabel: 'Keep enabled',
        variant: 'destructive',
      });
      if (!ok) return;
    }
    // Optimistic update
    setToggles(prev => ({ ...prev, [feature.featureId]: next }));
    try {
      await updateInstituteFeature(instituteId, feature.featureId, {
        product: product === 'all' ? 'school' : product as 'school' | 'coaching',
        isEnabled: next,
      });
      toast({ title: next ? 'Feature enabled' : 'Feature disabled' });
    } catch {
      // Revert
      setToggles(prev => ({ ...prev, [feature.featureId]: !next }));
      toast({ title: 'Failed to update feature', variant: 'destructive' });
    }
  };

  const handleSaveLimits = async () => {
    if (!detail) return;
    setSavingLimits(true);
    const p = product === 'all' ? 'school' : product as 'school' | 'coaching';
    const tasks = detail.features
      .filter(f => limits[f.featureId]?.req !== '' || limits[f.featureId]?.cost !== '')
      .map(f => updateInstituteFeature(instituteId, f.featureId, {
        product: p,
        isEnabled: toggles[f.featureId] ?? f.isEnabled,
        monthlyRequestLimit: limits[f.featureId]?.req
          ? Number(limits[f.featureId].req) : undefined,
        monthlyCostCap: limits[f.featureId]?.cost
          ? Number(limits[f.featureId].cost) : undefined,
      }));
    try {
      await Promise.all(tasks);
      toast({ title: 'Limits saved successfully' });
      await loadDetail();
    } catch {
      toast({ title: 'Failed to save some limits', variant: 'destructive' });
    } finally {
      setSavingLimits(false);
    }
  };

  const grouped = useMemo(() => {
    if (!detail) return {} as Record<string, InstituteFeatureDetail[]>;
    return detail.features.reduce((acc, f) => {
      const cat = AI_FEATURES.find(x => x.id === f.featureId)?.category ?? 'shared';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(f);
      return acc;
    }, {} as Record<string, InstituteFeatureDetail[]>);
  }, [detail]);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-lg"
        // suppress the default close button from SheetContent so we use our own
        onInteractOutside={onClose}
      >
        <SheetHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-black text-slate-900">{instituteName}</SheetTitle>
              <p className="mt-0.5 text-xs font-medium text-slate-400">AI Feature Usage &amp; Control</p>
              {detail && (
                <p className="mt-1 text-xs text-slate-500">
                  This month: <span className="font-bold">{num(detail.totalRequests).toLocaleString()} req</span>
                  {' · '}<span className="font-bold text-amber-600">{money(detail.totalCost)}</span>
                  {' · '}<span className="font-bold text-emerald-600">{num(detail.successRate)}% success</span>
                </p>
              )}
            </div>
            <SheetClose asChild>
              <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-6 pb-24">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2 rounded-xl border border-slate-100 p-4">
                  <Skeleton className="h-3 w-24" />
                  {[1, 2].map(j => (
                    <div key={j} className="flex items-center justify-between py-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-6 w-11" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
              {error}
              <button onClick={() => void loadDetail()} className="ml-2 font-bold underline">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {(['teacher', 'student', 'shared'] as const).map(cat => {
                const catFeatures = grouped[cat];
                if (!catFeatures?.length) return null;
                return (
                  <div key={cat}>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {CATEGORY_LABELS[cat]}
                    </p>
                    <div className="space-y-2">
                      {catFeatures.map(f => (
                        <div key={f.featureId}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                          <div>
                            <p className={`text-sm font-bold ${f.requests === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
                              {f.featureLabel}
                            </p>
                            {f.requests > 0 ? (
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                {num(f.requests).toLocaleString()} req
                                {' · '}{money(f.cost)}
                                {' · '}avg {num(f.avgLatencyMs)}ms
                              </p>
                            ) : (
                              <p className="mt-0.5 text-[11px] text-slate-300">No usage this period</p>
                            )}
                          </div>
                          <Switch
                            checked={toggles[f.featureId] ?? f.isEnabled}
                            onCheckedChange={(next) => void handleToggle(f, next)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Limits */}
              {detail.features.some(f => toggles[f.featureId] ?? f.isEnabled) && (
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Monthly Limits
                  </p>
                  <div className="space-y-3">
                    {detail.features
                      .filter(f => toggles[f.featureId] ?? f.isEnabled)
                      .map(f => {
                        const pct = f.monthlyLimit && f.monthlyLimit > 0
                          ? Math.min(100, Math.round((f.currentUsage / f.monthlyLimit) * 100))
                          : 0;
                        const barColor = pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500';
                        return (
                          <div key={f.featureId}
                            className="rounded-xl border border-slate-100 bg-white p-4">
                            <p className="mb-2 text-xs font-bold text-slate-600">{f.featureLabel}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400">Req limit/mo</label>
                                <input
                                  type="number"
                                  placeholder="Unlimited"
                                  value={limits[f.featureId]?.req ?? ''}
                                  onChange={e => setLimits(prev => ({
                                    ...prev,
                                    [f.featureId]: { ...prev[f.featureId], req: e.target.value },
                                  }))}
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400">Cost cap/mo ($)</label>
                                <input
                                  type="number"
                                  placeholder="Unlimited"
                                  value={limits[f.featureId]?.cost ?? ''}
                                  onChange={e => setLimits(prev => ({
                                    ...prev,
                                    [f.featureId]: { ...prev[f.featureId], cost: e.target.value },
                                  }))}
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-brand-400"
                                />
                              </div>
                            </div>
                            {f.monthlyLimit != null && f.monthlyLimit > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>{f.currentUsage} used</span>
                                  <span>{f.monthlyLimit} limit</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                  <div className={`h-full rounded-full ${barColor}`}
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => void handleSaveLimits()}
                    disabled={savingLimits}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {savingLimits ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {savingLimits ? 'Saving…' : 'Save Limits'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Global Feature Control Tab ─────────────────────────────────────────────────

function FeatureControlTab({ product }: { product: Product }) {
  const { toast } = useToast();
  const confirm   = useConfirm();

  const [flags, setFlags]     = useState<GlobalFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setFlags(await getGlobalFeatureFlags(product));
    } catch {
      setError('Failed to load feature flags.');
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => { void load(); }, [load]);

  const handleGlobalToggle = async (flag: GlobalFeatureFlag, next: boolean) => {
    const p: 'school' | 'coaching' = product === 'coaching' ? 'coaching' : 'school';
    if (!next) {
      const ok = await confirm({
        title: `Disable ${flag.label}?`,
        subtitle: 'Global override',
        message: `Disabling "${flag.label}" will block this feature for ALL schools immediately, regardless of individual settings.`,
        confirmLabel: 'Disable globally',
        cancelLabel: 'Cancel',
        variant: 'destructive',
      });
      if (!ok) return;
    }
    // Optimistic
    setFlags(prev => prev.map(f => f.featureId === flag.featureId ? { ...f, isEnabled: next } : f));
    try {
      await updateGlobalFeatureFlag(flag.featureId, p, next);
      toast({ title: next ? `${flag.label} enabled globally` : `${flag.label} disabled globally` });
    } catch {
      setFlags(prev => prev.map(f => f.featureId === flag.featureId ? { ...f, isEnabled: !next } : f));
      toast({ title: 'Failed to update feature flag', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <Skeleton className="mb-4 h-3 w-28" />
            {[1, 2, 3].map(j => (
              <div key={j} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-6 w-11" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-600">
        {error}
        <button onClick={() => void load()} className="ml-2 font-bold underline">Retry</button>
      </div>
    );
  }

  const flagMap = new Map(flags.map(f => [f.featureId, f]));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-amber-700">
            <span className="font-bold">Master switches</span> — disabling a feature here turns it
            OFF for <span className="font-bold">all schools</span>, regardless of individual settings.
          </p>
        </div>
      </div>

      {(['teacher', 'student', 'shared'] as const).map(cat => {
        const catFeatures = AI_FEATURES.filter(f => f.category === cat);
        return (
          <div key={cat} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="divide-y divide-slate-50">
              {catFeatures.map(f => {
                const flag = flagMap.get(f.id);
                const enabled = flag?.isEnabled ?? true;
                return (
                  <div key={f.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{f.label}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold ${enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(next) => void handleGlobalToggle(
                          flag ?? { featureId: f.id, label: f.label, category: f.category, isEnabled: enabled },
                          next,
                        )}
                      />
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

type PageTab = 'overview' | 'feature-control';
type SortKey = 'cost' | 'requests';

export default function AiUsage() {
  const { user } = useAuth();
  const isSuper = String((user as Record<string, unknown>)?.role ?? '').toUpperCase() === 'SUPER_ADMIN';

  const [vertical, setVertical]   = useState<string>('school');
  const [loading, setLoading]     = useState(true);
  const [overview, setOverview]   = useState<Record<string, unknown> | null>(null);
  const [features, setFeatures]   = useState<Record<string, unknown>[]>([]);
  const [trend, setTrend]         = useState<Record<string, unknown>[]>([]);
  const [institutes, setInstitutes] = useState<Record<string, unknown>[]>([]);
  const [allInstitutes, setAllInstitutes] = useState<Record<string, unknown>[]>([]);
  const [me, setMe]               = useState<Record<string, unknown> | null>(null);

  // Quota editor
  const [qInstitute, setQInstitute] = useState('');
  const [qFeature, setQFeature]   = useState('*');
  const [qLimit, setQLimit]       = useState('');
  const [quotas, setQuotas]       = useState<Record<string, unknown>[]>([]);
  const [savingQuota, setSavingQuota] = useState(false);

  // Super-admin extras
  const [activeTab, setActiveTab]   = useState<PageTab>('overview');
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState<SortKey>('cost');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<{ id: string; name: string } | null>(null);

  // Date range filter (YYYY-MM-DD). Empty = backend default (current month).
  // For a single day, set both `fromDate` and `toDate` to that date.
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');

  const vq = useMemo(() => {
    const p = new URLSearchParams();
    if (vertical) p.set('vertical', vertical);
    if (fromDate) p.set('from', fromDate);
    if (toDate)   p.set('to', toDate);
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [vertical, fromDate, toDate]);

  const rangeLabel = fromDate && toDate && fromDate === toDate
    ? fromDate
    : fromDate || toDate
      ? `${fromDate || '…'} → ${toDate || 'now'}`
      : 'this month';

  const load = async () => {
    setLoading(true);
    try {
      const [ov, byF, tr] = await Promise.all([
        api.get(`/ai-usage/overview${vq}`),
        api.get(`/ai-usage/by-feature${vq}`),
        api.get(`/ai-usage/trend${vq}`),
      ]);
      setOverview((ov.data as { data?: Record<string, unknown> })?.data ?? null);
      setFeatures(((byF.data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[]);
      setTrend(((tr.data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[]);
      if (isSuper) {
        const inst = await api.get(`/ai-usage/by-institute${vq}`);
        setInstitutes(((inst.data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[]);
        try {
          const all = await api.get('/institutes', { params: { perPage: 1000 } });
          const raw = (all.data as { data?: unknown })?.data;
          const list = Array.isArray(raw) ? raw : ((raw as { items?: unknown[] })?.items ?? []);
          setAllInstitutes((list as Record<string, unknown>[]).map(i => ({
            institute_id: i.id, institute_name: i.name, vertical: 'school',
          })));
        } catch { setAllInstitutes([]); }
      } else {
        const mine = await api.get(`/ai-usage/me${vq}`);
        setMe((mine.data as { data?: Record<string, unknown> })?.data ?? null);
      }
    } catch (e) {
      console.error('Failed to load AI usage', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [vertical, fromDate, toDate]);

  const maxReq = useMemo(() => Math.max(1, ...features.map(f => num(f.requests))), [features]);

  const quotaInstituteOptions = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    [...allInstitutes, ...institutes].forEach(i => {
      const id = i.institute_id as string;
      if (id && !map.has(id)) map.set(id, i);
    });
    return [...map.values()];
  }, [allInstitutes, institutes]);

  const loadQuotas = async (instituteId: string) => {
    if (!instituteId) { setQuotas([]); return; }
    try {
      const r = await api.get(`/ai-usage/quotas?instituteId=${instituteId}&vertical=${vertical || 'school'}`);
      setQuotas(((r.data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[]);
    } catch { setQuotas([]); }
  };

  const saveQuota = async () => {
    if (!qInstitute || qLimit === '') { alert('Pick an institute and enter a limit'); return; }
    setSavingQuota(true);
    try {
      await api.post('/ai-usage/quotas', {
        instituteId: qInstitute, vertical: vertical || 'school',
        feature: qFeature, monthlyLimit: Number(qLimit),
      });
      setQLimit('');
      await loadQuotas(qInstitute);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message ?? 'Failed to save quota');
    } finally { setSavingQuota(false); }
  };

  const deleteQuota = async (feature: string) => {
    try {
      await api.delete('/ai-usage/quotas', {
        data: { instituteId: qInstitute, vertical: vertical || 'school', feature },
      });
      await loadQuotas(qInstitute);
    } catch (e) { console.error(e); }
  };

  const successRate = overview && num(overview.requests) > 0
    ? Math.round((num(overview.success) / num(overview.requests)) * 100) : 100;

  // Filter + sort institute table
  const filteredInstitutes = useMemo(() => {
    let list = [...institutes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        String(i.institute_name ?? '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) =>
      sort === 'requests'
        ? num(b.requests) - num(a.requests)
        : num(b.cost) - num(a.cost)
    );
    return list;
  }, [institutes, search, sort]);

  const trendData = useMemo(
    () => trend.map(d => {
      const dt = new Date(String(d.day));
      // Format in UTC so the day matches the backend's stored bucket (avoids off-by-one
      // from local-timezone conversion); fall back to the raw date portion if unparseable.
      const date = Number.isNaN(dt.getTime())
        ? String(d.day).slice(5, 10)
        : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      return { date, requests: num(d.requests) };
    }),
    [trend],
  );

  const product = toProduct(vertical);

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <Sparkles className="text-brand-500" /> AI Usage
          </h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {isSuper ? 'Platform-wide AI usage across all institutes' : 'Your institute\'s AI usage'} · {rangeLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range filter — set From and To to the same day to view a single date */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={e => setFromDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
              aria-label="From date"
            />
            <span className="text-slate-300">→</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={e => setToDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
              aria-label="To date"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
          {isSuper && (
            <select
              value={vertical}
              onChange={e => setVertical(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400"
            >
              <option value="school">School</option>
            </select>
          )}
        </div>
      </div>

      {/* Super-admin tab nav */}
      {isSuper && (
        <div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
          {([ ['overview', 'Usage Overview'], ['feature-control', 'Feature Control'] ] as [PageTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab === 'feature-control' && <Shield size={14} />}
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Feature Control Tab ── */}
      {isSuper && activeTab === 'feature-control' && (
        <FeatureControlTab product={product} />
      )}

      {/* ── Usage Overview ── */}
      {(!isSuper || activeTab === 'overview') && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400">
              <Loader2 className="mr-2 animate-spin" /> Loading usage…
            </div>
          ) : (
            <>
              {/* Overview cards */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard icon={<Activity size={18} />} label="Total AI requests"
                  value={num(overview?.requests).toLocaleString()} tone="brand" />
                <StatCard icon={<Activity size={18} />} label="Success rate"
                  value={`${successRate}%`} tone="emerald" />
                <StatCard icon={<Sparkles size={18} />} label="Tokens used"
                  value={num(overview?.tokens).toLocaleString()} tone="violet" />
                <StatCard icon={<Coins size={18} />} label="Est. cost"
                  value={money(overview?.cost)} tone="amber" />
                <StatCard icon={<Clock size={18} />} label="Avg latency"
                  value={`${num(overview?.avg_latency_ms).toLocaleString()} ms`} tone="slate" />
              </div>

              {/* Feature breakdown */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Usage by feature</h3>
                {features.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">No AI usage recorded yet this month.</p>
                ) : (
                  <div className="space-y-3">
                    {features.map(f => {
                      const limit     = (me?.features as { feature: string; limit?: number }[])?.find(x => x.feature === f.feature)?.limit;
                      const remaining = (me?.features as { feature: string; remaining?: number }[])?.find(x => x.feature === f.feature)?.remaining;
                      return (
                        <div key={String(f.feature)}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-bold text-slate-700">{featureLabel(String(f.feature))}</span>
                            <span className="flex items-center gap-3 text-xs text-slate-400">
                              <span>{num(f.requests).toLocaleString()} req</span>
                              <span>{num(f.tokens).toLocaleString()} tok</span>
                              <span className="font-semibold text-amber-600">{money(f.cost)}</span>
                              {limit != null && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">
                                  {remaining}/{limit} left
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-brand-500"
                              style={{ width: `${(num(f.requests) / maxReq) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Daily trend — recharts BarChart */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Daily requests</h3>
                {trendData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No usage data for this period yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                        cursor={{ fill: '#f1f5f9' }}
                      />
                      <Bar dataKey="requests" name="Requests" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Super-admin sections */}
              {isSuper && (
                <>
                  {/* Usage by institute table */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                        <Building2 size={15} />
                        Usage by {vertical === 'coaching' ? 'institute' : 'school'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search schools…"
                            className="w-48 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-400"
                          />
                        </div>
                        <div className="relative">
                          <select
                            value={sort}
                            onChange={e => setSort(e.target.value as SortKey)}
                            className="appearance-none rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-sm font-semibold outline-none focus:border-brand-400"
                          >
                            <option value="cost">Sort: Cost</option>
                            <option value="requests">Sort: Requests</option>
                          </select>
                          <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {filteredInstitutes.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-400">
                        {institutes.length === 0 ? 'No AI usage recorded yet this period.' : 'No schools match your search.'}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                              <th className="pb-2 pr-4">School</th>
                              <th className="pb-2 pr-4 text-right">Requests</th>
                              <th className="pb-2 pr-4 text-right">Tokens</th>
                              <th className="pb-2 pr-4 text-right">Est. cost</th>
                              <th className="pb-2 pr-4 text-right">Vertical</th>
                              <th className="pb-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredInstitutes.map(i => (
                              <tr
                                key={`${String(i.institute_id)}-${String(i.vertical)}`}
                                className="border-b border-slate-50 last:border-0"
                              >
                                <td className="py-3 pr-4 font-semibold text-slate-700">
                                  {String(i.institute_name ?? i.institute_id ?? '—')}
                                </td>
                                <td className="py-3 pr-4 text-right text-slate-600">
                                  {num(i.requests).toLocaleString()}
                                </td>
                                <td className="py-3 pr-4 text-right text-slate-500">
                                  {num(i.tokens).toLocaleString()}
                                </td>
                                <td className="py-3 pr-4 text-right font-semibold text-amber-600">
                                  {money(i.cost)}
                                </td>
                                <td className="py-3 pr-4 text-right">
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                                    {String(i.vertical)}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedInst({
                                        id: String(i.institute_id),
                                        name: String(i.institute_name ?? i.institute_id),
                                      });
                                      setDetailOpen(true);
                                    }}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Quota editor */}
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Monthly quotas</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <select
                        value={qInstitute}
                        onChange={e => { setQInstitute(e.target.value); void loadQuotas(e.target.value); }}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                      >
                        <option value="">Select institute…</option>
                        {quotaInstituteOptions.map(i => (
                          <option key={`${String(i.institute_id)}-${String(i.vertical)}`} value={String(i.institute_id)}>
                            {String(i.institute_name)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={qFeature}
                        onChange={e => setQFeature(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                      >
                        <option value="*">All features (total)</option>
                        {Object.keys(FEATURE_LABELS).map(f => (
                          <option key={f} value={f}>{featureLabel(f)}</option>
                        ))}
                      </select>
                      <input
                        type="number" value={qLimit} onChange={e => setQLimit(e.target.value)}
                        placeholder="Monthly request limit"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                      />
                      <button
                        onClick={() => void saveQuota()} disabled={savingQuota}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        <Save size={15} /> {savingQuota ? 'Saving…' : 'Set limit'}
                      </button>
                    </div>
                    {qInstitute && (
                      <div className="mt-4">
                        {quotas.length === 0 ? (
                          <p className="text-xs text-slate-400">No quotas set — AI usage is unlimited.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {quotas.map(q => (
                              <span
                                key={String(q.feature)}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                              >
                                {q.feature === '*' ? 'All features' : featureLabel(String(q.feature))}: {num(q.monthly_limit).toLocaleString()}/mo
                                <button onClick={() => void deleteQuota(String(q.feature))} className="text-slate-300 hover:text-rose-500">
                                  <Trash2 size={13} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="mt-3 text-xs text-slate-400">
                      When an institute hits its monthly limit, AI calls for that feature are blocked until next month or the limit is raised.
                    </p>
                  </div>
                </>
              )}

              {/* Institute-admin "my usage" section */}
              {!isSuper && me && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Your monthly usage</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div><p className="text-xs text-slate-400">Requests</p><p className="text-lg font-black text-slate-900">{num((me.overview as Record<string, unknown>)?.requests).toLocaleString()}</p></div>
                    <div><p className="text-xs text-slate-400">Tokens</p><p className="text-lg font-black text-slate-900">{num((me.overview as Record<string, unknown>)?.tokens).toLocaleString()}</p></div>
                    <div><p className="text-xs text-slate-400">Est. cost</p><p className="text-lg font-black text-amber-600">{money((me.overview as Record<string, unknown>)?.cost)}</p></div>
                    <div><p className="text-xs text-slate-400">Avg latency</p><p className="text-lg font-black text-slate-900">{num((me.overview as Record<string, unknown>)?.avg_latency_ms)}ms</p></div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Institute detail sheet */}
      {selectedInst && (
        <InstituteDetailSheet
          instituteId={selectedInst.id}
          instituteName={selectedInst.name}
          product={product}
          open={detailOpen}
          onClose={() => { setDetailOpen(false); setSelectedInst(null); }}
        />
      )}
    </div>
  );
}
