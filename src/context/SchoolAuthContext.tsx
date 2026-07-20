import React, { useContext, useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, tokenStorage } from "@/lib/api/client";
import * as authApi from "@/lib/api/auth";
import type { UserRole } from "@/lib/types";
import {
  SchoolAuthContext,
  type SchoolAuthContextType,
  type SchoolInstitute,
  type SchoolUser,
} from "./school-auth-context";
import { getSubdomain, getSubdomainFromHost } from "@/lib/tenant";

export type {
  SchoolInstitute,
  SchoolStudentProfile,
  SchoolUser,
} from "./school-auth-context";

function zustandRoleToSchool(role: UserRole | string): SchoolUser["role"] {
  if (!role) return "STUDENT";
  const r = role.toLowerCase();
  if (r.includes("super_admin")) return "SUPER_ADMIN";
  if (r.includes("teacher")) return "TEACHER";
  if (r.includes("institute_admin") || r.includes("admin"))
    return "INSTITUTE_ADMIN";
  if (r.includes("parent")) return "PARENT";
  return "STUDENT";
}

function schoolRoleToZustand(role: string): UserRole {
  const r = role.toLowerCase();
  if (r.includes("super_admin")) return "super_admin";
  if (r.includes("teacher")) return "teacher";
  if (r.includes("institute_admin") || r.includes("admin"))
    return "institute_admin";
  if (r.includes("parent")) return "parent";
  return "student";
}

const noopAsync = async () => undefined;

const loggedOutAuth: SchoolAuthContextType = {
  user: null,
  institute: null,
  loading: false,
  login: noopAsync,
  register: noopAsync,
  setAuthSession: () => {},
  logout: () => {
    useAuthStore.getState().clearAuth();
    tokenStorage.clear();
    window.location.replace("/login");
  },
  isAuthenticated: false,
};

function buildSchoolUserFromStore(
  storeUser: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>,
  institute: SchoolInstitute | null,
): SchoolUser {
  return {
    id: storeUser.id,
    name: storeUser.name,
    email: storeUser.email ?? "",
    role: zustandRoleToSchool(storeUser.role),
    rawRole: storeUser.rawRole ?? storeUser.role,
    instituteId: storeUser.instituteId ?? storeUser.tenantId ?? null,
    profileImage: storeUser.profileImage ?? null,
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
  };
}

export const SchoolAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    user: storeUser,
    tenantType,
    setUser: setStoreUser,
    setTenantType,
    clearAuth,
  } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [institute, setInstitute] = useState<SchoolInstitute | null>(null);

  const hasToken = !!tokenStorage.getAccess();

  const schoolUser = React.useMemo<SchoolUser | null>(() => {
    return hasToken &&
      storeUser &&
      (tenantType === "school" || storeUser.role === "super_admin")
      ? buildSchoolUserFromStore(storeUser, institute)
      : null;
  }, [hasToken, storeUser, tenantType, institute]);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    const hydrate = async () => {
      if (!token) {
        if (tenantType === "school") clearAuth();
        setLoading(false);
        return;
      }

      if (token && storeUser && tenantType === "school" && storeUser.tenantId) {
        const subdomain = getSubdomainFromHost() || getSubdomain();
        if (subdomain) {
          apiClient
            .get(`/school/institutes/tenant/${subdomain}`)
            .then((res) => {
              const inst = res.data?.data ?? res.data;
              if (inst) {
                setInstitute({
                  id: inst.id,
                  name: inst.name,
                  logo: inst.logo ?? inst.logo_url ?? null,
                  state: inst.state ?? null,
                  city: inst.city ?? null,
                  location: inst.location ?? null,
                  tenantDomain: inst.tenantDomain ?? inst.tenant_domain ?? null,
                  aiEnabled: inst.aiEnabled ?? inst.ai_enabled ?? false,
                  aiFeatures:
                    typeof (inst.aiFeatures ?? inst.ai_features) === "string"
                      ? JSON.parse(inst.aiFeatures ?? inst.ai_features)
                      : (inst.aiFeatures ?? inst.ai_features ?? {}),
                  modulesPermissions:
                    typeof (
                      inst.modulesPermissions ?? inst.modules_permissions
                    ) === "string"
                      ? JSON.parse(
                          inst.modulesPermissions ?? inst.modules_permissions,
                        )
                      : (inst.modulesPermissions ??
                        inst.modules_permissions ??
                        {}),
                });
              }
            })
            .catch((err) => {
              console.error("Failed to load tenant info on hydrate:", err);
              setInstitute({
                id: storeUser.tenantId!,
                name: storeUser.tenantName ?? "",
              });
            });
        } else {
          apiClient
            .get(`/school/institutes/${storeUser.tenantId}`)
            .then((res) => {
              const inst = res.data?.data ?? res.data;
              if (inst) {
                setInstitute({
                  id: inst.id,
                  name: inst.name,
                  logo: inst.logo ?? inst.logo_url ?? null,
                  state: inst.state ?? null,
                  city: inst.city ?? null,
                  location: inst.location ?? null,
                  tenantDomain: inst.tenantDomain ?? inst.tenant_domain ?? null,
                  aiEnabled: inst.aiEnabled ?? inst.ai_enabled ?? false,
                  aiFeatures:
                    typeof (inst.aiFeatures ?? inst.ai_features) === "string"
                      ? JSON.parse(inst.aiFeatures ?? inst.ai_features)
                      : (inst.aiFeatures ?? inst.ai_features ?? {}),
                  modulesPermissions:
                    typeof (
                      inst.modulesPermissions ?? inst.modules_permissions
                    ) === "string"
                      ? JSON.parse(
                          inst.modulesPermissions ?? inst.modules_permissions,
                        )
                      : (inst.modulesPermissions ??
                        inst.modules_permissions ??
                        {}),
                });
              }
            })
            .catch((err) => {
              console.error(
                "Failed to load tenant info by ID on hydrate:",
                err,
              );
              setInstitute({
                id: storeUser.tenantId!,
                name: storeUser.tenantName ?? "",
              });
            });
        }
      }

      if (token && storeUser && tenantType === "school") {
        try {
          const res = await apiClient.get("/school/auth/me");
          const me = res.data?.data ?? res.data;

          if (me?.institute?.tenantDomain) {
            apiClient
              .get(`/school/institutes/tenant/${me.institute.tenantDomain}`)
              .then((tenantRes) => {
                const inst = tenantRes.data?.data ?? tenantRes.data;
                if (inst) {
                  setInstitute({
                    id: inst.id,
                    name: inst.name,
                    logo: inst.logo ?? inst.logo_url ?? null,
                    state: inst.state ?? null,
                    city: inst.city ?? null,
                    location: inst.location ?? null,
                    tenantDomain:
                      inst.tenantDomain ?? inst.tenant_domain ?? null,
                    aiEnabled: inst.aiEnabled ?? inst.ai_enabled ?? false,
                    aiFeatures:
                      typeof (inst.aiFeatures ?? inst.ai_features) === "string"
                        ? JSON.parse(inst.aiFeatures ?? inst.ai_features)
                        : (inst.aiFeatures ?? inst.ai_features ?? {}),
                    modulesPermissions:
                      typeof (
                        inst.modulesPermissions ?? inst.modules_permissions
                      ) === "string"
                        ? JSON.parse(
                            inst.modulesPermissions ?? inst.modules_permissions,
                          )
                        : (inst.modulesPermissions ??
                          inst.modules_permissions ??
                          {}),
                  });
                }
              })
              .catch((err) => {
                console.error(
                  "Failed to load full tenant info from resolved domain:",
                  err,
                );
              });
          }

          const sp = me?.studentProfile;
          setStoreUser({
            ...storeUser,
            name: me.name ?? storeUser.name,
            phone: me.phone ?? storeUser.phone,
            rawRole: me.role ?? storeUser.rawRole ?? storeUser.role,
            profileImage:
              "profileImage" in me
                ? me.profileImage
                : "profilePictureUrl" in me
                  ? me.profilePictureUrl
                  : storeUser.profileImage,
          });
          if (sp) {
            setStoreUser({
              ...storeUser,
              name: me.name ?? storeUser.name,
              phone: me.phone ?? storeUser.phone,
              rawRole: me.role ?? storeUser.rawRole ?? storeUser.role,
              profileImage:
                "profileImage" in me
                  ? me.profileImage
                  : "profilePictureUrl" in me
                    ? me.profilePictureUrl
                    : storeUser.profileImage,
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
                  (sp.className && sp.sectionName
                    ? `${sp.className} · ${sp.sectionName}`
                    : sp.className),
                examTarget: storeUser.studentProfile?.examTarget ?? "",
                diagnosticCompleted:
                  storeUser.studentProfile?.diagnosticCompleted ?? true,
              },
            });
          }
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response
            ?.status;
          if (status === 401) {
            clearAuth();
            tokenStorage.clear();
          }
        }
      }
      setLoading(false);
    };
    void hydrate();
  }, []);

  const login = async (identifier: string, password: string) => {
    const isEmail = identifier.includes("@");
    const rawPhone = identifier.trim().replace(/[^\d+]/g, "");
    const formattedPhone = rawPhone.startsWith("+")
      ? rawPhone
      : `+91${rawPhone}`;

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
      phone: u.phone ?? "",
      email: u.email,
      role: u.role.toLowerCase() as UserRole,
      rawRole: u.role,
      profileImage: u.profileImage ?? undefined,
      instituteId: u.instituteId ?? undefined,
      tenantId: u.instituteId ?? undefined,
      tenantName: inst?.name ?? undefined,
      isFirstLogin: false,
      onboardingRequired: false,
      teacherProfile: null,
      studentProfile: sp
        ? {
            id: sp.id ?? u.id,
            examTarget: "",
            currentClass:
              sp.currentClass ??
              (sp.className && sp.sectionName
                ? `${sp.className} · ${sp.sectionName}`
                : (sp.className ?? "")),
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
    setTenantType("school");

    if (inst) {
      setInstitute({
        id: inst.id,
        name: inst.name,
        logo: inst.logo ?? inst.logo_url ?? null,
        state: inst.state ?? null,
        city: inst.city ?? null,
        location: inst.location ?? null,
        tenantDomain: inst.tenantDomain ?? inst.tenant_domain ?? null,
        aiEnabled: inst.aiEnabled ?? inst.ai_enabled ?? false,
        aiFeatures:
          typeof (inst.aiFeatures ?? inst.ai_features) === "string"
            ? JSON.parse(inst.aiFeatures ?? inst.ai_features)
            : (inst.aiFeatures ?? inst.ai_features ?? {}),
        modulesPermissions:
          typeof (inst.modulesPermissions ?? inst.modules_permissions) ===
          "string"
            ? JSON.parse(inst.modulesPermissions ?? inst.modules_permissions)
            : (inst.modulesPermissions ?? inst.modules_permissions ?? {}),
      });
    }

    return res;
  };

  const register = async (data: unknown) => {
    const res = await apiClient.post("/school/auth/register", data);
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
      phone: userData.phone ?? "",
      email: userData.email,
      role: schoolRoleToZustand(userData.role),
      rawRole: userData.rawRole ?? userData.role,
      profileImage: userData.profileImage ?? undefined,
      instituteId: userData.instituteId ?? undefined,
      tenantId: userData.instituteId ?? undefined,
      tenantName: instData?.name ?? undefined,
      isFirstLogin: false,
      onboardingRequired: false,
      teacherProfile: null,
      studentProfile: userData.studentProfile
        ? {
            id: userData.studentProfile.id ?? userData.id,
            examTarget: "",
            currentClass: userData.studentProfile.currentClass ?? "",
            sectionId: userData.studentProfile.sectionId,
            sectionName: userData.studentProfile.sectionName,
            classId: userData.studentProfile.classId,
            className: userData.studentProfile.className,
            enrollmentNo: userData.studentProfile.enrollmentNo,
            rollNo: userData.studentProfile.rollNo,
            subjects: userData.studentProfile.subjects,
            diagnosticCompleted: true,
          }
        : null,
    });
    setTenantType("school");
    if (instData) setInstitute(instData);
  };

  const logout = () => {
    clearAuth();
    tokenStorage.clear();
    window.location.replace("/login");
  };

  const value = React.useMemo<SchoolAuthContextType>(
    () => ({
      user: schoolUser,
      institute,
      loading,
      login,
      register,
      setAuthSession,
      logout,
      isAuthenticated: !!schoolUser && !!tokenStorage.getAccess(),
    }),
    [schoolUser, institute, loading],
  );

  return (
    <SchoolAuthContext.Provider value={value}>
      {children}
    </SchoolAuthContext.Provider>
  );
};

/** School-only auth hook — never throws (avoids white screen on 401 / HMR). */
export const useAuth = (): SchoolAuthContextType => {
  const ctx = useContext(SchoolAuthContext);
  const storeUser = useAuthStore((s) => s.user);
  const tenantType = useAuthStore((s) => s.tenantType);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  if (ctx) return ctx;

  const token = tokenStorage.getAccess();
  if (token && storeUser && tenantType === "school") {
    const instId = storeUser.instituteId ?? storeUser.tenantId;
    const institute: SchoolInstitute | null = instId
      ? { id: instId, name: storeUser.tenantName ?? "" }
      : null;
    return {
      user: buildSchoolUserFromStore(storeUser, institute),
      institute,
      loading: false,
      login: noopAsync,
      register: noopAsync,
      setAuthSession: () => {},
      logout: () => {
        clearAuth();
        tokenStorage.clear();
        window.location.replace("/login");
      },
      isAuthenticated: true,
    };
  }

  return loggedOutAuth;
};

export const useSchoolAuth = useAuth;
