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
  const sub = encodeURIComponent(subdomain.trim().toLowerCase());
  const res = await apiClient.get(`/tenants/resolve/${sub}`);
  return extractData<PublicTenantInfo>(res);
}

/** Course row from GET /tenants/:tenantId/courses or GET /tenants/public/catalog */
export interface InstituteCatalogCourse {
  id: string;
  name: string;
  description: string | null;
  examTarget: string;
  class: string;
  isPaid: boolean;
  feeAmount: number | null;
  thumbnailUrl: string | null;
  maxStudents: number;
  enrolledCount: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  teacherName: string | null;
  /** Set on platform marketplace rows */
  instituteId?: string;
  instituteName?: string;
  instituteLogoUrl?: string | null;
  instituteSubdomain?: string | null;
}

export interface InstituteCoursesPayload {
  catalogScope?: "institute" | "platform";
  institute: {
    id: string;
    name: string;
    subdomain: string | null;
    status: string;
    logoUrl?: string | null;
    brandColor?: string | null;
    welcomeMessage?: string | null;
    city?: string | null;
    state?: string | null;
    suspended?: boolean;
  };
  courses: InstituteCatalogCourse[];
}

/** Public institute branding + active batches for the marketing / courses page */
export async function fetchInstituteCoursesBySubdomain(
  subdomain: string
): Promise<InstituteCoursesPayload> {
  const summary = await resolveTenant(subdomain);

  if (summary.suspended) {
    return {
      institute: {
        id: summary.id,
        name: summary.name,
        subdomain: summary.subdomain ?? null,
        status: summary.status,
        logoUrl: summary.logoUrl ?? null,
        brandColor: summary.brandColor ?? null,
        welcomeMessage: summary.welcomeMessage ?? null,
        suspended: true,
      },
      courses: [],
    };
  }

  const catalogRes = await apiClient.get(`/tenants/${summary.id}/courses`);
  return extractData<InstituteCoursesPayload>(catalogRes);
}

/** Single-institute catalog when you only know the tenant UUID (e.g. env on main domain). */
export async function fetchInstituteCoursesByTenantId(tenantId: string): Promise<InstituteCoursesPayload> {
  const res = await apiClient.get(`/tenants/${tenantId}/courses`);
  return extractData<InstituteCoursesPayload>(res);
}

/** All active courses across institutes — public, no subdomain (main /courses page). */
export async function fetchPublicPlatformCoursesCatalog(): Promise<InstituteCoursesPayload> {
  const res = await apiClient.get("/tenants/public/catalog");
  return extractData<InstituteCoursesPayload>(res);
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
