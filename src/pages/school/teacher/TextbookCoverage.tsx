/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, Search, RefreshCw, Link2Off,
  CheckCircle2, CircleDashed, AlertTriangle, Loader2, PlayCircle, FileText, X,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Which chapters the AI can teach from the school's own book.
 *
 * A school has hundreds of chapters — Naval's alone has 563 — so this is built
 * to answer "what is still missing" at a glance rather than to list everything:
 * counts first, then class/subject groups that stay collapsed until opened.
 */

type Row = {
  chapterId: string;
  chapterName: string;
  subjectName: string;
  className: string | null;
  indexed: boolean;
  /** Indexed, but against a file that isn't the one linked any more — a newer
   *  PDF was uploaded after the last index and nothing re-read it yet.
   *  Absent on an older backend. */
  stale?: boolean;
  hasPdf: boolean;
  linkReachable: boolean | null;
  materialId: string | null;
  pages: number | null;
  passages: number | null;
  /** Diagrams cropped from this chapter's PDF. Absent on an older backend. */
  figures?: number | null;
  method: string | null;
  quality: string | null;
  fileName: string | null;
  fileUrl: string | null;
  uploadedAt: string | null;
};

type RunStatus = {
  status: string; total: number; done: number;
  succeeded: number; failed: number; lastChapter: string | null;
  // Which chapter is being read right now (distinct from lastChapter, the most
  // recently *finished* one), and how far its own page-by-page OCR pass has
  // gotten — only populated while that chapter needs the slow vision-transcribe
  // path, which is the only part of indexing a single book takes long enough
  // to need a progress bar of its own.
  currentChapter?: string | null;
  currentMaterialId?: string | null;
  currentPagesDone?: number | null;
  currentPagesTotal?: number | null;
} | null;

/** The five states a chapter can be in, in the order a school works through them. */
type State = 'ready' | 'stale' | 'pending' | 'broken' | 'missing';

const stateOf = (r: Row): State => {
  if (r.indexed && r.stale) return 'stale';
  if (r.indexed) return 'ready';
  if (r.hasPdf && r.linkReachable === false) return 'broken';
  if (r.hasPdf) return 'pending';
  return 'missing';
};

const STATE_META: Record<State, { label: string; hint: string; cls: string; Icon: any }> = {
  ready:   { label: 'Ready',        hint: 'AI writes from this book',        cls: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900', Icon: CheckCircle2 },
  // A chapter can be genuinely wrong in this state — indexed, but from an
  // older file than the one now linked to it — so it gets its own color
  // rather than being folded into "Ready".
  stale:   { label: 'Needs re-index', hint: 'A newer file was uploaded — re-index to use it', cls: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/40 dark:border-orange-900', Icon: RefreshCw },
  pending: { label: 'Not indexed',  hint: 'Book uploaded, not read yet',     cls: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900', Icon: CircleDashed },
  broken:  { label: 'File missing', hint: 'Upload again — the file is gone', cls: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-900', Icon: Link2Off },
  missing: { label: 'No book',      hint: 'Nothing uploaded for this chapter', cls: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/60 dark:border-slate-700', Icon: AlertTriangle },
};

/**
 * `instituteId` is only supplied when a super-admin opens this for a specific
 * school. Staff omit it and the server pins the request to their own institute,
 * so a teacher can never read or change another school's chapters by passing one.
 */
const TextbookCoverage: React.FC<{ instituteId?: string; embedded?: boolean }> = ({
  instituteId,
  embedded = false,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'INSTITUTE_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<State | 'all'>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [run, setRun] = useState<RunStatus>(null);
  // Which chapter WE just told the backend to index, kept true from the moment of the click until
  // a poll confirms the run is actually done — not just until the first poll round-trip resolves
  // (that's what `busy` tracks, and it clears in well under a second). Relying on `run.status ===
  // 'running'` being caught by a live poll breaks for a fast job: a chapter with a normal text
  // layer (or, after fixing a slow/misconfigured Redis connection, even a scanned one) can finish
  // in a few seconds — fast enough that by the time any poll's response comes back, the run has
  // already moved to 'finished', and the spinner/"Reading…" indicator never gets to show at all.
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/textbooks/coverage', { params: instituteId ? { instituteId } : undefined });
      setRows(res?.data?.data ?? res?.data ?? []);
    } catch {
      toast.error('Could not load textbook coverage.');
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => { load(); }, [load]);

  // Poll only while a run is active; indexing a scanned chapter takes ~90s, so
  // the screen has to keep up without the user refreshing.
  const pollRun = useCallback(async () => {
    try {
      const res = await api.get('/textbooks/ingest-status', { params: instituteId ? { instituteId } : undefined });
      const s: RunStatus = res?.data?.data ?? res?.data ?? null;
      setRun(s);
      if (s && s.status !== 'running') {
        // The run reached a terminal state — whether or not a live poll ever caught it as
        // "running" in between, it is now confirmed NOT in flight, so the optimistic per-row
        // indicator can safely clear.
        setActiveChapterId(null);
      }
      if (s && s.status !== 'running' && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        load();
        if (s.status === 'cancelled') {
          toast.info(`Indexing cancelled — ${s.succeeded} chapters indexed before stopping.`);
        } else {
          toast.success(`Indexing finished — ${s.succeeded} chapters ready, ${s.failed} failed.`);
        }
      }
    } catch { /* transient */ }
  }, [load]);

  useEffect(() => {
    pollRun();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollRun]);

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(pollRun, 5000);
  };

  const counts = useMemo(() => {
    const c = { ready: 0, stale: 0, pending: 0, broken: 0, missing: 0 };
    rows.forEach((r) => { c[stateOf(r)]++; });
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'all' && stateOf(r) !== filter) return false;
      if (!q) return true;
      return (
        r.chapterName.toLowerCase().includes(q) ||
        r.subjectName.toLowerCase().includes(q) ||
        (r.className || '').toLowerCase().includes(q)
      );
    });
  }, [rows, query, filter]);

  /** class → subject → chapters, so hundreds of rows stay navigable. */
  const grouped = useMemo(() => {
    const out: Record<string, Record<string, Row[]>> = {};
    visible.forEach((r) => {
      const cls = r.className || 'Unassigned class';
      (out[cls] ||= {});
      (out[cls][r.subjectName] ||= []).push(r);
    });
    return out;
  }, [visible]);

  const indexOne = async (r: Row) => {
    if (!r.materialId) return;
    setBusy(r.chapterId);
    try {
      const res = await api.post('/textbooks/ingest', { materialId: r.materialId, instituteId });
      const d = res?.data?.data ?? res?.data;
      // Indexing now runs in the background (large/scanned PDFs can take minutes
      // and cannot sit on one HTTP request), so start progress polling instead of
      // waiting for a result here. The poll shows the run and toasts on finish.
      if (d?.runId) {
        setActiveChapterId(r.chapterId);
        toast.info(`Indexing "${r.chapterName}" started — large or scanned PDFs can take a minute.`);
        await pollRun();
        startPolling();
      } else {
        load();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Indexing failed.');
    } finally {
      setBusy(null);
    }
  };

  /**
   * Upload a chapter PDF and index it in one step.
   *
   * A book that is uploaded but unread is the "not indexed" state teachers kept
   * landing in, so this deliberately does both rather than leaving a second
   * action to remember.
   */
  const uploadOne = async (r: Row, file: File) => {
    if (!/\.pdf$/i.test(file.name)) {
      toast.error('Please choose a PDF file.');
      return;
    }
    setBusy(r.chapterId);
    try {
      const form = new FormData();
      form.append('chapterId', r.chapterId);
      if (instituteId) form.append('instituteId', instituteId);
      form.append('file', file);
      const res = await api.post('/textbooks/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Scanned chapters are read page by page, so this is far slower than a
        // normal upload and must not inherit the default client timeout.
        timeout: 300000,
      });
      const d = res?.data?.data ?? res?.data;
      // Upload done; indexing now runs in the background (see indexOne). Start
      // progress polling instead of waiting for the read to finish.
      if (d?.runId) {
        setActiveChapterId(r.chapterId);
        toast.success(`"${r.chapterName}" uploaded — indexing started (large/scanned PDFs can take a minute).`);
        await pollRun();
        startPolling();
      } else {
        // Upload succeeded but indexing couldn't start now (e.g. another run is
        // already in progress); it can be indexed once that finishes.
        toast.success(`"${r.chapterName}" uploaded. Index it once the current run finishes.`);
        load();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Upload failed.');
    } finally {
      setBusy(null);
    }
  };

  const auditLinks = async () => {
    setBusy('audit');
    try {
      const res = await api.post('/textbooks/audit-links', { limit: 1000, instituteId });
      const d = res?.data?.data ?? res?.data;
      toast.success(`Checked ${d.checked} files — ${d.reachable} fine, ${d.dead} missing.`);
      load();
    } catch {
      toast.error('Link check failed.');
    } finally {
      setBusy(null);
    }
  };

  const indexAll = async () => {
    setBusy('bulk');
    try {
      const res = await api.post('/textbooks/ingest-bulk', { instituteId });
      const d = res?.data?.data ?? res?.data;
      toast.success(`Indexing ${d.queued} chapters in the background.`);
      startPolling();
      pollRun();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not start indexing.');
    } finally {
      setBusy(null);
    }
  };

  const cancelIndexing = async () => {
    setBusy('cancel');
    // Stop polling first so a late poll can't report the run as "finished".
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    try {
      await api.post('/textbooks/ingest-cancel', { instituteId });
      toast.success('Indexing cancelled. Chapters already indexed are kept.');
      setRun(null);
      setActiveChapterId(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not cancel indexing.');
      startPolling(); // resume watching if the cancel didn't take
    } finally {
      setBusy(null);
    }
  };

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  if (loading) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Loading coverage">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-5" : "space-y-5 pb-16"}>
      {!embedded && (
        <header className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-surface-900 dark:text-white">
            Textbook coverage
          </h1>
          <p className="text-sm text-surface-500 max-w-2xl">
            Chapters marked <strong>Ready</strong> are taught from your own book, and every generated
            line cites its page. The rest still work, but are written from the AI's general knowledge.
          </p>
        </header>
      )}

      {/* Counts first — the question is what is missing, not what exists. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(['ready', 'stale', 'pending', 'broken', 'missing'] as State[]).map((k) => {
          const m = STATE_META[k];
          const active = filter === k;
          return (
            <Button
              key={k}
              variant={null}
              size={null}
              onClick={() => setFilter(active ? 'all' : k)}
              aria-pressed={active}
              className={`h-auto flex-col items-stretch justify-start whitespace-normal rounded-xl border p-3 text-left font-normal transition ${m.cls} ${
                active ? 'ring-2 ring-offset-1 ring-current' : 'hover:brightness-95'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <m.Icon className="size-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="mt-1 text-2xl font-black tabular-nums">{counts[k]}</p>
              <p className="text-[11px] opacity-80">{m.hint}</p>
            </Button>
          );
        })}
      </div>

      {/* Overall bulk-run summary — only for a genuine multi-book run. A single-chapter index
          (run.total === 1, the common case from clicking "Index" on one row) has nothing to
          summarize here; its progress shows inline on that book's own row below instead, where
          it's actually visible "along with the book being trained" rather than in a banner
          disconnected from the list. */}
      {run && run.status === 'running' && run.total > 1 && (
        <Card className="rounded-xl border-brand-200 bg-brand-50 p-3 shadow-none dark:border-brand-900 dark:bg-brand-950/40">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm">
            <span className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-300">
              <Loader2 className="size-4 animate-spin" />
              Indexing {run.done} of {run.total}
            </span>
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden min-w-0 truncate text-xs text-brand-600 dark:text-brand-400 sm:inline">
                {run.currentChapter ? `Reading "${run.currentChapter}"` : run.lastChapter ? `Last: ${run.lastChapter}` : 'Starting…'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelIndexing}
                disabled={busy === 'cancel'}
                className="h-7 shrink-0 gap-1.5 border-rose-200 bg-white px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                {busy === 'cancel' ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                Cancel
              </Button>
            </div>
          </div>
          <Progress
            value={run.total ? (run.done / run.total) * 100 : 0}
            className="mt-2 h-1.5 bg-brand-100 dark:bg-brand-900"
            indicatorClassName="bg-brand-500"
          />
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-surface-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapter, subject or class"
            className="rounded-xl bg-white pl-9 dark:border-surface-700 dark:bg-surface-900"
          />
        </div>
        {filter !== 'all' && (
          <Button variant="outline" size="sm" onClick={() => setFilter('all')} className="h-9 rounded-xl text-xs font-bold">
            Clear filter
          </Button>
        )}
        {isAdmin && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={auditLinks}
              disabled={!!busy}
              className="h-9 flex-1 gap-1.5 rounded-xl text-xs font-bold sm:flex-none"
            >
              {busy === 'audit' ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Check files
            </Button>
            <Button
              size="sm"
              onClick={indexAll}
              disabled={!!busy || run?.status === 'running' || counts.pending + counts.stale === 0}
              title={counts.pending + counts.stale === 0 ? 'Nothing waiting to be indexed' : undefined}
              className="h-9 flex-1 gap-1.5 rounded-xl bg-brand-600 text-xs font-bold text-white hover:bg-brand-700 sm:flex-none"
            >
              {busy === 'bulk' ? <Loader2 className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />}
              Index {counts.pending + counts.stale} waiting
            </Button>
          </>
        )}
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-xl border-dashed border-surface-300 p-8 text-center text-sm text-surface-500 shadow-none dark:border-surface-700">
          No chapters match.
        </Card>
      ) : (
        <div className="space-y-2">
          {Object.keys(grouped)
            .sort((a, b) => {
              const normA = (a || '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
              const normB = (b || '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
              return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' });
            })
            .map((cls) => {
            const subjects = grouped[cls];
            const total = Object.values(subjects).reduce((n, l) => n + l.length, 0);
            const ready = Object.values(subjects).flat().filter((r) => r.indexed && !r.stale).length;
            const isOpen = open[cls] ?? false;
            return (
              <Collapsible key={cls} open={isOpen} onOpenChange={() => toggle(cls)} asChild>
                <Card className="overflow-hidden rounded-xl border-surface-200 bg-white shadow-none dark:border-surface-800 dark:bg-surface-900">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size={null}
                      className="h-auto w-full justify-start gap-2 whitespace-normal rounded-none px-3 py-3 text-left font-normal hover:bg-surface-50 sm:px-4 dark:hover:bg-surface-800/60"
                    >
                      {isOpen ? <ChevronDown className="size-4 shrink-0 text-surface-400" /> : <ChevronRight className="size-4 shrink-0 text-surface-400" />}
                      <span className="min-w-0 truncate font-bold text-surface-900 dark:text-white">{cls}</span>
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-surface-500">
                        {ready}/{total} ready
                      </span>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-surface-100 dark:border-surface-800">
                      {Object.entries(subjects).map(([subject, list]) => (
                        <div key={subject} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                          <div className="flex items-center gap-1.5 bg-surface-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-surface-500 sm:px-4 dark:bg-surface-800/50">
                            <BookOpen className="size-3 shrink-0" /> <span className="truncate">{subject}</span>
                          </div>
                          {list.map((r) => {
                            const st = stateOf(r);
                            const m = STATE_META[st];
                            // This is the one book the active run is reading right now — matched by
                            // materialId (the backend's own heartbeat), not local click state, so a
                            // bulk run (which sets busy='bulk', never a specific chapterId) still
                            // shows live progress on the right row instead of nowhere.
                            // Backend heartbeat (works for a bulk run we didn't personally click into)
                            // OR our own optimistic flag (works even if the job finishes faster than
                            // any poll can catch it "running" — see activeChapterId's comment above).
                            const isIndexingNow =
                              (run?.status === 'running' && !!r.materialId && r.materialId === run.currentMaterialId) ||
                              activeChapterId === r.chapterId;
                            const disableActions = busy === r.chapterId || isIndexingNow;
                            const canIndex = (st === 'pending' || st === 'ready' || st === 'stale') && !isIndexingNow;
                            const stats = r.indexed ? (
                              <span className="text-[11px] tabular-nums text-surface-400">
                                {r.pages}p · {r.passages} passages{r.method === 'ocr' ? ' · scanned' : ''}
                                {/* Figures are what a generated paper can illustrate a
                                    question with. Shown because "Ready" alone cannot tell
                                    a chapter whose book has no diagrams from one indexed
                                    before figures were extracted at all — both look
                                    identical, and both produce a paper with no images. */}
                                {typeof r.figures === 'number' && (
                                  <>
                                    {' · '}
                                    <span className={r.figures > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                      {r.figures} figures
                                    </span>
                                  </>
                                )}
                              </span>
                            ) : null;
                            return (
                              <div key={r.chapterId} className="border-b border-surface-50 last:border-0 dark:border-surface-800/60">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 text-sm hover:bg-surface-50 sm:px-4 dark:hover:bg-surface-800/40">
                                  {isIndexingNow ? (
                                    <Loader2 className="size-4 shrink-0 animate-spin text-brand-500" />
                                  ) : (
                                    <m.Icon className={`size-4 shrink-0 ${st === 'ready' ? 'text-emerald-500' : st === 'stale' ? 'text-orange-500' : st === 'pending' ? 'text-amber-500' : st === 'broken' ? 'text-rose-500' : 'text-surface-400'}`} />
                                  )}
                                  <span className="min-w-0 flex-1 basis-40">
                                    <span className="block truncate text-surface-800 dark:text-surface-100">{r.chapterName}</span>
                                    {r.fileName ? (
                                      r.fileUrl ? (
                                        <a
                                          href={r.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-surface-500 underline-offset-2 hover:text-brand-600 hover:underline"
                                          title={r.fileName}
                                        >
                                          <FileText className="size-3 shrink-0" />
                                          <span className="truncate">{r.fileName}</span>
                                        </a>
                                      ) : (
                                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-surface-500">
                                          <FileText className="size-3 shrink-0" /> <span className="truncate">{r.fileName}</span>
                                        </span>
                                      )
                                    ) : null}
                                    {/* Phones: stats sit under the name instead of squeezing the row */}
                                    {stats && <span className="mt-0.5 block sm:hidden">{stats}</span>}
                                  </span>
                                  {stats && <span className="hidden sm:inline">{stats}</span>}
                                  <Badge
                                    variant="outline"
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isIndexingNow ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300' : m.cls}`}
                                  >
                                    {isIndexingNow ? 'Reading…' : m.label}
                                  </Badge>
                                  {/* A chapter already marked Ready used to offer nothing but
                                      Replace, so refreshing one meant re-uploading its PDF.
                                      Indexing improves over time — figure extraction is the
                                      current example — and every chapter indexed before an
                                      improvement stays stale until it is read again. */}
                                  {canIndex && (
                                    <Button
                                      size="sm"
                                      variant={st === 'ready' ? 'outline' : 'default'}
                                      onClick={() => indexOne(r)}
                                      disabled={disableActions || !r.materialId}
                                      title={
                                        st === 'stale'
                                          ? 'A newer file was uploaded since this was last read — index it to fix what the AI generates'
                                          : st === 'ready'
                                          ? 'Read this book again — picks up figures and any other indexing improvements'
                                          : 'Read this book and index it'
                                      }
                                      className={`h-7 rounded-lg px-2 text-[11px] font-bold ${
                                        st === 'ready'
                                          ? 'border-surface-200 text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300'
                                          : st === 'stale'
                                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                                          : 'bg-brand-600 text-white hover:bg-brand-700'
                                      }`}
                                    >
                                      {busy === r.chapterId
                                        ? 'Reading…'
                                        : st === 'ready' || st === 'stale' ? 'Re-index' : 'Index'}
                                    </Button>
                                  )}
                                  <Button
                                    asChild
                                    size="sm"
                                    variant={st === 'ready' || st === 'pending' || st === 'stale' ? 'outline' : 'default'}
                                    className={`h-7 cursor-pointer rounded-lg px-2 text-[11px] font-bold ${
                                      st === 'ready' || st === 'pending' || st === 'stale'
                                        ? 'border-surface-200 text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300'
                                        : 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
                                    } ${disableActions ? 'pointer-events-none opacity-50' : ''}`}
                                  >
                                    <label title={st === 'ready' || st === 'stale' ? 'Replace this book and read it again' : 'Upload this chapter as a PDF'}>
                                      {busy === r.chapterId ? 'Reading…' : st === 'ready' || st === 'pending' || st === 'stale' ? 'Replace' : 'Upload'}
                                      <input
                                        type="file"
                                        accept="application/pdf,.pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          e.target.value = '';
                                          if (f) uploadOne(r, f);
                                        }}
                                      />
                                    </label>
                                  </Button>
                                </div>

                                {/* Pagewise tracker — lives on the book actually being read, not in a
                                    banner elsewhere on the page. Only appears once the slow scanned-page
                                    OCR pass has published a page count; a chapter with a normal text
                                    layer is read in one fast pass and never reaches this. */}
                                {isIndexingNow && !!run?.currentPagesTotal && (
                                  <div className="flex items-center gap-2 px-3 pb-2 pl-9 sm:px-4 sm:pl-11">
                                    <Progress
                                      value={Math.min(100, ((run.currentPagesDone ?? 0) / run.currentPagesTotal) * 100)}
                                      className="h-1 flex-1 bg-brand-100 dark:bg-brand-900"
                                      indicatorClassName="bg-brand-500"
                                    />
                                    <span className="shrink-0 text-[11px] tabular-nums text-brand-600 dark:text-brand-400">
                                      page {run.currentPagesDone ?? 0} of {run.currentPagesTotal}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TextbookCoverage;
