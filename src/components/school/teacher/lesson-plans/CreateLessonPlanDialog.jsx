// Teacher: the "Create a lesson plan" dialog, shared by the My Lesson Plan page
// (general button, and each chapter's own Create button with the chapter preset).
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Plus, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiError, lessonPlans, UPLOAD_MAX_MB } from '@/lib/api/school-lesson-plans';

export const keyOf = (a) => `${a.classId}:${a.subjectId}`;

/**
 * Create a chapter lesson plan: generate with AI (one or more chapters), upload a
 * PDF, or start blank. `preset` opens it ready for one chapter: { assignmentKey,
 * chapterIds, periods, mode }.
 */
export default function CreateLessonPlanDialog({ open, onClose, assignments, onCreated, schoolMinutes, preset }) {
  const navigate = useNavigate();
  const pendingSelect = useRef(null);
  const [assignmentKey, setAssignmentKey] = useState('');
  const [mode, setMode] = useState('ai'); // ai | upload | manual
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [selected, setSelected] = useState([]);
  const [periods, setPeriods] = useState('');
  const [minutes, setMinutes] = useState('');
  const [busy, setBusy] = useState(false);

  const assignment = assignments.find((a) => keyOf(a) === assignmentKey);

  useEffect(() => {
    if (!open) return;
    pendingSelect.current = preset?.chapterIds || null;
    setAssignmentKey(preset?.assignmentKey || (assignments.length === 1 ? keyOf(assignments[0]) : ''));
    setMode(preset?.mode || 'ai'); setSelected(preset?.chapterIds || []); setPeriods(preset?.periods ? String(preset.periods) : '');
    setMinutes(''); setFile(null); setFileError('');
  }, [open, assignments]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!assignment) { setChapters([]); return; }
    setLoadingChapters(true);
    setSelected(pendingSelect.current || []);
    lessonPlans.chapters(assignment.classId, assignment.subjectId)
      .then((list) => { setChapters(list); if (pendingSelect.current) { setSelected(pendingSelect.current); pendingSelect.current = null; } })
      .catch((err) => toast.error(apiError(err, 'Could not load the chapters')))
      .finally(() => setLoadingChapters(false));
  }, [assignmentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const single = mode !== 'ai';
  const toggle = (id) => setSelected((s) => (single ? [id] : s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const pickFile = (f) => {
    setFile(null);
    if (!f) { setFileError(''); return; }
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
      setFileError(/\.docx?$/i.test(f.name) ? 'Word files are not supported yet. Save the plan as PDF and upload that.' : 'Choose a PDF file.');
      return;
    }
    if (f.size > UPLOAD_MAX_MB * 1024 * 1024) { setFileError(`The file is larger than ${UPLOAD_MAX_MB} MB.`); return; }
    setFileError('');
    setFile(f);
  };
  const periodsValue = periods ? Math.max(1, Math.min(20, Number(periods))) : undefined;
  const minutesValue = minutes ? Math.max(20, Math.min(120, Number(minutes))) : undefined;

  const create = async () => {
    if (!assignment || !selected.length) return;
    setBusy(true);
    try {
      if (mode === 'upload') {
        const plan = await lessonPlans.importUpload({ classId: assignment.classId, subjectId: assignment.subjectId, chapterId: selected[0], minutesPerPeriod: minutesValue }, file);
        toast.success('Uploaded. Reading your plan now; this takes about a minute.');
        if (plan.upload?.truncated) toast.info('Your file is long: only the first 24,000 characters are read. Check the later periods against your file.');
        onClose();
        navigate(`/school/teacher/chapter-lesson-plans/${plan.id}`);
        return;
      }
      if (mode === 'manual') {
        const plan = await lessonPlans.createManual({ classId: assignment.classId, subjectId: assignment.subjectId, chapterId: selected[0], periods: periodsValue, minutesPerPeriod: minutesValue });
        onClose();
        navigate(`/school/teacher/chapter-lesson-plans/${plan.id}`);
        return;
      }
      const all = selected.length === chapters.length;
      const res = await lessonPlans.generate({
        classId: assignment.classId, subjectId: assignment.subjectId, periods: periodsValue, minutesPerPeriod: minutesValue,
        ...(all ? { allChapters: true } : { chapterIds: selected }),
      });
      const q = res.queued?.length || 0;
      const s = res.skipped?.length || 0;
      toast.success(q ? `Generating ${q} lesson plan${q > 1 ? 's' : ''}. This takes about a minute each.` : 'Nothing new to generate');
      if (s) toast.info(`${s} chapter${s > 1 ? 's' : ''} already ha${s > 1 ? 've' : 's'} a plan in progress and ${s > 1 ? 'were' : 'was'} skipped.`);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(apiError(err, 'Could not create the lesson plan'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create a lesson plan</DialogTitle>
          <DialogDescription>One plan per chapter, period by period. You review it, then send it to the admin for approval.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Class and subject</Label>
            <Select value={assignmentKey} onValueChange={setAssignmentKey}>
              <SelectTrigger><SelectValue placeholder="Choose a class and subject you teach" /></SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={keyOf(a)} value={keyOf(a)}>
                    {a.className} · {a.subjectName}{a.sectionNames ? ` (Sec ${a.sectionNames})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[['ai', 'Generate with AI', 'From the school textbook'], ['upload', 'Upload a plan', 'A PDF you already have'], ['manual', 'Blank plan', 'Write it yourself']].map(([m, title, sub]) => (
              <button key={m} type="button" onClick={() => { setMode(m); setSelected([]); }}
                className={`rounded-xl border p-3 text-left transition ${mode === m ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </button>
            ))}
          </div>

          {assignment && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{single ? 'Chapter' : 'Chapters'}</Label>
                {mode === 'ai' && chapters.length > 0 && (
                  <button type="button" className="text-xs font-bold text-blue-600 hover:underline"
                    onClick={() => setSelected(selected.length === chapters.length ? [] : chapters.map((c) => c.id))}>
                    {selected.length === chapters.length ? 'Clear' : 'Select all chapters'}
                  </button>
                )}
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                {loadingChapters && <p className="flex items-center gap-2 p-2 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin" /> Loading chapters…</p>}
                {!loadingChapters && !chapters.length && <p className="p-2 text-xs text-slate-500">This subject has no chapters yet.</p>}
                {chapters.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input type={single ? 'radio' : 'checkbox'} name="chapter" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                    <span className="text-slate-800 dark:text-slate-200">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="space-y-1.5">
              <Label htmlFor="lesson-plan-file">Your lesson plan (PDF, up to {UPLOAD_MAX_MB} MB)</Label>
              <Input id="lesson-plan-file" type="file" accept="application/pdf,.pdf" onChange={(e) => pickFile(e.target.files?.[0])} />
              {fileError ? <p className="text-xs font-semibold text-rose-600">{fileError}</p>
                : <p className="text-xs text-slate-500">AI reads it into the lesson plan form and keeps your periods and activities. The original file stays attached. Scanned (image-only) PDFs can't be read.</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {mode !== 'upload' && (
              <div className="space-y-1.5">
                <Label>Periods per chapter</Label>
                <Input type="number" min={1} max={20} placeholder="Lesson Planner's, or 6"
                  value={periods} onChange={(e) => setPeriods(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Minutes per period</Label>
              <Input type="number" min={20} max={120} placeholder={schoolMinutes ? `School timetable: ${schoolMinutes}` : '40'}
                value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={create} disabled={busy || !assignment || !selected.length || (mode === 'upload' && !file)}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : mode === 'ai' ? <Sparkles className="size-4" /> : mode === 'upload' ? <Upload className="size-4" /> : <Plus className="size-4" />}
            {mode === 'ai' ? `Generate${selected.length > 1 ? ` ${selected.length} plans` : ''}` : mode === 'upload' ? 'Upload and read' : 'Create blank plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
