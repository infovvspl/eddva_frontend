import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, User, Filter, X } from 'lucide-react';
import api from '@/lib/api/school-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface StudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  // Mock attendance fallback — replace with a real value once the API provides it
  const pct = student.attendancePct || 85;
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="h-2 w-16 bg-slate-100 dark:bg-slate-800" indicatorClassName={attendanceTone(student.attendancePct)} />
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{pct}%</span>
    </div>
  );
};

const StudentsModal: React.FC<StudentsModalProps> = ({ open, onOpenChange }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students');
      const data = res.data?.data || [];
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Status filter
      if (statusFilter === 'Active' && !student.isActive) return false;
      if (statusFilter === 'Inactive' && student.isActive) return false;

      // Class/Section filter
      const className = student.studentProfile?.section?.class?.name || '';
      const sectionName = student.studentProfile?.section?.name || '';

      if (selectedClass !== 'All' && className !== selectedClass) return false;
      if (selectedSection !== 'All' && sectionName !== selectedSection) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = student.name?.toLowerCase().includes(query);
        const rollMatch = student.studentProfile?.rollNo?.toLowerCase().includes(query);
        const classMatch = className.toLowerCase().includes(query);
        const sectionMatch = sectionName.toLowerCase().includes(query);

        if (!nameMatch && !rollMatch && !classMatch && !sectionMatch) {
          return false;
        }
      }

      return true;
    });
  }, [students, searchQuery, statusFilter, selectedClass, selectedSection]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set<string>();
    students.forEach(s => {
      const cName = s.studentProfile?.section?.class?.name;
      if (cName) classes.add(cName);
    });
    return ['All', ...Array.from(classes)];
  }, [students]);

  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    students.forEach(s => {
      const cName = s.studentProfile?.section?.class?.name;
      const sName = s.studentProfile?.section?.name;
      if (sName && (selectedClass === 'All' || cName === selectedClass)) {
        sections.add(sName);
      }
    });
    return ['All', ...Array.from(sections)];
  }, [students, selectedClass]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClass('All');
    setSelectedSection('All');
    setStatusFilter('All');
  };

  const hasActiveFilters = searchQuery || selectedClass !== 'All' || selectedSection !== 'All' || statusFilter !== 'All';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden bg-white p-0 dark:bg-slate-950 sm:rounded-2xl">
        <DialogHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 pr-12 text-left dark:border-slate-800 dark:bg-slate-900/50 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold leading-normal tracking-normal text-slate-800 dark:text-slate-100 sm:text-xl">
            <User className="size-5 text-brand-600" />
            Assigned Students
          </DialogTitle>
          <DialogDescription className="sr-only">Search and filter the students in your assigned classes.</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, roll no, class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50/50 pl-9 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:shrink-0 lg:items-center">
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection('All'); }}>
                <SelectTrigger className="w-full lg:w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map((c) => (
                    <SelectItem key={c} value={c}>{c === 'All' ? 'All Classes' : `Class ${c}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-full lg:w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueSections.map((s) => (
                    <SelectItem key={s} value={s}>{s === 'All' ? 'All Sections' : `Section ${s}`}</SelectItem>
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
                <Button variant="ghost" onClick={resetFilters} className="px-2 text-slate-500 hover:text-slate-800 sm:col-span-3 lg:col-span-1">
                  <X className="mr-1 size-4" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="min-h-[240px] flex-1 overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="ml-auto h-4 w-1/4" />
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex min-h-[260px] size-full flex-col items-center justify-center gap-3 text-center text-slate-500">
                <Filter className="size-12 text-slate-300 dark:text-slate-700" />
                <p>No students found matching your criteria</p>
                <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                {/* Phones: one card per student */}
                <div className="space-y-3 p-3 md:hidden">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="rounded-xl border-slate-200 p-4 shadow-none dark:border-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <StudentAvatar student={student} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-white">{student.name}</p>
                            <p className="text-xs text-slate-500">Roll {student.studentProfile?.rollNo || '-'}</p>
                          </div>
                        </div>
                        <StatusBadge active={!!student.isActive} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{student.studentProfile?.section?.class?.name || '-'}</span>
                          {' • '}Sec {student.studentProfile?.section?.name || '-'}
                        </span>
                        <AttendanceBar student={student} />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Tablet / desktop: table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/50">
                      <TableRow>
                        <TableHead className="px-4 py-3 text-xs font-semibold uppercase lg:px-6">Student</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold uppercase lg:px-6">Roll No</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold uppercase lg:px-6">Class/Section</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold uppercase lg:px-6">Attendance</TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase lg:px-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentsModal;
