import axios from 'axios';
import { tokenStorage } from './client';

/**
 * Teacher self-service client for the EDDVA ERP's Staff module
 * (`/api/staff/me/*`). This is a separate token island from the main LMS
 * `api` client: the exchanged `staff_token` only works against the ERP
 * backend and only grants access to the caller's own staff record.
 */
const ERP_API_URL = import.meta.env.VITE_ERP_API_URL || 'http://localhost:3001/api';
const STAFF_TOKEN_KEY = 'eddva_erp_staff_self_token';

const erpClient = axios.create({ baseURL: ERP_API_URL });

erpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(STAFF_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let exchangeInFlight: Promise<string> | null = null;

/** Exchanges the teacher's LMS login for a scoped ERP staff_token, caching it for the tab session. */
async function ensureStaffToken(): Promise<string> {
  const cached = sessionStorage.getItem(STAFF_TOKEN_KEY);
  if (cached) return cached;
  if (exchangeInFlight) return exchangeInFlight;

  const lmsToken = tokenStorage.getAccess();
  if (!lmsToken) throw new Error('Not logged in');

  exchangeInFlight = axios
    .get(`${ERP_API_URL}/staff/auth/teacher-sso`, { params: { token: lmsToken } })
    .then((res) => {
      const staffToken = res.data?.data?.staff_token;
      if (!staffToken) throw new Error('ERP did not return a staff token');
      sessionStorage.setItem(STAFF_TOKEN_KEY, staffToken);
      return staffToken;
    })
    .finally(() => {
      exchangeInFlight = null;
    });

  return exchangeInFlight;
}

export interface MyLeaveBalance {
  balance_id: number;
  leave_type_id: number;
  year: number;
  allocated_days: string;
  used_days: string;
  leave_type: { name: string; code: string; is_paid: boolean };
}

export interface MyLeaveApplication {
  application_id: number;
  leave_type_id: number;
  leave_type: { name: string; code: string };
  from_date: string;
  to_date: string;
  days_count: string;
  is_half_day: boolean;
  half_day_period: 'AM' | 'PM' | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decision_reason: string | null;
  created_at: string;
}

export interface ApplyLeaveInput {
  leave_type_id: number;
  from_date: string;
  to_date: string;
  is_half_day?: boolean;
  half_day_period?: 'AM' | 'PM';
  reason?: string;
}

async function withAuth<T>(fn: () => Promise<T>): Promise<T> {
  await ensureStaffToken();
  try {
    return await fn();
  } catch (err: any) {
    if (err?.response?.status === 401) {
      // Stale/expired staff token — re-exchange once and retry.
      sessionStorage.removeItem(STAFF_TOKEN_KEY);
      await ensureStaffToken();
      return fn();
    }
    throw err;
  }
}

export async function getMyProfile() {
  return withAuth(async () => (await erpClient.get('/staff/me')).data.data);
}

export async function getMyLeaveBalances(year?: number): Promise<MyLeaveBalance[]> {
  return withAuth(async () => (await erpClient.get('/staff/me/leave-balances', { params: year ? { year } : undefined })).data.data || []);
}

export async function getMyLeaveApplications(): Promise<MyLeaveApplication[]> {
  return withAuth(async () => (await erpClient.get('/staff/me/leave-applications')).data.data || []);
}

export async function applyForLeave(data: ApplyLeaveInput): Promise<MyLeaveApplication> {
  return withAuth(async () => (await erpClient.post('/staff/me/leave-applications', data)).data.data);
}

export async function cancelMyLeave(applicationId: number): Promise<MyLeaveApplication> {
  return withAuth(async () => (await erpClient.patch(`/staff/me/leave-applications/${applicationId}/cancel`)).data.data);
}

export interface MyNotification {
  notification_id: number;
  entity_type: string;
  entity_id: number;
  event_type: string;
  message: string | null;
  created_at: string;
}

export async function getMyNotifications(limit = 50): Promise<MyNotification[]> {
  return withAuth(async () => (await erpClient.get('/staff/me/notifications', { params: { limit } })).data.data || []);
}

export function getLeaveApiErrorMessage(err: any, fallback: string): string {
  return err?.response?.data?.error?.message || err?.response?.data?.message || fallback;
}
