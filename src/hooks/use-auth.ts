import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { OtpSendPayload, OtpVerifyPayload, TeacherOnboardingPayload } from "@/lib/api/auth";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const authKeys = {
  me: ["auth", "me"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Send OTP mutation */
export function useSendOtp() {
  return useMutation({
    mutationFn: (payload: OtpSendPayload) => authApi.sendOtp(payload),
  });
}

/** Verify OTP mutation — sets user in store on success */
export function useVerifyOtp() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OtpVerifyPayload) => authApi.verifyOtp(payload),
    onSuccess: async () => {
      try {
        const meData = await authApi.getMe();
        const profile = meData.user;
        const studentRaw = (meData as any).student as {
          id?: string;
          batchId?: string;
          examTarget?: string;
          currentClass?: string;
          examYear?: number;
          diagnosticCompleted?: boolean;
          streakDays?: number;
          xpPoints?: number;
          currentEloTier?: string;
        } | undefined;

        const user = {
          id: profile.id,
          name: profile.fullName || profile.name || "",
          phone: profile.phoneNumber || profile.phone || "",
          email: profile.email,
          role: profile.role as "super_admin" | "institute_admin" | "teacher" | "student",
          avatar: profile.avatar,
          tenantId: profile.tenantId,
          tenantName: profile.tenant?.name || profile.tenantName || "",
          isFirstLogin: (profile as any).isFirstLogin ?? false,
          teacherProfile: meData.teacherProfile ?? null,
          studentProfile: studentRaw ? {
            id: studentRaw.id ?? "",
            batchId: studentRaw.batchId,
            examTarget: studentRaw.examTarget ?? "",
            currentClass: studentRaw.currentClass ?? "",
            examYear: studentRaw.examYear,
            diagnosticCompleted: studentRaw.diagnosticCompleted ?? false,
            streakDays: studentRaw.streakDays ?? 0,
            xpPoints: studentRaw.xpPoints ?? 0,
            currentEloTier: studentRaw.currentEloTier,
          } : null,
        };
        setUser(user);
        queryClient.setQueryData(authKeys.me, user);

        // Students who haven't completed diagnostic go there first
        if (user.role === "student" && user.studentProfile && !user.studentProfile.diagnosticCompleted) {
          navigate("/student/diagnostic");
          return;
        }

        const paths: Record<string, string> = {
          super_admin: "/super-admin",
          institute_admin: "/admin",
          teacher: "/teacher",
          student: "/student",
        };
        navigate(paths[user.role] || "/login");
      } catch {
        navigate("/super-admin");
      }
    },
  });
}

/** Fetch current user profile */
export function useMe(enabled = true) {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const meData = await authApi.getMe();
      const profile = meData.user;
      const studentRaw = (meData as any).student as {
        id?: string; batchId?: string; examTarget?: string; currentClass?: string;
        examYear?: number; diagnosticCompleted?: boolean; streakDays?: number;
        xpPoints?: number; currentEloTier?: string;
      } | undefined;

      const user = {
        id: profile.id,
        name: profile.fullName || profile.name || "",
        phone: profile.phoneNumber || profile.phone || "",
        email: profile.email,
        role: profile.role as "super_admin" | "institute_admin" | "teacher" | "student",
        avatar: profile.avatar,
        tenantId: profile.tenantId,
        tenantName: profile.tenant?.name || profile.tenantName || "",
        isFirstLogin: (profile as any).isFirstLogin ?? false,
        teacherProfile: meData.teacherProfile ?? null,
        studentProfile: studentRaw ? {
          id: studentRaw.id ?? "",
          batchId: studentRaw.batchId,
          examTarget: studentRaw.examTarget ?? "",
          currentClass: studentRaw.currentClass ?? "",
          examYear: studentRaw.examYear,
          // Never flip diagnosticCompleted from true→false: once completed locally
          // it stays completed even if the backend DB is stale (e.g. not restarted yet).
          diagnosticCompleted:
            (studentRaw.diagnosticCompleted ?? false) ||
            (useAuthStore.getState().user?.studentProfile?.diagnosticCompleted ?? false),
          streakDays: studentRaw.streakDays ?? 0,
          xpPoints: studentRaw.xpPoints ?? 0,
          currentEloTier: studentRaw.currentEloTier,
        } : null,
      };
      setUser(user);
      return user;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/** Complete teacher onboarding mutation */
export function useCompleteTeacherOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeacherOnboardingPayload) => authApi.completeTeacherOnboarding(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me }),
  });
}

/** Upload avatar mutation */
export function useUploadAvatar() {
  return useMutation({ mutationFn: (file: File) => authApi.uploadAvatar(file) });
}

/** Logout — clear everything */
export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    authApi.logout();
    clearAuth();
    queryClient.clear();
    navigate("/login");
  };
}
