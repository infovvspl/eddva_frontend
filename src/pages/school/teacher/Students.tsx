import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, User, Filter, X } from 'lucide-react';
import api from '@/lib/api/school-client';
import Badge from '@/components/school/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from "@/components/ui/CustomSelect";
import GlassCard from '@/components/school/GlassCard';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

const Students: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedClass, selectedSection, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', { params: { limit: 'all' } });
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

  const paginatedStudents = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredStudents.slice(startIndex, startIndex + limit);
  }, [filteredStudents, page, limit]);

  const total = filteredStudents.length;
  const totalPages = Math.ceil(total / limit) || 1;

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

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Assigned Students</h1>
          <p className="text-sm text-slate-500">View and filter students in the classes assigned to you.</p>
        </div>
      </div>

      <GlassCard className="p-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, roll no, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-brand-500"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:flex sm:flex-row gap-2 items-center w-full md:w-auto shrink-0">
            <CustomSelect
              onChange={setSelectedClass}
              value={selectedClass}
              options={uniqueClasses.map((c) => ({ value: c, label: c === 'All' ? 'All Classes' : (c.toLowerCase().startsWith('class') ? c : `Class ${c}`) }))}
              className="w-full md:w-[150px]"
            />

            <CustomSelect
              onChange={setSelectedSection}
              value={selectedSection}
              options={uniqueSections.map((s) => ({ value: s, label: s === 'All' ? 'All Sections' : `Section ${s}` }))}
              className="w-full md:w-[150px]"
            />

            <CustomSelect
              onChange={setStatusFilter}
              value={statusFilter}
              options={[
                { value: "All", label: "All Status" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              className="w-full md:w-[130px]"
            />

            {(searchQuery || selectedClass !== 'All' || selectedSection !== 'All' || statusFilter !== 'All') && (
              <Button variant="ghost" onClick={resetFilters} className="px-2 text-slate-500 hover:text-slate-800 shrink-0">
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : paginatedStudents.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center min-h-[300px] text-slate-500 gap-3">
              <Filter className="h-12 w-12 text-slate-300 dark:text-slate-700" />
              <p>No students found matching your criteria</p>
              <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Roll No</th>
                  <th className="px-6 py-4 font-semibold">Class/Section</th>
                  <th className="px-6 py-4 font-semibold">Attendance</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {student.profileImage ? (
                            <img src={student.profileImage} alt={student.name} className="h-full w-full object-cover" />
                          ) : (
                            student.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {student.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {student.studentProfile?.rollNo || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {student.studentProfile?.section?.class?.name || '-'}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">•</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          Sec {student.studentProfile?.section?.name || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              student.attendancePct >= 75 ? 'bg-emerald-500' : 
                              student.attendancePct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${student.attendancePct || 85}%` }} 
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {student.attendancePct || 85}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={student.isActive ? 'success' : 'error'}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredStudents.length > 0 && (
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
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
      </GlassCard>
    </div>
  );
};

export default Students;
