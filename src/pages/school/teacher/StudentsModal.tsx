import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Loader2, User, Filter, X } from 'lucide-react';
import api from '@/lib/api/school-client';
import Badge from '@/components/school/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StudentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <User className="h-5 w-5 text-brand-600" />
            Assigned Students
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, roll no, class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-brand-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="flex h-10 w-full sm:w-auto items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
              >
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All Classes' : `Class ${c}`}</option>
                ))}
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="flex h-10 w-full sm:w-auto items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
              >
                {uniqueSections.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All Sections' : `Section ${s}`}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex h-10 w-full sm:w-auto items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              {(searchQuery || selectedClass !== 'All' || selectedSection !== 'All' || statusFilter !== 'All') && (
                <Button variant="ghost" onClick={resetFilters} className="px-2 text-slate-500 hover:text-slate-800">
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-lg border border-slate-100 dark:border-slate-800">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              </div>
            ) : filteredStudents.length === 0 ? (
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
                  {filteredStudents.map((student) => (
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
                                // Mock attendance calculation or use a real value if available later
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentsModal;
