import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { announcementsApi } from "@/lib/api";
import type { AnnouncementCreatePayload, AnnouncementListParams } from "@/lib/api/announcements";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const announcementKeys = {
  all: ["announcements"] as const,
  list: (params?: AnnouncementListParams) => ["announcements", "list", params] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** List announcements */
export function useAnnouncements(params?: AnnouncementListParams) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: () => announcementsApi.listAnnouncements(params),
    staleTime: 30_000,
  });
}

/** Create announcement */
export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AnnouncementCreatePayload) =>
      announcementsApi.createAnnouncement(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}

/** Delete announcement */
export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsApi.deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
    },
  });
}
