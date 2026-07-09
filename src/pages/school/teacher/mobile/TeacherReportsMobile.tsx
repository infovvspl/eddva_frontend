import React from 'react';
import { MobileListLayout } from '@/components/shared/mobile/MobileLayouts';
import { TrendingUp, AlertTriangle, Users, Target } from 'lucide-react';

export default function TeacherReportsMobile({
  summary,
  loading,
  studentPerformance,
  weaknessData,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Performance Reports</h2>
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Class Analytics & Insights</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900">
          <p className="text-[9px] font-bold text-slate-400">Class Average</p>
          <p className="text-lg font-black text-blue-600 mt-0.5">{summary.classAverage || 0}%</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900">
          <p className="text-[9px] font-bold text-slate-400">Pass Rate</p>
          <p className="text-lg font-black text-emerald-600 mt-0.5">{summary.passRate || 0}%</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900">
          <p className="text-[9px] font-bold text-slate-400">At-Risk Students</p>
          <p className="text-lg font-black text-rose-600 mt-0.5">{summary.atRiskStudents || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900">
          <p className="text-[9px] font-bold text-slate-400">Total Students</p>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{summary.totalStudents || 0}</p>
        </div>
      </div>

      {/* Weakness Areas */}
      {weaknessData && weaknessData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Areas Requiring Focus</h3>
          <div className="space-y-3">
            {weaknessData.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-rose-100 bg-rose-50/20 p-4 shadow-xs dark:border-rose-950/20 dark:bg-rose-950/10 space-y-1.5"
              >
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-450 text-xs font-black">
                  <AlertTriangle size={13} />
                  <span>{item.subjectName || item.topicName || 'Subject Detail'}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500">
                  Topic: {item.topicName || 'Generic'} · Mastery score under {item.averageScore || item.mastery || 45}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student List */}
      <MobileListLayout
        title="Student Performance"
        subtitle=""
        loading={loading}
        items={studentPerformance}
        renderItem={(student) => (
          <div
            key={student.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex items-center justify-between"
          >
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-white">{student.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Class: {student.class || 'N/A'}</p>
            </div>
            <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
              (student.avgScore || student.score) >= 75
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-455'
                : (student.avgScore || student.score) >= 50
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-455'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455'
            }`}>
              {student.avgScore || student.score || 0}%
            </span>
          </div>
        )}
      />
    </div>
  );
}
