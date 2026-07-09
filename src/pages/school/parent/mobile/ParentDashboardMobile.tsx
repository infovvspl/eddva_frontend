import React from 'react';
import {
  CalendarCheck,
  ClipboardList,
  FileText,
  UserRound,
  TrendingUp,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function ParentDashboardMobile({
  activeChild,
  activeChildId,
  setActiveChildId,
  children,
  summary,
  attendance,
  marks,
  homework,
  tests,
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Student Details...</p>
        </div>
      </div>
    );
  }

  const childOptions = children.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.className || ''} ${c.sectionName || ''})`,
  }));

  const metrics = [
    { label: 'Overall Attendance', value: `${summary?.overallAttendance || 0}%`, icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Completed Homework', value: summary?.completedHomework || 0, icon: ClipboardList, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Average Marks Pct', value: `${summary?.averagePercentage || 0}%`, icon: TrendingUp, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/20' },
    { label: 'Pending Tests', value: summary?.pendingTests || 0, icon: FileText, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20' },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header and Child Selector */}
      <div className="space-y-3.5">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white">Parent Portal</h1>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Monitor Academic Progress</p>
        </div>

        {children.length > 1 && (
          <div className="relative">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Select Child</label>
            <CustomSelect
              value={activeChildId}
              onChange={setActiveChildId}
              options={childOptions}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Child Summary Card */}
      {activeChild && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-150">
            <img
              src={activeChild.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}
              alt="Child Avatar"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-850 dark:text-white leading-tight">
              {activeChild.name}
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1">
              Roll No: {activeChild.rollNumber || 'N/A'} · Class: {activeChild.className} {activeChild.sectionName}
            </p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 flex items-center justify-between"
            >
              <div>
                <p className="text-[9px] font-bold text-slate-400">{m.label}</p>
                <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{m.value}</p>
              </div>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${m.color}`}>
                <Icon size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Homework */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Homework Assignments</h2>
        {!homework || homework.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-850 dark:bg-slate-900/50">
            <p className="text-xs font-bold text-slate-500">No active assignments listed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {homework.slice(0, 3).map((hw) => {
              const isSubmitted = hw.submitted || hw.status === 'SUBMITTED';
              return (
                <div
                  key={hw.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                        {hw.title}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">
                        Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                      isSubmitted ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}>
                      {isSubmitted ? 'Submitted' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
