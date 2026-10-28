// TeacherAttendance — admin marks each teacher's attendance for a whole
// month at a glance (one row per teacher, one column per day). A switch in
// the toolbar swaps each day cell between a status tick and its check-in
// time, and a "Monthly Total" column group (Present/Absent/%) sits at the
// end of the grid — both folded into this one view instead of separate
// tabs. Styling matches the sibling Reports tab (Attendance.jsx) — flat
// surface-*/brand-* cards/table, no gradients or heavy shadcn chrome.
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, UserCheck, CheckSquare, Save, ChevronLeft, ChevronRight, MapPin, LocateFixed, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import TeacherAttendanceRecords from './TeacherAttendanceRecords';

const STATUS_CYCLE = [null, 'present', 'absent', 'late', 'leave'];
const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'leave', label: 'Leave' },
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PAGE_TABS = [
  { value: 'grid', label: 'Month Grid' },
  { value: 'records', label: 'Records' },
  { value: 'settings', label: 'Check-In Settings' },
];

function pad(n) { return String(n).padStart(2, '0'); }
function todayParts() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` };
}
function dateStr(year, month, day) { return `${year}-${pad(month)}-${pad(day)}`; }
function isSunday(year, month, day) { return new Date(year, month - 1, day).getDay() === 0; }
function isFuture(year, month, day) { return dateStr(year, month, day) > todayParts().date; }
/** Holiday label, "Sunday", "Future date", or null — the single reason a day is purely blocked from marking. */
function lockReason(year, month, day, holidays) {
  if (isFuture(year, month, day)) return 'Future date';
  return holidays[day] || (isSunday(year, month, day) ? 'Sunday' : null);
}

function formatTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
/** Compact 24h "HH:MM" for the narrow day-grid cells — formatTime's "9:05 AM" doesn't fit a 32px column. */
function formatTimeShort(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Dot/icon per day-cell status — same emerald/red/amber/blue palette as the
// student Attendance reports page.
const STATUS_STYLE = {
  present: { icon: '✓', cls: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm' },
  absent: { icon: '✕', cls: 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-sm' },
  late: { icon: '✓', cls: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm' },
  leave: { icon: '–', cls: 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm' },
  none: { icon: '–', cls: 'bg-surface-100 text-surface-400' },
};
const METHOD_LABEL = { GEOFENCE: 'Geofence', BIOMETRIC: 'Biometric', MANUAL: 'Manual' };
const METHOD_DOT = { GEOFENCE: 'bg-brand-500', BIOMETRIC: 'bg-fuchsia-500' }; // MANUAL gets no dot — it's the default, nothing to call out

function dayCellTitle(status, meta) {
  if (!status) return 'Not marked — click to mark';
  const parts = [status.charAt(0).toUpperCase() + status.slice(1)];
  if (meta?.method) parts.push(METHOD_LABEL[meta.method] || meta.method);
  const inTime = formatTime(meta?.checkInTime);
  const outTime = formatTime(meta?.checkOutTime);
  if (inTime || outTime) {
    parts.push([inTime && `in ${inTime}`, outTime && `out ${outTime}`].filter(Boolean).join(', '));
  }
  return parts.join(' · ');
}

function DayCell({ status, meta, isToday, onClick, locked, lockedLabel }) {
  const m = STATUS_STYLE[status || 'none'];
  const dot = status && meta?.method ? METHOD_DOT[meta.method] : null;
  const button = (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      aria-label={locked ? `Cannot mark attendance — ${lockedLabel}` : dayCellTitle(status, meta)}
      className={cn(
        'relative flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-transform',
        m.cls,
        isToday && 'ring-2 ring-brand-500 ring-offset-1',
        locked ? 'cursor-not-allowed opacity-50' : 'hover:scale-110',
      )}
    >
      {m.icon}
      {dot && <span className={cn('absolute -right-0.5 -top-0.5 size-2 rounded-full border border-white', dot)} />}
    </button>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{locked ? `Cannot mark attendance — ${lockedLabel}` : dayCellTitle(status, meta)}</TooltipContent>
    </Tooltip>
  );
}

/** Read-only counterpart of DayCell for the "Check-In Times" toggle — plain
 * text, no status-colored circle (nothing to click: check-in times come from
 * geofence/biometric/admin data, not something marked here). */
function DayCheckInCell({ status, meta, isToday, locked, lockedLabel }) {
  const time = meta?.checkInTime ? formatTimeShort(meta.checkInTime) : null;
  const dot = status && meta?.method ? METHOD_DOT[meta.method] : null;
  const content = (
    <div
      className={cn(
        'relative mx-auto flex h-7 w-8 items-center justify-center rounded text-[9px] font-semibold leading-none text-surface-600',
        isToday && 'ring-1 ring-brand-400',
        locked && 'opacity-50',
      )}
    >
      {time || '–'}
      {dot && <span className={cn('absolute -right-0.5 -top-0.5 size-1.5 rounded-full border border-white', dot)} />}
    </div>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{locked ? `${lockedLabel} — attendance locked` : dayCellTitle(status, meta)}</TooltipContent>
    </Tooltip>
  );
}

function RadialStat({ percentage }) {
  const size = 52, strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#4f46e5" className="text-brand-600" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-black text-brand-600">{percentage}%</span>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-surface-400">{label}</p>
      <p className={cn('mt-1 text-xl font-black text-surface-950', tone)}>{value}</p>
    </div>
  );
}

export default function TeacherAttendance() {
  const [tab, setTab] = useState('grid');

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-955">Teacher Attendance</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-500">Mark each teacher's attendance and review their record.</p>
        </div>
        <div className="inline-flex flex-wrap rounded-lg border border-surface-200 bg-white p-1">
          {PAGE_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-bold transition-colors',
                tab === t.value ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-50',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'grid' && <MonthGridView />}
      {tab === 'records' && <TeacherAttendanceRecords />}
      {tab === 'settings' && <SettingsView />}
    </div>
  );
}

/** Month grid: one row per teacher, one column per day — click a day cell to cycle its status. */
function MonthGridView() {
  const t0 = todayParts();
  const [year, setYear] = useState(t0.year);
  const [month, setMonth] = useState(t0.month);
  const [date, setDate] = useState(t0.date);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, leave: 0, notMarked: 0, markedPercentage: 0 });
  const [departments, setDepartments] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dirty, setDirty] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [showCheckIn, setShowCheckIn] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teacher-attendance/month', {
        params: { year, month, date, search: search || undefined, department, status, page, limit },
      });
      const body = res?.data || {};
      setRows(body.data || []);
      setSummary(body.summary || {});
      setDepartments(body.departments || []);
      setHolidays(body.holidays || {});
      setDaysInMonth(body.daysInMonth || 30);
      setTotalPages(body.totalPages || 1);
      setTotal(body.total || 0);
      setDirty({});
      setSelected(new Set());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load teacher attendance');
    } finally {
      setLoading(false);
    }
  }, [year, month, date, search, department, status, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, department, status, year, month]);

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const todayDay = useMemo(() => {
    const t = todayParts();
    return (t.year === year && t.month === month) ? parseInt(date.slice(-2), 10) : null;
  }, [year, month, date]);

  const cellStatus = (row, day) => {
    const key = `${row.userId}:${day}`;
    return dirty[key]?.status !== undefined ? dirty[key].status : (row.days?.[day] ?? null);
  };

  /** "Monthly Total" columns — present (incl. late) / absent (incl. leave) / % for the currently loaded month. */
  const monthlyTotals = (row) => {
    let present = 0, absent = 0, marked = 0;
    for (const d of days) {
      const s = cellStatus(row, d);
      if (s === 'present' || s === 'late') { present++; marked++; }
      else if (s === 'absent' || s === 'leave') { absent++; marked++; }
    }
    return { present, absent, pct: marked > 0 ? Math.round((present / marked) * 100) : 0 };
  };

  const cycleCell = (row, day) => {
    if (lockReason(year, month, day, holidays)) return;
    const current = cellStatus(row, day);
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const key = `${row.userId}:${day}`;
    setDirty((d) => ({ ...d, [key]: { teacherUserId: row.userId, date: dateStr(year, month, day), status: next } }));
  };

  const toggleRow = (userId) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.userId))));
  };

  const markPresent = (targetRows) => {
    const dayNum = parseInt(date.slice(-2), 10);
    const reason = lockReason(year, month, dayNum, holidays);
    if (reason) { toast.error(`Cannot mark attendance — ${reason}`); return; }
    const next = { ...dirty };
    for (const row of targetRows) {
      next[`${row.userId}:${dayNum}`] = { teacherUserId: row.userId, date, status: 'present' };
    }
    setDirty(next);
  };
  const markAllPresent = () => markPresent(rows);
  const markSelectedPresent = () => {
    if (!selected.size) { toast.info('Select at least one teacher first'); return; }
    markPresent(rows.filter((r) => selected.has(r.userId)));
  };

  const saveAll = async () => {
    const entries = Object.values(dirty).filter((e) => e.status); // null = "clear" — no delete endpoint yet, skip
    if (!entries.length) { toast.info('Nothing to save'); return; }
    setSaving(true);
    try {
      await api.post('/teacher-attendance/bulk', { entries });
      toast.success(`Saved ${entries.length} change${entries.length > 1 ? 's' : ''}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const shiftMonth = (delta) => {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y -= 1; } else if (m > 12) { m = 1; y += 1; }
    setMonth(m); setYear(y);
  };

  const dirtyCount = Object.keys(dirty).length;

  if (loading && !rows.length) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total Teachers" value={summary.total ?? 0} />
        <StatCard label="Present" value={summary.present ?? 0} tone="text-emerald-600" />
        <StatCard label="Absent" value={summary.absent ?? 0} tone="text-red-600" />
        <StatCard label="Not Marked" value={summary.notMarked ?? 0} tone="text-amber-600" />
        <div className="rounded-lg border border-surface-200 bg-white p-4 shadow-sm flex items-center gap-3">
          <RadialStat percentage={summary.markedPercentage ?? 0} />
          <p className="text-xs font-bold text-surface-700">Attendance<br />marked</p>
        </div>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-56">
            <label className="mb-1 block text-xs font-semibold text-surface-700">Search</label>
            <Search className="pointer-events-none absolute left-3 top-[30px] size-4 text-surface-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teacher or employee ID"
              className="h-9 w-full rounded-lg border border-surface-200 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-semibold text-surface-700">Department</label>
            <CustomSelect
              value={department}
              onChange={setDepartment}
              options={[{ value: 'all', label: 'All departments' }, ...departments.map((d) => ({ value: d, label: d }))]}
              className="w-full"
              triggerClassName="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-surface-200 bg-white px-3 text-sm font-medium text-surface-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-semibold text-surface-700">Date</label>
            <input type="date" value={date} max={todayParts().date}
              onChange={(e) => { setDate(e.target.value); const d = new Date(e.target.value); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); }}
              className="h-9 w-full rounded-lg border border-surface-200 px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div className="flex h-9 items-center gap-1 rounded-lg border border-surface-200 px-1">
            <button type="button" onClick={() => shiftMonth(-1)} className="flex size-7 items-center justify-center rounded-md text-surface-500 hover:bg-surface-50"><ChevronLeft size={15} /></button>
            <span className="px-1 text-xs font-bold text-surface-700">{MONTH_NAMES[month - 1]} {year}</span>
            <button type="button" onClick={() => shiftMonth(1)} className="flex size-7 items-center justify-center rounded-md text-surface-500 hover:bg-surface-50"><ChevronRight size={15} /></button>
          </div>
          <div className="flex h-9 items-center gap-1 rounded-lg border border-surface-200 px-1">
            {STATUS_TABS.map((s) => (
              <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                className={cn('flex h-7 items-center rounded-md px-2.5 text-xs font-bold transition-colors',
                  status === s.value ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-50')}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex h-9 items-center gap-2 rounded-lg border border-surface-200 px-3">
            <LogIn size={14} className="text-surface-500" />
            <span className="text-xs font-bold text-surface-700">Check-In Times</span>
            <Switch checked={showCheckIn} onCheckedChange={setShowCheckIn} className="data-[state=checked]:bg-brand-600" />
          </div>
          <div className="ml-auto flex h-9 items-center gap-2">
            <button type="button" onClick={() => { const t = todayParts(); setDate(t.date); setYear(t.year); setMonth(t.month); }}
              className="flex h-9 items-center rounded-lg border border-surface-200 px-3 text-xs font-bold text-surface-700 hover:bg-surface-50">Today</button>
            {selected.size > 0 && (
              <button type="button" onClick={markSelectedPresent}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                <CheckSquare size={14} /> Mark {selected.size} Selected Present
              </button>
            )}
            <button type="button" onClick={markAllPresent}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
              <UserCheck size={14} /> Mark All Present
            </button>
            <button type="button" onClick={saveAll} disabled={saving || !dirtyCount}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving…' : `Save${dirtyCount ? ` (${dirtyCount})` : ''}`}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-50 text-surface-500">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead rowSpan={2} className="w-10 align-middle"><Checkbox checked={rows.length > 0 && selected.size === rows.length} onCheckedChange={toggleAll} /></TableHead>
                <TableHead rowSpan={2} className="w-10 align-middle font-semibold">#</TableHead>
                <TableHead rowSpan={2} className="min-w-[180px] align-middle font-semibold">Teacher</TableHead>
                <TableHead rowSpan={2} className="min-w-[110px] align-middle font-semibold">Department</TableHead>
                {days.map((d) => {
                  const reason = lockReason(year, month, d, holidays);
                  return (
                    <TableHead key={d} rowSpan={2} className={cn('w-8 px-1 text-center align-middle text-[10px]', reason && 'bg-surface-100', d === todayDay && 'bg-brand-50')}
                      title={reason ? `${reason} — attendance locked` : undefined}>
                      <div className={cn('font-bold', reason && 'text-surface-400')}>{d}</div>
                      <div className="text-surface-400">{DAY_LABELS[new Date(year, month - 1, d).getDay()]}</div>
                    </TableHead>
                  );
                })}
                <TableHead colSpan={3} className="border-l border-surface-200 text-center font-semibold">Monthly Total</TableHead>
              </TableRow>
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="border-l border-surface-200 text-center text-[11px] font-semibold">Present</TableHead>
                <TableHead className="text-center text-[11px] font-semibold">Absent</TableHead>
                <TableHead className="text-center text-[11px] font-semibold">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={days.length + 7} className="py-8 text-center text-surface-500">No teachers found.</TableCell></TableRow>
              )}
              {rows.map((row, i) => {
                const totals = monthlyTotals(row);
                return (
                  <TableRow key={row.userId} className={cn('hover:bg-surface-50', selected.has(row.userId) && 'bg-brand-50/40')}>
                    <TableCell><Checkbox checked={selected.has(row.userId)} onCheckedChange={() => toggleRow(row.userId)} /></TableCell>
                    <TableCell className="text-xs text-surface-500">{(page - 1) * limit + i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 shrink-0 rounded-full border border-surface-200 bg-surface-100">
                          <AvatarImage src={row.profileImage} alt={row.name} className="object-cover" />
                          <AvatarFallback className="rounded-full bg-brand-600/10 text-[11px] font-bold text-brand-700">
                            {(row.name || '?').slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-surface-950">{row.name}</div>
                          <div className="truncate text-xs text-surface-500">{row.email}{row.employeeId ? ` · ${row.employeeId}` : ''}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-surface-600">{row.department || '—'}</TableCell>
                    {days.map((d) => {
                      const reason = lockReason(year, month, d, holidays);
                      return (
                        <TableCell key={d} className={cn('px-1 text-center', reason && 'bg-surface-50', d === todayDay && 'bg-brand-50/40')}>
                          {showCheckIn ? (
                            <DayCheckInCell status={cellStatus(row, d)} meta={row.dayMeta?.[d]} isToday={d === todayDay} locked={!!reason} lockedLabel={reason} />
                          ) : (
                            <DayCell status={cellStatus(row, d)} meta={row.dayMeta?.[d]} isToday={d === todayDay}
                              onClick={() => cycleCell(row, d)} locked={!!reason} lockedLabel={reason} />
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="border-l border-surface-200 text-center">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">{totals.present}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-700">{totals.absent}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{totals.pct}%</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-surface-500">
            <span className="flex items-center gap-1.5"><span className="flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[10px] text-white">✓</span> Present</span>
            <span className="flex items-center gap-1.5"><span className="flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-[10px] text-white">✕</span> Absent</span>
            <span className="flex items-center gap-1.5"><span className="flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] text-white">✓</span> Late</span>
            <span className="flex items-center gap-1.5"><span className="flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[10px] text-white">–</span> Leave</span>
            <span className="flex items-center gap-1.5"><span className="flex size-4 items-center justify-center rounded-full bg-surface-100 text-[10px] text-surface-400">–</span> Not Marked</span>
            <span className="flex items-center gap-1.5"><span className="size-4 rounded bg-surface-100" /> Sunday / Holiday — locked</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-500" /> Self check-in (geofence)</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-fuchsia-500" /> Biometric device</span>
          </div>
          <DataTablePagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
        </div>
      </div>
    </div>
  );
}

/** Admin-only campus geofence + work-start settings. A teacher's "Check In"
 * button (Profile page) hard-fails with a clear error until these are set. */
function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    campusLatitude: '', campusLongitude: '', campusRadiusMeters: '',
    workStartTime: '09:00', workEndTime: '16:00', lateThresholdMinutes: '',
  });

  useEffect(() => {
    let cancelled = false;
    api.get('/teacher-attendance/settings')
      .then((res) => {
        if (cancelled) return;
        const d = res?.data?.data || {};
        setForm({
          campusLatitude: d.campusLatitude ?? '',
          campusLongitude: d.campusLongitude ?? '',
          campusRadiusMeters: d.campusRadiusMeters ?? '',
          workStartTime: d.workStartTime || '09:00',
          workEndTime: d.workEndTime || '16:00',
          lateThresholdMinutes: d.lateThresholdMinutes ?? '',
        });
      })
      .catch((err) => { console.error(err); toast.error('Failed to load attendance settings'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation is not supported on this device.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, campusLatitude: pos.coords.latitude.toFixed(7), campusLongitude: pos.coords.longitude.toFixed(7) }));
        setLocating(false);
      },
      () => { toast.error('Could not get your location — allow location access and try again.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/teacher-attendance/settings', {
        campusLatitude: form.campusLatitude === '' ? null : parseFloat(form.campusLatitude),
        campusLongitude: form.campusLongitude === '' ? null : parseFloat(form.campusLongitude),
        campusRadiusMeters: form.campusRadiusMeters === '' ? null : parseInt(form.campusRadiusMeters, 10),
        workStartTime: form.workStartTime || '09:00',
        workEndTime: form.workEndTime || '16:00',
        lateThresholdMinutes: form.lateThresholdMinutes === '' ? null : parseInt(form.lateThresholdMinutes, 10),
      });
      toast.success('Attendance settings saved');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save attendance settings');
    } finally {
      setSaving(false);
    }
  };

  const configured = form.campusLatitude !== '' && form.campusLongitude !== '' && form.campusRadiusMeters !== '';

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-surface-100 p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <MapPin className="size-[18px]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-surface-950">Campus Geofence &amp; Self Check-In</h3>
          <p className="mt-0.5 text-xs text-surface-500">
            {configured
              ? 'Teachers can Check In from their Profile page while inside this radius.'
              : 'Not configured yet — teachers cannot use self Check In until a campus location and radius are set.'}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-surface-400">Latitude</label>
            <input type="number" step="0.0000001" value={form.campusLatitude} onChange={(e) => setForm((f) => ({ ...f, campusLatitude: e.target.value }))}
              placeholder="12.9716000" className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-surface-400">Longitude</label>
            <input type="number" step="0.0000001" value={form.campusLongitude} onChange={(e) => setForm((f) => ({ ...f, campusLongitude: e.target.value }))}
              placeholder="77.5946000" className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-surface-400">Radius (meters)</label>
            <input type="number" min="1" value={form.campusRadiusMeters} onChange={(e) => setForm((f) => ({ ...f, campusRadiusMeters: e.target.value }))}
              placeholder="100" className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>

        <button type="button" onClick={useCurrentLocation} disabled={locating}
          className="flex w-fit items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-bold text-surface-700 hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-50">
          <LocateFixed className="size-3.5" /> {locating ? 'Locating…' : 'Use my current location'}
        </button>

        <div className="border-t border-surface-100" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-surface-400">Work start time</label>
            <input type="time" value={form.workStartTime} onChange={(e) => setForm((f) => ({ ...f, workStartTime: e.target.value }))}
              className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-surface-400">Work end time</label>
            <input type="time" value={form.workEndTime} onChange={(e) => setForm((f) => ({ ...f, workEndTime: e.target.value }))}
              className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-surface-400">Late grace period (minutes)</label>
            <input type="number" min="0" value={form.lateThresholdMinutes} onChange={(e) => setForm((f) => ({ ...f, lateThresholdMinutes: e.target.value }))}
              placeholder="15" className="w-full rounded-lg border border-surface-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>
        <p className="text-xs text-surface-400">Defaults to the standard school day, 9:00 AM – 4:00 PM, for every institute until changed here.</p>
      </div>
      <div className="flex justify-end border-t border-surface-100 p-4">
        <button type="button" onClick={save} disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Save className="size-3.5" /> {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
