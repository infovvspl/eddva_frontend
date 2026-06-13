import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Edit2, Plus, Search, Trash2, Users, Eye, Filter, Calendar, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api/school-client';
import { mapStudentFormToApi, mapStudentFormToApiUpdate } from '@/lib/school/onboardPayload';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { getResponseList, notifyDataChanged } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import AddStudentMultiStep from '@/components/school/admin/forms/AddStudentMultiStep';
import { toast } from 'sonner';
import { useAuth } from '@/context/SchoolAuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';
import { cn } from '@/components/school/admin/Skeleton';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          const escaped = s.replaceAll('"', '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  
  const records = [];
  const headerMap = {
    'name': 'name',
    'student name': 'name',
    'email': 'email',
    'password': 'password',
    'enrollment no': 'enrollmentNo',
    'enrollmentno': 'enrollmentNo',
    'enrollment number': 'enrollmentNo',
    'roll no': 'rollNo',
    'rollno': 'rollNo',
    'class': 'class',
    'section': 'section',
    'date of birth': 'dob',
    'dob': 'dob',
    'gender': 'gender',
    'blood group': 'bloodGroup',
    'bloodgroup': 'bloodGroup',
    'father name': 'fatherName',
    'fathername': 'fatherName',
    'mother name': 'motherName',
    'mothername': 'motherName',
    'parent phone': 'parentPhone',
    'parentphone': 'parentPhone',
    'parent email': 'parentEmail',
    'parentemail': 'parentEmail',
    'address': 'address',
    'city': 'city',
    'state': 'state',
    'pin code': 'pinCode',
    'pincode': 'pinCode'
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = [];
    let insideQuote = false;
    let current = '';
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    const record = {};
    headers.forEach((header, idx) => {
      const apiKey = headerMap[header];
      if (apiKey) {
        record[apiKey] = values[idx] || '';
      }
    });
    records.push(record);
  }
  return records;
}

function normalizeSections(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function Students() {
  const { institute } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalStudents: 0, activeStudents: 0, inactiveStudents: 0, newThisMonth: 0 });

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const years = ['ALL', '2023', '2024', '2025', '2026', '2027'];

  async function fetchStudents() {
    try {
      const params = {
        page,
        limit,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(selectedClassId !== 'ALL' ? { classId: selectedClassId } : {}),
        ...(selectedSectionId !== 'ALL' ? { sectionId: selectedSectionId } : {}),
      };
      // status and year aren't passed to backend by default unless we add them
      
      const [res, statsRes] = await Promise.all([
        api.get('/students', { params }),
        api.get('/students/stats')
      ]);
      setStudents(getResponseList(res));
      if (res.data && typeof res.data.total !== 'undefined') {
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function fetchClasses() {
      try {
        const res = await api.get('/academic/classes');
        if (mounted) setClasses(getResponseList(res));
      } catch (error) {
        console.error(error);
        if (mounted) setClasses([]);
      }
    }

    fetchClasses();
    return () => {
      mounted = false;
    };
  }, []);

  useLiveRefresh(fetchStudents, [page, limit, searchQuery, selectedClassId, selectedSectionId], 15000);

  const handleAddClick = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const confirm = useConfirm();

  const handleDeleteClick = async (id) => {
    const ok = await confirm({
      title: 'Delete Student Profile',
      subtitle: 'Danger Zone',
      message: 'Are you sure you want to permanently delete this student record? This will revoke login credentials and erase all profile history.',
      confirmLabel: 'Delete Student',
      cancelLabel: 'Keep Student'
    });
    if (ok) {
      try {
        await api.delete(`/students/${id}`);
        setStudents(students.filter(s => s.id !== id));
        notifyDataChanged('students');
        toast.success('Student deleted successfully');
      } catch (error) {
        handleApiError(error, 'Failed to delete student');
      }
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      setImportError('Please select a file to import');
      return;
    }
    setImportError('');
    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const records = parseCsv(text);
        if (records.length === 0) {
          throw new Error('The uploaded file is empty or missing data rows');
        }

        const response = await api.post('/students/bulk-import', { records });
        const result = response.data?.data ?? response.data;
        setImportResult(result);
        
        if (result.importedCount > 0) {
          toast.success(`Successfully imported ${result.importedCount} student(s)`);
          await fetchStudents();
          notifyDataChanged('students');
        }
        if (result.failedCount > 0) {
          toast.error(`Failed to import ${result.failedCount} student(s)`);
        } else {
          setIsImportModalOpen(false);
          setImportFile(null);
        }
      } catch (err) {
        console.error(err);
        setImportError(err.message || 'Failed to import records');
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
      setImporting(false);
    };
    reader.readAsText(importFile);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      ['Name', 'Email', 'Password', 'Enrollment No', 'Roll No', 'Class', 'Section', 'Date of Birth', 'Gender', 'Blood Group', 'Father Name', 'Mother Name', 'Parent Phone', 'Parent Email', 'Address', 'City', 'State', 'Pin Code'],
      ['John Doe', 'john.doe@example.com', 'password123', 'ENR001', '10', 'Class 10', 'A', '2010-05-15', 'Male', 'O+', 'Robert Doe', 'Mary Doe', '9876543210', 'parent@example.com', '123 Main St', 'Springfield', 'Illinois', '62701']
    ];
    downloadCsv('student-import-template.csv', headers);
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedStudent) {
        const payload = mapStudentFormToApiUpdate(formData);
        console.log('=== UPDATE PAYLOAD ===', payload);
        await api.put(`/students/${selectedStudent.id}`, payload);
        toast.success('Student updated successfully');
      } else {
        const payload = mapStudentFormToApi(formData);
        console.log('=== CREATE PAYLOAD ===', payload);
        await api.post('/students', payload);
        toast.success('Student created successfully');
      }
      setIsModalOpen(false);
      setSelectedStudent(null);
      await fetchStudents();
      notifyDataChanged('students');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save student';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const kpis = useMemo(() => {
    return {
      total: stats.totalStudents,
      active: stats.activeStudents,
      inactive: stats.inactiveStudents,
      newThisMonth: stats.newThisMonth,
    };
  }, [stats]);

  const selectedClass = useMemo(
    () => classes.find((cls) => String(cls.id) === String(selectedClassId)),
    [classes, selectedClassId],
  );

  const sectionOptions = useMemo(() => normalizeSections(selectedClass?.sections), [selectedClass]);

  const handleClassFilterChange = (value) => {
    setSelectedClassId(value);
    setSelectedSectionId('ALL');
    setPage(1);
  };

  const handleSectionFilterChange = (value) => {
    setSelectedSectionId(value);
    setPage(1);
  };

  const clearStudentFilters = () => {
    setStatusFilter('ALL');
    setSelectedYear('ALL');
    setSelectedClassId('ALL');
    setSelectedSectionId('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        if (statusFilter === 'ACTIVE') return Boolean(s.isActive);
        if (statusFilter === 'INACTIVE') return !Boolean(s.isActive);
        return true;
      })
      .filter((s) => {
        const matchesYear =
          selectedYear === 'ALL'
            ? true
            : (s.createdAt ? new Date(s.createdAt).getFullYear().toString() === selectedYear : false);
        return matchesYear;
      });
  }, [statusFilter, students, selectedYear]);

  const exportCsv = () => {
    const rows = [
      ['Student Name', 'Enrollment No.', 'Class', 'Section', 'Status'],
      ...filtered.map((s) => [
        s.name || '-',
        s.studentProfile?.enrollmentNo || '-',
        s.studentProfile?.section?.class?.name || '-',
        s.studentProfile?.section?.name || '-',
        s.isActive ? 'Active' : 'Inactive',
      ]),
    ];
    downloadCsv('eddva-students.csv', rows);
  };

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">Students</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage student profiles and enrollment.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/school/admin/student-promotion"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-md transition hover:bg-slate-50 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowUpRight className="h-5 w-5 text-indigo-600" />
            Student Promotion
          </Link>
          <button
            onClick={() => {
              setImportFile(null);
              setImportError('');
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-md transition hover:bg-slate-50 active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-5 w-5 text-blue-600" />
            Bulk Import
          </button>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" />
            Add Student
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Students',
            value: kpis.total,
            subtitle: 'Active enrollments',
            tone: 'from-blue-600 to-sky-500',
          },
          {
            title: 'Active Students',
            value: kpis.active,
            subtitle: 'Currently active',
            tone: 'from-emerald-600 to-teal-500',
          },
          {
            title: 'New This Month',
            value: kpis.newThisMonth,
            subtitle: 'Recently added',
            tone: 'from-violet-600 to-indigo-500',
          },
          {
            title: 'Inactive Students',
            value: kpis.inactive,
            subtitle: 'Currently inactive',
            tone: 'from-rose-600 to-orange-500',
          },
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.03 * idx }}
            className="glass-premium rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{card.title}</p>
                <p className="mt-2 font-display text-3xl font-bold text-slate-950 dark:text-white">
                  {formatNumber(card.value)}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{card.subtitle}</p>
              </div>
              <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${card.tone} opacity-90 shadow-lg`} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 glass-premium rounded-2xl overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[rgba(37,99,235,0.10)] bg-white/60 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Users className="h-4 w-4 text-blue-600" />
              {formatNumber(filtered.length)} results
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Filter className="h-4 w-4 text-blue-600" />
              Filter
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={selectedClassId}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className="rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Filter by class"
            >
              <option value="ALL">All classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>

            <select
              value={selectedSectionId}
              onChange={(e) => handleSectionFilterChange(e.target.value)}
              disabled={selectedClassId === 'ALL'}
              className="rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Filter by section"
            >
              <option value="ALL">{selectedClassId === 'ALL' ? 'Select class first' : 'All sections'}</option>
              {sectionOptions.map((section) => (
                <option key={section.id} value={section.id}>Section {section.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
            <div className="relative w-full sm:max-w-sm lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search students…"
                className="w-full rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Calendar className="h-4 w-4 text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
                className="bg-transparent outline-none"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={clearStudentFilters}
              className="inline-flex items-center justify-center rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Student Name</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Enrollment No.</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Class/Section</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                          {student.profileImage ? (
                            <img src={student.profileImage} alt={student.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-600/10 text-[13px] font-bold tracking-tight text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                              {(student.name || 'S').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{student.name}</p>
                          <p className="truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">{student.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{student.studentProfile?.enrollmentNo || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      {student.studentProfile?.section
                        ? `${student.studentProfile.section.class.name} / ${student.studentProfile.section.name}`
                        : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={async () => {
                          try {
                            const newActive = !student.isActive;
                            await api.put(`/students/${student.id}`, { name: student.name, isActive: newActive });
                            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isActive: newActive } : s));
                            toast.success(`Student ${newActive ? 'activated' : 'deactivated'} successfully`);
                          } catch (err) {
                            handleApiError(err, 'Failed to toggle status');
                          }
                        }}
                        className="flex items-center gap-1.5 outline-none group cursor-pointer"
                        title="Click to toggle status"
                      >
                        <div className={cn(
                          "relative w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 border",
                          student.isActive 
                            ? "bg-emerald-500 border-emerald-600" 
                            : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                        )}>
                          <div className={cn(
                            "w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                            student.isActive ? "translate-x-4" : "translate-x-0"
                          )} />
                        </div>
                        <span className={cn(
                          "text-[11px] font-bold tracking-tight",
                          student.isActive ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/school/admin/students/${student.id}`}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                        </Link>
                        <button
                          onClick={() => handleEditClick(student)}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(student.id)}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
          <DataTablePagination
            page={page}
            limit={limit}
            total={total || students.length}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        title={selectedStudent ? 'Edit Student Profile' : 'Register New Student'}
        onClose={() => setIsModalOpen(false)}
        size="full"
      >
        <AddStudentMultiStep
          student={selectedStudent}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        title="Bulk Import Students"
        onClose={() => setIsImportModalOpen(false)}
        size="lg"
      >
        <div className="space-y-6 p-1">
          <div className="rounded-xl bg-blue-50/50 dark:bg-slate-800/30 border border-blue-100 dark:border-slate-800 p-4">
            <h4 className="text-sm font-bold text-blue-900 dark:text-sky-300">Instructions:</h4>
            <ul className="mt-2 list-disc list-inside text-xs text-blue-800/80 dark:text-slate-400 space-y-1">
              <li>Download the CSV template using the button below.</li>
              <li>Provide columns: <b>Name, Email, Password</b> (Required).</li>
              <li>Optional columns: <b>Enrollment No, Roll No, Class, Section, DOB, Gender, Blood Group, Father Name, Mother Name, Parent Phone, Parent Email, Address, City, State, Pin Code</b>.</li>
              <li>Ensure the Class and Section match existing names in Academics.</li>
            </ul>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV Template
            </button>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select CSV File</label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-colors p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-sky-400">
                    <Download className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {importFile ? importFile.name : 'Drag & drop your CSV file here, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-400">Supported format: .csv</p>
                </div>
              </div>
            </div>

            {importError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/50 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-emerald-600">Imported: {importResult.importedCount}</span>
                  <span className="text-rose-600">Failed: {importResult.failedCount}</span>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Row Failures:</h5>
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                      {importResult.errors.map((err, idx) => (
                        <div key={idx} className="p-2 flex justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                          <span className="font-semibold text-slate-500">Row {err.row} ({err.email}):</span>
                          <span className="text-rose-600 dark:text-rose-400 font-medium text-right">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={importing || !importFile}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importing && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Import Students
              </button>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
