// TeacherAttendanceRecords — read-only record of every teacher's attendance
// over a day, a week, a month or an academic year. Marking stays on the
// "Month Grid" tab; this tab is for looking back. Same flat surface-*/brand-*
// styling as the sibling TeacherAttendance tabs.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_STYLE = {
  present: { label: 'Present', icon: '✓', dot: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  late: { label: 'Late', icon: '✓', dot: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  absent: { label: 'Absent', icon: '✕', dot: 'bg-gradient-to-br from-red-400 to-red-600 text-white', chip: 'bg-red-50 text-red-700 border-red-200' },
  leave: { label: 'Leave', icon: '–', dot: 'bg-gradient-to-br from-blue-400 to-blue-600 text-white', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  none: { label: 'Not marked', icon: '–', dot: 'bg-surface-100 text-surface-400', chip: 'bg-surface-50 text-surface-500 border-surface-200' },
};

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return toDateStr(d); };
const mondayOf = (s) => { const d = parseDate(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return toDateStr(d); };
const fmtShort = (s) => parseDate(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—');
const attendedPct = (present, late, marked) => (marked > 0 ? Math.round(((present + late) / marked) * 100) : null);

function StatusDot({ status, title }) {
  const m = STATUS_STYLE[status || 'none'];
  return (
    <span title={title || m.label} className={cn('inline-flex size-7 items-center justify-center rounded-full text-sm font-bold', m.dot)}>
      {m.icon}
    </span>
  );
}

function PctCell({ value }) {
  if (value === null || value === undefined) return <span className="text-surface-300">{'—'}</span>;
  const tone = value >= 90 ? 'text-emerald-600' : value >= 75 ? 'text-amber-600' : 'text-red-600';
  return <span className={cn('text-sm font-bold', tone)}>{value}%</span>;
}

function TeacherName({ row }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-surface-900">{row.name}</p>
      {(row.employeeId || row.department) && (
        <p className="truncate text-[11px] font-medium text-surface-500">{[row.employeeId, row.department].filter(Boolean).join(' • ')}</p>
      )}
    </div>
  );
}

function StatTile({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-surface-400 sm:text-[11px]">{label}</p>
      <p className={cn('mt-1 text-lg font-black text-surface-950 sm:text-xl', tone)}>{value}</p>
    </div>
  );
}

/** Fetch every teacher's month grid (one call, whole roster). */
async function fetchMonth(year, month) {
  const res = await api.get('/teacher-attendance/month', { params: { year, month, date: `${year}-${pad(month)}-01`, limit: 500, page: 1 } });
  return res?.data || {};
}

export default function TeacherAttendanceRecords() {
  const today = toDateStr(new Date());
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(today);
  const [weekStart, setWeekStart] = useState(mondayOf(today));
  const [month, setMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [academicYear, setAcademicYear] = useState(''); // '' = server's current academic year
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (period === 'daily') {
        const res = await api.get('/teacher-attendance', { params: { date } });
        setData({ kind: 'daily', ...(res?.data || {}) });
      } else if (period === 'weekly') {
        const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        const months = [...new Set(days.map((d) => d.slice(0, 7)))];
        const bodies = await Promise.all(months.map((key) => fetchMonth(Number(key.slice(0, 4)), Number(key.slice(5, 7)))));
        const byMonth = Object.fromEntries(months.map((key, i) => [key, bodies[i]]));
        const roster = new Map();
        bodies.forEach((b) => (b.data || []).forEach((t) => { if (!roster.has(t.userId)) roster.set(t.userId, t); }));
        const rows = [...roster.values()].map((t) => ({
          ...t,
          week: days.map((d) => {
            const monthBody = byMonth[d.slice(0, 7)];
            const row = (monthBody?.data || []).find((r) => r.userId === t.userId);
            const day = Number(d.slice(-2));
            return { date: d, status: row?.days?.[day] ?? null, holiday: monthBody?.holidays?.[day] || null };
          }),
        }));
        setData({ kind: 'weekly', days, rows });
      } else if (period === 'monthly') {
        const body = await fetchMonth(month.year, month.month);
        setData({ kind: 'monthly', ...body });
      } else {
        const res = await api.get('/teacher-attendance/year-summary', { params: { academicYear: academicYear || undefined, limit: 500, page: 1 } });
        const body = res?.data || {};
        setData({ kind: 'yearly', ...body });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load teacher attendance records');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, date, weekStart, month, academicYear]);

  useEffect(() => { void load(); }, [load]);

  const matches = (row) => !search.trim() || String(row.name || '').toLowerCase().includes(search.trim().toLowerCase())
    || String(row.employeeId || '').toLowerCase().includes(search.trim().toLowerCase());

  // ── navigation (prev / label / next) per period ──────────────────────────
  const nav = (() => {
    if (period === 'daily') {
      return {
        label: parseDate(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        prev: () => setDate(addDays(date, -1)),
        next: () => setDate(addDays(date, 1)),
        nextDisabled: date >= today,
      };
    }
    if (period === 'weekly') {
      return {
        label: `${fmtShort(weekStart)} – ${fmtShort(addDays(weekStart, 6))} ${parseDate(addDays(weekStart, 6)).getFullYear()}`,
        prev: () => setWeekStart(addDays(weekStart, -7)),
        next: () => setWeekStart(addDays(weekStart, 7)),
        nextDisabled: addDays(weekStart, 7) > today,
      };
    }
    if (period === 'monthly') {
      const now = new Date();
      const isCurrent = month.year === now.getFullYear() && month.month === now.getMonth() + 1;
      return {
        label: `${MONTH_SHORT[month.month - 1]} ${month.year}`,
        prev: () => setMonth((m) => (m.month === 1 ? { year: m.year - 1, month: 12 } : { year: m.year, month: m.month - 1 })),
        next: () => setMonth((m) => (m.month === 12 ? { year: m.year + 1, month: 1 } : { year: m.year, month: m.month + 1 })),
        nextDisabled: isCurrent,
      };
    }
    const startYear = data?.kind === 'yearly' && data.startDate ? Number(String(data.startDate).slice(0, 4)) : new Date().getFullYear();
    const shown = data?.kind === 'yearly' ? data.academicYear : academicYear;
    const setYear = (y) => setAcademicYear(`${y}-${pad((y + 1) % 100)}`);
    return {
      label: shown ? `Academic year ${shown}` : 'Academic year',
      prev: () => setYear(startYear - 1),
      next: () => setYear(startYear + 1),
      nextDisabled: startYear >= new Date().getFullYear() - (new Date().getMonth() < 2 ? 1 : 0),
    };
  })();

  // ── derived rows ──────────────────────────────────────────────────────────
  const monthlyRows = useMemo(() => {
    if (data?.kind !== 'monthly') return [];
    return (data.data || []).map((t) => {
      const counts = { present: 0, late: 0, absent: 0, leave: 0 };
      Object.values(t.days || {}).forEach((s) => { if (counts[s] !== undefined) counts[s] += 1; });
      const marked = counts.present + counts.late + counts.absent + counts.leave;
      return { ...t, ...counts, marked, pct: attendedPct(counts.present, counts.late, marked) };
    });
  }, [data]);

  const dailyRows = data?.kind === 'daily' ? (data.data || []) : [];
  const dailySummary = data?.kind === 'daily' ? (data.summary || {}) : {};

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex flex-wrap rounded-lg border border-surface-200 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn('rounded-md px-3 py-1.5 text-xs font-bold transition-colors', period === p.value ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-50')}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-surface-200 bg-white">
            <button type="button" onClick={nav.prev} aria-label="Previous" className="p-2 text-surface-500 hover:bg-surface-50"><ChevronLeft className="size-4" /></button>
            <span className="min-w-[10.5rem] px-2 text-center text-xs font-bold text-surface-800">{nav.label}</span>
            <button type="button" onClick={nav.next} disabled={nav.nextDisabled} aria-label="Next" className="p-2 text-surface-500 hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-4" /></button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-surface-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teacher"
              className="h-9 w-44 rounded-lg border border-surface-200 bg-white pl-8 pr-3 text-xs font-medium text-surface-800 outline-none focus:border-brand-400"
            />
          </div>
        </div>
      </div>

      {period === 'daily' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          <StatTile label="Teachers" value={dailySummary.total ?? 0} />
          <StatTile label="Present" value={dailySummary.present ?? 0} tone="text-emerald-600" />
          <StatTile label="Absent" value={dailySummary.absent ?? 0} tone="text-red-600" />
          <StatTile label="Late" value={dailySummary.late ?? 0} tone="text-amber-600" />
          <StatTile label="Not marked" value={dailySummary.notMarked ?? 0} />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-10 text-center text-sm font-medium text-surface-500">Loading records…</p>
          ) : !data ? (
            <p className="p-10 text-center text-sm font-medium text-surface-500">No records to show.</p>
          ) : data.kind === 'daily' ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-50">
                  <TableHead className="font-semibold text-surface-500">Teacher</TableHead>
                  <TableHead className="font-semibold text-surface-500">Status</TableHead>
                  <TableHead className="font-semibold text-surface-500">Check-in</TableHead>
                  <TableHead className="font-semibold text-surface-500">Check-out</TableHead>
                  <TableHead className="font-semibold text-surface-500">Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyRows.filter(matches).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-surface-500">No teachers found.</TableCell></TableRow>
                ) : dailyRows.filter(matches).map((r) => {
                  const st = STATUS_STYLE[r.status || 'none'];
                  return (
                    <TableRow key={r.userId}>
                      <TableCell><TeacherName row={r} /></TableCell>
                      <TableCell><span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold', st.chip)}>{st.label}</span></TableCell>
                      <TableCell className="text-sm text-surface-700">{fmtTime(r.checkInTime)}</TableCell>
                      <TableCell className="text-sm text-surface-700">{fmtTime(r.checkOutTime)}</TableCell>
                      <TableCell className="text-sm capitalize text-surface-600">{r.method ? String(r.method).toLowerCase() : '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : data.kind === 'weekly' ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-50">
                  <TableHead className="font-semibold text-surface-500">Teacher</TableHead>
                  {data.days.map((d, i) => (
                    <TableHead key={d} className="text-center font-semibold text-surface-500">
                      {WEEKDAY_SHORT[i]}
                      <span className="block text-[10px] font-medium text-surface-400">{fmtShort(d)}</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-semibold text-surface-500">Present</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.filter(matches).length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-surface-500">No teachers found.</TableCell></TableRow>
                ) : data.rows.filter(matches).map((r) => {
                  const marked = r.week.filter((w) => w.status).length;
                  const attended = r.week.filter((w) => w.status === 'present' || w.status === 'late').length;
                  return (
                    <TableRow key={r.userId}>
                      <TableCell><TeacherName row={r} /></TableCell>
                      {r.week.map((w) => (
                        <TableCell key={w.date} className="text-center">
                          {w.holiday || (parseDate(w.date).getDay() === 0 && !w.status)
                            ? <span title={w.holiday || 'Sunday'} className="text-[10px] font-semibold text-surface-300">{w.holiday ? 'Hol' : 'Off'}</span>
                            : <StatusDot status={w.status} />}
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-sm font-bold text-surface-800">{attended}/{marked}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : data.kind === 'monthly' ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-50">
                  <TableHead className="font-semibold text-surface-500">Teacher</TableHead>
                  <TableHead className="text-center font-semibold text-surface-500">Present</TableHead>
                  <TableHead className="text-center font-semibold text-surface-500">Late</TableHead>
                  <TableHead className="text-center font-semibold text-surface-500">Absent</TableHead>
                  <TableHead className="text-center font-semibold text-surface-500">Leave</TableHead>
                  <TableHead className="text-center font-semibold text-surface-500">Marked days</TableHead>
                  <TableHead className="text-center font-semibold text-surface-500">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyRows.filter(matches).length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-surface-500">No teachers found.</TableCell></TableRow>
                ) : monthlyRows.filter(matches).map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell><TeacherName row={r} /></TableCell>
                    <TableCell className="text-center text-sm font-semibold text-emerald-600">{r.present}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-amber-600">{r.late}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-red-600">{r.absent}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-blue-600">{r.leave}</TableCell>
                    <TableCell className="text-center text-sm text-surface-600">{r.marked}</TableCell>
                    <TableCell className="text-center"><PctCell value={r.pct} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-50">
                  <TableHead className="font-semibold text-surface-500">Teacher</TableHead>
                  {(data.monthKeys || []).map((k) => (
                    <TableHead key={k} className="text-center font-semibold text-surface-500">{MONTH_SHORT[Number(k.slice(5, 7)) - 1]}</TableHead>
                  ))}
                  <TableHead className="text-center font-semibold text-surface-500">Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.data || []).filter(matches).length === 0 ? (
                  <TableRow><TableCell colSpan={14} className="py-8 text-center text-surface-500">No teachers found.</TableCell></TableRow>
                ) : (data.data || []).filter(matches).map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell><TeacherName row={r} /></TableCell>
                    {(r.months || []).map((m) => (
                      <TableCell key={m.month} className="text-center" title={`${m.present} present, ${m.late} late, ${m.absent} absent, ${m.leave} leave`}>
                        <PctCell value={m.percentage} />
                      </TableCell>
                    ))}
                    <TableCell className="text-center"><PctCell value={r.yearPercentage} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
