import React, { useEffect, useState } from 'react';
import api from '@/lib/api/school-client';
import { FileText, Calendar, Clock, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get('/assignments');
        setAssignments(response.data || []);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Assignments</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Track and submit your homework tasks.</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No assignments</h3>
          <p className="mt-1 text-sm text-slate-500">You're all caught up! No pending assignments.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((assignment) => {
            const isLate = new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed';
            
            return (
              <div key={assignment.id} className="flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className={cn(
                  "h-2 w-full",
                  assignment.status === 'completed' ? "bg-emerald-500" :
                  isLate ? "bg-rose-500" : "bg-blue-500"
                )} />
                
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={cn(
                      "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                      assignment.status === 'completed' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      isLate ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
                      "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {assignment.status === 'completed' ? 'Submitted' : isLate ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  
                  <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                    {assignment.title}
                  </h3>
                  
                  <div className="mb-6 space-y-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    {assignment.status === 'completed' ? (
                      <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800/50">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        Submitted
                      </div>
                    ) : (
                      <button className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-colors",
                        isLate ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                      )}>
                        <UploadCloud size={16} />
                        Submit Work
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
