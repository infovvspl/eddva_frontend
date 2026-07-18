import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  KeyRound,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { useAuth } from '@/context/SchoolAuthContext';
import { getResponseList } from '@/lib/school/apiData';
import { CustomSelect } from "@/components/ui/CustomSelect";

function getPaginationWindowSize() {
  if (typeof window === 'undefined') return 7;
  if (window.innerWidth < 480) return 3;
  if (window.innerWidth < 768) return 5;
  return 7;
}


// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ targetUser, onClose }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters.');
    setSaving(true);
    try {
      await api.patch(`/admin/users/${targetUser.id}/reset-password`, { password });
      toast.success(`Password reset for ${targetUser.name || targetUser.email}.`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-surface-950">Reset Password</h2>
            <p className="text-xs text-surface-500 mt-0.5 truncate max-w-[200px]">
              {targetUser.name || targetUser.email}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-surface-100 transition">
            <X className="h-4 w-4 text-surface-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-surface-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-lg border border-surface-200 bg-surface-50 py-2.5 pl-3 pr-10 text-sm font-medium outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-surface-200 bg-white py-2 text-sm font-bold text-surface-700 hover:bg-surface-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {saving ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [institutes, setInstitutes] = useState([]);
  const [resetTarget, setResetTarget] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInstituteId, setSelectedInstituteId] = useState(searchParams.get('instituteId') || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(20);
  const [maxVisiblePages, setMaxVisiblePages] = useState(getPaginationWindowSize);

  const [error, setError] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/users', {
        params: {
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          instituteId: selectedInstituteId || undefined,
          page,
          limit,
        },
      });
      const fetchedUsers = res.data?.data || res.data?.items || res.data || [];
      const userRows = Array.isArray(fetchedUsers) ? fetchedUsers : [];
      const responseTotal = Number(
        res.data?.meta?.totalItems ??
        res.data?.meta?.total ??
        res.data?.totalItems ??
        res.data?.total ??
        userRows.length
      );
      const computedTotalPages = Math.max(1, Math.ceil(responseTotal / limit));

      setUsers(userRows);
      setTotalItems(responseTotal);
      setTotalPages(computedTotalPages);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [debouncedSearch, roleFilter, statusFilter, selectedInstituteId, page, limit]);

  useEffect(() => {
    const updatePaginationWindow = () => setMaxVisiblePages(getPaginationWindowSize());
    updatePaginationWindow();
    window.addEventListener('resize', updatePaginationWindow);
    return () => window.removeEventListener('resize', updatePaginationWindow);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadInstitutes() {
      if (!isSuperAdmin) {
        setInstitutes([]);
        return;
      }
      try {
        const res = await api.get('/institutes', { params: { perPage: 200 } });
        if (mounted) setInstitutes(getResponseList(res));
      } catch (err) {
        console.error(err);
        if (mounted) setInstitutes([]);
      }
    }

    loadInstitutes();
    return () => {
      mounted = false;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    const nextRole = searchParams.get('role') || '';
    const nextInstituteId = searchParams.get('instituteId') || '';
    setRoleFilter(nextRole);
    setSelectedInstituteId(nextInstituteId);
    setPage(1);
  }, [searchParams]);

  function updateRoleFilter(value) {
    setRoleFilter(value);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('role', value);
    else next.delete('role');
    setSearchParams(next, { replace: true });
  }

  function updateInstituteFilter(value) {
    setSelectedInstituteId(value);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('instituteId', value);
    else next.delete('instituteId');
    setSearchParams(next, { replace: true });
  }

  function exportData() {
    if (users.length === 0) return toast.error('No data to export');

    const headers = ['User Name', 'Email', 'Mobile Number', 'User Type', 'Institute Name', 'Registration Date', 'Status', 'Last Login'];
    const csvContent = [
      headers.join(','),
      ...users.map((u) => {
        return [
          `"${u.name || ''}"`,
          `"${u.email || ''}"`,
          `"${u.phone || ''}"`,
          `"${u.role || ''}"`,
          `"${u.institute_name || u.tenant?.name || 'Eddva HQ'}"`,
          `"${new Date(u.createdAt).toLocaleDateString()}"`,
          `"${u.status || 'ACTIVE'}"`,
          `"${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}"`,
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eddva_registered_users_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  const effectiveTotalPages = Math.max(1, totalPages);
  const pageStart = users.length === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = Math.min((page - 1) * limit + users.length, totalItems || users.length);

  const visiblePages = (() => {
    const visibleCount = Math.min(maxVisiblePages, effectiveTotalPages);
    const startPage = Math.min(
      Math.max(1, page - (maxVisiblePages - 2)),
      Math.max(1, effectiveTotalPages - visibleCount + 1)
    );
    return Array.from({ length: visibleCount }, (_, index) => startPage + index);
  })();



  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10 pb-12 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-950">Registered Users</h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-surface-500">
            View and manage all registered users across the platform.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={exportData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-surface-700 transition hover:bg-surface-50 hover:text-brand-600 self-start sm:self-auto sm:px-4 sm:py-2 sm:text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="glass-panel overflow-hidden rounded-lg shadow-soft">
        {/* ── Mobile Filters ── */}
        <div className="flex flex-col md:hidden gap-3 border-b border-surface-200 p-3 bg-surface-50">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-100 px-2.5 py-1 text-xs font-semibold text-surface-700">
              <Search className="h-3.5 w-3.5 text-blue-600" />
              <span>Users Filter</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition",
                showMobileFilters
                  ? "bg-blue-600 border-blue-700 text-white"
                  : "bg-white border-surface-200 text-surface-700"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          {showMobileFilters && (
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-200">
              <CustomSelect
                value={roleFilter}
                onChange={(val) => updateRoleFilter(val)}
                options={[
                  { value: "", label: "All Roles" },
                  { value: "INSTITUTE_ADMIN", label: "Institute Admin" },
                  { value: "PARENT", label: "Parents" },
                  { value: "TEACHER", label: "Teacher" },
                  { value: "STUDENT", label: "Student" },
                ]}
                className="w-full"
              />
              <CustomSelect
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setPage(1); }}
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                  { value: "SUSPENDED", label: "Suspended" },
                ]}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* ── Desktop Filters ── */}
        <div className="hidden md:flex flex-wrap items-center gap-3 border-b border-surface-200 p-4 bg-surface-50">
          <div className="w-40">
            <CustomSelect
              value={roleFilter}
              onChange={(val) => updateRoleFilter(val)}
              options={[
                { value: "", label: "All Roles" },
                { value: "INSTITUTE_ADMIN", label: "Institute Admin" },
                { value: "PARENT", label: "Parents" },
                { value: "TEACHER", label: "Teacher" },
                { value: "STUDENT", label: "Student" },
              ]}
              className="w-full"
            />
          </div>
          <div className="w-40">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "SUSPENDED", label: "Suspended" },
              ]}
              className="w-full"
            />
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500">
                <th className="p-4 pl-5">User</th>
                <th className="p-4">Role & Institute</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Registered</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t border-surface-100">
                    <td className="p-4 pl-5"><Skeleton className="h-10 w-48" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-36" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20" /></td>
                    <td className="p-4"><Skeleton className="ml-auto h-8 w-16" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-sm font-semibold text-surface-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="border-t border-surface-100 transition hover:bg-surface-50">
                    <td className="p-4 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-bold tracking-tight text-brand-700">
                          {(item.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-surface-950">{item.name}</p>
                          <p className="text-xs font-medium text-surface-500">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-fit items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                          {item.role?.replace('_', ' ')}
                        </span>
                        <p className="text-xs font-semibold text-surface-600 truncate max-w-[200px]" title={item.institute_name || item.tenant?.name || 'Eddva HQ'}>
                          {item.institute_name || item.tenant?.name || 'Eddva HQ'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-surface-700">{item.phone || item.parent_phone || item.phoneNumber || item.contact || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-surface-700">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={item.status || 'ACTIVE'} />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setResetTarget(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-bold text-surface-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition"
                        title="Reset password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Reset PW
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-surface-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-surface-500">
              No users found matching your filters.
            </div>
          ) : (
            users.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-sm font-bold tracking-tight text-brand-700">
                      {(item.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-surface-950 truncate">{item.name}</p>
                      <p className="text-xs font-medium text-surface-500 truncate">{item.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={item.status || 'ACTIVE'} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">
                    {item.role?.replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-surface-600 truncate max-w-[180px]">
                    {item.institute_name || item.tenant?.name || 'Eddva HQ'}
                  </span>
                </div>

                <div className="text-xs text-surface-500 space-y-1">
                  <p>Contact: <span className="font-medium text-surface-700">{item.phone || item.parent_phone || item.phoneNumber || item.contact || 'N/A'}</span></p>
                  <p>Registered: <span className="font-medium text-surface-700">{new Date(item.createdAt).toLocaleDateString()}</span></p>
                </div>
                <button
                  onClick={() => setResetTarget(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-2.5 py-1.5 text-xs font-bold text-surface-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition self-start"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Reset Password
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-surface-200 bg-surface-50 p-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs font-medium text-surface-500 sm:text-sm">
              Showing <span className="font-bold text-surface-900">{pageStart}</span> to <span className="font-bold text-surface-900">{pageEnd}</span> of <span className="font-bold text-surface-900">{totalItems || users.length}</span> users
            </p>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex items-center justify-between gap-2 sm:justify-start">
                <span className="whitespace-nowrap text-xs font-medium text-surface-500 sm:text-sm">Rows</span>
                <CustomSelect
                  value={limit}
                  onChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                  }}
                  options={[
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                  ]}
                  className="w-20"
                  triggerClassName="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-bold text-surface-700 outline-none transition hover:bg-surface-100 focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
                />
              </div>
              <div className="flex w-full min-w-0 items-center justify-center gap-1 sm:w-auto sm:gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-100 disabled:opacity-50 sm:h-8 sm:w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 max-w-full overflow-hidden">
                  <div className="flex items-center justify-center gap-1 px-1 sm:gap-1.5">
                    {visiblePages.map((pageNumber) => {
                      const isActive = pageNumber === page;
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          aria-current={isActive ? 'page' : undefined}
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition sm:h-8 sm:w-8 ${
                            isActive
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                              : 'border-surface-200 bg-white text-surface-600 hover:border-indigo-300 hover:text-indigo-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(effectiveTotalPages, p + 1))}
                  disabled={page === effectiveTotalPages}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-surface-200 bg-white text-surface-500 hover:bg-surface-100 disabled:opacity-50 sm:h-8 sm:w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {resetTarget && (
        <ResetPasswordModal targetUser={resetTarget} onClose={() => setResetTarget(null)} />
      )}
    </div>
  );
}
