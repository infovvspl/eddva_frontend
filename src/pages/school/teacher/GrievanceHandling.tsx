import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquareWarning, Plus, Filter, AlertCircle, Clock, CheckCircle, XCircle, Search, X, Calendar, User, Send, MessageSquare } from 'lucide-react';
import GlassCard from '@/components/school/GlassCard';
import Button from '@/components/school/Button';
import Badge from '@/components/school/Badge';
import Tabs from '@/components/school/Tabs';
import DataTable from '@/components/school/DataTable';
import Modal from '@/components/school/Modal';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import api from '@/lib/api/school-client';
import './GrievanceHandling.css';

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
  }, [page, limit, activeTab, searchQuery]);

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
    { key: 'ticketNumber', title: 'Ticket ID', render: (v: string) => <Badge variant="info">{v}</Badge> },
    { key: 'title', title: 'Complaint' },
    { key: 'category', title: 'Category', render: (v: string) => (
      <Badge variant={v === 'academic' ? 'purple' : v === 'infrastructure' ? 'info' : 'warning'}>{v}</Badge>
    )},
    { key: 'priority', title: 'Priority', render: (v: string) => (
      <Badge variant={v === 'high' ? 'error' : v === 'medium' ? 'warning' : 'success'}>{v}</Badge>
    )},
    { key: 'raisedBy', title: 'Raised By' },
    { key: 'date', title: 'Date' },
    { key: 'status', title: 'Status', render: (v: string) => {
      const icons: Record<string, React.ReactNode> = {
        open: <AlertCircle size={14} />,
        'in-progress': <Clock size={14} />,
        resolved: <CheckCircle size={14} />,
        closed: <XCircle size={14} />,
      };
      const variants: Record<string, string> = {
        open: 'error',
        'in-progress': 'warning',
        resolved: 'success',
        closed: 'default',
      };
      return (
        <Badge variant={variants[v] as any}>
          <span className="grievance__status-badge">{icons[v]} {v}</span>
        </Badge>
      );
    }},
  ];

  const allContent = (
    <div className="grievance__section">
      <DataTable columns={columns} data={grievancesList} onRowClick={openTicketMessages} />
    </div>
  );

  const academicContent = (
    <div className="grievance__section">
      <DataTable columns={columns} data={grievancesList.filter((g) => g.category === 'academic')} onRowClick={openTicketMessages} />
    </div>
  );

  const infraContent = (
    <div className="grievance__section">
      <DataTable columns={columns} data={grievancesList.filter((g) => g.category === 'infrastructure')} onRowClick={openTicketMessages} />
    </div>
  );

  const supportContent = (
    <div className="grievance__section">
      <GlassCard>
        <h3 className="grievance__support-title">Support Requests</h3>
        <div className="grievance__support-list">
          {grievancesList.map((g) => (
            <div key={g.id} className="grievance__support-item cursor-pointer hover:bg-slate-50/50 transition" onClick={() => openTicketMessages(g)}>
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
              <Badge variant={g.status === 'open' ? 'error' : 'warning'}>{g.status}</Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="grievance">
      <div className="grievance__header">
        <div className="grievance__header-stats">
          <div className="grievance__stat-pill">
            <AlertCircle size={16} className="grievance__stat-icon--open" />
            <span>{stats.open} Open</span>
          </div>
          <div className="grievance__stat-pill">
            <Clock size={16} className="grievance__stat-icon--progress" />
            <span>{stats.inProgress} In Progress</span>
          </div>
          <div className="grievance__stat-pill">
            <CheckCircle size={16} className="grievance__stat-icon--resolved" />
            <span>{stats.resolved} Resolved</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
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
              onBlur={() => {
                if (searchQuery !== searchInput) {
                  setPage(1);
                  setSearchQuery(searchInput);
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>
          <Button icon={<Plus size={16} />} onClick={() => setShowComplaintModal(true)}>Raise Complaint</Button>
        </div>
      </div>

      <div className="mb-4">
        <Tabs
          onChange={(tabId) => {
            setActiveTab(tabId);
            setPage(1);
          }}
          tabs={[
            { id: 'all', label: 'All Complaints', icon: <MessageSquareWarning size={16} />, content: allContent },
            { id: 'academic', label: 'Academic', icon: <AlertCircle size={16} />, content: academicContent },
            { id: 'infrastructure', label: 'Infrastructure', icon: <Filter size={16} />, content: infraContent },
            { id: 'support', label: 'Support Requests', icon: <Clock size={16} />, content: supportContent },
          ]}
        />
      </div>

      {grievancesList.length > 0 && (
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
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

      <Modal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)} title="Raise New Complaint">
        <div className="grievance__modal-form">
          <InputField label="Title" placeholder="Brief title for the complaint" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          <SelectField
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            options={[
              { value: 'academic', label: 'Academic' },
              { value: 'infrastructure', label: 'Infrastructure' },
              { value: 'administrative', label: 'Administrative' },
            ]}
          />
          <SelectField
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value})}
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
          <div className="grievance__modal-textarea-wrapper">
            <label className="grievance__modal-label">Description</label>
            <textarea className="grievance__modal-textarea" placeholder="Describe the issue in detail..." rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grievance__modal-actions">
            <Button variant="outline" onClick={() => setShowComplaintModal(false)}>Cancel</Button>
            <Button onClick={handleCreateComplaint}>Submit Complaint</Button>
          </div>
        </div>
      </Modal>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeTicketModal} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Support Ticket</span>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-blue-600">
                  #{selectedTicket.ticketNumber || selectedTicket.ticket_number || `USR-${String(selectedTicket.id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`}
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-950 dark:text-white">
                  {selectedTicket.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeTicketModal}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-6 overflow-y-auto p-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {selectedTicket.description || 'No description provided.'}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</h4>
                  <div className="mt-2">
                    <Badge variant={selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? 'success' : 'warning'}>
                      {selectedTicket.status}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Created At</h4>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {selectedTicket.createdAt || selectedTicket.created_at ? new Date(selectedTicket.createdAt || selectedTicket.created_at).toLocaleString() : 'Recently'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</h4>
                  <p className="mt-2 text-sm font-bold capitalize text-slate-800 dark:text-slate-200">
                    {selectedTicket.category || 'General'}
                  </p>
                </div>

                {/* Ticket messages */}
                <div className="col-span-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800">
                  <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    Institute Admin Replies
                  </h4>
                  {loadingMessages ? (
                    <p className="text-sm font-bold text-slate-500">Loading replies...</p>
                  ) : ticketMessages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500">
                      No replies have been sent for this ticket yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ticketMessages.map((message) => (
                        <div key={message.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                            {message.content || 'Message unavailable'}
                          </p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {message.senderRole === 'INSTITUTE_ADMIN' ? (message.senderName || 'Institute Admin') : 'You (Sender)'} - {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <span>Reopen</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={String(selectedTicket.status || '').toUpperCase() === 'REOPENED'}
                  disabled={['OPEN', 'REOPENED'].includes(String(selectedTicket.status || '').toUpperCase())}
                  onChange={(event) => {
                    if (event.target.checked && selectedTicket.id) {
                      void reopenTicket(selectedTicket.id);
                    }
                  }}
                  className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-slate-300 transition before:block before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-blue-600 checked:before:translate-x-5 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openChatForTicket(selectedTicket)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400"
                >
                  <MessageSquare className="h-4 w-4" />
                  Open Chat
                </button>
                <button
                  type="button"
                  onClick={closeTicketModal}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrievanceHandling;
