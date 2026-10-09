import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, GraduationCap, Users, BookOpen, Search, ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { InstituteLogo, SchoolLogo, StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';


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
            className="grid size-10 place-items-center rounded-lg border border-surface-200 bg-white text-surface-600 transition hover:bg-surface-50 active:scale-95 dark:border-surface-800 dark:bg-slate-900 dark:text-slate-400"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold text-surface-950 dark:text-white flex items-center gap-2">
              Top Institutes <Award className="size-7 text-amber-500" />
            </h1>
            <p className="text-sm font-medium text-surface-500">
              Coaching institutes ranked by student enrollment and operational activity.
            </p>
          </div>
        </div>

        <div className="relative lg:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-surface-400" />
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
                <div className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white font-display text-xl font-bold shadow-sm dark:bg-slate-800">
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

      <div className="glass-panel overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="w-full text-left">
            <TableHeader>
              <TableRow className="bg-surface-50 text-xs font-bold uppercase text-surface-500 dark:bg-slate-900/50 hover:bg-surface-50 dark:hover:bg-slate-900/50 border-b-0">
                <TableHead className="h-auto p-4 pl-6 w-20 text-surface-500">Rank</TableHead>
                <TableHead className="h-auto p-4 text-surface-500">Institute</TableHead>
                <TableHead className="h-auto p-4 text-surface-500">Students</TableHead>
                <TableHead className="h-auto p-4 text-surface-500">Teachers</TableHead>
                <TableHead className="h-auto p-4 text-surface-500">Parents</TableHead>
                <TableHead className="h-auto p-4 text-surface-500">Total Users</TableHead>
                <TableHead className="h-auto p-4 text-surface-500">Status</TableHead>
                <TableHead className="h-auto p-4 text-right pr-6 text-surface-500">Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-t border-surface-100 dark:border-slate-800 border-b-0 hover:bg-transparent">
                    <TableCell className="p-4 pl-6"><Skeleton className="h-6 w-8" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-11 w-64" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="p-4"><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="p-4 text-right pr-6"><Skeleton className="ml-auto h-6 w-12" /></TableCell>
                  </TableRow>
                ))
              ) : filteredList.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan="8" className="p-10 text-center text-sm font-semibold text-surface-500">
                    No top performing institutes found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item, index) => {
                  const displayRank = index + 1;
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => navigate('/school/admin/institutes')}
                      className="cursor-pointer border-t border-surface-100 border-b-0 transition hover:bg-surface-50 dark:border-slate-800 dark:hover:bg-slate-900/40"
                    >
                      <TableCell className="p-4 pl-6 font-display text-sm font-bold text-surface-900 dark:text-slate-200">
                        {displayRank <= 3 ? (
                          <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                            displayRank === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            displayRank === 2 ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                            'bg-amber-200/50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}>
                            {displayRank}
                          </span>
                        ) : (
                          `#${displayRank}`
                        )}
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-center gap-3">
                          <SchoolLogo src={item.logo} alt={item.name} size="navbar" />
                          <div>
                            <p className="font-bold text-surface-950 dark:text-white">{item.name}</p>
                            <p className="text-xs font-medium text-surface-500">
                              {item.city || 'No city'}, {item.state || 'No state'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-sm font-bold text-surface-700 dark:text-slate-300">
                        {item.totalStudents.toLocaleString()}
                      </TableCell>
                      <TableCell className="p-4 text-sm font-bold text-surface-700 dark:text-slate-300">
                        {item.totalTeachers.toLocaleString()}
                      </TableCell>
                      <TableCell className="p-4 text-sm font-bold text-surface-700 dark:text-slate-300">
                        {item.totalParents.toLocaleString()}
                      </TableCell>
                      <TableCell className="p-4 text-sm font-display font-extrabold text-blue-600 dark:text-blue-400">
                        {item.totalUsers.toLocaleString()}
                      </TableCell>
                      <TableCell className="p-4">
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="p-4 text-right pr-6">
                        <Badge variant="secondary" className="items-center gap-1 rounded-full border-transparent text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                          <TrendingUp className="size-3" />
                          High
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : filteredList.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-surface-500">
              No top performing institutes found.
            </div>
          ) : (
            filteredList.map((item, index) => {
              const displayRank = index + 1;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate('/school/admin/institutes')}
                  className="p-4 hover:bg-surface-50 cursor-pointer space-y-3 dark:hover:bg-slate-900/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 font-display text-sm font-bold text-surface-900 dark:text-slate-200">
                        {displayRank <= 3 ? (
                          <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                            displayRank === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            displayRank === 2 ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                            'bg-amber-200/50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}>
                            {displayRank}
                          </span>
                        ) : (
                          `#${displayRank}`
                        )}
                      </div>
                      <SchoolLogo src={item.logo} alt={item.name} size="navbar" />
                      <div className="min-w-0">
                        <p className="font-bold text-surface-950 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs font-medium text-surface-500 truncate">
                          {item.city || 'No city'}, {item.state || 'No state'}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-surface-500">
                    <Badge variant="secondary" className="rounded-full border-transparent bg-slate-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                      Students: {item.totalStudents.toLocaleString()}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full border-transparent bg-slate-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                      Teachers: {item.totalTeachers.toLocaleString()}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full border-transparent bg-slate-100 dark:bg-slate-800 text-surface-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                      Parents: {item.totalParents.toLocaleString()}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full border-transparent bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30">
                      Total: {item.totalUsers.toLocaleString()}
                    </Badge>
                    <Badge variant="secondary" className="items-center gap-1 rounded-full border-transparent text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                      <TrendingUp className="size-3" />
                      High Growth
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
