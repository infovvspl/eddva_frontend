import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "./types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "apexiq_auth",
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
