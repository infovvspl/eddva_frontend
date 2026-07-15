import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import DoubtImageAttach, { DoubtImagePreview } from '@/components/school/DoubtImageAttach';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

const statusMeta = {
  escalated: {
    label: 'Needs reply',
    tone: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  },
  open: {
    label: 'Open',
    tone: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  ai_answered: {
    label: 'AI answered',
    tone: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
  teacher_answered: {
    label: 'Answered',
    tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
};

function DoubtCard({
  doubt,
  replyingId,
  replyText,
  setReplyingId,
  setReplyText,
  replyImageUrl,
  setReplyImageUrl,
  replyImagePreview,
  setReplyImagePreview,
  submitting,
  aiSuggesting,
  onSubmitReply,
  onAiSuggest,
}) {
  const meta = statusMeta[doubt.status] || statusMeta.open;
  const isPending = doubt.status === 'escalated' || doubt.status === 'open' || doubt.status === 'ai_answered';

  return (
    <article className="rounded-xl sm:rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <span className={cn('rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest', meta.tone)}>
          {meta.label}
        </span>
        <time className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {doubt.createdAt ? new Date(doubt.createdAt).toLocaleString() : ''}
        </time>
      </div>

      <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-500">
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[120px] sm:max-w-none">{doubt.studentName || 'Student'}</span>
        {(doubt.className || doubt.sectionName) && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 shrink-0">
            {[doubt.className, doubt.sectionName && `Sec ${doubt.sectionName}`].filter(Boolean).join(' · ')}
          </span>
        )}
        {doubt.subjectName && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 shrink-0">
            {doubt.subjectName}
          </span>
        )}
      </div>

      {doubt.questionText && (
        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{doubt.questionText}</p>
      )}
      {doubt.questionImageUrl && (
        <div className="mt-2.5 sm:mt-3">
          <DoubtImagePreview url={doubt.questionImageUrl} alt="Student question" />
        </div>
      )}

      {doubt.aiExplanation && (
        <div className="mt-2.5 sm:mt-3 rounded-lg sm:rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 sm:p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <p className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Sparkles size={11} className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> AI response (student may escalate)
          </p>
          <p className="mt-1 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 leading-normal">
            {doubt.aiExplanation}
          </p>
        </div>
      )}

      {doubt.teacherResponse && (
        <div className="mt-2.5 sm:mt-3 rounded-lg sm:rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 sm:p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Your answer
          </p>
          {doubt.teacherResponse && (
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-normal">{doubt.teacherResponse}</p>
          )}
          {doubt.teacherResponseImageUrl && (
            <div className="mt-2.5 sm:mt-3">
              <DoubtImagePreview url={doubt.teacherResponseImageUrl} alt="Your answer" />
            </div>
          )}
        </div>
      )}

      {isPending && replyingId === doubt.id ? (
        <div className="mt-3.5 sm:mt-4 space-y-3">
          <button
            type="button"
            disabled={aiSuggesting || submitting}
            onClick={() => onAiSuggest(doubt.id)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] sm:text-xs font-black text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"
          >
            {aiSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Draft with AI (edit before sending)
          </button>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Write or edit your answer for the student..."
            className="w-full resize-none rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 text-xs sm:text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <DoubtImageAttach
            label="Attach answer image"
            imageUrl={replyImageUrl}
            previewUrl={replyImagePreview}
            onChange={(url, preview) => {
              setReplyImageUrl(url);
              setReplyImagePreview(preview);
            }}
          />
          <div className="flex flex-row gap-2">
            <button
              type="button"
              disabled={submitting || (replyText.trim().length < 5 && !replyImageUrl)}
              onClick={() => onSubmitReply(doubt.id)}
              className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-blue-600 px-3.5 py-2 text-[11px] sm:text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send to student
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyingId(null);
                setReplyText('');
                setReplyImageUrl(null);
                setReplyImagePreview(null);
              }}
              className="rounded-lg sm:rounded-xl px-3.5 py-2 text-[11px] sm:text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : isPending ? (
        <button
          type="button"
          onClick={() => {
            setReplyingId(doubt.id);
            setReplyText('');
            setReplyImageUrl(null);
            setReplyImagePreview(null);
          }}
          className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl bg-blue-600 px-3.5 py-2 text-[11px] sm:text-xs font-black text-white hover:bg-blue-700"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Reply to student
        </button>
      ) : null}
    </article>
  );
}

export default function DoubtQueue() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyImageUrl, setReplyImageUrl] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (showSpinner = false) => {
    setError('');
    if (showSpinner) setLoading(true);
    try {
      const res = await api.get('/doubts');
      setDoubts(unwrapSchoolList(res));
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to load doubts');
      setDoubts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const pendingList = useMemo(
    () => doubts.filter((d) => ['escalated', 'open', 'ai_answered'].includes(d.status)),
    [doubts],
  );
  const answeredList = useMemo(
    () => doubts.filter((d) => d.status === 'teacher_answered'),
    [doubts],
  );
  const shown =
    tab === 'pending' ? pendingList : tab === 'answered' ? answeredList : doubts;

  const submitReply = async (id) => {
    if (replyText.trim().length < 5 && !replyImageUrl) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/doubts/${id}/respond`, {
        response: replyText.trim(),
        responseImageUrl: replyImageUrl || undefined,
      });
      setReplyingId(null);
      setReplyText('');
      setReplyImageUrl(null);
      setReplyImagePreview(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const aiSuggest = async (id) => {
    setAiSuggesting(true);
    setError('');
    try {
      const res = await api.post(`/doubts/${id}/ai-suggest`);
      const data = unwrapSchoolData(res, { suggestion: '' });
      if (data.suggestion) {
        setReplyText(data.suggestion);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'AI draft failed');
    } finally {
      setAiSuggesting(false);
    }
  };

  if (loading && doubts.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">Student Doubts</h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-slate-500 hidden sm:block">
            Answer questions from students in your assigned classes and subjects.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          className="inline-flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[11px] sm:text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 shrink-0 shadow-sm"
        >
          <RefreshCw className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', loading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50 p-2.5 sm:p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Pending</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-amber-900 dark:text-amber-100">{pendingList.length}</p>
        </div>
        <div className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 sm:p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Answered</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-emerald-900 dark:text-emerald-100">{answeredList.length}</p>
        </div>
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">All in queue</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-slate-900 dark:text-white">{doubts.length}</p>
        </div>
      </div>

      <div className="flex flex-row flex-nowrap gap-1.5 sm:gap-2">
        {[
          { id: 'pending', label: 'Pending', icon: Clock, count: pendingList.length },
          { id: 'answered', label: 'Answered', icon: CheckCircle2, count: answeredList.length },
          { id: 'all', label: 'All', icon: HelpCircle, count: doubts.length },
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-black transition shrink-0',
              tab === id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
            )}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>{label}</span>
            <span className="rounded bg-white/20 px-1 py-0.2 text-[9px] sm:text-[10px] font-bold">{count}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">
            {tab === 'pending' ? 'No pending doubts' : tab === 'answered' ? 'No answered doubts yet' : 'No doubts yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'pending' && answeredList.length > 0
              ? 'You have answered doubts — check the Answered tab.'
              : tab === 'answered' && pendingList.length > 0
                ? 'You still have pending doubts — check the Pending tab.'
                : (
                  <>
                    When students ask from{' '}
                    <Link to="/school/student/doubts" className="font-bold text-blue-600 hover:underline">
                      Ask a Doubt
                    </Link>
                    , they appear here for your sections.
                  </>
                )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
            {shown.map((d) => (
              <DoubtCard
                key={d.id}
                doubt={d}
                replyingId={replyingId}
                replyText={replyText}
                setReplyingId={setReplyingId}
                setReplyText={setReplyText}
                replyImageUrl={replyImageUrl}
                setReplyImageUrl={setReplyImageUrl}
                replyImagePreview={replyImagePreview}
                setReplyImagePreview={setReplyImagePreview}
                submitting={submitting}
                aiSuggesting={aiSuggesting}
                onSubmitReply={submitReply}
                onAiSuggest={aiSuggest}
              />
            ))}
        </div>
      )}
    </div>
  );
}
