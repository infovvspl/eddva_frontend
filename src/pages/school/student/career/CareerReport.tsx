import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, RefreshCw, Loader2, CheckCircle2, Circle, Quote, ChevronRight, Trophy, ArrowLeft,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { useAuth } from '@/context/SchoolAuthContext';
import { generateCareerReport, getCareerReport, submitCareerFeedback, type CareerReport as Report } from '@/lib/api/career';
import { ErrorState, SkeletonBlock, fitTextColor } from './_shared';

// The generate endpoint only enqueues the job (202, no report body) — poll
// until a report newer than whatever was showing before actually lands.
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollForReport(previousReportId: string | undefined): Promise<Report> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const r = await getCareerReport();
    if (r && r.id !== previousReportId && r.topCareers.length > 0) return r;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error('Your report is taking longer than expected — check back in a moment.');
}

const GEN_STEPS = [
  'Academic performance reviewed',
  'Quiz results processed',
  'Generating career matches…',
  'Creating action plan',
];

const getFormattedStream = (recommendation: string, topCareers: any[]) => {
  if (!recommendation) return '';
  if (recommendation.includes('(') || recommendation.includes('with') || recommendation.includes('-')) {
    return recommendation;
  }

  const subjects = new Set<string>();
  topCareers.forEach(c => {
    if (Array.isArray(c.focusAreas)) {
      c.focusAreas.forEach((f: string) => {
        const lower = f.toLowerCase();
        if (lower.includes('math')) subjects.add('Math');
        else if (lower.includes('physic')) subjects.add('Physics');
        else if (lower.includes('chemist')) subjects.add('Chemistry');
        else if (lower.includes('biolog')) subjects.add('Biology');
        else if (lower.includes('comput')) subjects.add('Computer Science');
        else if (lower.includes('account')) subjects.add('Accountancy');
        else if (lower.includes('econom')) subjects.add('Economics');
        else if (lower.includes('business')) subjects.add('Business Studies');
        else if (lower.includes('histor')) subjects.add('History');
        else if (lower.includes('geograph')) subjects.add('Geography');
        else if (lower.includes('polit')) subjects.add('Political Science');
      });
    }
  });

  const list = Array.from(subjects);
  const recLower = recommendation.toLowerCase();
  if (recLower.includes('science')) {
    if (subjects.has('Biology') && subjects.has('Mathematics')) {
      return `${recommendation} (PCMB)`;
    } else if (subjects.has('Biology')) {
      return `${recommendation} (PCB)`;
    } else {
      return `${recommendation} (PCM)`;
    }
  } else if (recLower.includes('commerce')) {
    if (subjects.has('Math')) {
      return `${recommendation} (Commerce with Math)`;
    } else {
      return `${recommendation} (Commerce)`;
    }
  } else if (recLower.includes('arts') || recLower.includes('humanities')) {
    if (list.length >= 2) {
      return `${recommendation} (${list.slice(0, 3).join(', ')})`;
    }
    return `${recommendation} (HEP / Arts)`;
  }
  return recommendation;
};

export default function CareerReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [feedbackRating, setFeedbackRating] = useState<'up' | 'down' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const currentStudentName = user?.name || 'Student';

  useEffect(() => {
    setFeedbackRating(report?.feedbackRating ?? null);
    setShowCommentBox(false);
    setFeedbackComment('');
  }, [report?.id]);

  const submitFeedback = async (rating: 'up' | 'down') => {
    const previous = feedbackRating;
    setFeedbackRating(rating);
    setFeedbackSubmitting(true);
    try {
      await submitCareerFeedback(rating);
      if (rating === 'down') setShowCommentBox(true);
    } catch {
      setFeedbackRating(previous);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const submitFeedbackComment = async () => {
    const comment = feedbackComment.trim();
    if (!comment) { setShowCommentBox(false); return; }
    setFeedbackSubmitting(true);
    try {
      await submitCareerFeedback('down', comment);
      setShowCommentBox(false);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

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
    const previousReportId = report?.id;
    try {
      await generateCareerReport();
      const r = await pollForReport(previousReportId);
      setReport(r);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (e instanceof Error ? e.message : 'Could not generate your report. Please try again.'));
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
      <div className="w-full space-y-4 p-1">
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
    <div className="w-full space-y-5 p-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button onClick={() => navigate('/school/student/career')} className="mb-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600"><ArrowLeft className="h-3.5 w-3.5" /> Career Home</button>
          <h1 className="text-2xl font-black text-slate-900">Your Career Report</h1>
          <p className="text-xs text-slate-400">
            Generated {new Date(report.generatedAt).toLocaleDateString('en-GB')}
            {report.generatedForGrade ? ` · Class ${report.generatedForGrade}` : ''}
          </p>
        </div>
      </div>

      {/* Stream recommendation */}
      {report.streamRecommendation && (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Stream Recommendation</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{getFormattedStream(report.streamRecommendation, report.topCareers)}</p>
        </div>
      )}

      {/* Overall analysis */}
      {report.overallAnalysis && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-sm leading-relaxed text-slate-700">{report.overallAnalysis}</p>
        </div>
      )}

      {/* Top careers */}
      <div>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Your Top Career Matches</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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

              <button onClick={() => navigate(`/school/student/career/explore/${c.careerId}`, { state: { fallbackCareer: c } })}
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
                Explore this career <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
          {/* Immediate actions inside the grid */}
          {report.immediateActions?.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Do These in the Next 3 Months</h3>
              <div className="space-y-3">
                {report.immediateActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">{i + 1}</span>
                    <span className="font-semibold leading-relaxed">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Encouragement */}
      {report.encouragement && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-6 text-white shadow-sm">
          <Quote className="h-6 w-6 opacity-70" />
          <p className="mt-2 text-base font-semibold leading-relaxed">{report.encouragement}</p>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-bold opacity-90"><Trophy className="h-4 w-4" /> {currentStudentName}</p>
        </div>
      )}

      {/* Feedback */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-700">Was this report helpful?</p>
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={() => submitFeedback('up')}
            disabled={feedbackSubmitting}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold disabled:opacity-50 ${
              feedbackRating === 'up' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp className="h-4 w-4" /> Yes
          </button>
          <button
            onClick={() => submitFeedback('down')}
            disabled={feedbackSubmitting}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold disabled:opacity-50 ${
              feedbackRating === 'down' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ThumbsDown className="h-4 w-4" /> Not really
          </button>
        </div>
        {feedbackRating && !showCommentBox && (
          <p className="mt-2 text-xs text-slate-400">Thanks for letting us know.</p>
        )}
        {showCommentBox && (
          <div className="mt-3">
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="What could be better? (optional)"
              maxLength={1000}
              rows={2}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            />
            <button
              onClick={submitFeedbackComment}
              disabled={feedbackSubmitting}
              className="mt-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
