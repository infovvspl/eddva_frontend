import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Edit2, Plus, Search, Trash2, Users, Eye, Filter, Calendar } from 'lucide-react';
import api from '@/lib/api/school-client';
import { mapTeacherFormToApi, mapTeacherFormToApiUpdate } from '@/lib/school/onboardPayload';
import { getTenantLoginUrl } from '@/lib/school/tenantRedirect';
import { useAuth } from '@/context/SchoolAuthContext';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { getResponseList, notifyDataChanged } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import AddTeacherMultiStep from '@/components/school/admin/forms/AddTeacherMultiStep';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/school/errorHandler';
import { cn } from '@/components/school/admin/Skeleton';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useConfirm } from '@/context/ConfirmContext';

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

export default function Teachers() {
  const { institute } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const years = ['ALL', '2023', '2024', '2025', '2026', '2027'];

  async function fetchTeachers() {
    try {
      const query = new URLSearchParams();
      query.append('page', page);
      query.append('limit', limit);
      if (searchQuery.trim()) query.append('search', searchQuery.trim());
      
      const res = await api.get(`/teachers?${query.toString()}`);
      setTeachers(getResponseList(res));
      const resData = res.data?.data || res.data;
      if (resData && typeof resData.total !== 'undefined') {
        setTotal(resData.total);
        setTotalPages(resData.totalPages);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useLiveRefresh(fetchTeachers, [page, limit, searchQuery], 15000);

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
    setSelectedTeacher(null);
    setIsModalOpen(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
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

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedTeacher) {
        const payload = mapTeacherFormToApiUpdate(formData);
        await api.put(`/teachers/${selectedTeacher.id}`, payload);
        toast.success('Teacher updated successfully');
      } else {
        const payload = mapTeacherFormToApi(formData);
        await api.post('/teachers', payload);
        const tenant = institute?.tenantDomain || localStorage.getItem('tenantDomain') || 'demo-school';
        const loginUrl = getTenantLoginUrl(tenant);
        toast.success(`Teacher created successfully. Portal: ${loginUrl}`);
      }
      setIsModalOpen(false);
      setSelectedTeacher(null);
      await fetchTeachers();
      notifyDataChanged('teachers');
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save teacher';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const kpis = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.isActive).length;
    const inactive = total - active;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = teachers.filter((t) => {
      const created = t.createdAt ? new Date(t.createdAt) : null;
      return created && created >= startOfMonth;
    }).length;

    return { total, active, inactive, newThisMonth };
  }, [teachers]);

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
      ['Teacher Name', 'Email', 'Sections', 'Subjects', 'Status'],
      ...teachers.map((t) => [
        t.name || '-',
        t.email || '-',
        (t.sections || []).map(s => s.name).join(', ') || '-',
        (t.subjects || []).map(s => s.name).join(', ') || '-',
        t.isActive ? 'Active' : 'Inactive'
      ]),
    ];
    downloadCsv('eddva-teachers.csv', rows);
  };

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl px-2 sm:px-4">
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Total Teachers',
            value: kpis.total,
            subtitle: 'Active staff records',
            tone: 'from-blue-600 to-sky-500',
          },
          {
            title: 'Active Teachers',
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
            title: 'Inactive Teachers',
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
        <div className="flex flex-col gap-3 border-b border-[rgba(37,99,235,0.10)] bg-white/60 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Users className="h-4 w-4 text-blue-600" />
              {formatNumber(filtered.length)} results
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:max-w-xs">
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
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent outline-none"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

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
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Teacher Name</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Email</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Sections</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Subjects</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
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
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{teacher.email || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                      {(teacher.sections || []).map(s => s.name).join(', ') || '-'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                      {(teacher.subjects || []).map(s => s.name).join(', ') || '-'}
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
            total={total || teachers.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        title={selectedTeacher ? 'Edit Teacher Profile' : 'Register New Teacher'}
        onClose={() => setIsModalOpen(false)}
        size="full"
      >
        <AddTeacherMultiStep
          teacher={selectedTeacher}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

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
