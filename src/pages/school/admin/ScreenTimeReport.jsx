import React, { useEffect, useState } from 'react';
import { Clock, Users, Search } from 'lucide-react';
import api from '@/lib/api/school-client';
import { handleApiError } from '@/lib/school/errorHandler';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { formatDurationShort } from '@/lib/format';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'PARENT', label: 'Parents' },
  { value: 'INSTITUTE_ADMIN', label: 'Admins' },
  { value: 'STAFF', label: 'Staff' },
];

export default function ScreenTimeReport() {
  const [range, setRange] = useState('week');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchReport() {
      setLoading(true);
      try {
        const params = { range, ...(role ? { role } : {}) };
        const res = await api.get('/screen-time/institute-report', { params });
        const data = res.data?.data ?? res.data ?? {};
        if (!cancelled) setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (error) {
        if (!cancelled) handleApiError(error, 'Failed to load the screen time report');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchReport();
    return () => { cancelled = true; };
  }, [range, role]);

  const filtered = users.filter((u) =>
    !search.trim() || (u.name || '').toLowerCase().includes(search.trim().toLowerCase())
    || (u.email || '').toLowerCase().includes(search.trim().toLowerCase()));

  const totalSeconds = filtered.reduce((sum, u) => sum + (u.totalSeconds || 0), 0);

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Clock className="size-8 text-blue-600 shrink-0" />
            <span>Time Spent in EDDVA</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Consolidated active-usage report, every user — students, teachers, parents, and staff.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mb-5">
        <div className="glass-premium rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Users Tracked</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">{filtered.length}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">with any activity in range</p>
        </div>
        <div className="glass-premium rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Combined Time</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">{formatDurationShort(totalSeconds)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">across all tracked users</p>
        </div>
      </div>

      <div className="glass-premium rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(37,99,235,0.10)] bg-white/60 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40">
          <CustomSelect
            value={range}
            onChange={setRange}
            options={RANGE_OPTIONS}
            className="w-full sm:w-40"
            triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition"
          />
          <CustomSelect
            value={role}
            onChange={setRole}
            options={ROLE_OPTIONS}
            className="w-full sm:w-40"
            triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition"
          />
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">User</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Role</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Today</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">{RANGE_OPTIONS.find((r) => r.value === range)?.label}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-slate-400">
                    <Users className="mx-auto mb-2 size-8 text-slate-300" />
                    No screen-time activity recorded for this range yet.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.userId} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {(u.role || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">{formatDurationShort(u.todaySeconds)}</td>
                    <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400">{formatDurationShort(u.totalSeconds)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
