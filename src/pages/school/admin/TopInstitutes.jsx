import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, GraduationCap, Users, BookOpen, Search, ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { InstituteLogo, SchoolLogo, StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';

export default function TopInstitutes() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function loadInstitutes() {
    try {
      setLoading(true);
      const res = await api.get('/institutes', {
        params: { perPage: 1000 },
      });

      const data = res.data?.data;
      const rawList = Array.isArray(data) ? data : (data?.items || res.data?.items || []);

      const mappedList = rawList.map((item) => {
        const students = Number(item.totalStudents ?? item.total_students ?? item._count?.users ?? 0);
        const teachers = Number(item.totalTeachers ?? item.total_teachers ?? 0);
        const parents = Number(item.totalParents ?? item.total_parents ?? 0);
        const admins = Number(item.totalAdmins ?? item.total_admins ?? 0);
        const totalUsers = students + teachers + parents + admins;

        return {
          ...item,
          tenantDomain: item.tenantDomain || item.tenant_domain,
          principalName: item.principalName || item.principal_name,
          city: item.city,
          state: item.state,
          createdAt: item.createdAt || item.created_at,
          totalStudents: students,
          totalTeachers: teachers,
          totalParents: parents,
          totalAdmins: admins,
          totalUsers: totalUsers,
        };
      });

      // Sort by totalUsers descending by default
      mappedList.sort((a, b) => b.totalUsers - a.totalUsers);
      setList(mappedList);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load institutes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstitutes();
  }, []);

  const filteredList = useMemo(() => {
    return list.filter((inst) => {
      if (search && !inst.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [list, search]);

  const topThree = useMemo(() => {
    return filteredList.slice(0, 3);
  }, [filteredList]);

  const remainingList = useMemo(() => {
    return filteredList.slice(3);
  }, [filteredList]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/school/admin')}
            className="grid h-10 w-10 place-items-center rounded-lg border border-surface-200 bg-white text-surface-600 transition hover:bg-surface-50 active:scale-95 dark:border-surface-800 dark:bg-slate-900 dark:text-slate-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold text-surface-950 dark:text-white flex items-center gap-2">
              Top Institutes <Award className="h-7 w-7 text-amber-500" />
            </h1>
            <p className="text-sm font-medium text-surface-500">
              Coaching institutes ranked by student enrollment and operational activity.
            </p>
          </div>
        </div>

        <div className="relative lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search top institutes..."
            className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100 dark:border-surface-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Podium for top 3 */}
      {!loading && topThree.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {topThree.map((inst, index) => {
            const rankColors = [
              'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
              'border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/20 dark:to-blue-950/20',
              'border-amber-600 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-900/10 dark:to-amber-950/10',
            ];
            const medalColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];

            return (
              <motion.div
                key={inst.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm ${rankColors[index] || 'border-slate-100 bg-white'}`}
              >
                <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white font-display text-xl font-bold shadow-sm dark:bg-slate-800">
                  <span className={medalColors[index] || 'text-slate-500'}>#{index + 1}</span>
                </div>

                <div className="flex items-center gap-4">
                  <SchoolLogo src={inst.logo} alt={inst.name} size="dashboard" />
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white truncate max-w-[180px]">
                      {inst.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {inst.city || 'No city'}, {inst.state || 'No state'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 dark:border-slate-800/50 text-center">
                  <div>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{inst.totalStudents}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Students</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{inst.totalTeachers}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Faculty</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{inst.totalUsers}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Users</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Main Table */}
      <div className="glass-panel overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500 dark:bg-slate-900/50">
                <th className="p-4 pl-6 w-20">Rank</th>
                <th className="p-4">Institute</th>
                <th className="p-4">Students</th>
                <th className="p-4">Teachers</th>
                <th className="p-4">Parents</th>
                <th className="p-4">Total Users</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Growth</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t border-surface-100 dark:border-slate-800">
                    <td className="p-4 pl-6"><Skeleton className="h-6 w-8" /></td>
                    <td className="p-4"><Skeleton className="h-11 w-64" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4 text-right pr-6"><Skeleton className="ml-auto h-6 w-12" /></td>
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-sm font-semibold text-surface-500">
                    No top performing institutes found.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => {
                  const displayRank = index + 1;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate('/school/admin/institutes')}
                      className="cursor-pointer border-t border-surface-100 transition hover:bg-surface-50 dark:border-slate-800 dark:hover:bg-slate-900/40"
                    >
                      <td className="p-4 pl-6 font-display text-sm font-bold text-surface-900 dark:text-slate-200">
                        {displayRank <= 3 ? (
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            displayRank === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            displayRank === 2 ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                            'bg-amber-200/50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}>
                            {displayRank}
                          </span>
                        ) : (
                          `#${displayRank}`
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <SchoolLogo src={item.logo} alt={item.name} size="navbar" />
                          <div>
                            <p className="font-bold text-surface-950 dark:text-white">{item.name}</p>
                            <p className="text-xs font-medium text-surface-500">
                              {item.city || 'No city'}, {item.state || 'No state'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-surface-700 dark:text-slate-300">
                        {item.totalStudents.toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-bold text-surface-700 dark:text-slate-300">
                        {item.totalTeachers.toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-bold text-surface-700 dark:text-slate-300">
                        {item.totalParents.toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-display font-extrabold text-blue-600 dark:text-blue-400">
                        {item.totalUsers.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-4 text-right pr-6">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                          <TrendingUp className="h-3 w-3" />
                          High
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
