import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Plus,
  Search,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Loader2,
  MoreVertical,
  Paperclip
} from 'lucide-react';
import { coachingSupportTicketApi, CoachingSupportTicket, TicketMessage, TicketPriority, TicketStatus } from '@/lib/api/coachingSupportTicket';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

const TICKET_CATEGORIES = [
  'ACADEMIC',
  'PLATFORM',
  'BILLING',
  'GENERAL',
  'OTHER'
];

export default function StudentSupportTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<CoachingSupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<CoachingSupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<string>(TICKET_CATEGORIES[0]);
  const [newPriority, setNewPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Reply State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await coachingSupportTicketApi.listTickets();
      // Assume res is either an array or object with .data depending on our DTO, wait, listTickets returns res.data
      setTickets((res as any).data || res || []);
    } catch (err: any) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(ticketId: string) {
    setMessagesLoading(true);
    try {
      const msgs = await coachingSupportTicketApi.listMessages(ticketId);
      setMessages(msgs || []);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    setSubmitting(true);
    try {
      const newTicket = await coachingSupportTicketApi.createTicket({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        description: newDescription.trim(),
        recipientType: 'INSTITUTE_ADMIN',
      });
      toast.success('Support ticket created successfully');
      setShowCreateModal(false);
      setNewSubject('');
      setNewDescription('');
      loadTickets();
      setSelectedTicket(newTicket);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  }
  
  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    
    setSendingReply(true);
    try {
      const msg = await coachingSupportTicketApi.createMessage(selectedTicket.id, {
        content: replyText.trim()
      });
      setMessages(prev => [...prev, msg]);
      setReplyText('');
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  }

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CLOSED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject?.toLowerCase().includes(search.toLowerCase()) || 
    t.ticketNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-4 md:p-6 overflow-hidden max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 shrink-0"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-500" />
            Support Tickets
          </h1>
          <p className="text-slate-500 text-sm mt-1">Get help with academic or platform issues</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Ticket</span>
        </button>
      </motion.div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Left pane: Ticket List */}
        <div className={cn(
          "flex flex-col border-r border-slate-200 dark:border-slate-800 transition-all duration-300",
          selectedTicket ? "hidden md:flex md:w-[350px] lg:w-[400px]" : "w-full md:w-[350px] lg:w-[400px]"
        )}>
          {/* Search bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
          
          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <Ticket className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                <p className="font-medium text-slate-900 dark:text-white mb-1">No tickets found</p>
                <p className="text-sm">You haven't raised any support tickets yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredTickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                      selectedTicket?.id === ticket.id && "bg-indigo-50/50 dark:bg-indigo-900/20"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1 pr-2">
                        {ticket.subject}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap pt-0.5">
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                      #{ticket.ticketNumber || ticket.id.substring(0, 8).toUpperCase()}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border", getStatusColor(ticket.status))}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {ticket.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right pane: Ticket Details */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-slate-900",
          !selectedTicket && "hidden md:flex"
        )}>
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
              <p className="text-lg font-medium text-slate-900 dark:text-white">Select a Ticket</p>
              <p className="text-sm">Choose a ticket from the left to view details</p>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
                <div className="flex items-center gap-3 mb-4 md:hidden">
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="text-slate-500 hover:text-slate-900 p-1 -ml-1 rounded-md hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="font-medium text-sm text-slate-900">Back to List</span>
                </div>
                
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                        {selectedTicket.subject}
                      </h2>
                      <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold tracking-wide border", getStatusColor(selectedTicket.status))}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span>Ticket #{selectedTicket.ticketNumber || selectedTicket.id.substring(0, 8).toUpperCase()}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Created {format(new Date(selectedTicket.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  
                  {selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED' && (
                    <button 
                      onClick={async () => {
                        if (confirm('Are you sure you want to close this ticket?')) {
                          await coachingSupportTicketApi.closeTicket(selectedTicket.id);
                          loadTickets();
                          setSelectedTicket({...selectedTicket, status: TicketStatus.CLOSED});
                        }
                      }}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>
                
                <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1 text-xs uppercase tracking-wider">Original Query</p>
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messagesLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 text-sm">
                    No replies yet. We will get back to you shortly.
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isStaff = msg.senderRole === 'SUPER_ADMIN' || msg.senderRole === 'INSTITUTE_ADMIN' || msg.senderRole === 'TEACHER';
                    
                    return (
                      <div key={msg.id || i} className={cn("flex flex-col max-w-[85%]", isStaff ? "self-start" : "self-end items-end ml-auto")}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {isStaff ? (msg.senderName || 'Support Team') : 'You'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap",
                          isStaff 
                            ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none" 
                            : "bg-indigo-600 text-white rounded-tr-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Reply Box */}
              {(selectedTicket.status === 'CLOSED' || selectedTicket.status === 'RESOLVED') ? (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center text-sm text-slate-500 shrink-0">
                  This ticket has been closed. If you still need help, please create a new ticket.
                </div>
              ) : (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  <form onSubmit={handleSendReply} className="flex gap-3">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      disabled={sendingReply}
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      {sendingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
        
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Support Ticket</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto">
                <form id="create-ticket-form" onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Subject</label>
                    <input
                      type="text"
                      required
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      placeholder="Briefly describe the issue..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Category</label>
                      <select
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                      >
                        {TICKET_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Priority</label>
                      <select
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value as TicketPriority)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                      >
                        <option value={TicketPriority.LOW}>Low</option>
                        <option value={TicketPriority.MEDIUM}>Medium</option>
                        <option value={TicketPriority.HIGH}>High</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">Description</label>
                    <textarea
                      required
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      placeholder="Provide detailed information about your issue..."
                      rows={5}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                    />
                  </div>
                </form>
              </div>
              
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-ticket-form"
                  disabled={submitting || !newSubject.trim() || !newDescription.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-md flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
