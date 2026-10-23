import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  UsersRound,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import DoubtImageAttach, { DoubtImagePreview } from '@/components/school/DoubtImageAttach';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { useIsMobile } from '@/hooks/use-mobile';
import { isAnswerPlaceholder } from '@/lib/doubt-answer';

const statusLabels = {
  ai_answered: { label: 'AI answered', bar: 'bg-indigo-500', tone: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900/50' },
  escalated: { label: 'With teacher', bar: 'bg-amber-500', tone: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50' },
  teacher_answered: { label: 'Teacher answered', bar: 'bg-emerald-500', tone: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50' },
  open: { label: 'Open', bar: 'bg-slate-400', tone: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700' },
};

function sortByNewest(list, dateField = 'createdAt') {
  return [...list].sort((a, b) => new Date(b[dateField] || 0) - new Date(a[dateField] || 0));
}

// The "All" tab mixes pending and answered doubts, so it orders by whichever is
// more recent for each one — resolvedAt (when a teacher replied) or createdAt
// (when asked) — so a just-answered doubt surfaces at the top instead of staying
// buried at its original ask time.
function sortByActivity(list) {
  const activityDate = (d) => new Date(d.resolvedAt || d.createdAt || 0).getTime();
  return [...list].sort((a, b) => activityDate(b) - activityDate(a));
}

function parseAiAnswer(raw) {
  if (!raw) return null;
  let str = raw.trim();
  
  // Try to find the outermost { } block first (strips preambles/postscripts)
  const jsonMatch = str.match(/(\{[\s\S]*\})/);
  if (jsonMatch) str = jsonMatch[1].trim();

  try {
    const obj = JSON.parse(str);
    if (obj && typeof obj === 'object' && (obj.brief || obj.detailed)) {
      return obj;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function DoubtCard({ doubt, onHelpful, escalating }) {
  const isMobile = useIsMobile();
  const status = statusLabels[doubt.status] || statusLabels.open;
  
  const parsedAi = parseAiAnswer(doubt.aiExplanation);
  const [viewMode, setViewMode] = useState('brief');

  return (
    <article className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-100 bg-white p-4 pl-5 sm:p-5 sm:pl-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', status.bar)} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest', status.tone)}>
            <span className="size-1.5 rounded-full bg-current" />
            {status.label}
          </span>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {doubt.subjectName && (
              <p className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Subject: {doubt.subjectName}</p>
            )}
            {doubt.teacherName && (
              <p className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Teacher: {doubt.teacherName}</p>
            )}
          </div>
        </div>
        <time className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:bg-slate-800/60 dark:text-slate-500">
          {doubt.createdAt ? new Date(doubt.createdAt).toLocaleString() : ''}
        </time>
      </div>

      {doubt.questionText && (
        <p className="mt-3.5 text-[15px] font-semibold leading-relaxed text-slate-900 dark:text-slate-100">{doubt.questionText}</p>
      )}
      {doubt.questionImageUrl && (
        <div className="mt-3">
          <DoubtImagePreview url={doubt.questionImageUrl} alt="Question image" />
        </div>
      )}

      {doubt.aiExplanation && (
        <div className="mt-3 sm:mt-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-3 sm:p-4 dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <Sparkles size={14} /> AI explanation
            </p>
            {parsedAi && (
              <div className="flex items-center gap-1 rounded-lg bg-indigo-100/50 p-1 dark:bg-indigo-900/30">
                <button
                  type="button"
                  onClick={() => setViewMode('brief')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                    viewMode === 'brief'
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-indigo-800 dark:text-white'
                      : 'text-indigo-600 hover:bg-white/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50',
                  )}
                >
                  <Zap className="inline size-3 mr-1 -mt-0.5" /> Brief
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                    viewMode === 'detailed'
                      ? 'bg-white text-indigo-700 shadow-sm dark:bg-indigo-800 dark:text-white'
                      : 'text-indigo-600 hover:bg-white/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50',
                  )}
                >
                  <BookOpen className="inline size-3 mr-1 -mt-0.5" /> Detailed
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {parsedAi ? (
              <div className="space-y-4">
                {viewMode === 'brief' && (
                  <MarkdownRenderer
                    content={parsedAi.brief?.final_answer || parsedAi.brief?.answer || parsedAi.detailed?.explanation || parsedAi.detailed?.solution || ''}
                    className="prose-slate max-w-none prose-sm"
                  />
                )}
                {viewMode === 'detailed' && (
                  <>
                    <MarkdownRenderer
                      content={parsedAi.detailed?.explanation || parsedAi.detailed?.solution || parsedAi.brief?.answer || ''}
                      className="prose-slate max-w-none prose-sm"
                    />
                    {parsedAi.detailed?.final_answer && (
                      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-800 dark:bg-indigo-900/40">
                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5"><CheckCircle2 className="size-3.5 shrink-0" /> Final Answer</h4>
                        <MarkdownRenderer content={parsedAi.detailed.final_answer} className="prose-slate max-w-none prose-sm" />
                      </div>
                    )}
                    {parsedAi.detailed?.verification && !isAnswerPlaceholder(parsedAi.detailed.verification) && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5"><Check className="size-3.5 shrink-0" /> Verification</h4>
                        <MarkdownRenderer content={parsedAi.detailed.verification} className="prose-slate max-w-none prose-sm" />
                      </div>
                    )}
                    {parsedAi.detailed?.key_concept && !isAnswerPlaceholder(parsedAi.detailed.key_concept) && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5"><Lightbulb className="size-3.5 shrink-0" /> Key Concept</h4>
                        <MarkdownRenderer content={parsedAi.detailed.key_concept} className="prose-slate max-w-none prose-sm" />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <MarkdownRenderer content={doubt.aiExplanation} className="prose-slate max-w-none prose-sm" />
            )}
          </div>
          
          {(!parsedAi && Array.isArray(doubt.aiSteps) && doubt.aiSteps.length > 0) && (
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
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <ThumbsUp size={14} /> Helpful
              </button>
              <button
                type="button"
                disabled={escalating}
                onClick={() => onHelpful(doubt.id, false)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ThumbsDown size={14} /> Ask teacher instead
              </button>
            </div>
          )}
        </div>
      )}

      {doubt.teacherResponse && (
        <div className="mt-3 sm:mt-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-3 sm:p-4 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-slate-900">
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
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          Not resolved yet — waiting for your teacher. You can also message them in{' '}
          <Link to="/school/student/chat" className="font-bold underline">Class Chat</Link>.
        </p>
      )}

      {doubt.status === 'teacher_answered' && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
          Resolved
          {doubt.resolvedAt ? ` · ${new Date(doubt.resolvedAt).toLocaleString()}` : ''}
        </p>
      )}
    </article>
  );
}

export default function Doubts() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('pending');
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
  // Which button was pressed ('ai' | 'teacher'), so only that one shows the spinner.
  const [submittingTo, setSubmittingTo] = useState(null);
  const [escalating, setEscalating] = useState(false);
  const [question, setQuestion] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherUserId, setTeacherUserId] = useState('');
  const [questionImageUrl, setQuestionImageUrl] = useState(null);
  const [questionImagePreview, setQuestionImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [explanationMode, setExplanationMode] = useState('detailed');
  const [language, setLanguage] = useState('english');

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

  const pendingDoubts = useMemo(
    () => sortByNewest(doubts.filter((d) => d.status !== 'teacher_answered')),
    [doubts],
  );
  const answeredDoubts = useMemo(
    // Most recently *answered* first — resolvedAt is set when the teacher replies,
    // so this doesn't just echo the original ask order.
    () => sortByNewest(doubts.filter((d) => d.status === 'teacher_answered'), 'resolvedAt'),
    [doubts],
  );
  const allDoubts = useMemo(() => sortByActivity(doubts), [doubts]);
  // Split out of "Pending" so a student can tell "AI already answered this" apart
  // from "nobody has looked at this yet" — both currently count as pending above.
  const aiAnsweredDoubts = useMemo(
    () => sortByNewest(doubts.filter((d) => d.status === 'ai_answered')),
    [doubts],
  );
  const teacherAnsweredDoubts = answeredDoubts;
  const shownDoubts = tab === 'pending' ? pendingDoubts
    : tab === 'ai' ? aiAnsweredDoubts
    : tab === 'teacher' ? teacherAnsweredDoubts
    : tab === 'answered' ? answeredDoubts
    : allDoubts;

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
    setSubmittingTo(askTeacher ? 'teacher' : 'ai');
    try {
      const subject = context.subjects.find((s) => s.id === subjectId);
      await api.post('/doubts', {
        questionText: question.trim(),
        questionImageUrl: questionImageUrl || undefined,
        subjectId: subjectId || undefined,
        subjectName: subject?.name,
        teacherUserId: askTeacher ? (teacherUserId || undefined) : undefined,
        askTeacher,
        explanationMode,
        language,
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
      setSubmittingTo(null);
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
        <Loader2 className="size-8 animate-spin text-blue-600" />
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
            className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Back to my doubts"
          >
            <ArrowLeft className="size-5" />
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
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="size-5" />
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

        <section className="rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Response Language</label>
          <div className="relative mt-1">
            <CustomSelect
              onChange={setLanguage}
              value={language}
              options={[
                { value: "english", label: "🇺🇸 English" },
                { value: "hindi", label: "🇮🇳 Hindi (हिंदी)" },
                { value: "odia", label: "🇮🇳 Odia (ଓଡ଼ିଆ)" },
              ]}
              className="w-full"
            />
          </div>
        </div>

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

          {/* Actions: both buttons on the left, note on the right from sm up; stacked full-width on phones */}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => submit(false)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
              >
                {submittingTo === 'ai' ? <Loader2 className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />}
                Ask AI Tutor
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => submit(true)}
                className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
              >
                {submittingTo === 'teacher' ? <Loader2 className="size-4 animate-spin" /> : <UsersRound className="size-4" />}
                Ask Teacher
              </button>
            </div>
            <p className="text-center text-[11px] font-semibold text-slate-400 sm:text-right">
              AI answers instantly · Teacher replies when available
            </p>
          </div>
        </section>
      </div>
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
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
              <span className="size-1.5 rounded-full bg-blue-500" />
              {classBadge}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setView('ask')}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/25 ring-1 ring-inset ring-white/15 transition-all hover:brightness-110 hover:shadow-blue-600/40 active:scale-[0.98]"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">Ask a Doubt</span>
        </button>
      </div>

      {doubts.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-3.5 dark:border-amber-900/50 dark:bg-slate-900 sm:p-4">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
              <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-amber-200/50 dark:bg-amber-500/10" />
              <p className="relative text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Pending</p>
              <p className="relative mt-1 text-3xl font-black leading-none text-amber-900 dark:text-amber-100">{pendingDoubts.length}</p>
              <p className="relative mt-1.5 hidden text-[11px] font-semibold text-amber-700/70 dark:text-amber-300/60 sm:block">Awaiting a reply</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-3.5 dark:border-emerald-900/50 dark:bg-slate-900 sm:p-4">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
              <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-emerald-200/50 dark:bg-emerald-500/10" />
              <p className="relative text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Answered</p>
              <p className="relative mt-1 text-3xl font-black leading-none text-emerald-900 dark:text-emerald-100">{answeredDoubts.length}</p>
              <p className="relative mt-1.5 hidden text-[11px] font-semibold text-emerald-700/70 dark:text-emerald-300/60 sm:block">Replied by your teacher</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-white p-3.5 dark:border-indigo-900/50 dark:bg-slate-900 sm:p-4">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-indigo-500" />
              <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-indigo-200/50 dark:bg-indigo-500/10" />
              <p className="relative text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">Total</p>
              <p className="relative mt-1 text-3xl font-black leading-none text-indigo-900 dark:text-white">{doubts.length}</p>
              <p className="relative mt-1.5 hidden text-[11px] font-semibold text-indigo-700/70 dark:text-indigo-300/60 sm:block">Questions asked</p>
            </div>
          </div>

          <div className="flex flex-row flex-nowrap gap-2 overflow-x-auto">
            {[
              { id: 'pending', label: 'Pending', icon: Clock, count: pendingDoubts.length },
              { id: 'ai', label: 'AI Answered', icon: Sparkles, count: aiAnsweredDoubts.length },
              { id: 'teacher', label: 'Teacher Answered', icon: GraduationCap, count: teacherAnsweredDoubts.length },
              { id: 'all', label: 'All', icon: HelpCircle, count: doubts.length },
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-all shrink-0',
                  tab === id
                    ? 'border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/30',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none', tab === id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>{count}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {doubts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 p-12 text-center shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
          <span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-400 dark:from-blue-950/40 dark:to-indigo-950/40">
            <HelpCircle className="size-10" />
          </span>
          <h3 className="mt-4 text-base font-black text-slate-900 dark:text-white">No doubts yet</h3>
          <p className="mt-2 text-sm text-slate-500">Tap the + button to ask your first question.</p>
          <button
            type="button"
            onClick={() => setView('ask')}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-5" />
            Ask a Doubt
          </button>
        </div>
      ) : shownDoubts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 p-12 text-center shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 dark:from-slate-800 dark:to-slate-800">
            <HelpCircle className="size-8" />
          </span>
          <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">
            {tab === 'pending' ? 'No pending doubts' : 'No answered doubts yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'pending'
              ? 'All caught up! Check the Answered tab.'
              : 'Your teacher hasn’t replied yet — check the Pending tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shownDoubts.map((d) => (
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
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/35 ring-4 ring-white/60 transition-transform active:scale-95 dark:ring-slate-900/60 sm:hidden"
        aria-label="Ask a new doubt"
      >
        <Plus className="size-7" />
      </button>
    </div>
  );
}
