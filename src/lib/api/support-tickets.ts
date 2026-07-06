import { apiClient, extractData } from './client';
import { TicketPriority, TicketStatus } from '@/constants/ticket-categories';

export interface CoachingTicket {
  id: string;
  ticketNumber: string;
  instituteId: string | null;
  instituteName: string | null;
  createdByUserId: string;
  createdByName: string | null;
  createdByRole: string;
  recipientType: 'SUPER_ADMIN' | 'INSTITUTE_ADMIN';
  recipientUserId?: string | null;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string | null;
  escalationStatus: 'NONE' | 'ESCALATED';
  escalatedAt?: string | null;
  escalatedBy?: string | null;
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  senderAvatar?: string | null;
  message: string;
  attachments?: any[];
  createdAt: string;
}

export interface ListTicketsQueryParams {
  scope?: 'received' | 'outgoing' | 'escalated' | 'all';
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  search?: string;
  instituteId?: string;
  creatorRole?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ListTicketsResponse {
  success: boolean;
  data: CoachingTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const supportTicketApi = {
  async listTickets(params?: ListTicketsQueryParams): Promise<ListTicketsResponse> {
    const res = await apiClient.get('/coaching/support-tickets', { params });
    return res.data;
  },

  async getTicket(id: string): Promise<CoachingTicket> {
    const res = await apiClient.get(`/coaching/support-tickets/${id}`);
    return extractData<CoachingTicket>(res);
  },

  async createTicket(payload: {
    subject: string;
    description: string;
    category: string;
    priority?: TicketPriority;
    recipientType?: 'SUPER_ADMIN' | 'INSTITUTE_ADMIN';
    instituteId?: string;
    attachments?: any[];
  }): Promise<CoachingTicket> {
    const res = await apiClient.post('/coaching/support-tickets', payload);
    return extractData<CoachingTicket>(res);
  },

  async listMessages(id: string): Promise<TicketMessage[]> {
    const res = await apiClient.get(`/coaching/support-tickets/${id}/messages`);
    return extractData<TicketMessage[]>(res);
  },

  async createMessage(id: string, payload: { content: string; attachments?: any[] }): Promise<TicketMessage> {
    const res = await apiClient.post(`/coaching/support-tickets/${id}/messages`, payload);
    return extractData<TicketMessage>(res);
  },

  async updateStatus(id: string, status: TicketStatus): Promise<void> {
    await apiClient.patch(`/coaching/support-tickets/${id}/status`, { status });
  },

  async updatePriority(id: string, priority: TicketPriority): Promise<void> {
    await apiClient.patch(`/coaching/support-tickets/${id}/priority`, { priority });
  },

  async escalateTicket(id: string, reason?: string): Promise<void> {
    await apiClient.post(`/coaching/support-tickets/${id}/escalate`, { reason });
  },

  async closeTicket(id: string): Promise<void> {
    await apiClient.post(`/coaching/support-tickets/${id}/close`);
  },

  async reopenTicket(id: string): Promise<void> {
    await apiClient.post(`/coaching/support-tickets/${id}/reopen`);
  },
};
