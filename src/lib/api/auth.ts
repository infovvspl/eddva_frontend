import { apiClient, extractData, tokenStorage } from "./client";
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
    return data as GetMeResponse;
  }
  return { user: data as AuthUser };
}

/** Update profile */
export async function updateProfile(payload: ProfileUpdatePayload) {
  const res = await apiClient.patch("/auth/profile", payload);
  return extractData(res);
}

/** Login with email + password */
export async function loginWithPassword(payload: { email?: string; phoneNumber?: string; password: string }): Promise<OtpVerifyResponse> {
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

/** Logout — clear tokens */
export function logout() {
  tokenStorage.clear();
}

/** Complete teacher onboarding */
export async function completeTeacherOnboarding(payload: TeacherOnboardingPayload) {
  const res = await apiClient.post("/auth/teacher/onboard", payload);
  return extractData(res);
}

/** Upload avatar image (unified S3 flow) */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  // Step 1 — Upload to S3
  const fileUrl = await uploadToS3(
    {
      type: "profile",
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    },
    file
  );

  // Step 2 — Confirm with backend and persist in DB
  const res = await apiClient.post("/auth/profile/avatar", { fileUrl });
  return extractData<{ avatarUrl: string }>(res);
}

