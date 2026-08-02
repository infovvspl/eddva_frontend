/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, Search, RefreshCw, Link2Off,
  CheckCircle2, CircleDashed, AlertTriangle, Loader2, PlayCircle, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';

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
  hasPdf: boolean;
  linkReachable: boolean | null;
  materialId: string | null;
  pages: number | null;
  passages: number | null;
  method: string | null;
  quality: string | null;
  fileName: string | null;
  fileUrl: string | null;
  uploadedAt: string | null;
};

type RunStatus = {
  status: string; total: number; done: number;
  succeeded: number; failed: number; lastChapter: string | null;
} | null;

/** The four states a chapter can be in, in the order a school works through them. */
type State = 'ready' | 'pending' | 'broken' | 'missing';

const stateOf = (r: Row): State => {
  if (r.indexed) return 'ready';
  if (r.hasPdf && r.linkReachable === false) return 'broken';
  if (r.hasPdf) return 'pending';
  return 'missing';
};

const STATE_META: Record<State, { label: string; hint: string; cls: string; Icon: any }> = {
  ready:   { label: 'Ready',        hint: 'AI writes from this book',        cls: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900', Icon: CheckCircle2 },
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
      if (s && s.status !== 'running' && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        load();
        toast.success(`Indexing finished — ${s.succeeded} chapters ready, ${s.failed} failed.`);
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
    const c = { ready: 0, pending: 0, broken: 0, missing: 0 };
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
      if (d?.indexed) toast.success(`"${r.chapterName}" is ready — ${d.chunks} passages from ${d.pages} pages.`);
      // The server distinguishes an unreadable scan from a chapter too long to
      // transcribe in one pass, and the two need different action from the user,
      // so its message is shown rather than a fixed one.
      else toast.warning(`"${r.chapterName}": ${d?.message ?? 'no readable text found. It may be a poor scan.'}`);
      load();
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
      if (d?.indexed) {
        toast.success(`"${r.chapterName}" is ready — ${d.chunks} passages from ${d.pages} pages.`);
      } else {
        // See indexOne: "too long to transcribe" and "unreadable scan" call for
        // different fixes, so the server's wording is used.
        toast.warning(
          `"${r.chapterName}": uploaded, but ${d?.message ?? 'no readable text was found. It may be a poor scan.'}`,
        );
      }
      load();
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

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-2 text-surface-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading coverage…
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['ready', 'pending', 'broken', 'missing'] as State[]).map((k) => {
          const m = STATE_META[k];
          const active = filter === k;
          return (
            <button
              key={k}
              onClick={() => setFilter(active ? 'all' : k)}
              aria-pressed={active}
              className={`rounded-xl border p-3 text-left transition ${m.cls} ${
                active ? 'ring-2 ring-offset-1 ring-current' : 'hover:brightness-95'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <m.Icon className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="mt-1 text-2xl font-black tabular-nums">{counts[k]}</p>
              <p className="text-[11px] opacity-80">{m.hint}</p>
            </button>
          );
        })}
      </div>

      {run && run.status === 'running' && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-900 dark:bg-brand-950/40">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Indexing {run.done} of {run.total}
            </span>
            <span className="text-xs text-brand-600 dark:text-brand-400">
              {run.lastChapter ? `Last: ${run.lastChapter}` : 'Starting…'}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${run.total ? (run.done / run.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapter, subject or class"
            className="w-full rounded-xl border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 dark:border-surface-700 dark:bg-surface-900"
          />
        </div>
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')} className="rounded-xl border border-surface-200 px-3 py-2 text-xs font-bold text-surface-600 dark:border-surface-700 dark:text-surface-300">
            Clear filter
          </button>
        )}
        {isAdmin && (
          <>
            <button
              onClick={auditLinks}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-2 text-xs font-bold text-surface-700 disabled:opacity-50 dark:border-surface-700 dark:text-surface-200"
            >
              {busy === 'audit' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Check files
            </button>
            <button
              onClick={indexAll}
              disabled={!!busy || run?.status === 'running' || counts.pending === 0}
              title={counts.pending === 0 ? 'Nothing waiting to be indexed' : undefined}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy === 'bulk' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
              Index {counts.pending} waiting
            </button>
          </>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface-300 p-8 text-center text-sm text-surface-500 dark:border-surface-700">
          No chapters match.
        </p>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([cls, subjects]) => {
            const total = Object.values(subjects).reduce((n, l) => n + l.length, 0);
            const ready = Object.values(subjects).flat().filter((r) => r.indexed).length;
            const isOpen = open[cls] ?? false;
            return (
              <div key={cls} className="overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
                <button
                  onClick={() => toggle(cls)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800/60"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 text-surface-400" /> : <ChevronRight className="h-4 w-4 text-surface-400" />}
                  <span className="font-bold text-surface-900 dark:text-white">{cls}</span>
                  <span className="ml-auto text-xs tabular-nums text-surface-500">
                    {ready}/{total} ready
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-surface-100 dark:border-surface-800">
                    {Object.entries(subjects).map(([subject, list]) => (
                      <div key={subject} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                        <div className="flex items-center gap-1.5 bg-surface-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-surface-500 dark:bg-surface-800/50">
                          <BookOpen className="h-3 w-3" /> {subject}
                        </div>
                        {list.map((r) => {
                          const st = stateOf(r);
                          const m = STATE_META[st];
                          return (
                            <div key={r.chapterId} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-800/40">
                              <m.Icon className={`h-4 w-4 shrink-0 ${st === 'ready' ? 'text-emerald-500' : st === 'pending' ? 'text-amber-500' : st === 'broken' ? 'text-rose-500' : 'text-surface-400'}`} />
                              <span className="flex-1 min-w-0">
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
                                      <FileText className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{r.fileName}</span>
                                    </a>
                                  ) : (
                                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-surface-500">
                                      <FileText className="h-3 w-3" /> {r.fileName}
                                    </span>
                                  )
                                ) : null}
                              </span>
                              {r.indexed && (
                                <span className="hidden text-[11px] tabular-nums text-surface-400 sm:inline">
                                  {r.pages}p · {r.passages} passages{r.method === 'ocr' ? ' · scanned' : ''}
                                </span>
                              )}
                              <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${m.cls}`}>
                                {m.label}
                              </span>
                              {st === 'pending' && (
                                <button
                                  onClick={() => indexOne(r)}
                                  disabled={busy === r.chapterId}
                                  className="rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                                >
                                  {busy === r.chapterId ? 'Reading…' : 'Index'}
                                </button>
                              )}
                              <label
                                className={`cursor-pointer rounded-lg border px-2 py-1 text-[11px] font-bold ${
                                  st === 'ready' || st === 'pending'
                                    ? 'border-surface-200 text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300'
                                    : 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
                                } ${busy === r.chapterId ? 'pointer-events-none opacity-50' : ''}`}
                                title={st === 'ready' ? 'Replace this book and read it again' : 'Upload this chapter as a PDF'}
                              >
                                {busy === r.chapterId ? 'Reading…' : st === 'ready' || st === 'pending' ? 'Replace' : 'Upload'}
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
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TextbookCoverage;
