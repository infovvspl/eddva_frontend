import React, { useState } from 'react';
import { MobileListLayout, MobileFormLayout } from '@/components/shared/mobile/MobileLayouts';
import { Calendar, FileText, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';

export default function TeacherAssignmentsMobile({
  assignments,
  loading,
  onViewSubmissions,
  onOpenCreateModal,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Assignments</h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Create & Review Homework</p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="inline-flex h-9 items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-md active:scale-95 transition-transform"
        >
          <Sparkles size={13} />
          Create
        </button>
      </div>

      <MobileListLayout
        title="Active Assignments"
        subtitle=""
        loading={loading}
        items={assignments}
        renderItem={(assignment) => (
          <div
            key={assignment.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {assignment.className} - {assignment.sectionName}
                </span>
                <h3 className="text-xs font-black text-slate-800 dark:text-white mt-2 leading-tight">
                  {assignment.title}
                </h3>
                <p className="text-[9px] font-bold text-slate-450 mt-1 uppercase tracking-wider">
                  Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/80 pt-3 text-[10px] font-bold text-slate-400">
              <span>Submissions: <strong className="text-slate-700 dark:text-white">{assignment.submissionCount ?? 0}</strong></span>
              <button
                onClick={() => onViewSubmissions(assignment)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 active:scale-95"
              >
                Review Submissions
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
