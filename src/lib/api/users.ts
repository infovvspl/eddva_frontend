import { apiClient, extractData } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AdminUser {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  role: string;
  status?: string;
  tenantId?: string;
  tenant?: { id: string; name: string; subdomain?: string; [key: string]: unknown };
  lastLoginAt?: string;
  createdAt?: string;
  avatar?: string;
  isFirstLogin?: boolean;
}

export interface UserListResponse {
  items: AdminUser[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface UserListParams {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
  tenantId?: string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** List all users (super admin) */
export async function listUsers(params?: UserListParams) {
  const res = await apiClient.get("/admin/users", { params });
  return extractData<UserListResponse>(res);
}

/** Get single user */
export async function getUser(id: string) {
  const res = await apiClient.get(`/admin/users/${id}`);
  return extractData<AdminUser>(res);
}

/** Suspend a user */
export async function suspendUser(id: string) {
  const res = await apiClient.patch(`/admin/users/${id}/status`, { status: "SUSPENDED" });
  return extractData(res);
}

/** Activate a user */
export async function activateUser(id: string) {
  const res = await apiClient.patch(`/admin/users/${id}/status`, { status: "ACTIVE" });
  return extractData(res);
}
