import { apiClient, extractData } from './client';

export type LeadVertical = 'SCHOOL' | 'COACHING';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  role?: string;
  vertical?: LeadVertical;
  interestedFeature?: string;
  message?: string;
  source?: string;
}

export interface Lead extends LeadPayload {
  id: string;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadListParams {
  status?: LeadStatus;
  vertical?: LeadVertical;
  search?: string;
  page?: number;
  limit?: number;
}

/** Public — submit a "Request a Demo" lead from the marketing site. */
export function submitLead(payload: LeadPayload) {
  return apiClient
    .post('/tenants/public/leads', payload)
    .then((r) => extractData<{ success: boolean; id: string }>(r));
}

/** Super-admin — list leads. */
export function getLeads(params: LeadListParams = {}) {
  return apiClient
    .get('/admin/leads', { params })
    .then((r) => extractData<LeadListResponse>(r));
}

/** Super-admin — update a lead's status / notes. */
export function updateLead(id: string, patch: { status?: LeadStatus; notes?: string }) {
  return apiClient.patch(`/admin/leads/${id}`, patch).then((r) => extractData<Lead>(r));
}
