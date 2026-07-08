import schoolApi from './school-client';
import { apiClient } from './client';
import { useAuthStore } from '../auth-store';

const getClient = () => {
  return useAuthStore.getState().tenantType === 'coaching' ? apiClient : schoolApi;
};

// Routes live under /school/super-admin/ai-usage/* or /super-admin/ai-usage/*

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
  tokens: number;
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
  totalTokens: number;
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

export interface BillingReportRow {
  month: string;
  institute_id: string;
  institute_name?: string;
  vertical: string;
  feature: string;
  requests: number;
  tokens: number;
  cost: number;
}

export type Product = 'school' | 'coaching' | 'all';
export type Period = 'today' | 'week' | 'month';

export interface RawAiLog {
  id: string;
  institute_id: string;
  vertical: string;
  feature: string;
  provider: string;
  model: string;
  success: boolean;
  status_code: number;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  est_cost: number;
  created_at: string;
}

export interface RawAiLogsResponse {
  data: RawAiLog[];
  total: number;
  limit: number;
  offset: number;
}

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
  client: any = getClient(),
): Promise<InstituteUsageDetail> {
  const r = await client.get(`/super-admin/ai-usage/institute/${instituteId}`, {
    params: { product, period },
  });
  return extract<InstituteUsageDetail>(r);
}

export async function getGlobalFeatureFlags(product: Product, client: any = getClient()): Promise<GlobalFeatureFlag[]> {
  const r = await client.get('/super-admin/ai-usage/feature-flags', { params: { product } });
  return extract<GlobalFeatureFlag[]>(r) ?? [];
}

export async function updateGlobalFeatureFlag(
  featureId: string,
  product: 'school' | 'coaching',
  isEnabled: boolean,
  client: any = getClient(),
): Promise<void> {
  await client.patch(`/super-admin/ai-usage/feature-flags/${featureId}`, { product, isEnabled });
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
  client: any = getClient(),
): Promise<void> {
  await client.patch(
    `/super-admin/ai-usage/institute/${instituteId}/features/${featureId}`,
    data,
  );
}

export async function getRawAiLogs(
  params: {
    instituteId?: string;
    product?: Product;
    feature?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  },
  isSuperAdmin: boolean = false
): Promise<RawAiLogsResponse> {
  // If not super admin, it uses the tenant endpoint which ignores product and uses their own tenantId implicitly
  const endpoint = isSuperAdmin ? '/super-admin/ai-usage/logs' : '/ai-usage/logs';
  const r = await getClient().get(endpoint, { params });
  
  // The backend returns { success: true, data: [...], total: X, limit: Y, offset: Z }
  // We should NOT use the generic `extract` function here because it unwraps `data` and throws away `total`.
  const responseData = r.data as any;
  if (responseData && typeof responseData === 'object' && Array.isArray(responseData.data)) {
    return {
      data: responseData.data,
      total: responseData.total || 0,
      limit: responseData.limit || 100,
      offset: responseData.offset || 0,
    };
  }
  
  return { data: [], total: 0, limit: 100, offset: 0 };
}

export async function getBillingReport(product: Product = 'all', from?: string, to?: string): Promise<BillingReportRow[]> {
  const r = await getClient().get('/super-admin/ai-usage/reports/billing', { params: { product, from, to } });
  return extract<BillingReportRow[]>(r) || [];
}
