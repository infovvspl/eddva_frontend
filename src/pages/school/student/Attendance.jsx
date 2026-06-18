import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  XCircle,
  MinusCircle,
  Timer,
  CheckCircle2,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function clampPct(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0;
}
function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function localDateKey(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseRecordDate(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
function getMonthRange(key) {
  const [y, m] = key.split('-').map(Number);
  return {
    startDate: new Date(y, m - 1, 1).toISOString(),
    endDate:   new Date(y, m, 0, 23, 59, 59).toISOString(),
  };
}
function shiftMonth(key, offset) {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + offset, 1));
}
function normalizeStatus(s) { return String(s || '').toLowerCase(); }

const STATUS = {
  present: { label: 'Present',  tw: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-500', dot: 'bg-emerald-500' }, Icon: CheckCircle2 },
  late:    { label: 'Late',     tw: { text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  ring: 'ring-amber-500',  dot: 'bg-amber-500'  }, Icon: Timer        },
  leave:   { label: 'Leave',    tw: { text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  ring: 'ring-amber-500',  dot: 'bg-amber-500'  }, Icon: MinusCircle  },
  absent:  { label: 'Absent',   tw: { text: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200',   ring: 'ring-rose-500',   dot: 'bg-rose-500'   }, Icon: XCircle      },
  total:   { label: 'Total Classes', tw: { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', ring: 'ring-slate-500', dot: 'bg-slate-500' }, Icon: CalendarDays },
};
function getMeta(status) { return STATUS[normalizeStatus(status)] || null; }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── component ────────────────────────────────────────────────────────────── */
export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());

  useEffect(() => {
    const fetchData = async () => {
      const userId = user?.id || user?.userId;
      if (!userId) { setLoading(false); return; }
      setLoading(true);
      const { startDate, endDate } = getMonthRange(selectedMonth);
      try {
        const res = await api.get('/attendance', { params: { userId, startDate, endDate, limit: 31 } });
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setRecords(data);
      } catch { setRecords([]); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, selectedMonth]);

  const stats = useMemo(() => {
    const presentCount = records.filter(r => normalizeStatus(r.status) === 'present').length;
    const absent   = records.filter(r => normalizeStatus(r.status) === 'absent').length;
    const late     = records.filter(r => normalizeStatus(r.status) === 'late').length;
    const leave    = records.filter(r => normalizeStatus(r.status) === 'leave').length;
    const total    = records.length;
    const present  = presentCount + late;
    return { present, absent, late, leave, total, pct: total ? clampPct((present / total) * 100) : 0 };
  }, [records]);

  const weeklyTrend = useMemo(() => {
    const weeks  = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];
    records.forEach(r => {
      const d = parseRecordDate(r.date);
      if (!d) return;
      const w = Math.min(4, Math.floor((d.getDate() - 1) / 7));
      counts[w]++;
      if (['present', 'late'].includes(normalizeStatus(r.status))) weeks[w]++;
    });
    return weeks.map((attended, i) => ({
      label: `Wk ${i + 1}`,
      marked: counts[i],
      attended,
      pct: counts[i] ? clampPct((attended / counts[i]) * 100) : 0,
    }));
  }, [records]);

  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDate  = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDate = new Map();
    records.forEach(r => { const d = parseRecordDate(r.date); if (d) byDate.set(localDateKey(d), r); });
    const blanks = Array.from({ length: firstDate.getDay() }).map((_, i) => ({ key: `blank-${i}`, blank: true }));
    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const day  = i + 1;
      const date = new Date(year, month - 1, day);
      const key  = localDateKey(date);
      return { day, key, isToday: key === localDateKey(new Date()), record: byDate.get(key) };
    });
    return [...blanks, ...days];
  }, [records, selectedMonth]);

  const recentRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
    [records]
  );

  const ringColor = stats.pct >= 90 ? '#10b981' : stats.pct >= 75 ? '#3b82f6' : stats.pct >= 60 ? '#f59e0b' : '#ef4444';

  const statCards = [
    { label: 'Present',       value: stats.present, ...STATUS.present },
    { label: 'Absent',        value: stats.absent,  ...STATUS.absent  },
    { label: 'Leave',         value: stats.leave,   ...STATUS.leave   },
    { label: 'Total Classes', value: stats.total,   ...STATUS.total   },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-blue-600">
            <CalendarCheck2 size={12} />
            {monthLabel(selectedMonth)}
          </span>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Attendance</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Track your monthly presence and class records</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonth(v => shiftMonth(v, -1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value || monthKey())}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={() => setSelectedMonth(v => shiftMonth(v, 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setSelectedMonth(monthKey())}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black uppercase tracking-wider text-slate-600 transition hover:bg-slate-50"
          >
            Today
          </button>
        </div>
      </div>

      {/* ── Attendance ring + stat cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

        {/* Ring card */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative h-20 w-20">
            <svg width={80} height={80} viewBox="0 0 80 80" className="-rotate-90">
              <circle cx={40} cy={40} r={32} fill="none" stroke="#f1f5f9" strokeWidth={8} />
              <circle
                cx={40} cy={40} r={32} fill="none"
                stroke={ringColor}
                strokeWidth={8}
                strokeDasharray={`${(stats.pct / 100) * 201} 201`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-base font-black text-slate-900">{stats.pct}%</p>
            </div>
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Attendance</p>
          <p className="text-[11px] font-semibold text-slate-400">{stats.attended}/{stats.total} days</p>
        </div>

        {statCards.map(s => {
          const Icon = s.Icon;
          return (
            <div
              key={s.label}
              className={`flex flex-col gap-2.5 rounded-2xl border bg-white p-5 shadow-sm border-t-4 ${s.tw.border.replace('border-', 'border-t-')}`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-[11px] font-black uppercase tracking-widest ${s.tw.text}`}>{s.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${s.tw.bg}`}>
                  <Icon size={15} className={s.tw.text} />
                </div>
              </div>
              <p className={`text-3xl font-black ${s.tw.text}`}>{s.value}</p>
              <p className="text-[11px] font-semibold text-slate-400">days this month</p>
            </div>
          );
        })}
      </div>

      {/* ── Weekly trend + Recent records ───────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

        {/* Weekly trend bar chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Weekly Trend</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">Attendance rate per week of the month</p>
            </div>
            <TrendingUp size={18} className="text-blue-500" />
          </div>

          <div className="mt-5 flex items-end gap-3">
            {weeklyTrend.map((w) => {
              const TRACK = 80;
              const barColor = w.pct >= 75 ? 'bg-blue-500' : w.marked ? 'bg-rose-400' : 'bg-slate-100';
              const barH = w.marked ? Math.max(6, Math.round((w.pct / 100) * TRACK)) : 6;
              return (
                <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="min-h-[16px] text-[11px] font-black text-slate-700">
                    {w.marked ? `${w.pct}%` : ''}
                  </span>
                  <div className="flex w-full flex-col justify-end overflow-hidden rounded-lg border border-slate-100 bg-slate-50" style={{ height: TRACK }}>
                    <div className={`w-full rounded-t-lg transition-all duration-500 ${barColor}`} style={{ height: barH }} />
                  </div>
                  <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{w.label}</span>
                  <span className="text-[10px] font-semibold text-slate-300">{w.attended}/{w.marked}d</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
            {[
              { cls: 'bg-blue-500',   label: '≥75% good' },
              { cls: 'bg-rose-400',   label: '<75% low' },
              { cls: 'bg-slate-200',  label: 'No classes' },
            ].map(l => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <span className={`inline-block h-2.5 w-2.5 rounded-sm ${l.cls}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Recent records timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Recent Records</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">Latest marked entries</p>
            </div>
            <CalendarDays size={18} className="text-slate-400" />
          </div>

          <div className="mt-5 space-y-0">
            {recentRecords.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays size={32} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm font-black text-slate-400">No records yet</p>
                <p className="mt-1 text-xs font-medium text-slate-300">Marked days will appear here</p>
              </div>
            ) : recentRecords.map((item, i) => {
              const meta   = getMeta(item.status);
              const Icon   = meta?.Icon;
              const isLast = i === recentRecords.length - 1;
              return (
                <div key={item.id || `${item.date}-${item.status}`} className={`relative flex gap-3 ${isLast ? '' : 'pb-4'}`}>
                  {!isLast && (
                    <div className="absolute left-[18px] top-9 bottom-0 w-0.5 rounded-full bg-slate-100" />
                  )}
                  <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta ? `${meta.tw.bg} ${meta.tw.border}` : 'border-slate-100 bg-slate-50'}`}>
                    {Icon
                      ? <Icon size={15} className={meta.tw.text} />
                      : <CalendarDays size={15} className="text-slate-300" />
                    }
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-black text-slate-900">
                          {new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400 max-w-[130px]">
                          {item.remarks || item.subjectName || 'Class day'}
                        </p>
                      </div>
                      {meta && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${meta.tw.bg} ${meta.tw.text} border ${meta.tw.border}`}>
                          {meta.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Monthly calendar ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900">Monthly Calendar</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Each day coloured by attendance status</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS).map(([key, s]) => (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${s.tw.bg} ${s.tw.text} ${s.tw.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.tw.dot}`} />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-1 text-center text-[10px] font-black uppercase tracking-wider text-slate-300">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(day => {
              if (day.blank) return <div key={day.key} />;
              const meta     = getMeta(day.record?.status);
              const isMarked = !!meta;
              const Icon     = meta?.Icon;
              return (
                <div
                  key={day.key}
                  className={`flex min-h-[60px] flex-col items-center justify-between gap-1 rounded-xl border p-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    day.isToday
                      ? 'border-blue-400 ring-2 ring-blue-100'
                      : isMarked
                      ? `${meta.tw.bg} ${meta.tw.border}`
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <p className={`text-[13px] font-black ${day.isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                    {day.day}
                  </p>
                  {Icon
                    ? <Icon size={13} className={meta.tw.text} />
                    : <span className="h-3.5 w-3.5" />
                  }
                  <p className={`text-[8px] font-black uppercase tracking-wider ${isMarked ? meta.tw.text : 'text-slate-200'}`}>
                    {isMarked ? meta.label : '·'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
