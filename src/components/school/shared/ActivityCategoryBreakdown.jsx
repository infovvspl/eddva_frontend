import React from 'react';
import { formatDurationShort } from '@/lib/format';

export const ACTIVITY_CATEGORY_LABELS = {
  games: 'Games',
  study_materials: 'Study Materials',
  assignments: 'Assignments',
  assessments_other: 'Assessments & Tests',
  doubts: 'Doubts',
  career: 'Career Guidance',
  video_lectures: 'Recorded / Live Classes',
  battle_arena: 'Battle Arena',
  chat_ai: 'AI Tutor',
  nav: 'Navigation (dashboard, profile, etc.)',
};

/** A short, human summary of a category's verified ground-truth fact — pulled
 *  from that feature's own real-action data (school-activity.service.ts),
 *  never from time-on-page. */
export function describeVerifiedActivity(category, verified) {
  if (!verified) return null;
  const n = (k) => Number(verified[k] ?? 0);
  switch (category) {
    case 'games':
      return `${n('roundsPlayed')} round${n('roundsPlayed') === 1 ? '' : 's'} played`;
    case 'assignments':
      return `${n('submissions')} submitted`;
    case 'assessments_other':
      return `${n('attempts')} attempt${n('attempts') === 1 ? '' : 's'}`;
    case 'doubts':
      return `${n('doubtsAsked')} doubt${n('doubtsAsked') === 1 ? '' : 's'} asked`;
    case 'career':
      return `${n('quizzesCompleted')} quiz, ${n('reportsGenerated')} report${n('reportsGenerated') === 1 ? '' : 's'}`;
    case 'chat_ai':
      return `${n('messages')} message${n('messages') === 1 ? '' : 's'} to AI Tutor`;
    case 'video_lectures': {
      const parts = [];
      if (n('recordingsWatched') > 0) {
        parts.push(`${n('recordingsWatched')} recording${n('recordingsWatched') === 1 ? '' : 's'} watched${n('recordingsCompleted') > 0 ? ` (${n('recordingsCompleted')} completed)` : ''}`);
      }
      if (n('liveClassesJoined') > 0) {
        parts.push(`${n('liveClassesJoined')} live class${n('liveClassesJoined') === 1 ? '' : 'es'} joined`);
      }
      return parts.length ? parts.join(', ') : null;
    }
    default:
      return null;
  }
}

/**
 * Per-category time-open vs. verified-engagement list. Purely presentational
 * — callers fetch their own data (admin context calls `/activity/user/:id`,
 * parent context calls the `/parent/students/:id/screen-time/activity`
 * route) since the two run under different auth, but both land in this same
 * shape (`{ category, seconds, visits, verified }[]`) off school-activity.service.ts.
 */
export default function ActivityCategoryBreakdown({ byCategory, loading, emptyLabel = 'No category activity recorded for this range.' }) {
  if (loading) return <p className="px-1 py-4 text-sm text-slate-400">Loading breakdown…</p>;
  if (!byCategory || byCategory.length === 0) return <p className="px-1 py-4 text-sm text-slate-400">{emptyLabel}</p>;

  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <p>Category</p>
        <p className="shrink-0">Time Spent</p>
      </div>
      {byCategory.map((c) => {
        const verifiedText = describeVerifiedActivity(c.category, c.verified);
        return (
          <div key={c.category} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ACTIVITY_CATEGORY_LABELS[c.category] ?? c.category}</p>
              {verifiedText ? (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{verifiedText}</p>
              ) : c.category !== 'nav' ? (
                <p className="text-xs font-medium text-slate-400">No verified activity recorded</p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-black text-slate-700 dark:text-slate-300">
              {c.seconds > 0 && c.seconds < 60 ? '<1m' : formatDurationShort(c.seconds)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
