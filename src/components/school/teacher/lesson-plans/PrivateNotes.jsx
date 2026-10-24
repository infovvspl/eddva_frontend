// Teacher: private notes on their own lesson plan (the admin never sees them).
// A new version of the plan takes the notes along.
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiError, lessonPlans } from '@/lib/api/school-lesson-plans';

export default function PrivateNotes({ planId, notes }) {
  const [saved, setSaved] = useState(notes || { note: '', updatedAt: null });
  const [text, setText] = useState(notes?.note || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSaved(notes || { note: '', updatedAt: null }); setText(notes?.note || ''); }, [planId]); // eslint-disable-line react-hooks/exhaustive-deps

  const changed = text !== (saved.note || '');
  const save = async () => {
    setBusy(true);
    try {
      const res = await lessonPlans.saveNotes(planId, text);
      setSaved(res);
      toast.success('Notes saved');
    } catch (err) {
      toast.error(apiError(err, 'Could not save your notes'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 rounded-2xl border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-base font-black text-slate-900 dark:text-white"><Lock className="size-4 text-slate-400" /> My notes</h2>
          <p className="text-xs text-slate-500">Private: only you can see these. They carry over to a new version of this plan.</p>
        </div>
        <Button size="sm" onClick={save} disabled={busy || !changed} className="gap-1.5">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save notes
        </Button>
      </div>
      <Textarea rows={4} maxLength={20000} value={text} onChange={(e) => setText(e.target.value)} aria-label="My private notes"
        placeholder="Reminders for next time: what worked, what to change, which groups need more help…" />
      <p className="text-xs text-slate-400">
        {changed ? 'Unsaved changes' : saved.updatedAt ? `Saved ${new Date(saved.updatedAt).toLocaleString()}` : 'No notes yet'}
      </p>
    </Card>
  );
}
