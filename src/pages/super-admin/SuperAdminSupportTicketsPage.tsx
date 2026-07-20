import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Search,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
  Inbox,
  Building2,
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
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function SuperAdminSupportTicketsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'direct' | 'escalated' | 'all'>('direct');
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

  // Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0,
  });

  useEffect(() => {
    loadTickets();
  }, [activeTab, page, search, selectedCategory, selectedPriority, selectedStatus]);

  async function loadTickets() {
    setLoading(true);
    try {
      const scopeMap: Record<string, 'outgoing' | 'escalated' | 'all'> = {
        direct: 'outgoing', // In backend query: recipient = SUPER_ADMIN or createdBy = SUPER_ADMIN
        escalated: 'escalated',
        all: 'all',
      };

      const params: ListTicketsQueryParams = {
        scope: scopeMap[activeTab] || 'all',
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

      if (res.data) {
        setMetrics({
          total: res.total || res.data.length,
          open: res.data.filter((t) => t.status === 'OPEN').length,
          inProgress: res.data.filter((t) => t.status === 'IN_PROGRESS').length,
          escalated: res.data.filter((t) => t.escalationStatus === 'ESCALATED').length,
          resolved: res.data.filter((t) => t.status === 'CLOSED' || t.status === 'RESOLVED').length,
        });
      }
    } catch (err: any) {
      toast.error('Failed to load platform support tickets');
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="mx-auto max-w-7xl px-1 pt-0 pb-8 sm:py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mt-4 sm:mt-0 mb-4 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-slate-200 rounded-2xl p-4 sm:border-0 sm:rounded-none sm:p-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Ticket className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Operations</h1>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Monitor tenant support activity across institutes and manage platform-wide tickets.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="mb-4 sm:mb-8 border border-slate-200 rounded-2xl p-4 sm:border-0 sm:rounded-none sm:p-0">
        <p className="text-sm font-black uppercase text-slate-500 tracking-wider mb-3 sm:hidden">Quick Overview</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between text-slate-400">
              <span className="text-[8px] sm:text-xs font-bold uppercase tracking-wider text-center sm:text-left">Total Tickets</span>
              <Inbox className="h-4 w-4 text-indigo-500 hidden sm:block" />
            </div>
            <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black text-slate-900 text-center sm:text-left">{metrics.total}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between text-slate-400">
              <span className="text-[8px] sm:text-xs font-bold uppercase tracking-wider text-center sm:text-left">Open</span>
              <AlertCircle className="h-4 w-4 text-emerald-500 hidden sm:block" />
            </div>
            <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black text-slate-900 text-center sm:text-left">{metrics.open}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between text-slate-400">
              <span className="text-[8px] sm:text-xs font-bold uppercase tracking-wider text-center sm:text-left">In Progress</span>
              <Clock className="h-4 w-4 text-blue-500 hidden sm:block" />
            </div>
            <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black text-slate-900 text-center sm:text-left">{metrics.inProgress}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-2 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:justify-between text-slate-400">
              <span className="text-[8px] sm:text-xs font-bold uppercase tracking-wider text-center sm:text-left">Escalated</span>
              <ShieldAlert className="h-4 w-4 text-purple-500 hidden sm:block" />
            </div>
            <p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-black text-slate-900 text-center sm:text-left">{metrics.escalated}</p>
          </div>
        </div>
      </div>

      {/* Workspace Tabs & Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none border-b border-slate-100 bg-slate-50/50 px-2 sm:px-4 pt-3">
          {[
            { key: 'direct', label: 'Direct Support Tickets', icon: Inbox },
            { key: 'escalated', label: 'Escalated Tickets', icon: ShieldAlert },
            { key: 'all', label: 'All Platform Tickets', icon: Ticket },
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
                  'flex items-center gap-1.5 border-b-2 px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-bold transition-all shrink-0 whitespace-nowrap',
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

        {/* Search & Filter Bar */}
        <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-4 border-b border-slate-100 bg-white">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, subject, institute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              options={[
                { value: "", label: "All Categories" },
                ...TICKET_CATEGORIES.map((c) => ({ value: c, label: c })),
              ]}
              triggerClassName="flex h-full w-full items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <CustomSelect
              value={selectedPriority}
              onChange={(val) => setSelectedPriority(val)}
              options={[
                { value: "", label: "All Priorities" },
                ...TICKET_PRIORITIES.map((p) => ({
                  value: p,
                  label: `${PRIORITY_CONFIG[p]?.label} Priority`,
                })),
              ]}
              triggerClassName="flex h-full w-full items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
            />
          </div>

          <div>
            <CustomSelect
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={[
                { value: "", label: "All Statuses" },
                ...TICKET_STATUSES.map((s) => ({
                  value: s,
                  label: STATUS_CONFIG[s]?.label || s,
                })),
              ]}
              triggerClassName="flex h-full w-full items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
            />
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
              <p className="mt-1 text-xs">No active tickets match the current selection.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Vertical Cards */}
              <div className="sm:hidden divide-y divide-slate-100 bg-white">
                {tickets.map((t) => {
                  const prio = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                  const stat = STATUS_CONFIG[t.status] || STATUS_CONFIG.OPEN;

                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/super-admin/support-tickets/${t.id}`)}
                      className="p-4 space-y-3 active:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {/* ID & Date */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-600">{t.ticketNumber}</span>
                        <span className="text-slate-400 font-medium">{new Date(t.updatedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Subject */}
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {t.subject}
                      </p>

                      {/* Info (Institute & Category) */}
                      <div className="flex flex-col gap-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{t.instituteName || 'Platform / Direct'}</span>
                        </div>
                        <div className="pl-5 text-slate-400 text-[10px]">
                          Category: <span className="font-semibold text-slate-500">{t.category}</span>
                        </div>
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                        <div className="text-[10px] font-semibold text-slate-500">
                          <span className="font-bold text-slate-700 block">{t.createdByName || 'User'}</span>
                          <span className="text-[9px] uppercase text-slate-400 block">{t.createdByRole}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 text-[9px] font-bold border',
                              prio.bg,
                              prio.text,
                              prio.border,
                            )}
                          >
                            {prio.label}
                          </span>
                          <span
                            className={cn(
                              'inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold border',
                              stat.bg,
                              stat.text,
                              stat.border,
                            )}
                          >
                            {stat.label}
                          </span>
                          {t.escalationStatus === 'ESCALATED' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-600 border border-purple-100 bg-purple-50 rounded-md px-1.5 py-0.5">
                              <ShieldAlert className="h-2.5 w-2.5" /> Escalated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Tickets Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3.5">Ticket ID</th>
                      <th className="px-5 py-3.5">Subject</th>
                      <th className="px-5 py-3.5">Institute</th>
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
                          onClick={() => navigate(`/super-admin/support-tickets/${t.id}`)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4 font-bold text-indigo-600">{t.ticketNumber}</td>
                          <td className="px-5 py-4 font-bold text-slate-900 max-w-xs truncate">
                            {t.subject}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-slate-400" />
                              <span>{t.instituteName || 'Platform / Direct'}</span>
                            </div>
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
                            <div className="flex flex-col gap-1">
                              <span
                                className={cn(
                                  'inline-block rounded-md px-2 py-0.5 text-[11px] font-bold border w-fit',
                                  stat.bg,
                                  stat.text,
                                  stat.border,
                                )}
                              >
                                {stat.label}
                              </span>
                              {t.escalationStatus === 'ESCALATED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600">
                                  <ShieldAlert className="h-3 w-3" /> Escalated
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-normal">
                            {new Date(t.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                              View & Reply <ChevronRight className="h-3.5 w-3.5" />
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
    </div>
  );
}
