import React, { useEffect, useMemo, useRef, useState } from 'react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { getApiOrigin } from '@/lib/api-config';
import { ClipboardList, Clock, FileText, Download, CheckCircle2, Trophy, BarChart3, X, Award, MessageSquare, Target, Loader2, UploadCloud, ChevronLeft, ChevronRight, Trash2, Camera } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import AssessmentContentRenderer from '@/components/school/AssessmentContentRenderer';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useIsMobile } from '@/hooks/use-mobile';

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

// The marks-upload flow stores a per-component breakdown (theory/practical/
// internal/etc.) as a JSON blob inside the plain-text `remarks` column
// (see school-student.service.ts). Parse it back out so it renders as a
// score breakdown instead of a raw JSON string; anything that isn't that
// exact shape (older/plain teacher remarks) passes through as normal text.
function parseResultRemarks(raw) {
  if (!raw) return { breakdown: null, text: null };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.type === 'breakdown' && parsed.components) {
      const text = parsed.userRemarks && parsed.userRemarks !== 'Overall calculated total' ? parsed.userRemarks : null;
      return { breakdown: parsed.components, text };
    }
  } catch {
    // Not JSON -- a normal free-text remark, fall through.
  }
  return { breakdown: null, text: raw };
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

// Per test type: chip colour, marks tile gradient and window-progress bar gradient.
const TYPE_THEME = {
  topic: { soft: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', grad: 'from-blue-400 to-indigo-500', border: 'border-blue-200 hover:border-blue-400 dark:border-blue-900/60 dark:hover:border-blue-700' },
  chapter: { soft: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', grad: 'from-violet-400 to-fuchsia-500', border: 'border-violet-200 hover:border-violet-400 dark:border-violet-900/60 dark:hover:border-violet-700' },
  subject: { soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', grad: 'from-emerald-400 to-teal-500', border: 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-900/60 dark:hover:border-emerald-700' },
  mock: { soft: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', grad: 'from-amber-400 to-orange-500', border: 'border-amber-200 hover:border-amber-400 dark:border-amber-900/60 dark:hover:border-amber-700' },
  final: { soft: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', grad: 'from-rose-400 to-pink-500', border: 'border-rose-200 hover:border-rose-400 dark:border-rose-900/60 dark:hover:border-rose-700' },
};

const STATUS_SOFT = {
  scheduled: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

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
  const isMobile = useIsMobile();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('available');
  const [typeFilter, setTypeFilter] = useState('topic');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classSubjects, setClassSubjects] = useState([]);
  const [assessments, setAssessments] = useState([]);
  // resultsById: assessment id -> the student's result (or null). Filled in as each request returns,
  // so cards appear one by one instead of all at once after the slowest request.
  const [resultsById, setResultsById] = useState({});
  const [resultsPending, setResultsPending] = useState(0);
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
  const [ocrLoading, setOcrLoading] = useState({});
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


  // Results used to be fetched only after the My Results tab was opened, and nothing showed until the
  // slowest of the per-assessment requests finished. Now they load in the background as soon as the
  // assessments are known (the selected test type first), each card appears as soon as its own request
  // returns, and opening the tab just refreshes what is already on screen.
  const resultsTabOpen = activeTab === 'results';
  useEffect(() => {
    if (!assessments.length) return undefined;
    let cancelled = false;

    const queue = [...assessments].sort(
      (a, b) => Number(normalizeAssessmentType(b) === typeFilter) - Number(normalizeAssessmentType(a) === typeFilter)
    );
    setResultsPending(queue.length);

    const loadOne = async (asm) => {
      let result = null;
      let failed = false;
      try {
        const res = await api.get(`/assessments/${asm.id}/results`);
        const all = res.data?.data ?? res.data ?? [];
        result = Array.isArray(all)
          ? all.find(
              (r) =>
                String(r.student_id) === String(user?.id) ||
                String(r.student_user_id) === String(user?.id)
            ) ?? (all.length === 1 ? all[0] : null)
          : null;
      } catch {
        failed = true;
      }
      if (cancelled) return;
      // A failed refresh keeps whatever result was already on screen.
      setResultsById((prev) => (failed && asm.id in prev ? prev : { ...prev, [asm.id]: result ?? null }));
      setResultsPending((n) => Math.max(0, n - 1));
    };

    // All at once, the selected type's requests first. Each card shows up as soon as its own request returns.
    queue.forEach((asm) => { void loadOne(asm); });

    return () => { cancelled = true; };
  }, [assessments, user?.id, resultsTabOpen]);

  // Show only assessments that have a result OR were scheduled in past
  const myResults = useMemo(
    () => assessments
      .filter((asm) => Object.prototype.hasOwnProperty.call(resultsById, asm.id))
      .map((asm) => ({ assessment: asm, result: resultsById[asm.id] }))
      .filter((p) => p.result || p.assessment.status === 'completed'),
    [assessments, resultsById]
  );

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
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-xs uppercase">
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
    const textValue = typeof value === 'object' && value !== null ? value.text || '' : value || '';
    const imageUrl = typeof value === 'object' && value !== null ? value.imageUrl || null : null;
    const isOcrLoading = !!ocrLoading[question.id];

    const handleImageUpload = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const qId = question.id;
      setOcrLoading(prev => ({ ...prev, [qId]: true }));
      const formData = new FormData();
      formData.append('file', file);
      if (submitTarget?.language) {
        formData.append('language', submitTarget.language);
      }

      try {
        const response = await api.post('/assessments/ocr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const extractedText = (response.data?.text || '').trim();
        const returnedImageUrl = response.data?.imageUrl || '';

        const currentText = textValue.trim();
        const mergedText = extractedText 
          ? (currentText ? `${currentText}\n\n${extractedText}` : extractedText)
          : currentText;
        const newVal = { text: mergedText, imageUrl: returnedImageUrl || imageUrl };
        updateStructuredAnswer(qId, newVal, true);
        if (extractedText) {
          toast.success('Handwriting extracted successfully!');
        } else {
          toast.info('Image uploaded successfully. You can type your answer text below.');
        }
      } catch (err) {
        console.error('OCR failed:', err);
        toast.error(err?.response?.data?.message || 'Failed to extract text from image');
      } finally {
        setOcrLoading(prev => ({ ...prev, [qId]: false }));
      }
    };
 
    return (
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={textValue}
            onChange={(event) => {
              const newText = event.target.value;
              const nextVal = typeof value === 'object' && value !== null
                ? { ...value, text: newText }
                : newText;
              updateStructuredAnswer(question.id, nextVal, false);
            }}
            onBlur={() => {
              const currentVal = latestStructuredAnswersRef.current?.[question.id] ?? '';
              saveStructuredAnswer(question.id, currentVal);
            }}
            rows={8}
            disabled={isOcrLoading}
            placeholder={isOcrLoading ? "Extracting text from your handwriting image..." : "Write your answer here..."}
            className="w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          {isOcrLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/70 dark:bg-slate-900/70">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="mt-2 text-xs font-black text-slate-600 dark:text-slate-400">Groq Qwen OCR extracting text...</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className={cn(
            "flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:border-blue-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
            isOcrLoading && "pointer-events-none opacity-40"
          )}>
            <Camera size={14} />
            Upload Handwritten Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isOcrLoading}
            />
          </label>
        </div>

        {imageUrl && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Handwritten Answer Image</p>
            <div className="relative mt-2 inline-block rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
              <img src={imageUrl} alt="Handwritten answer preview" className="max-h-48 rounded-md object-contain" />
              <button
                type="button"
                onClick={() => {
                  updateStructuredAnswer(question.id, textValue, true);
                }}
                className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1.5 text-white shadow-lg hover:bg-rose-600 transition-all"
                title="Remove image"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
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
  const resultsLoading = resultsPending > 0 && filteredResults.length === 0;
  const subjectOptionsKey = subjectOptions.map((subject) => subject.id).join('|');

  useEffect(() => {
    if (subjectFilter !== 'all' && !subjectOptions.some((subject) => String(subject.id) === String(subjectFilter))) {
      setSubjectFilter('all');
    }
  }, [subjectFilter, subjectOptionsKey]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
            <ClipboardList size={24} />
          </span>
          <div className="min-w-0">
            <h1 className="!text-2xl font-black text-slate-900 dark:text-white">Assessments</h1>
            <p className="mt-0.5 text-sm font-medium text-slate-500">Practice tests, topic tests, unit tests, subject tests, mock exams, and final exams.</p>
          </div>
        </div>
      </div>

      {isMobile ? (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Test Type</label>
          <CustomSelect
            onChange={(val) => {
              setTypeFilter(val);
              setSubjectFilter('all');
            }}
            value={typeFilter}
            options={TEST_TYPE_FILTERS.map((f) => ({ value: f.id, label: f.label }))}
            className="w-full"
          />
        </div>
      ) : (
        <div className="flex w-fit max-w-full overflow-x-auto rounded-2xl border border-slate-300 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-900">
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
                    typeFilter === filter.id && 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:bg-transparent hover:text-white dark:text-white dark:hover:text-white'
                  )}
                >
                  <Icon size={16} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/60">
        {[
          { id: 'available', label: 'Available Tests', icon: ClipboardList },
          { id: 'results',   label: 'My Results', icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:text-blue-300 dark:ring-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'available' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssessments.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
               <ClipboardList className="mb-4 size-12 text-slate-300 dark:text-slate-700" />
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

              const rawScheduled = test.scheduled_at || test.scheduled_date || test.scheduledDate;
              const startTime = rawScheduled ? new Date(rawScheduled) : null;
              const durationMins = Math.max(1, Number(test.duration_minutes || test.durationMinutes || 60));
              const endTime = (startTime && !isNaN(startTime.getTime())) ? new Date(startTime.getTime() + durationMins * 60 * 1000) : null;
              const now = new Date();

              const isNotStartedYet = startTime && !isNaN(startTime.getTime()) && now < startTime;
              const isWindowClosed = endTime && !isNaN(endTime.getTime()) && now > endTime;
              const isStartDisabled = attemptStarting || isSubmitted || isNotStartedYet || isWindowClosed;
              const typeKey = normalizeAssessmentType(test);
              const theme = TYPE_THEME[typeKey] || TYPE_THEME.topic;
              const statusKey = isNotStartedYet ? 'scheduled' : isWindowClosed ? 'completed' : (test.status || 'active');
              const meta = getAssessmentMeta(test, subjectNameById);
              const windowPct = !endTime ? 0
                : isNotStartedYet ? 0
                : isWindowClosed ? 100
                : Math.min(100, Math.max(0, Math.round(((now - startTime) / (endTime - startTime)) * 100)));

              return (
              <div key={test.id} className={`flex flex-col rounded-[2rem] border-1 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${theme.border}`}>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start gap-4">
                    {/* Left: chips, title and meta */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${theme.soft}`}>
                          {test.type || test.assessment_type || 'Assessment'}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${STATUS_SOFT[statusKey] || STATUS_SOFT.completed}`}>
                          {statusKey}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1" title={test.title}>
                        {test.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-400 line-clamp-2">
                        {durationMins} mins
                        {meta.className && ` · Class ${meta.className}`}
                        {meta.subjectName && ` · ${meta.subjectName}`}
                      </p>
                    </div>

                    {/* Right: marks tile */}
                    <div className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${theme.grad} text-white font-black shadow-sm`}>
                      <span className="text-lg">{test.total_marks || test.totalMarks || 100}</span>
                      <span className="text-[10px] font-bold uppercase">marks</span>
                    </div>
                  </div>

                  {/* Test window */}
                  {startTime && !isNaN(startTime.getTime()) && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${isWindowClosed ? 'from-slate-300 to-slate-400' : theme.grad} transition-all duration-1000`}
                          style={{ width: `${windowPct}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>{startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span className={isNotStartedYet ? 'text-amber-500' : isWindowClosed ? 'text-slate-400' : 'text-emerald-500'}>
                          {isNotStartedYet ? 'Not started' : isWindowClosed ? 'Window closed' : 'Live now'}
                        </span>
                        <span>Auto ends</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                  <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800 sm:gap-2">
                    {mySubmission && (
                      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 sm:py-2.5 sm:text-sm">
                        <CheckCircle2 size={14} className="sm:h-[15px] sm:w-[15px]" />
                        {isInProgress ? 'Attempt in progress' : 'Submitted online'}
                      </div>
                    )}
                    {uploadUrl && (
                      <a
                        href={uploadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 sm:py-2.5 sm:text-sm"
                      >
                        <Download size={14} className="sm:size-4" />
                        Download Paper
                      </a>
                    )}
                    {!(isMobile && isSubmitted) && (
                      <button
                        type="button"
                        onClick={() => openSubmit(test)}
                        disabled={isStartDisabled}
                        className={cn(
                          'flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all sm:py-2.5 sm:text-sm',
                          isStartDisabled
                            ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            : isInProgress
                            ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:brightness-110 hover:shadow-lg'
                        )}
                      >
                        <UploadCloud size={14} className="sm:size-4" />
                        {attemptStarting
                          ? 'Starting...'
                          : isSubmitted
                          ? 'Submitted'
                          : isNotStartedYet
                          ? `Starts at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : isWindowClosed
                          ? 'Window Closed'
                          : isInProgress
                          ? 'Continue Test'
                          : 'Start Test'}
                      </button>
                    )}
                    {submittedFileUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(submittedFileUrl, '_blank')}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 sm:py-2.5 sm:text-sm"
                      >
                        <FileText size={14} className="sm:size-4" />
                        View my submission
                      </button>
                    )}
                  </div>
                  </div>
                </div>
              </div>
            );
          })
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resultsLoading ? (
            <div className="col-span-full flex h-48 items-center justify-center">
              <Loader2 className="size-7 animate-spin text-blue-600" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <BarChart3 className="mb-4 size-12 text-slate-300 dark:text-slate-700" />
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
              const { breakdown, text: remarks } = parseResultRemarks(result?.remarks ?? null);
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

                      {/* Component breakdown (theory/practical/internal/etc.) */}
                      {breakdown && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {Object.entries(breakdown)
                            .filter(([, c]) => c?.enabled && Number(c?.max) > 0)
                            .map(([key, c]) => (
                              <span
                                key={key}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {key.charAt(0).toUpperCase() + key.slice(1)}: {c.obtained}/{c.max}
                              </span>
                            ))}
                        </div>
                      )}

                      {/* Remarks */}
                      {remarks && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/20">
                          <MessageSquare className="mt-0.5 size-4 shrink-0 text-indigo-500" />
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
                          'flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl text-white font-black shadow-sm',
                          `bg-gradient-to-br ${ringColor}`
                        )}>
                          <span className="text-lg">{pct}</span>
                          <span className="text-[10px] font-bold">%</span>
                        </div>
                      ) : (
                        <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                          <Award className="size-6 text-slate-300 dark:text-slate-600" />
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
          <div className="erp-modal-container max-w-6xl">
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
            <div className="erp-modal-body p-5">
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
            <div className="erp-modal-footer">
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
