import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Calendar, AlertCircle,
  BarChart3, Target, ClipboardList, TrendingUp, BookOpen, AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { cn } from '@/lib/utils';
import ScoreTrendChart, { scoreTrendDelta } from '@/components/school/student/ScoreTrendChart';

/**
 * Teacher's view of one student: PERFORMANCE ONLY.
 *
 * Deliberately no personal, family, medical or document details and no exportable
 * reports - a teacher opening a student from "Assigned Students" is here to see how the
 * student is doing. The page loads a single endpoint (GET /reports/student-performance),
 * which is scoped server-side to students in sections the teacher teaches and returns
 * only a name, photo, roll number and status for the header, so none of those other
 * details are ever sent to this page.
 */

const getInitials = (name?: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Colour for a percentage: 75+ strong, 60-74 steady, below 60 needs focus (same bands as the server).
const bandStyle = (pct: number | null | undefined) => {
  if (pct == null) return { text: 'text-slate-400', bar: 'bg-slate-300', chip: 'bg-slate-100 text-slate-500', label: 'No data' };
  if (pct >= 75) return { text: 'text-emerald-600', bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700', label: 'Strong' };
  if (pct >= 60) return { text: 'text-blue-600', bar: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700', label: 'Steady' };
  return { text: 'text-rose-600', bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700', label: 'Needs focus' };
};

const StatCard = ({ icon: Icon, label, value, hint, tone }: { icon: any; label: string; value: React.ReactNode; hint?: string; tone?: string }) => (
  <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
    <Icon size={18} className={cn('mb-2', tone || 'text-blue-500')} />
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">{value}</div>
    {hint && <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{hint}</div>}
  </div>
);

const Panel = ({ title, icon: Icon, right, children, className }: { title: string; icon: any; right?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 sm:p-6 shadow-sm', className)}>
    <div className="flex items-center justify-between gap-2 mb-4">
      <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
        <Icon size={16} className="text-blue-500" /> {title}
      </h3>
      {right}
    </div>
    {children}
  </div>
);

const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [perf, setPerf] = useState<any>(null);
  const [perfLoading, setPerfLoading] = useState(true);
  const [perfError, setPerfError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setPerfLoading(true);
    setPerfError(null);
    api.get('/reports/student-performance', { params: { studentId: id } })
      .then((res) => { if (!cancelled) setPerf(res.data?.data ?? res.data); })
      .catch((err) => {
        if (!cancelled) setPerfError(err?.response?.data?.message || 'Could not load performance data.');
      })
      .finally(() => { if (!cancelled) setPerfLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (perfLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading performance...</div>;
  }

  if (perfError || !perf) {
    return (
      <div className="p-12 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-red-50 border border-red-100 shadow-xl shadow-red-200/20">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold tracking-tight text-red-900 mb-2">Student Not Available</h2>
          <p className="text-sm font-bold text-red-600 mb-6">{perfError || "We couldn't load this student's performance."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const student = perf.student || {};
  const className = perf.profile?.class_name;
  const sectionName = perf.profile?.section_name;

  return (
    <div className="w-full pb-24 sm:pb-36">
      <div className="mb-6 px-4 sm:px-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors text-sm"
        >
          <ArrowLeft size={18} /> Back to Students
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
        {/* Header: who this is, nothing more */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="size-20 sm:size-24 rounded-3xl border-4 border-white/30 bg-white/10 backdrop-blur-md overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
              {student.profileImage ? (
                <img src={student.profileImage} alt={student.name} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-2xl font-black text-white">
                  {getInitials(student.name)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight break-words">{student.name}</h1>
                {student.isActive != null && (
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider',
                    student.isActive ? 'bg-emerald-500/90 border-emerald-400' : 'bg-slate-800/90 border-slate-600 text-slate-200',
                  )}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-blue-100">
                <span className="bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10">
                  {className ? `${className.toLowerCase().startsWith('class') ? className : `Class ${className}`} / ${sectionName || '—'}` : '—'}
                </span>
                {student.rollNo && (
                  <span className="bg-white/15 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10">Roll No {student.rollNo}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-10 pt-6 pb-10 sm:pb-14">
          <h2 className="mb-6 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            <BarChart3 size={16} className="text-blue-500" /> Performance
          </h2>

          {(() => {
              const att = perf.attendance?.overall;
              const att30 = perf.attendance?.last30Days;
              const asg = perf.assignments;
              const delta = scoreTrendDelta(perf.scoreTrend);
              const overall = perf.examsTaken > 0 ? perf.overallAccuracy : null;
              const noResults = !perf.examsTaken;
              return (
                <div className="space-y-6">
                  {/* Headline numbers */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard icon={Target} label="Overall Score" value={overall != null ? `${overall}%` : '—'} hint={overall != null ? bandStyle(overall).label : 'No results yet'} tone={bandStyle(overall).text} />
                    <StatCard icon={FileText} label="Exams Taken" value={perf.examsTaken || 0} tone="text-indigo-500" />
                    <StatCard icon={Calendar} label="Attendance" value={att?.percent != null ? `${att.percent}%` : '—'} hint={att30?.percent != null ? `${att30.percent}% in last 30 days` : 'No records'} tone={bandStyle(att?.percent).text} />
                    <StatCard icon={ClipboardList} label="Assignments" value={asg?.total ? `${asg.submitted}/${asg.total}` : '—'} hint={asg?.submissionRate != null ? `${asg.submissionRate}% submitted` : 'None assigned'} tone="text-amber-500" />
                    <StatCard icon={TrendingUp} label="Assignment Score" value={asg?.avgPercent != null ? `${asg.avgPercent}%` : '—'} hint={asg?.graded ? `${asg.graded} graded` : 'Nothing graded yet'} tone={bandStyle(asg?.avgPercent).text} />
                  </div>

                  {perf.insight && !noResults && (
                    <div className="rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 px-5 py-4 text-sm font-semibold text-blue-900 dark:text-blue-100">
                      {perf.insight.replace(/^Your overall score/, `${student.name}'s overall score`).replace(/\byour\b/gi, 'their')}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Score trend */}
                    <Panel
                      title="Score Trend"
                      icon={TrendingUp}
                      className="lg:col-span-2"
                      right={delta !== null ? (
                        <span className={cn('rounded-full px-3 py-1 text-xs font-black', delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                          {delta >= 0 ? '+' : ''}{delta}% since first result
                        </span>
                      ) : undefined}
                    >
                      {perf.scoreTrend?.length ? (
                        <ScoreTrendChart data={perf.scoreTrend} height={240} />
                      ) : (
                        <p className="py-10 text-center text-sm text-slate-400 font-semibold">No exam results published yet.</p>
                      )}
                    </Panel>

                    {/* Focus areas */}
                    <Panel title="Focus Areas" icon={AlertTriangle}>
                      {noResults ? (
                        <p className="text-sm text-slate-400 font-semibold">Appears once exam results are published.</p>
                      ) : perf.focusAreas?.length ? (
                        <div className="space-y-3">
                          {perf.focusAreas.map((f: any) => (
                            <div key={f.subjectName} className="flex items-center justify-between rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 px-4 py-3">
                              <span className="text-sm font-bold text-rose-900 dark:text-rose-200">{f.subjectName}</span>
                              <span className="text-sm font-black text-rose-600">{f.accuracy}%</span>
                            </div>
                          ))}
                          <p className="text-[11px] font-semibold text-slate-400">Subjects averaging below 60%.</p>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-4 py-4 text-sm font-bold text-emerald-800 dark:text-emerald-200">
                          No subject is below 60%.
                        </div>
                      )}
                    </Panel>
                  </div>

                  {/* Subject performance */}
                  <Panel title="Subject Performance" icon={BookOpen}>
                    {perf.subjects?.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {perf.subjects.map((sub: any) => {
                          const st = bandStyle(sub.accuracy);
                          return (
                            <div key={sub.subjectName} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{sub.subjectName}</div>
                                  <div className="text-[11px] font-semibold text-slate-400">{sub.exams} exam{sub.exams === 1 ? '' : 's'}</div>
                                </div>
                                <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider', st.chip)}>{st.label}</span>
                              </div>
                              <div className={cn('text-3xl font-black mt-2', st.text)}>{sub.accuracy}%</div>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div className={cn('h-full rounded-full', st.bar)} style={{ width: `${Math.min(100, sub.accuracy)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-6 text-center text-sm text-slate-400 font-semibold">No subject results yet.</p>
                    )}
                  </Panel>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent exam results */}
                    <Panel title="Recent Exam Results" icon={FileText}>
                      {perf.recentResults?.length ? (
                        <div className="space-y-3">
                          {perf.recentResults.slice(0, 6).map((r: any) => {
                            const st = bandStyle(r.isAbsent ? null : r.percentage);
                            return (
                              <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{r.assessmentTitle || 'Assessment'}</div>
                                  <div className="text-[11px] font-semibold text-slate-400 truncate">
                                    {r.subjectName}{r.date ? ` · ${new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : ''}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  {r.isAbsent ? (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-slate-500">Absent</span>
                                  ) : (
                                    <>
                                      <div className={cn('text-lg font-black leading-none', st.text)}>{r.percentage}%</div>
                                      <div className="text-[11px] font-semibold text-slate-400">{r.marksObtained}/{r.totalMarks}{r.grade ? ` · ${r.grade}` : ''}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="py-6 text-center text-sm text-slate-400 font-semibold">No exam results published yet.</p>
                      )}
                    </Panel>

                    {/* Assignments */}
                    <Panel title="Assignments" icon={ClipboardList}>
                      {asg?.total ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-5 gap-2 text-center">
                            {([
                              ['Graded', asg.graded, 'text-emerald-600'],
                              ['To grade', asg.awaitingGrading, 'text-blue-600'],
                              ['Pending', asg.pending, 'text-slate-600'],
                              ['Overdue', asg.overdue, 'text-rose-600'],
                              ['Late', asg.late, 'text-amber-600'],
                            ] as const).map(([label, n, tone]) => (
                              <div key={label} className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 py-2.5">
                                <div className={cn('text-xl font-black', tone)}>{n}</div>
                                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2">
                            {asg.recent.map((a: any) => (
                              <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-2.5">
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{a.title}{a.isGroup ? ' (group)' : ''}</div>
                                  <div className="text-[11px] font-semibold text-slate-400 truncate">
                                    {a.subject || 'General'}{a.dueDate ? ` · due ${new Date(a.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : ''}
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  {a.isLate && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700">Late</span>}
                                  {a.percent != null && <span className={cn('text-sm font-black', bandStyle(a.percent).text)}>{a.percent}%</span>}
                                  <span className={cn(
                                    'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
                                    a.state === 'graded' ? 'bg-emerald-50 text-emerald-700' :
                                    a.state === 'submitted' ? 'bg-blue-50 text-blue-700' :
                                    a.state === 'overdue' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500',
                                  )}>
                                    {a.state === 'submitted' ? 'To grade' : a.state}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="py-6 text-center text-sm text-slate-400 font-semibold">No assignments given to this student yet.</p>
                      )}
                    </Panel>
                  </div>

                  {/* Attendance */}
                  <Panel title="Attendance" icon={Calendar}>
                    {att?.total ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 col-span-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overall</div>
                          <div className={cn('text-3xl font-black', bandStyle(att.percent).text)}>{att.percent}%</div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div className={cn('h-full rounded-full', bandStyle(att.percent).bar)} style={{ width: `${att.percent}%` }} />
                          </div>
                          <div className="mt-1 text-[11px] font-semibold text-slate-400">
                            Last 30 days: {att30?.percent != null ? `${att30.percent}%` : '—'}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center text-emerald-600">
                          <div className="text-2xl font-black">{att.present}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest">Present</div>
                        </div>
                        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center text-red-500">
                          <div className="text-2xl font-black">{att.absent}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest">Absent{att.leave ? ` · ${att.leave} leave` : ''}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="py-6 text-center text-sm text-slate-400 font-semibold">No attendance recorded yet.</p>
                    )}
                  </Panel>
                </div>
              );
          })()}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
