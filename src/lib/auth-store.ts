import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "./types";

export type AiFeatureKey =
  | 'ai_study_assistant'
  | 'ai_study_plan'
  | 'ai_battle_arena'
  | 'ai_analytics'
  | 'ai_doubt_resolution'
  | 'ai_content_generation'
  | 'ai_speech_to_text';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  tenantType: 'coaching' | 'school' | null;
  aiEnabled: boolean;
  aiFeatures: AiFeatureKey[];
  setUser: (user: User) => void;
  clearAuth: () => void;
  setTenantType: (type: 'coaching' | 'school' | null) => void;
  setAiFeatures: (aiEnabled: boolean, aiFeatures: AiFeatureKey[]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      tenantType: null,
      aiEnabled: false,
      aiFeatures: [],
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false, tenantType: null, aiEnabled: false, aiFeatures: [] }),
      setTenantType: (type) => set({ tenantType: type }),
      setAiFeatures: (aiEnabled, aiFeatures) => set({ aiEnabled, aiFeatures }),
    }),
    {
      name: "eddva_auth",
    },
  ),
);

export const roleRedirectPath: Record<UserRole, string> = {
  super_admin: "/super-admin",
  institute_admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

/** Update only the studentProfile.diagnosticCompleted flag without a full re-login */
export function patchDiagnosticCompleted(store: ReturnType<typeof useAuthStore.getState>) {
  const user = store.user;
  if (!user) return;
  useAuthStore.setState({
    user: {
      ...user,
      studentProfile: user.studentProfile
        ? { ...user.studentProfile, diagnosticCompleted: true }
        : null,
    },
  });
}

/** After battle / any server-side XP grant — keep header & persisted auth in sync until /me refetches */
export function patchStudentXpDelta(delta: number) {
  if (!delta || delta <= 0) return;
  const user = useAuthStore.getState().user;
  if (!user?.studentProfile) return;
  useAuthStore.setState({
    user: {
      ...user,
      studentProfile: {
        ...user.studentProfile,
        xpPoints: (user.studentProfile.xpPoints ?? 0) + delta,
      },
    },
  });
}
