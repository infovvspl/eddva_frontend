import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Edit2, Plus, Search, Trash2, Users, Eye, Filter, Calendar, School, CheckCircle2, UserPlus, XCircle, Shield, KeyRound, Lock, Loader2 } from 'lucide-react';
import { ADMIN_PERMISSION_MODULES } from '@/lib/constants/adminPermissionModules';
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

function getInitials(name) {
  const clean = String(name || '').trim();
  if (!clean) return 'A';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function Admins() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const isPlatformSuperAdmin = isSuperAdmin && !(user?.instituteId || user?.institute_id);
  // Only the primary institute admin (onboarded by the SuperAdmin) or the
  // SuperAdmin itself may grant/manage administrator access — mirrors the
  // backend check in school-teacher.service.ts: setAdminRole().
  const canManageAdmins = isSuperAdmin || user?.isPrimaryAdmin;
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

  // Permission picker sub-modal — replaces the old binary admin toggle.
  const [permissionTeacher, setPermissionTeacher] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

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
      const [teachersRes, staffRes, adminsRes] = await Promise.all([
        api.get('/teachers', {
          params: {
            role: 'TEACHER',
            limit: 200,
            ...(isPlatformSuperAdmin && selectedInstituteId !== 'ALL' ? { instituteId: selectedInstituteId } : {}),
          }
        }),
        // Staff accounts are eligible for admin access too, same as teachers —
        // the backend's setAdminRole() is role-agnostic over the users table.
        api.get('/staff', {
          params: {
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
      const staff = getResponseList(staffRes);
      const admins = getResponseList(adminsRes);
      const map = new Map();
      teachers.forEach(t => map.set(t.id, t));
      staff.forEach(s => map.set(s.id, s));
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

  const openPermissionModal = (teacher) => {
    setPermissionTeacher(teacher);
    if (Array.isArray(teacher.adminPermissions)) {
      // Scoped admin — reflect exactly what they've been granted.
      setSelectedPermissions(teacher.adminPermissions);
    } else if ((teacher.role || '').toUpperCase().includes('INSTITUTE_ADMIN')) {
      // Legacy/unrestricted ("Full Access") admin — show every module checked
      // so the picker honestly reflects their current access; unchecking some
      // and saving converts them to a scoped admin.
      setSelectedPermissions(ADMIN_PERMISSION_MODULES.map((m) => m.key));
    } else {
      // Not yet an admin — fresh grant, nothing checked.
      setSelectedPermissions([]);
    }
  };

  const togglePermission = (key) => {
    setSelectedPermissions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleSavePermissions = async () => {
    if (!permissionTeacher) return;
    if (selectedPermissions.length === 0) {
      toast.error('Select at least one module to grant access to');
      return;
    }
    setSavingPermissions(true);
    try {
      const res = await api.put(`/teachers/${permissionTeacher.id}/admin-role`, {
        isAdmin: true,
        permissions: selectedPermissions,
      });
      const data = res?.data?.data || {};
      toast.success(`${permissionTeacher.name} granted access to ${selectedPermissions.length} module${selectedPermissions.length !== 1 ? 's' : ''}`);
      setTeachersList((prev) => prev.map((t) => (t.id === permissionTeacher.id ? { ...t, role: data.role ?? t.role, adminPermissions: data.adminPermissions ?? selectedPermissions } : t)));
      setPermissionTeacher(null);
      fetchAdmins();
    } catch (error) {
      handleApiError(error, 'Failed to update administrator access');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleRevokeAdmin = async (teacher) => {
    try {
      const res = await api.put(`/teachers/${teacher.id}/admin-role`, { isAdmin: false });
      const newRole = res?.data?.data?.role ?? 'TEACHER';
      toast.success(`${teacher.name} removed as administrator`);
      setTeachersList((prev) => prev.map((t) => (t.id === teacher.id ? { ...t, role: newRole, adminPermissions: null } : t)));
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
            <Shield className="size-8 text-blue-600 shrink-0 animate-pulse" />
            <span>Administrators</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage school administrators and credentials.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageAdmins ? (
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
            >
              <Plus className="size-5" />
              Add Administrator
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <Lock className="size-3.5" />
              Only the primary admin can manage administrator access
            </div>
          )}
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
              <div className={`flex size-11 items-center justify-center rounded-2xl ${card.iconBg}`}>
                <card.Icon className={`size-5 ${card.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 glass-premium rounded-2xl">
        <div className="relative z-20 border-b border-[rgba(37,99,235,0.10)] bg-white/60 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Users className="size-4 text-blue-600" />
              {formatNumber(filtered.length)} results
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Filter className="size-4 text-blue-600" />
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
              triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
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
                triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
              />
            )}

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search administrators…"
                className="w-full rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 py-2 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Calendar className="size-4 text-slate-400" />
              <CustomSelect
                value={selectedYear}
                onChange={setSelectedYear}
                options={years.map((y) => ({ value: y, label: y }))}
                className="w-full sm:w-32"
                triggerClassName="flex size-full items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white/90 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
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
              <Download className="size-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-2xl overflow-hidden">
          <Table className="min-w-[980px] w-full text-left text-sm">
            <TableHeader className="bg-slate-50/50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Admin Name</TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">School</TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access</TableHead>
                <TableHead className="h-auto px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800 [&_tr]:border-b-0">
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan="5" className="px-5 py-12 text-center text-slate-400">
                    No administrators found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((admin) => (
                  <TableRow key={admin.id} className="transition hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                    <TableCell className="p-4 px-5 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="size-11 shrink-0 rounded-2xl border-2 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                          <AvatarImage src={admin.profileImage} alt={admin.name} className="object-cover" />
                          <AvatarFallback className="rounded-2xl bg-blue-600/10 text-[13px] font-bold tracking-tight text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                            {getInitials(admin.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{admin.name}</p>
                          <p className="truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">{admin.teacherProfile?.designation || 'Institute Admin'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{admin.instituteName || '-'}</TableCell>
                    <TableCell className="p-4 px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{admin.email || '-'}</TableCell>
                    <TableCell className="p-4 px-5 py-4">
                      {admin.isPrimaryAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
                          <Shield className="size-3" /> Primary Admin
                        </span>
                      ) : Array.isArray(admin.adminPermissions) && admin.adminPermissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {admin.adminPermissions.slice(0, 3).map((key) => (
                            <span key={key} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {ADMIN_PERMISSION_MODULES.find((m) => m.key === key)?.label || key}
                            </span>
                          ))}
                          {admin.adminPermissions.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              +{admin.adminPermissions.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                          Full Access
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-4 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/school/admin/teachers/${admin.id}`}
                          className="group relative flex size-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <Eye className="size-4" />
                          <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                        </Link>
                        {canManageAdmins && !admin.isPrimaryAdmin && (
                          <button
                            onClick={() => openPermissionModal(admin)}
                            className="group relative flex size-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            aria-label="Manage access"
                          >
                            <KeyRound className="size-4" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Manage Access</span>
                          </button>
                        )}
                        {canManageAdmins && (
                          <button
                            onClick={() => handleEdit(admin)}
                            className="group relative flex size-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            aria-label="Edit administrator"
                          >
                            <Edit2 className="size-4" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Edit</span>
                          </button>
                        )}
                        {canManageAdmins && !admin.isPrimaryAdmin && (
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="group relative flex size-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            aria-label="Delete administrator"
                          >
                            <Trash2 className="size-4" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Delete</span>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
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
                  <div key={teacher.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {teacher.profileImage ? (
                          <img src={teacher.profileImage} alt={teacher.name} className="size-full object-cover" />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-blue-600/10 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-sky-200">
                            {(teacher.name || 'T').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{teacher.name}</p>
                        <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{teacher.email || 'No email'}</p>
                        {isAdmin && (
                          <p className="truncate text-[10px] font-bold text-indigo-500">
                            {teacher.isPrimaryAdmin
                              ? 'Primary Admin'
                              : Array.isArray(teacher.adminPermissions) && teacher.adminPermissions.length > 0
                                ? `${teacher.adminPermissions.length} module${teacher.adminPermissions.length !== 1 ? 's' : ''} granted`
                                : 'Full Access'}
                          </p>
                        )}
                      </div>
                    </div>
                    {teacher.isPrimaryAdmin ? (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">Primary</span>
                    ) : isAdmin ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => openPermissionModal(teacher)}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-400"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => handleRevokeAdmin(teacher)}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                        >
                          Revoke
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openPermissionModal(teacher)}
                        className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:brightness-110"
                      >
                        Grant Access
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Permission picker — grant/manage a teacher's scoped admin-panel access */}
      <Modal
        isOpen={!!permissionTeacher}
        title={`Admin Access — ${permissionTeacher?.name || ''}`}
        onClose={() => { if (!savingPermissions) setPermissionTeacher(null); }}
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm font-semibold text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-sky-200">
            Select which admin-panel modules {permissionTeacher?.name || 'this person'} can access. They will only see and be able to use these sections.
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-[45vh] overflow-y-auto pr-1">
            {ADMIN_PERMISSION_MODULES.map(({ key, label, icon: Icon }) => {
              const checked = selectedPermissions.includes(key);
              return (
                <label
                  key={key}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition',
                    checked
                      ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-950/20'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePermission(key)}
                    className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Icon className="size-4 shrink-0 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{label}</span>
                </label>
              );
            })}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setPermissionTeacher(null)}
              disabled={savingPermissions}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={savingPermissions || selectedPermissions.length === 0}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingPermissions ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {savingPermissions ? 'Saving…' : 'Save Access'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
