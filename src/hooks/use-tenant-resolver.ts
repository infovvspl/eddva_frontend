import { useQuery } from "@tanstack/react-query";
import { getSubdomain } from "@/lib/tenant";
import { resolveTenant } from "@/lib/api/public-tenant";

/** Detect subdomain and fetch tenant info. Returns null when on main domain. */
export function useTenantResolver() {
  const subdomain = getSubdomain();

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ["tenant", "resolve", subdomain],
    queryFn: () => resolveTenant(subdomain!),
    enabled: !!subdomain,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    subdomain,
    tenant,
    isLoading: !!subdomain && isLoading,
    error,
    isTenantDomain: !!subdomain,
  };
}
