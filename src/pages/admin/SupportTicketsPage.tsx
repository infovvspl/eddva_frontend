import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
  Inbox,
  Send,
  RefreshCw,
} from 'lucide-react';
import {
  supportTicketApi,
  CoachingTicket,
  ListTicketsQueryParams,
} from '@/lib/api/support-tickets';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TicketPriority,
  TicketStatus,
} from '@/constants/ticket-categories';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SupportTicketsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'received' | 'outgoing' | 'escalated' | 'closed'>('received');
  const [tickets, setTickets] = useState<CoachingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    open: 0,
    inProgress: 0,
    escalated: 0,
    closed: 0,
  });

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<string>(TICKET_CATEGORIES[0]);
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [activeTab, page, search, selectedCategory, selectedPriority, selectedStatus]);

  async function loadTickets() {
    setLoading(true);
    try {
      const scopeMap: Record<string, 'received' | 'outgoing' | 'escalated' | 'all'> = {
        received: 'received',
        outgoing: 'outgoing',
        escalated: 'escalated',
        closed: 'all',
      };

      const params: ListTicketsQueryParams = {
        scope: scopeMap[activeTab] || 'received',
        page,
        limit,
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        priority: (selectedPriority as TicketPriority) || undefined,
        status: activeTab === 'closed' ? ('CLOSED' as TicketStatus) : (selectedStatus as TicketStatus) || undefined,
      };

      const res = await supportTicketApi.listTickets(params);
      setTickets(res.data || []);
      setTotal(res.total || 0);

      // Compute metrics
      if (res.data) {
        setMetrics({
          open: res.data.filter((t) => t.status === 'OPEN').length,
          inProgress: res.data.filter((t) => t.status === 'IN_PROGRESS').length,
          escalated: res.data.filter((t) => t.escalationStatus === 'ESCALATED').length,
          closed: res.data.filter((t) => t.status === 'CLOSED' || t.status === 'RESOLVED').length,
        });
      }
    } catch (err: any) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    setSubmitting(true);
    try {
      await supportTicketApi.createTicket({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        description: newDescription.trim(),
        recipientType: 'SUPER_ADMIN',
      });

      toast.success('Support ticket created and submitted to Super Admin');
      setShowCreateModal(false);
      setNewSubject('');
      setNewDescription('');
      loadTickets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Ticket className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Tickets</h1>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Manage institute support requests and communicate directly with platform support.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
        >
          <Plus className="h-4 w-4" /> Create Ticket to Super Admin
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Open Tickets</span>
            <AlertCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.open}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.inProgress}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Escalated</span>
            <ShieldAlert className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.escalated}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Resolved / Closed</span>
            <CheckCircle2 className="h-4 w-4 text-teal-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{metrics.closed}</p>
        </div>
      </div>

      {/* Workspace Tabs & Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 pt-3">
          {[
            { key: 'received', label: 'Received Tickets', icon: Inbox },
            { key: 'outgoing', label: 'Tickets to Super Admin', icon: Send },
            { key: 'escalated', label: 'Escalated', icon: ShieldAlert },
            { key: 'closed', label: 'Resolved & Closed', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setPage(1);
                }}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all',
                  active
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Inputs */}
        <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-4 border-b border-slate-100 bg-white">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, subject, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Priorities</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_CONFIG[p]?.label} Priority
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s]?.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Ticket className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No support tickets found</p>
              <p className="mt-1 text-xs">Try adjusting your filters or create a new support ticket.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5">Ticket ID</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Raised By</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Activity</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {tickets.map((t) => {
                  const prio = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                  const stat = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/admin/support-tickets/${t.id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-indigo-600">{t.ticketNumber}</td>
                      <td className="px-5 py-4 font-bold text-slate-900 max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="px-5 py-4">
                        <span className="block font-bold text-slate-800">
                          {t.createdByName || 'User'}
                        </span>
                        <span className="text-[10px] uppercase text-slate-400 font-semibold">
                          {t.createdByRole}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{t.category}</td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[11px] font-bold border',
                            prio.bg,
                            prio.text,
                            prio.border,
                          )}
                        >
                          {prio.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[11px] font-bold border',
                            stat.bg,
                            stat.text,
                            stat.border,
                          )}
                        >
                          {stat.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-normal">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                          View <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-white">
            <p className="text-xs text-slate-500">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total tickets)
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Support Ticket to Super Admin</h3>
            <p className="text-xs text-slate-500 mb-6">
              Submit an operational or platform ticket directly to Super Admin.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Summarize your issue..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    {TICKET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority *</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_CONFIG[p]?.label} Priority
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide full context or steps to reproduce..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
