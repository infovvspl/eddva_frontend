import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquareWarning, Plus, Filter, AlertCircle, Clock, CheckCircle, XCircle, Search, X, Calendar, User, Send, MessageSquare } from 'lucide-react';
import DataTable from '@/components/school/DataTable';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import api from '@/lib/api/school-client';
import './GrievanceHandling.css';

const TONE_BADGE: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  error: 'bg-red-50 text-red-700 ring-red-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  default: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function ToneBadge({ tone, className, children }: { tone: string; className?: string; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn('rounded-full border-transparent font-bold ring-1 ring-inset', TONE_BADGE[tone] ?? TONE_BADGE.default, className)}>
      {children}
    </Badge>
  );
}

// Left-edge stripe per ticket status on the cards.
const STATUS_BAR: Record<string, string> = {
  open: 'from-red-400 to-rose-600',
  'in-progress': 'from-amber-400 to-orange-500',
  reopened: 'from-red-400 to-rose-600',
  resolved: 'from-emerald-400 to-teal-600',
  closed: 'from-slate-300 to-slate-400',
};

const STATUS_TONE: Record<string, string> = {
  open: 'error',
  'in-progress': 'warning',
  resolved: 'success',
  closed: 'default',
};
const categoryTone = (v: string) => (v === 'academic' ? 'purple' : v === 'infrastructure' ? 'info' : 'warning');
const priorityTone = (v: string) => (v === 'high' ? 'error' : v === 'medium' ? 'warning' : 'success');
const ticketNo = (item: any) => item.ticketNumber || item.ticket_number || `USR-${String(item.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;

const GrievanceHandling: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 });
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [grievancesList, setGrievancesList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: 'academic',
    priority: 'medium',
    description: ''
  });

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const closeTicketModal = () => {
    setSelectedTicket(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('ticketId');
    nextParams.delete('search');
    navigate({
      pathname: '/school/teacher/grievances',
      search: nextParams.toString() ? `?${nextParams.toString()}` : '',
    }, { replace: true });
  };

  const reopenTicket = async (ticketId: string) => {
    try {
      await api.put(`/grievances/${ticketId}`, { status: 'REOPENED' });
      fetchGrievances();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev: any) => prev ? { ...prev, status: 'reopened' } : prev);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openChatForTicket = async (ticket: any) => {
    try {
      const res = await api.get('/chat/users', { params: { role: 'INSTITUTE_ADMIN' } });
      const admins = res.data?.data || [];
      const admin = admins[0];
      if (!admin?.id) {
        alert('No institute admin is available for chat.');
        return;
      }
      const ticketNum = ticket.ticketNumber || ticket.ticket_number || `USR-${String(ticket.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;
      navigate(`/school/teacher/chat?userId=${encodeURIComponent(admin.id)}&ticketId=${encodeURIComponent(ticketNum)}`);
    } catch (err) {
      console.error(err);
      alert('Unable to open chat with institute admin.');
    }
  };

  const openTicketMessages = async (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketMessages([]);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/grievances/${ticket.id}/messages`);
      setTicketMessages(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setTicketMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      await api.post(`/grievances/${selectedTicket.id}/messages`, {
        content: replyText.trim(),
      });
      setReplySuccess(true);
      setReplyText('');
      const res = await api.get(`/grievances/${selectedTicket.id}/messages`);
      setTicketMessages(Array.isArray(res.data?.data) ? res.data.data : []);
      setTimeout(() => setReplySuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  useEffect(() => {
    setReplyText('');
    setReplySuccess(false);
  }, [selectedTicket]);

  const fetchGrievances = async () => {
    try {
      const params: any = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (activeTab === 'academic') params.category = 'academic';
      else if (activeTab === 'infrastructure') params.category = 'infrastructure';
      else if (activeTab === 'support') params.statusIn = 'OPEN,IN_PROGRESS';
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/grievances', { params });
      const formatted = res.data.data.map((g: any) => ({
        ...g,
        status: (g.status || 'open').toLowerCase(),
        raisedBy: g.raised_by_name || 'Anonymous',
        date: new Date(g.created_at).toLocaleDateString(),
        priority: 'medium'
      }));
      setGrievancesList(formatted);
      if (typeof res.data.total !== 'undefined') {
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/grievances', { params: { limit: 1000 } }); // Get all for simple stats calculation
      const data = res.data.data || [];
      setStats({
        open: data.filter((g: any) => String(g.status || '').toUpperCase() === 'OPEN').length,
        inProgress: data.filter((g: any) => String(g.status || '').toUpperCase() === 'IN_PROGRESS').length,
        resolved: data.filter((g: any) => g.status?.toLowerCase() === 'resolved' || g.status?.toLowerCase() === 'closed').length
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGrievances();
    fetchStats();
  }, [page, limit, activeTab, searchQuery, statusFilter]);

  useEffect(() => {
    const ticketSearch = searchParams.get('search') || searchParams.get('ticketId');
    if (ticketSearch) {
      const term = ticketSearch.replace(/^#/, '');
      if (searchQuery !== term) {
        setSearchInput(term);
        setSearchQuery(term);
      }
    }
  }, [searchParams, searchQuery]);

  useEffect(() => {
    const ticketId = searchParams.get('ticketId')?.replace(/^#/, '').toUpperCase();
    if (!ticketId || grievancesList.length === 0) return;
    const found = grievancesList.find((g: any) => {
      const num = g.ticketNumber || g.ticket_number || `USR-${String(g.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;
      return String(num).toUpperCase() === ticketId;
    });
    if (found && (!selectedTicket || selectedTicket.id !== found.id)) {
      openTicketMessages(found);
    }
  }, [searchParams, grievancesList, selectedTicket]);

  const handleCreateComplaint = async () => {
    try {
      await api.post('/grievances', formData);
      fetchGrievances();
      setShowComplaintModal(false);
      setFormData({ title: '', category: 'academic', priority: 'medium', description: '' });
    } catch (err) {
      console.error(err);
    }
  };


  const columns = [
    { key: 'ticketNumber', title: 'Ticket ID', render: (v: string) => <ToneBadge tone="info">{v}</ToneBadge> },
    { key: 'title', title: 'Complaint' },
    { key: 'category', title: 'Category', render: (v: string) => <ToneBadge tone={categoryTone(v)}>{v}</ToneBadge> },
    { key: 'priority', title: 'Priority', render: (v: string) => <ToneBadge tone={priorityTone(v)}>{v}</ToneBadge> },
    { key: 'raisedBy', title: 'Raised By' },
    { key: 'date', title: 'Date' },
    { key: 'status', title: 'Status', render: (v: string) => renderStatusBadge(v, 14) },
  ];

  function renderStatusBadge(status: string, size = 12) {
    const icons: Record<string, React.ReactNode> = {
      open: <AlertCircle size={size} className="shrink-0" />,
      'in-progress': <Clock size={size} className="shrink-0" />,
      resolved: <CheckCircle size={size} className="shrink-0" />,
      closed: <XCircle size={size} className="shrink-0" />,
    };
    return (
      <ToneBadge tone={STATUS_TONE[status] ?? 'default'} className="gap-1 capitalize">
        {icons[status]} {status}
      </ToneBadge>
    );
  }

  const renderMobileGrievanceList = (data: any[]) => (
    <div className="space-y-3">
      {data.map((item) => (
        <Card
          key={item.id}
          role="button"
          tabIndex={0}
          onClick={() => openTicketMessages(item)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTicketMessages(item); } }}
          className="relative flex cursor-pointer flex-col gap-2 overflow-hidden rounded-2xl border-slate-300 bg-white p-3.5 pl-5 shadow-none transition-all hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <span className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', STATUS_BAR[item.status] || STATUS_BAR.closed)} />
          <div className="flex items-center justify-between gap-2">
            <ToneBadge tone="info" className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              #{ticketNo(item)}
            </ToneBadge>
            {renderStatusBadge(item.status)}
          </div>

          <h4 className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">{item.title}</h4>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <ToneBadge tone={categoryTone(item.category)} className="text-[9px] capitalize">{item.category}</ToneBadge>
            <ToneBadge tone={priorityTone(item.priority)} className="text-[9px] capitalize">{item.priority} Priority</ToneBadge>
          </div>

          <div className="mt-1 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[9px] font-semibold text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
            <span>By: {item.raisedBy}</span>
            <span>{item.date}</span>
          </div>
        </Card>
      ))}
      {data.length === 0 && (
        <Card className="rounded-2xl border-slate-300 bg-white py-8 text-center text-xs font-semibold text-slate-400 shadow-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
          No complaints found.
        </Card>
      )}
    </div>
  );

  const renderList = (data: any[]) => (
    <>
      <div className="md:hidden">{renderMobileGrievanceList(data)}</div>
      <div className="grievance__section hidden w-full overflow-x-auto md:block">
        <DataTable columns={columns} data={data} onRowClick={openTicketMessages} className="!rounded-2xl !border-slate-300 !bg-white !shadow-none" />
      </div>
    </>
  );

  const renderSupportList = () => (
    <>
      <div className="md:hidden">{renderMobileGrievanceList(grievancesList)}</div>
      <div className="grievance__section hidden md:block">
        <Card className="rounded-2xl border-slate-300 bg-white p-[18px] shadow-none">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="grievance__support-title text-base font-bold leading-normal tracking-normal">Support Requests</CardTitle>
          </CardHeader>
          <CardContent className="grievance__support-list p-0">
            {grievancesList.map((g) => (
              <div key={g.id} className="grievance__support-item cursor-pointer !rounded-xl !border-slate-300 !bg-white transition-all hover:!border-blue-300 hover:shadow-md" onClick={() => openTicketMessages(g)}>
                <div className="grievance__support-priority">
                  <div className={`grievance__priority-dot grievance__priority-dot--${g.priority}`} />
                </div>
                <div className="grievance__support-info">
                  <h4>{g.title}</h4>
                  <p>{g.description}</p>
                  <div className="grievance__support-meta">
                    <span>Raised by: {g.raisedBy}</span>
                    <span>{g.date}</span>
                  </div>
                </div>
                <ToneBadge tone={g.status === 'open' ? 'error' : 'warning'}>{g.status}</ToneBadge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );

  const commitSearch = () => {
    if (searchQuery !== searchInput) {
      setPage(1);
      setSearchQuery(searchInput);
    }
  };

  return (
    <div className="grievance">
      <div className="flex w-full flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar flex w-full flex-row flex-nowrap gap-1.5 overflow-x-auto sm:gap-2.5">
          {[
            { icon: <AlertCircle className="size-3 sm:size-3.5" />, count: stats.open, label: 'Open', tile: 'from-red-500 to-rose-600 shadow-red-500/30', border: 'border-red-300' },
            { icon: <Clock className="size-3 sm:size-3.5" />, count: stats.inProgress, label: 'In Progress', tile: 'from-orange-400 to-orange-600 shadow-orange-500/30', border: 'border-orange-300' },
            { icon: <CheckCircle className="size-3 sm:size-3.5" />, count: stats.resolved, label: 'Resolved', tile: 'from-emerald-500 to-teal-600 shadow-emerald-500/30', border: 'border-emerald-300' },
          ].map((pill) => (
            <span key={pill.label} className={cn('inline-flex shrink-0 items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 text-[10px] font-semibold text-slate-600 dark:bg-slate-900 sm:text-xs', pill.border)}>
              <span className={cn('grid size-6 place-items-center rounded-full bg-gradient-to-br text-white shadow-md sm:size-7', pill.tile)}>{pill.icon}</span>
              <span><b className="text-sm font-extrabold text-slate-900 dark:text-white sm:text-base">{pill.count}</b> {pill.label}</span>
            </span>
          ))}
        </div>

        <div className="flex w-full flex-row items-center gap-2 lg:w-auto lg:gap-2.5">
          <div className="relative min-w-0 flex-1 lg:min-w-[240px] lg:flex-initial">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 sm:size-4" />
            <Input
              type="text"
              placeholder="Search complaints..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setSearchQuery(searchInput);
                }
              }}
              onBlur={commitSearch}
              className="h-10 w-full rounded-xl border-slate-300 bg-slate-50 pl-8 pr-8 text-xs text-slate-800 focus-visible:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:pl-9 sm:text-sm"
            />
            {searchInput && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-slate-400 hover:bg-transparent hover:text-slate-600"
              >
                <X size={14} />
              </Button>
            )}
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => { setStatusFilter(val); setPage(1); }}
          >
            <SelectTrigger className="h-10 w-[150px] shrink-0 rounded-xl border-slate-300 bg-slate-50 text-xs font-medium dark:border-slate-800 dark:bg-slate-900 sm:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REOPENED">Re-Opened</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-10 shrink-0 gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white shadow-md shadow-blue-600/25 hover:brightness-110" onClick={() => setShowComplaintModal(true)} aria-label="Raise Complaint">
            <Plus size={16} />
            <span className="hidden sm:inline">Raise Complaint</span>
          </Button>
        </div>
      </div>

      <div className="mb-4 mt-3">
        <Tabs
          value={activeTab}
          onValueChange={(tabId) => {
            setActiveTab(tabId);
            setPage(1);
          }}
        >
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-slate-300 bg-white p-1.5 shadow-none dark:border-slate-800 dark:bg-slate-900">
            {[
              { id: 'all', label: 'All Complaints', icon: <MessageSquareWarning size={16} /> },
              { id: 'academic', label: 'Academic', icon: <AlertCircle size={16} /> },
              { id: 'infrastructure', label: 'Infrastructure', icon: <Filter size={16} /> },
              { id: 'support', label: 'Support Requests', icon: <Clock size={16} /> },
            ].map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="shrink-0 gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-600/25 sm:text-sm"
              >
                {t.icon}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-3">
          {activeTab === 'all' && renderList(grievancesList)}
          {activeTab === 'academic' && renderList(grievancesList.filter((g) => g.category === 'academic'))}
          {activeTab === 'infrastructure' && renderList(grievancesList.filter((g) => g.category === 'infrastructure'))}
          {activeTab === 'support' && renderSupportList()}
        </div>
      </div>

      {grievancesList.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <DataTablePagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      )}

      {/* Raise complaint */}
      <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl sm:rounded-2xl">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"><MessageSquareWarning className="size-5" /></span>
              <DialogTitle>Raise New Complaint</DialogTitle>
            </div>
            <DialogDescription className="sr-only">Describe the issue and submit it to the institute admin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="complaint-title">Title</Label>
              <Input
                id="complaint-title"
                placeholder="Brief title for the complaint"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complaint-description">Description</Label>
              <Textarea
                id="complaint-description"
                placeholder="Describe the issue in detail..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowComplaintModal(false)}>Cancel</Button>
            <Button onClick={handleCreateComplaint} className="bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white shadow-md shadow-blue-600/25 hover:brightness-110">Submit Complaint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket details */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) closeTicketModal(); }}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-slate-300 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:max-h-[90vh] sm:w-full sm:rounded-3xl">
          {selectedTicket && (
            <>
              <DialogHeader className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white p-4 pr-12 text-left dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 sm:p-6 sm:pr-14">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Support Ticket</span>
                <p className="mt-1.5 inline-flex w-fit rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white">#{ticketNo(selectedTicket)}</p>
                <DialogTitle className="mt-1 text-base font-bold leading-snug tracking-normal text-slate-950 dark:text-white sm:text-xl">
                  {selectedTicket.title}
                </DialogTitle>
                <DialogDescription className="sr-only">Ticket details and admin replies</DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">Description</h4>
                  <div className="mt-1.5 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs font-medium leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:mt-2 sm:rounded-2xl sm:p-4 sm:text-sm">
                    {selectedTicket.description || 'No description provided.'}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <Card className="rounded-xl border-slate-300 p-3 shadow-none dark:border-slate-800 sm:rounded-2xl sm:p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">Status</h4>
                    <div className="mt-1.5">
                      <ToneBadge tone={selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? 'success' : 'warning'}>
                        {selectedTicket.status}
                      </ToneBadge>
                    </div>
                  </Card>

                  <Card className="rounded-xl border-slate-300 p-3 shadow-none dark:border-slate-800 sm:rounded-2xl sm:p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">Created At</h4>
                    <p className="mt-1.5 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">
                      <Calendar className="size-3.5 text-slate-400" />
                      {selectedTicket.createdAt || selectedTicket.created_at ? new Date(selectedTicket.createdAt || selectedTicket.created_at).toLocaleString() : 'Recently'}
                    </p>
                  </Card>

                  <Card className="rounded-xl border-slate-300 p-3 shadow-none dark:border-slate-800 sm:rounded-2xl sm:p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">Category</h4>
                    <p className="mt-1.5 text-xs font-bold capitalize text-slate-800 dark:text-slate-200 sm:text-sm">
                      {selectedTicket.category || 'General'}
                    </p>
                  </Card>

                  {/* Ticket messages */}
                  <Card className="col-span-full rounded-xl border-slate-300 bg-slate-50/50 p-3 shadow-none dark:border-slate-800 sm:rounded-2xl sm:p-4">
                    <h4 className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:mb-3 sm:text-xs">
                      <MessageSquare className="size-3.5 text-slate-400" />
                      Institute Admin Replies
                    </h4>
                    {loadingMessages ? (
                      <p className="text-xs font-bold text-slate-500 sm:text-sm">Loading replies...</p>
                    ) : ticketMessages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-[11px] font-semibold text-slate-500 sm:p-4 sm:text-xs">
                        No replies have been sent for this ticket yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ticketMessages.map((message) => (
                          <Card key={message.id} className="rounded-xl border-slate-300 border-l-4 border-l-blue-500 bg-white p-2.5 shadow-none dark:border-slate-800 dark:bg-slate-950 sm:p-3">
                            <p className="whitespace-pre-wrap break-words text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200 sm:text-sm">
                              {message.content || 'Message unavailable'}
                            </p>
                            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:text-[10px]">
                              {message.senderRole === 'INSTITUTE_ADMIN' ? (message.senderName || 'Institute Admin') : 'You (Sender)'} - {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Recently'}
                            </p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>

              <div className="flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:p-6">
                <Label className="flex items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 sm:justify-start">
                  <span>Reopen</span>
                  <Switch
                    checked={String(selectedTicket.status || '').toUpperCase() === 'REOPENED'}
                    disabled={['OPEN', 'REOPENED'].includes(String(selectedTicket.status || '').toUpperCase())}
                    onCheckedChange={(checked) => {
                      if (checked && selectedTicket.id) {
                        void reopenTicket(selectedTicket.id);
                      }
                    }}
                  />
                </Label>
                <div className="flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void openChatForTicket(selectedTicket)}
                    className="gap-1.5 rounded-xl border-blue-300 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400"
                  >
                    <MessageSquare className="size-3.5" />
                    Chat
                  </Button>
                  <Button
                    type="button"
                    onClick={closeTicketModal}
                    className="rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrievanceHandling;
