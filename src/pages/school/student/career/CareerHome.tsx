import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target, BrainCircuit, Sparkles, CheckCircle2, Lock, ChevronRight, Compass, GraduationCap,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  getQuizStatus, getCareerReport, hollandLabel,
  type QuizStatus, type CareerReport,
} from '@/lib/api/career';
import { CooldownCountdown, gradeBadge, SkeletonBlock } from './_shared';

interface SubjectPerf { subjectName: string; accuracy: number }

const toLetter = (p: number): string =>
  p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'E';

const normalizeSubjectName = (name: string): string => {
  if (!name) return 'General';
  const lower = name.trim().toLowerCase();
  if (lower === 'maths' || lower === 'math' || lower === 'mathematics') return 'Mathematics';
  if (
    lower === 'social science' ||
    lower === 'social studies' ||
    lower === 'sst' ||
    lower === 'ssc' ||
    lower === 'social sciences' ||
    lower === 'social-science' ||
    lower === 'social-studies'
  ) return 'Social Science';
  if (
    lower === 'info tech' ||
    lower === 'information technology' ||
    lower === 'it' ||
    lower === 'computer science' ||
    lower === 'computers' ||
    lower === 'computer' ||
    lower === 'cs'
  ) return 'Information Technology';
  if (lower === 'sci' || lower === 'science') return 'Science';
  if (lower === 'eng' || lower === 'english') return 'English';
  if (lower === 'hin' || lower === 'hindi') return 'Hindi';
  return name.trim();
};

export default function CareerHome() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
      .then((res) => {
        const raw = (res.data?.data?.subjectPerformance ?? []) as SubjectPerf[];
        const map = new Map<string, number[]>();
        raw.forEach((s) => {
          const norm = normalizeSubjectName(s.subjectName);
          map.set(norm, [...(map.get(norm) || []), s.accuracy]);
        });
        const merged: SubjectPerf[] = [...map.entries()].map(([subjectName, accs]) => ({
          subjectName,
          accuracy: Math.round(accs.reduce((a, b) => a + b, 0) / accs.length),
        }));
        setMarks(merged);
      })
      .catch(() => setMarks(null))
      .finally(() => setMarksLoading(false));
    getQuizStatus().then(setStatus).catch(() => setStatus(null)).finally(() => setStatusLoading(false));
    getCareerReport().then(setReport).catch(() => setReport(null)).finally(() => setReportLoading(false));
  }, []);

  const strong = (marks ?? []).filter((s) => s.accuracy >= 75).map((s) => s.subjectName);
  const weak = (marks ?? []).filter((s) => s.accuracy < 60).map((s) => s.subjectName);

  const careerCategories = [
    { label: 'Science Careers', hint: 'Medicine, tech, research', stream: 'science', icon: GraduationCap, color: 'from-blue-500 to-indigo-600' },
    { label: 'Commerce Careers', hint: 'Business, finance, law', stream: 'commerce', icon: Target, color: 'from-amber-400 to-orange-600' },
    { label: 'Arts Careers', hint: 'Design, media, humanities', stream: 'arts', icon: BrainCircuit, color: 'from-rose-500 to-pink-600' },
    { label: 'Modern Careers', hint: 'Emerging and creative paths', stream: 'any', icon: Sparkles, color: 'from-violet-500 to-purple-600' },
  ];

  const CARD = 'rounded-3xl border border-slate-300 bg-white p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900';
  const tile = (grad: string) => `grid size-10 sm:size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md ${grad}`;
  const primaryBtn = 'inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700';

  return (
    <div className="w-full space-y-4 sm:space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="grid size-11 sm:size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <Compass className="size-5 sm:size-7" />
        </span>
        <div className="min-w-0">
          <h1 className="!text-xl sm:!text-2xl font-black text-slate-900 dark:text-white">Career Guidance</h1>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Discover your strengths and ideal career path</p>
        </div>
      </div>

      {/* Explore Careers */}
      <section className={CARD}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={tile('from-emerald-500 to-teal-600')}><Compass className="size-5" /></span>
            <div className="min-w-0">
              <h2 className="!text-sm sm:!text-base font-black text-slate-900 dark:text-white">Explore Careers</h2>
              <p className="text-[11px] sm:text-xs font-medium text-slate-500">Browse all career paths</p>
            </div>
          </div>
          <button onClick={() => navigate('/school/student/career/explore')} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300">
            View All <ChevronRight className="size-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {careerCategories.map((c) => (
            <button key={c.label} onClick={() => navigate(`/school/student/career/explore?stream=${c.stream}`)}
              className={`group relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-4 text-left text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg`}>
              <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/15" />
              <c.icon className="relative size-6 sm:size-7" />
              <span className="relative text-sm font-black leading-snug">{c.label}</span>
              <span className="relative hidden text-[11px] font-medium text-white/85 sm:block">{c.hint}</span>
              <ChevronRight className="absolute bottom-3 right-3 size-4 text-white/70 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </section>

      {/* Profiles side-by-side */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {/* Section 2 — Interest profile */}
        <section className={CARD}>
          {statusLoading ? (
            <SkeletonBlock className="h-24 w-full" />
          ) : status?.completed ? (
            <div className="flex items-start gap-3 sm:gap-4">
              <span className={tile('from-emerald-500 to-teal-600')}><CheckCircle2 className="size-5 sm:size-6" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="!text-base sm:!text-lg font-black text-slate-900 dark:text-white">Interest Profile Complete</h3>
                <p className="mt-0.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-300">Your type: {status.hollandCode ? hollandLabel(status.hollandCode) : '—'}</p>
                {status.completedAt && <p className="mt-0.5 text-[10px] sm:text-xs text-slate-400">Completed {new Date(status.completedAt).toLocaleDateString('en-GB')}</p>}
                {status.canRetake ? (
                  <button onClick={() => navigate('/school/student/career/quiz')} className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300">Retake Quiz</button>
                ) : (
                  status.canRetakeAfter && (
                    <CooldownCountdown targetDate={status.canRetakeAfter} onFinish={refreshStatus} />
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
              <span className={tile('from-blue-500 to-indigo-600')}><BrainCircuit className="size-5 sm:size-6" /></span>
              <div className="min-w-0 flex-1">
                <h3 className="!text-base sm:!text-lg font-black text-slate-900 dark:text-white">Discover Your Interests</h3>
                <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-500">Take a 15-question quiz to help us understand what careers suit your personality.</p>
                <button onClick={() => navigate('/school/student/career/quiz')} className={`mt-3 ${primaryBtn}`}>
                  Start Quiz <ChevronRight className="size-4" />
                </button>
                <p className="mt-1.5 text-[10px] sm:text-xs text-slate-400">Takes about 5 minutes</p>
              </div>
            </div>
          )}
        </section>

        {/* Section 1 — Academic snapshot */}
        <section className={CARD}>
          <div className="mb-3 flex items-center gap-3 sm:mb-4">
            <span className={tile('from-sky-400 to-blue-600')}><GraduationCap className="size-5" /></span>
            <h2 className="!text-sm sm:!text-base font-black text-slate-900 dark:text-white">Your Academic Profile</h2>
          </div>
          {marksLoading ? (
            <div className="flex gap-3 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-28 w-36 shrink-0" />)}
            </div>
          ) : !marks || marks.length === 0 ? (
            <p className="py-6 text-center text-xs sm:text-sm text-slate-400">No marks data yet.</p>
          ) : (
            <>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {marks.map((s) => {
                  const pct = Math.round(s.accuracy);
                  return (
                    <div key={s.subjectName} className="w-28 sm:w-36 shrink-0 rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                      <p className="truncate text-[10px] sm:text-xs font-bold text-slate-500" title={s.subjectName}>{s.subjectName}</p>
                      <p className="mt-0.5 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{pct}%</p>
                      <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black ${gradeBadge(toLetter(pct))}`}>{toLetter(pct)}</span>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 space-y-1 text-xs sm:text-sm">
                {strong.length > 0 && <p className="font-semibold text-emerald-600">Strong in: {strong.join(', ')}</p>}
                {weak.length > 0 && <p className="font-semibold text-amber-600">Needs work: {weak.join(', ')}</p>}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Section 3 — Career report */}
      <section className={CARD}>
        {reportLoading ? (
          <SkeletonBlock className="h-24 w-full" />
        ) : report ? (
          <div>
            <div className="flex items-center gap-3">
              <span className={tile('from-violet-500 to-purple-600')}><Sparkles className="size-5" /></span>
              <div>
                <h3 className="!text-base sm:!text-lg font-black text-slate-900 dark:text-white">Your Career Report</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">Last generated {new Date(report.generatedAt).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
              {report.topCareers.slice(0, 3).map((c) => (
                <span key={c.careerId} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">{c.title} {c.fitScore}%</span>
              ))}
            </div>
            <button onClick={() => navigate('/school/student/career/report')} className={`mt-4 ${primaryBtn}`}>
              View Full Report <ChevronRight className="size-4" />
            </button>
          </div>
        ) : status?.completed ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
            <span className={tile('from-violet-500 to-purple-600')}><Sparkles className="size-5 sm:size-6" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="!text-base sm:!text-lg font-black text-slate-900 dark:text-white">Generate Your Career Report</h3>
              <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-500">Our AI will analyse your marks, test performance, and interest profile to suggest the best career paths for you.</p>
              <button onClick={() => navigate('/school/student/career/report')} className={`mt-3 ${primaryBtn}`}>
                Generate Report <ChevronRight className="size-4" />
              </button>
              <p className="mt-1.5 text-[10px] sm:text-xs text-slate-400">Powered by EDVA AI</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 opacity-80 sm:gap-4">
            <span className="grid size-10 sm:size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Lock className="size-5 sm:size-6" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="!text-base sm:!text-lg font-black text-slate-700 dark:text-slate-200">Career Report</h3>
              <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-500">Complete the interest quiz first to unlock your personalised career report.</p>
              <button disabled className="mt-3 cursor-not-allowed rounded-xl bg-slate-200 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-500 dark:bg-slate-800">Complete Quiz First</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
