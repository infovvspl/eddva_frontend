// Admin: lesson plans teachers have submitted, to approve or send back.
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, ClipboardCheck, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LessonPlanStatusBadge } from '@/components/school/lesson-plans/LessonPlanView';
import { apiError, lessonPlans } from '@/lib/api/school-lesson-plans';

const TABS = [
  ['PENDING_APPROVAL', 'Waiting for approval'],
  ['APPROVED', 'Approved'],
  ['CHANGES_REQUESTED', 'Sent back'],
  ['', 'All'],
];

export default function LessonPlanApprovals() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'PENDING_APPROVAL';
  const [state, setState] = useState({ loading: true, plans: [], pending: 0 });

  // A notification links here with ?plan=<id>.
  useEffect(() => {
    const id = params.get('plan');
    if (id) navigate(`/school/admin/lesson-plan-approvals/${id}`, { replace: true });
  }, [params, navigate]);

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    lessonPlans.reviewList(status ? { status } : {})
      .then((d) => setState({ loading: false, plans: d?.plans || [], pending: d?.pending || 0 }))
      .catch((err) => { setState({ loading: false, plans: [], pending: 0 }); toast.error(apiError(err, 'Could not load lesson plans')); });
  }, [status]);

  return (
    <div className="w-full space-y-5 font-poppins">
      <div>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-5 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Lesson Plan Approvals</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Teachers create a lesson plan per chapter and send it here. Approve it, or send it back with what to change.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([value, label]) => (
          <button key={label} type="button" onClick={() => setParams(value ? { status: value } : { status: '' })}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${status === value
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
            {label}{value === 'PENDING_APPROVAL' && state.pending ? ` (${state.pending})` : ''}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
        {state.loading ? (
          <p className="flex items-center gap-2 p-5 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> Loading…</p>
        ) : !state.plans.length ? (
          <p className="p-5 text-sm text-slate-500">{status === 'PENDING_APPROVAL' ? 'Nothing is waiting for approval.' : 'No lesson plans here.'}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.plans.map((p) => (
              <button key={p.id} type="button" onClick={() => navigate(`/school/admin/lesson-plan-approvals/${p.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{p.chapterName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.className} · {p.subjectName}{p.sectionNames ? ` · Sec ${p.sectionNames}` : ''} · {p.teacherName || 'Teacher'}
                    {' · '}{p.totalPeriods} periods{p.version > 1 ? ` · version ${p.version}` : ''}
                  </p>
                </div>
                <span className="hidden text-xs text-slate-400 sm:block">
                  {p.submittedAt ? `Submitted ${new Date(p.submittedAt).toLocaleDateString()}` : ''}
                </span>
                <LessonPlanStatusBadge status={p.status} />
                <ChevronRight className="size-4 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
