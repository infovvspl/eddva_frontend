import { create } from "zustand";
import type { User, UserRole } from "./types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

// Mock user for demo purposes
const mockUsers: Record<UserRole, User> = {
  super_admin: {
    id: "1",
    name: "Arjun Mehta",
    phone: "+919876543210",
    role: "super_admin",
    avatar: undefined,
  },
  institute_admin: {
    id: "2",
    name: "Priya Sharma",
    phone: "+919876543211",
    role: "institute_admin",
    tenantId: "t1",
    tenantName: "Elite IIT Academy",
  },
  teacher: {
    id: "3",
    name: "Dr. Rajesh Kumar",
    phone: "+919876543212",
    role: "teacher",
    tenantId: "t1",
    tenantName: "Elite IIT Academy",
  },
  student: {
    id: "4",
    name: "Rahul Verma",
    phone: "+919876543213",
    role: "student",
    tenantId: "t1",
    tenantName: "Elite IIT Academy",
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));

export const getMockUser = (role: UserRole) => mockUsers[role];

export const roleRedirectPath: Record<UserRole, string> = {
  super_admin: "/super-admin",
  institute_admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};
