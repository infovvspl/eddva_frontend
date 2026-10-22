import { apiClient, extractData, tokenStorage } from "./client";
import { storeSubdomain, clearStoredSubdomain } from "@/lib/tenant";
import { uploadToS3 } from "./upload";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface OtpSendPayload {
  phoneNumber: string;
}

export interface OtpVerifyPayload {
  phoneNumber: string;
  otp: string;
}

export interface AuthUser {
  id: string;
  fullName?: string;
  name?: string;
  phoneNumber?: string;
  phone?: string;
  email?: string;
  role: string;
  avatar?: string;
  profileImage?: string;
  permissionGroup?: string;
  tenantId?: string;
  tenantName?: string;
  tenant?: { id: string; name: string; subdomain?: string; logoUrl?: string; brandColor?: string };
}

export interface OtpVerifyResponse {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  user?: AuthUser;
  isNewUser?: boolean;
  onboardingRequired?: boolean;
}

export interface ProfileUpdatePayload {
  fullName?: string;
  email?: string;
}

export interface TeacherOnboardingPayload {
  fullName?: string;
  qualification?: string;
  subjectExpertise?: string[];
  classesTeach?: string[];
  yearsOfExperience?: number;
  bio?: string;
  gender?: string;
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  teachingMode?: string;
  previousInstitute?: string;
  city?: string;
  state?: string;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Send OTP to phone number */
export async function sendOtp(payload: OtpSendPayload) {
  const res = await apiClient.post("/auth/otp/send", payload);
  return extractData(res);
}

/** Verify OTP and get access token */
export async function verifyOtp(payload: OtpVerifyPayload): Promise<OtpVerifyResponse> {
  const res = await apiClient.post("/auth/otp/verify", payload);
  const data = extractData<OtpVerifyResponse>(res);

  // Persist tokens
  const accessToken = data.accessToken || data.access_token;
  const refreshToken = data.refreshToken || data.refresh_token;
  if (accessToken) tokenStorage.setAccess(accessToken);
  if (refreshToken) tokenStorage.setRefresh(refreshToken);

  // Store subdomain so bare-localhost dev requests carry the correct tenant header
  const subdomain = data.user?.tenant?.subdomain;
  storeSubdomain(subdomain);

  return data;
}

export interface GetMeResponse {
  user: AuthUser;
  student?: unknown;
  teacherProfile?: unknown;
}

/** Get current user profile */
export async function getMe(): Promise<GetMeResponse> {
  const res = await apiClient.get("/auth/me");
  const data = extractData<GetMeResponse | AuthUser>(res);
  // Handle both wrapped { user: ... } and flat AuthUser shapes
  if (data && typeof data === "object" && "user" in data) {
    const result = data as GetMeResponse;
    // Keep stored subdomain fresh for bare-localhost dev sessions
    storeSubdomain(result.user?.tenant?.subdomain);
    return result;
  }
  const user = data as AuthUser;
  storeSubdomain(user?.tenant?.subdomain);
  return { user };
}

/** Update profile */
export async function updateProfile(payload: ProfileUpdatePayload) {
  const res = await apiClient.patch("/auth/profile", payload);
  return extractData(res);
}

/** Dismiss first login flag */
export async function dismissFirstLogin() {
  const res = await apiClient.patch("/auth/profile", {});
  return extractData(res);
}

export interface SchoolLoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    photo?: string;
    phone?: string;
    instituteId?: string;
    profileImage?: string | null;
    isPrimaryAdmin?: boolean;
    adminPermissions?: string[] | null;
    studentProfile?: {
      id?: string;
      sectionId?: string;
      sectionName?: string;
      classId?: string;
      className?: string;
      enrollmentNo?: string;
      rollNo?: string;
      currentClass?: string;
      subjects?: string[];
    } | null;
  };
  institute: {
    id: string;
    name: string;
    tenantDomain?: string;
    logo?: string;
    erpEnabled?: boolean;
    lmsEnabled?: boolean;
    // The backend is not consistent about casing; SchoolAuthContext reads both forms.
    logo_url?: string;
    state?: string;
    city?: string;
    location?: string;
    tenant_domain?: string;
    erp_enabled?: boolean;
    lms_enabled?: boolean;
    aiEnabled?: boolean;
    ai_enabled?: boolean;
    // JSON object, or a JSON string depending on how the row was serialised.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aiFeatures?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ai_features?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modulesPermissions?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modules_permissions?: any;
  } | null;
  tenantDomain?: string;
}

/** Mints a short-lived bridge token the ERP frontend's /sso route exchanges for a real ERP session. */
export async function mintErpSsoToken(): Promise<{ success: boolean; token: string }> {
  const res = await apiClient.post("/school/auth/erp-sso-token", {});
  return extractData(res);
}

/** Login via school backend — returns token (not accessToken) */
export async function loginSchoolWithPassword(payload: { email?: string; phone?: string; password: string }): Promise<SchoolLoginResponse> {
  tokenStorage.clear();
  const res = await apiClient.post("/school/auth/login", payload);
  const data = extractData<SchoolLoginResponse>(res);
  if (data.token) tokenStorage.setAccess(data.token);
  return data;
}

/** Login with email + password */
export async function loginWithPassword(payload: { email?: string; phoneNumber?: string; password: string }): Promise<OtpVerifyResponse> {
  tokenStorage.clear();
  const res = await apiClient.post("/auth/login", payload);
  const data = extractData<OtpVerifyResponse>(res);

  const accessToken = data.accessToken || data.access_token;
  const refreshToken = data.refreshToken || data.refresh_token;
  if (accessToken) tokenStorage.setAccess(accessToken);
  if (refreshToken) tokenStorage.setRefresh(refreshToken);

  return data;
}

/** Set or update password (first login) */
export async function setPassword(password: string) {
  const res = await apiClient.post("/auth/password", { password });
  return extractData<{ message: string }>(res);
}

/** Request password reset email */
export async function forgotPassword(email: string) {
  const res = await apiClient.post("/auth/forgot-password", { email });
  return extractData<{ message: string; token?: string }>(res);
}

/** Reset password with token */
export async function resetPassword(token: string, newPassword: string) {
  const res = await apiClient.post("/auth/reset-password", { token, newPassword });
  return extractData<{ message: string }>(res);
}

/** Logout — clear tokens and stored tenant */
export function logout() {
  tokenStorage.clear();
  clearStoredSubdomain();
}

/** Complete teacher onboarding */
export async function completeTeacherOnboarding(payload: TeacherOnboardingPayload) {
  const res = await apiClient.post("/auth/teacher/onboard", payload);
  return extractData(res);
}

/** Upload avatar image (unified S3 flow) */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  // Backend streams the file to S3 and saves the URL in one call
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiClient.post("/auth/profile/avatar", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return extractData<{ avatarUrl: string }>(res);
}

// ---------------------------------------------------------------------------
// OTP & MFA REGISTRATION (New)
// ---------------------------------------------------------------------------

export async function sendPhoneOtp(payload: { phoneNumber: string; userId?: string }) {
  const res = await apiClient.post("/auth/otp/send-phone", payload);
  return extractData(res);
}

export async function verifyPhoneOtp(payload: { phoneNumber: string; otp: string; userId?: string }) {
  const res = await apiClient.post("/auth/otp/verify-phone", payload);
  return extractData(res);
}

export async function sendEmailOtp(payload: { email: string; userId?: string }) {
  const res = await apiClient.post("/auth/otp/send-email", payload);
  return extractData(res);
}

export async function verifyEmailOtp(payload: { email: string; otp: string; userId?: string }) {
  const res = await apiClient.post("/auth/otp/verify-email", payload);
  return extractData(res);
}

export async function updateContactInfo(payload: { userId: string; phoneNumber?: string; email?: string }) {
  const res = await apiClient.post("/auth/otp/update-contact", payload);
  return extractData(res);
}
