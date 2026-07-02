import axios from "axios";
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { getApiBaseUrl } from "@/lib/api-config";
import { getSubdomain, getSubdomainFromHost } from "@/lib/tenant";
import { useAuthStore } from "@/lib/auth-store";

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
const BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  // AI-heavy flows (mock generation/review) frequently exceed 30s.
  // Keep a safer default; specific calls can still override per request.
  timeout: 240_000,
  headers: { "Content-Type": "application/json" },
});

// Public endpoints that must not carry auth or tenant headers
const PUBLIC_FRAGMENTS = [
  "auth/login",
  "auth/register",
  "auth/otp",
  "auth/forgot",
  "auth/reset",
  "school/auth/login",
  "school/auth/register",
];
const isPublicEndpoint = (url = "") =>
  PUBLIC_FRAGMENTS.some((p) => (url || "").replace(/^\//, "").includes(p));

/** School auth must not send tenant subdomain — login uses school DB only */
const isSchoolAuthEndpoint = (url = "") => {
  const path = (url || "").replace(/^\//, "");
  return path.startsWith("school/auth/");
};

const isSchoolApiEndpoint = (url = "") => {
  const path = (url || "").replace(/^\//, "");
  return path.startsWith("school/");
};

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.replace("/login");
}

// ---------------------------------------------------------------------------
// Request interceptor — attach token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const path = (config.url || "").replace(/^\//, "");
    const schoolApi = isSchoolApiEndpoint(path);
    const schoolAuth = isSchoolAuthEndpoint(path);
    const { tenantType, user } = useAuthStore.getState();

    // School uses institute_id (school DB), not coaching tenants — never send X-Tenant-Subdomain.
    if (!schoolApi && !schoolAuth) {
      const subdomain = isPublicEndpoint(config.url)
        ? getSubdomainFromHost()
        : getSubdomain();
      if (subdomain && config.headers) {
        config.headers["X-Tenant-Subdomain"] = subdomain;
      }
    } else if (schoolApi && config.headers) {
      const instituteId =
        user?.instituteId || (tenantType === "school" ? user?.tenantId : null);
      if (instituteId) {
        config.headers["X-Institute-Id"] = instituteId;
      }
      const hostSub = getSubdomainFromHost();
      if (hostSub && config.headers) {
        config.headers["X-Institute-Domain"] = hostSub;
      }
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
      const url = (originalRequest.url || "").replace(/^\//, "");
      const isAuthEndpoint = [
        "auth/login",
        "auth/otp",
        "auth/refresh",
        "auth/forgot",
        "auth/reset",
        "school/auth/login",
        "school/auth/register",
      ].some((p) => url.includes(p));
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      const accessToken = tokenStorage.getAccess();
      const refreshToken = tokenStorage.getRefresh();

      // School JWT has no refresh token — do not call coaching /auth/refresh
      if (useAuthStore.getState().tenantType === "school" && !isSchoolApiEndpoint(url)) {
        return Promise.reject(error);
      }

      if (isSchoolApiEndpoint(url)) {
        tokenStorage.clear();
        useAuthStore.getState().clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (!refreshToken && !accessToken) {
        return Promise.reject(error);
      }
      if (!refreshToken) {
        tokenStorage.clear();
        useAuthStore.getState().clearAuth();
        redirectToLogin();
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
        useAuthStore.getState().clearAuth();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 — account or institute suspended
    if (error.response?.status === 403) {
      const message = (error.response.data as ApiError)?.message || "";
      if (message.toLowerCase().includes("suspend")) {
        window.location.href = "/suspended";
        return Promise.reject(error);
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
