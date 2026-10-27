import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, extractData } from "@/lib/api/client";

const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"));

/** How often a visible tab re-checks whether maintenance mode was switched on or off. */
export const MAINTENANCE_POLL_MS = 60_000;

/**
 * The first answer is awaited so a locked platform never flashes the app, but not
 * for longer than this: on a slow network the app must not sit behind a spinner.
 * If maintenance mode is on, the answer still swaps in the maintenance page when it lands.
 */
export const MAINTENANCE_FIRST_LOAD_CAP_MS = 1_500;

interface PlatformConfig {
  maintenanceMode: boolean;
  platformName: string;
  supportEmail: string;
}

const FullScreenSpinner = () => (
  <div className="flex min-h-dscreen w-full items-center justify-center bg-slate-900 text-white">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
  </div>
);

/** Writes to the store only on a real change, so an unchanged answer re-renders nothing. */
function applyPlatformConfig(data: Partial<PlatformConfig>) {
  const next: PlatformConfig = {
    maintenanceMode: !!data.maintenanceMode,
    platformName: data.platformName || "EDVA",
    supportEmail: data.supportEmail || "support@edva.in",
  };
  const current = useAuthStore.getState();
  if (
    current.maintenanceMode !== next.maintenanceMode ||
    current.platformName !== next.platformName ||
    current.supportEmail !== next.supportEmail
  ) {
    current.setPlatformConfig(next);
  }
}

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const maintenanceMode = useAuthStore((s) => s.maintenanceMode);
  const user = useAuthStore((s) => s.user);
  const tenantType = useAuthStore((s) => s.tenantType);
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Only the vertical matters to the request; keying the effect on it (not on the
  // pathname) stops a fresh request on every page change.
  const vertical = location.pathname.startsWith("/school/") || tenantType === "school" ? "school" : "coaching";

  useEffect(() => {
    let active = true;
    let lastFetchAt = 0;

    const fetchConfig = () => {
      lastFetchAt = Date.now();
      apiClient
        .get(`/tenants/public/platform-config?vertical=${vertical}`)
        .then((res) => {
          const data = extractData<Partial<PlatformConfig>>(res);
          if (active && data) applyPlatformConfig(data);
        })
        .catch((err) => {
          console.error("Failed to fetch platform config:", err);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchConfig();
    const firstLoadCap = window.setTimeout(() => {
      if (active) setLoading(false);
    }, MAINTENANCE_FIRST_LOAD_CAP_MS);

    // Re-check slowly, and only while someone is looking at the tab.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchConfig();
    }, MAINTENANCE_POLL_MS);

    // A tab that sat in the background re-checks as soon as it is shown again.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && Date.now() - lastFetchAt >= MAINTENANCE_POLL_MS) {
        fetchConfig();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      window.clearTimeout(firstLoadCap);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [vertical]);

  if (loading) return <FullScreenSpinner />;

  const isLoginPage = location.pathname.includes("/login");

  if (maintenanceMode && user?.role !== "super_admin" && !isLoginPage) {
    return (
      <Suspense fallback={<FullScreenSpinner />}>
        <MaintenancePage />
      </Suspense>
    );
  }

  return <>{children}</>;
}
