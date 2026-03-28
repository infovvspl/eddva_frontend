import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  sendHeartbeat,
  getAdminPresenceStats,
  getTeacherPresenceStats,
  type AdminPresenceStats,
  type TeacherPresenceStats,
} from "@/lib/api/presence";
import { useAuthStore } from "@/lib/auth-store";

const HEARTBEAT_INTERVAL = 30_000; // 30 s
const REFETCH_INTERVAL   = 30_000; // poll every 30 s

export function usePresenceHeartbeat() {
  const { user } = useAuthStore();
  useEffect(() => {
    if (!user) return;
    const beat = () => sendHeartbeat().catch(() => {});
    beat();
    const id = setInterval(beat, HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
  }, [user]);
}

export function useAdminPresenceStats() {
  return useQuery<AdminPresenceStats>({
    queryKey: ["presence", "admin"],
    queryFn: getAdminPresenceStats,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25_000,
    retry: false,
  });
}

export function useTeacherPresenceStats() {
  return useQuery<TeacherPresenceStats>({
    queryKey: ["presence", "teacher"],
    queryFn: getTeacherPresenceStats,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 25_000,
    retry: false,
  });
}
