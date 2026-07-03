import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Edit2, Plus, Search, Trash2, Users, Eye, Filter, Calendar, School, CheckCircle2, UserPlus, XCircle } from 'lucide-react';
import api from '@/lib/api/school-client';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { getResponseList, notifyDataChanged } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/school/errorHandler';
import { cn } from '@/components/school/admin/Skeleton';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useConfirm } from '@/context/ConfirmContext';
import { useAuth } from '@/context/SchoolAuthContext';
import { CustomSelect } from "@/components/ui/CustomSelect";

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
    'teacher name': 'name',
    'email': 'email',
    'password': 'password',
    'employee id': 'employeeId',
    'employeeid': 'employeeId',
    'employee code': 'employeeId',
    'phone': 'phone',
    'blood group': 'bloodGroup',
    'bloodgroup': 'bloodGroup',
    'marital status': 'maritalStatus',
    'maritalstatus': 'maritalStatus',
    'department': 'department',
    'joining date': 'joiningDate',
    'joiningdate': 'joiningDate',
    'qualifications': 'qualifications'
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

export default function Teachers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const isPlatformSuperAdmin = isSuperAdmin && !(user?.instituteId || user?.institute_id);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState('ALL');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dashboardKpis, setDashboardKpis] = useState({ total: 0, presentToday: 0, absentToday: 0, newThisMonth: 0 });

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const years = ['ALL', '2023', '2024', '2025', '2026', '2027'];

  async function fetchTeachers() {
    try {
      const params = {
        page,
        limit,
        ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(selectedClassId !== 'ALL' ? { classId: selectedClassId } : {}),
        ...(selectedSectionId !== 'ALL' ? { sectionId: selectedSectionId } : {}),
      };

      const statsParams = {
        ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
      };

      const [res, statsRes] = await Promise.all([
        api.get('/teachers', { params }),
        api.get('/teachers/stats', { params: statsParams })
      ]);
      const teacherList = getResponseList(res);
      setTeachers(teacherList);
      
      const payload = res.success !== undefined ? res : res.data;
      if (payload) {
        if (typeof payload.total === 'number') {
          setTotal(payload.total);
          setTotalPages(payload.totalPages || 1);
        } else {
          setTotal(teacherList.length);
          setTotalPages(1);
        }
      }

      if (statsRes.data?.data) {
        const sd = statsRes.data.data;
        setDashboardKpis({
          total: sd.totalTeachers || 0,
          presentToday: sd.presentToday || 0,
          absentToday: sd.absentToday || 0,
          newThisMonth: sd.newThisMonth || 0,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function fetchInstitutes() {
      if (!isPlatformSuperAdmin) {
        setInstitutes([]);
        return;
      }
      try {
        const res = await api.get('/institutes', { params: { perPage: 200 } });
        if (mounted) setInstitutes(getResponseList(res));
      } catch (error) {
        console.error(error);
        if (mounted) setInstitutes([]);
      }
    }

    fetchInstitutes();
    return () => {
      mounted = false;
    };
  }, [isPlatformSuperAdmin]);

  useEffect(() => {
    let mounted = true;

    async function fetchClasses() {
      if (isPlatformSuperAdmin && selectedInstituteId === 'ALL') {
        setClasses([]);
        setSelectedClassId('ALL');
        setSelectedSectionId('ALL');
        return;
      }
      try {
        const res = await api.get('/academic/classes', {
          params: isPlatformSuperAdmin ? { instituteId: selectedInstituteId } : undefined,
        });
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
  }, [isPlatformSuperAdmin, selectedInstituteId]);

  useLiveRefresh(fetchTeachers, [page, limit, searchQuery, selectedInstituteId, selectedClassId, selectedSectionId], 15000);

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

        const response = await api.post('/teachers/bulk-import', { records });
        const result = response.data?.data ?? response.data;
        setImportResult(result);

        if (result.importedCount > 0) {
          toast.success(`Successfully imported ${result.importedCount} teacher(s)`);
          await fetchTeachers();
          notifyDataChanged('teachers');
        }
        if (result.failedCount > 0) {
          toast.error(`Failed to import ${result.failedCount} teacher(s)`);
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
      ['Name', 'Email', 'Password', 'Employee ID', 'Phone', 'Blood Group', 'Marital Status', 'Department', 'Joining Date', 'Qualifications'],
      ['Jane Smith', 'jane.smith@example.com', 'securepass456', 'EMP102', '9876543211', 'A-', 'Married', 'Science', '2025-08-01', 'M.Sc, B.Ed']
    ];
    downloadCsv('teacher-import-template.csv', headers);
  };

  const handleAddClick = () => {
    navigate('/school/admin/teachers/new');
  };

  const handleEdit = (teacher) => {
    navigate(`/school/admin/teachers/${teacher.id}/edit`);
  };

  const confirm = useConfirm();

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Teacher Profile',
      subtitle: 'Danger Zone',
      message: 'Are you sure you want to permanently delete this teacher record? This will revoke system credentials and erase all profile history.',
      confirmLabel: 'Delete Teacher',
      cancelLabel: 'Keep Teacher'
    });
    if (ok) {
      try {
        await api.delete(`/teachers/${id}`);
        setTeachers(teachers.filter(t => t.id !== id));
        notifyDataChanged('teachers');
        toast.success('Teacher deleted successfully');
      } catch (error) {
        handleApiError(error, 'Failed to delete teacher');
      }
    }
  };

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

  const handleInstituteFilterChange = (value) => {
    setSelectedInstituteId(value);
    setSelectedClassId('ALL');
    setSelectedSectionId('ALL');
    setPage(1);
  };

  const clearTeacherFilters = () => {
    setStatusFilter('ALL');
    setSelectedYear('ALL');
    setSelectedInstituteId('ALL');
    setSelectedClassId('ALL');
    setSelectedSectionId('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const filtered = useMemo(() => {
    return teachers
      .filter((t) => {
        if (statusFilter === 'ACTIVE') return Boolean(t.isActive);
        if (statusFilter === 'INACTIVE') return !t.isActive;
        return true;
      })
      .filter((t) => {
        const matchesYear =
          selectedYear === 'ALL'
            ? true
            : (t.createdAt ? new Date(t.createdAt).getFullYear().toString() === selectedYear : false);
        return matchesYear;
      });
  }, [statusFilter, teachers, selectedYear]);

  const exportCsv = () => {
    const rows = [
      ['Teacher Name', 'School', 'Email', 'Class', 'Section', 'Status'],
      ...filtered.map((t) => [
        t.name || '-',
        t.instituteName || '-',
        t.email || '-',
        (t.classes || []).map(c => c.name).join(', ') || '-',
        (t.sections || []).map(s => s.name).join(', ') || '-',
        t.isActive ? 'Active' : 'Inactive'
      ]),
    ];
    downloadCsv('eddva-teachers.csv', rows);
  };

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">Teachers</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage teaching staff and assignments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            Add Teacher
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Teachers',
            value: dashboardKpis.total,
            subtitle: 'Teaching staff',
            tone: 'from-blue-600 to-sky-500',
            iconBg: 'bg-blue-100 dark:bg-blue-500/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            Icon: School,
          },
          {
            title: 'Present Today',
            value: dashboardKpis.presentToday,
            subtitle: 'Attendance today',
            tone: 'from-emerald-600 to-teal-500',
            iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            Icon: CheckCircle2,
          },
          {
            title: 'New This Month',
            value: dashboardKpis.newThisMonth,
            subtitle: 'Recently added',
            tone: 'from-violet-600 to-indigo-500',
            iconBg: 'bg-violet-100 dark:bg-violet-500/20',
            iconColor: 'text-violet-600 dark:text-violet-400',
            Icon: UserPlus,
          },
          {
            title: 'Absent Today',
            value: dashboardKpis.absentToday,
            subtitle: 'Absent today',
            tone: 'from-rose-600 to-orange-500',
            iconBg: 'bg-rose-100 dark:bg-rose-500/20',
            iconColor: 'text-rose-600 dark:text-rose-400',
            Icon: XCircle,
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
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconBg}`}>
                <card.Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
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

            <CustomSelect
          onChange={setStatusFilter}
              value={statusFilter}
              options={[
              { value: "ALL", label: "All statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
              className="w-full"
            />

            {isPlatformSuperAdmin && (
              <CustomSelect
          onChange={handleInstituteFilterChange}
                value={selectedInstituteId}
                options={[
                { value: "ALL", label: "All schools" },
                ...institutes.map((institute) => ({ value: institute.id, label: institute.name })),
              ]}
                className="w-full"
              />
            )}

            <CustomSelect
          onChange={handleClassFilterChange}
              value={selectedClassId}
              options={[
              { value: "ALL", label: isPlatformSuperAdmin && selectedInstituteId === 'ALL' ? 'Select school first' : 'All classes' },
              ...classes.map((cls) => ({ value: cls.id, label: cls.name })),
            ]}
              disabled={isPlatformSuperAdmin && selectedInstituteId === 'ALL'}
              className="w-full"
            />

            <CustomSelect
          onChange={handleSectionFilterChange}
              value={selectedSectionId}
              options={[
              { value: "ALL", label: selectedClassId === 'ALL' ? 'Select class first' : 'All sections' },
              ...sectionOptions.map((section) => ({ value: section.id, label: `Section ${section.name}` })),
            ]}
              disabled={selectedClassId === 'ALL' || (isPlatformSuperAdmin && selectedInstituteId === 'ALL')}
              className="w-full"
            />
          </div>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
            <div className="relative w-full sm:max-w-sm lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search teachers…"
                className="w-full rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Calendar className="h-4 w-4 text-slate-400" />
              <CustomSelect
          onChange={setSelectedYear}
                value={selectedYear}
                options={years.map((y) => ({ value: y, label: y }))}
                className="w-full"
              />
            </div>

            <button
              type="button"
              onClick={clearTeacherFilters}
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
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Teacher Name</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">School</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Email</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Class</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Section</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                    No teachers found.
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => (
                  <tr key={teacher.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                          {teacher.profileImage ? (
                            <img src={teacher.profileImage} alt={teacher.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-600/10 text-[13px] font-bold tracking-tight text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                              {(teacher.name || 'T').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{teacher.name}</p>
                          <p className="truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">{teacher.teacherProfile?.designation || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{teacher.instituteName || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{teacher.email || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {(teacher.classes || []).map(c => (
                          <span key={c.id} className="inline-flex rounded-full bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                            {c.name}
                          </span>
                        ))}
                        {(!teacher.classes || teacher.classes.length === 0) && <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {(teacher.sections || []).map(s => (
                          <span key={s.id} className="inline-flex rounded-full bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                            {s.name}
                          </span>
                        ))}
                        {(!teacher.sections || teacher.sections.length === 0) && <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={async () => {
                          try {
                            const newActive = !teacher.isActive;
                            await api.put(`/teachers/${teacher.id}`, { name: teacher.name, isActive: newActive });
                            setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, isActive: newActive } : t));
                            toast.success(`Teacher ${newActive ? 'activated' : 'deactivated'} successfully`);
                          } catch (err) {
                            handleApiError(err, 'Failed to toggle status');
                          }
                        }}
                        className="flex items-center gap-1.5 outline-none group cursor-pointer"
                        title="Click to toggle status"
                      >
                        <div className={cn(
                          "relative w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 border",
                          teacher.isActive 
                            ? "bg-emerald-500 border-emerald-600" 
                            : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                        )}>
                          <div className={cn(
                            "w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                            teacher.isActive ? "translate-x-4" : "translate-x-0"
                          )} />
                        </div>
                        <span className={cn(
                          "text-[11px] font-bold tracking-tight",
                          teacher.isActive ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/school/admin/teachers/${teacher.id}`}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                        </Link>
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Edit teacher"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Delete teacher"
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
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        title="Bulk Import Teachers"
        onClose={() => setIsImportModalOpen(false)}
        size="lg"
      >
        <div className="space-y-6 p-1">
          <div className="rounded-xl bg-blue-50/50 dark:bg-slate-800/30 border border-blue-100 dark:border-slate-800 p-4">
            <h4 className="text-sm font-bold text-blue-900 dark:text-sky-300">Instructions:</h4>
            <ul className="mt-2 list-disc list-inside text-xs text-blue-800/80 dark:text-slate-400 space-y-1">
              <li>Download the CSV template using the button below.</li>
              <li>Provide columns: <b>Name, Email, Password</b> (Required).</li>
              <li>Optional columns: <b>Employee ID, Phone, Blood Group, Marital Status, Department, Joining Date, Qualifications</b>.</li>
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
                Import Teachers
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
