// Teacher: one chapter lesson plan. Editable while a draft or sent back;
// read-only once submitted or approved (an approved plan is revised as a new
// version). Saves carry the revision on screen, so a stale tab can't overwrite a
// newer save; unsaved work is kept locally and offered back after a reload.
// On the approved plan the teacher records each period taught; private notes
// are available on any version that is not being generated or replaced.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Clock, CopyPlus, Loader2, Plus, Printer, RefreshCw, Save, Send, Sparkles, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LessonPlanView, { LessonPlanSourceLine, LessonPlanStatusBadge, QualityPanel } from '@/components/school/lesson-plans/LessonPlanView';
import LessonPlanEditor from '@/components/school/teacher/lesson-plans/LessonPlanEditor';
import TeachingRecord from '@/components/school/teacher/lesson-plans/TeachingRecord';
import PrivateNotes from '@/components/school/teacher/lesson-plans/PrivateNotes';
import { apiError, isConflict, lessonPlans, PERIOD_FIELD_LABELS, PLAN_FIELD_LABELS } from '@/lib/api/school-lesson-plans';

const EDITABLE = ['DRAFT', 'CHANGES_REQUESTED'];
const PART_LABELS = {
  period: 'period', objectives: 'learning objectives', outcomes: 'expected outcomes', prerequisites: 'prior knowledge',
  keyConcepts: 'key concepts', resources: 'resources', misconceptions: 'misconceptions', differentiation: 'differentiation',
};
const draftKey = (id) => `lesson-plan-draft:${id}`;
const readDraft = (id) => { try { return JSON.parse(localStorage.getItem(draftKey(id)) || 'null'); } catch { return null; } };
const writeDraft = (id, value) => { try { localStorage.setItem(draftKey(id), JSON.stringify(value)); } catch { /* storage full or blocked */ } };
const clearDraft = (id) => { try { localStorage.removeItem(draftKey(id)); } catch { /* ignore */ } };

/** v1 (text) plans: the original field editor. */
function toV1Form(plan) {
  const form = { title: plan.title || '' };
  PLAN_FIELD_LABELS.forEach(([k]) => { form[k] = plan[k] || ''; });
  form.periods = (plan.periods || []).map((p) => ({ title: p.title || '', objectives: p.objectives || '', activities: p.activities || '', resources: p.resources || '', assessment: p.assessment || '', homework: p.homework || '' }));
  return form;
}

function V1Editor({ form, setForm }) {
  const setField = (k, v) => setForm({ ...form, [k]: v });
  const setPeriod = (i, k, v) => setForm({ ...form, periods: form.periods.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });
  const movePeriod = (i, d) => { const ps = [...form.periods]; const j = i + d; if (j < 0 || j >= ps.length) return; [ps[i], ps[j]] = [ps[j], ps[i]]; setForm({ ...form, periods: ps }); };
  return (
    <div className="space-y-5">
      <Card className="space-y-4 rounded-2xl border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} maxLength={300} onChange={(e) => setField('title', e.target.value)} /></div>
        <div className="grid gap-4 md:grid-cols-2">
          {PLAN_FIELD_LABELS.map(([k, label]) => (
            <div key={k} className="space-y-1.5"><Label>{label}</Label><Textarea rows={4} value={form[k]} onChange={(e) => setField(k, e.target.value)} /></div>
          ))}
        </div>
      </Card>
      {form.periods.map((p, i) => (
        <Card key={i} className="space-y-3 rounded-2xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{i + 1}</span>
            <Input value={p.title} maxLength={300} onChange={(e) => setPeriod(i, 'title', e.target.value)} className="font-semibold" />
            <Button variant="ghost" size="icon" onClick={() => movePeriod(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => movePeriod(i, 1)} disabled={i === form.periods.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setForm({ ...form, periods: form.periods.filter((_, j) => j !== i) })} disabled={form.periods.length <= 1} aria-label="Remove period" className="text-rose-600"><Trash2 className="size-4" /></Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {PERIOD_FIELD_LABELS.map(([k, label]) => (
              <div key={k} className={`space-y-1.5 ${k === 'activities' ? 'md:col-span-2' : ''}`}><Label className="text-xs">{label}</Label><Textarea rows={k === 'activities' ? 5 : 3} value={p[k]} onChange={(e) => setPeriod(i, k, e.target.value)} /></div>
            ))}
          </div>
        </Card>
      ))}
      <Button variant="outline" size="sm" className="gap-1.5" disabled={form.periods.length >= 20}
        onClick={() => setForm({ ...form, periods: [...form.periods, { title: `Period ${form.periods.length + 1}`, objectives: '', activities: '', resources: '', assessment: '', homework: '' }] })}>
        <Plus className="size-4" /> Add period
      </Button>
    </div>
  );
}

export default function ChapterLessonPlanPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState(null); // v2: content object; v1: text form
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [conflict, setConflict] = useState(false);
  const [recoverable, setRecoverable] = useState(null);
  const [rewrite, setRewrite] = useState(null); // { part, periodNumber }
  const [instruction, setInstruction] = useState('');
  const loadedRevision = useRef(null);

  const isV2 = plan?.schemaVersion >= 2 && !!plan?.content;
  const editable = plan && EDITABLE.includes(plan.status);

  const apply = useCallback((p, { keepDraft = false } = {}) => {
    setPlan(p);
    setForm(p.schemaVersion >= 2 && p.content ? JSON.parse(JSON.stringify(p.content)) : toV1Form(p));
    setDirty(false);
    setConflict(false);
    loadedRevision.current = p.revision;
    if (!keepDraft) clearDraft(p.id);
  }, []);

  const load = useCallback(() => lessonPlans.get(planId)
    .then((p) => {
      apply(p, { keepDraft: true });
      const d = readDraft(p.id);
      if (d && EDITABLE.includes(p.status) && JSON.stringify(d.form) !== JSON.stringify(p.schemaVersion >= 2 && p.content ? p.content : toV1Form(p))) {
        setRecoverable(d);
      } else {
        clearDraft(p.id);
      }
    })
    .catch((err) => { toast.error(apiError(err, 'Could not load the lesson plan')); navigate('/school/teacher/teaching-plan'); }),
  [planId, navigate, apply]);

  useEffect(() => { load(); }, [load]);

  // Refresh while generating.
  useEffect(() => {
    if (plan?.status !== 'GENERATING') return undefined;
    const t = setInterval(() => lessonPlans.get(planId).then((p) => { if (p.status !== 'GENERATING') apply(p); }).catch(() => undefined), 5000);
    return () => clearInterval(t);
  }, [plan?.status, planId, apply]);

  // Keep unsaved work locally, and warn before leaving with it.
  useEffect(() => {
    if (!dirty || !plan) return undefined;
    const t = setTimeout(() => writeDraft(plan.id, { revision: loadedRevision.current, form, savedAt: Date.now() }), 600);
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => { clearTimeout(t); window.removeEventListener('beforeunload', warn); };
  }, [dirty, form, plan]);

  const change = (next) => { setForm(next); setDirty(true); };

  const run = async (name, fn, success) => {
    setBusy(name);
    try {
      const p = await fn();
      if (p && p.id) apply(p);
      if (success) toast.success(success);
      return p;
    } catch (err) {
      if (isConflict(err)) { setConflict(true); toast.error(apiError(err, 'This plan was changed elsewhere')); }
      else toast.error(apiError(err, 'Something went wrong'));
      return null;
    } finally {
      setBusy('');
    }
  };

  const saveBody = () => (isV2 ? { revision: plan.revision, content: form } : { revision: plan.revision, ...form });
  const save = () => run('save', () => lessonPlans.update(planId, saveBody()), 'Saved — checks updated');
  const submit = () => run('submit', async () => {
    let rev = plan.revision;
    if (dirty) rev = (await lessonPlans.update(planId, saveBody())).revision;
    return lessonPlans.submit(planId, rev);
  }, 'Sent to the admin for approval');

  const doRewrite = async () => {
    if (!rewrite) return;
    const { part, periodNumber } = rewrite;
    await run('rewrite', async () => {
      // Save first so the rewrite merges into what is on screen, not an older copy.
      let rev = plan.revision;
      if (dirty) rev = (await lessonPlans.update(planId, saveBody())).revision;
      return lessonPlans.regenerate(planId, { revision: rev, part, periodNumber, instruction: instruction.trim() || undefined });
    }, `Rewrote the ${part === 'period' ? `period ${periodNumber}` : PART_LABELS[part]}; everything else is unchanged`);
    setRewrite(null);
    setInstruction('');
  };

  const discard = async () => {
    if (!window.confirm('Discard this lesson plan? This cannot be undone.')) return;
    setBusy('discard');
    try { await lessonPlans.discard(planId); clearDraft(planId); toast.success('Discarded'); navigate('/school/teacher/teaching-plan'); }
    catch (err) { toast.error(apiError(err, 'Could not discard it')); setBusy(''); }
  };
  const newVersion = async () => {
    const p = await run('version', () => lessonPlans.newVersion(planId), 'New version started — the approved plan stays in use until this one is approved');
    if (p?.id) navigate(`/school/teacher/chapter-lesson-plans/${p.id}`, { replace: true });
  };

  if (!plan || !form) {
    return <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading…</div>;
  }
  const minutes = plan.periodMinutes || 40;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 font-poppins">
      <button type="button" onClick={() => navigate('/school/teacher/teaching-plan')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="size-3.5" /> My Lesson Plan
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{plan.chapterName}</h1>
            <LessonPlanStatusBadge status={plan.status} />
            {plan.version > 1 && <span className="text-xs font-semibold text-slate-500">Version {plan.version}</span>}
            {dirty && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
          </div>
          <p className="text-sm text-slate-500">{plan.className} · {plan.subjectName}{plan.sectionNames ? ` · Sec ${plan.sectionNames}` : ''}</p>
          {plan.status !== 'GENERATING' && <LessonPlanSourceLine plan={plan} />}
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.status !== 'GENERATING' && plan.status !== 'FAILED' && (
            <Button variant="outline" onClick={() => window.open(`/school/print/lesson-plans/${planId}`, '_blank')} className="gap-1.5"><Printer className="size-4" /> Print / PDF</Button>
          )}
          {editable && (
            <>
              <Button variant="outline" onClick={discard} disabled={!!busy} className="gap-1.5 text-rose-600"><Trash2 className="size-4" /> Discard</Button>
              <Button variant="outline" onClick={save} disabled={!!busy || !dirty || conflict} className="gap-1.5">
                {busy === 'save' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
              </Button>
              <Button onClick={submit} disabled={!!busy || conflict} className="gap-1.5">
                {busy === 'submit' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Submit for approval
              </Button>
            </>
          )}
          {plan.status === 'FAILED' && (
            <>
              <Button variant="outline" onClick={discard} disabled={!!busy} className="gap-1.5 text-rose-600"><Trash2 className="size-4" /> Discard</Button>
              <Button onClick={() => run('retry', () => lessonPlans.retry(planId), 'Generating again')} disabled={!!busy} className="gap-1.5"><RefreshCw className="size-4" /> Try again</Button>
            </>
          )}
          {plan.status === 'APPROVED' && (
            <Button variant="outline" onClick={newVersion} disabled={!!busy} className="gap-1.5"><CopyPlus className="size-4" /> Start a new version</Button>
          )}
        </div>
      </div>

      {conflict && (
        <Card className="flex flex-wrap items-center gap-3 rounded-2xl border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="size-4" /> This plan was changed elsewhere (another tab or device). Your changes are kept on this device.
          <Button size="sm" variant="outline" onClick={load} className="ml-auto">Load the latest version</Button>
        </Card>
      )}
      {recoverable && (
        <Card className="flex flex-wrap items-center gap-3 rounded-2xl border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Clock className="size-4" /> You have unsaved changes from {new Date(recoverable.savedAt).toLocaleString()}.
          {recoverable.revision !== plan.revision ? ' The plan has been saved since then, so restoring will replace the newer version when you save.' : ''}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { clearDraft(plan.id); setRecoverable(null); }}>Discard them</Button>
            <Button size="sm" onClick={() => { setForm(recoverable.form); setDirty(true); setRecoverable(null); }}>Restore</Button>
          </div>
        </Card>
      )}

      {plan.status === 'GENERATING' && (
        <Card className="flex items-center gap-3 rounded-2xl border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Loader2 className="size-4 animate-spin" />
          {plan.source === 'UPLOAD'
            ? 'Reading your uploaded plan into the lesson plan form. This usually takes under a minute; this page updates by itself.'
            : "Writing the plan from the chapter's textbook and checking it. This usually takes under a minute; this page updates by itself."}
        </Card>
      )}
      {plan.status === 'FAILED' && (
        <Card className="flex items-start gap-3 rounded-2xl border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-bold">{plan.source === 'UPLOAD' ? 'Your file could not be read into a lesson plan.' : 'The plan could not be generated.'}</p>
            <p className="whitespace-pre-line">{plan.error || ''}</p>
            <p className="mt-1">{plan.source === 'UPLOAD' ? 'Try again, or discard it and upload another file, generate with AI, or start a blank plan.' : 'Try again, or discard it and start a blank plan.'}</p>
          </div>
        </Card>
      )}
      {plan.status === 'CHANGES_REQUESTED' && plan.reviewComment && (
        <Card className="flex items-start gap-3 rounded-2xl border-orange-200 bg-orange-50 p-4 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /><div><p className="font-bold">The admin asked for changes</p><p>{plan.reviewComment}</p></div>
        </Card>
      )}
      {plan.status === 'PENDING_APPROVAL' && (
        <Card className="flex items-center gap-3 rounded-2xl border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <Clock className="size-4" /> Waiting for the admin's approval. It cannot be changed until it is approved or sent back.
        </Card>
      )}
      {plan.status === 'APPROVED' && (
        <Card className="flex items-center gap-3 rounded-2xl border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-4" /> Approved{plan.reviewedAt ? ` on ${new Date(plan.reviewedAt).toLocaleDateString()}` : ''}. This is the plan to teach from.
        </Card>
      )}

      {plan.status === 'APPROVED' && <TeachingRecord plan={plan} onChange={setPlan} />}

      {isV2 && plan.status !== 'GENERATING' && plan.status !== 'FAILED' && (
        <div className="space-y-1">
          <QualityPanel issues={plan.qualityWarnings} />
          {dirty && <p className="text-xs text-slate-500">Checks reflect the last save. Save to re-check your changes.</p>}
        </div>
      )}

      {editable ? (
        isV2
          ? <LessonPlanEditor content={form} minutes={minutes} onChange={change} busy={!!busy || conflict}
              onRewrite={(part, periodNumber) => { setInstruction(''); setRewrite({ part, periodNumber }); }} />
          : <V1Editor form={form} setForm={change} />
      ) : plan.status !== 'GENERATING' && plan.status !== 'FAILED' ? (
        <LessonPlanView plan={plan} />
      ) : null}

      {!['GENERATING', 'ARCHIVED'].includes(plan.status) && <PrivateNotes planId={plan.id} notes={plan.notes} />}

      <Dialog open={!!rewrite} onOpenChange={(o) => { if (!o && busy !== 'rewrite') setRewrite(null); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rewrite the {rewrite?.part === 'period' ? `period ${rewrite?.periodNumber}` : PART_LABELS[rewrite?.part]} with AI</DialogTitle>
            <DialogDescription>Only this part changes; the rest of the plan stays as it is. {dirty ? 'Your unsaved changes are saved first.' : ''}</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} maxLength={500} value={instruction} onChange={(e) => setInstruction(e.target.value)}
            placeholder="Optional: what should change? e.g. add a group activity, simpler examples, more practice" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewrite(null)} disabled={busy === 'rewrite'}>Cancel</Button>
            <Button onClick={doRewrite} disabled={busy === 'rewrite'} className="gap-1.5">
              {busy === 'rewrite' ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Rewrite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
