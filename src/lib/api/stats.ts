import { apiClient, extractData } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PlatformStats {
  totalTenants?: number;
  activeTenants?: number;
  trialTenants?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalBattlesPlayed?: number;
  mrrEstimate?: number;
  newTenantsThisMonth?: number;
  newStudentsThisMonth?: number;
  // Aliases used by UI pages
  totalInstitutes?: number;
  activeInstitutes?: number;
  totalBatches?: number;
  monthlyRevenue?: number;
  platformMrr?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Get platform-wide stats */
export async function getPlatformStats() {
  const res = await apiClient.get("/admin/stats");
  return extractData<PlatformStats>(res);
}
