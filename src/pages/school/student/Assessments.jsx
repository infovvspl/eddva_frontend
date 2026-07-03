import React, { useEffect, useRef, useState } from 'react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { getApiOrigin } from '@/lib/api-config';
import { ClipboardList, Clock, FileText, Download, CheckCircle2, Trophy, BarChart3, X, Award, MessageSquare, Target, Loader2, UploadCloud, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import AssessmentContentRenderer from '@/components/school/AssessmentContentRenderer';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CustomSelect } from "@/components/ui/CustomSelect";

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

function formatRemaining(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getStructuredQuestions(test) {
  const questions = test?.questions || test?.questions_json || test?.questionsJson || [];
  return Array.isArray(questions) ? questions : [];
}

function getQuestionTypeLabel(type) {
  const labels = {
    mcq_single: 'Multiple choice',
    true_false: 'True / False',
    fill_blank: 'Fill in the blank',
    integer: 'Integer',
    short_answer: 'Short answer',
    long_answer: 'Long answer',
  };
  return labels[type] || 'Question';
}

const TEST_TYPE_FILTERS = [
  { id: 'topic', label: 'Topic Tests', icon: ClipboardList },
  { id: 'chapter', label: 'Chapter Tests', icon: BarChart3 },
  { id: 'subject', label: 'Subject Tests', icon: FileText },
  { id: 'mock', label: 'Mock Tests', icon: Trophy },
  { id: 'final', label: 'Final Exams', icon: Target },
];

function normalizeAssessmentType(test) {
  const raw = String(test?.assessment_type || test?.type || '').toLowerCase().trim();
  if (raw.includes('chapter') || raw.includes('unit')) return 'chapter';
  if (raw.includes('subject')) return 'subject';
  if (raw.includes('mock')) return 'mock';
  if (raw.includes('final')) return 'final';
  return 'topic';
}

function getAssessmentSubjectId(test) {
  return test?.subject_id || test?.subjectId || test?.subject?.id || '';
}

function getAssessmentMeta(test, subjectNameById = {}) {
  const content = String(test?.content_text || test?.contentText || '');
  const firstLine = content.split(/\r?\n/).find((line) => line.trim())?.replace(/^#+\s*/, '').trim() || '';
  const classFromText = content.match(/\bClass\s*[:\-]?\s*([A-Za-z0-9 -]+?)(?=\s+(?:Maximum\s+Marks|Max\s+Marks|Time\s+Allowed|Duration|Subject)\b|[.\n\r]|$)/i)?.[1]?.trim();
  const subjectFromText = content.match(/\bSubject\s*[:\-]?\s*([A-Za-z0-9 &-]+?)(?=\s+(?:Class|Maximum\s+Marks|Max\s+Marks|Time\s+Allowed|Duration)\b|[.\n\r]|$)/i)?.[1]?.trim();
  const marksFromText = content.match(/\bMaximum\s+Marks\s*[:\-]?\s*(\d+)/i)?.[1]?.trim();
  const timeFromText = content.match(/\bTime\s+Allowed\s*[:\-]?\s*([A-Za-z0-9 ]+)/i)?.[1]?.trim();
  const subjectFromHeading = firstLine?.match(/^([A-Za-z][A-Za-z &-]*?)\s+Class\b/i)?.[1]?.trim();
  const subjectId = getAssessmentSubjectId(test);

  const className = test?.class_name || test?.className || test?.class?.name || classFromText;
  const subjectName = subjectNameById[subjectId] || test?.subject_name || test?.subjectName || test?.subject?.name || subjectFromText || subjectFromHeading;
  const totalMarks = test?.total_marks || test?.totalMarks || marksFromText || 100;
  const duration = test?.duration_minutes || test?.durationMinutes || timeFromText || 60;
  const durationText = String(duration).toLowerCase().includes('min') ? duration : `${duration} minutes`;

  return { className, subjectName, subjectId, totalMarks, durationText };
}

function getAssessmentSubjectName(test, subjectNameById = {}) {
  return getAssessmentMeta(test, subjectNameById).subjectName || 'General';
}

function getAssessmentSummary(test, subjectNameById = {}) {
  const { className, subjectName, totalMarks, durationText } = getAssessmentMeta(test, subjectNameById);
  return [
    className ? `Class: ${className}` : null,
    subjectName ? `Subject: ${subjectName}` : null,
    `Max Marks: ${totalMarks}`,
    `Time Allowed: ${durationText}`,
  ].filter(Boolean).join(' | ');
}

export default function Assessments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('available');
  const [typeFilter, setTypeFilter] = useState('topic');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classSubjects, setClassSubjects] = useState([]);
  const [assessments, setAssessments] = useState([]);
  // myResults: array of { assessment, result } objects
  const [myResults, setMyResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [answerFile, setAnswerFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptStarting, setAttemptStarting] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [structuredAnswers, setStructuredAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const answerFileRef = useRef(null);
  const latestAnswerTextRef = useRef('');
  const latestAnswerFileRef = useRef(null);
  const latestStructuredAnswersRef = useRef({});
  const autoSubmitRef = useRef(false);

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

  useEffect(() => {
    const sectionId = user?.studentProfile?.sectionId || user?.sectionId;
    if (!sectionId) {
      setClassSubjects([]);
      return;
    }
    const fetchClassSubjects = async () => {
      try {
        const res = await api.get(`/academic/sections/${sectionId}/teaching-map`);
        const data = res.data?.data ?? res.data ?? {};
        const subjects = Array.isArray(data.subjects) ? data.subjects : [];
        setClassSubjects(
          subjects
            .map((subject) => ({
              id: subject.subjectId || subject.id,
              name: subject.subjectName || subject.name,
            }))
            .filter((subject) => subject.id && subject.name)
        );
      } catch (error) {
        console.error('Failed to fetch class subjects:', error);
        setClassSubjects([]);
      }
    };
    fetchClassSubjects();
  }, [user?.studentProfile?.sectionId, user?.sectionId]);


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

  useEffect(() => {
    latestAnswerTextRef.current = answerText;
  }, [answerText]);

  useEffect(() => {
    latestAnswerFileRef.current = answerFile;
  }, [answerFile]);

  useEffect(() => {
    latestStructuredAnswersRef.current = structuredAnswers;
  }, [structuredAnswers]);

  useEffect(() => {
    if (!submitTarget || !attempt?.expires_at || attempt?.status !== 'in_progress') return;
    autoSubmitRef.current = false;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(attempt.expires_at).getTime() - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        handleAssessmentSubmit(true);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [submitTarget, attempt?.expires_at, attempt?.status]);

  const refreshAssessments = async () => {
    const testsRes = await api.get('/assessments');
    setAssessments(unwrapSchoolList(testsRes));
  };

  const openSubmit = async (test) => {
    const existing = test.mySubmission || test.my_submission;
    if (existing && existing.status !== 'in_progress') {
      toast.info('This assessment is already submitted. Your teacher can grade it now.');
      return;
    }
    navigate(`/school/student/assessments/${test.id}/take`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const closeSubmit = () => {
    setSubmitTarget(null);
    setAnswerText('');
    setAnswerFile(null);
    setAttempt(null);
    setRemainingSeconds(0);
    setStructuredAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleAssessmentSubmit = async (autoSubmit = false) => {
    if (!submitTarget) return;
    const questions = getStructuredQuestions(submitTarget);
    const answersForSubmit = autoSubmit ? latestStructuredAnswersRef.current : structuredAnswers;
    const currentAnswerText = autoSubmit ? latestAnswerTextRef.current : answerText;
    const currentAnswerFile = autoSubmit ? latestAnswerFileRef.current : answerFile;
    const hasStructuredAnswer = questions.some((question) => {
      const value = answersForSubmit?.[question.id];
      return Array.isArray(value) ? value.length > 0 : String(value ?? '').trim().length > 0;
    });
    if (!autoSubmit && !questions.length && !currentAnswerText.trim() && !currentAnswerFile) {
      toast.error('Write your answer or upload an answer file');
      return;
    }
    if (!autoSubmit && questions.length && !hasStructuredAnswer) {
      toast.error('Answer at least one question before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      if (currentAnswerText.trim()) data.append('answerText', currentAnswerText.trim());
      if (currentAnswerFile) data.append('file', currentAnswerFile);
      if (questions.length) data.append('answersJson', JSON.stringify(answersForSubmit || {}));
      if (autoSubmit) data.append('autoSubmit', 'true');
      await api.post(`/assessments/${submitTarget.id}/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(autoSubmit ? 'Time is over. Assessment auto-submitted.' : 'Assessment submitted');
      closeSubmit();
      await refreshAssessments();
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const saveStructuredAnswer = async (questionId, value) => {
    if (!submitTarget || !questionId || attempt?.status !== 'in_progress') return;
    try {
      await api.post(`/assessments/${submitTarget.id}/answer`, { questionId, answer: value });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const updateStructuredAnswer = (questionId, value, shouldSave = true) => {
    setStructuredAnswers((current) => {
      const next = { ...current, [questionId]: value };
      latestStructuredAnswersRef.current = next;
      return next;
    });
    if (shouldSave) {
      void saveStructuredAnswer(questionId, value);
    }
  };

  const renderStructuredAnswerInput = (question) => {
    const value = structuredAnswers?.[question.id] ?? '';
    const type = question.type || 'short_answer';
    if (type === 'mcq_single') {
      const options = Array.isArray(question.options) ? question.options : [];
      return (
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id || option.value || option.text}
              type="button"
              onClick={() => updateStructuredAnswer(question.id, option.id || option.value || option.text)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition',
                String(value) === String(option.id || option.value || option.text)
                  ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs uppercase">
                {option.id || option.value || ''}
              </span>
              <span>{option.text || option.label || option.value}</span>
            </button>
          ))}
        </div>
      );
    }
    if (type === 'true_false') {
      return (
        <div className="grid grid-cols-2 gap-3">
          {['true', 'false'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateStructuredAnswer(question.id, option)}
              className={cn(
                'rounded-xl border px-4 py-4 text-sm font-black capitalize transition',
                String(value) === option
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }
    if (type === 'fill_blank' || type === 'integer') {
      return (
        <input
          value={value}
          onChange={(event) => updateStructuredAnswer(question.id, event.target.value, false)}
          onBlur={(event) => saveStructuredAnswer(question.id, event.target.value)}
          placeholder="Type your answer"
          className="w-full rounded-xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      );
    }
    return (
      <textarea
        value={value}
        onChange={(event) => updateStructuredAnswer(question.id, event.target.value, false)}
        onBlur={(event) => saveStructuredAnswer(question.id, event.target.value)}
        rows={8}
        placeholder="Write your answer here..."
        className="w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    );
  };

  const typeAssessments = assessments.filter((test) => normalizeAssessmentType(test) === typeFilter);
  const typeResults = myResults.filter(({ assessment }) => normalizeAssessmentType(assessment) === typeFilter);
  const subjectNameById = Object.fromEntries(classSubjects.map((subject) => [String(subject.id), subject.name]));
  const subjectOptions = classSubjects;
  const selectedTypeLabel = TEST_TYPE_FILTERS.find((filter) => filter.id === typeFilter)?.label || 'tests';
  const matchesSubject = (test) => {
    if (subjectFilter === 'all') return true;
    const subjectId = String(getAssessmentSubjectId(test) || '');
    if (subjectId && subjectId === String(subjectFilter)) return true;
    const selectedSubject = subjectNameById[String(subjectFilter)];
    return selectedSubject && getAssessmentSubjectName(test, subjectNameById).toLowerCase() === selectedSubject.toLowerCase();
  };
  const filteredAssessments = typeAssessments.filter(matchesSubject);
  const filteredResults = typeResults.filter(({ assessment }) => matchesSubject(assessment));
  const subjectOptionsKey = subjectOptions.map((subject) => subject.id).join('|');

  useEffect(() => {
    if (subjectFilter !== 'all' && !subjectOptions.some((subject) => String(subject.id) === String(subjectFilter))) {
      setSubjectFilter('all');
    }
  }, [subjectFilter, subjectOptionsKey]);

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

      <div className="flex w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-max gap-1">
          {TEST_TYPE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setTypeFilter(filter.id);
                  setSubjectFilter('all');
                }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                  typeFilter === filter.id && 'bg-blue-600 text-white shadow-sm hover:bg-blue-600 hover:text-white dark:bg-blue-600 dark:text-white dark:hover:bg-blue-600'
                )}
              >
                <Icon size={16} />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Subject</label>
        <CustomSelect
          onChange={setSubjectFilter}
          value={subjectFilter}
          options={[
          { value: "all", label: "All Subjects" },
          ...subjectOptions.map((subject) => ({ value: subject.id, label: subject.name })),
        ]}
          className="w-full"
        />
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssessments.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
               <ClipboardList className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">No available {selectedTypeLabel.toLowerCase()}</h3>
               <p className="mt-1 text-sm text-slate-500">You don't have any pending assessments in this category right now.</p>
             </div>
          ) : (
            filteredAssessments.map((test) => {
              const uploadUrl = resolveUploadUrl(test.file_path || test.filePath);
              const mySubmission = test.mySubmission || test.my_submission;
              const submittedFileUrl = resolveUploadUrl(mySubmission?.file_path || mySubmission?.filePath);
              const isInProgress = mySubmission?.status === 'in_progress';
              const isSubmitted = mySubmission && !isInProgress;
              return (
              <div key={test.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {test.type || test.assessment_type || 'Assessment'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {test.status || 'scheduled'}
                    </span>
                  </div>
                  
                  <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {test.title}
                  </h3>
                  
                  <p className="mb-4 text-xs font-medium leading-5 text-slate-500 line-clamp-2">
                    {getAssessmentSummary(test, subjectNameById)}
                  </p>
                  
                  <div className="mb-4 flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      <span>{test.duration_minutes || test.durationMinutes || 60} mins</span>
                    </div>
                    <div>{test.total_marks || test.totalMarks || 100} marks</div>
                  </div>
                  
                  <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {mySubmission && (
                      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <CheckCircle2 size={15} />
                        {isInProgress ? 'Attempt in progress' : 'Submitted online'}
                      </div>
                    )}
                    {uploadUrl && (
                      <a
                        href={uploadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
                      >
                        <Download size={16} />
                        Download Paper
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => openSubmit(test)}
                      disabled={attemptStarting || isSubmitted}
                      className={cn(
                        'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors',
                        isSubmitted
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'
                          : isInProgress
                          ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20'
                      )}
                    >
                      <UploadCloud size={16} />
                      {attemptStarting ? 'Starting...' : isSubmitted ? 'Submitted' : isInProgress ? 'Continue Test' : 'Start Test'}
                    </button>
                    {submittedFileUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(submittedFileUrl, '_blank')}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100"
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
          ) : filteredResults.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <BarChart3 className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No {selectedTypeLabel.toLowerCase()} results yet</h3>
              <p className="mt-1 text-sm text-slate-500">Your teacher hasn't published marks in this category yet.</p>
            </div>
          ) : (
            filteredResults.map(({ assessment, result }) => {
              const totalMarks = Number(assessment.total_marks ?? assessment.totalMarks ?? 100);
              const marks      = result ? Number(result.marks_obtained ?? 0) : null;
              const pct        = marks != null && totalMarks ? Math.round((marks / totalMarks) * 100) : null;
              const isAbsent   = Boolean(result?.is_absent);
              const grade      = result?.grade ?? null;
              const remarks    = result?.remarks ?? null;
              const hasResult  = !!result;

              const ringColor =
                !hasResult || isAbsent || pct == null ? 'from-slate-300 to-slate-400'
                : pct >= 75  ? 'from-emerald-400 to-green-500'
                : pct >= 50  ? 'from-blue-400 to-indigo-500'
                : pct >= 33  ? 'from-amber-400 to-orange-500'
                :              'from-rose-400 to-red-500';

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

                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>{hasResult && !isAbsent ? `${marks} / ${totalMarks} marks` : isAbsent ? 'Absent' : 'Not graded'}</span>
                          {pct != null && !isAbsent && <span>{pct}%</span>}
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${ringColor} transition-all duration-1000`}
                            style={{ width: hasResult && !isAbsent ? `${pct}%` : '0%' }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
                          <span>0</span>
                          <span className="text-rose-500">Pass: 33%</span>
                          <span className="text-emerald-500">Distinction: 75%</span>
                          <span>{totalMarks}</span>
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
                          `bg-gradient-to-br ${ringColor}`
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

      {submitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Test: {submitTarget.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Time remaining: <span className="font-black text-rose-600">{formatRemaining(remainingSeconds)}</span>
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
              {getStructuredQuestions(submitTarget).length ? (() => {
                const questions = getStructuredQuestions(submitTarget);
                const currentQuestion = questions[Math.min(currentQuestionIndex, questions.length - 1)];
                const answeredCount = questions.filter((question) => {
                  const value = structuredAnswers?.[question.id];
                  return Array.isArray(value) ? value.length > 0 : String(value ?? '').trim().length > 0;
                }).length;
                return (
                  <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                    <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Questions</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {answeredCount} of {questions.length} answered
                      </p>
                      <div className="mt-4 grid grid-cols-5 gap-2">
                        {questions.map((question, index) => {
                          const value = structuredAnswers?.[question.id];
                          const answered = Array.isArray(value) ? value.length > 0 : String(value ?? '').trim().length > 0;
                          return (
                            <button
                              key={question.id}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(index)}
                              className={cn(
                                'h-10 rounded-lg text-sm font-black transition',
                                index === currentQuestionIndex
                                  ? 'bg-blue-600 text-white'
                                  : answered
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100'
                              )}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </div>
                    </aside>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                            {getQuestionTypeLabel(currentQuestion.type)}
                          </span>
                          <h3 className="mt-3 text-lg font-black text-slate-950 dark:text-white">
                            Question {currentQuestionIndex + 1}
                          </h3>
                        </div>
                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {currentQuestion.marks || 1} marks
                        </span>
                      </div>
                      <p className="mb-5 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-800 dark:text-slate-100">
                        {currentQuestion.text}
                      </p>
                      {renderStructuredAnswerInput(currentQuestion)}

                      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"
                        >
                          <ChevronLeft size={16} />
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={currentQuestionIndex >= questions.length - 1}
                          onClick={() => setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"
                        >
                          Next
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </section>
                  </div>
                );
              })() : (
                <>
                  {submitTarget.content_text && (
                    <div className="mb-5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                        Question Paper
                      </label>
                      <div className="mt-2 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <AssessmentContentRenderer className="text-slate-800 dark:text-slate-100">
                          {submitTarget.content_text}
                        </AssessmentContentRenderer>
                      </div>
                    </div>
                  )}
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
                </>
              )}
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
                onClick={() => handleAssessmentSubmit(false)}
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
