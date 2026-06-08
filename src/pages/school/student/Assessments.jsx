import React, { useEffect, useRef, useState } from 'react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { getApiOrigin } from '@/lib/api-config';
import { ClipboardList, Clock, FileText, Download, CheckCircle2, Trophy, BarChart3, Save, ShieldCheck, Timer, X, Award, MessageSquare, Target, Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

function resolveUploadUrl(filePath) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const clean = String(filePath).replace(/^\.\//, '').replace(/^uploads[/\\]/, '');
  return `${getApiOrigin()}/uploads/${clean}`;
}

function GradeChip({ grade }) {
  const colors = {
    'A+': 'bg-emerald-100 text-emerald-700',
    'A':  'bg-green-100 text-green-700',
    'B':  'bg-blue-100 text-blue-700',
    'C':  'bg-amber-100 text-amber-700',
    'D':  'bg-orange-100 text-orange-700',
    'F':  'bg-rose-100 text-rose-700',
  };
  const cls = colors[grade] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-black ${cls}`}>
      {grade || '—'}
    </span>
  );
}

export default function Assessments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [assessments, setAssessments] = useState([]);
  // myResults: array of { assessment, result } objects
  const [myResults, setMyResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [answerFile, setAnswerFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const answerFileRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const testsRes = await api.get('/assessments');
        setAssessments(unwrapSchoolList(testsRes));
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch results when switching to the results tab
  useEffect(() => {
    if (activeTab !== 'results' || !assessments.length) return;
    const fetchResults = async () => {
      setResultsLoading(true);
      try {
        const pairs = await Promise.all(
          assessments.map(async (asm) => {
            try {
              const res = await api.get(`/assessments/${asm.id}/results`);
              const all = res.data?.data ?? res.data ?? [];
              const mine = Array.isArray(all)
                ? all.find(
                    (r) =>
                      String(r.student_id) === String(user?.id) ||
                      String(r.student_user_id) === String(user?.id)
                  ) ?? (all.length === 1 ? all[0] : null)
                : null;
              return { assessment: asm, result: mine ?? null };
            } catch {
              return { assessment: asm, result: null };
            }
          })
        );
        // Show only assessments that have a result OR were scheduled in past
        setMyResults(pairs.filter((p) => p.result || p.assessment.status === 'completed'));
      } catch (err) {
        console.error('Failed to load results', err);
      } finally {
        setResultsLoading(false);
      }
    };
    fetchResults();
  }, [activeTab, assessments, user?.id]);

  const openSubmit = (test) => {
    setSubmitTarget(test);
    setAnswerText(test.mySubmission?.answer_text || test.mySubmission?.answerText || '');
    setAnswerFile(null);
  };

  const closeSubmit = () => {
    setSubmitTarget(null);
    setAnswerText('');
    setAnswerFile(null);
  };

  const handleAssessmentSubmit = async () => {
    if (!submitTarget) return;
    if (!answerText.trim() && !answerFile) {
      toast.error('Write your answer or upload an answer file');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      if (answerText.trim()) data.append('answerText', answerText.trim());
      if (answerFile) data.append('file', answerFile);
      await api.post(`/assessments/${submitTarget.id}/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Assessment submitted');
      closeSubmit();
      const testsRes = await api.get('/assessments');
      setAssessments(unwrapSchoolList(testsRes));
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Assessments</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Practice tests, topic tests, unit tests, subject tests, mock exams, and final exams.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {['Practice', 'Topic', 'Unit', 'Subject', 'Mock', 'Final'].map((label) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">{label} Tests</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Available when published.</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Timer className="h-5 w-5 text-blue-600" />
          <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Real-Time Timer</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <Save className="h-5 w-5 text-emerald-600" />
          <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Auto Save</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <ShieldCheck className="h-5 w-5 text-amber-600" />
          <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Anti-Cheat Monitoring</p>
        </div>
        <div className="rounded-lg border border-violet-100 bg-violet-50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">Instant Result</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-full overflow-x-auto border-b border-slate-100 pb-px custom-scrollbar dark:border-slate-800">
        <div className="flex gap-6">
          {[
            { id: 'available', label: 'Available Tests' },
            { id: 'results',   label: 'My Results' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap border-b-2 py-3 text-sm font-bold transition-all',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'available' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
               <ClipboardList className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">No available tests</h3>
               <p className="mt-1 text-sm text-slate-500">You don't have any pending assessments right now.</p>
             </div>
          ) : (
            assessments.map((test) => {
              const uploadUrl = resolveUploadUrl(test.file_path || test.filePath);
              const mySubmission = test.mySubmission || test.my_submission;
              const submittedFileUrl = resolveUploadUrl(mySubmission?.file_path || mySubmission?.filePath);
              return (
              <div key={test.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {test.type || test.assessment_type || 'Assessment'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {test.status || 'scheduled'}
                    </span>
                  </div>
                  
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                    {test.title}
                  </h3>
                  
                  <p className="mb-6 text-sm text-slate-500 line-clamp-2">
                    {test.content_text || 'Your teacher has posted this assessment. Open it to view instructions or download the question paper.'}
                  </p>
                  
                  <div className="mb-6 flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      <span>{test.duration_minutes || test.durationMinutes || 60} mins</span>
                    </div>
                    <div>{test.total_marks || test.totalMarks || 100} marks</div>
                  </div>
                  
                  <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {mySubmission && (
                      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <CheckCircle2 size={16} />
                        Submitted online
                      </div>
                    )}
                    <button 
                      onClick={() => setSelectedAssessment(test)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                    >
                      <FileText size={16} />
                      View Assessment
                    </button>
                    {uploadUrl && (
                      <a
                        href={uploadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        <Download size={16} />
                        Download Paper
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openSubmit(test)}
                      className={cn(
                        'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors',
                        mySubmission
                          ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20'
                      )}
                    >
                      <UploadCloud size={16} />
                      {mySubmission ? 'Update Submission' : 'Submit Online'}
                    </button>
                    {submittedFileUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(submittedFileUrl, '_blank')}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100"
                      >
                        <FileText size={16} />
                        View my submission
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {resultsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          ) : myResults.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <BarChart3 className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No results yet</h3>
              <p className="mt-1 text-sm text-slate-500">Your teacher hasn't published any marks yet. Check back after assessments are graded.</p>
            </div>
          ) : (
            myResults.map(({ assessment, result }) => {
              const totalMarks = Number(assessment.total_marks ?? assessment.totalMarks ?? 100);
              const marks      = result ? Number(result.marks_obtained ?? 0) : null;
              const pct        = marks != null && totalMarks ? Math.round((marks / totalMarks) * 100) : null;
              const isAbsent   = Boolean(result?.is_absent);
              const grade      = result?.grade ?? null;
              const remarks    = result?.remarks ?? null;
              const hasResult  = !!result;

              const barColor =
                !hasResult   ? 'bg-slate-200'
                : isAbsent   ? 'bg-rose-400'
                : pct >= 75  ? 'bg-emerald-500'
                : pct >= 50  ? 'bg-blue-500'
                : pct >= 33  ? 'bg-amber-500'
                :              'bg-rose-500';

              return (
                <div key={assessment.id} className="rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                    {/* Left: title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {assessment.type || 'Assessment'}
                        </span>
                        {hasResult && !isAbsent && grade && <GradeChip grade={grade} />}
                        {isAbsent && (
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-600">Absent</span>
                        )}
                        {!hasResult && (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-600">Pending</span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
                        {assessment.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {assessment.total_marks ?? 100} marks · {assessment.duration_minutes ?? 60} mins
                        {assessment.scheduled_date && ` · ${new Date(assessment.scheduled_date).toLocaleDateString()}`}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                          <span>{hasResult && !isAbsent ? `${marks} / ${totalMarks} marks` : isAbsent ? 'Absent' : 'Not graded'}</span>
                          {pct != null && !isAbsent && <span>{pct}%</span>}
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                            style={{ width: hasResult && !isAbsent ? `${pct}%` : '0%' }}
                          />
                        </div>
                      </div>

                      {/* Remarks */}
                      {remarks && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/20">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 line-clamp-2">
                            {remarks}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: score circle + action */}
                    <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-end">
                      {hasResult && !isAbsent && pct != null ? (
                        <div className={cn(
                          'flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-white font-black shadow-sm',
                          pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : pct >= 33 ? 'bg-amber-500' : 'bg-rose-500'
                        )}>
                          <span className="text-lg">{pct}</span>
                          <span className="text-[10px] font-bold">%</span>
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <Award className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                      <Link
                        to={`/school/student/assessments/${assessment.id}`}
                        className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 transition dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        <BarChart3 size={14} /> View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedAssessment.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {(selectedAssessment.type || 'Assessment')} | {selectedAssessment.total_marks || 100} marks | {selectedAssessment.duration_minutes || 60} mins
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              {selectedAssessment.content_text ? (
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {selectedAssessment.content_text}
                </pre>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                  No text instructions were added. Download the uploaded question paper if available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {submitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Submit: {submitTarget.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Write your answer online, upload an answer file, or do both.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSubmit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                Answer
              </label>
              <textarea
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                rows={10}
                placeholder="Type your assessment answer here..."
                className="mt-2 w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <input
                ref={answerFileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                onChange={(event) => setAnswerFile(event.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => answerFileRef.current?.click()}
                className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:text-slate-300"
              >
                <UploadCloud size={28} className="text-blue-500" />
                {answerFile ? answerFile.name : 'Choose answer file to upload'}
              </button>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-5 dark:border-slate-800">
              <button
                type="button"
                onClick={closeSubmit}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleAssessmentSubmit}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
