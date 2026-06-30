import { useEffect } from "react";
import { useAuthStore, AiFeatureKey } from "@/lib/auth-store";
import { apiClient } from "@/lib/api/client";

/** Fetch tenant AI features once after login and store in Zustand */
export function useTenantFeatures() {
  const { user, tenantType, setAiFeatures } = useAuthStore();

  useEffect(() => {
    // Skip only for school tenants (the endpoint is coaching-only).
    // Coaching students may log in via OTP with tenantType left null, so we
    // fetch whenever it's NOT explicitly 'school'.
    if (!user || tenantType === 'school') return;

    apiClient.get('/auth/tenant/features')
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setAiFeatures(data?.aiEnabled ?? false, data?.aiFeatures ?? [], data?.modulesPermissions ?? {});
      })
      .catch(() => {
        // Non-blocking — default to no AI
        setAiFeatures(false, [], {});
      });
  }, [user?.id, tenantType]);
}

/** Returns true if the current tenant has the given AI feature enabled */
export function useHasAiFeature(feature: AiFeatureKey): boolean {
  const { aiEnabled, aiFeatures } = useAuthStore();
  return aiEnabled && aiFeatures.includes(feature);
}

/** Returns true if the tenant has AI enabled at all */
export function useAiEnabled(): boolean {
  return useAuthStore((s) => s.aiEnabled);
}
