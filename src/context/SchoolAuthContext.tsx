import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient, tokenStorage } from '@/lib/api/client';
import * as authApi from '@/lib/api/auth';
import type { UserRole } from '@/lib/types';

// ── Types matching the school frontend's AuthContext shape ──────────────────

export interface SchoolInstitute {
  id: string;
  name: string;
  email?: string;
  logo?: string | null;
  tenantDomain?: string | null;
  status?: string;
}

export interface SchoolStudentProfile {
  id?: string;
  sectionId?: string;
  sectionName?: string;
  classId?: string;
  className?: string;
  enrollmentNo?: string;
  rollNo?: string;
  currentClass?: string;
  subjects?: string[];
}

export interface SchoolUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'INSTITUTE_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  instituteId?: string | null;
  institute?: SchoolInstitute | null;
  photo?: string | null;
  phone?: string | null;
  isActive?: boolean;
  studentProfile?: SchoolStudentProfile | null;
}

interface SchoolAuthContextType {
  user: SchoolUser | null;
  institute: SchoolInstitute | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<unknown>;
  register: (data: unknown) => Promise<unknown>;
  setAuthSession: (data: {
    token: string;
    user: SchoolUser;
    institute?: SchoolInstitute | null;
    tenantDomain?: string | null;
  }) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// ── Role normalization ──────────────────────────────────────────────────────

function zustandRoleToSchool(role: UserRole | string): SchoolUser['role'] {
  if (!role) return 'STUDENT';
  const r = role.toLowerCase();
  const map: Record<string, SchoolUser['role']> = {
    super_admin: 'SUPER_ADMIN',
    institute_admin: 'INSTITUTE_ADMIN',
    admin: 'INSTITUTE_ADMIN',
    teacher: 'TEACHER',
    student: 'STUDENT',
    parent: 'PARENT',
  };
  return map[r] ?? 'STUDENT';
}

function schoolRoleToZustand(role: string): UserRole {
  const r = role.toLowerCase();
  if (r === 'institute_admin' || r === 'admin') return 'institute_admin';
  if (r === 'super_admin') return 'super_admin';
  if (r === 'teacher') return 'teacher';
  if (r === 'parent') return 'parent';
  return 'student';
}

// ── Context ─────────────────────────────────────────────────────────────────

const SchoolAuthContext = createContext<SchoolAuthContextType | undefined>(undefined);

export const SchoolAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user: storeUser,
    tenantType,
    setUser: setStoreUser,
    setTenantType,
    clearAuth,
  } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [institute, setInstitute] = useState<SchoolInstitute | null>(null);

  // Derive the school-shaped user from Zustand
  const schoolUser: SchoolUser | null =
    storeUser && (tenantType === 'school' || storeUser.role === 'super_admin')
      ? {
        id: storeUser.id,
        name: storeUser.name,
        email: storeUser.email ?? '',
        role: zustandRoleToSchool(storeUser.role),
        instituteId: storeUser.tenantId ?? null,
        photo: storeUser.avatar ?? null,
        phone: storeUser.phone ?? null,
        isActive: true,
        institute,
        studentProfile: storeUser.studentProfile
          ? {
              id: storeUser.studentProfile.id,
              sectionId: storeUser.studentProfile.sectionId,
              sectionName: storeUser.studentProfile.sectionName,
              classId: storeUser.studentProfile.classId,
              className: storeUser.studentProfile.className,
              enrollmentNo: storeUser.studentProfile.enrollmentNo,
              rollNo: storeUser.studentProfile.rollNo,
              currentClass: storeUser.studentProfile.currentClass,
              subjects: storeUser.studentProfile.subjects,
            }
          : null,
      }
      : null;

  useEffect(() => {
    const token = tokenStorage.getAccess();
    const hydrate = async () => {
      if (token && storeUser && tenantType === 'school' && storeUser.tenantId) {
        setInstitute({
          id: storeUser.tenantId,
          name: storeUser.tenantName ?? '',
        });
      }
      if (token && storeUser && tenantType === 'school' && storeUser.role === 'student') {
        try {
          const res = await apiClient.get('/school/auth/me');
          const me = res.data?.data ?? res.data;
          const sp = me?.studentProfile;
          if (sp) {
            setStoreUser({
              ...storeUser,
              studentProfile: {
                id: sp.id,
                sectionId: sp.sectionId,
                sectionName: sp.sectionName,
                classId: sp.classId,
                className: sp.className,
                enrollmentNo: sp.enrollmentNo,
                rollNo: sp.rollNo,
                subjects: sp.subjects ?? storeUser.studentProfile?.subjects,
                currentClass:
                  sp.currentClass ??
                  (sp.className && sp.sectionName ? `${sp.className} · ${sp.sectionName}` : sp.className),
                examTarget: storeUser.studentProfile?.examTarget ?? '',
                diagnosticCompleted: storeUser.studentProfile?.diagnosticCompleted ?? true,
              },
            });
          }
        } catch {
          /* keep existing session */
        }
      }
      setLoading(false);
    };
    hydrate();
  }, []);

  const login = async (identifier: string, password: string) => {
    const isEmail = identifier.includes('@');
    const rawPhone = identifier.trim().replace(/[^\d+]/g, '');
    const formattedPhone = rawPhone.startsWith('+') ? rawPhone : `+91${rawPhone}`;

    const schoolPayload = isEmail
      ? { email: identifier.trim(), password }
      : { phone: formattedPhone, password };

    const res = await authApi.loginSchoolWithPassword(schoolPayload);
    const u = res.user;
    const inst = res.institute;

    const sp = u.studentProfile;
    setStoreUser({
      id: u.id,
      name: u.name,
      phone: u.phone ?? '',
      email: u.email,
      role: (u.role.toLowerCase()) as UserRole,
      avatar: u.photo ?? undefined,
      tenantId: u.instituteId ?? undefined,
      tenantName: inst?.name ?? undefined,
      isFirstLogin: false,
      onboardingRequired: false,
      teacherProfile: null,
      studentProfile: sp
        ? {
            id: sp.id ?? u.id,
            examTarget: '',
            currentClass:
              sp.currentClass ??
              (sp.className && sp.sectionName ? `${sp.className} · ${sp.sectionName}` : sp.className ?? ''),
            sectionId: sp.sectionId,
            sectionName: sp.sectionName,
            classId: sp.classId,
            className: sp.className,
            enrollmentNo: sp.enrollmentNo,
            rollNo: sp.rollNo,
            subjects: sp.subjects,
            diagnosticCompleted: true,
          }
        : null,
    });
    setTenantType('school');

    if (inst) {
      setInstitute({
        id: inst.id,
        name: inst.name,
        logo: inst.logo ?? null,
        tenantDomain: inst.tenantDomain ?? null,
      });
    }

    return res;
  };

  const register = async (data: unknown) => {
    const res = await apiClient.post('/school/auth/register', data);
    return res.data;
  };

  const setAuthSession = ({
    token,
    user: userData,
    institute: instData,
  }: {
    token: string;
    user: SchoolUser;
    institute?: SchoolInstitute | null;
    tenantDomain?: string | null;
  }) => {
    tokenStorage.setAccess(token);
    setStoreUser({
      id: userData.id,
      name: userData.name,
      phone: userData.phone ?? '',
      email: userData.email,
      role: schoolRoleToZustand(userData.role),
      avatar: userData.photo ?? undefined,
      tenantId: userData.instituteId ?? undefined,
      tenantName: instData?.name ?? undefined,
      isFirstLogin: false,
      onboardingRequired: false,
      teacherProfile: null,
      studentProfile: null,
    });
    setTenantType('school');
    if (instData) setInstitute(instData);
  };

  const logout = () => {
    clearAuth();
    tokenStorage.clear();
    window.location.replace('/login');
  };

  return (
    <SchoolAuthContext.Provider
      value={{
        user: schoolUser,
        institute,
        loading,
        login,
        register,
        setAuthSession,
        logout,
        isAuthenticated: !!schoolUser,
      }}
    >
      {children}
    </SchoolAuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(SchoolAuthContext);
  if (!ctx) throw new Error('useAuth must be used within a SchoolAuthProvider');
  return ctx;
};
