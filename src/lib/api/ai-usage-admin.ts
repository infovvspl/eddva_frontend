import schoolApi from './school-client';
import { apiClient } from './client';

const api = schoolApi;

// Routes live under /school/super-admin/ai-usage/* — school-client prepends /school automatically.

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AiUsageDashboard {
  totalRequests: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  byFeature: {
    featureId: string;
    label: string;
    requests: number;
    cost: number;
    successRate: number;
  }[];
  dailyRequests: { date: string; requests: number }[];
}

export interface InstituteUsageSummary {
  institute_id: string;
  institute_name: string;
  vertical: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface InstituteFeatureDetail {
  featureId: string;
  featureLabel: string;
  category: string;
  requests: number;
  cost: number;
  avgLatencyMs: number;
  isEnabled: boolean;
  monthlyLimit: number | null;
  currentUsage: number;
  successRate: number;
}

export interface InstituteUsageDetail {
  instituteId: string;
  totalRequests: number;
  totalCost: number;
  successRate: number;
  features: InstituteFeatureDetail[];
}

export interface GlobalFeatureFlag {
  featureId: string;
  label: string;
  category: string;
  isEnabled: boolean;
}

export type Product = 'school' | 'coaching' | 'all';
export type Period = 'today' | 'week' | 'month';

// ── Helpers ────────────────────────────────────────────────────────────────────

function extract<T>(res: { data: unknown }): T {
  const d = res.data as { data?: T; success?: boolean } | T;
  if (d && typeof d === 'object' && 'data' in (d as object)) {
    return (d as { data: T }).data;
  }
  return d as T;
}

// ── API functions ──────────────────────────────────────────────────────────────

export async function getInstituteUsageDetail(
  instituteId: string,
  product: Product = 'all',
  period: Period = 'month',
): Promise<InstituteUsageDetail> {
  const r = await api.get(`/super-admin/ai-usage/institute/${instituteId}`, {
    params: { product, period },
  });
  return extract<InstituteUsageDetail>(r);
}

export async function getGlobalFeatureFlags(product: Product): Promise<GlobalFeatureFlag[]> {
  const r = await api.get('/super-admin/ai-usage/feature-flags', { params: { product } });
  return extract<GlobalFeatureFlag[]>(r) ?? [];
}

export async function updateGlobalFeatureFlag(
  featureId: string,
  product: 'school' | 'coaching',
  isEnabled: boolean,
): Promise<void> {
  await api.patch(`/super-admin/ai-usage/feature-flags/${featureId}`, { product, isEnabled });
}

export async function updateInstituteFeature(
  instituteId: string,
  featureId: string,
  data: {
    product: 'school' | 'coaching';
    isEnabled: boolean;
    monthlyRequestLimit?: number;
    monthlyCostCap?: number;
  },
): Promise<void> {
  await api.patch(
    `/super-admin/ai-usage/institute/${instituteId}/features/${featureId}`,
    data,
  );
}
