// Teacher: on the approved plan, record how each period went in each section
// (Taught / Partly / Skipped, with the date and a short note). Every change is
// saved straight away; the Syllabus Planner moves forward from this record.
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Loader2, MessageSquare, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TeachingProgressSummary } from '@/components/school/lesson-plans/LessonPlanView';
import { apiError, lessonPlans, PROGRESS_META, PROGRESS_STATUSES } from '@/lib/api/school-lesson-plans';

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function TeachingRecord({ plan, onChange }) {
  const sections = plan.sections?.length ? plan.sections : [];
  const [sectionId, setSectionId] = useState(sections[0]?.id || '');
  const [busyKey, setBusyKey] = useState('');
  const [openNote, setOpenNote] = useState(null);
  const [noteText, setNoteText] = useState('');

  const periods = useMemo(() => (plan.periods || []).map((p) => ({
    no: p.periodNo,
    title: plan.content?.periods?.[p.periodNo - 1]?.topic || p.title || `Period ${p.periodNo}`,
  })), [plan.periods, plan.content]);
  const recordOf = (no) => (plan.progress || []).find((r) => r.periodNo === no && r.sectionId === sectionId);

  const save = async (no, body) => {
    const key = `${sectionId}:${no}`;
    setBusyKey(key);
    try {
      const updated = await lessonPlans.recordProgress(plan.id, { periodNo: no, sectionId, ...body });
      onChange(updated);
    } catch (err) {
      toast.error(apiError(err, 'Could not save that'));
    } finally {
      setBusyKey('');
    }
  };

  const setStatus = (no, status) => {
    const current = recordOf(no);
    if (current?.status === status) return save(no, { status: 'NOT_STARTED' });
    return save(no, { status, taughtOn: status === 'SKIPPED' ? undefined : current?.taughtOn || undefined, note: current?.note || undefined });
  };

  if (!sections.length || !periods.length) return null;
  const sectionName = sections.find((s) => s.id === sectionId)?.name;

  return (
    <Card className="space-y-4 rounded-2xl border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">Teaching record</h2>
          <p className="text-xs text-slate-500">Mark each period as you teach it. Saved straight away; the Syllabus Planner updates from it.</p>
        </div>
        {sections.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Section">
            {sections.map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={s.id === sectionId} onClick={() => { setSectionId(s.id); setOpenNote(null); }}
                className={`rounded-full border px-3 py-1 text-xs font-bold transition ${s.id === sectionId ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'}`}>
                Sec {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <TeachingProgressSummary summary={(plan.progressSummary || []).filter((s) => sections.length < 2 || s.sectionId === sectionId)} />

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
        {periods.map(({ no, title }) => {
          const rec = recordOf(no);
          const busy = busyKey === `${sectionId}:${no}`;
          const noteOpen = openNote === no;
          return (
            <li key={no} className="space-y-2 px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">{no}</span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100" title={title}>{title}</p>
                {busy && <Loader2 className="size-4 animate-spin text-blue-500" aria-label="Saving" />}
                <div className="flex gap-1" role="group" aria-label={`Period ${no}${sectionName ? `, section ${sectionName}` : ''}`}>
                  {PROGRESS_STATUSES.map((st) => {
                    const active = rec?.status === st;
                    return (
                      <button key={st} type="button" disabled={busy} aria-pressed={active} onClick={() => setStatus(no, st)}
                        title={active ? 'Click again to clear' : undefined}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition disabled:opacity-50 ${active ? PROGRESS_META[st].className : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'}`}>
                        {PROGRESS_META[st].label}
                      </button>
                    );
                  })}
                </div>
                {rec && rec.status !== 'SKIPPED' && (
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <CalendarDays className="size-3.5" />
                    <span className="sr-only">Date taught</span>
                    <Input type="date" className="h-7 w-[8.5rem] px-2 text-xs" value={rec.taughtOn || ''} max={localToday()} disabled={busy}
                      onChange={(e) => e.target.value && save(no, { status: rec.status, taughtOn: e.target.value, note: rec.note || undefined })} />
                  </label>
                )}
                {rec && (
                  <button type="button" onClick={() => { setOpenNote(noteOpen ? null : no); setNoteText(rec.note || ''); }}
                    className={`rounded-lg p-1.5 ${rec.note ? 'text-blue-600' : 'text-slate-400'} hover:bg-slate-100 dark:hover:bg-slate-800`} aria-label={rec.note ? 'Edit note' : 'Add a note'}>
                    <MessageSquare className="size-4" />
                  </button>
                )}
              </div>
              {rec?.note && !noteOpen && <p className="pl-9 text-xs text-slate-500">{rec.note}</p>}
              {noteOpen && rec && (
                <div className="flex items-center gap-2 pl-9">
                  <Input autoFocus maxLength={1000} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="e.g. ran over; finish the example next period" className="h-8 text-xs"
                    onKeyDown={(e) => { if (e.key === 'Enter') { save(no, { status: rec.status, taughtOn: rec.taughtOn || undefined, note: noteText }); setOpenNote(null); } if (e.key === 'Escape') setOpenNote(null); }} />
                  <button type="button" className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50" disabled={busy}
                    onClick={() => { save(no, { status: rec.status, taughtOn: rec.taughtOn || undefined, note: noteText }); setOpenNote(null); }}>Save</button>
                  <button type="button" className="rounded-lg p-1 text-slate-400 hover:text-slate-600" onClick={() => setOpenNote(null)} aria-label="Cancel"><X className="size-4" /></button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
