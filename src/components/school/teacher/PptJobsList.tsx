import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Presentation, X } from 'lucide-react';
import { isGenerating, pptJobProgress, type PptJob } from '@/lib/pptJobs';

const STYLE_LABEL: Record<string, string> = { image: 'Image slides', v2: 'Designed slides', v1: 'Standard slides' };

function ago(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** Re-render every second while something is generating (for the elapsed time). */
function useTick(active: boolean) {
  const [, setNow] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
}

/**
 * The teacher's presentations generating in the background (and those just
 * finished), in Course Content's AI Generate modal: a spinner and live
 * progress while a deck is made, Open when it is ready, Try again if it failed.
 */
export default function PptJobsList({ jobs, onOpen, onRetry, onDismiss }: {
  jobs: PptJob[];
  onOpen: (job: PptJob) => void;
  onRetry: (job: PptJob) => void;
  onDismiss: (job: PptJob) => void;
}) {
  useTick(jobs.some(isGenerating));
  if (!jobs.length) return null;
  return (
    <section aria-label="Presentations" className="mb-5">
      <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-surface-400">Presentations</p>
      <ul className="space-y-2">
        {jobs.map((job) => {
          const name = job.topicName || job.topic || job.chapterName || 'Presentation';
          const style = STYLE_LABEL[job.style || ''] || 'Presentation';
          const busy = isGenerating(job);
          const pct = busy && job.status === 'running' && job.total
            ? Math.min(100, Math.round(((job.done ?? 0) / job.total) * 100)) : null;
          return (
            <li key={job.jobId} data-testid="ppt-job" data-status={job.status}
              className={`rounded-2xl border p-3 ${job.status === 'failed'
                ? 'border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-900/10'
                : job.status === 'done'
                  ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-900/10'
                  : 'border-violet-200 bg-violet-50/60 dark:border-violet-900/50 dark:bg-violet-900/10'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {busy && <Loader2 size={18} className="animate-spin text-violet-600" aria-label="Generating" />}
                  {job.status === 'done' && <CheckCircle2 size={18} className="text-emerald-600" aria-label="Ready" />}
                  {job.status === 'failed' && <AlertCircle size={18} className="text-red-600" aria-label="Failed" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-surface-900 dark:text-white">
                    {busy ? 'Generating presentation · ' : ''}{job.status === 'done' && job.title ? job.title : name}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] font-medium text-surface-500">
                    <span><Presentation size={11} className="mr-1 inline" />{style}</span>
                    <span aria-live="polite">{pptJobProgress(job)}</span>
                    {busy && <span>· {ago(Date.now() - job.createdAt)}</span>}
                  </p>
                  {pct != null && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40">
                      <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  {busy && (
                    <p className="mt-1.5 text-[11px] text-surface-400">
                      This takes a few minutes. You can keep working; we will let you know when it is ready.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {job.status === 'done' && (
                    <button type="button" onClick={() => onOpen(job)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700">
                      Open
                    </button>
                  )}
                  {job.status === 'failed' && (
                    <button type="button" onClick={() => onRetry(job)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700">
                      Try again
                    </button>
                  )}
                  {busy && (
                    <button type="button" onClick={() => onOpen(job)}
                      className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-800 dark:bg-surface-900">
                      View
                    </button>
                  )}
                  {!busy && (
                    <button type="button" onClick={() => onDismiss(job)} aria-label={`Remove ${name} from this list`}
                      className="grid h-7 w-7 place-items-center rounded-lg text-surface-400 transition hover:bg-white hover:text-surface-600 dark:hover:bg-surface-800">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
