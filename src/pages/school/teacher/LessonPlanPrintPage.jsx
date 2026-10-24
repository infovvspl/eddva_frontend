// Print-friendly lesson plan (teacher or admin). Opens the browser's print
// dialog once loaded; "Save as PDF" there gives the PDF export.
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LessonPlanView, { LessonPlanStatusBadge } from '@/components/school/lesson-plans/LessonPlanView';
import { apiError, lessonPlans } from '@/lib/api/school-lesson-plans';

export default function LessonPlanPrintPage({ admin = false }) {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (admin ? lessonPlans.reviewGet(planId) : lessonPlans.get(planId))
      .then((p) => { setPlan(p); setTimeout(() => window.print(), 400); })
      .catch((err) => setError(apiError(err, 'Could not load the lesson plan')));
  }, [planId, admin]);

  if (error) return <p className="p-6 text-sm text-rose-600">{error}</p>;
  if (!plan) return <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading…</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 bg-white p-6 text-slate-900 print:max-w-none print:p-0">
      <style>{'@media print { @page { margin: 14mm; } .no-print { display: none !important; } }'}</style>
      <div className="no-print flex justify-end"><Button onClick={() => window.print()} className="gap-1.5"><Printer className="size-4" /> Print / Save as PDF</Button></div>
      <header className="space-y-1 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-black">{plan.title || `${plan.chapterName} — Lesson Plan`}</h1>
          <LessonPlanStatusBadge status={plan.status} />
        </div>
        <p className="text-sm text-slate-600">
          {plan.className} · {plan.subjectName} · Chapter: {plan.chapterName}
          {plan.sectionNames ? ` · Sec ${plan.sectionNames}` : ''}
          {plan.totalPeriods ? ` · ${plan.totalPeriods} periods` : ''}{plan.periodMinutes ? ` × ${plan.periodMinutes} min` : ''}
        </p>
        <p className="text-xs text-slate-500">
          Teacher: {plan.teacherName || '—'}{plan.version > 1 ? ` · Version ${plan.version}` : ''}
          {plan.reviewedAt && plan.status === 'APPROVED' ? ` · Approved ${new Date(plan.reviewedAt).toLocaleDateString()}` : ''}
          {plan.grounded ? ' · Based on the school textbook' : ' · Not checked against a textbook'}
        </p>
      </header>
      <LessonPlanView plan={plan} />
    </div>
  );
}
