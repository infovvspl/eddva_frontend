import { apiClient, extractData } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "lecture_scheduled"
  | "lecture_published"
  | "live_class_scheduled"
  | "calendar_event"
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

export function getCoachingNotificationLink(n: Partial<Notification>, role?: string): string | null {
  if (!n) return null;

  // 1. Explicit actionUrl / targetUrl in notification payload
  const explicitUrl = n.data?.actionUrl || n.data?.targetUrl || n.data?.url || (n as any).actionUrl || (n as any).url;
  if (explicitUrl && typeof explicitUrl === "string") return explicitUrl;

  const type = String(n.type || "").toLowerCase();
  const refType = String(n.refType || n.data?.refType || n.data?.type || n.data?.category || "").toLowerCase();
  const title = String(n.title || "").toLowerCase();
  const body = String(n.body || n.message || "").toLowerCase();

  const text = `${type} ${refType} ${title} ${body}`;
  const isSchoolMode = typeof window !== "undefined" && window.location.pathname.startsWith("/school");
  const normRole = String(role || "").toLowerCase();

  // 2. Support Tickets & Complaints
  if (text.includes("ticket") || text.includes("support") || text.includes("complaint") || text.includes("grievance")) {
    if (isSchoolMode) {
      if (normRole === "teacher") return "/school/teacher/grievances";
      if (normRole === "student") return "/school/student/grievances";
      if (normRole === "parent") return "/school/parent/communication?tab=grievances";
      return "/school/admin/complaints";
    }
    if (normRole === "institute_admin" || normRole === "admin") return "/admin/support-tickets";
    if (normRole === "teacher") return "/teacher/support-tickets";
    if (normRole === "super_admin") return "/super-admin/complaints";
    return "/teacher/support-tickets";
  }

  // 3. Chat & Messages
  const isChat =
    type.includes("chat") ||
    type.includes("message") ||
    refType.includes("chat") ||
    refType.includes("message") ||
    text.includes("chat") ||
    text.includes("message") ||
    text.includes("communication") ||
    text.includes("conversation") ||
    text.includes("reply") ||
    text.includes("replied") ||
    text.includes("comment") ||
    text.includes("inbox") ||
    text.includes("dm") ||
    text.includes("broadcast") ||
    Boolean(n.data?.chatId || n.data?.threadId || n.data?.peerId || n.data?.channelId || n.data?.senderId);

  if (isChat) {
    if (isSchoolMode) {
      if (normRole === "teacher") return "/school/teacher/chat";
      if (normRole === "student") return "/school/student/chat";
      if (normRole === "parent") return "/school/parent/communication";
      return "/school/admin/communications";
    }

    const basePath = (normRole === "institute_admin" || normRole === "admin")
      ? "/admin/communication?tab=chat"
      : normRole === "student"
      ? "/student/communication"
      : normRole === "super_admin"
      ? "/super-admin/communication?tab=chat"
      : "/teacher/communication";

    const threadOrUser = n.data?.threadId || n.data?.channelId || n.data?.chatId || n.data?.peerId || n.data?.senderId || n.data?.userId || n.refId;
    if (threadOrUser && typeof threadOrUser === "string") {
      const sep = basePath.includes("?") ? "&" : "?";
      return `${basePath}${sep}userId=${encodeURIComponent(threadOrUser)}&chatId=${encodeURIComponent(threadOrUser)}`;
    }
    return basePath;
  }

  // 4. Role-based matching for other features
  if (normRole === "teacher" || normRole === "institute_admin" || normRole === "admin") {
    if (text.includes("live_class") || text.includes("lecture") || text.includes("class") || text.includes("stream")) {
      return "/teacher/lectures";
    }
    if (text.includes("calendar") || text.includes("timetable") || text.includes("schedule")) {
      return (normRole === "institute_admin" || normRole === "admin") ? "/admin/calendar" : "/teacher/calendar";
    }
    if (text.includes("doubt")) {
      return "/teacher/doubts";
    }
    if (text.includes("batch") || text.includes("announcement")) {
      return (normRole === "institute_admin" || normRole === "admin") ? "/admin/batches" : "/teacher/batches";
    }
    if (text.includes("mock_test") || text.includes("quiz") || text.includes("test") || text.includes("exam")) {
      return (normRole === "institute_admin" || normRole === "admin") ? "/admin/mock-tests" : "/teacher/quizzes";
    }
    if (text.includes("course_view") || text.includes("content") || text.includes("course") || text.includes("library")) {
      return (normRole === "institute_admin" || normRole === "admin") ? "/admin/content" : "/teacher/content";
    }
  }

  if (normRole === "student") {
    if (text.includes("live_class") || text.includes("lecture") || text.includes("class") || text.includes("stream")) {
      return "/student/live-classes";
    }
    if (text.includes("calendar") || text.includes("timetable") || text.includes("schedule")) {
      return "/student/calendar";
    }
    if (text.includes("doubt")) {
      return "/student/doubts";
    }
    if (text.includes("battle") || text.includes("challenge") || text.includes("arena")) {
      return "/student/battle";
    }
    if (text.includes("mock_test") || text.includes("quiz") || text.includes("test") || text.includes("exam")) {
      return "/student/tests";
    }
    if (text.includes("plan") || text.includes("study plan")) {
      return "/student/study-plan";
    }
    if (text.includes("rank") || text.includes("xp") || text.includes("streak") || text.includes("leaderboard")) {
      return "/student/leaderboard";
    }
    if (text.includes("batch") || text.includes("announcement")) {
      return "/student";
    }
  }

  return null;
}



