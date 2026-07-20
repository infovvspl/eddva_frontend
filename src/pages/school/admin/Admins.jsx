import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Edit2, Plus, Search, Trash2, Users, Eye, Filter, Calendar, School, CheckCircle2, UserPlus, XCircle, Shield } from 'lucide-react';
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

export default function Admins() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const isPlatformSuperAdmin = isSuperAdmin && !(user?.instituteId || user?.institute_id);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState('ALL');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dashboardKpis, setDashboardKpis] = useState({ total: 0, presentToday: 0, absentToday: 0, usedToday: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [teachersList, setTeachersList] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  const years = ['ALL', '2023', '2024', '2025', '2026', '2027'];

  async function fetchAdmins() {
    try {
      const params = {
        page,
        limit,
        role: 'INSTITUTE_ADMIN',
        ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      };

      const statsParams = {
        role: 'INSTITUTE_ADMIN',
        ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
      };

      const [res, statsRes] = await Promise.all([
        api.get('/teachers', { params }),
        api.get('/teachers/stats', { params: statsParams })
      ]);
      const adminList = getResponseList(res);
      setAdmins(adminList);
      
      const payload = res.success !== undefined ? res : res.data;
      if (payload) {
        if (typeof payload.total === 'number') {
          setTotal(payload.total);
          setTotalPages(payload.totalPages || 1);
        } else {
          setTotal(adminList.length);
          setTotalPages(1);
        }
      }

      if (statsRes.data?.data) {
        const sd = statsRes.data.data;
        setDashboardKpis({
          total: sd.totalTeachers || 0,
          presentToday: sd.presentToday || 0,
          absentToday: sd.absentToday || 0,
          usedToday: sd.usedToday || 0,
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

  useLiveRefresh(fetchAdmins, [page, limit, searchQuery, selectedInstituteId], 15000);

  const openAddModal = async () => {
    setIsAddModalOpen(true);
    setTeachersLoading(true);
    setModalSearch('');
    try {
      const [teachersRes, adminsRes] = await Promise.all([
        api.get('/teachers', {
          params: {
            role: 'TEACHER',
            limit: 200,
            ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
          }
        }),
        api.get('/teachers', {
          params: {
            role: 'INSTITUTE_ADMIN',
            limit: 200,
            ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
          }
        })
      ]);
      const teachers = getResponseList(teachersRes);
      const admins = getResponseList(adminsRes);
      const map = new Map();
      teachers.forEach(t => map.set(t.id, t));
      admins.forEach(a => map.set(a.id, a));
      const combined = Array.from(map.values());
      setTeachersList(combined);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load teachers');
    } finally {
      setTeachersLoading(false);
    }
  };

  const handleToggleAdmin = async (teacher) => {
    const roleString = teacher.role || '';
    const rolesList = roleString.split(',').map(r => r.trim().toUpperCase());
    const isCurrentlyAdmin = rolesList.includes('INSTITUTE_ADMIN');
    
    let newRolesList;
    if (isCurrentlyAdmin) {
      newRolesList = rolesList.filter(r => r !== 'INSTITUTE_ADMIN');
      if (newRolesList.length === 0) newRolesList = ['TEACHER'];
    } else {
      newRolesList = [...rolesList, 'INSTITUTE_ADMIN'];
    }
    const newRole = newRolesList.join(',');

    try {
      await api.put(`/teachers/${teacher.id}`, {
        name: teacher.name,
        role: newRole
      });
      toast.success(`${teacher.name} ${isCurrentlyAdmin ? 'removed as' : 'added as'} administrator`);
      setTeachersList(prev => prev.map(t => t.id === teacher.id ? { ...t, role: newRole } : t));
      fetchAdmins();
    } catch (error) {
      handleApiError(error, 'Failed to update administrator status');
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachersList.filter(t =>
      (t.name || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
      (t.email || '').toLowerCase().includes(modalSearch.toLowerCase()) ||
      (t.teacherProfile?.employeeId || '').toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [teachersList, modalSearch]);

  const handleEdit = (admin) => {
    navigate(`/school/admin/teachers/${admin.id}/edit`);
  };

  const confirm = useConfirm();

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Administrator Profile',
      subtitle: 'Danger Zone',
      message: 'Are you sure you want to permanently delete this administrator record? This will revoke system credentials and erase all profile history.',
      confirmLabel: 'Delete Admin',
      cancelLabel: 'Keep Admin'
    });
    if (ok) {
      try {
        await api.delete(`/teachers/${id}`);
        setAdmins(admins.filter(a => a.id !== id));
        notifyDataChanged('teachers');
        toast.success('Admin deleted successfully');
      } catch (error) {
        handleApiError(error, 'Failed to delete administrator');
      }
    }
  };

  const handleInstituteFilterChange = (value) => {
    setSelectedInstituteId(value);
    setPage(1);
  };

  const clearAdminFilters = () => {
    setStatusFilter('ALL');
    setSelectedYear('ALL');
    setSelectedInstituteId('ALL');
    setSearchQuery('');
    setPage(1);
  };

  const filtered = useMemo(() => {
    return admins
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
  }, [statusFilter, admins, selectedYear]);

  const exportCsv = () => {
    const rows = [
      ['Admin Name', 'School', 'Email', 'Status'],
      ...filtered.map((t) => [
        t.name || '-',
        t.instituteName || '-',
        t.email || '-',
        t.isActive ? 'Active' : 'Inactive'
      ]),
    ];
    downloadCsv('eddva-admins.csv', rows);
  };

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading…</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600 shrink-0 animate-pulse" />
            <span>Administrators</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage school administrators and credentials.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" />
            Add Administrator
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Administrators',
            value: dashboardKpis.total,
            subtitle: 'Institute admin roles',
            tone: 'from-blue-600 to-sky-500',
            iconBg: 'bg-blue-100 dark:bg-blue-500/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
            Icon: Shield,
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
            title: 'Portal Active Today',
            value: dashboardKpis.usedToday,
            subtitle: 'Admins accessed portal today',
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

      <div className="mt-5 glass-premium rounded-2xl">
        <div className="relative z-20 border-b border-[rgba(37,99,235,0.10)] bg-white/60 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Users className="h-4 w-4 text-blue-600" />
              {formatNumber(filtered.length)} results
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Filter className="h-4 w-4 text-blue-600" />
              Filter
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              className="w-full sm:w-44"
              triggerClassName="flex h-full w-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
            />

            {isPlatformSuperAdmin && (
              <CustomSelect
                value={selectedInstituteId}
                onChange={handleInstituteFilterChange}
                options={[
                  { value: "ALL", label: "All schools" },
                  ...institutes.map((institute) => ({ value: institute.id, label: institute.name })),
                ]}
                className="w-full sm:w-44"
                triggerClassName="flex h-full w-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
              />
            )}

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search administrators…"
                className="w-full rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Calendar className="h-4 w-4 text-slate-400" />
              <CustomSelect
                value={selectedYear}
                onChange={setSelectedYear}
                options={years.map((y) => ({ value: y, label: y }))}
                className="w-full sm:w-32"
                triggerClassName="flex h-full w-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
              />
            </div>

            <button
              type="button"
              onClick={clearAdminFilters}
              className="inline-flex items-center justify-center rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-2xl overflow-hidden">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Admin Name</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">School</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Email</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-slate-400">
                    No administrators found.
                  </td>
                </tr>
              ) : (
                filtered.map((admin) => (
                  <tr key={admin.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                          {admin.profileImage ? (
                            <img src={admin.profileImage} alt={admin.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-600/10 text-[13px] font-bold tracking-tight text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                              {(admin.name || 'A').slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{admin.name}</p>
                          <p className="truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">{admin.teacherProfile?.designation || 'Institute Admin'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{admin.instituteName || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{admin.email || '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/school/admin/teachers/${admin.id}`}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                        </Link>
                        <button
                          onClick={() => handleEdit(admin)}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Edit administrator"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Delete administrator"
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

      <Modal
        isOpen={isAddModalOpen}
        title="Manage Administrators"
        onClose={() => setIsAddModalOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="Search teachers by name or email…"
              className="w-full rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {teachersLoading ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-500">Loading staff directory…</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="py-12 text-center text-sm font-semibold text-slate-400">No teachers found.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[50vh] overflow-y-auto pr-1">
              {filteredTeachers.map((teacher) => {
                const isAdmin = (teacher.role || '').toUpperCase().includes('INSTITUTE_ADMIN');
                return (
                  <div key={teacher.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {teacher.profileImage ? (
                          <img src={teacher.profileImage} alt={teacher.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-blue-600/10 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                            {(teacher.name || 'T').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{teacher.name}</p>
                        <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{teacher.email || 'No email'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleAdmin(teacher)}
                      className="flex items-center gap-1.5 outline-none group cursor-pointer"
                      title={isAdmin ? "Remove administrator role" : "Assign administrator role"}
                    >
                      <div className={cn(
                        "relative w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 border",
                        isAdmin 
                          ? "bg-emerald-500 border-emerald-600" 
                          : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                      )}>
                        <div className={cn(
                          "w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 shadow-sm",
                          isAdmin ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                      <span className={cn(
                        "text-[11px] font-bold tracking-tight min-w-[32px] text-left",
                        isAdmin ? "text-emerald-600" : "text-slate-400"
                      )}>
                        {isAdmin ? 'Admin' : 'Staff'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
