import { apiClient, extractData } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PublicTenantInfo {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan?: string;
  logoUrl?: string;
  brandColor?: string;
  welcomeMessage?: string;
  suspended?: boolean;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Resolve tenant by subdomain (public, no auth required) */
export async function resolveTenant(subdomain: string) {
  const res = await apiClient.get(`/tenants/resolve/${subdomain}`);
  return extractData<PublicTenantInfo>(res);
}

/** Send OTP for onboarding phone verification (super admin) */
export async function sendOnboardingOtp(phoneNumber: string) {
  const res = await apiClient.post("/admin/otp/send", { phoneNumber });
  return extractData<{ message: string; expiresIn: number }>(res);
}

/** Verify onboarding OTP (no user creation) */
export async function verifyOnboardingOtp(phoneNumber: string, otp: string) {
  const res = await apiClient.post("/admin/otp/verify", { phoneNumber, otp });
  return extractData<{ verified: boolean; phoneNumber: string }>(res);
}
