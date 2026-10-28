import React, { useEffect, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatDuration, formatDurationShort } from '@/lib/format';
import api from '@/lib/api/school-client';
import ActivityCategoryBreakdown from '@/components/school/shared/ActivityCategoryBreakdown';

/**
 * One user's full screen-time detail — stat cards, week/month/year charts,
 * and the per-category time-open-vs-verified-engagement breakdown. Shared by
 * the admin's student profile and teacher profile "Screen Time" tabs (the
 * underlying endpoints — /screen-time/user/:id* and /activity/user/:id — are
 * role-agnostic already, so this needs nothing teacher- or student-specific
 * beyond the id). Fetches on mount, so the caller should only render this
 * while its tab is actually active.
 */
export default function UserScreenTimeTab({ userId }) {
  const [view, setView] = useState('week');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const currentAcademicYear = currentMonthIndex >= 3 ? currentYear : currentYear - 1;
  const [year, setYear] = useState(currentAcademicYear);

  const [week, setWeek] = useState({ loading: true, todaySeconds: 0, totalSeconds: 0, days: [] });
  const [monthData, setMonthData] = useState({ loading: true, totalSeconds: 0, days: [] });
  const [yearData, setYearData] = useState({ loading: true, totalSeconds: 0, months: [] });
  const [activity, setActivity] = useState({ loading: true, byCategory: [] });
  const [showCategory, setShowCategory] = useState(false);
  // The "Category" toggle always reflects whichever range pill is currently
  // selected above it, rather than being its own fixed range.
  const activityRange = view === 'today' ? 'today' : view === 'calendar' ? 'month' : view === 'year' ? 'year' : 'week';
  const activityRangeLabel = view === 'today' ? 'today' : view === 'calendar' ? 'this month' : view === 'year' ? 'this year' : 'this week';

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setWeek((prev) => ({ ...prev, loading: true }));
    api.get(`/screen-time/user/${userId}`, { params: { range: 'week' } })
      .then((res) => {
        if (cancelled) return;
        const body = res.data?.data ?? res.data ?? {};
        setWeek({
          loading: false,
          todaySeconds: Number(body.todaySeconds) || 0,
          totalSeconds: Number(body.totalSeconds) || 0,
          days: Array.isArray(body.days) ? body.days : [],
        });
      })
      .catch(() => { if (!cancelled) setWeek({ loading: false, todaySeconds: 0, totalSeconds: 0, days: [] }); });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setMonthData((prev) => ({ ...prev, loading: true }));
    api.get(`/screen-time/user/${userId}/month`, { params: { month } })
      .then((res) => {
        if (cancelled) return;
        const body = res.data?.data ?? res.data ?? {};
        setMonthData({
          loading: false,
          totalSeconds: Number(body.totalSeconds) || 0,
          days: Array.isArray(body.days) ? body.days : [],
        });
      })
      .catch(() => { if (!cancelled) setMonthData({ loading: false, totalSeconds: 0, days: [] }); });
    return () => { cancelled = true; };
  }, [userId, month]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setYearData((prev) => ({ ...prev, loading: true }));
    api.get(`/screen-time/user/${userId}/year`, { params: { year } })
      .then((res) => {
        if (cancelled) return;
        const body = res.data?.data ?? res.data ?? {};
        setYearData({
          loading: false,
          totalSeconds: Number(body.totalSeconds) || 0,
          months: Array.isArray(body.months) ? body.months : [],
        });
      })
      .catch(() => { if (!cancelled) setYearData({ loading: false, totalSeconds: 0, months: [] }); });
    return () => { cancelled = true; };
  }, [userId, year]);

  useEffect(() => {
    if (!userId || !showCategory) return;
    let cancelled = false;
    setActivity({ loading: true, byCategory: [] });
    api.get(`/activity/user/${userId}`, { params: { range: activityRange } })
      .then((res) => {
        if (cancelled) return;
        const body = res.data?.data ?? res.data ?? {};
        setActivity({ loading: false, byCategory: Array.isArray(body.byCategory) ? body.byCategory : [] });
      })
      .catch(() => { if (!cancelled) setActivity({ loading: false, byCategory: [] }); });
    return () => { cancelled = true; };
  }, [userId, activityRange, showCategory]);

  const activeDays = monthData.days.filter((d) => d.activeSeconds > 0);
  const dailyAverage = activeDays.length > 0 ? Math.round(monthData.totalSeconds / activeDays.length) : 0;
  const mostActive = monthData.days.reduce(
    (best, d) => (d.activeSeconds > (best?.activeSeconds ?? -1) ? d : best),
    null,
  );

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">Screen Time</h3>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
          <div className="text-xl sm:text-3xl font-bold tracking-tight mb-1 text-blue-600 dark:text-blue-400">
            {week.loading ? <Loader2 size={20} className="mx-auto animate-spin" /> : formatDurationShort(week.todaySeconds)}
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</div>
        </div>
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 text-center text-indigo-600 dark:text-indigo-400">
          <div className="text-xl sm:text-3xl font-bold tracking-tight mb-1">
            {week.loading ? <Loader2 size={20} className="mx-auto animate-spin" /> : formatDurationShort(week.totalSeconds)}
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">This Week</div>
        </div>
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-violet-500/10 border border-violet-500/20 text-center text-violet-600 dark:text-violet-400">
          <div className="text-xl sm:text-3xl font-bold tracking-tight mb-1">
            {monthData.loading ? <Loader2 size={20} className="mx-auto animate-spin" /> : formatDurationShort(monthData.totalSeconds)}
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">This Month</div>
        </div>
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-amber-500/10 border border-amber-500/20 text-center text-amber-600 dark:text-amber-400">
          <div className="text-xl sm:text-3xl font-bold tracking-tight mb-1">
            {monthData.loading ? <Loader2 size={20} className="mx-auto animate-spin" /> : formatDurationShort(dailyAverage)}
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Daily Avg</div>
        </div>
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-600 dark:text-emerald-400">
          <div className="text-xl sm:text-3xl font-bold tracking-tight mb-1">
            {monthData.loading ? (
              <Loader2 size={20} className="mx-auto animate-spin" />
            ) : mostActive && mostActive.activeSeconds > 0 ? (
              new Date(`${mostActive.date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
            ) : '—'}
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Most Active</div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900/50 p-1">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'calendar', label: 'By Month' },
            { id: 'year', label: 'Annually' },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                view === v.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowCategory((v) => !v)}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
            showCategory
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-900/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Category
        </button>
      </div>

      {showCategory ? null : view === 'today' ? (
        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <div className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {week.loading ? <Loader2 size={28} className="mx-auto animate-spin" /> : formatDurationShort(week.todaySeconds)}
          </div>
          <div className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Active today</div>
        </div>
      ) : view === 'week' ? (
        week.loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : week.days.every((d) => !d.activeSeconds) ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400 font-bold">
            No screen time recorded this week yet.
          </div>
        ) : (
          <div className="h-56 w-full rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <ChartContainer config={{ seconds: { label: 'Active time', color: 'hsl(var(--primary))' } }} className="h-full w-full aspect-auto">
              <AreaChart
                data={week.days.map((d) => ({
                  name: new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
                  seconds: d.activeSeconds,
                }))}
                margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="userScreenTimeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-seconds)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-seconds)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatDurationShort(Number(v))} width={48} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatDuration(Number(v)) ?? '0s'} />} />
                <Area
                  dataKey="seconds"
                  type="monotone"
                  stroke="var(--color-seconds)"
                  strokeWidth={2.5}
                  fill="url(#userScreenTimeFill)"
                  dot={{ r: 3, fill: 'var(--color-seconds)' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )
      ) : view === 'calendar' ? (
        <>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                const [y, m] = month.split('-');
                setMonth(`${parseInt(y, 10) - 1}-${m}`);
              }}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              aria-label="Previous year"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-xl border-2 border-slate-100 dark:border-slate-700 px-3 py-2 text-sm font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                const [y, m] = month.split('-');
                const nextYear = parseInt(y, 10) + 1;
                if (nextYear > currentYear) return;
                setMonth(`${nextYear}-${m}`);
              }}
              disabled={parseInt(month.split('-')[0], 10) >= currentYear}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Next year"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {monthData.loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : (() => {
            const byDate = new Map(monthData.days.map((d) => [d.date, d.activeSeconds]));
            const maxSeconds = Math.max(1, ...monthData.days.map((d) => d.activeSeconds));

            const [yearStr, monthStr] = month.split('-');
            const y = parseInt(yearStr, 10);
            const monthIndex = parseInt(monthStr, 10) - 1;
            const daysInMonth = new Date(y, monthIndex + 1, 0).getDate();
            const firstDayIndex = new Date(y, monthIndex, 1).getDay();

            const calendarCells = [];
            for (let i = 0; i < firstDayIndex; i++) calendarCells.push({ dayNum: null, dateStr: '', activeSeconds: 0 });
            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${y}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              calendarCells.push({ dayNum: d, dateStr, activeSeconds: byDate.get(dateStr) ?? 0 });
            }

            return (
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs sm:text-sm font-black uppercase text-slate-400 py-2">{d}</div>
                ))}
                {calendarCells.map((cell, i) => {
                  if (cell.dayNum === null) return <div key={i} className="aspect-square" />;
                  const intensity = cell.activeSeconds / maxSeconds;
                  const bg =
                    cell.activeSeconds === 0 ? 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-300 dark:text-slate-600' :
                    intensity > 0.66 ? 'border-blue-200 bg-blue-100 text-blue-800' :
                    intensity > 0.33 ? 'border-blue-100 bg-blue-50 text-blue-700' :
                    'border-blue-50 bg-blue-50/50 text-blue-600';
                  return (
                    <div
                      key={cell.dateStr}
                      title={cell.activeSeconds > 0 ? (formatDuration(cell.activeSeconds) ?? '') : 'No activity'}
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-base sm:text-lg font-bold ${bg}`}
                    >
                      {cell.dayNum}
                      {cell.activeSeconds > 0 && (
                        <span className="mt-0.5 text-xs sm:text-sm font-bold">{formatDurationShort(cell.activeSeconds)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </>
      ) : (
        <>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              aria-label="Previous year"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="rounded-xl border-2 border-slate-100 dark:border-slate-700 px-3 py-2 text-sm font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900">{year}-{String((year + 1) % 100).padStart(2, '0')}</span>
            <button
              type="button"
              onClick={() => setYear((y) => Math.min(currentAcademicYear, y + 1))}
              disabled={year >= currentAcademicYear}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Next year"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {yearData.loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
          ) : yearData.months.every((m) => !m.activeSeconds) ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400 font-bold">
              No screen time recorded in {year}-{String((year + 1) % 100).padStart(2, '0')}.
            </div>
          ) : (() => {
            const peakMonth = yearData.months.reduce(
              (best, m) => (m.activeSeconds > (best?.activeSeconds ?? -1) ? m : best),
              null,
            );
            const yearChartData = yearData.months.map((m) => ({
              name: new Date(m.year, m.month - 1, 1).toLocaleDateString(undefined, { month: 'short' }),
              seconds: m.activeSeconds,
              isPeak: !!peakMonth && peakMonth.activeSeconds > 0 && m.month === peakMonth.month && m.year === peakMonth.year,
            }));
            return (
              <>
                <div className="h-56 w-full rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <ChartContainer config={{ seconds: { label: 'Active time', color: 'hsl(var(--primary))' } }} className="h-full w-full aspect-auto">
                    <AreaChart data={yearChartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userScreenTimeYearFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-seconds)" stopOpacity={0.5} />
                          <stop offset="65%" stopColor="var(--color-seconds)" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="var(--color-seconds)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatDurationShort(Number(v))} width={48} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatDuration(Number(v)) ?? '0s'} />} />
                      <Area
                        dataKey="seconds"
                        type="monotone"
                        stroke="var(--color-seconds)"
                        strokeWidth={3}
                        fill="url(#userScreenTimeYearFill)"
                        dot={(props) => {
                          const { cx, cy, payload, key } = props;
                          return payload.isPeak ? (
                            <circle key={key} cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
                          ) : (
                            <circle key={key} cx={cx} cy={cy} r={3} fill="var(--color-seconds)" />
                          );
                        }}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
                {peakMonth && peakMonth.activeSeconds > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Peak month: {new Date(peakMonth.year, peakMonth.month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · {formatDurationShort(peakMonth.activeSeconds)}
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      {showCategory && (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase tracking-widest">
              By Category ({activityRangeLabel})
            </h4>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Time open alongside what the data actually shows they did — not every page has something to verify.
            </p>
          </div>
          <ActivityCategoryBreakdown
            byCategory={activity.byCategory}
            loading={activity.loading}
            emptyLabel={`No category activity recorded ${activityRangeLabel} yet.`}
          />
        </div>
      )}
    </div>
  );
}
