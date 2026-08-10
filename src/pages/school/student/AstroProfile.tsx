import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Calendar, Clock, MapPin, User, Info, AlertTriangle, RefreshCw,
  Brain, GraduationCap, Compass, Award, TrendingUp, Route, Lightbulb, FileText,
  Quote, ArrowRight,
} from 'lucide-react';
import { generateAstroReport, type AstroInput, type AstroReport } from '@/lib/api/astro';

/**
 * AI Astro Profile (Demo).
 *
 * A demonstration feature: the report is generated deterministically from the
 * details typed into the form and reads nothing from the student's real record.
 * The disclaimer is rendered above the report and again at the foot, and is not
 * dismissible — anyone shown this screen should be able to tell at a glance that
 * it is illustrative.
 */

// ── Small building blocks ───────────────────────────────────────────────────

/** A score bar that animates from 0 on mount, matching the platform's feel. */
function ScoreBar({ value, tone = 'indigo' }: { value: number; tone?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 60);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-[1200ms] ease-out ${
          tone === 'emerald' ? 'from-emerald-400 to-emerald-600'
          : tone === 'amber' ? 'from-amber-400 to-orange-500'
          : tone === 'violet' ? 'from-violet-400 to-purple-600'
          : 'from-indigo-400 to-indigo-600'
        }`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

function TraitCard({ label, score, blurb, tone }: {
  label: string; score: number; blurb: string; tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
        <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{score}%</span>
      </div>
      <div className="mt-2"><ScoreBar value={score} tone={tone} /></div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{blurb}</p>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <header className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white sm:text-lg">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

/** Rendered above and below the report. Deliberately not dismissible. */
function DemoNotice({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="text-sm font-black text-amber-900 dark:text-amber-200">Demo Feature</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300">{text}</p>
      </div>
    </div>
  );
}

const LOADING_STEPS = [
  'Reading the details you entered…',
  'Building your insight profile…',
  'Mapping learning style and strengths…',
  'Matching career directions…',
  'Writing your summary…',
];

// ── Page ────────────────────────────────────────────────────────────────────

export default function AstroProfile() {
  const [form, setForm] = useState<AstroInput>({
    fullName: '', dateOfBirth: '', timeOfBirth: '', placeOfBirth: '', gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [report, setReport] = useState<AstroReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const canSubmit = form.fullName.trim().length >= 2
    && !!form.dateOfBirth
    && form.placeOfBirth.trim().length >= 2;

  // Step through the loading copy so the wait reads as progress rather than a
  // frozen spinner. Purely cosmetic — the request is a single call.
  useEffect(() => {
    if (!loading) { setStep(0); return; }
    const t = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 700);
    return () => clearInterval(t);
  }, [loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      // A short floor on the animation: the call returns almost instantly and a
      // report that appears with no pause at all reads as canned.
      const [res] = await Promise.all([
        generateAstroReport({
          ...form,
          timeOfBirth: form.timeOfBirth || undefined,
          gender: form.gender || undefined,
        }),
        new Promise((r) => setTimeout(r, 2200)),
      ]);
      setReport(res);
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not generate the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setReport(null); setError(null); };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 font-poppins sm:px-6">
      {/* Hero */}
      <div className="mb-5 flex items-start gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-3 text-white shadow-lg shadow-indigo-500/25">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
            AI Astro Profile
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Demo
            </span>
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            An illustrative snapshot of learning style, strengths and possible directions.
          </p>
        </div>
      </div>

      <div className="mb-5"><DemoNotice text={
        'AI-generated illustrative insights for demonstration purposes only. This report should not be '
        + 'treated as scientific, educational, psychological, medical, or astrological advice.'
      } /></div>

      {/* ── Form ── */}
      {!report && (
        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" icon={User} required>
              <input
                type="text" value={form.fullName} disabled={loading}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Riya Sharma" className={inputCls}
              />
            </Field>

            <Field label="Date of Birth" icon={Calendar} required>
              <input
                type="date" value={form.dateOfBirth} max={today} disabled={loading}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="Time of Birth" icon={Clock} hint="Optional">
              <input
                type="time" value={form.timeOfBirth} disabled={loading}
                onChange={(e) => setForm({ ...form, timeOfBirth: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="Place of Birth" icon={MapPin} required>
              <input
                type="text" value={form.placeOfBirth} disabled={loading}
                onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })}
                placeholder="e.g. Bhubaneswar" className={inputCls}
              />
            </Field>

            <Field label="Gender" icon={Info} hint="Optional">
              <select
                value={form.gender} disabled={loading}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className={inputCls}
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={!canSubmit || loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading
              ? (<><RefreshCw className="h-4 w-4 animate-spin" /> Generating…</>)
              : (<><Sparkles className="h-4 w-4" /> Generate Report</>)}
          </button>

          {loading && (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500" />
                </span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {LOADING_STEPS[step]}
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full w-1/3 animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />
              </div>
            </div>
          )}
        </form>
      )}

      {/* ── Report ── */}
      {report && (
        <div ref={reportRef} className="space-y-5">
          {/* 1. Overview */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white shadow-xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Insight Profile</p>
                <h2 className="mt-1 truncate text-2xl font-black">{report.overview.fullName}</h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-100">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{report.overview.dateOfBirth}</span>
                  {report.overview.timeOfBirth && (
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{report.overview.timeOfBirth}</span>
                  )}
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{report.overview.placeOfBirth}</span>
                </div>
                <p className="mt-2 text-[11px] text-indigo-200">
                  Generated {new Date(report.overview.generatedOn).toLocaleDateString()} · Profile {report.overview.profileId}
                </p>
              </div>

              <div className="shrink-0 text-center">
                <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-white/30 bg-white/10 backdrop-blur">
                  <div>
                    <p className="text-3xl font-black leading-none">{report.overview.insightScore}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-200">Insight</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personality */}
          <Section icon={Brain} title="Personality Profile" subtitle="Traits this profile leans toward">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {report.personality.map((t) => <TraitCard key={t.key} {...t} tone="indigo" />)}
            </div>
          </Section>

          {/* 3. Learning style */}
          <Section icon={Lightbulb} title="Learning Style" subtitle="How new material may land best">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.learning.map((t) => <TraitCard key={t.key} {...t} tone="violet" />)}
            </div>
          </Section>

          {/* 4. Academic potential */}
          <Section icon={GraduationCap} title="Academic Potential" subtitle="Where the work may feel most natural">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.academics.map((t) => <TraitCard key={t.key} {...t} tone="emerald" />)}
            </div>
          </Section>

          {/* 5. Career compatibility */}
          <Section icon={Compass} title="Career Compatibility" subtitle="Starting points for conversation, not recommendations">
            <div className="space-y-3">
              {report.careers.map((c) => (
                <div key={c.key} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.label}</span>
                    <span className="text-sm font-black tabular-nums text-indigo-600 dark:text-indigo-400">{c.match}%</span>
                  </div>
                  <div className="mt-2"><ScoreBar value={c.match} /></div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{c.rationale}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 6 + 7. Strengths and growth */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Section icon={Award} title="Strength Analysis" subtitle="What appears to come naturally">
              <div className="space-y-3">
                {report.strengths.map((t) => <TraitCard key={t.key} {...t} tone="emerald" />)}
              </div>
            </Section>
            <Section icon={TrendingUp} title="Growth Areas" subtitle="Where a little attention could go furthest">
              <div className="space-y-3">
                {report.growthAreas.map((t) => <TraitCard key={t.key} {...t} tone="amber" />)}
              </div>
            </Section>
          </div>

          {/* 8. Timeline */}
          <Section icon={Route} title="Future Growth Timeline" subtitle="A direction of travel, not a prediction">
            <ol className="relative space-y-5 border-l-2 border-dashed border-indigo-200 pl-6 dark:border-indigo-800">
              {report.timeline.map((s, i) => (
                <li key={s.key} className="relative">
                  <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-black text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.note}</p>
                </li>
              ))}
            </ol>
          </Section>

          {/* 9. Study suggestions */}
          <Section icon={Sparkles} title="Study Suggestions" subtitle="Practical habits worth trying">
            <div className="grid gap-3 sm:grid-cols-2">
              <Suggestion label="Best study session" value={report.suggestions.bestSession} />
              <Suggestion label="Recommended daily study" value={report.suggestions.dailyDuration} />
              <Suggestion label="Break pattern" value={report.suggestions.breakPattern} />
              <Suggestion label="Revision advice" value={report.suggestions.revision} />
              <div className="sm:col-span-2">
                <Suggestion label="Weekly learning goal" value={report.suggestions.weeklyGoal} />
              </div>
            </div>
            <blockquote className="mt-4 flex gap-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4 dark:from-indigo-950/40 dark:to-violet-950/40">
              <Quote className="h-5 w-5 shrink-0 text-indigo-400" />
              <div>
                <p className="text-sm font-semibold italic text-slate-700 dark:text-slate-200">
                  “{report.suggestions.quote.text}”
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">— {report.suggestions.quote.author}</p>
              </div>
            </blockquote>
          </Section>

          {/* 10. AI summary */}
          <Section icon={FileText} title="AI Summary" subtitle="Written from the sections above">
            <div className="space-y-3">
              {report.summary.split('\n\n').map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{p}</p>
              ))}
            </div>
          </Section>

          <DemoNotice text={report.disclaimer} />

          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
          >
            <ArrowRight className="h-4 w-4" /> Generate another profile
          </button>
        </div>
      )}
    </div>
  );
}

// ── Form helpers ────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition ' +
  'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 ' +
  'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

function Field({ label, icon: Icon, required, hint, children }: {
  label: string; icon: React.ElementType; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        <Icon className="h-3.5 w-3.5" />
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="font-medium normal-case tracking-normal text-slate-400">({hint})</span>}
      </span>
      {children}
    </label>
  );
}

function Suggestion({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
