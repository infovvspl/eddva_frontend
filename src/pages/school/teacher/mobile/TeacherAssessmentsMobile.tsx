import React from 'react';
import { MobileListLayout } from '@/components/shared/mobile/MobileLayouts';
import { Sparkles, Calendar, ClipboardList } from 'lucide-react';

export default function TeacherAssessmentsMobile({
  assessments,
  loading,
  onOpenCreate,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Assessments</h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Manage Quizzes & Exams</p>
        </div>
        <button
          onClick={onOpenCreate}
          className="inline-flex h-9 items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-md active:scale-95 transition-transform"
        >
          <Sparkles size={13} />
          Create
        </button>
      </div>

      <MobileListLayout
        title="Scheduled Tests"
        subtitle=""
        loading={loading}
        items={assessments}
        renderItem={(item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-lg bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {item.className} - {item.sectionName}
                </span>
                <h3 className="text-xs font-black text-slate-850 dark:text-white mt-2 leading-tight">
                  {item.title}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 mt-1">
                  Subject: {item.subjectName} · Marks: {item.totalMarks}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/80 pt-3 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><Calendar size={11} /> {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
