export const TICKET_CATEGORIES = [
  'Academic Issue',
  'Batch Management',
  'Class Schedule',
  'Attendance',
  'Study Material',
  'Examination',
  'Fees & Payments',
  'Teacher Issue',
  'Student Issue',
  'Parent Concern',
  'Technical Issue',
  'Login / Access Issue',
  'Subscription / Billing',
  'Institute Configuration',
  'Feature Request',
  'Data Correction',
  'Other',
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'ESCALATED',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  HIGH: { label: 'High', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  URGENT: { label: 'Urgent', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  OPEN: { label: 'Open', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  WAITING_FOR_USER: { label: 'Waiting for User', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ESCALATED: { label: 'Escalated', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  RESOLVED: { label: 'Resolved', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  REOPENED: { label: 'Reopened', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

export const ALLOWED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'WAITING_FOR_USER', 'ESCALATED', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['WAITING_FOR_USER', 'ESCALATED', 'RESOLVED', 'CLOSED'],
  WAITING_FOR_USER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  ESCALATED: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
};
