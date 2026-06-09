import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle, GraduationCap, Building2, IndianRupee, ChevronRight } from 'lucide-react';
import api from '@/lib/api/school-client';
import {
  getCareerDetail, getCareerReport,
  type CareerPath, type CareerItem,
} from '@/lib/api/career';
import { ErrorState, SkeletonBlock, streamBadge, fitTextColor } from './_shared';

interface SubjectPerf { subjectName: string; accuracy: number }

export default function CareerDetail() {
  const { careerId = '' } = useParams();
  const navigate = useNavigate();
  const [career, setCareer] = useState<CareerPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchItem, setMatchItem] = useState<CareerItem | null>(null);
  const [marks, setMarks] = useState<SubjectPerf[]>([]);

  const load = () => {
    setLoading(true);
    setError(null);
    getCareerDetail(careerId)
      .then(setCareer)
      .catch((e) => setError(e?.response?.data?.message || 'Career not found'))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    getCareerReport().then((r) => setMatchItem(r?.topCareers.find((c) => c.careerId === careerId) ?? null)).catch(() => undefined);
    api.get('/reports/my-analytics').then((res) => setMarks((res.data?.data?.subjectPerformance ?? []) as SubjectPerf[])).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerId]);

  if (loading) {
    return <div className="mx-auto max-w-3xl space-y-4 p-1"><SkeletonBlock className="h-10 w-2/3" /><SkeletonBlock className="h-40 w-full" /></div>;
  }
  if (error || !career) {
    return <div className="mx-auto max-w-3xl p-1"><ErrorState message={error || 'Career not found'} onRetry={load} /></div>;
  }

  const studentPct = (subject: string): number | null => {
    const m = marks.find((x) => x.subjectName.toLowerCase().includes(subject.toLowerCase()) || subject.toLowerCase().includes(x.subjectName.toLowerCase()));
    return m ? Math.round(m.accuracy) : null;
  };
  const requiredEntries = Object.entries(career.requiredSubjects ?? {});

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-1">
      <button onClick={() => navigate('/school/student/career/explore')} className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600"><ArrowLeft className="h-3.5 w-3.5" /> All Careers</button>

      {/* Header */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-black text-slate-900">{career.title}</h1>
          <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-black uppercase ${streamBadge(career.stream)}`}>{career.stream}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{career.description}</p>
        {matchItem && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${fitTextColor(matchItem.fitScore)}`}>Your fit score: {matchItem.fitScore}%</span>
            <span className="text-xs font-semibold text-emerald-600">In your top matches</span>
          </div>
        )}
        {matchItem?.reasoning && <p className="mt-2 text-sm text-slate-500">{matchItem.reasoning}</p>}
      </div>

      {/* Required subjects */}
      {requiredEntries.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Required Subjects</h2>
          <div className="space-y-2">
            {requiredEntries.map(([subject, minPct]) => {
              const cur = studentPct(subject);
              const ok = cur != null && cur >= minPct;
              return (
                <div key={subject} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                  <span className="text-sm font-semibold capitalize text-slate-700">{subject}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">needs {minPct}%</span>
                    {cur != null ? (
                      <span className={`inline-flex items-center gap-1 font-bold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                        you: {cur}% {ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      </span>
                    ) : <span className="text-xs text-slate-400">no data</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Path to get there */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Path to Get There</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span> Class 11–12: focus on {career.stream === 'any' ? 'your chosen stream' : `${career.stream} subjects`}</div>
          <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span> Entrance exam: {(career.exams ?? []).join(', ') || 'as applicable'}</div>
          <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span> Degree &amp; specialisation</div>
          <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">★</span> Career begins</div>
        </div>
      </div>

      {/* Exams */}
      {(career.exams ?? []).length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500"><GraduationCap className="h-4 w-4" /> Key Entrance Exams</h2>
          <div className="flex flex-wrap gap-2">
            {career.exams.map((e) => <span key={e} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">{e}</span>)}
          </div>
        </div>
      )}

      {/* Colleges */}
      {(career.topColleges ?? []).length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500"><Building2 className="h-4 w-4" /> Top Colleges in India</h2>
          <ul className="space-y-1.5">
            {career.topColleges.map((col) => <li key={col} className="flex items-center gap-2 text-sm text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {col}</li>)}
          </ul>
        </div>
      )}

      {/* Salary */}
      {career.salaryRange && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-emerald-600"><IndianRupee className="h-4 w-4" /> Salary Range</h2>
          <p className="mt-1 text-xl font-black text-slate-900">{career.salaryRange}</p>
          <p className="text-xs text-slate-500">Starting → Experienced → Senior</p>
        </div>
      )}

      {/* CTA */}
      <button onClick={() => navigate('/school/student/career/report')} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
        {matchItem ? 'Back to My Report' : 'See My Career Report'} <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
