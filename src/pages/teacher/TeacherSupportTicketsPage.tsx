import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Plus,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
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

export default function TeacherSupportTicketsPage() {
  const navigate = useNavigate();

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

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<string>(TICKET_CATEGORIES[0]);
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [page, search, selectedCategory, selectedPriority, selectedStatus]);

  async function loadTickets() {
    setLoading(true);
    try {
      const params: ListTicketsQueryParams = {
        page,
        limit,
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        priority: (selectedPriority as TicketPriority) || undefined,
        status: (selectedStatus as TicketStatus) || undefined,
      };

      const res = await supportTicketApi.listTickets(params);
      setTickets(res.data || []);
      setTotal(res.total || 0);
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
        recipientType: 'INSTITUTE_ADMIN',
      });

      toast.success('Support ticket submitted to Institute Admin');
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
    <div className="w-full px-4 pt-2 sm:pt-4 pb-24 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* ── Main Header Hero Card ── */}
      <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl px-5 pt-5 pb-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/15 transition-all duration-300">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
              <Ticket className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">My Support Tickets</h1>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            Submit and track support requests with your institute administration.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all shrink-0 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Create Support Ticket
        </button>
      </div>

      {/* Workspace */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Search & Filter Bar (Two Rows) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white space-y-3">
          {/* Row 1: Full-Width Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject or ticket ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 sm:py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Row 2: Category, Priority, and Status Filters */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 text-[11px] sm:text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none bg-white truncate"
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
                className="w-full rounded-xl border border-slate-200 pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 text-[11px] sm:text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none bg-white truncate"
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
                className="w-full rounded-xl border border-slate-200 pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-2 text-[11px] sm:text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none bg-white truncate"
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
        </div>

        {/* Tickets Display */}
        <div>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Ticket className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No support tickets found</p>
              <p className="mt-1 text-xs">Create a support ticket if you need assistance from institute admin.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Stacked Cards with Bold White Background & Shadow Border */}
              <div className="block sm:hidden space-y-3.5 p-3.5 bg-slate-100/60 border-b border-slate-200/80">
                {tickets.map((t) => {
                  const prio = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                  const stat = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;

                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/teacher/support-tickets/${t.id}`)}
                      className="rounded-2xl border border-slate-200/90 p-4 bg-white shadow-md shadow-slate-200/60 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer space-y-3 active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-indigo-600">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-[10px] font-bold border',
                            stat.bg,
                            stat.text,
                            stat.border,
                          )}
                        >
                          {stat.label}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {t.subject}
                      </h4>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/80 text-[10px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                            {t.category}
                          </span>
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 font-bold border',
                              prio.bg,
                              prio.text,
                              prio.border,
                            )}
                          >
                            {prio.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-600 font-bold ml-auto">
                          <span>View</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Full Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3.5">Ticket ID</th>
                      <th className="px-5 py-3.5">Subject</th>
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
                          onClick={() => navigate(`/teacher/support-tickets/${t.id}`)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4 font-bold text-indigo-600">{t.ticketNumber}</td>
                          <td className="px-5 py-4 font-bold text-slate-900 max-w-xs truncate">
                            {t.subject}
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
              </div>
            </>
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
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Support Ticket</h3>
            <p className="text-xs text-slate-500 mb-6">
              Submit an operational or technical request to your institute administration.
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
                  placeholder="Provide full details of your request..."
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
