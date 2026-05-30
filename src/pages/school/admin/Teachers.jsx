import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Edit2, Plus, Search, Trash2, Users, Eye, Filter, Calendar } from 'lucide-react';
import api from '@/lib/api/school-client';
import { mapTeacherFormToApi } from '@/lib/school/onboardPayload';
import { getTenantLoginUrl } from '@/lib/school/tenantRedirect';
import { useAuth } from '@/context/SchoolAuthContext';
import useLiveRefresh from '@/hooks/useLiveRefresh';
import { getResponseList, notifyDataChanged } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import AddTeacherMultiStep from '@/components/school/admin/forms/AddTeacherMultiStep';
import { toast } from 'sonner';

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

  const years = ['ALL', '2023', '2024', '2025', '2026', '2027'];

  async function fetchTeachers() {
    try {
      const res = await api.get('/teachers');
      setTeachers(getResponseList(res));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useLiveRefresh(fetchTeachers, [], 15000);

  const handleAddClick = () => {
    setSelectedTeacher(null);
    setIsModalOpen(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      try {
        await api.delete(`/teachers/${id}`);
        setTeachers(teachers.filter(t => t.id !== id));
        notifyDataChanged('teachers');
        toast.success('Teacher deleted successfully');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete teacher');
      }
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedTeacher) {
        await api.put(`/teachers/${selectedTeacher.id}`, formData);
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
    const q = searchQuery.trim().toLowerCase();
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
        if (!q) return matchesYear;
        const dept = t.teacherProfile?.department || '';
        const matchesQuery = [t.name, t.email, dept].some((v) => String(v || '').toLowerCase().includes(q));
        return matchesYear && matchesQuery;
      });
  }, [searchQuery, statusFilter, teachers, selectedYear]);

  const exportCsv = () => {
    const rows = [
      ['Teacher Name', 'Email', 'Department', 'Status'],
      ...filtered.map((t) => [t.name || '-', t.email || '-', t.teacherProfile?.department || '-', t.isActive ? 'Active' : 'Inactive']),
    ];
    downloadCsv('eddva-teachers.csv', rows);
  };

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl px-2 sm:px-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold text-slate-950 dark:text-white">Teachers</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage teaching staff and assignments.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" />
          Add Teacher
        </button>
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
                <p className="mt-2 font-display text-3xl font-extrabold text-slate-950 dark:text-white">
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white/90 px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Department</th>
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
                          {teacher.photo ? (
                            <img src={teacher.photo} alt={teacher.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-600/10 text-[13px] font-black text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                              {(teacher.name || 'T').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900 dark:text-white">{teacher.name}</p>
                          <p className="truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">{teacher.teacherProfile?.designation || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{teacher.email || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{teacher.teacherProfile?.department || '-'}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                          teacher.isActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${teacher.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/teachers/${teacher.id}`}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                        </Link>
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Edit teacher"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
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

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-white/60 px-5 py-4 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing 1 to {filtered.length} of {teachers.length} teacher{teachers.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              ‹
            </button>
            <button type="button" className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-200">
              1
            </button>
            <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              ›
            </button>
          </div>
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
    </div>
  );
}
