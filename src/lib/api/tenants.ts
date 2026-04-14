import { apiClient, extractData } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TenantCreatePayload {
  name: string;
  subdomain: string;
  plan: string;
  billingEmail: string;
  maxStudents: number;
  maxTeachers: number;
  adminPhone: string;
  trialDays?: number;
}

export interface TenantResponse {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  billingEmail?: string;
  maxStudents?: number;
  maxTeachers?: number;
  studentCount?: number;
  teacherCount?: number;
  lastActivity?: string;
  createdAt?: string;
  adminPhone?: string;
  logoUrl?: string;
  brandColor?: string;
  trialEndsAt?: string;
  [key: string]: unknown;
}

export interface TenantListResponse {
  items: TenantResponse[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface TenantDetailResponse {
  tenant: TenantResponse;
  studentCount: number;
  teacherCount: number;
  batchCount: number;
  lectureCount: number;
  testSessionCount: number;
  monthlyActiveStudents: number;
  totalRevenue: number;
}

export interface TenantCreateResult {
  tenant: TenantResponse;
  adminPhone: string;
  tempPassword: string;
}

export interface TenantListParams {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** List all tenants (paginated) */
export async function listTenants(params?: TenantListParams) {
  const res = await apiClient.get("/admin/tenants", { params });
  return extractData<TenantListResponse>(res);
}

/** Get single tenant by ID (returns nested detail) */
export async function getTenant(id: string) {
  const res = await apiClient.get(`/admin/tenants/${id}`);
  return extractData<TenantDetailResponse>(res);
}

/** Create a new tenant */
export async function createTenant(payload: TenantCreatePayload) {
  const res = await apiClient.post("/admin/tenants", payload);
  return extractData<TenantCreateResult>(res);
}

/** Get tenant-specific stats (same shape as detail) */
export async function getTenantStats(id: string) {
  const res = await apiClient.get(`/admin/tenants/${id}/stats`);
  return extractData<TenantDetailResponse>(res);
}

/** Update tenant */
export async function updateTenant(id: string, payload: Partial<TenantCreatePayload>) {
  const res = await apiClient.patch(`/admin/tenants/${id}`, payload);
  return extractData<TenantResponse>(res);
}

/** Suspend a tenant */
export async function suspendTenant(id: string) {
  const res = await apiClient.patch(`/admin/tenants/${id}`, { status: "suspended" });
  return extractData<TenantResponse>(res);
}

/** Activate a tenant */
export async function activateTenant(id: string) {
  const res = await apiClient.patch(`/admin/tenants/${id}`, { status: "active" });
  return extractData<TenantResponse>(res);
}

// ---------------------------------------------------------------------------
// Enrollments (super-admin)
// ---------------------------------------------------------------------------

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  batchId: string;
  batchName: string;
  examTarget?: string;
  tenantId: string;
  tenantName: string;
  enrolledAt: string;
  status?: string;
}

export interface EnrollmentListResponse {
  items: Enrollment[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface EnrollmentParams {
  tenantId?: string;
  batchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listEnrollments(params?: EnrollmentParams) {
  const res = await apiClient.get("/super-admin/enrollments", { params });
  return extractData<EnrollmentListResponse>(res);
}
