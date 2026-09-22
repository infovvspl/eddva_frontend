/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Diagram manager — the teacher's workflow for figures on a question paper.
 *
 * Four things this screen has to keep straight, because getting any of them
 * wrong is worse than not having the feature:
 *
 *   PREVIEW IS NOT SAVING, AND SAVING IS NOT APPROVING. Each is a separate,
 *   explicit action, and the screen says so rather than leaving a teacher to
 *   infer it from a green tick.
 *
 *   ONLY APPROVED DIAGRAMS REACH STUDENTS. That is the backend's rule; this
 *   screen states it plainly next to the approval control, so a teacher is
 *   never surprised by a blank space on a printed paper.
 *
 *   A FAILED SAVE IS NOT A SAVE. Every write refreshes its state from the
 *   server's response, never from what the client hoped would happen.
 *
 *   THE SERVER IS AUTHORITATIVE. Nothing here validates a specification,
 *   checks geometry, or draws anything. A client-side check would drift and
 *   start telling teachers things that are not true.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Check, CircleSlash, Copy, Eye, Loader2, Plus, RefreshCw, Save, Shapes, X,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/school/Button';
import {
  diagramApi, svgToImageSrc, toDiagramError,
  type DiagramCapabilities, type DiagramError, type DiagramPreview, type DiagramRecord,
} from './diagram-api';
import DiagramSpecForm, { isGuidedKind, starterSpec } from './DiagramSpecForm';

interface Props {
  assessmentId: string;
  /** Inserts the marker into the paper at the teacher's chosen position. */
  onInsertMarker: (marker: string) => void;
  onClose: () => void;
}

type Mode = { type: 'list' } | { type: 'new'; kind: string } | { type: 'edit'; record: DiagramRecord };

const STAGE_LABEL: Record<string, string> = {
  structural: 'The description is incomplete or malformed',
  geometric: 'The geometry does not hold',
  render: 'The diagram could not be drawn',
  storage: 'The diagram could not be saved',
};

export default function DiagramManager({ assessmentId, onInsertMarker, onClose }: Props) {
  const [capabilities, setCapabilities] = useState<DiagramCapabilities | null>(null);
  const [records, setRecords] = useState<DiagramRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ type: 'list' });

  const [spec, setSpec] = useState<any>(null);
  const [jsonDraft, setJsonDraft] = useState<string>('');
  const [showJson, setShowJson] = useState(false);
  const [preview, setPreview] = useState<DiagramPreview | null>(null);
  const [problem, setProblem] = useState<DiagramError | null>(null);
  const [busy, setBusy] = useState<'preview' | 'save' | 'approval' | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);

  const reload = useCallback(async () => {
    try {
      const [caps, list] = await Promise.all([
        diagramApi.capabilities(assessmentId),
        diagramApi.list(assessmentId),
      ]);
      setCapabilities(caps);
      setRecords(list);
      setLoadError(null);
    } catch (err: any) {
      const e = toDiagramError(err);
      setLoadError(e.rejected ? e.errors.join(' ') : e.message);
      setRecords([]);
    }
  }, [assessmentId]);

  useEffect(() => { reload(); }, [reload]);

  // Moving between list and editor is a context change, so focus follows it.
  useEffect(() => { headingRef.current?.focus(); }, [mode.type]);

  /** Preview is deliberately explicit — no request fires while typing. */
  const runPreview = useCallback(async (candidate?: any) => {
    const target = candidate ?? spec;
    if (!target) return;
    setBusy('preview');
    setProblem(null);
    try {
      const result = await diagramApi.preview(assessmentId, target);
      setPreview(result);
    } catch (err: any) {
      setPreview(null);
      setProblem(toDiagramError(err));
    } finally {
      setBusy(null);
    }
  }, [assessmentId, spec]);

  const openNew = (kind: string) => {
    const starter = starterSpec(kind, capabilities);
    setSpec(starter);
    setJsonDraft(JSON.stringify(starter, null, 2));
    setShowJson(!isGuidedKind(kind));
    setPreview(null);
    setProblem(null);
    setMode({ type: 'new', kind });
  };

  const openEdit = (record: DiagramRecord) => {
    setSpec(record.spec);
    setJsonDraft(JSON.stringify(record.spec, null, 2));
    setShowJson(!isGuidedKind(String((record.spec as any)?.kind || record.kind)));
    setPreview(null);
    setProblem(null);
    setMode({ type: 'edit', record });
  };

  const backToList = () => {
    setMode({ type: 'list' });
    setSpec(null);
    setPreview(null);
    setProblem(null);
  };

  const updateSpec = (next: any) => {
    setSpec(next);
    setJsonDraft(JSON.stringify(next, null, 2));
    // The preview belongs to the previous specification; keeping it on screen
    // would show a teacher a picture that is no longer what they are editing.
    setPreview(null);
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      setSpec(parsed);
      setPreview(null);
      setProblem(null);
    } catch (err: any) {
      setProblem({ rejected: false, message: `That is not valid JSON: ${err?.message || 'parse error'}` });
    }
  };

  const save = async () => {
    if (!spec) return;
    setBusy('save');
    setProblem(null);
    try {
      const result = mode.type === 'edit'
        ? await diagramApi.update(assessmentId, mode.record.markerKey, spec)
        : await diagramApi.create(assessmentId, spec);
      // State comes from the server's answer, never from what we sent.
      await reload();
      if (result.approvalCleared) {
        toast.warning('Saved. The diagram changed, so its approval was withdrawn — approve it again to show it on the paper.');
      } else {
        toast.success(mode.type === 'edit' ? 'Diagram updated.' : 'Diagram saved. Insert its marker to place it on the paper.');
      }
      const fresh = await diagramApi.list(assessmentId);
      setRecords(fresh);
      const saved = fresh.find((r) => r.markerKey === result.markerKey);
      if (saved) openEdit(saved); else backToList();
    } catch (err: any) {
      // No success toast, no list change: a failed save is not a save.
      setProblem(toDiagramError(err));
    } finally {
      setBusy(null);
    }
  };

  const setApproval = async (record: DiagramRecord, approved: boolean) => {
    setBusy('approval');
    try {
      await diagramApi.setApproval(assessmentId, record.markerKey, approved);
      const fresh = await diagramApi.list(assessmentId);
      setRecords(fresh);
      if (mode.type === 'edit' && mode.record.markerKey === record.markerKey) {
        const updated = fresh.find((r) => r.markerKey === record.markerKey);
        if (updated) setMode({ type: 'edit', record: updated });
      }
      if (!approved) {
        toast.success('Approval withdrawn.');
      } else if (record.warnings.length) {
        // Approving is allowed — the points listed are things the checker
        // cannot judge, not errors — but the teacher is told what they just
        // took responsibility for rather than only having seen it beforehand.
        toast.success(
          `Diagram approved — it will appear on the paper. ${record.warnings.length} point(s) could not be verified; you have accepted them.`,
        );
      } else {
        toast.success('Diagram approved — it will appear on the paper.');
      }
    } catch (err: any) {
      const e = toDiagramError(err);
      toast.error(e.rejected ? e.errors.join(' ') : e.message);
    } finally {
      setBusy(null);
    }
  };

  const insert = (record: DiagramRecord) => {
    onInsertMarker(record.marker);
    toast.success(`Marker ${record.markerKey} inserted into the question paper.`);
  };

  const kinds = capabilities?.kinds ?? [];
  const editing = mode.type === 'edit' ? mode.record : null;

  const problemBanner = useMemo(() => {
    if (!problem) return null;
    if (!problem.rejected) {
      return (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm font-bold text-rose-800">Something went wrong</p>
          <p className="mt-1 text-sm text-rose-700">{problem.message}</p>
        </div>
      );
    }
    return (
      <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3">
        <p className="text-sm font-bold text-rose-800">
          {STAGE_LABEL[problem.stage] || 'The diagram was rejected'}
        </p>
        <ul className="mt-2 space-y-1">
          {problem.errors.map((message, i) => {
            const [path, ...rest] = message.split(': ');
            const detail = rest.join(': ');
            return (
              <li key={i} className="text-sm text-rose-700">
                {detail ? (
                  <>
                    <code className="rounded bg-rose-100 px-1 py-0.5 text-[11px] font-bold">{path}</code>{' '}
                    {detail}
                  </>
                ) : message}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }, [problem]);

  const storedWarnings = mode.type === 'edit' ? mode.record.warnings : [];
  const warnings = preview?.warnings?.length ? preview.warnings
    : (problem && problem.rejected ? problem.warnings
      // Nothing rendered yet in this session: fall back to what was recorded
      // when the diagram was made, so opening an old one does not look clean.
      : storedWarnings);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 ref={headingRef} tabIndex={-1} className="text-base font-extrabold text-gray-900 outline-none">
            {mode.type === 'list' ? 'Diagrams on this paper'
              : mode.type === 'edit' ? `Edit diagram ${mode.record.markerKey}`
                : 'New diagram'}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Only <strong>approved</strong> diagrams appear on the question paper. Previewing
            neither saves nor approves anything.
          </p>
        </div>
        {mode.type !== 'list' ? (
          <Button type="button" size="sm" variant="outline" onClick={backToList}>Back to list</Button>
        ) : null}
      </div>

      {loadError ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm text-rose-700">{loadError}</p>
          <Button type="button" size="sm" variant="outline" icon={<RefreshCw size={13} />} onClick={reload}>
            Retry
          </Button>
        </div>
      ) : null}

      {/* ── List ────────────────────────────────────────────────────────── */}
      {mode.type === 'list' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-600">Add a diagram:</span>
            {kinds.length === 0 && !loadError ? (
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" /> Loading diagram types…
              </span>
            ) : null}
            {kinds.map((kind) => (
              <Button
                key={kind} type="button" size="sm" variant="outline" icon={<Plus size={13} />}
                onClick={() => openNew(kind)}
              >
                {kind.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>

          {records === null ? (
            <p className="flex items-center gap-2 py-8 text-sm text-gray-400">
              <Loader2 size={15} className="animate-spin" /> Loading diagrams…
            </p>
          ) : records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
              No diagrams on this paper yet. Choose a type above to create one.
            </p>
          ) : (
            <ul className="space-y-3">
              {records.map((record) => (
                <li key={record.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row">
                  <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white">
                    {record.url ? (
                      <img src={record.url} alt={record.altText || `${record.kind} diagram`}
                        className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[11px] text-gray-400">not rendered</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold">{record.markerKey}</code>
                      <span className="text-xs text-gray-500">{record.kind.replace(/_/g, ' ')}</span>
                      {record.approved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          <Check size={11} /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          <AlertTriangle size={11} /> Not approved
                        </span>
                      )}
                      {record.detached ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
                          <CircleSlash size={11} /> Not on the paper
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-700">{record.altText}</p>
                    {record.detached ? (
                      <p className="mt-1 text-[11px] text-gray-500">
                        Its marker is not in the paper. Insert it again to put it back — nothing was deleted.
                      </p>
                    ) : null}
                    {record.warnings.length ? (
                      /* Recorded when the diagram was rendered, shown here
                         because approval is what puts it in front of students
                         and may happen long after it was drawn. */
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
                          Not verified — check before approving
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4">
                          {record.warnings.map((w, i) => (
                            <li key={i} className="text-[11px] text-amber-800">{w}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" icon={<Copy size={13} />}
                        onClick={() => insert(record)}>
                        Insert marker
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => openEdit(record)}>
                        Edit
                      </Button>
                      {record.approved ? (
                        <Button type="button" size="sm" variant="outline" loading={busy === 'approval'}
                          onClick={() => setApproval(record, false)}>
                          Withdraw approval
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="primary" icon={<Check size={13} />}
                          loading={busy === 'approval'} disabled={!record.url}
                          onClick={() => setApproval(record, true)}>
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        /* ── Editor ──────────────────────────────────────────────────────── */
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <DiagramSpecForm spec={spec} onChange={updateSpec} capabilities={capabilities} />

            <details open={showJson} className="rounded-lg border border-gray-200">
              <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                Advanced: edit as JSON
              </summary>
              <div className="space-y-2 p-3">
                <textarea
                  value={jsonDraft} onChange={(e) => setJsonDraft(e.target.value)}
                  aria-label="Diagram specification JSON"
                  spellCheck={false}
                  className="h-52 w-full rounded-lg border border-gray-300 p-2 font-mono text-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={applyJson}>
                  Apply JSON to the form
                </Button>
                <p className="text-[11px] text-gray-400">
                  Checked by the same server validation either way.
                </p>
              </div>
            </details>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" icon={<Eye size={13} />}
                loading={busy === 'preview'} onClick={() => runPreview()}>
                Preview
              </Button>
              <Button type="button" size="sm" variant="primary" icon={<Save size={13} />}
                loading={busy === 'save'} onClick={save}>
                {mode.type === 'edit' ? 'Save changes' : 'Save diagram'}
              </Button>
              {editing ? (
                <Button type="button" size="sm" variant="outline" icon={<Copy size={13} />}
                  onClick={() => insert(editing)}>
                  Insert marker
                </Button>
              ) : null}
            </div>

            {editing ? (
              <p className="text-xs text-gray-500">
                {editing.approved
                  ? 'This diagram is approved and will appear on the paper. Changing it withdraws approval.'
                  : 'This diagram is not approved, so it will not appear on the paper yet.'}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Saving does not approve. You will be able to approve it from the list.
              </p>
            )}

            {problemBanner}

            {warnings.length ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-bold text-amber-800">Checked as far as possible</p>
                <ul className="mt-1 space-y-1">
                  {warnings.map((w, i) => <li key={i} className="text-xs text-amber-800">{w}</li>)}
                </ul>
              </div>
            ) : null}

            <div className="flex min-h-[16rem] items-center justify-center rounded-xl border border-gray-200 bg-white p-3">
              {busy === 'preview' ? (
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={15} className="animate-spin" /> Drawing…
                </span>
              ) : preview ? (
                /* Served as an image, never inserted into the document. */
                <img
                  src={svgToImageSrc(preview.svg)}
                  alt={spec?.title ? `Preview: ${spec.title}` : 'Diagram preview'}
                  className="max-h-[22rem] max-w-full object-contain"
                />
              ) : (
                <p className="px-6 text-center text-sm text-gray-400">
                  Choose <strong>Preview</strong> to draw this diagram. Previewing does not
                  save it or attach it to a question.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-gray-100 pt-3">
        <Button type="button" size="sm" variant="outline" icon={<X size={13} />} onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export { Shapes as DiagramManagerIcon };
