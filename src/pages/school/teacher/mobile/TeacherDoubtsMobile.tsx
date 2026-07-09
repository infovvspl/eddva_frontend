import React from 'react';
import { MobileListLayout } from '@/components/shared/mobile/MobileLayouts';
import { RefreshCw, HelpCircle } from 'lucide-react';

export default function TeacherDoubtsMobile({
  doubts,
  loading,
  tab,
  setTab,
  pendingCount,
  answeredCount,
  onRefresh,
  DoubtCard,
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
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Doubt Queue</h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Answer Student Queries</p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-650 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-950/20 dark:bg-amber-950/10">
          <p className="text-[9px] font-bold text-amber-700 uppercase">Pending</p>
          <p className="text-lg font-black text-amber-900 mt-0.5">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-950/20 dark:bg-emerald-950/10">
          <p className="text-[9px] font-bold text-emerald-700 uppercase">Answered</p>
          <p className="text-lg font-black text-emerald-900 mt-0.5">{answeredCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white p-1 shadow-xs border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shrink-0">
        {[
          { id: "pending", label: "Pending" },
          { id: "answered", label: "Answered" },
          { id: "all", label: "All Questions" },
        ].map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 text-center py-2 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : doubts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-850 dark:bg-slate-900/50">
          <p className="text-xs font-bold text-slate-500">No questions in this tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {doubts.map((doubt) => (
            <DoubtCard
              key={doubt.id}
              doubt={doubt}
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
              onSubmitReply={onSubmitReply}
              onAiSuggest={onAiSuggest}
            />
          ))}
        </div>
      )}
    </div>
  );
}
