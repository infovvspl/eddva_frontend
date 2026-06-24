import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api/school-client';
import { InstituteLogo, StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { useAuth } from '@/context/SchoolAuthContext';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

const statusIcon = {
  OPEN: AlertCircle,
  IN_PROGRESS: Clock,
  RESOLVED: CheckCircle,
  CLOSED: CheckCircle,
};

export default function Complaints() {
  const { user } = useAuth();
  const isInstituteAdmin = user?.role === 'INSTITUTE_ADMIN';

  const [activeTab, setActiveTab] = useState(isInstituteAdmin ? 'user-support' : 'platform-support');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [newTicket, setNewTicket] = useState({ title: '', description: '' });
  const [error, setError] = useState('');

  // Parent/Teacher Grievances
  const [grievances, setGrievances] = useState([]);
  const [loadingGrievances, setLoadingGrievances] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Reset pagination when tab changes
  useEffect(() => {
    setPage(1);
    setTotal(0);
    setTotalPages(1);
  }, [activeTab]);

  async function loadComplaints() {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      searchParams.append('page', page.toString());
      searchParams.append('limit', limit.toString());
      if (query.trim()) searchParams.append('search', query.trim());

      const res = await api.get(`/complaints?${searchParams.toString()}`);
      const list = res.data?.data || res.data || [];
      setComplaints(list);
      
      const resData = res.data;
      if (resData) {
        if (typeof resData.total === 'number') {
          setTotal(resData.total);
          setTotalPages(resData.totalPages || 1);
        } else if (resData.data && typeof resData.data.total === 'number') {
          setTotal(resData.data.total);
          setTotalPages(resData.data.totalPages || 1);
        } else {
          setTotal(list.length);
          setTotalPages(1);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load support tickets.');
    } finally {
      setLoading(false);
    }
  }

  async function loadGrievances() {
    try {
      setLoadingGrievances(true);
      const searchParams = new URLSearchParams();
      searchParams.append('page', page.toString());
      searchParams.append('limit', limit.toString());
      if (query.trim()) searchParams.append('search', query.trim());

      const res = await api.get(`/grievances?${searchParams.toString()}`);
      const list = res.data?.data || res.data || [];
      setGrievances(list);
      
      const resData = res.data;
      if (resData) {
        if (typeof resData.total === 'number') {
          setTotal(resData.total);
          setTotalPages(resData.totalPages || 1);
        } else if (resData.data && typeof resData.data.total === 'number') {
          setTotal(resData.data.total);
          setTotalPages(resData.data.totalPages || 1);
        } else {
          setTotal(list.length);
          setTotalPages(1);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load parent & teacher grievances.');
    } finally {
      setLoadingGrievances(false);
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeTab === 'platform-support') {
        loadComplaints();
      } else if (activeTab === 'user-support' && isInstituteAdmin) {
        loadGrievances();
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [user, activeTab, page, limit, query]);

  const filteredComplaints = complaints;
  const filteredGrievances = grievances;

  const counts = useMemo(() => {
    return complaints.reduce(
      (acc, item) => {
        const s = String(item.status || 'OPEN').toUpperCase();
        acc[s] = (acc[s] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 }
    );
  }, [complaints]);

  const grievancesCounts = useMemo(() => {
    return grievances.reduce(
      (acc, item) => {
        const s = String(item.status || 'OPEN').toUpperCase();
        acc[s] = (acc[s] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 }
    );
  }, [grievances]);

  const activeCounts = isInstituteAdmin && activeTab === 'user-support' ? grievancesCounts : counts;

  async function createTicket(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/complaints', newTicket);
      setNewTicket({ title: '', description: '' });
      await loadComplaints();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to create ticket.');
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/complaints/${id}`, { status });
      await loadComplaints();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to update ticket.');
    }
  }

  async function updateGrievanceStatus(id, status) {
    try {
      await api.put(`/grievances/${id}`, { status });
      await loadGrievances();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to update grievance.');
    }
  }

  const isLoading = activeTab === 'user-support' ? loadingGrievances : loading;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-950">Support Operations</h1>
          <p className="mt-2 text-sm font-medium text-surface-500">
            {user?.role === 'SUPER_ADMIN'
              ? 'Monitor tenant support activity across institutes.'
              : 'Manage parent & teacher tickets, or raise issues to platform support.'}
          </p>
        </div>
        <div className="relative lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder={activeTab === 'user-support' ? "Search parent & teacher tickets..." : "Search platform tickets..."}
            className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Dynamic Status Counter Grid */}
      <div className="grid gap-4 lg:grid-cols-4">
        {[
          ['Total', activeCounts.total, 'bg-brand-50 text-brand-700'],
          ['Open', activeCounts.OPEN, 'bg-red-50 text-red-600'],
          ['In Progress', activeCounts.IN_PROGRESS, 'bg-amber-50 text-amber-700'],
          ['Resolved', (activeCounts.RESOLVED || 0) + (activeCounts.CLOSED || 0), 'bg-emerald-50 text-emerald-600'],
        ].map(([label, value, tone]) => (
          <div key={label} className="glass-panel rounded-lg p-5 shadow-soft">
            <div className={`mb-3 inline-flex rounded-lg px-3 py-2 text-sm font-bold ${tone}`}>{label}</div>
            <p className="font-display text-3xl font-bold text-surface-950">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs selector for Institute Admin */}
      {isInstituteAdmin && (
        <div className="flex border-b border-surface-200 dark:border-surface-800">
          <button
            onClick={() => setActiveTab('user-support')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'user-support'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            User Support (Parents & Teachers)
          </button>
          <button
            onClick={() => setActiveTab('platform-support')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'platform-support'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            Platform Support (To Super Admin)
          </button>
        </div>
      )}

      {/* PLATFORM SUPPORT CREATE TICKET FORM */}
      {isInstituteAdmin && activeTab === 'platform-support' && (
        <form onSubmit={createTicket} className="glass-panel rounded-lg p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold text-surface-950">Create Support Ticket</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.3fr_auto]">
            <input
              required
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium outline-none focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100"
              placeholder="Ticket title"
            />
            <input
              required
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium outline-none focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100"
              placeholder="Describe the issue"
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
        </form>
      )}

      {/* TICKETS LIST TABLE */}
      <div className="glass-panel overflow-hidden rounded-lg shadow-soft">
        <div className="overflow-x-auto">
          {activeTab === 'user-support' ? (
            /* USER SUPPORT TABLE (GRIEVANCES) */
            <table className="min-w-[700px] w-full text-left">
              <thead>
                <tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500">
                  <th className="p-4 pl-5">Ticket / Concern</th>
                  <th className="p-4">Raised By</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-t border-surface-100">
                      <td className="p-4 pl-5"><Skeleton className="h-12 w-72" /></td>
                      <td className="p-4"><Skeleton className="h-10 w-44" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-28" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-28" /></td>
                      <td className="p-4"><Skeleton className="ml-auto h-8 w-24" /></td>
                    </tr>
                  ))
                ) : filteredGrievances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-sm font-semibold text-surface-500">
                      No parent or teacher support tickets found.
                    </td>
                  </tr>
                ) : (
                  filteredGrievances.map((item) => {
                    const statusUpper = String(item.status || 'OPEN').toUpperCase();
                    const Icon = statusIcon[statusUpper] || AlertCircle;
                    const roleLabel = String(item.raised_by_role || '').toUpperCase() === 'TEACHER' ? 'Teacher' : 'Parent';
                    const categoryLabel = item.category ? `${item.category}` : 'General';
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-t border-surface-100 transition hover:bg-surface-50"
                      >
                        <td className="p-4 pl-5">
                          <p className="font-bold text-surface-950">{item.title}</p>
                          <p className="mt-1 max-w-xl text-xs font-medium text-surface-500">{item.description}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-surface-800">{item.raised_by_name || 'Anonymous'}</p>
                          <span className={`mt-0.5 inline-block text-[10px] font-bold uppercase ${roleLabel === 'Teacher' ? 'text-violet-600' : 'text-blue-600'}`}>
                            {roleLabel} · {categoryLabel}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-4 w-4 text-brand-600" />
                            <StatusBadge status={statusUpper} />
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium text-surface-500">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={statusUpper}
                            onChange={(e) => updateGrievanceStatus(item.id, e.target.value)}
                            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-surface-700 outline-none focus:border-brand-300"
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* PLATFORM SUPPORT TABLE (COMPLAINTS) */
            <table className="min-w-[700px] w-full text-left">
              <thead>
                <tr className="bg-surface-50 text-xs font-bold uppercase text-surface-500">
                  <th className="p-4 pl-5">Ticket</th>
                  {user?.role === 'SUPER_ADMIN' && <th className="p-4">Institute</th>}
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Move</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-t border-surface-100">
                      <td className="p-4 pl-5"><Skeleton className="h-12 w-72" /></td>
                      {user?.role === 'SUPER_ADMIN' && <td className="p-4"><Skeleton className="h-10 w-44" /></td>}
                      <td className="p-4"><Skeleton className="h-8 w-28" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-28" /></td>
                      <td className="p-4"><Skeleton className="ml-auto h-8 w-24" /></td>
                    </tr>
                  ))
                ) : filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'SUPER_ADMIN' ? 5 : 4} className="p-10 text-center text-sm font-semibold text-surface-500">
                      No support tickets found.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((item) => {
                    const Icon = statusIcon[item.status] || AlertCircle;
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-t border-surface-100 transition hover:bg-surface-50"
                      >
                        <td className="p-4 pl-5">
                          <p className="font-bold text-surface-950">{item.title}</p>
                          <p className="mt-1 max-w-xl text-xs font-medium text-surface-500">{item.description}</p>
                        </td>
                        {user?.role === 'SUPER_ADMIN' && (
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <InstituteLogo institute={item.institute} size="sm" />
                              <p className="text-sm font-bold text-surface-700">{item.institute?.name || 'Unknown'}</p>
                            </div>
                          </td>
                        )}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-4 w-4 text-brand-600" />
                            <StatusBadge status={item.status} />
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium text-surface-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          {user?.role === 'SUPER_ADMIN' ? (
                            <select
                              value={item.status}
                              onChange={(e) => updateStatus(item.id, e.target.value)}
                              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-surface-700 outline-none focus:border-brand-300"
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved</option>
                              <option value="CLOSED">Closed</option>
                            </select>
                          ) : (
                            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                              Locked
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-surface-200 bg-white p-1">
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
    </div>
  );
}
