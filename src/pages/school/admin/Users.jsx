import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { InstituteLogo, StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { useAuth } from '@/context/SchoolAuthContext';
import { getResponseList } from '@/lib/school/apiData';

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [institutes, setInstitutes] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInstituteId, setSelectedInstituteId] = useState(searchParams.get('instituteId') || '');
  
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
    link.download = `eddva_registered_users_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-950">Registered Users</h1>
          <p className="mt-2 text-sm font-medium text-surface-500">
            View and manage all registered users across the platform.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button 
            onClick={exportData}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-bold text-surface-700 transition hover:bg-surface-50 hover:text-brand-600"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <div className="glass-panel overflow-hidden rounded-lg shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-200 p-4 bg-surface-50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => updateRoleFilter(e.target.value)}
              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand-300"
            >
              <option value="">All Roles</option>
              <option value="INSTITUTE_ADMIN">Institute Admin</option>
              <option value="PARENT">Parents</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand-300"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500">
                <th className="p-4 pl-5">User</th>
                <th className="p-4">Role & Institute</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Registered</th>
                <th className="p-4">Status</th>
                <th className="p-4">IP Address</th>
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
                      <p className="text-sm font-medium text-surface-700">{item.phone || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-surface-700">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={item.status || 'ACTIVE'} />
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-surface-700">{item.ip_address || 'N/A'}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-200 bg-surface-50 p-4">
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
    </div>
  );
}
