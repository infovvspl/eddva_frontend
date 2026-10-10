import { useEffect, useSyncExternalStore } from 'react';
import { extractData } from './api/client';
import schoolApi from './api/school-client';

/**
 * Presentations a teacher is generating (or generated) in the background.
 *
 * A teacher can leave PPT Studio while a deck is made; the deck keeps
 * generating on the server. This is the one shared, polled list behind every
 * place that shows those decks (the AI Generate modal, the "ready" toast), so
 * there is a single poller however many components read it.
 */
export interface PptJob {
  jobId: string;
  createdAt: number;
  topic: string;
  topicName: string | null;
  chapterName: string | null;
  subjectName: string | null;
  className: string | null;
  style: string | null;
  /** The PPT Studio page to open the deck in. */
  pagePath: string | null;
  status: 'queued' | 'running' | 'done' | 'failed';
  stage: string | null;
  done: number | null;
  total: number | null;
  queuePosition: number | null;
  /** What the generator is doing right now, in words. */
  activity: string | null;
  error: string | null;
  title: string | null;
  slides: number | null;
}

export const pptJobsApi = {
  list: () => schoolApi.get('/ppt/jobs')
    .then((res) => extractData<{ jobs: PptJob[] }>(res)?.jobs ?? []),
  dismiss: (jobId: string) => schoolApi.post(`/ppt/jobs/${encodeURIComponent(jobId)}/dismiss`),
};

export function isGenerating(job: PptJob): boolean {
  return job.status === 'queued' || job.status === 'running';
}

/** Was this deck made for that Course Content topic (or whole chapter)? */
export function pptJobIsFor(job: PptJob, scope: { id: string; kind: 'topic' | 'chapter' | 'subject' }): boolean {
  // The studio page a deck was started from carries the ids it was scoped to.
  const query = new URLSearchParams((job.pagePath || '').split('?')[1] || '');
  if (scope.kind === 'topic') return query.get('topicId') === scope.id;
  if (scope.kind === 'chapter') return !query.get('topicId') && query.get('chapterId') === scope.id;
  return false;
}

/**
 * The deck to show when a teacher opens Presentation for a topic: one still
 * being made for it, or one finished and not opened yet. Without this the
 * card opened a fresh setup screen, as if the deck had to be generated again.
 */
export function pptJobToResume(jobs: PptJob[], scope: { id: string; kind: 'topic' | 'chapter' | 'subject' }): PptJob | null {
  const mine = jobs.filter((j) => pptJobIsFor(j, scope));
  return mine.find(isGenerating) ?? mine.find((j) => j.status === 'done') ?? null;
}

/** One line on how far a deck has got, in the teacher's terms. */
export function pptJobProgress(job: PptJob): string {
  if (job.status === 'queued') {
    if (job.queuePosition == null) return 'Waiting for a free generator…';
    return job.queuePosition === 0 ? 'Starting next…'
      : `Waiting in line · ${job.queuePosition} ahead`;
  }
  if (job.status === 'running') {
    if (job.stage === 'pictures' && job.total) {
      return `${job.style === 'image' ? 'Painting slides' : 'Adding pictures'} · ${job.done ?? 0} of ${job.total}`;
    }
    if (job.stage === 'planning' || job.stage === 'writing' || job.stage === 'queued') return 'Writing the slides…';
    return job.activity || 'Generating…';
  }
  if (job.status === 'done') return job.slides ? `Ready · ${job.slides} slides` : 'Ready';
  return job.error || 'Could not be generated';
}

// ── the shared store ─────────────────────────────────────────────────────────
type Snapshot = { jobs: PptJob[]; loaded: boolean };

const POLL_ACTIVE_MS = 5_000;     // while a deck is generating
const POLL_IDLE_MS = 60_000;      // otherwise, to notice decks started elsewhere
const NOTIFIED_KEY = 'eddva_ppt_jobs_notified';

let snapshot: Snapshot = { jobs: [], loaded: false };
const listeners = new Set<() => void>();
const finishedListeners = new Set<(job: PptJob) => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> | null = null;
let stopped = false;                  // no access (401/403): stop asking

function emit() { listeners.forEach((l) => l()); }

function readNotified(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')); } catch { return new Set(); }
}

function markNotified(ids: Set<string>) {
  // Only the last day's decks can be on the list; keep the memory small.
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids].slice(-50))); } catch { /* private mode */ }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!listeners.size || stopped) return;
  const busy = snapshot.jobs.some(isGenerating);
  const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  timer = setTimeout(() => { void refreshPptJobs(); }, busy && !hidden ? POLL_ACTIVE_MS : POLL_IDLE_MS);
}

/** Fetch the list now (and keep polling while anything is listening). */
export function refreshPptJobs(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const jobs = await pptJobsApi.list();
      snapshot = { jobs, loaded: true };
      emit();
      // Each deck that has finished is announced once, ever (this browser).
      const notified = readNotified();
      let changed = false;
      for (const job of jobs) {
        if (!isGenerating(job) && !notified.has(job.jobId)) {
          notified.add(job.jobId);
          changed = true;
          finishedListeners.forEach((l) => l(job));
        }
      }
      if (changed) markNotified(notified);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) stopped = true;   // not a PPT user here
      if (!snapshot.loaded) { snapshot = { ...snapshot, loaded: true }; emit(); }
    } finally {
      inflight = null;
      schedule();
    }
  })();
  return inflight;
}

/** Take a deck off the list (opened, or not wanted). */
export async function dismissPptJob(jobId: string): Promise<void> {
  snapshot = { ...snapshot, jobs: snapshot.jobs.filter((j) => j.jobId !== jobId) };
  emit();
  try { await pptJobsApi.dismiss(jobId); } catch { /* it expires within a day anyway */ }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    stopped = false;
    void refreshPptJobs();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) { clearTimeout(timer); timer = null; }
  };
}

if (typeof document !== 'undefined') {
  // Back on the tab: catch up at once rather than at the next idle poll.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && listeners.size) void refreshPptJobs();
  });
}

/** The teacher's background decks; polls while mounted. */
export function usePptJobs() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  return { ...state, generating: state.jobs.filter(isGenerating) };
}

/** Called once for each deck that finishes (or fails) while the app is open. */
export function useOnPptJobFinished(callback: (job: PptJob) => void) {
  useEffect(() => {
    finishedListeners.add(callback);
    return () => { finishedListeners.delete(callback); };
  }, [callback]);
}

/** For tests: forget everything. */
export function __resetPptJobs() {
  snapshot = { jobs: [], loaded: false };
  if (timer) clearTimeout(timer);
  timer = null;
  inflight = null;
  stopped = false;
  listeners.clear();
  finishedListeners.clear();
}
