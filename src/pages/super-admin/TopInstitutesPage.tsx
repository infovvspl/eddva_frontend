import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Building2,
  GraduationCap,
  Users,
  Search,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';

// ─── Inline logo / badge helpers (no dependency on school Brand component) ────

function InstituteLogo({ institute, size = 'sm' }: { institute: any; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-sm';
  const initials = (institute?.name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  if (institute?.logoUrl || institute?.logo_url) {
    return (
      <img
        src={institute.logoUrl ?? institute.logo_url}
        alt={institute.name}
        className={`${dim} rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-700`}
      />
    );
  }

  const colors = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  ];
  const colorIdx = (institute?.name?.charCodeAt(0) ?? 0) % colors.length;

  return (
    <div
      className={`${dim} flex items-center justify-center rounded-xl font-bold ring-2 ring-slate-100 dark:ring-slate-700 ${colors[colorIdx]}`}
    >
      {initials || '?'}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? '').toLowerCase();
  const map: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800',
    inactive: 'bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-700',
    suspended: 'bg-red-50 text-red-600 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800',
    trial: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800',
    pending: 'bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 capitalize ${
        map[s] ?? map.inactive
      }`}
    >
      {status ?? 'Unknown'}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 ${className}`} />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TopInstitutesPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function loadInstitutes() {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/admin/tenants', {
        params: { limit: 1000 },
      });

      const data = res.data;
      const rawList: any[] = Array.isArray(data)
        ? data
        : data?.items ?? data?.data?.items ?? data?.data ?? [];

      const mappedList = rawList.map((item: any) => {
        const students = Number(
          item.totalStudents ?? item.total_students ?? item._count?.users ?? 0,
        );
        const teachers = Number(item.totalTeachers ?? item.total_teachers ?? 0);
        const admins   = Number(item.totalAdmins   ?? item.total_admins   ?? 0);
        const totalUsers = students + teachers + admins;

        return {
          ...item,
          tenantDomain: item.tenantDomain ?? item.tenant_domain,
          city: item.city,
          state: item.state,
          createdAt: item.createdAt ?? item.created_at,
          totalStudents: students,
          totalTeachers: teachers,
          totalAdmins: admins,
          totalUsers,
        };
      });

      mappedList.sort((a, b) => b.totalUsers - a.totalUsers);
      setList(mappedList);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.response?.data?.error ??
          'Unable to load coaching institutes.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstitutes();
  }, []);

  const filteredList = useMemo(
    () =>
      list.filter((inst) => {
        if (search && !inst.name?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [list, search],
  );

  const topThree     = useMemo(() => filteredList.slice(0, 3), [filteredList]);
  const remainingList = useMemo(() => filteredList.slice(3),   [filteredList]);

  // ─── Podium rank styling ───────────────────────────────────────────────────

  const rankBg = [
    'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
    'border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/20 dark:to-blue-950/20',
    'border-amber-600 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-900/10 dark:to-amber-950/10',
  ];
  const medalColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];

  const rankBadge = (rank: number) => {
    if (rank <= 3) {
      const cls =
        rank === 1
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          : rank === 2
          ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
          : 'bg-amber-200/50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-400';
      return (
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${cls}`}
        >
          {rank}
        </span>
      );
    }
    return <span className="text-sm font-bold text-slate-600 dark:text-slate-400">#{rank}</span>;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/super-admin')}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
              Top Institutes <Award className="h-7 w-7 text-amber-500" />
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Coaching institutes ranked by student enrollment and operational activity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadInstitutes}
            disabled={loading}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="relative lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search institutes…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-700 dark:focus:ring-indigo-950/40"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── Podium top 3 ────────────────────────────────────────────────────── */}
      {!loading && topThree.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {topThree.map((inst, index) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-3xl border-2 p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                rankBg[index] ?? 'border-slate-100 bg-white'
              }`}
              onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
            >
              {/* Rank badge */}
              <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white font-display text-xl font-bold shadow-sm dark:bg-slate-800">
                <span className={medalColors[index] ?? 'text-slate-500'}>#{index + 1}</span>
              </div>

              <div className="flex items-center gap-4">
                <InstituteLogo institute={inst} size="lg" />
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white truncate max-w-[180px]">
                    {inst.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    {inst.city ?? 'No city'}, {inst.state ?? 'No state'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800/50 text-center">
                <div>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {inst.totalStudents.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Students</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {inst.totalTeachers.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Faculty</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {inst.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Skeleton podium */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex flex-col items-center gap-1">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-2 w-14" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Full ranked table ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 dark:bg-slate-900/50">
                <th className="p-4 pl-6 w-20">Rank</th>
                <th className="p-4">Institute</th>
                <th className="p-4">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> Students
                  </span>
                </th>
                <th className="p-4">Faculty</th>
                <th className="p-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Total Users
                  </span>
                </th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">
                  <span className="flex items-center justify-end gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> Rank
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="p-4 pl-6"><Skeleton className="h-6 w-8" /></td>
                    <td className="p-4"><Skeleton className="h-10 w-60" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4 pr-6 text-right"><Skeleton className="ml-auto h-6 w-14" /></td>
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-semibold text-slate-500">
                      {search ? 'No institutes match your search.' : 'No institutes found.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => {
                  const displayRank = index + 1;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.4) }}
                      onClick={() => navigate(`/super-admin/tenants/${item.id}`)}
                      className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40"
                    >
                      <td className="p-4 pl-6">{rankBadge(displayRank)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <InstituteLogo institute={item} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-950 dark:text-white truncate max-w-[200px]">
                              {item.name}
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                              {item.city ?? 'No city'}, {item.state ?? 'No state'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {item.totalStudents.toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {item.totalTeachers.toLocaleString()}
                      </td>
                      <td className="p-4 font-display text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {item.totalUsers.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <TrendingUp className="h-3 w-3" />
                          #{displayRank}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {!loading && filteredList.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500">
              {filteredList.length} institute{filteredList.length !== 1 ? 's' : ''} ranked
            </p>
            <button
              onClick={() => navigate('/super-admin/tenants')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60"
            >
              <Building2 className="h-3.5 w-3.5" />
              Manage All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
