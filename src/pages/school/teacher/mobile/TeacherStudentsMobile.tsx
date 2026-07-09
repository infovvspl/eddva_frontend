import React from 'react';
import { MobileListLayout } from '@/components/shared/mobile/MobileLayouts';
import { User, Phone, Mail } from 'lucide-react';

export default function TeacherStudentsMobile({
  students,
  loading,
  searchQuery,
  setSearchQuery,
  selectedClass,
  setSelectedClass,
  selectedSection,
  setSelectedSection,
  statusFilter,
  setStatusFilter,
  filteredStudents,
  classList,
  sectionList,
}) {
  return (
    <MobileListLayout
      title="Students"
      subtitle="Class Rosters & Contact Info"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search student name..."
      loading={loading}
      items={filteredStudents}
      renderItem={(student) => (
        <div
          key={student.id}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 flex items-center justify-center font-extrabold shrink-0">
              {(student.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-850 dark:text-white leading-tight">
                {student.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                Class: {student.className || 'N/A'} {student.sectionName || ''} · Roll: {student.rollNumber || 'N/A'}
              </p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-50 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 space-y-1">
            {student.phone && <p className="flex items-center gap-1.5"><Phone size={11} /> {student.phone}</p>}
            {student.email && <p className="flex items-center gap-1.5"><Mail size={11} /> {student.email}</p>}
          </div>
        </div>
      )}
    />
  );
}
