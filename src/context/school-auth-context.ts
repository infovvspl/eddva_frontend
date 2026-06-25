import { createContext } from 'react';

export interface SchoolInstitute {
  id: string;
  name: string;
  email?: string;
  logo?: string | null;
  tenantDomain?: string | null;
  status?: string;
  aiEnabled?: boolean;
  aiFeatures?: Record<string, boolean>;
  modulesPermissions?: Record<string, boolean>;
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
  profileImage?: string | null;
  phone?: string | null;
  isActive?: boolean;
  studentProfile?: SchoolStudentProfile | null;
}

export interface SchoolAuthContextType {
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

/** Singleton context — keep in this file so Vite HMR does not duplicate it. */
export const SchoolAuthContext = createContext<SchoolAuthContextType | undefined>(undefined);
