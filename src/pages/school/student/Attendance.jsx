import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  MinusCircle,
  Timer,
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

function localDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseRecordDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

function statusMeta(status) {
  const normalized = normalizeStatus(status);
  if (normalized === 'present') {
    return {
      label: 'Present',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      soft: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300',
      block: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/25',
      icon: CheckCircle2,
    };
  }
  if (normalized === 'late') {
    return {
      label: 'Late',
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
      soft: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
      block: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/25',
      icon: Timer,
    };
  }
  if (normalized === 'leave') {
    return {
      label: 'Leave',
      dot: 'bg-sky-500',
      text: 'text-sky-700 dark:text-sky-300',
      soft: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300',
      block: 'border-sky-200 bg-sky-50/80 dark:border-sky-900/50 dark:bg-sky-950/25',
      icon: MinusCircle,
    };
  }
  if (normalized === 'absent') {
    return {
      label: 'Absent',
      dot: 'bg-rose-500',
      text: 'text-rose-700 dark:text-rose-300',
      soft: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300',
      block: 'border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/25',
      icon: XCircle,
    };
  }
  return {
    label: 'Not marked',
    dot: 'bg-slate-300 dark:bg-slate-700',
    text: 'text-slate-500 dark:text-slate-400',
    soft: 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
    block: 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40',
    icon: CalendarDays,
  };
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
      attended,
      percentage: total ? clampPct((attended / total) * 100) : 0,
    };
  }, [records]);

  const weeklyTrend = useMemo(() => {
    const weeks = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];

    records.forEach((item) => {
      const date = parseRecordDate(item.date);
      if (!date) return;
      const week = Math.min(4, Math.floor((date.getDate() - 1) / 7));
      counts[week] += 1;
      if (['present', 'late'].includes(normalizeStatus(item.status))) weeks[week] += 1;
    });

    return weeks.map((attended, index) => ({
      label: `Week ${index + 1}`,
      marked: counts[index],
      attended,
      value: counts[index] ? clampPct((attended / counts[index]) * 100) : 0,
    }));
  }, [records]);

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDate = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingDays = firstDate.getDay();
    const byDate = new Map();

    records.forEach((item) => {
      const date = parseRecordDate(item.date);
      if (!date) return;
      byDate.set(localDateKey(date), item);
    });

    const placeholders = Array.from({ length: leadingDays }).map((_, index) => ({
      key: `blank-${index}`,
      blank: true,
    }));

    const days = Array.from({ length: daysInMonth }).map((_, index) => {
      const day = index + 1;
      const date = new Date(year, month - 1, day);
      const key = localDateKey(date);
      return {
        day,
        key,
        weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
        isToday: key === localDateKey(new Date()),
        record: byDate.get(key),
      };
    });

    return [...placeholders, ...days];
  }, [records, selectedMonth]);

  const recentRecords = useMemo(
    () =>
      [...records]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [records]
  );

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  {monthLabel(selectedMonth)}
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Attendance Overview
                </h1>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-500 dark:text-slate-400 sm:text-base">
                  A cleaner view of your marked days, weekly movement, and latest class records.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMonth((value) => shiftMonth(value, -1))}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value || monthKey())}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-blue-950/40"
                />
                <button
                  type="button"
                  onClick={() => setSelectedMonth((value) => shiftMonth(value, 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonth(monthKey())}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  Today
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Weekly Movement</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Attendance percentage split by week.</p>
              </div>
              <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-5">
              {weeklyTrend.map((week) => (
                <div key={week.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{week.label}</p>
                    <p className="text-sm font-black text-slate-950 dark:text-white">{week.value}%</p>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${week.value >= 75 ? 'bg-blue-600' : week.marked ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                      style={{ width: `${week.value}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {week.attended}/{week.marked} attended
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Monthly Calendar</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Marked class days are colored by status.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['present', 'late', 'leave', 'absent'].map((status) => {
                  const meta = statusMeta(status);
                  return (
                    <span key={status} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${meta.soft}`}>
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-2">
              {weekdayLabels.map((day) => (
                <div key={day} className="px-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {day}
                </div>
              ))}

              {calendarDays.map((day) => {
                if (day.blank) return <div key={day.key} className="hidden min-h-[86px] sm:block" />;
                const meta = statusMeta(day.record?.status);
                const Icon = meta.icon;
                return (
                  <div
                    key={day.key}
                    className={`min-h-[82px] rounded-2xl border p-2.5 transition hover:-translate-y-0.5 hover:shadow-sm sm:min-h-[94px] sm:p-3 ${meta.block} ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-950 dark:text-white">{day.day}</p>
                        <p className="mt-0.5 hidden text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:block">{day.weekday}</p>
                      </div>
                      <Icon className={`h-4 w-4 ${meta.text}`} />
                    </div>
                    <p className={`mt-4 truncate text-xs font-black capitalize ${meta.text}`}>{meta.label}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">Recent Records</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Latest marked attendance entries.</p>
            </div>
            <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="mt-5 space-y-3">
            {recentRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950/50">
                <FileText className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">No records yet</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Marked attendance will appear here.</p>
              </div>
            ) : (
              recentRecords.map((item) => {
                const meta = statusMeta(item.status);
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id || `${item.date}-${item.status}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${meta.soft}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-950 dark:text-white">
                          {new Date(item.date).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {item.remarks || item.subjectName || 'Class day'}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${meta.soft}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
