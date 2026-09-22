// blogAdminClient.ts — a deliberately separate axios instance for the blog
// admin panel. It does not import `useAuthStore` or anything else from the
// LMS auth stack: its token lives under its own localStorage key, and it
// never attaches an LMS Authorization header or X-Tenant-Subdomain. The
// backend enforces the same separation independently (BlogAdminGuard verifies
// against its own JWT secret) — this client just mirrors it on the client side.

import axios from "axios";
import { getApiBaseUrl } from "../api-config";

const TOKEN_KEY = "blog_admin_token";

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export const blogAdminToken = {
  get: () => safeGet(TOKEN_KEY),
  set: (t: string) => safeSet(TOKEN_KEY, t),
  clear: () => safeRemove(TOKEN_KEY),
};

export const blogAdminClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

blogAdminClient.interceptors.request.use((config) => {
  const isLogin = (config.url || "").includes("blog-admin/auth/login");
  if (!isLogin) {
    const token = blogAdminToken.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

blogAdminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      blogAdminToken.clear();
    }
    return Promise.reject(error);
  },
);

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export function extractData<T>(response: { data: ApiResponse<T> | T }): T {
  const d = response.data;
  if (d && typeof d === "object" && "data" in d) {
    return (d as ApiResponse<T>).data;
  }
  return d as T;
}
