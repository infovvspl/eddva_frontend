import React from 'react';
import { MobileListLayout } from '@/components/shared/mobile/MobileLayouts';
import { BookOpen, Layers, Presentation, Brain, Sparkles } from 'lucide-react';

export default function TeacherTopicsMobile({
  assignments,
  loading,
  selectedClass,
  setSelectedClass,
  selectedSection,
  setSelectedSection,
  selectedSubject,
  setSelectedSubject,
  chaptersAndTopics,
  onOpenCreate,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Curriculum</h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Chapters, Topics & AI Materials</p>
        </div>
        {onOpenCreate && (
          <button
            onClick={onOpenCreate}
            className="inline-flex h-9 items-center gap-1 rounded-xl bg-blue-600 px-3 text-xs font-black text-white shadow-md active:scale-95 transition-transform"
          >
            <Sparkles size={13} />
            Add Topic
          </button>
        )}
      </div>

      <MobileListLayout
        title="My Assigned Classes"
        subtitle=""
        loading={loading}
        items={assignments}
        renderItem={(item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {item.className} - {item.sectionName}
                </span>
                <h3 className="text-xs font-black text-slate-850 dark:text-white mt-2 leading-tight">
                  {item.subjectName}
                </h3>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/80 pt-3 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><BookOpen size={11} /> {item.isClassTeacher ? 'Class Teacher' : 'Subject Teacher'}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
