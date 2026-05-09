import { apiClient, extractData } from "./client";

export interface XpAwardResponse {
  xpEarned: number;
  totalXp?: number;
  totalLeaderboardXp?: number;
  totalMockXp?: number;
  isMockXp?: boolean;
}

export interface XpTransaction {
  id: string;
  xpEarned: number;
  sourceType: string;
  sourceRefId?: string | null;
  isMockXp: boolean;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

export interface XpHistoryResponse {
  data: XpTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeaderboardMe {
  cycleXp: number;
  rank: number | null;
  zone: "promotion" | "safety" | "demotion" | null;
  daysUntilReset: number;
  level: number;
  isUnlocked: boolean;
}

export interface LeaderboardGroupMember {
  studentId: string;
  fullName: string;
  avatarUrl?: string | null;
  xpEarned: number;
  rank: number;
  zone: "promotion" | "safety" | "demotion" | null;
  isCurrentStudent?: boolean;
}

export interface MockRank {
  mockXpTotal: number;
  rank: number | null;
  percentile: number | null;
  accuracy?: number | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function asNestedRecord(value: unknown, key: string): Record<string, unknown> {
  return asRecord(asRecord(value)[key]);
}

function numberFrom(record: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return fallback;
}

function stringFrom(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return fallback;
}

function boolFrom(record: Record<string, unknown>, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function nullableNumberFrom(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (value === null) return null;
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function zoneFrom(record: Record<string, unknown>): "promotion" | "safety" | "demotion" | null {
  const value = stringFrom(record, ["zone"]);
  return value === "promotion" || value === "safety" || value === "demotion" ? value : null;
}

function normalizeAward(raw: unknown): XpAwardResponse {
  const r = asRecord(raw);
  return {
    xpEarned: numberFrom(r, ["xpEarned", "xp_earned"]),
    totalXp: nullableNumberFrom(r, ["totalXp", "total_xp"]) ?? undefined,
    totalLeaderboardXp: nullableNumberFrom(r, ["totalLeaderboardXp", "total_leaderboard_xp"]) ?? undefined,
    totalMockXp: nullableNumberFrom(r, ["totalMockXp", "total_mock_xp"]) ?? undefined,
    isMockXp: boolFrom(r, ["isMockXp", "is_mock_xp"]),
  };
}

export const xpApi = {
  async videoHeartbeat(sessionId: string, secondsWatched: number): Promise<XpAwardResponse> {
    const res = await apiClient.post("/xp/video/heartbeat", { sessionId, lectureId: sessionId, secondsWatched });
    return normalizeAward(extractData<unknown>(res));
  },

  async submitDpp(dppId: string, correctCount: number, attemptNumber: number): Promise<XpAwardResponse> {
    const res = await apiClient.post("/xp/dpp/submit", { dppId, correctCount, attemptNumber });
    return normalizeAward(extractData<unknown>(res));
  },

  async submitTest(
    testId: string,
    correctCount: number,
    attemptNumber: number,
    isFullyCompleted: boolean,
  ): Promise<XpAwardResponse> {
    const res = await apiClient.post("/xp/test/submit", {
      testId,
      correctCount,
      attemptNumber,
      isFullyCompleted,
    });
    return normalizeAward(extractData<unknown>(res));
  },

  async getHistory(page = 1, limit = 20, source?: string): Promise<XpHistoryResponse> {
    const res = await apiClient.get("/xp/history", { params: { page, limit, source } });
    return extractData<XpHistoryResponse>(res);
  },
};

function normalizeMe(raw: unknown): LeaderboardMe {
  const r = asRecord(raw);
  return {
    cycleXp: numberFrom(r, ["cycleXp", "cycle_xp", "leaderboardXpCycle"]),
    rank: nullableNumberFrom(r, ["rank"]),
    zone: zoneFrom(r),
    daysUntilReset: numberFrom(r, ["daysUntilReset", "days_until_reset"]),
    level: numberFrom(r, ["level", "currentLevel", "current_level"], 1),
    isUnlocked: boolFrom(r, ["isUnlocked", "is_unlocked"]),
  };
}

function normalizeMember(raw: unknown): LeaderboardGroupMember {
  const r = asRecord(raw);
  const student = asNestedRecord(raw, "student");
  return {
    studentId: stringFrom(r, ["studentId", "student_id"], stringFrom(student, ["id"])),
    fullName: stringFrom(r, ["fullName", "full_name", "name"], stringFrom(student, ["fullName"], "Student")),
    avatarUrl: stringFrom(r, ["avatarUrl", "avatar_url"], stringFrom(student, ["profilePictureUrl"])) || null,
    xpEarned: numberFrom(r, ["xpEarned", "xp_earned", "cycleXp"]),
    rank: numberFrom(r, ["rank"]),
    zone: zoneFrom(r),
    isCurrentStudent: boolFrom(r, ["isCurrentStudent", "is_current_student"]),
  };
}

function normalizeMockRank(raw: unknown): MockRank {
  const r = asRecord(raw);
  return {
    mockXpTotal: numberFrom(r, ["mockXpTotal", "mock_xp_total", "mockXp"]),
    rank: nullableNumberFrom(r, ["rank"]),
    percentile: nullableNumberFrom(r, ["percentile"]),
    accuracy: nullableNumberFrom(r, ["accuracy"]),
  };
}

export const leaderboardApi = {
  async getMe(): Promise<LeaderboardMe> {
    const res = await apiClient.get("/leaderboard/me");
    return normalizeMe(extractData<unknown>(res));
  },

  async getGroup(): Promise<LeaderboardGroupMember[]> {
    const res = await apiClient.get("/leaderboard/group");
    const raw = extractData<unknown>(res);
    const data = asRecord(raw).data;
    const list = Array.isArray(raw) ? raw : data;
    return (Array.isArray(list) ? list : []).map(normalizeMember);
  },

  async getMockRank(examType: "jee" | "neet"): Promise<MockRank> {
    const res = await apiClient.get(`/leaderboard/mock/${examType}`);
    return normalizeMockRank(extractData<unknown>(res));
  },
};
