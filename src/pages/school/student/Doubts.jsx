import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import { useIsMobile } from '@/hooks/use-mobile';
import DoubtsMobile from './mobile/DoubtsMobile';
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  HelpCircle,
  Loader2,
  Plus,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import DoubtImageAttach, { DoubtImagePreview } from '@/components/school/DoubtImageAttach';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

const statusLabels = {
  ai_answered: { label: 'AI answered', tone: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' },
  escalated: { label: 'With teacher', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  teacher_answered: { label: 'Teacher answered', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  open: { label: 'Open', tone: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

function DoubtCard({ doubt, onHelpful, escalating }) {
  const status = statusLabels[doubt.status] || statusLabels.open;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className={cn('rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest', status.tone)}>
            {status.label}
          </span>
          <div className="mt-2 space-y-1">
            {doubt.subjectName && (
              <p className="text-xs font-bold text-slate-500">Subject: {doubt.subjectName}</p>
            )}
            {doubt.teacherName && (
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Teacher: {doubt.teacherName}</p>
            )}
          </div>
        </div>
        <time className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {doubt.createdAt ? new Date(doubt.createdAt).toLocaleString() : ''}
        </time>
      </div>

      {doubt.questionText && (
        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{doubt.questionText}</p>
      )}
      {doubt.questionImageUrl && (
        <div className="mt-3">
          <DoubtImagePreview url={doubt.questionImageUrl} alt="Question image" />
        </div>
      )}

      {doubt.aiExplanation && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Sparkles size={14} /> AI explanation
          </p>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            <MarkdownRenderer content={doubt.aiExplanation} className="prose-slate max-w-none prose-sm" />
          </div>
          {Array.isArray(doubt.aiSteps) && doubt.aiSteps.length > 0 && (
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {doubt.aiSteps.map((step, i) => (
                <MarkdownRenderer key={i} content={`${i + 1}. ${step}`} className="prose-slate max-w-none prose-sm" />
              ))}
            </div>
          )}
          {doubt.status === 'ai_answered' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={escalating}
                onClick={() => onHelpful(doubt.id, true)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <ThumbsUp size={14} /> Helpful
              </button>
              <button
                type="button"
                disabled={escalating}
                onClick={() => onHelpful(doubt.id, false)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ThumbsDown size={14} /> Ask teacher instead
              </button>
            </div>
          )}
        </div>
      )}

      {doubt.teacherResponse && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            <User size={14} /> Teacher response
            {doubt.teacherName ? ` · ${doubt.teacherName}` : ''}
          </p>
          {doubt.teacherResponse && (
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              <MarkdownRenderer content={doubt.teacherResponse} className="prose-slate max-w-none prose-sm" />
            </div>
          )}
          {doubt.teacherResponseImageUrl && (
            <div className="mt-3">
              <DoubtImagePreview url={doubt.teacherResponseImageUrl} alt="Teacher answer image" />
            </div>
          )}
        </div>
      )}

      {doubt.status === 'escalated' && !doubt.teacherResponse && (
        <p className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
          Not resolved yet — waiting for your teacher. You can also message them in{' '}
          <Link to="/school/student/chat" className="font-bold underline">Class Chat</Link>.
        </p>
      )}

      {doubt.status === 'teacher_answered' && (
        <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          Resolved
          {doubt.resolvedAt ? ` · ${new Date(doubt.resolvedAt).toLocaleString()}` : ''}
        </p>
      )}
    </article>
  );
}

export default function Doubts() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [view, setView] = useState('list');
  const [doubts, setDoubts] = useState([]);
  const [context, setContext] = useState({
    subjects: [],
    teachers: [],
    className: null,
    sectionName: null,
    hasSection: true,
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [question, setQuestion] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherUserId, setTeacherUserId] = useState('');
  const [questionImageUrl, setQuestionImageUrl] = useState(null);
  const [questionImagePreview, setQuestionImagePreview] = useState(null);
  const [error, setError] = useState('');

  const authHasSection =
    !!user?.studentProfile?.sectionId ||
    !!(user?.studentProfile?.className && user?.studentProfile?.sectionName);

  const load = useCallback(async () => {
    try {
      const [listRes, ctxRes] = await Promise.all([
        api.get('/doubts'),
        api.get('/doubts/context').catch(() => null),
      ]);
      setDoubts(unwrapSchoolList(listRes));
      const fallback = {
        subjects: [],
        teachers: [],
        className: user?.studentProfile?.className ?? null,
        sectionName: user?.studentProfile?.sectionName ?? null,
        hasSection: authHasSection,
        message: '',
      };
      if (!ctxRes) {
        setContext(fallback);
        return;
      }
      let ctx = unwrapSchoolData(ctxRes, fallback);
      if (authHasSection && user?.studentProfile?.sectionId && !(ctx.subjects?.length > 0)) {
        try {
          const mapRes = await api.get(
            `/academic/sections/${user.studentProfile.sectionId}/teaching-map`,
          );
          const map = unwrapSchoolData(mapRes, { subjects: [] });
          const fromMap = (map.subjects || [])
            .filter((row) => row.subjectId && row.subjectName)
            .map((row) => ({ id: row.subjectId, name: row.subjectName }));
          if (fromMap.length) {
            ctx = { ...ctx, subjects: fromMap };
          }
        } catch {
          /* optional fallback */
        }
      }
      setContext({
        ...ctx,
        subjects: ctx.subjects?.length ? ctx.subjects : fallback.subjects,
        teachers: ctx.teachers?.length ? ctx.teachers : fallback.teachers,
        className: ctx.className ?? fallback.className,
        sectionName: ctx.sectionName ?? fallback.sectionName,
        hasSection: ctx.hasSection === true || authHasSection,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [authHasSection, user?.studentProfile?.className, user?.studentProfile?.sectionId, user?.studentProfile?.sectionName]);

  useEffect(() => {
    load();
  }, [load, user?.studentProfile?.sectionId]);

  const filteredTeachers = subjectId
    ? context.teachers.filter((t) => !t.subjectId || t.subjectId === subjectId)
    : context.teachers;

  const canSubmit =
    !submitting &&
    context.hasSection !== false &&
    (question.trim().length >= 10 || !!questionImageUrl);

  const submit = async (askTeacher) => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      const subject = context.subjects.find((s) => s.id === subjectId);
      await api.post('/doubts', {
        questionText: question.trim(),
        questionImageUrl: questionImageUrl || undefined,
        subjectId: subjectId || undefined,
        subjectName: subject?.name,
        teacherUserId: askTeacher ? (teacherUserId || undefined) : undefined,
        askTeacher,
      });
      setQuestion('');
      setQuestionImageUrl(null);
      setQuestionImagePreview(null);
      setSubjectId('');
      setTeacherUserId('');
      await load();
      setView('list');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit doubt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (id, helpful) => {
    setEscalating(true);
    try {
      await api.patch(`/doubts/${id}/helpful`, { isHelpful: helpful });
      await load();
    } finally {
      setEscalating(false);
    }
  };

  const classBadge =
    context.className || user?.studentProfile?.className
      ? `${context.className || user?.studentProfile?.className}${
          context.sectionName || user?.studentProfile?.sectionName
            ? ` · Section ${context.sectionName || user?.studentProfile?.sectionName}`
            : ''
        }`
      : null;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (view === 'ask') {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Back to my doubts"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Ask a Doubt</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Get instant help from AI or send your question to your subject teacher.
            </p>
            {classBadge && (
              <p className="mt-2 inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                {classBadge}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!context.hasSection && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {context.message ||
              'Your account has no class or section yet. Teachers cannot be assigned until admin completes your enrollment.'}
          </div>
        )}

        {context.hasSection && context.teachers.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            No teachers are mapped to your section yet. You can still use <strong>Ask AI</strong>, or contact your institute admin to assign teachers under{' '}
            <span className="font-bold">Teachers → Academic assignments</span>.
          </div>
        )}

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject (optional)</label>
              <div className="relative mt-1">
                <CustomSelect
          onChange={setSubjectId}
                  value={subjectId}
                  options={[
                  { value: "", label: "General / any subject" },
                  ...context.subjects.map((s) => ({ value: s.id, label: s.name })),
                ]}
                  className="w-full"
                />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher (for direct ask)</label>
              <div className="relative mt-1">
                <CustomSelect
          onChange={setTeacherUserId}
                  value={teacherUserId}
                  options={[
                  { value: "", label: "Auto-assign (class / subject teacher)" },
                ]}
                  className="w-full"
                />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <label className="mt-4 block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Your question
          </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="Describe what you are stuck on (text or image, min. 10 characters if text only)..."
          className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-900 ring-0 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <div className="mt-3">
          <DoubtImageAttach
            label="Attach question image"
            imageUrl={questionImageUrl}
            previewUrl={questionImagePreview}
            onChange={(url, preview) => {
              setQuestionImageUrl(url);
              setQuestionImagePreview(preview);
            }}
          />
        </div>

        {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => submit(false)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Ask AI
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => submit(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Ask Teacher
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            AI answers instantly · Teacher replies when available
          </p>
        </section>
      </div>
    );
  }

  if (isMobile) {
    return (
      <DoubtsMobile
        view={view}
        setView={setView}
        doubts={doubts}
        loading={loading}
        subjectId={subjectId}
        setSubjectId={setSubjectId}
        teacherUserId={teacherUserId}
        setTeacherUserId={setTeacherUserId}
        question={question}
        setQuestion={setQuestion}
        questionImageUrl={questionImageUrl}
        setQuestionImageUrl={setQuestionImageUrl}
        questionImagePreview={questionImagePreview}
        setQuestionImagePreview={setQuestionImagePreview}
        error={error}
        submitting={submitting}
        escalating={escalating}
        canSubmit={canSubmit}
        classBadge={classBadge}
        context={context}
        submit={submit}
        handleHelpful={handleHelpful}
      />
    );
  }

  return (
    <div className="relative space-y-6 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Doubts</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Track your questions and teacher replies.
          </p>
          {classBadge && (
            <p className="mt-2 inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
              {classBadge}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setView('ask')}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Ask a Doubt</span>
        </button>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <span className="text-amber-600">With teacher</span> = pending ·{' '}
        <span className="text-emerald-600">Teacher answered</span> = resolved
      </p>

      {doubts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">No doubts yet</h3>
          <p className="mt-2 text-sm text-slate-500">Tap the + button to ask your first question.</p>
          <button
            type="button"
            onClick={() => setView('ask')}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Ask a Doubt
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {doubts.map((d) => (
            <DoubtCard
              key={d.id}
              doubt={d}
              onHelpful={handleHelpful}
              escalating={escalating}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setView('ask')}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 sm:hidden"
        aria-label="Ask a new doubt"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}
