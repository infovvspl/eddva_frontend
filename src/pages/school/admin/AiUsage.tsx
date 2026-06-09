import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Activity, Coins, Clock, Building2, Save, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';

const FEATURE_LABELS: Record<string, string> = {
  doubt_resolve: 'Doubt Resolver',
  image_ocr: 'Image OCR',
  tutor: 'AI Tutor',
  content_generate: 'Content Generation',
  stt_transcribe: 'Transcription',
  stt_notes: 'Lecture Notes (audio)',
  notes_from_text: 'Notes from Transcript',
  notes_from_youtube: 'YouTube Notes',
  quiz_generate: 'Quiz Generation',
  translate: 'Translation',
  plan_generate: 'Study Plan',
  syllabus_generate: 'Syllabus',
  test_generate: 'Mock Test',
  recommend: 'Recommendations',
  feedback: 'Feedback',
  notes_analyze: 'Notes Analysis',
  resume_analyze: 'Resume Analysis',
  interview: 'Interview Prep',
};
const featureLabel = (f: string) => FEATURE_LABELS[f] || f;
const num = (v: any) => Number(v || 0);
const money = (v: any) => `$${num(v).toFixed(2)}`;

function StatCard({ icon, label, value, tone = 'brand' }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600', emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600', slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-xl p-2 ${tones[tone]}`}>{icon}</div>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
    </div>
  );
}

export default function AiUsage() {
  const { user } = useAuth();
  const isSuper = String((user as any)?.role || '').toUpperCase() === 'SUPER_ADMIN';

  const [vertical, setVertical] = useState<string>(isSuper ? '' : 'school');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [allInstitutes, setAllInstitutes] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);

  // Quota editor (super-admin)
  const [qInstitute, setQInstitute] = useState('');
  const [qFeature, setQFeature] = useState('*');
  const [qLimit, setQLimit] = useState('');
  const [quotas, setQuotas] = useState<any[]>([]);
  const [savingQuota, setSavingQuota] = useState(false);

  const vq = vertical ? `?vertical=${vertical}` : '';

  const load = async () => {
    setLoading(true);
    try {
      const [ov, byF, tr] = await Promise.all([
        api.get(`/ai-usage/overview${vq}`),
        api.get(`/ai-usage/by-feature${vq}`),
        api.get(`/ai-usage/trend${vq}`),
      ]);
      setOverview(ov.data?.data ?? null);
      setFeatures(byF.data?.data ?? []);
      setTrend(tr.data?.data ?? []);
      if (isSuper) {
        const inst = await api.get(`/ai-usage/by-institute${vq}`);
        setInstitutes(inst.data?.data ?? []);
        // Full institute list for the quota editor (so you can set limits before any usage exists).
        try {
          const all = await api.get(`/institutes`, { params: { perPage: 1000 } });
          const raw = all.data?.data;
          const list = Array.isArray(raw) ? raw : (raw?.items || all.data?.items || []);
          setAllInstitutes(list.map((i: any) => ({ institute_id: i.id, institute_name: i.name, vertical: 'school' })));
        } catch { setAllInstitutes([]); }
      } else {
        const mine = await api.get(`/ai-usage/me`);
        setMe(mine.data?.data ?? null);
      }
    } catch (e) {
      console.error('Failed to load AI usage', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [vertical]);

  const maxReq = useMemo(() => Math.max(1, ...features.map((f) => num(f.requests))), [features]);
  const maxDay = useMemo(() => Math.max(1, ...trend.map((d) => num(d.requests))), [trend]);

  // Quota dropdown: all institutes + any (e.g. coaching) that already have usage, deduped.
  const quotaInstituteOptions = useMemo(() => {
    const map = new Map<string, any>();
    [...allInstitutes, ...institutes].forEach((i) => { if (i.institute_id && !map.has(i.institute_id)) map.set(i.institute_id, i); });
    return [...map.values()];
  }, [allInstitutes, institutes]);

  const loadQuotas = async (instituteId: string) => {
    if (!instituteId) { setQuotas([]); return; }
    try {
      const r = await api.get(`/ai-usage/quotas?instituteId=${instituteId}&vertical=${vertical || 'school'}`);
      setQuotas(r.data?.data ?? []);
    } catch { setQuotas([]); }
  };

  const saveQuota = async () => {
    if (!qInstitute || qLimit === '') { alert('Pick an institute and enter a limit'); return; }
    setSavingQuota(true);
    try {
      await api.post(`/ai-usage/quotas`, {
        instituteId: qInstitute,
        vertical: vertical || 'school',
        feature: qFeature,
        monthlyLimit: Number(qLimit),
      });
      setQLimit('');
      await loadQuotas(qInstitute);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save quota');
    } finally { setSavingQuota(false); }
  };

  const deleteQuota = async (feature: string) => {
    try {
      await api.delete(`/ai-usage/quotas`, { data: { instituteId: qInstitute, vertical: vertical || 'school', feature } });
      await loadQuotas(qInstitute);
    } catch (e) { console.error(e); }
  };

  const successRate = overview && num(overview.requests) > 0
    ? Math.round((num(overview.success) / num(overview.requests)) * 100) : 100;

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Sparkles className="text-brand-500" /> AI Usage</h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {isSuper ? 'Platform-wide AI usage across all institutes' : 'Your institute’s AI usage'} · this month
          </p>
        </div>
        {isSuper && (
          <select value={vertical} onChange={(e) => setVertical(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400">
            <option value="">All verticals</option>
            <option value="school">School</option>
            <option value="coaching">Coaching</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="mr-2 animate-spin" /> Loading usage…</div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard icon={<Activity size={18} />} label="Total AI requests" value={num(overview?.requests).toLocaleString()} tone="brand" />
            <StatCard icon={<Activity size={18} />} label="Success rate" value={`${successRate}%`} tone="emerald" />
            <StatCard icon={<Sparkles size={18} />} label="Tokens used" value={num(overview?.tokens).toLocaleString()} tone="violet" />
            <StatCard icon={<Coins size={18} />} label="Est. cost" value={money(overview?.cost)} tone="amber" />
            <StatCard icon={<Clock size={18} />} label="Avg latency" value={`${num(overview?.avg_latency_ms).toLocaleString()} ms`} tone="slate" />
          </div>

          {/* Feature breakdown */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Usage by feature</h3>
            {features.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No AI usage recorded yet this month.</p>
            ) : (
              <div className="space-y-3">
                {features.map((f) => {
                  const limit = me?.features?.find?.((x: any) => x.feature === f.feature)?.limit;
                  const remaining = me?.features?.find?.((x: any) => x.feature === f.feature)?.remaining;
                  return (
                    <div key={f.feature}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-700">{featureLabel(f.feature)}</span>
                        <span className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{num(f.requests).toLocaleString()} req</span>
                          <span>{num(f.tokens).toLocaleString()} tok</span>
                          <span className="font-semibold text-amber-600">{money(f.cost)}</span>
                          {limit != null && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">{remaining}/{limit} left</span>}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(num(f.requests) / maxReq) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily trend */}
          {trend.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Daily requests</h3>
              <div className="flex h-40 items-end gap-1">
                {trend.map((d) => (
                  <div key={d.day} className="group flex flex-1 flex-col items-center justify-end" title={`${d.day}: ${num(d.requests)} requests`}>
                    <div className="w-full rounded-t bg-brand-400 transition-all group-hover:bg-brand-600" style={{ height: `${(num(d.requests) / maxDay) * 100}%` }} />
                    <span className="mt-1 text-[9px] text-slate-400">{String(d.day).slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Super-admin: per-institute + quota editor */}
          {isSuper && (
            <>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500"><Building2 size={15} /> Usage by institute</h3>
                {institutes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No institute usage yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                          <th className="py-2">Institute</th><th>Vertical</th><th className="text-right">Requests</th><th className="text-right">Tokens</th><th className="text-right">Est. cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {institutes.map((i) => (
                          <tr key={`${i.institute_id}-${i.vertical}`} className="border-b border-slate-50">
                            <td className="py-2 font-semibold text-slate-700">{i.institute_name}</td>
                            <td><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">{i.vertical}</span></td>
                            <td className="text-right">{num(i.requests).toLocaleString()}</td>
                            <td className="text-right">{num(i.tokens).toLocaleString()}</td>
                            <td className="text-right font-semibold text-amber-600">{money(i.cost)}</td>
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
                  <select value={qInstitute} onChange={(e) => { setQInstitute(e.target.value); loadQuotas(e.target.value); }}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                    <option value="">Select institute…</option>
                    {quotaInstituteOptions.map((i) => <option key={`${i.institute_id}-${i.vertical}`} value={i.institute_id}>{i.institute_name}</option>)}
                  </select>
                  <select value={qFeature} onChange={(e) => setQFeature(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                    <option value="*">All features (total)</option>
                    {Object.keys(FEATURE_LABELS).map((f) => <option key={f} value={f}>{featureLabel(f)}</option>)}
                  </select>
                  <input type="number" value={qLimit} onChange={(e) => setQLimit(e.target.value)} placeholder="Monthly request limit"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
                  <button onClick={saveQuota} disabled={savingQuota}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">
                    <Save size={15} /> {savingQuota ? 'Saving…' : 'Set limit'}
                  </button>
                </div>
                {qInstitute && (
                  <div className="mt-4">
                    {quotas.length === 0 ? (
                      <p className="text-xs text-slate-400">No quotas set for this institute — AI usage is unlimited.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {quotas.map((q) => (
                          <span key={q.feature} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {q.feature === '*' ? 'All features' : featureLabel(q.feature)}: {num(q.monthly_limit).toLocaleString()}/mo
                            <button onClick={() => deleteQuota(q.feature)} className="text-slate-300 hover:text-rose-500"><Trash2 size={13} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-400">When an institute hits its monthly limit, AI calls for that feature are blocked (HTTP 429) until next month or the limit is raised.</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
