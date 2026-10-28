// Admin: review one submitted lesson plan — approve it, or send it back with a comment.
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Loader2, Printer, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import LessonPlanView, { LessonPlanSourceLine, LessonPlanStatusBadge, QualityPanel, TeachingProgressSummary } from '@/components/school/lesson-plans/LessonPlanView';
import { apiError, lessonPlans } from '@/lib/api/school-lesson-plans';

export default function LessonPlanReview() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState('');
  const [sendingBack, setSendingBack] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setPlan(null);
    lessonPlans.reviewGet(planId)
      .then(setPlan)
      .catch((err) => { toast.error(apiError(err, 'Could not load the lesson plan')); navigate('/school/admin/lesson-plan-approvals'); });
  }, [planId, navigate]);

  const approve = async () => {
    setBusy('approve');
    try {
      setPlan(await lessonPlans.approve(planId));
      toast.success('Approved. The teacher has been notified.');
    } catch (err) {
      toast.error(apiError(err, 'Could not approve it'));
    } finally {
      setBusy('');
    }
  };

  const sendBack = async () => {
    if (!comment.trim()) return;
    setBusy('back');
    try {
      setPlan(await lessonPlans.sendBack(planId, comment.trim()));
      setSendingBack(false);
      setComment('');
      toast.success('Sent back to the teacher.');
    } catch (err) {
      toast.error(apiError(err, 'Could not send it back'));
    } finally {
      setBusy('');
    }
  };

  if (!plan) return <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading…</div>;
  const pending = plan.status === 'PENDING_APPROVAL';
  const history = (plan.history || []).filter((h) => h.id !== plan.id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 font-poppins">
      <button type="button" onClick={() => navigate('/school/admin/lesson-plan-approvals')} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft className="size-3.5" /> Lesson Plan Approvals
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{plan.chapterName}</h1>
            <LessonPlanStatusBadge status={plan.status} />
            {plan.version > 1 && <span className="text-xs font-semibold text-slate-500">Version {plan.version}</span>}
          </div>
          <p className="text-sm text-slate-500">
            {plan.className} · {plan.subjectName}{plan.sectionNames ? ` · Sec ${plan.sectionNames}` : ''} · by {plan.teacherName || 'the teacher'}
            {plan.submittedAt ? ` · submitted ${new Date(plan.submittedAt).toLocaleString()}` : ''}
          </p>
          <LessonPlanSourceLine plan={plan} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/school/print/lesson-plans/review/${planId}`, '_blank')} className="gap-1.5"><Printer className="size-4" /> Print / PDF</Button>
        {pending && (
          <>
            <Button variant="outline" onClick={() => setSendingBack(true)} disabled={!!busy} className="gap-1.5"><Undo2 className="size-4" /> Send back</Button>
            <Button onClick={approve} disabled={!!busy} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              {busy === 'approve' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Approve
            </Button>
          </>
        )}
        </div>
      </div>

      {plan.status === 'CHANGES_REQUESTED' && plan.reviewComment && (
        <Card className="rounded-2xl border-orange-200 bg-orange-50 p-4 text-sm text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
          <p className="font-bold">Sent back to the teacher</p><p>{plan.reviewComment}</p>
        </Card>
      )}

      {plan.status === 'APPROVED' && plan.progressSummary?.length > 0 && (
        <Card className="space-y-3 rounded-2xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Teaching record</p>
          <TeachingProgressSummary summary={plan.progressSummary} />
        </Card>
      )}
      {plan.schemaVersion >= 2 && <QualityPanel issues={plan.qualityWarnings} />}
      {plan.title && <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">{plan.title}</h2>}
      <LessonPlanView plan={plan} />

      {history.length > 0 && (
        <Card className="space-y-2 rounded-2xl border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Other versions</h3>
          {history.map((h) => (
            <button key={h.id} type="button" onClick={() => navigate(`/school/admin/lesson-plan-approvals/${h.id}`)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Version {h.version}</span>
              <LessonPlanStatusBadge status={h.status} />
              {h.reviewComment && <span className="truncate text-xs text-slate-500">"{h.reviewComment}"</span>}
            </button>
          ))}
        </Card>
      )}

      <Dialog open={sendingBack} onOpenChange={(o) => { if (!o) setSendingBack(false); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send back to {plan.teacherName || 'the teacher'}</DialogTitle>
            <DialogDescription>Say what should change. The teacher sees this and can edit and resubmit.</DialogDescription>
          </DialogHeader>
          <Textarea rows={4} maxLength={2000} autoFocus value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Add a lab activity in period 3 and a recap quiz at the end." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendingBack(false)} disabled={busy === 'back'}>Cancel</Button>
            <Button onClick={sendBack} disabled={busy === 'back' || !comment.trim()}>
              {busy === 'back' ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />} Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
