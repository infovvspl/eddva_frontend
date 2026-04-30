import { apiClient, extractData } from "./client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: "institute_admin" | "student";
}

export interface RegisterResponse {
  userId: string;
  message: string;
}

export interface SendPhoneOtpPayload  { phoneNumber: string; userId?: string }
export interface SendEmailOtpPayload  { email: string;       userId?: string }
export interface VerifyPhoneOtpPayload { phoneNumber: string; otp: string; userId?: string }
export interface VerifyEmailOtpPayload { email: string;       otp: string; userId?: string }

export interface OtpSendResponse    { message: string; maskedPhone?: string; maskedEmail?: string }
export interface OtpVerifyResponse  { message: string; verified: boolean }

// ── Endpoints ────────────────────────────────────────────────────────────────

/** Pre-register user (creates record, returns userId for OTP flow) */
export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await apiClient.post("/auth/otp-register", payload);
  return extractData<RegisterResponse>(res);
}

/** Send OTP to phone via Twilio Verify */
export async function sendPhoneOtp(payload: SendPhoneOtpPayload): Promise<OtpSendResponse> {
  const res = await apiClient.post("/auth/otp/send-phone", payload);
  return extractData<OtpSendResponse>(res);
}

/** Verify phone OTP */
export async function verifyPhoneOtp(payload: VerifyPhoneOtpPayload): Promise<OtpVerifyResponse> {
  const res = await apiClient.post("/auth/otp/verify-phone", payload);
  return extractData<OtpVerifyResponse>(res);
}

/** Send OTP to email via Resend */
export async function sendEmailOtp(payload: SendEmailOtpPayload): Promise<OtpSendResponse> {
  const res = await apiClient.post("/auth/otp/send-email", payload);
  return extractData<OtpSendResponse>(res);
}

/** Verify email OTP */
export async function verifyEmailOtp(payload: VerifyEmailOtpPayload): Promise<OtpVerifyResponse> {
  const res = await apiClient.post("/auth/otp/verify-email", payload);
  return extractData<OtpVerifyResponse>(res);
}
