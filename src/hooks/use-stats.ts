import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const statsKeys = {
  platform: ["stats", "platform"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Platform-wide stats */
export function usePlatformStats() {
  return useQuery({
    queryKey: statsKeys.platform,
    queryFn: () => statsApi.getPlatformStats(),
    staleTime: 60_000,
  });
}
