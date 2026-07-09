import React from 'react';
import { MobileListLayout, MobileFormLayout } from '@/components/shared/mobile/MobileLayouts';
import { Calendar, UserCheck, UserX, Clock, ClipboardList, CheckCircle2, RotateCcw } from 'lucide-react';
import SelectField from '@/components/school/SelectField';

export default function TeacherAttendanceMobile({
  activeTab,
  setActiveTab,
  stats,
  classes,
  sections,
  subjects,
  periods,
  selectedClass,
  setSelectedClass,
  selectedSection,
  setSelectedSection,
  selectedSubject,
  setSelectedSubject,
  selectedPeriod,
  setSelectedPeriod,
  date,
  setDate,
  students,
  attendanceData,
  setAttendanceData,
  remarksData,
  setRemarksData,
  onSubmit,
  historyRecords,
  onEditHistory,
  loading,
  studentsLoading,
  loadStudents,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Attendance System</h2>
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Mark & Track Student Attendance</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto rounded-2xl bg-white p-1 shadow-xs border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shrink-0 scrollbar-none snap-x">
        {[
          { id: "entry", label: "Mark Today" },
          { id: "history", label: "History Log" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all snap-start ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'entry' ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-850 dark:bg-slate-900">
              <p className="text-[9px] font-bold text-slate-400">Present</p>
              <p className="text-sm font-black text-emerald-600 mt-0.5">{stats.presentToday || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-850 dark:bg-slate-900">
              <p className="text-[9px] font-bold text-slate-400">Absent</p>
              <p className="text-sm font-black text-rose-600 mt-0.5">{stats.absentToday || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 text-center dark:border-slate-850 dark:bg-slate-900">
              <p className="text-[9px] font-bold text-slate-400">Percent</p>
              <p className="text-sm font-black text-blue-600 mt-0.5">{stats.attendancePercentage || 0}%</p>
            </div>
          </div>

          {/* Form Filter selection */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-850 dark:bg-slate-900 space-y-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-bold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <SelectField
              label="Class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[{ value: '', label: 'Select Class' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
            />
            <SelectField
              label="Section"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              options={[{ value: '', label: 'Select Section' }, ...sections.map(s => ({ value: s.id, label: s.name }))]}
              disabled={!selectedClass}
            />
            <SelectField
              label="Subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={[{ value: '', label: 'Select Subject' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]}
              disabled={!selectedSection}
            />
            <SelectField
              label="Period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={[{ value: '', label: 'Select Period' }, ...periods.map(p => ({ value: p.id, label: `${p.name} (${p.startTime}-${p.endTime})` }))]}
              disabled={!selectedSection}
            />

            <button
              onClick={loadStudents}
              disabled={!selectedSubject || !selectedPeriod}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-black text-white hover:bg-blue-700 shadow-md disabled:opacity-40"
            >
              {studentsLoading ? 'Loading Students...' : 'Load Student List'}
            </button>
          </div>

          {/* Student marking list */}
          {students.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-450">Student Roster ({students.length})</h3>
              <div className="space-y-3">
                {students.map((student) => {
                  const status = attendanceData[student.id] || 'present';
                  return (
                    <div
                      key={student.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3"
                    >
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-white">{student.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Roll No: {student.roll_no || 'N/A'}</p>
                      </div>

                      {/* Status selectors */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'present', label: 'Present', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20' },
                          { id: 'absent', label: 'Absent', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20' },
                          { id: 'late', label: 'Late', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20' },
                          { id: 'leave', label: 'Leave', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20' },
                        ].map((btn) => {
                          const isSel = status === btn.id;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => setAttendanceData(prev => ({ ...prev, [student.id]: btn.id }))}
                              className={`rounded-xl py-2 text-[10px] font-black border transition-all ${
                                isSel
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                  : 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Remarks input */}
                      <div>
                        <input
                          type="text"
                          placeholder="Add remarks (optional)"
                          value={remarksData[student.id] || ''}
                          onChange={(e) => setRemarksData(prev => ({ ...prev, [student.id]: e.target.value }))}
                          className="w-full rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-[10px] font-bold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Attendance */}
              <button
                onClick={onSubmit}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-black text-white hover:bg-blue-700 shadow-md"
              >
                Submit Attendance Sheet
              </button>
            </div>
          )}
        </div>
      ) : (
        /* History view */
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Attendance Log</h2>
          {historyRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-850 dark:bg-slate-900/50">
              <p className="text-xs font-bold text-slate-500">No past records found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyRecords.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {item.className} - {item.sectionName}
                      </span>
                      <h3 className="text-xs font-black text-slate-800 dark:text-white mt-2 leading-tight">
                        {item.subjectName}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">Period: {item.periodName}</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-450 uppercase shrink-0">
                      {item.date ? new Date(item.date).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/80 pt-3 text-[10px] font-bold text-slate-400">
                    <span>Present: <strong className="text-emerald-600">{item.presentCount ?? 0}</strong> / Total: {item.totalCount ?? 0}</span>
                    <button
                      onClick={() => onEditHistory(item)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 active:scale-95"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
