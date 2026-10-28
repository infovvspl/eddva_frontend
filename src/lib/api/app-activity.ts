/**
 * App-wide, per-category activity API (`/school/activity/*`) — the sibling of
 * learning-path.ts's heartbeat/engagement calls, covering every page outside
 * the AI Study Plan (games, study materials, assignments, doubts, career,
 * video, battle arena, the AI tutor panel, plain navigation). Kept as its own
 * file rather than extending learning-path.ts so the AI Study Plan's tracking
 * code and types are never touched by this feature.
 */
import schoolApi, { unwrapSchoolData } from "@/lib/api/school-client";
import { getApiBaseUrl } from "@/lib/api-config";
import { tokenStorage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";

export const APP_ACTIVITY_CATEGORIES = [
  "games",
  "study_materials",
  "assignments",
  "assessments_other",
  "doubts",
  "career",
  "video_lectures",
  "battle_arena",
  "chat_ai",
  "nav",
] as const;
export type AppActivityCategory = (typeof APP_ACTIVITY_CATEGORIES)[number];

export interface AppActivityHeartbeatBody {
  category: AppActivityCategory;
  refId?: string;
  beats: number[];
}

export interface MyAppActivityBreakdown {
  byCategory: Array<{ category: AppActivityCategory; seconds: number; visits: number }>;
}

const data = <T,>(res: { data?: unknown }) => unwrapSchoolData<T>(res, undefined as unknown as T);

function deviceKind(): "web" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "web";
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "web";
}

export const appActivityApi = {
  heartbeat: (body: AppActivityHeartbeatBody) => schoolApi.post("/activity/heartbeat", { ...body, device: deviceKind() }),
  myBreakdown: async () => data<MyAppActivityBreakdown>(await schoolApi.get("/activity/me")),
};

/**
 * The last heartbeat when the page is hidden or closed. `fetch` with
 * keepalive survives the unload and, unlike sendBeacon, can carry the auth
 * header this endpoint requires — same mechanism as learning-path.ts's
 * sendFinalHeartbeat and use-screen-time-tracking.ts's own final beat.
 */
export function sendFinalAppHeartbeat(body: AppActivityHeartbeatBody) {
  const token = tokenStorage.getAccess();
  if (!token) return;
  const { user, tenantType } = useAuthStore.getState() as any;
  const instituteId = user?.instituteId || (tenantType === "school" ? user?.tenantId : null);
  try {
    void fetch(`${getApiBaseUrl()}/school/activity/heartbeat`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(instituteId ? { "X-Institute-Id": instituteId } : {}),
      },
      body: JSON.stringify({ ...body, device: deviceKind() }),
    });
  } catch {
    /* best effort: at most one heartbeat (≤ 15 s) is lost */
  }
}
