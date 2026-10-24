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

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <Badge
    variant="outline"
    className={active
      ? 'border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : 'border-transparent bg-red-500/10 text-red-600 dark:text-red-400'}
  >
    {active ? 'Active' : 'Inactive'}
  </Badge>
);

const StudentAvatar: React.FC<{ student: any }> = ({ student }) => (
  <Avatar className="size-8 shrink-0">
    {student.profileImage && <AvatarImage src={student.profileImage} alt={student.name} className="object-cover" />}
    <AvatarFallback className="bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
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
    <div className="flex items-center gap-2">
      <Progress value={pct} className="h-2 w-16 bg-slate-100 dark:bg-slate-800" indicatorClassName={attendanceTone(pct)} />
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{pct}%</span>
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
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <User className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Assigned Students</h1>
          <p className="text-sm text-slate-500">View and filter students in the classes assigned to you.</p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="gap-3 p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, roll no or enrollment no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:w-auto lg:shrink-0 lg:items-center">
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection('All'); }}>
                <SelectTrigger className="w-full lg:w-[150px]"><SelectValue /></SelectTrigger>
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
                <SelectTrigger className="w-full lg:w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sections</SelectItem>
                  {sectionOptions.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>{`Section ${sec.name}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'All' | 'Active' | 'Inactive')}>
                <SelectTrigger className="w-full lg:w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={resetFilters} className="shrink-0 px-2 text-slate-500 hover:text-slate-800 sm:col-span-3 lg:col-span-1">
                  <X className="mr-1 size-4" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className={`flex flex-col gap-4 p-4 pt-0 transition-opacity sm:p-6 sm:pt-0 ${isFetching && !loading ? 'opacity-60' : ''}`}>
          {loading ? (
            <div className="space-y-3 rounded-lg border border-slate-100 p-4 dark:border-slate-800">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="ml-auto h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 text-center text-slate-500 dark:border-slate-800">
              <Filter className="size-12 text-slate-300 dark:text-slate-700" />
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
                    className="cursor-pointer rounded-xl border-slate-200 p-4 shadow-none transition-colors hover:border-brand-400 dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <StudentAvatar student={student} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{student.name}</p>
                          <p className="text-xs text-slate-500">Roll {student.studentProfile?.rollNo || '-'}</p>
                        </div>
                      </div>
                      <Badge variant={student.isActive ? 'success' : 'error'} className="shrink-0">
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span>
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
                        <span className="font-medium">{student.attendancePct != null ? `${student.attendancePct}%` : '—'}</span>
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Tablet / desktop: table */}
              <div className="hidden overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 md:block">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase lg:px-6">Student</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase lg:px-6">Roll No</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase lg:px-6">Class/Section</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase lg:px-6">Attendance</TableHead>
                      <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase lg:px-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} onClick={() => openStudent(student.id)} className="cursor-pointer">
                        <TableCell className="px-4 py-3 lg:px-6">
                          <div className="flex items-center gap-3">
                            <StudentAvatar student={student} />
                            <span className="font-medium text-slate-900 dark:text-white">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-slate-600 dark:text-slate-400 lg:px-6">
                          {student.studentProfile?.rollNo || '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 lg:px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {student.studentProfile?.section?.class?.name || '-'}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">•</span>
                            <span className="text-slate-600 dark:text-slate-400">
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
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
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
