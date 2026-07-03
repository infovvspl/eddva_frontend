import { apiClient, extractData } from "./client";

export interface InstituteAnnouncementCreatePayload {
  title: string;
  body: string;
  targetRole?: string;
  expiresAt?: string;
}

export interface InstituteAnnouncementResponse {
  id: string;
  title: string;
  body: string;
  targetRole?: string;
  tenantId?: string;
  createdAt?: string;
  expiresAt?: string;
  sentCount?: number;
  createdBy?: string;
}

export interface InstituteAnnouncementListResponse {
  announcements: InstituteAnnouncementResponse[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface InstituteAnnouncementListParams {
  page?: number;
  limit?: number;
}

export async function listInstituteAnnouncements(params?: InstituteAnnouncementListParams) {
  const res = await apiClient.get("/institute/settings/announcements", { params });
  return extractData<InstituteAnnouncementListResponse>(res);
}

export async function createInstituteAnnouncement(payload: InstituteAnnouncementCreatePayload) {
  const res = await apiClient.post("/institute/settings/announcements", payload);
  return extractData<InstituteAnnouncementResponse>(res);
}
