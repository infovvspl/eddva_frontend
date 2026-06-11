import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Loader2, UploadCloud } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { useConfirm } from '@/context/ConfirmContext';
import { toast } from 'sonner';

function getStructuredQuestions(test) {
  const questions = test?.questions || test?.questions_json || test?.questionsJson || [];
  return Array.isArray(questions) ? questions : [];
}

function cleanStructuredQuestions(questions) {
  const instructionPattern = /(general instructions|question paper consists|follow the instructions|space provided|read each question carefully)/i;
  const seen = new Set();
  return questions.filter((question) => {
    const text = String(question?.text || '').trim();
    const key = `${question?.sectionTitle || ''}-${text.toLowerCase().replace(/\s+/g, ' ')}`;
    if (!text || instructionPattern.test(text) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatRemaining(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

function getQuestionDisplayNumber(question, fallbackIndex) {
  return question?.displayNumber || question?.number || fallbackIndex + 1;
}

function getPaletteQuestionNumber(group, itemIndex) {
  const current = Number(group.questions[itemIndex]?.question?.displayNumber);
  const previous = itemIndex > 0 ? Number(group.questions[itemIndex - 1]?.question?.displayNumber) : null;
  const expected = group.startIndex + itemIndex + 1;
  if (Number.isFinite(current) && current > 0 && (previous == null || current > previous)) return current;
  return expected;
}

function getSectionLetter(question) {
  const section = String(question?.sectionTitle || question?.section || '');
  return section.match(/section\s+([A-E])/i)?.[1]?.toUpperCase()
    || section.match(/[-–]\s*([A-E])\b/i)?.[1]?.toUpperCase()
    || '';
}

function parseInlineOptions(text) {
  const body = String(text || '');
  const matches = Array.from(body.matchAll(/\(([a-dA-D])\)\s*/g));
  if (matches.length < 2) return { text: body, options: [] };
  const questionText = body.slice(0, matches[0].index || 0).trim() || body;
  const options = matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || body.length : body.length;
    return {
      id: match[1].toLowerCase(),
      label: match[1],
      text: body.slice(start, end).trim(),
    };
  }).filter((option) => option.text);
  return { text: questionText, options };
}

function getEffectiveQuestion(question) {
  const inline = parseInlineOptions(question?.text);
  const sectionLetter = getSectionLetter(question);
  const hasOptions = Array.isArray(question?.options) && question.options.length > 0;
  let type = question?.type || 'short_answer';
  if (hasOptions || inline.options.length) type = 'mcq_single';
  else if (sectionLetter === 'A') type = 'mcq_single';
  else if (sectionLetter === 'B') type = 'true_false';
  else if (sectionLetter === 'C') type = 'fill_blank';
  else if (sectionLetter === 'D') type = 'short_answer';
  else if (sectionLetter === 'E') type = 'long_answer';

  return {
    ...question,
    type,
    text: inline.options.length ? inline.text : question?.text,
    options: hasOptions ? question.options : inline.options,
  };
}

export default function TestEngine() {
  const confirm = useConfirm();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const latestAnswersRef = useRef({});
  const latestAnswerTextRef = useRef('');
  const latestAnswerFileRef = useRef(null);
  const autoSubmittedRef = useRef(false);
  const startRequestedRef = useRef(false);

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [answerText, setAnswerText] = useState('');
  const [answerFile, setAnswerFile] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const previousPage = location.state?.from;

  const goBackToPreviousPage = () => {
    if (previousPage) {
      navigate(previousPage);
      return;
    }
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    navigate('/school/student/assessments');
  };

  useEffect(() => {
    latestAnswersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    latestAnswerTextRef.current = answerText;
  }, [answerText]);

  useEffect(() => {
    latestAnswerFileRef.current = answerFile;
  }, [answerFile]);

  useEffect(() => {
    if (startRequestedRef.current) return;
    startRequestedRef.current = true;
    let cancelled = false;
    const start = async () => {
      setLoading(true);
      try {
        const [assessmentRes, attemptRes] = await Promise.all([
          api.get(`/assessments/${id}`),
          api.post(`/assessments/${id}/start`),
        ]);
        if (cancelled) return;
        const assessmentData = assessmentRes.data?.data || assessmentRes.data || {};
        const attemptData = attemptRes.data?.data || attemptRes.data || {};
        if (attemptData.status && attemptData.status !== 'in_progress') {
          toast.info('This assessment is already submitted.');
          navigate('/school/student/assessments', { replace: true });
          return;
        }
        const parsedQuestions = getStructuredQuestions(attemptData).length
          ? getStructuredQuestions(attemptData)
          : getStructuredQuestions(assessmentData);

        setAssessment(assessmentData);
        setAttempt(attemptData);
        setQuestions(cleanStructuredQuestions(parsedQuestions));
        setAnswers(attemptData.answers_json || {});
        setAnswerText(attemptData.answer_text || '');
        setCurrentIdx(0);
      } catch (error) {
        console.error('Failed to start assessment:', error);
        toast.error(error?.response?.data?.message || 'Could not start assessment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!attempt?.expires_at || attempt?.status !== 'in_progress') return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(attempt.expires_at).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        void submitAssessment(true);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.expires_at, attempt?.status]);

  const saveAnswer = async (questionId, value) => {
    if (!questionId || attempt?.status !== 'in_progress') return;
    try {
      await api.post(`/assessments/${id}/answer`, { questionId, answer: value });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const updateAnswer = (questionId, value, shouldSave = true) => {
    setAnswers((current) => {
      const next = { ...current, [questionId]: value };
      latestAnswersRef.current = next;
      return next;
    });
    if (shouldSave) void saveAnswer(questionId, value);
  };

  const submitAssessment = useCallback(async (autoSubmit = false) => {
    if (submitting) return;
    const currentAnswers = autoSubmit ? latestAnswersRef.current : answers;
    const currentAnswerText = autoSubmit ? latestAnswerTextRef.current : answerText;
    const currentAnswerFile = autoSubmit ? latestAnswerFileRef.current : answerFile;
    const hasStructuredAnswer = questions.some((question) => {
      const value = currentAnswers?.[question.id];
      return Array.isArray(value) ? value.length > 0 : String(value ?? '').trim().length > 0;
    });

    if (!autoSubmit && questions.length && !hasStructuredAnswer) {
      toast.error('Answer at least one question before submitting');
      return;
    }
    if (!autoSubmit && !questions.length && !currentAnswerText.trim() && !currentAnswerFile) {
      toast.error('Write your answer or upload an answer file');
      return;
    }
    if (!autoSubmit) {
      const ok = await confirm({
        title: 'Submit Test',
        message: 'Are you sure you want to submit the test? You cannot change your answers after submission.',
        confirmLabel: 'Submit',
        cancelLabel: 'Cancel',
      });
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      if (questions.length) data.append('answersJson', JSON.stringify(currentAnswers || {}));
      if (currentAnswerText.trim()) data.append('answerText', currentAnswerText.trim());
      if (currentAnswerFile) data.append('file', currentAnswerFile);
      if (autoSubmit) data.append('autoSubmit', 'true');
      await api.post(`/assessments/${id}/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(autoSubmit ? 'Time is over. Assessment auto-submitted.' : 'Assessment submitted');
      navigate('/school/student/assessments', { replace: true });
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  }, [submitting, answers, answerText, answerFile, questions, id, navigate, confirm]);

  const renderAnswerInput = (question) => {
    const effectiveQuestion = getEffectiveQuestion(question);
    const value = answers?.[question.id] ?? '';
    const type = effectiveQuestion.type || 'short_answer';
    if (type === 'mcq_single') {
      return (
        <div className="space-y-3">
          {(effectiveQuestion.options || []).map((option) => {
            const optionValue = option.id || option.value || option.text;
            const selected = String(value) === String(optionValue);
            return (
              <button
                key={optionValue}
                type="button"
                onClick={() => updateAnswer(question.id, optionValue)}
                className={cn(
                  'flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all',
                  selected
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                )}
              >
                <span className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black uppercase',
                  selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  {option.id || option.value || ''}
                </span>
                <span className="text-sm font-semibold leading-6">{option.text || option.label || option.value}</span>
              </button>
            );
          })}
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
              onClick={() => updateAnswer(question.id, option)}
              className={cn(
                'rounded-2xl border-2 px-4 py-5 text-sm font-black capitalize transition',
                String(value) === option
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
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
          onChange={(event) => updateAnswer(question.id, event.target.value, false)}
          onBlur={(event) => saveAnswer(question.id, event.target.value)}
          placeholder="Type your answer"
          className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }
    return (
      <textarea
        value={value}
        onChange={(event) => updateAnswer(question.id, event.target.value, false)}
        onBlur={(event) => saveAnswer(question.id, event.target.value)}
        rows={10}
        placeholder="Write your answer here..."
        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-sm font-bold text-slate-500">Preparing your assessment...</p>
      </div>
    );
  }

  if (!assessment || !attempt) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-14 w-14 text-rose-500" />
        <h2 className="text-xl font-black text-slate-900">Could not open assessment</h2>
        <button onClick={goBackToPreviousPage} className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white">
          Back to Assessments
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const effectiveCurrentQuestion = currentQuestion ? getEffectiveQuestion(currentQuestion) : null;
  const answeredCount = questions.filter((question) => {
    const value = answers?.[question.id];
    return Array.isArray(value) ? value.length > 0 : String(value ?? '').trim().length > 0;
  }).length;
  const questionGroups = questions.reduce((groups, question, index) => {
    const sectionTitle = question.sectionTitle || question.section || '';
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup || lastGroup.sectionTitle !== sectionTitle) {
      groups.push({ sectionTitle, startIndex: index, questions: [{ question, index }] });
    } else {
      lastGroup.questions.push({ question, index });
    }
    return groups;
  }, []);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur xl:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={goBackToPreviousPage}
              className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600"
            >
              <ChevronLeft size={14} />
              Assessments
            </button>
            <h1 className="truncate text-lg font-black text-slate-950">{assessment.title}</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {assessment.type || 'Assessment'} | {assessment.total_marks || 100} marks | {assessment.duration_minutes || 60} mins
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Remaining</p>
              <p className={cn('font-mono text-xl font-black', timeLeft < 300 ? 'text-rose-600' : 'text-slate-950')}>
                {formatRemaining(timeLeft)}
              </p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => submitAssessment(false)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </header>

      {questions.length ? (
        <div className="grid gap-6 p-4 xl:grid-cols-[1fr_320px] xl:p-8">
          <main className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                  {getQuestionTypeLabel(effectiveCurrentQuestion?.type)}
                </span>
                {currentQuestion.sectionTitle && (
                  <p className="mt-3 text-xs font-black uppercase tracking-widest text-blue-600">
                    {currentQuestion.sectionTitle}
                  </p>
                )}
                <h2 className="mt-3 text-xl font-black text-slate-950">
                  Question {getQuestionDisplayNumber(currentQuestion, currentIdx)}
                </h2>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {effectiveCurrentQuestion?.marks || 1} marks
              </span>
            </div>
            <p className="mb-8 whitespace-pre-wrap text-base font-semibold leading-8 text-slate-800">
              {effectiveCurrentQuestion?.text}
            </p>
            {renderAnswerInput(effectiveCurrentQuestion)}
            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((index) => Math.max(0, index - 1))}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                type="button"
                disabled={currentIdx >= questions.length - 1}
                onClick={() => setCurrentIdx((index) => Math.min(questions.length - 1, index + 1))}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </main>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-950">Question Palette</h3>
              <span className="text-xs font-bold text-slate-500">{answeredCount}/{questions.length} Answered</span>
            </div>
            <div className="space-y-4">
              {questionGroups.map((group, groupIndex) => (
                <div key={`${group.sectionTitle || 'section'}-${group.startIndex}`}>
                  {group.sectionTitle && (
                    <p className={cn('mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400', groupIndex > 0 && 'pt-1')}>
                      {group.sectionTitle}
                    </p>
                  )}
                  <div className="grid grid-cols-5 gap-2">
                    {group.questions.map(({ question, index }, itemIndex) => {
                      const value = answers?.[question.id];
                      const answered = Array.isArray(value) ? value.length > 0 : String(value ?? '').trim().length > 0;
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => setCurrentIdx(index)}
                          className={cn(
                            'h-10 rounded-xl text-sm font-black transition',
                            index === currentIdx
                              ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                              : answered
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                          )}
                        >
                          {getPaletteQuestionNumber(group, itemIndex)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : (
        <div className="p-4 xl:p-8">
          <main className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:p-8">
            <div className="mb-6 flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-black text-slate-950">Question Paper</h2>
                <p className="text-sm font-semibold text-slate-500">Write your answer below or upload an answer file.</p>
              </div>
            </div>
            {assessment.content_text && (
              <pre className="mb-6 max-h-[45vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-white border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {assessment.content_text}
              </pre>
            )}
            <textarea
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              rows={12}
              placeholder="Type your assessment answer here..."
              className="w-full rounded-2xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
              onChange={(event) => setAnswerFile(event.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-8 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50/50"
            >
              <UploadCloud size={28} className="text-blue-500" />
              {answerFile ? answerFile.name : 'Choose answer file to upload'}
            </button>
          </main>
        </div>
      )}
    </div>
  );
}
