import axios from "axios";
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { getSubdomain } from "@/lib/tenant";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Token helpers (localStorage based — works across tabs)
// ---------------------------------------------------------------------------
const TOKEN_KEY = "eddva_access_token";
const REFRESH_KEY = "eddva_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  setAccess: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// Public endpoints that must not carry auth or tenant headers
const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/otp", "/auth/forgot", "/auth/reset"];
const isPublicEndpoint = (url = "") => PUBLIC_ENDPOINTS.some((p) => url.includes(p));

// ---------------------------------------------------------------------------
// Request interceptor — attach token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Always attach subdomain header — backend needs it even for login
    // to know which tenant to authenticate against
    const subdomain = getSubdomain();
    if (subdomain && config.headers) {
      config.headers["X-Tenant-Subdomain"] = subdomain;
    }

    // Auth header only for non-public endpoints
    if (!isPublicEndpoint(config.url)) {
      const token = tokenStorage.getAccess();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — unwrap `{ data }` envelope & handle 401
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: AxiosRequestConfig;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(apiClient(config));
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // The backend wraps payloads in { data: ... } — unwrap if present
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Never attempt a token refresh for auth endpoints themselves
      const url = originalRequest.url || "";
      const isAuthEndpoint = ["/auth/login", "/auth/otp", "/auth/refresh", "/auth/forgot", "/auth/reset"].some(
        (p) => url.includes(p)
      );
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      const accessToken = tokenStorage.getAccess();
      const refreshToken = tokenStorage.getRefresh();
      // No tokens at all — just reject
      if (!refreshToken && !accessToken) {
        return Promise.reject(error);
      }
      // Access token but no refresh token — clear stale state and redirect
      if (!refreshToken) {
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const newToken = data.data?.accessToken || data.accessToken;
        if (newToken) {
          tokenStorage.setAccess(newToken);
          if (data.data?.refreshToken || data.refreshToken) {
            tokenStorage.setRefresh(data.data?.refreshToken || data.refreshToken);
          }
        }
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        tokenStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Helper to extract data from API responses
// ---------------------------------------------------------------------------
export function extractData<T>(response: { data: ApiResponse<T> | T }): T {
  const d = response.data;
  if (d && typeof d === "object" && "data" in d) {
    return (d as ApiResponse<T>).data;
  }
  return d as T;
}
