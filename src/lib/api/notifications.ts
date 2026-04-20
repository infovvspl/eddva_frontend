import { apiClient, extractData } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "lecture_scheduled"
  | "lecture_published"
  | "battle_invite"
  | "doubt_resolved"
  | "xp_earned"
  | "streak_milestone"
  | "batch_announcement"
  | "plan_generated"
  | "mock_test_scheduled"
  | "rank_change"
  | "course_view"
  | "general";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  /** backend field is `body`, older shape used `message` */
  body?: string;
  message?: string;
  isRead: boolean;
  status?: string;   // "pending" | "sent" | "read" | "failed"
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  refId?: string;
  refType?: string;
  /** parsed data blob from backend */
  data?: Record<string, any>;
}

export interface NotificationsResult {
  data: Notification[];
  total: number;
  unreadCount: number;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResult> {
  const q = new URLSearchParams();
  if (params?.page)      q.set("page", String(params.page));
  if (params?.limit)     q.set("limit", String(params.limit ?? 30));
  if (params?.unreadOnly) q.set("unreadOnly", "true");
  try {
    const res = await apiClient.get(`/notifications?${q}`);
    const raw = extractData<any>(res);
    // Backend may return array or paginated shape
    if (Array.isArray(raw)) {
      return { data: raw, total: raw.length, unreadCount: raw.filter((n: Notification) => !n.isRead).length };
    }
    return {
      data: raw?.data ?? raw?.notifications ?? [],
      total: raw?.total ?? 0,
      unreadCount: raw?.unreadCount ?? 0,
    };
  } catch {
    return { data: [], total: 0, unreadCount: 0 };
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await apiClient.get("/notifications/unread-count");
    const data = extractData<{ count: number } | number>(res);
    return typeof data === "number" ? data : (data as any)?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all", {});
}
