import React, { useEffect, useState } from 'react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { FileText, Calendar, CheckCircle2, AlertCircle, UploadCloud, MessageSquare, History, Sparkles } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [activeStatus, setActiveStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get('/assignments');
        setAssignments(unwrapSchoolList(response));
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const assignmentView = (Array.isArray(assignments) ? assignments : []).map((assignment) => {
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const isLate = dueDate && dueDate < new Date() && assignment.status !== 'completed';
    const evaluated = assignment.status === 'evaluated' || assignment.feedback || assignment.marksObtained !== undefined;
    const submitted = assignment.status === 'completed' || assignment.status === 'submitted';
    const bucket = isLate ? 'overdue' : evaluated ? 'evaluated' : submitted ? 'submitted' : 'pending';
    const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    return { ...assignment, isLate, bucket, daysLeft };
  });

  const counts = {
    all: assignmentView.length,
    pending: assignmentView.filter((item) => item.bucket === 'pending').length,
    submitted: assignmentView.filter((item) => item.bucket === 'submitted').length,
    evaluated: assignmentView.filter((item) => item.bucket === 'evaluated').length,
    overdue: assignmentView.filter((item) => item.bucket === 'overdue').length,
  };

  const filteredAssignments = activeStatus === 'all'
    ? assignmentView
    : assignmentView.filter((assignment) => assignment.bucket === activeStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Assignments</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Pending, submitted, evaluated, and overdue homework with reminders and feedback.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <AlertCircle className="h-6 w-6 text-amber-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Pending</p>
          <p className="text-3xl font-black text-slate-950 dark:text-white">{counts.pending}</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <UploadCloud className="h-6 w-6 text-blue-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">Submitted</p>
          <p className="text-3xl font-black text-slate-950 dark:text-white">{counts.submitted}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Evaluated</p>
          <p className="text-3xl font-black text-slate-950 dark:text-white">{counts.evaluated}</p>
        </div>
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
          <Calendar className="h-6 w-6 text-rose-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300">Overdue</p>
          <p className="text-3xl font-black text-slate-950 dark:text-white">{counts.overdue}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ['all', 'All'],
          ['pending', 'Pending'],
          ['submitted', 'Submitted'],
          ['evaluated', 'Evaluated'],
          ['overdue', 'Overdue'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveStatus(id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition',
              activeStatus === id
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
            )}
          >
            {label} ({counts[id]})
          </button>
        ))}
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No assignments</h3>
          <p className="mt-1 text-sm text-slate-500">No assignments match this status.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssignments.map((assignment) => {
            return (
              <div key={assignment.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className={cn(
                  "h-2 w-full",
                  assignment.bucket === 'evaluated' || assignment.bucket === 'submitted' ? "bg-emerald-500" :
                  assignment.bucket === 'overdue' ? "bg-rose-500" : "bg-blue-500"
                )} />
                
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={cn(
                      "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                      assignment.bucket === 'evaluated' || assignment.bucket === 'submitted' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      assignment.bucket === 'overdue' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
                      "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {assignment.bucket}
                    </span>
                    {assignment.daysLeft !== null && assignment.bucket === 'pending' && (
                      <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {assignment.daysLeft <= 0 ? 'Due today' : `${assignment.daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                    {assignment.title}
                  </h3>
                  
                  <div className="mb-6 space-y-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <History size={14} className="text-slate-400" />
                      <span>{assignment.submissionHistory?.length || 0} submission records</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-slate-400" />
                      <span>{assignment.feedback || 'Teacher feedback pending'}</span>
                    </div>
                    {assignment.marksObtained !== undefined && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>Marks: {assignment.marksObtained}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <div className="flex items-start gap-2">
                      <Sparkles size={16} className="mt-0.5 shrink-0 text-violet-600" />
                      <p className="text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                        AI guidance can help outline the approach before you upload files and attachments.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    {assignment.bucket === 'submitted' || assignment.bucket === 'evaluated' ? (
                      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800/50">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        {assignment.bucket === 'evaluated' ? 'Evaluated' : 'Submitted'}
                      </div>
                    ) : (
                      <button className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors",
                        assignment.bucket === 'overdue' ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                      )}>
                        <UploadCloud size={16} />
                        Upload Attachments
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
