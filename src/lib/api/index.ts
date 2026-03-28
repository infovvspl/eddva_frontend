// Re-export everything for convenient imports
export { apiClient, tokenStorage } from "./client";
export type { ApiResponse, ApiError, PaginatedResponse } from "./client";

export * as authApi from "./auth";
export * as tenantsApi from "./tenants";
export * as usersApi from "./users";
export * as announcementsApi from "./announcements";
export * as statsApi from "./stats";
