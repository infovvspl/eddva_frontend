import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, RefreshCw, Loader2, CheckCircle2, Circle, Quote, ChevronRight, Trophy, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/SchoolAuthContext';
import { generateCareerReport, getCareerReport, type CareerReport as Report } from '@/lib/api/career';
import { ErrorState, SkeletonBlock, fitTextColor } from './_shared';

const GEN_STEPS = [
  'Academic performance reviewed',
  'Quiz results processed',
  'Generating career matches…',
  'Creating action plan',
];

export default function CareerReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSaved = () => {
    setLoading(true);
    setError(null);
    getCareerReport()
      .then(setReport)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadSaved();
    return () => { if (stepTimer.current) clearInterval(stepTimer.current); };
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setGenStep(0);
    stepTimer.current = setInterval(() => {
      setGenStep((s) => Math.min(GEN_STEPS.length - 1, s + 1));
    }, 2800);
    try {
      const { report: r } = await generateCareerReport();
      setReport(r);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Could not generate your report. Please try again.');
    } finally {
      if (stepTimer.current) clearInterval(stepTimer.current);
      setGenerating(false);
    }
  };

  // ── Generating animation ────────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center p-1 py-16 text-center">
        <div className="w-full rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
          <h3 className="mt-4 text-lg font-bold text-slate-900">Analysing your profile…</h3>
          <p className="mt-1 animate-pulse text-sm text-slate-500">Looking at your marks, test performance, and interest profile</p>
          <div className="mx-auto mt-6 max-w-xs space-y-2.5 text-left">
            {GEN_STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                {i < genStep ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : i === genStep ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    : <Circle className="h-5 w-5 text-slate-300" />}
                <span className={i <= genStep ? 'font-semibold text-slate-700' : 'text-slate-400'}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-1">
        <SkeletonBlock className="h-10 w-2/3" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-48 w-full" />
      </div>
    );
  }

  // ── Empty / generate prompt ───────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="mx-auto max-w-xl p-1">
        {error && <div className="mb-4"><ErrorState message={error} onRetry={loadSaved} /></div>}
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 w-fit rounded-2xl bg-violet-50 p-3 text-violet-600"><Sparkles className="h-7 w-7" /></div>
          <h2 className="text-xl font-bold text-slate-900">Generate Your Career Report</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Our AI will analyse your marks, test performance, and interest profile to suggest the best career paths for you.
          </p>
          <button onClick={handleGenerate} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            <Sparkles className="h-4 w-4" /> Generate Report
          </button>
          <p className="mt-2 text-xs text-slate-400">Powered by EDVA AI · takes 10–15 seconds</p>
        </div>
      </div>
    );
  }

  // ── Report display ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button onClick={() => navigate('/school/student/career')} className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600"><ArrowLeft className="h-3.5 w-3.5" /> Career Home</button>
          <h1 className="text-2xl font-black text-slate-900">Your Career Report</h1>
          <p className="text-xs text-slate-400">
            Generated {new Date(report.generatedAt).toLocaleDateString('en-GB')}
            {report.generatedForGrade ? ` · Class ${report.generatedForGrade}` : ''} · CBSE
          </p>
        </div>
        <button onClick={handleGenerate} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Overall analysis */}
      {report.overallAnalysis && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-sm leading-relaxed text-slate-700">{report.overallAnalysis}</p>
        </div>
      )}

      {/* Stream recommendation */}
      {report.streamRecommendation && (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Stream Recommendation</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{report.streamRecommendation}</p>
        </div>
      )}

      {/* Top careers */}
      <div>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Your Top Career Matches</h2>
        <div className="space-y-4">
          {report.topCareers.map((c, idx) => (
            <div key={c.careerId || idx} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white">#{idx + 1}</span>
                  <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                </div>
                <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${fitTextColor(c.fitScore)}`}>{c.fitScore}% match</span>
              </div>

              {c.reasoning && (
                <div className="mt-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Why this fits you</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.reasoning}</p>
                </div>
              )}

              {c.focusAreas?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Focus on academically</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {c.focusAreas.map((f, i) => <span key={i} className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{f}</span>)}
                  </div>
                </div>
              )}

              {c.actionPlan?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Your next steps</p>
                  <ol className="mt-1.5 space-y-1.5">
                    {c.actionPlan.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">{i + 1}</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button onClick={() => navigate(`/school/student/career/explore/${c.careerId}`)}
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
                Explore this career <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Immediate actions */}
      {report.immediateActions?.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Do These in the Next 3 Months</h2>
          <div className="space-y-2">
            {report.immediateActions.map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded border-2 border-slate-300" />
                <span className="text-sm font-medium text-slate-700">{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement */}
      {report.encouragement && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-6 text-white shadow-sm">
          <Quote className="h-6 w-6 opacity-70" />
          <p className="mt-2 text-base font-semibold leading-relaxed">{report.encouragement}</p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-bold opacity-90"><Trophy className="h-4 w-4" /> {(user as { name?: string } | null)?.name || 'Student'}</p>
        </div>
      )}
    </div>
  );
}
