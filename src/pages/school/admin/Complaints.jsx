import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Plus, Search, X, Building2, User, Mail, Phone, Globe, Calendar, MessageSquare, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { InstituteLogo, SchoolLogo, StatusBadge } from '@/components/school/admin/Brand';
import { Skeleton } from '@/components/school/admin/Skeleton';
import { useAuth } from '@/context/SchoolAuthContext';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { CustomSelect } from "@/components/ui/CustomSelect";

const statusIcon = {
  OPEN: AlertCircle,
  IN_PROGRESS: Clock,
  RESOLVED: CheckCircle,
  CLOSED: CheckCircle,
};

export default function Complaints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isInstituteAdmin = user?.role === 'INSTITUTE_ADMIN';
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  const client = isSuperAdminRoute ? apiClient : api;

  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return isInstituteAdmin && (tab === 'platform-support' || tab === 'user-support') ? tab : (isInstituteAdmin ? 'user-support' : 'platform-support');
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [newTicket, setNewTicket] = useState({ title: '', description: '' });
  const [error, setError] = useState('');

  // Selected item modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'complaint' or 'grievance'

  // Reply states
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [supportMessages, setSupportMessages] = useState([]);
  const [loadingSupportMessages, setLoadingSupportMessages] = useState(false);

  // Student/Teacher Grievances
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

      const complaintsEndpoint = isSuperAdminRoute ? '/admin/complaints' : '/complaints';
      const res = await client.get(`${complaintsEndpoint}?${searchParams.toString()}`);
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
    if (isSuperAdminRoute) {
      setGrievances([]);
      return;
    }
    try {
      setLoadingGrievances(true);
      const searchParams = new URLSearchParams();
      searchParams.append('page', page.toString());
      searchParams.append('limit', limit.toString());
      if (query.trim()) searchParams.append('search', query.trim());

      const res = await client.get(`/grievances?${searchParams.toString()}`);
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
      const complaintsEndpoint = isSuperAdminRoute ? '/admin/complaints' : '/complaints';
      await client.post(complaintsEndpoint, newTicket);
      setNewTicket({ title: '', description: '' });
      await loadComplaints();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to create ticket.');
    }
  }

  async function updateStatus(id, status) {
    try {
      const complaintsEndpoint = isSuperAdminRoute ? `/admin/complaints/${id}` : `/complaints/${id}`;
      await client.put(complaintsEndpoint, { status });
      await loadComplaints();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to update ticket.');
    }
  }

  async function updateGrievanceStatus(id, status) {
    try {
      await client.put(`/grievances/${id}`, { status });
      await loadGrievances();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to update grievance.');
    }
  }

  // Reset reply states when selected item changes
  useEffect(() => {
    setReplyText('');
    setReplySuccess(false);
    setSupportMessages([]);
  }, [selectedItem]);

  async function loadTicketSupportMessages(item, type, options = {}) {
    const { silent = false } = options;
    if (!item || !['complaint', 'grievance'].includes(type)) return;
    if (!silent) setLoadingSupportMessages(true);
    try {
      const endpoint = isSuperAdminRoute
        ? `/admin/complaints/${item.id}/messages`
        : `/${type === 'complaint' ? 'complaints' : 'grievances'}/${item.id}/messages`;
      const messagesRes = await client.get(endpoint);
      const messages = messagesRes.data?.data || [];
      setSupportMessages(Array.isArray(messages) ? messages : []);
    } catch {
      setSupportMessages([]);
    } finally {
      if (!silent) setLoadingSupportMessages(false);
    }
  }

  useEffect(() => {
    if (!['complaint', 'grievance'].includes(selectedType) || !selectedItem) return;
    loadTicketSupportMessages(selectedItem, selectedType);
  }, [selectedType, selectedItem]);

  async function handleSendReply() {
    if (!replyText.trim() || !selectedItem) return;
    setSendingReply(true);
    setError('');
    try {
      const endpoint = isSuperAdminRoute
        ? `/admin/complaints/${selectedItem.id}/messages`
        : `/${selectedType === 'complaint' ? 'complaints' : 'grievances'}/${selectedItem.id}/messages`;
      await client.post(endpoint, {
        content: replyText.trim(),
      });
      setReplySuccess(true);
      setReplyText('');
      await loadTicketSupportMessages(selectedItem, selectedType, { silent: true });
      setTimeout(() => setReplySuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send reply message.');
    } finally {
      setSendingReply(false);
    }
  }

  async function reopenSelectedTicket() {
    if (!selectedItem) return;
    if (selectedType === 'grievance') {
      await updateGrievanceStatus(selectedItem.id, 'REOPENED');
    } else if (selectedType === 'complaint') {
      await updateStatus(selectedItem.id, 'REOPENED');
    }
    setSelectedItem((prev) => (prev ? { ...prev, status: 'REOPENED' } : prev));
  }

  function openPlatformTicketChat(item) {
    const num = item.ticketNumber || item.ticket_number || `${selectedType === 'complaint' ? 'PLT' : 'USR'}-${String(item.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const targetUserId = item.userId || item.user_id;
    let url = '';
    if (selectedType === 'complaint') {
      url = `${isSuperAdminRoute ? '/super-admin/communication' : '/school/admin/communications'}?panel=SUPER_ADMIN&ticketId=${encodeURIComponent(num)}&ticketType=complaint${targetUserId ? `&userId=${encodeURIComponent(targetUserId)}` : ''}`;
    } else {
      const panel = String(item.raised_by_role || '').toUpperCase() === 'TEACHER' ? 'TEACHER' : 'PARENT';
      url = `/school/admin/communications?panel=${panel}&ticketId=${encodeURIComponent(num)}&ticketType=grievance${targetUserId ? `&userId=${encodeURIComponent(targetUserId)}` : ''}`;
    }
    navigate(url);
  }

  function closeTicketModal() {
    setSelectedItem(null);
    setSelectedType(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('ticketId');
    nextParams.delete('search');
    navigate(
      {
        pathname: isSuperAdminRoute ? '/super-admin/complaints' : '/school/admin/complaints',
        search: nextParams.toString() ? `?${nextParams.toString()}` : '',
      },
      { replace: true },
    );
  }

  // Handle auto-opening ticket from URL searchParams
  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (!ticketId || selectedItem) return;
    const normalizedTicket = ticketId.replace(/^#/, '').toUpperCase();
    const source = activeTab === 'user-support' ? filteredGrievances : filteredComplaints;
    const found = source.find((item) => {
      const number = item.ticketNumber || item.ticket_number || `${activeTab === 'user-support' ? 'USR' : 'PLT'}-${String(item.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;
      return String(number).toUpperCase() === normalizedTicket;
    });
    if (found) {
      setSelectedItem(found);
      setSelectedType(activeTab === 'user-support' ? 'grievance' : 'complaint');
    }
  }, [activeTab, filteredComplaints, filteredGrievances, searchParams, selectedItem]);

  useEffect(() => {
    const ticketSearch = searchParams.get('search') || searchParams.get('ticketId');
    if (ticketSearch && query !== ticketSearch.replace(/^#/, '')) {
      setQuery(ticketSearch.replace(/^#/, ''));
      setPage(1);
    }
  }, [searchParams]);

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
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'user-support'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
          >
            User Support (Parents & Teachers)
          </button>
          <button
            onClick={() => setActiveTab('platform-support')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'platform-support'
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
                        className="border-t border-surface-100 transition hover:bg-surface-50 cursor-pointer"
                        onClick={() => { setSelectedItem(item); setSelectedType('grievance'); }}
                      >
                        <td className="p-4 pl-5">
                          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                            #{item.ticketNumber || item.ticket_number || `USR-${String(item.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                          </p>
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedType('grievance');
                                openPlatformTicketChat(item);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Open Chat
                            </button>
                            <CustomSelect
                              value={statusUpper}
                              onChange={(val) => updateGrievanceStatus(item.id, val)}
                              options={[
                              { value: "OPEN", label: "Open" },
                              { value: "IN_PROGRESS", label: "In Progress" },
                              { value: "RESOLVED", label: "Resolved" },
                              { value: "CLOSED", label: "Closed" },
                            ]}
                              className="w-full"
                            />
                          </div>
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
                        className="border-t border-surface-100 transition hover:bg-surface-50 cursor-pointer"
                        onClick={() => { setSelectedItem(item); setSelectedType('complaint'); }}
                      >
                        <td className="p-4 pl-5">
                          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                            #{item.ticketNumber || `PLT-${String(item.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                          </p>
                          <p className="font-bold text-surface-950">{item.title}</p>
                          <p className="mt-1 max-w-xl text-xs font-medium text-surface-500">{item.description}</p>
                        </td>
                        {user?.role === 'SUPER_ADMIN' && (
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <SchoolLogo src={item.institute?.logo} alt={item.institute?.name} size="navbar" />
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
                          <div className="flex items-center justify-end gap-2">
                            {user?.role === 'SUPER_ADMIN' ? (
                              <CustomSelect
                                value={item.status}
                                onChange={(val) => updateStatus(item.id, val)}
                                options={[
                                { value: "OPEN", label: "Open" },
                                { value: "IN_PROGRESS", label: "In Progress" },
                                { value: "RESOLVED", label: "Resolved" },
                                { value: "CLOSED", label: "Closed" },
                              ]}
                                className="w-full"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPlatformTicketChat(item);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Open Chat
                              </button>
                            )}
                          </div>
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

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeTicketModal}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedType === 'complaint' ? 'Platform Support Ticket' : 'Support Ticket'}
                </span>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-blue-600">
                  #{selectedItem.ticketNumber || selectedItem.ticket_number || `${selectedType === 'complaint' ? 'PLT' : 'USR'}-${String(selectedItem.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-950 dark:text-white">
                  {selectedItem.title}
                </h2>
              </div>
              <button
                onClick={closeTicketModal}
                className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <div className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description || 'No description provided.'}
                </div>
              </div>

              {/* Grid of Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Status */}
                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</h4>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={String(selectedItem.status || 'OPEN').toUpperCase()} />
                  </div>
                </div>

                {/* Created At */}
                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Created At</h4>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {new Date(selectedItem.createdAt || selectedItem.created_at).toLocaleString()}
                  </p>
                </div>

                {/* If Grievance */}
                {selectedType === 'grievance' && (
                  <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</h4>
                    <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedItem.category || 'General'}
                    </p>
                  </div>
                )}

                {/* If Complaint & SUPER_ADMIN */}
                {selectedType === 'complaint' && selectedItem.institute && user?.role === 'SUPER_ADMIN' && (
                  <div className="col-span-full rounded-2xl border border-slate-100 p-4 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Institute Information</h4>
                    <div className="flex items-center gap-4">
                      <SchoolLogo src={selectedItem.institute?.logo} alt={selectedItem.institute?.name} size="sidebar" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {selectedItem.institute.name}
                        </p>
                        {selectedItem.institute.tenant_domain && (
                          <p className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">
                            <Globe className="h-3 w-3" />
                            {selectedItem.institute.tenant_domain}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ticket messages */}
                {['complaint', 'grievance'].includes(selectedType) && (
                  <div className="col-span-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 space-y-3">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      {selectedType === 'complaint'
                        ? (user?.role === 'SUPER_ADMIN' ? 'Ticket Messages' : 'Super Admin Replies')
                        : (isInstituteAdmin ? 'Ticket Messages' : 'Institute Admin Replies')}
                    </h4>

                    {loadingSupportMessages ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-10 w-4/5" />
                      </div>
                    ) : supportMessages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500">
                        {selectedType === 'complaint'
                          ? (user?.role === 'SUPER_ADMIN'
                            ? 'No messages have been sent to this institute for this ticket yet.'
                            : 'No super admin replies have been sent for this ticket yet.')
                          : 'No replies have been sent for this ticket yet.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {supportMessages.map((message) => {
                          const sentByCurrentUser =
                            String(message.senderId) === String(user?.id) ||
                            (user?.role === 'SUPER_ADMIN' && message.senderRole === 'SUPER_ADMIN');
                          return (
                            <div key={message.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                              <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                                {message.content || 'Message unavailable'}
                              </p>
                              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {selectedType === 'complaint'
                                  ? (user?.role === 'SUPER_ADMIN'
                                    ? (sentByCurrentUser ? 'Sent to institute' : 'Institute reply')
                                    : (message.senderName || 'Super Admin'))
                                  : (sentByCurrentUser ? 'Sent to user' : (message.senderName || 'Institute Admin'))}
                                {' - '}
                                {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Recently'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Ticket reply box */}
                {((user?.role === 'SUPER_ADMIN' && selectedType === 'complaint') || (isInstituteAdmin && selectedType === 'grievance')) && (
                  <div className="col-span-full rounded-2xl border border-slate-100 p-4 dark:border-slate-800 space-y-3 bg-slate-50/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      {selectedType === 'complaint' ? 'Reply to Institute Admin' : 'Reply to Parent or Teacher'}
                    </h4>

                    {replySuccess ? (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs font-semibold text-emerald-700">
                        Message sent successfully!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply here..."
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={handleSendReply}
                            disabled={sendingReply || !replyText.trim()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition"
                          >
                            {sendingReply ? 'Sending...' : 'Send Message'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
              {/* Status Update inside Modal */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Update Status:</span>
                {selectedType === 'grievance' && isInstituteAdmin ? (
                  <CustomSelect
                    value={String(selectedItem.status || 'OPEN').toUpperCase()}
                    onChange={(val) => {
                      void updateGrievanceStatus(selectedItem.id, val);
                      setSelectedItem((prev) => (prev ? { ...prev, status: val } : prev));
                    }}
                    options={[
                    { value: "OPEN", label: "Open" },
                    { value: "IN_PROGRESS", label: "In Progress" },
                    { value: "RESOLVED", label: "Resolved" },
                    { value: "CLOSED", label: "Closed" },
                  ]}
                    className="w-full"
                  />
                ) : selectedType === 'complaint' && user?.role === 'SUPER_ADMIN' ? (
                  <CustomSelect
                    value={selectedItem.status}
                    onChange={(val) => {
                      void updateStatus(selectedItem.id, val);
                      setSelectedItem((prev) => (prev ? { ...prev, status: val } : prev));
                    }}
                    options={[
                    { value: "OPEN", label: "Open" },
                    { value: "IN_PROGRESS", label: "In Progress" },
                    { value: "RESOLVED", label: "Resolved" },
                    { value: "CLOSED", label: "Closed" },
                  ]}
                    className="w-full"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {selectedItem.status} (Locked)
                  </span>
                )}
              </div>

              {isInstituteAdmin && selectedType === 'complaint' && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                    <span>Reopen</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={String(selectedItem.status || 'OPEN').toUpperCase() === 'REOPENED'}
                      disabled={['OPEN', 'REOPENED'].includes(String(selectedItem.status || 'OPEN').toUpperCase())}
                      onChange={(event) => {
                        if (event.target.checked) void reopenSelectedTicket();
                      }}
                      className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-slate-300 transition before:block before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-blue-600 checked:before:translate-x-5 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </label>
                </div>
              )}

              <div className="flex items-center gap-2">
                {(((isInstituteAdmin || user?.role === 'SUPER_ADMIN') && selectedType === 'complaint') || (isInstituteAdmin && selectedType === 'grievance')) && (
                  <button
                    type="button"
                    onClick={() => openPlatformTicketChat(selectedItem)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Open Chat
                  </button>
                )}
                <button
                  onClick={closeTicketModal}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
