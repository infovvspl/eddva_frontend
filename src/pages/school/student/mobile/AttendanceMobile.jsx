import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

export default function AttendanceMobile({
  records,
  loading,
  selectedMonth,
  setSelectedMonth,
  stats,
  monthLabel,
  shiftMonth,
  getMeta,
}) {
  if (loading && records.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Month Selector Header */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Previous Month"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-black text-slate-800 dark:text-white">
          {monthLabel(selectedMonth)}
        </span>
        <button
          onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          aria-label="Next Month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 col-span-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly Attendance Rate</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.pct}%</p>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400`}>
            {stats.present}/{stats.total}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mb-1" />
          <p className="text-[10px] font-bold text-slate-400">Present</p>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{stats.present}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block mb-1" />
          <p className="text-[10px] font-bold text-slate-400">Absent</p>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{stats.absent}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block mb-1" />
          <p className="text-[10px] font-bold text-slate-400">Late</p>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{stats.late}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="h-2 w-2 rounded-full bg-blue-400 inline-block mb-1" />
          <p className="text-[10px] font-bold text-slate-400">Leave</p>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{stats.leave}</p>
        </div>
      </div>

      {/* Daily Records Agenda */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Attendance Log</h2>
        {records.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No records found for this month</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {records.map((r) => {
              const meta = getMeta(r.status);
              const StatusIcon = meta?.Icon || CalendarDays;
              const dateObj = new Date(r.date);
              const formattedDate = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' });

              return (
                <div
                  key={r.id || r.date}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400">{formattedDate}</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">
                      {r.remarks || 'Regular school day'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${meta?.tw?.bg} ${meta?.tw?.text} ${meta?.tw?.border}`}>
                    <StatusIcon size={11} />
                    {meta?.label || r.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
