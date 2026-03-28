import { apiClient, extractData } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AnnouncementCreatePayload {
  title: string;
  body: string;
  targetRole?: string;
  tenantId?: string;
  expiresAt?: string;
}

export interface AnnouncementResponse {
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

export interface AnnouncementListResponse {
  announcements: AnnouncementResponse[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AnnouncementListParams {
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** List all announcements */
export async function listAnnouncements(params?: AnnouncementListParams) {
  const res = await apiClient.get("/admin/announcements", { params });
  return extractData<AnnouncementListResponse>(res);
}

/** Create a new announcement */
export async function createAnnouncement(payload: AnnouncementCreatePayload) {
  const res = await apiClient.post("/admin/announcements", payload);
  return extractData<AnnouncementResponse>(res);
}

/** Delete an announcement */
export async function deleteAnnouncement(id: string) {
  const res = await apiClient.delete(`/admin/announcements/${id}`);
  return extractData(res);
}
