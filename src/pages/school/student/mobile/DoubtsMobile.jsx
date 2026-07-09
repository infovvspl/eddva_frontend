import React from 'react';
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
  X,
} from 'lucide-react';
import DoubtImageAttach, { DoubtImagePreview } from '@/components/school/DoubtImageAttach';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

const statusLabels = {
  ai_answered: { label: 'AI answered', tone: 'bg-indigo-50 text-indigo-700 border-indigo-150 dark:bg-indigo-950/40 dark:text-indigo-300' },
  escalated: { label: 'With teacher', tone: 'bg-amber-50 text-amber-700 border-amber-150 dark:bg-amber-950/40 dark:text-amber-300' },
  teacher_answered: { label: 'Teacher answered', tone: 'bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/40 dark:text-emerald-300' },
  open: { label: 'Open', tone: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300' },
};

function DoubtCardMobile({ doubt, onHelpful, escalating }) {
  const status = statusLabels[doubt.status] || statusLabels.open;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border ${status.tone}`}>
          {status.label}
        </span>
        <time className="text-[9px] font-bold text-slate-400">
          {doubt.createdAt ? new Date(doubt.createdAt).toLocaleDateString() : ''}
        </time>
      </div>

      <div className="space-y-0.5 text-xs text-slate-400 font-bold">
        {doubt.subjectName && <p>Subject: <span className="text-slate-600 dark:text-slate-300">{doubt.subjectName}</span></p>}
        {doubt.teacherName && <p>Teacher: <span className="text-blue-600 dark:text-blue-400">{doubt.teacherName}</span></p>}
      </div>

      {doubt.questionText && (
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
          {doubt.questionText}
        </p>
      )}

      {doubt.questionImageUrl && (
        <div className="mt-2 rounded-xl overflow-hidden max-h-[200px] w-full bg-slate-50 border border-slate-100 flex items-center justify-center">
          <DoubtImagePreview url={doubt.questionImageUrl} alt="Question" className="max-h-[200px] object-contain" />
        </div>
      )}

      {doubt.aiExplanation && (
        <div className="mt-3.5 rounded-xl border border-indigo-50 bg-indigo-50/25 p-3.5 dark:border-indigo-950/40 dark:bg-indigo-950/10 space-y-2">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles size={11} /> AI Explanation
          </p>
          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <MarkdownRenderer content={doubt.aiExplanation} className="prose-slate max-w-none prose-xs" />
          </div>

          {Array.isArray(doubt.aiSteps) && doubt.aiSteps.length > 0 && (
            <div className="space-y-1 pt-1.5 text-xs text-slate-500">
              {doubt.aiSteps.map((step, i) => (
                <MarkdownRenderer key={i} content={`${i + 1}. ${step}`} className="prose-slate max-w-none prose-xs" />
              ))}
            </div>
          )}

          {doubt.status === 'ai_answered' && (
            <div className="flex gap-2 pt-2 border-t border-indigo-100/50 dark:border-indigo-900/30">
              <button
                type="button"
                disabled={escalating}
                onClick={() => onHelpful(doubt.id, true)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <ThumbsUp size={11} /> Helpful
              </button>
              <button
                type="button"
                disabled={escalating}
                onClick={() => onHelpful(doubt.id, false)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <ThumbsDown size={11} /> Ask Teacher
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function DoubtsMobile({
  view,
  setView,
  doubts,
  loading,
  subjectId,
  setSubjectId,
  teacherUserId,
  setTeacherUserId,
  question,
  setQuestion,
  questionImageUrl,
  setQuestionImageUrl,
  questionImagePreview,
  setQuestionImagePreview,
  error,
  submitting,
  escalating,
  canSubmit,
  classBadge,
  context,
  submit,
  handleHelpful,
}) {
  if (loading && doubts.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Doubts...</p>
        </div>
      </div>
    );
  }

  if (view === 'ask') {
    return (
      <div className="space-y-5 pb-24">
        {/* Ask Doubt Form Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 active:scale-95"
            aria-label="Back to List"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Ask a New Doubt</h2>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Instant AI resolution & teacher backup</p>
          </div>
        </div>

        {!context.hasSection && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 text-xs font-bold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 leading-normal">
            {context.message || 'Enrollment incomplete. Please contact support.'}
          </div>
        )}

        {context.hasSection && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-4 shadow-xs">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subject (Optional)</label>
              <div className="relative mt-1">
                <CustomSelect
                  onChange={setSubjectId}
                  value={subjectId}
                  options={[
                    { value: "", label: "General / Any subject" },
                    ...context.subjects.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ask Teacher</label>
              <div className="relative mt-1">
                <CustomSelect
                  onChange={setTeacherUserId}
                  value={teacherUserId}
                  options={[
                    { value: "", label: "Auto-Assign" },
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Your Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder="Describe what you are stuck on..."
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <DoubtImageAttach
                label="Attach Image"
                imageUrl={questionImageUrl}
                previewUrl={questionImagePreview}
                onChange={(url, preview) => {
                  setQuestionImageUrl(url);
                  setQuestionImagePreview(preview);
                }}
              />
            </div>

            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => submit(false)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-xs font-black text-white shadow-md hover:bg-indigo-700 disabled:opacity-40"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Ask AI
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => submit(true)}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-black text-white shadow-md hover:bg-blue-700 disabled:opacity-40"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Ask Teacher
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header and Floating Action */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">My Doubts</h1>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Track your conceptual queries</p>
        </div>
        <button
          onClick={() => setView('ask')}
          className="inline-flex h-9 items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-md hover:bg-blue-750 active:scale-95"
        >
          <Plus size={14} />
          Ask Doubt
        </button>
      </div>

      {doubts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <HelpCircle className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No doubts posted yet</p>
          <button
            onClick={() => setView('ask')}
            className="mt-4 inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"
          >
            <Plus size={14} /> Ask a Doubt
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {doubts.map((d) => (
            <DoubtCardMobile
              key={d.id}
              doubt={d}
              onHelpful={handleHelpful}
              escalating={escalating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
