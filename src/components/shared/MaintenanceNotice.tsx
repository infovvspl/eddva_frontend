import { AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export const MAINTENANCE_TITLE = "Maintenance Notice";
export const MAINTENANCE_MESSAGE =
  "We are currently under maintenance. Some features may be temporarily unavailable while we improve the platform.";

export default function MaintenanceNotice() {
  const { maintenanceMode, user } = useAuthStore();

  if (!maintenanceMode || user?.role === "super_admin") return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50/95 px-4 py-3 text-amber-900 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-screen-2xl items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight">{MAINTENANCE_TITLE}</p>
          <p className="mt-0.5 text-sm font-medium leading-6 text-amber-800">
            {MAINTENANCE_MESSAGE}
          </p>
        </div>
      </div>
    </div>
  );
}
