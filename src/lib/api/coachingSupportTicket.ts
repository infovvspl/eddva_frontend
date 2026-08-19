import { apiClient } from "../api-client";

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  attachments: any[];
  isInternal: boolean;
  senderName?: string;
  senderRole?: string;
  senderAvatar?: string;
  createdAt: string;
}

export interface CoachingSupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  requesterId: string;
  instituteId?: string;
  recipientType?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export const coachingSupportTicketApi = {
  listTickets: async (params?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<{
      data: CoachingSupportTicket[];
      total: number;
      page: number;
      limit: number;
    }>("/coaching/support-tickets", { params });
    return res.data;
  },

  getTicket: async (id: string) => {
    const res = await apiClient.get<CoachingSupportTicket>(`/coaching/support-tickets/${id}`);
    return res.data;
  },

  createTicket: async (data: {
    subject: string;
    description: string;
    category: string;
    priority?: TicketPriority;
    recipientType?: string;
    attachments?: any[];
  }) => {
    const res = await apiClient.post<CoachingSupportTicket>("/coaching/support-tickets", data);
    return res.data;
  },

  listMessages: async (ticketId: string) => {
    const res = await apiClient.get<TicketMessage[]>(`/coaching/support-tickets/${ticketId}/messages`);
    return res.data;
  },

  createMessage: async (ticketId: string, data: {
    content: string;
    attachments?: any[];
    isInternal?: boolean;
  }) => {
    const res = await apiClient.post<TicketMessage>(`/coaching/support-tickets/${ticketId}/messages`, data);
    return res.data;
  },

  updateStatus: async (ticketId: string, status: TicketStatus) => {
    const res = await apiClient.patch<CoachingSupportTicket>(`/coaching/support-tickets/${ticketId}/status`, { status });
    return res.data;
  },

  closeTicket: async (ticketId: string) => {
    const res = await apiClient.post<CoachingSupportTicket>(`/coaching/support-tickets/${ticketId}/close`);
    return res.data;
  },
  
  reopenTicket: async (ticketId: string) => {
    const res = await apiClient.post<CoachingSupportTicket>(`/coaching/support-tickets/${ticketId}/reopen`);
    return res.data;
  }
};
