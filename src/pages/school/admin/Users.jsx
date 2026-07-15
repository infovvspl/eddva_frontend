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
  const limit = 50;

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
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
      setTotalPages(res.data?.meta?.totalPages || res.data?.totalPages || 1);
      setTotalItems(res.data?.meta?.totalItems || res.data?.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [debouncedSearch, roleFilter, statusFilter, selectedInstituteId, page]);

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
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-200 bg-surface-50 p-4">
            <p className="text-sm font-medium text-surface-500">
              Showing <span className="font-bold text-surface-900">{users.length}</span> of <span className="font-bold text-surface-900">{totalItems}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-surface-200 bg-white p-2 text-surface-500 hover:bg-surface-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm font-bold text-surface-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-surface-200 bg-white p-2 text-surface-500 hover:bg-surface-100 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
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
