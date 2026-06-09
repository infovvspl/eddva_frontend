import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
  getQuizQuestions, submitQuiz,
  type QuizQuestion, type QuizStatus,
} from '@/lib/api/career';
import { ErrorState, SkeletonBlock } from './_shared';

export default function CareerQuiz() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [status, setStatus] = useState<QuizStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [warn, setWarn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    getQuizQuestions()
      .then((data) => { setQuestions(data.questions); setStatus(data.status); })
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load the quiz'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const select = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setWarn(false);
  };

  const handleSubmit = async () => {
    if (questions.some((q) => !answers[q.id])) { setWarn(true); return; }
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({ questionId: q.id, value: answers[q.id] }));
      const result = await submitQuiz(payload);
      navigate('/school/student/career/quiz/result', { state: { result } });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-1">
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="mx-auto max-w-2xl p-1"><ErrorState message={error} onRetry={load} /></div>;
  }

  // Already completed and locked
  if (status?.completed && !status.canRetake) {
    return (
      <div className="mx-auto max-w-2xl p-1">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <Check className="mx-auto h-10 w-10 text-emerald-500" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">You have already completed the quiz</h2>
          {status.canRetakeAfter && (
            <p className="mt-1 text-sm text-slate-500">Next retake available: {new Date(status.canRetakeAfter).toLocaleDateString('en-GB')}</p>
          )}
          <button onClick={() => navigate('/school/student/career/report')} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
            View Career Report <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answeredCount = questions.filter((qq) => answers[qq.id]).length;
  const progress = questions.length ? Math.round(((current + 1) / questions.length) * 100) : 0;
  const isLast = current === questions.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/school/student/career')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-slate-500">Question {current + 1} of {questions.length}</span>
      </div>

      {/* Question card */}
      {q && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-lg font-bold text-slate-900">{q.question}</p>
          <div className="mt-4 space-y-2.5">
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt.value;
              return (
                <button key={opt.value} onClick={() => select(q.id, opt.value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition
                    ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50'}`}>
                  <span>{opt.label}</span>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {warn && <p className="text-center text-sm font-semibold text-rose-500">Please answer all {questions.length} questions before submitting.</p>}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50">
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <span className="text-xs text-slate-400">{answeredCount}/{questions.length} answered</span>
        {isLast ? (
          <button onClick={handleSubmit} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            Submit Quiz <Check className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Submit overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 text-slate-700">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-bold">Analysing your responses…</p>
          </div>
        </div>
      )}
    </div>
  );
}
