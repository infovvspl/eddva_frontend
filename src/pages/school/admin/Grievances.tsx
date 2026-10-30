import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquareWarning, AlertCircle, Clock, CheckCircle, XCircle, Search, X, Calendar, Send, MessageSquare, User } from 'lucide-react';
import DataTable from '@/components/school/DataTable';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

const TONE_BADGE: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-700',
  info: 'bg-blue-500/10 text-blue-700',
  warning: 'bg-amber-500/10 text-amber-700',
  error: 'bg-red-500/10 text-red-700',
  purple: 'bg-violet-500/10 text-violet-700',
  default: 'bg-slate-500/10 text-slate-600',
};

function ToneBadge({ tone, className, children }: { tone: string; className?: string; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', TONE_BADGE[tone] ?? TONE_BADGE.default, className)}>
      {children}
    </Badge>
  );
}

const STATUS_TONE: Record<string, string> = {
  open: 'error',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
  reopened: 'error',
};
const categoryTone = (v: string) => (v === 'academic' ? 'purple' : v === 'infrastructure' ? 'info' : 'warning');
const ticketNo = (item: any) => item.ticketNumber || item.ticket_number || `USR-${String(item.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function Grievances() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit, sortBy: 'createdAt', sortOrder: 'DESC' };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/grievances', { params });
      setList(res.data?.data || []);
      setTotal(res.data?.total ?? 0);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/grievances', { params: { limit: 1000 } });
      const data = res.data?.data || [];
      setStats({
        open: data.filter((g: any) => String(g.status || '').toUpperCase() === 'OPEN').length,
        inProgress: data.filter((g: any) => String(g.status || '').toUpperCase() === 'IN_PROGRESS').length,
        resolved: data.filter((g: any) => ['RESOLVED', 'CLOSED'].includes(String(g.status || '').toUpperCase())).length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchList(); fetchStats(); }, [page, limit, searchQuery, statusFilter]);

  const openTicketMessages = async (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketMessages([]);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/grievances/${ticket.id}/messages`);
      setTicketMessages(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const closeTicketModal = () => {
    setSelectedTicket(null);
    setReplyText('');
    const next = new URLSearchParams(searchParams);
    next.delete('ticketId');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const ticketId = searchParams.get('ticketId')?.replace(/^#/, '').toUpperCase();
    if (!ticketId || list.length === 0) return;
    const found = list.find((g) => ticketNo(g).toUpperCase() === ticketId);
    if (found && (!selectedTicket || selectedTicket.id !== found.id)) {
      openTicketMessages(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, list]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      await api.post(`/grievances/${selectedTicket.id}/messages`, { content: replyText.trim() });
      setReplyText('');
      const res = await api.get(`/grievances/${selectedTicket.id}/messages`);
      setTicketMessages(Array.isArray(res.data?.data) ? res.data.data : []);
      toast.success('Reply sent');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/grievances/${selectedTicket.id}`, { status });
      setSelectedTicket((prev: any) => (prev ? { ...prev, status: status.toLowerCase() } : prev));
      fetchList();
      fetchStats();
      toast.success(`Marked as ${status.replace('_', ' ').toLowerCase()}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const commitSearch = () => {
    if (searchQuery !== searchInput) { setPage(1); setSearchQuery(searchInput); }
  };

  const columns = [
    { key: 'ticketNumber', title: 'Ticket ID', render: (_v: string, row: any) => <ToneBadge tone="info">{ticketNo(row)}</ToneBadge> },
    { key: 'title', title: 'Grievance' },
    { key: 'category', title: 'Category', render: (v: string) => v ? <ToneBadge tone={categoryTone(v)}>{v}</ToneBadge> : '—' },
    { key: 'raised_by_name', title: 'Raised By', render: (v: string, row: any) => v || row.raisedByName || 'Unknown' },
    { key: 'created_at', title: 'Date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'status', title: 'Status',
      render: (v: string) => {
        const s = String(v || 'open').toLowerCase();
        const icons: Record<string, React.ReactNode> = {
          open: <AlertCircle size={12} className="shrink-0" />,
          in_progress: <Clock size={12} className="shrink-0" />,
          resolved: <CheckCircle size={12} className="shrink-0" />,
          closed: <XCircle size={12} className="shrink-0" />,
          reopened: <AlertCircle size={12} className="shrink-0" />,
        };
        return <ToneBadge tone={STATUS_TONE[s] ?? 'default'} className="gap-1 capitalize">{icons[s]} {s.replace('_', ' ')}</ToneBadge>;
      },
    },
  ];

  if (loading && !list.length) {
    return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading grievances...</div>;
  }

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
            <MessageSquareWarning className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">Grievances</h1>
            <p className="mt-0.5 text-sm text-slate-500">Review and respond to grievances raised by teachers and parents.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { icon: <AlertCircle className="text-rose-500 size-3.5" />, label: `${stats.open} Open`, tone: 'border-rose-100 bg-rose-50 text-rose-700' },
            { icon: <Clock className="text-amber-500 size-3.5" />, label: `${stats.inProgress} In Progress`, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
            { icon: <CheckCircle className="text-emerald-500 size-3.5" />, label: `${stats.resolved} Resolved`, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
          ].map((pill) => (
            <Badge key={pill.label} variant="outline" className={cn('gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold', pill.tone)}>
              {pill.icon}{pill.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search grievances..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setSearchQuery(searchInput); } }}
            onBlur={commitSearch}
            className="h-10 rounded-xl pl-9 pr-8"
          />
          {searchInput && (
            <Button type="button" variant="ghost" size="icon" onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }} className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-slate-400">
              <X size={14} />
            </Button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-10 w-[160px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="REOPENED">Re-Opened</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <DataTable columns={columns} data={list} onRowClick={openTicketMessages} />
      </div>
      <div className="md:hidden space-y-3">
        {list.map((item) => (
          <Card key={item.id} role="button" tabIndex={0} onClick={() => openTicketMessages(item)} className="flex cursor-pointer flex-col gap-2 rounded-2xl p-3.5 shadow-none transition-colors hover:border-blue-200">
            <div className="flex items-center justify-between gap-2">
              <ToneBadge tone="info" className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase">#{ticketNo(item)}</ToneBadge>
              <ToneBadge tone={STATUS_TONE[String(item.status || 'open').toLowerCase()] ?? 'default'} className="capitalize">{String(item.status || 'open').toLowerCase().replace('_', ' ')}</ToneBadge>
            </div>
            <h4 className="text-xs font-bold leading-snug text-slate-800 dark:text-slate-200">{item.title}</h4>
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>By: {item.raised_by_name || 'Unknown'}</span>
              <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
            </div>
          </Card>
        ))}
        {list.length === 0 && <Card className="rounded-2xl p-8 text-center text-xs font-semibold text-slate-400">No grievances found.</Card>}
      </div>

      {list.length > 0 && (
        <DataTablePagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={setPage} onLimitChange={setLimit} />
      )}

      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) closeTicketModal(); }}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[90vh] sm:w-full">
          {selectedTicket && (
            <>
              <DialogHeader className="border-b p-4 pr-12 text-left sm:p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Grievance Ticket</span>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-blue-600">#{ticketNo(selectedTicket)}</p>
                <DialogTitle className="mt-1 text-base font-bold sm:text-xl">{selectedTicket.title}</DialogTitle>
                <DialogDescription className="sr-only">Grievance details and replies</DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</h4>
                  <div className="mt-1.5 whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedTicket.description || 'No description provided.'}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="rounded-xl p-3 shadow-none">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Raised By</h4>
                    <p className="mt-1.5 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <User className="size-3.5 text-slate-400" />
                      {selectedTicket.raised_by_name || 'Unknown'} {selectedTicket.raised_by_role ? `(${selectedTicket.raised_by_role})` : ''}
                    </p>
                  </Card>
                  <Card className="rounded-xl p-3 shadow-none">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Created At</h4>
                    <p className="mt-1.5 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Calendar className="size-3.5 text-slate-400" />
                      {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'Recently'}
                    </p>
                  </Card>

                  <Card className="col-span-full rounded-xl bg-slate-50/50 dark:bg-slate-900/40 p-3 shadow-none">
                    <h4 className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <MessageSquare className="size-3.5 text-slate-400" /> Conversation
                    </h4>
                    {loadingMessages ? (
                      <p className="text-xs font-bold text-slate-500">Loading replies...</p>
                    ) : ticketMessages.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-3 text-[11px] font-semibold text-slate-500">No messages yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {ticketMessages.map((message) => (
                          <Card key={message.id} className={cn('rounded-xl p-2.5 shadow-sm', message.senderRole?.includes('ADMIN') ? 'bg-blue-50 dark:bg-blue-950/30 ml-6' : 'bg-white dark:bg-slate-950')}>
                            <p className="whitespace-pre-wrap break-words text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">{message.content}</p>
                            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {message.senderName || message.senderRole || 'User'} · {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Recently'}
                            </p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 resize-none bg-white dark:bg-slate-950"
                  />
                  <Button type="button" onClick={handleSendReply} disabled={sendingReply || !replyText.trim()} className="gap-1.5 self-end">
                    <Send size={14} /> Send
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Status</span>
                    <Select value={String(selectedTicket.status || 'open').toUpperCase()} onValueChange={handleStatusChange} disabled={updatingStatus}>
                      <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" onClick={closeTicketModal}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
