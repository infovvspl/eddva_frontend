import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantsApi } from "@/lib/api";
import type { TenantCreatePayload, TenantListParams, EnrollmentParams } from "@/lib/api/tenants";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const tenantKeys = {
  all: ["tenants"] as const,
  list: (params?: TenantListParams) => ["tenants", "list", params] as const,
  detail: (id: string) => ["tenants", "detail", id] as const,
  stats: (id: string) => ["tenants", "stats", id] as const,
  enrollments: (params?: EnrollmentParams) => ["tenants", "enrollments", params] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** List tenants with filters */
export function useTenants(params?: TenantListParams) {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: () => tenantsApi.listTenants(params),
    staleTime: 30_000,
  });
}

/** Single tenant detail */
export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => tenantsApi.getTenant(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** Tenant stats */
export function useTenantStats(id: string) {
  return useQuery({
    queryKey: tenantKeys.stats(id),
    queryFn: () => tenantsApi.getTenantStats(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/** Create tenant */
export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TenantCreatePayload) => tenantsApi.createTenant(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

/** Update tenant */
export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<TenantCreatePayload> & { id: string }) =>
      tenantsApi.updateTenant(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: tenantKeys.all });
      qc.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) });
    },
  });
}

/** Suspend tenant */
export function useSuspendTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.suspendTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

/** Activate tenant */
export function useActivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantsApi.activateTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useEnrollments(params?: EnrollmentParams) {
  return useQuery({
    queryKey: tenantKeys.enrollments(params),
    queryFn: () => tenantsApi.listEnrollments(params),
    staleTime: 30_000,
  });
}
