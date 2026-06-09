import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  TrendingUp,
  UserCheck,
  XCircle,
} from 'lucide-react';

function clampPct(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function getMonthRange(key) {
  const [year, month] = key.split('-').map(Number);
  return {
    startDate: new Date(year, month - 1, 1).toISOString(),
    endDate: new Date(year, month, 0, 23, 59, 59).toISOString(),
  };
}

function shiftMonth(key, offset) {
  const [year, month] = key.split('-').map(Number);
  return monthKey(new Date(year, month - 1 + offset, 1));
}

function normalizeStatus(status) {
  return String(status || '').toLowerCase();
}

function statusTone(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'present') {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300';
  }
  if (normalized === 'late') {
    return 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300';
  }
  if (normalized === 'leave') {
    return 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300';
  }
  return 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300';
}

function statusDot(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'present') return 'bg-emerald-500';
  if (normalized === 'late') return 'bg-amber-500';
  if (normalized === 'leave') return 'bg-blue-500';
  if (normalized === 'absent') return 'bg-rose-500';
  return 'bg-slate-300 dark:bg-slate-700';
}

function StatCard({ icon: Icon, label, value, helper, tone = 'slate' }) {
  const tones = {
    emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
    blue: 'border-blue-100 bg-blue-50/80 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300',
    amber: 'border-amber-100 bg-amber-50/80 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
    rose: 'border-rose-100 bg-rose-50/80 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
    slate: 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
          {helper && <p className="mt-1 text-xs font-semibold opacity-75">{helper}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-slate-950/40">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());

  useEffect(() => {
    const fetchAttendance = async () => {
      const userId = user?.id || user?.userId;
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { startDate, endDate } = getMonthRange(selectedMonth);

      try {
        const res = await api.get('/attendance', {
          params: { userId, startDate, endDate },
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setRecords(data);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user, selectedMonth]);

  const stats = useMemo(() => {
    const present = records.filter((item) => normalizeStatus(item.status) === 'present').length;
    const absent = records.filter((item) => normalizeStatus(item.status) === 'absent').length;
    const late = records.filter((item) => normalizeStatus(item.status) === 'late').length;
    const leave = records.filter((item) => normalizeStatus(item.status) === 'leave').length;
    const total = records.length;
    const attended = present + late;

    return {
      present,
      absent,
      late,
      leave,
      total,
      percentage: total ? clampPct((attended / total) * 100) : 0,
    };
  }, [records]);

  const weeklyTrend = useMemo(() => {
    const weeks = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];

    records.forEach((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return;
      const week = Math.min(4, Math.floor((date.getDate() - 1) / 7));
      counts[week] += 1;
      if (['present', 'late'].includes(normalizeStatus(item.status))) weeks[week] += 1;
    });

    return weeks.map((attended, index) => ({
      label: `Week ${index + 1}`,
      marked: counts[index],
      value: counts[index] ? clampPct((attended / counts[index]) * 100) : 0,
    }));
  }, [records]);

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDate = new Map(
      records.map((item) => {
        const date = new Date(item.date);
        return [date.toISOString().slice(0, 10), item];
      })
    );

    return Array.from({ length: daysInMonth }).map((_, index) => {
      const day = index + 1;
      const date = new Date(year, month - 1, day);
      const key = date.toISOString().slice(0, 10);
      return {
        day,
        key,
        weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
        record: byDate.get(key),
      };
    });
  }, [records, selectedMonth]);

  const recentRecords = useMemo(
    () =>
      [...records]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8),
    [records]
  );

  const attendanceMessage =
    stats.total === 0
      ? 'No attendance has been marked for this month yet.'
      : stats.percentage >= 90
        ? 'Excellent attendance. Keep the streak steady.'
        : stats.percentage >= 75
          ? 'You are above the required attendance line.'
          : 'Attendance is below 75%. Connect with your class teacher.';

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {monthLabel(selectedMonth)}
                </div>
                <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  Attendance Center
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                  Track your marked class days, weekly pattern, recent attendance records, and warning status in one place.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMonth((value) => shiftMonth(value, -1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value || monthKey())}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-blue-950/40"
                />
                <button
                  type="button"
                  onClick={() => setSelectedMonth((value) => shiftMonth(value, 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={TrendingUp} label="Attendance" value={`${stats.percentage}%`} helper={`${stats.total} marked days`} tone="blue" />
              <StatCard icon={CheckCircle2} label="Present" value={stats.present} helper="On-time days" tone="emerald" />
              <StatCard icon={XCircle} label="Absent" value={stats.absent} helper="Missed days" tone="rose" />
              <StatCard icon={Clock} label="Late" value={stats.late} helper={stats.leave ? `${stats.leave} leave` : 'Late marks'} tone="amber" />
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40 lg:border-l lg:border-t-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance health</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#2563eb ${stats.percentage * 3.6}deg, transparent 0deg)`,
                    }}
                  />
                  <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white text-xl font-black text-slate-950 dark:bg-slate-900 dark:text-white">
                    {stats.percentage}%
                  </div>
                </div>
                <div>
                  <p className="text-base font-black text-slate-950 dark:text-white">
                    {stats.percentage >= 75 || stats.total === 0 ? 'On watch' : 'Needs attention'}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">{attendanceMessage}</p>
                </div>
              </div>
            </div>

            {stats.total > 0 && stats.percentage < 75 && (
              <div className="mt-3 flex gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-bold leading-5">Your monthly attendance is below 75%.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white">Weekly Trend</h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Attendance percentage split by week.</p>
              </div>
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>

            <div className="mt-6 space-y-4">
              {weeklyTrend.map((week) => (
                <div key={week.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{week.label}</span>
                    <span className="text-slate-950 dark:text-white">
                      {week.value}% <span className="text-xs font-semibold text-slate-400">({week.marked} days)</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${week.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white">Monthly Calendar</h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Each marked class day appears with its attendance status.</p>
              </div>
              <FileText className="h-6 w-6 text-slate-400" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {calendarDays.map((day) => (
                <div
                  key={day.key}
                  className="min-h-[82px] rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white">{day.day}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{day.weekday}</p>
                    </div>
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusDot(day.record?.status)}`} />
                  </div>
                  <p className="mt-4 truncate text-xs font-bold capitalize text-slate-500 dark:text-slate-400">
                    {day.record?.status || 'Not marked'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Recent Records</h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Latest marked attendance entries.</p>
            </div>
            <UserCheck className="h-6 w-6 text-emerald-600" />
          </div>

          <div className="mt-5 space-y-3">
            {recentRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950/50">
                <UserCheck className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">No attendance records yet</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Marked attendance will appear here.</p>
              </div>
            ) : (
              recentRecords.map((item) => (
                <div
                  key={item.id || `${item.date}-${item.status}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.remarks || item.subjectName || 'Class day'}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(item.status)}`}>
                    {item.status || 'marked'}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
