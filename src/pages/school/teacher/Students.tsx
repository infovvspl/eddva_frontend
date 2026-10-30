import React, { useState, useEffect, useMemo } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, User, Filter, X } from 'lucide-react';
import api from '@/lib/api/school-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

const attendanceTone = (pct: number) => (pct >= 75 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500');
const attendanceText = (pct: number) => (pct >= 75 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600');

// A steady gradient per student (by name) so the list is easy to scan.
const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600 shadow-blue-500/30',
  'from-violet-500 to-purple-600 shadow-violet-500/30',
  'from-emerald-500 to-teal-600 shadow-emerald-500/30',
  'from-orange-400 to-orange-600 shadow-orange-500/30',
  'from-rose-500 to-pink-600 shadow-rose-500/30',
  'from-sky-400 to-cyan-600 shadow-sky-500/30',
];
const avatarGradient = (name?: string) => {
  const key = String(name || '?');
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
};

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <Badge
    variant="outline"
    className={`gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${active
      ? 'border-transparent bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30'
      : 'border-transparent bg-red-50 text-red-600 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30'}`}
  >
    <span className={`size-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500'}`} />
    {active ? 'Active' : 'Inactive'}
  </Badge>
);

const StudentAvatar: React.FC<{ student: any }> = ({ student }) => (
  <Avatar className="size-9 shrink-0 shadow-md ring-2 ring-white dark:ring-slate-900">
    {student.profileImage && <AvatarImage src={student.profileImage} alt={student.name} className="object-cover" />}
    <AvatarFallback className={`bg-gradient-to-br text-xs font-bold text-white ${avatarGradient(student.name)}`}>
      {student.name?.charAt(0).toUpperCase()}
    </AvatarFallback>
  </Avatar>
);

const AttendanceBar: React.FC<{ student: any }> = ({ student }) => {
  if (student.attendancePct == null) {
    return <span className="text-xs font-medium text-slate-400">—</span>;
  }
  const pct = student.attendancePct;
  return (
    <div className="flex items-center gap-2.5">
      <Progress value={pct} className="h-2 w-20 bg-slate-100 dark:bg-slate-800" indicatorClassName={attendanceTone(pct)} />
      <span className={`text-xs font-bold ${attendanceText(pct)}`}>{pct}%</span>
    </div>
  );
};

type ClassOption = { id: string; name: string; sections: { id: string; name: string }[] };

const useDebounced = <T,>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const Students: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const search = useDebounced(searchQuery.trim());

  // Filters (class / section are ids so the server can filter on them)
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [search, selectedClass, selectedSection, statusFilter, limit]);

  const fetchPage = async (pageNo: number) => {
    const res = await api.get('/students', {
      params: {
        page: pageNo,
        limit,
        ...(search && { search }),
        ...(selectedClass !== 'All' && { classId: selectedClass }),
        ...(selectedSection !== 'All' && { sectionId: selectedSection }),
        ...(statusFilter !== 'All' && { status: statusFilter.toLowerCase() }),
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data as { data: any[]; total: number; totalPages: number };
  };
  const listKey = (pageNo: number) =>
    ['teacher-students', { pageNo, limit, search, selectedClass, selectedSection, statusFilter }] as const;

  // Only the current page is fetched. The previous page stays on screen while the next one
  // loads, and visited pages are cached so paging back is instant.
  const { data: result, isLoading: loading, isFetching, isError } = useQuery({
    queryKey: listKey(page),
    queryFn: () => fetchPage(page),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const students = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages || 1;

  // Warm the next page in the background so "Next" feels instant.
  useEffect(() => {
    if (page < totalPages) {
      queryClient.prefetchQuery({ queryKey: listKey(page + 1), queryFn: () => fetchPage(page + 1), staleTime: 60_000 });
    }
  }, [page, totalPages, result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Class / section dropdown options come from their own tiny query, not from the student list.
  const { data: classOptions = [] } = useQuery({
    queryKey: ['teacher-students-filters'],
    queryFn: async () => (await api.get('/students/filters')).data?.data?.classes as ClassOption[],
    staleTime: 5 * 60_000,
  });
  const sectionOptions = useMemo(
    () => (selectedClass === 'All'
      ? classOptions.flatMap((c) => c.sections)
      : classOptions.find((c) => c.id === selectedClass)?.sections ?? []),
    [classOptions, selectedClass],
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClass('All');
    setSelectedSection('All');
    setStatusFilter('All');
  };

  const hasActiveFilters = searchQuery || selectedClass !== 'All' || selectedSection !== 'All' || statusFilter !== 'All';
  const openStudent = (id: string) => navigate(`/school/teacher/students/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
          <User className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Assigned Students</h1>
            {!loading && total > 0 && (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30">
                {total} {total === 1 ? 'student' : 'students'}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">View and filter students in the classes assigned to you.</p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-300 bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="gap-3 p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, roll no or enrollment no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-xl border-slate-300 bg-slate-50 pl-9 focus-visible:bg-white"
              />
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:w-auto lg:shrink-0 lg:items-center">
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection('All'); }}>
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-300 bg-slate-50 font-medium lg:w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Classes</SelectItem>
                  {classOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name.toLowerCase().startsWith('class') ? c.name : `Class ${c.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-300 bg-slate-50 font-medium lg:w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sections</SelectItem>
                  {sectionOptions.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>{`Section ${sec.name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'All' | 'Active' | 'Inactive')}>
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-300 bg-slate-50 font-medium lg:w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={resetFilters} className="h-10 shrink-0 rounded-xl px-3 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:col-span-3 lg:col-span-1">
                  <X className="mr-1 size-4" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className={`flex flex-col gap-4 p-4 pt-0 transition-opacity sm:p-6 sm:pt-0 ${isFetching && !loading ? 'opacity-60' : ''}`}>
          {loading ? (
            <div className="space-y-3 rounded-lg border border-slate-300 p-4 dark:border-slate-800">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="ml-auto h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 text-center font-medium text-slate-500 dark:border-slate-800">
              <span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-500/10"><Filter className="size-7" /></span>
              <p>{isError ? 'Could not load students. Please try again.' : 'No students found matching your criteria'}</p>
              <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>
            </div>
          ) : (
            <>
              {/* Mobile: one card per student */}
              <div className="flex flex-col gap-3 md:hidden">
                {students.map((student) => (
                  <Card
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openStudent(student.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openStudent(student.id); } }}
                    className="cursor-pointer rounded-xl border-slate-300 p-4 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StudentAvatar student={student} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">{student.name}</p>
                          <p className="text-xs font-medium text-slate-500">Roll {student.studentProfile?.rollNo || '-'}</p>
                        </div>
                      </div>
                      <StatusBadge active={!!student.isActive} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-300 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {student.studentProfile?.section?.class?.name || '-'} • Sec {student.studentProfile?.section?.name || '-'}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          {student.attendancePct != null && (
                            <span
                              className={`block h-full rounded-full ${
                                student.attendancePct >= 75 ? 'bg-emerald-500' :
                                student.attendancePct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${student.attendancePct}%` }}
                            />
                          )}
                        </span>
                        <span className={`font-bold ${student.attendancePct != null ? attendanceText(student.attendancePct) : ''}`}>{student.attendancePct != null ? `${student.attendancePct}%` : '—'}</span>
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Tablet / desktop: table */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-300 dark:border-slate-800 md:block">
                <Table>
                  <TableHeader className="border-b border-slate-300 bg-slate-50/80 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:px-6">Student</TableHead>
                      <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:px-6">Roll No</TableHead>
                      <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:px-6">Class/Section</TableHead>
                      <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:px-6">Attendance</TableHead>
                      <TableHead className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 lg:px-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} onClick={() => openStudent(student.id)} className="cursor-pointer border-slate-200 transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800/50">
                        <TableCell className="px-4 py-3 lg:px-6">
                          <div className="flex items-center gap-3">
                            <StudentAvatar student={student} />
                            <span className="font-semibold text-slate-900 dark:text-white">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 lg:px-6">
                          <span className="inline-flex min-w-8 justify-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {student.studentProfile?.rollNo || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 lg:px-6">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                              {student.studentProfile?.section?.class?.name || '-'}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              Sec {student.studentProfile?.section?.name || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 lg:px-6">
                          <AttendanceBar student={student} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right lg:px-6">
                          <StatusBadge active={!!student.isActive} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {total > 0 && (
            <div className="border-t border-slate-300 pt-4 dark:border-slate-800">
              <DataTablePagination
                page={page}
                limit={limit}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;
