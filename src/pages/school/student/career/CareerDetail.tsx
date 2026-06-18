import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Check, AlertTriangle, GraduationCap, Building2,
  IndianRupee, ChevronRight, Sparkles, BookOpen, ListChecks,
  Clock, Briefcase, Brain, Award, CheckCircle2, XCircle, Compass, Calendar
} from 'lucide-react';
import api from '@/lib/api/school-client';
import {
  getCareerDetail, getCareerReport,
  type CareerPath, type CareerItem,
} from '@/lib/api/career';
import { ErrorState, SkeletonBlock, streamBadge, fitTextColor } from './_shared';

interface SubjectPerf { subjectName: string; accuracy: number }

function HollandModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">What is Holland Match?</h3>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-sm text-slate-600">
          <p className="leading-relaxed">
            The **Holland Codes (RIASEC)** is a universally recognized career guidance framework. It groups personality traits and career environments into six core interest areas:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="rounded-xl border border-slate-100 p-2.5">
              <span className="font-bold text-blue-600">R - Realistic</span>
              <p className="mt-0.5 text-slate-500 leading-normal">Hands-on, practical work like engineering, piloting, or building.</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-2.5">
              <span className="font-bold text-indigo-600">I - Investigative</span>
              <p className="mt-0.5 text-slate-500 leading-normal">Scientific, research-focused analysis like medicine or programming.</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-2.5">
              <span className="font-bold text-pink-600">A - Artistic</span>
              <p className="mt-0.5 text-slate-500 leading-normal">Creative design, imagination, and self-expression.</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-2.5">
              <span className="font-bold text-emerald-600">S - Social</span>
              <p className="mt-0.5 text-slate-500 leading-normal">Supporting, teaching, and nursing to help communities.</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-2.5">
              <span className="font-bold text-amber-600">E - Enterprising</span>
              <p className="mt-0.5 text-slate-500 leading-normal">Leadership, business start-ups, persuasion, and law.</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-2.5">
              <span className="font-bold text-slate-600">C - Conventional</span>
              <p className="mt-0.5 text-slate-500 leading-normal">Structured work involving auditing, data tracking, or finance.</p>
            </div>
          </div>

          <p className="leading-relaxed border-t border-slate-100 pt-3 text-xs text-slate-500">
            **How it works:** Our algorithm maps your interest quiz letters to each career's requirements to calculate your percentage compatibility match.
          </p>
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

// ── Synthesised view for AI-generated careers not in CAREER_PATHS ─────────────
function DynamicCareerDetail({ item, matchItem }: { item: CareerItem; matchItem: CareerItem | null }) {
  const navigate = useNavigate();
  const effectiveItem = matchItem ?? item;
  const [showHollandInfo, setShowHollandInfo] = useState(false);

  return (
    <div className="w-full space-y-5 p-1">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Header */}
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-blue-50/30 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
              <Sparkles className="h-3 w-3" /> AI-Suggested Career
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{effectiveItem.title}</h1>
          </div>
          {effectiveItem.fitScore > 0 && (
            <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${fitTextColor(effectiveItem.fitScore)}`}>
              {effectiveItem.fitScore}% match
            </span>
          )}
        </div>
        {effectiveItem.reasoning && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{effectiveItem.reasoning}</p>
        )}

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-violet-500" /> Duration
          </span>
          <p className="mt-2 text-sm md:text-base font-black text-slate-800">Flexible / Variable</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-violet-500" /> Salary Scale
          </span>
          <p className="mt-2 text-sm md:text-base font-black text-slate-800">Market Standard</p>
        </div>

        <div 
          onClick={() => setShowHollandInfo(true)}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-purple-200 hover:bg-purple-50/10 transition group"
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 group-hover:text-purple-600 transition-colors">
            <Brain className="h-3.5 w-3.5 text-violet-500" /> Holland Match
          </span>
          <p className="mt-2 text-sm md:text-base font-black text-slate-800 underline decoration-dotted decoration-slate-300 group-hover:text-purple-700 transition-colors">
            Learn More
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-violet-500" /> Stream
          </span>
          <p className="mt-2 text-sm md:text-base font-black text-slate-800">Agnostic / Custom</p>
        </div>
      </div>

      {/* Focus areas */}
      {effectiveItem.focusAreas?.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">
            <BookOpen className="h-4 w-4 text-blue-500" /> Focus Academically
          </h2>
          <div className="flex flex-wrap gap-2">
            {effectiveItem.focusAreas.map((f, i) => (
              <span key={i} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Action plan / timeline */}
      {effectiveItem.actionPlan?.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">
            <Compass className="h-4 w-4 text-blue-500" /> Your Next Steps &amp; Roadmap
          </h2>
          <div className="relative border-l border-blue-100 pl-8 ml-3 space-y-6">
            {effectiveItem.actionPlan.map((a, i) => (
              <div key={i} className="relative pl-2">
                <span className="absolute -left-[44px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-600 ring-4 ring-white">
                  {i + 1}
                </span>
                <p className="text-sm font-medium leading-relaxed text-slate-600">{a}</p>
              </div>
            ))}
            <div className="relative pl-2">
              <span className="absolute -left-[44px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-600 ring-4 ring-white">
                ★
              </span>
              <p className="text-sm font-bold leading-relaxed text-slate-800">Achieve Career Goals</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <button onClick={() => navigate('/school/student/career/report')}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
        Back to My Report <ChevronRight className="h-4 w-4" />
      </button>

      {showHollandInfo && <HollandModal onClose={() => setShowHollandInfo(false)} />}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CareerDetail() {
  const { careerId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fallbackCareer: CareerItem | undefined = (location.state as { fallbackCareer?: CareerItem } | null)?.fallbackCareer;

  const [career, setCareer] = useState<CareerPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchItem, setMatchItem] = useState<CareerItem | null>(null);
  const [marks, setMarks] = useState<SubjectPerf[]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const [showHollandInfo, setShowHollandInfo] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    getCareerDetail(careerId)
      .then((data) => {
        if (data) {
          setCareer(data);
          setUseFallback(false);
        } else if (fallbackCareer) {
          // Backend doesn't know this AI-generated career — use the report data
          setUseFallback(true);
        } else {
          setError('Career not found');
        }
      })
      .catch(() => {
        if (fallbackCareer) {
          setUseFallback(true);
        } else {
          setError('Career not found');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getCareerReport()
      .then((r) => setMatchItem(r?.topCareers.find((c) => c.careerId === careerId) ?? null))
      .catch(() => undefined);
    api.get('/reports/my-analytics')
      .then((res) => setMarks((res.data?.data?.subjectPerformance ?? []) as SubjectPerf[]))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerId]);

  if (loading) {
    return (
      <div className="w-full space-y-4 p-1">
        <SkeletonBlock className="h-10 w-2/3" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    );
  }

  // ── Fallback path: AI-generated career not in registry ───────────────────────
  if (useFallback && fallbackCareer) {
    return <DynamicCareerDetail item={fallbackCareer} matchItem={matchItem} />;
  }

  if (error || !career) {
    return <div className="w-full p-1"><ErrorState message={error || 'Career not found'} onRetry={load} /></div>;
  }

  // ── Standard path: career exists in CAREER_PATHS registry ────────────────────
  const studentPct = (subject: string): number | null => {
    const m = marks.find((x) =>
      x.subjectName.toLowerCase().includes(subject.toLowerCase()) ||
      subject.toLowerCase().includes(x.subjectName.toLowerCase())
    );
    return m ? Math.round(m.accuracy) : null;
  };
  const requiredEntries = Object.entries(career.requiredSubjects ?? {});
  const hasExams = (career.exams ?? []).length > 0;
  const hasColleges = (career.topColleges ?? []).length > 0;

  // Visual roadmap steps: Use static educationPath if populated, else fallback to custom action plan, else generic steps
  const timelineSteps = (career.educationPath && career.educationPath.length > 0)
    ? career.educationPath
    : (matchItem?.actionPlan && matchItem.actionPlan.length > 0)
      ? matchItem.actionPlan
      : [
          `Class 11–12: focus on ${career.stream === 'any' ? 'your chosen stream' : `${career.stream} subjects`}.`,
          `Entrance exam: ${career.exams.join(', ') || 'qualify for relevant university admissions'}.`,
          'Degree, professional training & specialisation.'
        ];

  return (
    <div className="w-full space-y-6 p-1">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Header card with at-a-glance metrics */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            {/* Custom/AI-generated career badge */}
            {!hasExams && !hasColleges && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
                <Sparkles className="h-3 w-3" /> AI-Suggested Career
              </div>
            )}
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{career.title}</h1>
          </div>
          <span className={`shrink-0 rounded px-2.5 py-1 text-xs font-black uppercase tracking-wider ${streamBadge(career.stream)}`}>
            {career.stream}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{career.description}</p>
        
        {matchItem && (
          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3 rounded-xl bg-violet-50/50 p-3 border border-violet-100/40">
            <span className={`w-fit rounded-lg px-2.5 py-1 text-xs font-black shrink-0 ${fitTextColor(matchItem.fitScore)}`}>
              Your Fit Score: {matchItem.fitScore}%
            </span>
            {matchItem.reasoning && (
              <p className="text-xs text-slate-500 leading-normal font-medium">{matchItem.reasoning}</p>
            )}
          </div>
        )}

      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Duration */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-500" /> Duration
          </span>
          <p className="mt-2 text-sm md:text-base font-black text-slate-800">{career.duration || 'Variable'}</p>
        </div>

        {/* Card 2: Salary Range */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-500" /> Salary Range
          </span>
          <p className="mt-2 text-sm md:text-base font-black text-slate-800">{career.salaryRange || 'N/A'}</p>
        </div>

        {/* Card 3: Holland Match */}
        <div 
          onClick={() => setShowHollandInfo(true)}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-purple-200 hover:bg-purple-50/10 transition group"
        >
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 group-hover:text-purple-600 transition-colors">
            <Brain className="h-3.5 w-3.5 text-purple-500" /> Holland Match
          </span>
          <p className="mt-2 text-sm md:text-base font-black text-slate-800 underline decoration-dotted decoration-slate-300 group-hover:text-purple-700 transition-colors">
            {career.hollandMatch && career.hollandMatch.length > 0 
              ? career.hollandMatch.join(' + ') 
              : 'N/A'}
          </p>
        </div>

        {/* Card 4: Stream */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-500" /> Stream
          </span>
          <p className="mt-2 text-sm md:text-base font-black uppercase text-slate-800">{career.stream}</p>
        </div>
      </div>

      {/* Skills & Job Roles */}
      {((career.keySkills ?? []).length > 0 || (career.jobRoles ?? []).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Skills */}
          {(career.keySkills ?? []).length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">
                <Brain className="h-4 w-4 text-indigo-500" /> Essential Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {career.keySkills.map((skill) => (
                  <span key={skill} className="rounded-lg bg-indigo-50 border border-indigo-100/30 px-2.5 py-1 text-xs font-bold text-indigo-600">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Roles */}
          {(career.jobRoles ?? []).length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">
                <Briefcase className="h-4 w-4 text-amber-500" /> Job Profiles
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {career.jobRoles.map((role) => (
                  <span key={role} className="rounded-lg bg-amber-50 border border-amber-100/30 px-2.5 py-1 text-xs font-bold text-amber-800">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Side-by-side: Required Subjects & Education Roadmap */}
      {(requiredEntries.length > 0 || timelineSteps.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Required subjects comparison */}
          {requiredEntries.length > 0 ? (
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
                        <span className="text-slate-400 text-xs">needs {minPct}%</span>
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
          ) : <div />}

          {/* Education Timeline */}
          {timelineSteps.length > 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-6 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">
                <Compass className="h-4 w-4 text-blue-500" /> Education Roadmap &amp; Milestones
              </h2>
              <div className="relative border-l border-blue-100 pl-8 ml-3 space-y-6">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="relative pl-2">
                    {/* Dot */}
                    <span className="absolute -left-[44px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-600 ring-4 ring-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-relaxed text-slate-600">{step}</p>
                    </div>
                  </div>
                ))}
                <div className="relative pl-2">
                  <span className="absolute -left-[44px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-600 ring-4 ring-white">
                    ★
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-relaxed text-slate-800">Launch Professional Career</p>
                  </div>
                </div>
              </div>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Academic Focus (if applicable from matching AI report) */}
      {matchItem?.focusAreas && matchItem.focusAreas.length > 0 && !career.keySkills && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">
            <BookOpen className="h-4 w-4 text-blue-500" /> Focus Academically
          </h2>
          <div className="flex flex-wrap gap-2">
            {matchItem.focusAreas.map((f, i) => (
              <span key={i} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-side: Entrance Exams & Top Colleges */}
      {(hasExams || hasColleges) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Exams */}
          {hasExams ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">
                <GraduationCap className="h-4 w-4 text-blue-500" /> Key Entrance Exams
              </h2>
              <div className="flex flex-wrap gap-2">
                {career.exams.map((e) => (
                  <span key={e} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">{e}</span>
                ))}
              </div>
            </div>
          ) : <div />}

          {/* Colleges */}
          {hasColleges ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-slate-500">
                <Building2 className="h-4 w-4 text-blue-500" /> Top Colleges &amp; Institutions
              </h2>
              <ul className="space-y-2">
                {career.topColleges.map((col) => (
                  <li key={col} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {col}
                  </li>
                ))}
              </ul>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Pros & Cons Section */}
      {career.prosCons && (career.prosCons.pros?.length > 0 || career.prosCons.cons?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pros */}
          {career.prosCons.pros?.length > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/10 p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-emerald-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Key Advantages
              </h3>
              <ul className="space-y-2.5">
                {career.prosCons.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {career.prosCons.cons?.length > 0 && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/10 p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-rose-500">
                <XCircle className="h-4 w-4 text-rose-500" /> Challenges &amp; Realities
              </h3>
              <ul className="space-y-2.5">
                {career.prosCons.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-400" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <button onClick={() => navigate('/school/student/career/report')}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
        {matchItem ? 'Back to My Report' : 'See My Career Report'} <ChevronRight className="h-4 w-4" />
      </button>

      {showHollandInfo && <HollandModal onClose={() => setShowHollandInfo(false)} />}
    </div>
  );
}
