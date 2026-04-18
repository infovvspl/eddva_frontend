import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSubdomain } from "@/lib/tenant";
import {
  fetchInstituteCoursesBySubdomain,
  fetchInstituteCoursesByTenantId,
  fetchPublicPlatformCoursesCatalog,
  type InstituteCoursesPayload,
} from "@/lib/api/public-tenant";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CatalogMode =
  | { key: string; load: () => Promise<InstituteCoursesPayload> };

function resolveCatalogMode(): CatalogMode {
  const hostSub = getSubdomain()?.trim() || null;
  const envSub = (import.meta.env.VITE_DEFAULT_TENANT_SUBDOMAIN as string | undefined)?.trim() || null;
  const envTenantId = (import.meta.env.VITE_PUBLIC_CATALOG_TENANT_ID as string | undefined)?.trim() || null;

  if (hostSub) {
    return { key: `sub:${hostSub}`, load: () => fetchInstituteCoursesBySubdomain(hostSub) };
  }
  if (envSub) {
    return { key: `sub:${envSub}`, load: () => fetchInstituteCoursesBySubdomain(envSub) };
  }
  if (envTenantId && UUID_RE.test(envTenantId)) {
    return { key: `tenant:${envTenantId}`, load: () => fetchInstituteCoursesByTenantId(envTenantId) };
  }
  return { key: "platform", load: fetchPublicPlatformCoursesCatalog };
}

/**
 * Public courses for /courses: institute subdomain, optional env overrides, or platform-wide catalog.
 * After login/register, students use course discovery (e.g. /student/courses?discover=1) to enroll and pay.
 */
export function useInstituteCoursesCatalog() {
  const mode = useMemo(() => resolveCatalogMode(), []);

  return useQuery({
    queryKey: ["tenant", "courses-catalog", mode.key] as const,
    queryFn: mode.load,
    staleTime: 60_000,
  });
}
