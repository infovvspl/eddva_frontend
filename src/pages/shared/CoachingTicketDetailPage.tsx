import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  ShieldAlert,
  Paperclip,
  User,
  Building,
  Tag,
  RefreshCw,
  XCircle,
  MessageSquare,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  supportTicketApi,
  CoachingTicket,
  TicketMessage,
} from '@/lib/api/support-tickets';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TicketPriority,
  TicketStatus,
  ALLOWED_STATUS_TRANSITIONS,
} from '@/constants/ticket-categories';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CoachingTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [ticket, setTicket] = useState<CoachingTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Action states
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const isInstituteAdmin = user?.role === 'institute_admin';
  const canEscalate = isInstituteAdmin && ticket?.escalationStatus !== 'ESCALATED' && ticket?.recipientType !== 'SUPER_ADMIN';

  useEffect(() => {
    if (ticketId) {
      loadData();
    }
  }, [ticketId]);

  async function loadData() {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const [ticketData, messageData] = await Promise.all([
        supportTicketApi.getTicket(ticketId),
        supportTicketApi.listMessages(ticketId),
      ]);
      setTicket(ticketData);
      setMessages(messageData);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketId || !replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const newMsg = await supportTicketApi.createMessage(ticketId, {
        content: replyContent.trim(),
      });
      setMessages((prev) => [...prev, newMsg]);
      setReplyContent('');
      toast.success('Reply sent successfully');
      // Refresh ticket state
      const updatedTicket = await supportTicketApi.getTicket(ticketId);
      setTicket(updatedTicket);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!ticketId || !ticket) return;
    setUpdatingStatus(true);
    try {
      await supportTicketApi.updateStatus(ticketId, newStatus);
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      const updated = await supportTicketApi.getTicket(ticketId);
      setTicket(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handlePriorityChange(newPriority: TicketPriority) {
    if (!ticketId || !ticket) return;
    setUpdatingPriority(true);
    try {
      await supportTicketApi.updatePriority(ticketId, newPriority);
      toast.success(`Priority updated to ${PRIORITY_CONFIG[newPriority]?.label || newPriority}`);
      const updated = await supportTicketApi.getTicket(ticketId);
      setTicket(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update priority');
    } finally {
      setUpdatingPriority(false);
    }
  }

  async function handleConfirmEscalate() {
    if (!ticketId) return;
    setEscalating(true);
    try {
      await supportTicketApi.escalateTicket(ticketId, escalationReason);
      toast.success('Ticket escalated to Super Admin');
      setShowEscalateModal(false);
      setEscalationReason('');
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to escalate ticket');
    } finally {
      setEscalating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </button>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-700">
          <AlertCircle className="mx-auto mb-2 h-10 w-10 text-rose-500" />
          <h3 className="text-lg font-bold">Error Loading Ticket</h3>
          <p className="mt-1 text-sm">{error || 'Ticket not found'}</p>
        </div>
      </div>
    );
  }

  const priorityMeta = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.MEDIUM;
  const statusMeta = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[ticket.status] || [];

  return (
    <div className="w-full space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Support Tickets
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
              {ticket.ticketNumber}
            </span>
            <span
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-bold border',
                statusMeta.bg,
                statusMeta.text,
                statusMeta.border,
              )}
            >
              {statusMeta.label}
            </span>
            <span
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-bold border',
                priorityMeta.bg,
                priorityMeta.text,
                priorityMeta.border,
              )}
            >
              {priorityMeta.label} Priority
            </span>
            {ticket.escalationStatus === 'ESCALATED' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">
                <ShieldAlert className="h-3.5 w-3.5" /> Escalated to Super Admin
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-black text-slate-900 tracking-tight">{ticket.subject}</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Category: <strong className="text-slate-700">{ticket.category}</strong> • Created{' '}
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canEscalate && (
            <button
              onClick={() => setShowEscalateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-all"
            >
              <ShieldAlert className="h-4 w-4" /> Escalate to Super Admin
            </button>
          )}

          {ticket.status !== 'CLOSED' ? (
            <button
              onClick={() => handleStatusChange('CLOSED' as TicketStatus)}
              disabled={updatingStatus}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
            >
              <XCircle className="h-4 w-4 text-slate-500" /> Close Ticket
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('REOPENED' as TicketStatus)}
              disabled={updatingStatus}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
            >
              <RefreshCw className="h-4 w-4" /> Reopen Ticket
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline & Conversation (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Messages list */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-base font-bold text-slate-900">
              <MessageSquare className="h-5 w-5 text-indigo-600" /> Ticket Conversation ({messages.length})
            </h2>

            <div className="space-y-6">
              {messages.map((msg, idx) => {
                const isUserCreator = String(msg.senderId) === String(ticket.createdByUserId);
                const isSuperAdminSender = String(msg.senderRole).toLowerCase() === 'super_admin';
                const isAdminSender = String(msg.senderRole).toLowerCase() === 'institute_admin';

                return (
                  <div
                    key={msg.id || idx}
                    className={cn(
                      'rounded-2xl p-5 transition-all',
                      isSuperAdminSender
                        ? 'border border-purple-200 bg-purple-50/40'
                        : isAdminSender
                        ? 'border border-blue-200 bg-blue-50/30'
                        : 'border border-slate-200/70 bg-slate-50/50',
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white text-xs shadow-sm">
                          {msg.senderName ? msg.senderName.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{msg.senderName}</p>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            {msg.senderRole.replace('_', ' ')}
                            {isUserCreator && ' (Creator)'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed pl-12">
                      {msg.message}
                    </div>

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 pl-12 flex flex-wrap gap-2">
                        {msg.attachments.map((att: any, i: number) => (
                          <a
                            key={i}
                            href={typeof att === 'string' ? att : att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-slate-50"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {typeof att === 'string' ? `Attachment ${i + 1}` : att.fileName || `File ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reply composer */}
          {ticket.status !== 'CLOSED' ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-900">Send a Reply</h3>
              <form onSubmit={handleSendReply} className="space-y-4">
                <textarea
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your response or update here..."
                  className="w-full rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Pressing send will notify the ticket participants.
                  </span>
                  <button
                    type="submit"
                    disabled={submittingReply || !replyContent.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {submittingReply ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Reply
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-semibold">This ticket is closed. Reopen it to send replies.</p>
            </div>
          )}
        </div>

        {/* Side Panel (1 col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Ticket Details
            </h3>

            {/* Status Selector */}
            {(isSuperAdmin || isInstituteAdmin) && (() => {
              const isLockedForInstituteAdmin = isInstituteAdmin && ticket.recipientType === 'SUPER_ADMIN';
              return (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Status</label>
                  {isLockedForInstituteAdmin ? (
                    <div className={cn(
                      'rounded-lg px-2.5 py-2 text-xs font-bold border w-full text-center select-none shadow-sm/5',
                      statusMeta.bg,
                      statusMeta.text,
                      statusMeta.border,
                    )}>
                      {statusMeta.label}
                    </div>
                  ) : (
                    <select
                      value={ticket.status}
                      disabled={updatingStatus}
                      onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                    >
                      {TICKET_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {STATUS_CONFIG[st]?.label || st}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })()}

            {/* Priority Selector */}
            {(isSuperAdmin || isInstituteAdmin) && (() => {
              const isLockedForInstituteAdmin = isInstituteAdmin && ticket.recipientType === 'SUPER_ADMIN';
              return (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Priority</label>
                  {isLockedForInstituteAdmin ? (
                    <div className={cn(
                      'rounded-lg px-2.5 py-2 text-xs font-bold border w-full text-center select-none shadow-sm/5',
                      priorityMeta.bg,
                      priorityMeta.text,
                      priorityMeta.border,
                    )}>
                      {priorityMeta.label} Priority
                    </div>
                  ) : (
                    <select
                      value={ticket.priority}
                      disabled={updatingPriority}
                      onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                    >
                      {TICKET_PRIORITIES.map((pr) => (
                        <option key={pr} value={pr}>
                          {PRIORITY_CONFIG[pr]?.label} Priority
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })()}

            {/* Information List */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Raised By
                </span>
                <span className="font-semibold text-slate-800">
                  {ticket.createdByName || 'Unknown'} ({ticket.createdByRole})
                </span>
              </div>

              {ticket.instituteName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> Institute
                  </span>
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                    {ticket.instituteName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Category
                </span>
                <span className="font-semibold text-slate-800">{ticket.category}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Recipient
                </span>
                <span className="font-semibold text-slate-800">{ticket.recipientType}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-slate-400">Created Date</span>
                <span className="font-medium text-slate-700">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Activity</span>
                <span className="font-medium text-slate-700">
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Escalate to Super Admin</h3>
                <p className="text-xs text-slate-500">
                  This will transfer ticket visibility and oversight to Super Admin.
                </p>
              </div>
            </div>

            <textarea
              rows={3}
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Enter reason for escalation..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:outline-none"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalate}
                disabled={escalating}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
              >
                {escalating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
