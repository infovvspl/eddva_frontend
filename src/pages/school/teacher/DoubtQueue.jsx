import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapSchoolData, unwrapSchoolList } from '@/lib/api/school-client';
import { useSchoolFeature } from '@/hooks/use-school-feature';
import DoubtImageAttach, { DoubtImagePreview } from '@/components/school/DoubtImageAttach';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { isAnswerPlaceholder } from '@/lib/doubt-answer';

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

function sortByNewest(list, dateField = 'createdAt') {
  return [...list].sort((a, b) => new Date(b[dateField] || 0) - new Date(a[dateField] || 0));
}

// "All" mixes answered and unanswered doubts, so it orders by whichever is more
// recent for each one — resolvedAt (when the teacher replied) or createdAt (when
// asked) — rather than always the ask time, which would bury a just-answered doubt.
function sortByActivity(list) {
  const activityDate = (d) => new Date(d.resolvedAt || d.createdAt || 0).getTime();
  return [...list].sort((a, b) => activityDate(b) - activityDate(a));
}

function parseAiAnswer(raw) {
  if (!raw) return null;
  let str = raw.trim();
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
  hasDoubtSolver,
}) {
  const meta = statusMeta[doubt.status] || statusMeta.open;
  const isPending = doubt.status === 'escalated' || doubt.status === 'open' || doubt.status === 'ai_answered';
  const parsedAi = parseAiAnswer(doubt.aiExplanation);
  const [viewMode, setViewMode] = useState('brief');

  return (
    <Card className="rounded-xl sm:rounded-2xl border-slate-100 bg-white p-3.5 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline" className={cn('rounded border-transparent px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest', meta.tone)}>
          {meta.label}
        </Badge>
        <time className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {doubt.createdAt ? new Date(doubt.createdAt).toLocaleString() : ''}
        </time>
      </div>

      <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-slate-500">
        <User className="size-3.5 shrink-0" />
        <span className="truncate max-w-[120px] sm:max-w-none">{doubt.studentName || 'Student'}</span>
        {(doubt.className || doubt.sectionName) && (
          <Badge variant="outline" className="shrink-0 rounded border-transparent bg-slate-100 px-1.5 py-0.5 text-[11px] sm:text-xs font-bold text-slate-500 dark:bg-slate-800">
            {[doubt.className, doubt.sectionName && `Sec ${doubt.sectionName}`].filter(Boolean).join(' · ')}
          </Badge>
        )}
        {doubt.subjectName && (
          <Badge variant="outline" className="shrink-0 rounded border-transparent bg-blue-50 px-1.5 py-0.5 text-[11px] sm:text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {doubt.subjectName}
          </Badge>
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
        <Card className="mt-2.5 sm:mt-3 rounded-lg sm:rounded-xl border-indigo-100 bg-indigo-50/60 p-2.5 sm:p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20 shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <Sparkles size={11} className="size-3 sm:size-3.5 shrink-0" /> AI response (student may escalate)
            </p>
            {parsedAi && (
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="h-auto gap-1 rounded-lg bg-indigo-100/50 p-0.5 dark:bg-indigo-900/30">
                  {[
                    { id: 'brief', label: 'Brief', icon: Zap },
                    { id: 'detailed', label: 'Detailed', icon: BookOpen },
                  ].map(({ id, label, icon: Icon }) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      className="rounded-md px-2 py-1 text-[10px] sm:text-xs font-bold text-indigo-600 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm dark:text-indigo-300 dark:hover:bg-indigo-800/50 dark:data-[state=active]:bg-indigo-800 dark:data-[state=active]:text-white"
                    >
                      <Icon className="mr-1 size-3 shrink-0" /> {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
            {parsedAi ? (
              <div className="space-y-3">
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
                      <Card className="mt-3 rounded-xl border-indigo-200 bg-indigo-50/80 p-3 dark:border-indigo-800 dark:bg-indigo-900/40 shadow-none">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1"><CheckCircle2 className="size-3 shrink-0" /> Final Answer</h4>
                        <MarkdownRenderer content={parsedAi.detailed.final_answer} className="prose-slate max-w-none prose-sm" />
                      </Card>
                    )}
                    {parsedAi.detailed?.verification && !isAnswerPlaceholder(parsedAi.detailed.verification) && (
                      <Card className="mt-2 rounded-xl border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800/60 shadow-none">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Check className="size-3 shrink-0" /> Verification</h4>
                        <MarkdownRenderer content={parsedAi.detailed.verification} className="prose-slate max-w-none prose-sm" />
                      </Card>
                    )}
                    {parsedAi.detailed?.key_concept && !isAnswerPlaceholder(parsedAi.detailed.key_concept) && (
                      <Card className="mt-2 rounded-xl border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/30 dark:bg-amber-950/20 shadow-none">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1"><Lightbulb className="size-3 shrink-0" /> Key Concept</h4>
                        <MarkdownRenderer content={parsedAi.detailed.key_concept} className="prose-slate max-w-none prose-sm" />
                      </Card>
                    )}
                  </>
                )}
              </div>
            ) : (
              <MarkdownRenderer content={doubt.aiExplanation} className="prose-slate max-w-none prose-sm" />
            )}
          </div>
        </Card>
      )}

      {doubt.teacherResponse && (
        <Card className="mt-2.5 sm:mt-3 rounded-lg sm:rounded-xl border-emerald-100 bg-emerald-50/60 p-2.5 sm:p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20 shadow-none">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Your answer
          </p>
          {doubt.teacherResponse && (
            <div className="mt-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-normal">
              <MarkdownRenderer content={doubt.teacherResponse} className="prose-slate max-w-none prose-sm" />
            </div>
          )}
          {doubt.teacherResponseImageUrl && (
            <div className="mt-2.5 sm:mt-3">
              <DoubtImagePreview url={doubt.teacherResponseImageUrl} alt="Your answer" />
            </div>
          )}
        </Card>
      )}

      {isPending && replyingId === doubt.id ? (
        <div className="mt-3.5 sm:mt-4 space-y-3">
          {hasDoubtSolver && (
            <Button
              type="button"
              variant="outline"
              disabled={aiSuggesting || submitting}
              onClick={() => onAiSuggest(doubt.id)}
              className="h-auto w-full gap-2 rounded-lg sm:rounded-xl border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] sm:text-xs font-black text-indigo-700 hover:bg-indigo-100 hover:text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"
            >
              {aiSuggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Draft with AI (edit before sending)
            </Button>
          )}
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Write or edit your answer for the student..."
            className="min-h-0 w-full resize-none rounded-lg sm:rounded-xl border-slate-200 bg-slate-50 p-2.5 sm:p-3 text-xs sm:text-sm font-medium dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={submitting || (replyText.trim().length < 5 && !replyImageUrl)}
              onClick={() => onSubmitReply(doubt.id)}
              className="h-auto gap-1.5 rounded-lg sm:rounded-xl px-3.5 py-2 text-[11px] sm:text-xs font-black"
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Send to student
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setReplyingId(null);
                setReplyText('');
                setReplyImageUrl(null);
                setReplyImagePreview(null);
              }}
              className="h-auto rounded-lg sm:rounded-xl px-3.5 py-2 text-[11px] sm:text-xs font-bold"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : isPending ? (
        <Button
          type="button"
          onClick={() => {
            setReplyingId(doubt.id);
            setReplyText('');
            setReplyImageUrl(null);
            setReplyImagePreview(null);
          }}
          className="mt-3 h-auto w-full gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-black sm:mt-4 sm:w-auto sm:rounded-xl sm:text-xs"
        >
          <MessageSquare className="size-3.5" />
          Reply to student
        </Button>
      ) : null}
    </Card>
  );
}

export default function DoubtQueue() {
  const hasDoubtSolver = useSchoolFeature('ai', 'ai_doubt_solver');
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
    () => sortByNewest(doubts.filter((d) => ['escalated', 'open', 'ai_answered'].includes(d.status))),
    [doubts],
  );
  const answeredList = useMemo(
    // Most recently *answered* first — resolvedAt is set when the teacher replies,
    // so this doesn't just echo the original ask order like createdAt would.
    () => sortByNewest(doubts.filter((d) => d.status === 'teacher_answered'), 'resolvedAt'),
    [doubts],
  );
  const allList = useMemo(() => sortByActivity(doubts), [doubts]);
  const shown =
    tab === 'pending' ? pendingList : tab === 'answered' ? answeredList : allList;

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
    if (!hasDoubtSolver) return;
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
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Skeleton className="h-16 rounded-xl sm:h-20 sm:rounded-2xl" />
          <Skeleton className="h-16 rounded-xl sm:h-20 sm:rounded-2xl" />
          <Skeleton className="h-16 rounded-xl sm:h-20 sm:rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
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
        <Button
          type="button"
          variant="outline"
          onClick={() => load(true)}
          className="h-auto shrink-0 gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-black shadow-sm sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-xs"
        >
          <RefreshCw className={cn('size-3.5 sm:size-4', loading && 'animate-spin')} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="rounded-xl sm:rounded-2xl border-amber-200 bg-amber-50 p-2.5 sm:p-4 dark:border-amber-900/50 dark:bg-amber-950/30 shadow-none">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Pending</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-amber-900 dark:text-amber-100">{pendingList.length}</p>
        </Card>
        <Card className="rounded-xl sm:rounded-2xl border-emerald-200 bg-emerald-50 p-2.5 sm:p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30 shadow-none">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Answered</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-emerald-900 dark:text-emerald-100">{answeredList.length}</p>
        </Card>
        <Card className="rounded-xl sm:rounded-2xl border-slate-200 bg-white p-2.5 sm:p-4 dark:border-slate-800 dark:bg-slate-900 shadow-none">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">All in queue</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-black text-slate-900 dark:text-white">{doubts.length}</p>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 bg-transparent p-0 sm:inline-flex sm:w-auto sm:gap-2">
          {[
            { id: 'pending', label: 'Pending', icon: Clock, count: pendingList.length },
            { id: 'answered', label: 'Answered', icon: CheckCircle2, count: answeredList.length },
            { id: 'all', label: 'All', icon: HelpCircle, count: doubts.length },
          ].map(({ id, label, icon: Icon, count }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-black text-slate-600 hover:bg-slate-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 dark:bg-slate-800 dark:text-slate-300 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2 sm:text-xs"
            >
              <Icon className="size-3.5 shrink-0 sm:size-4" />
              <span>{label}</span>
              <span className="rounded bg-white/20 px-1 text-[9px] font-bold sm:text-[10px]">{count}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && (
        <Alert className="rounded-xl border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </Alert>
      )}

      {shown.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-none">
          <HelpCircle className="mx-auto size-10 text-slate-300" />
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
        </Card>
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
                hasDoubtSolver={hasDoubtSolver}
              />
            ))}
        </div>
      )}
    </div>
  );
}
