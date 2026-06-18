import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target, BrainCircuit, Sparkles, CheckCircle2, Lock, ChevronRight, Compass, GraduationCap,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import {
  getQuizStatus, getCareerReport, hollandLabel,
  type QuizStatus, type CareerReport,
} from '@/lib/api/career';
import { gradeBadge, SkeletonBlock } from './_shared';

interface SubjectPerf { subjectName: string; accuracy: number }

const toLetter = (p: number): string =>
  p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'E';

function CooldownCountdown({ targetDate, onFinish }: { targetDate: string; onFinish: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        onFinish();
        return;
      }

      const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30));
      const days = Math.floor((difference / (1000 * 60 * 60 * 24)) % 30);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (months > 0) parts.push(`${months}mo`);
      if (days > 0 || months > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0 || months > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0 || months > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' '));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onFinish]);

  return (
    <div className="mt-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 inline-block">
      ⏱️ Retake unlocked in: <span className="font-mono text-slate-900 font-bold">{timeLeft || 'calculating...'}</span>
    </div>
  );
}

export default function CareerHome() {
  const navigate = useNavigate();
  const [marks, setMarks] = useState<SubjectPerf[] | null>(null);
  const [marksLoading, setMarksLoading] = useState(true);
  const [status, setStatus] = useState<QuizStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [report, setReport] = useState<CareerReport | null>(null);
  const [reportLoading, setReportLoading] = useState(true);

  const refreshStatus = () => {
    getQuizStatus().then(setStatus).catch(() => setStatus(null));
  };

  useEffect(() => {
    api.get('/reports/my-analytics')
      .then((res) => setMarks((res.data?.data?.subjectPerformance ?? []) as SubjectPerf[]))
      .catch(() => setMarks(null))
      .finally(() => setMarksLoading(false));
    getQuizStatus().then(setStatus).catch(() => setStatus(null)).finally(() => setStatusLoading(false));
    getCareerReport().then(setReport).catch(() => setReport(null)).finally(() => setReportLoading(false));
  }, []);

  const strong = (marks ?? []).filter((s) => s.accuracy >= 75).map((s) => s.subjectName);
  const weak = (marks ?? []).filter((s) => s.accuracy < 60).map((s) => s.subjectName);

  const careerCategories = [
    { label: 'Science Careers', stream: 'science', icon: GraduationCap, color: 'from-blue-500 to-indigo-500' },
    { label: 'Commerce Careers', stream: 'commerce', icon: Target, color: 'from-amber-500 to-orange-500' },
    { label: 'Arts Careers', stream: 'arts', icon: BrainCircuit, color: 'from-rose-500 to-pink-500' },
    { label: 'Modern Careers', stream: 'any', icon: Sparkles, color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="w-full space-y-6 p-1">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <Compass className="text-blue-600" /> Career Guidance
        </h1>
        <p className="mt-0.5 text-sm font-medium text-slate-500">Discover your strengths and ideal career path</p>
      </div>

      {/* Explore Careers */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Explore Careers</h2>
            <p className="text-xs text-slate-400">Browse all career paths</p>
          </div>
          <button onClick={() => navigate('/school/student/career/explore')} className="text-xs font-bold text-blue-600 hover:underline">View All →</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {careerCategories.map((c) => (
            <button key={c.label} onClick={() => navigate(`/school/student/career/explore?stream=${c.stream}`)}
              className={`flex w-40 shrink-0 flex-col gap-2 rounded-xl bg-gradient-to-br ${c.color} p-4 text-left text-white transition hover:opacity-90`}>
              <c.icon className="h-6 w-6" />
              <span className="text-sm font-bold">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Profiles side-by-side */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Section 2 — Interest profile */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          {statusLoading ? (
            <SkeletonBlock className="h-24 w-full" />
          ) : status?.completed ? (
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">Interest Profile Complete</h3>
                <p className="text-sm font-semibold text-blue-600">Your type: {status.hollandCode ? hollandLabel(status.hollandCode) : '—'}</p>
                {status.completedAt && <p className="mt-0.5 text-xs text-slate-400">Completed {new Date(status.completedAt).toLocaleDateString('en-GB')}</p>}
                {status.canRetake ? (
                  <button onClick={() => navigate('/school/student/career/quiz')} className="mt-2 text-xs font-bold text-blue-600 hover:underline">Retake Quiz</button>
                ) : (
                  status.canRetakeAfter && (
                    <CooldownCountdown targetDate={status.canRetakeAfter} onFinish={refreshStatus} />
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><BrainCircuit /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">Discover Your Interests</h3>
                <p className="text-sm text-slate-500">Take a 15-question quiz to help us understand what careers suit your personality.</p>
                <button onClick={() => navigate('/school/student/career/quiz')} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                  Start Quiz <ChevronRight className="h-4 w-4" />
                </button>
                <p className="mt-1.5 text-xs text-slate-400">Takes about 5 minutes</p>
              </div>
            </div>
          )}
        </section>

        {/* Section 1 — Academic snapshot */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">Your Academic Profile</h2>
          {marksLoading ? (
            <div className="flex gap-3 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-28 w-36 shrink-0" />)}
            </div>
          ) : !marks || marks.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No marks data yet.</p>
          ) : (
            <>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {marks.map((s) => {
                  const pct = Math.round(s.accuracy);
                  return (
                    <div key={s.subjectName} className="w-36 shrink-0 rounded-xl border border-slate-100 p-3">
                      <p className="truncate text-xs font-bold text-slate-600" title={s.subjectName}>{s.subjectName}</p>
                      <p className="mt-1 text-2xl font-black text-slate-900">{pct}%</p>
                      <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-black ${gradeBadge(toLetter(pct))}`}>{toLetter(pct)}</span>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {strong.length > 0 && <p className="font-semibold text-emerald-600">Strong in: {strong.join(', ')}</p>}
                {weak.length > 0 && <p className="font-semibold text-amber-600">Needs work: {weak.join(', ')}</p>}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Section 3 — Career report */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        {reportLoading ? (
          <SkeletonBlock className="h-24 w-full" />
        ) : report ? (
          <div>
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue-600" /><h3 className="text-lg font-bold text-slate-900">Your Career Report</h3></div>
            <p className="mt-0.5 text-xs text-slate-400">Last generated {new Date(report.generatedAt).toLocaleDateString('en-GB')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.topCareers.slice(0, 3).map((c) => (
                <span key={c.careerId} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{c.title} {c.fitScore}%</span>
              ))}
            </div>
            <button onClick={() => navigate('/school/student/career/report')} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              View Full Report <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : status?.completed ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600"><Sparkles /></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-900">Generate Your Career Report</h3>
              <p className="text-sm text-slate-500">Our AI will analyse your marks, test performance, and interest profile to suggest the best career paths for you.</p>
              <button onClick={() => navigate('/school/student/career/report')} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                Generate Report <ChevronRight className="h-4 w-4" />
              </button>
              <p className="mt-1.5 text-xs text-slate-400">Powered by EDVA AI</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 opacity-80">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-400"><Lock /></div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-slate-700">Career Report</h3>
              <p className="text-sm text-slate-500">Complete the interest quiz first to unlock your personalised career report.</p>
              <button disabled className="mt-3 cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-500">Complete Quiz First</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
