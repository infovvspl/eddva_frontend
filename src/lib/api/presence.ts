import { apiClient } from "./client";

export async function sendHeartbeat(): Promise<void> {
  await apiClient.post("/presence/heartbeat", {});
}

export interface AdminPresenceStats {
  studentsOnline: number;
  teachersOnline: number;
  liveClassesRunning: number;
}

export interface TeacherPresenceStats {
  studentsOnline: number;
}

export async function getAdminPresenceStats(): Promise<AdminPresenceStats> {
  const res = await apiClient.get("/presence/stats");
  return res.data?.data ?? res.data;
}

export async function getTeacherPresenceStats(): Promise<TeacherPresenceStats> {
  const res = await apiClient.get("/presence/stats/teacher");
  return res.data?.data ?? res.data;
}
