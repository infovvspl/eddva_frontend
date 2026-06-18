import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { tokenStorage } from "@/lib/api/client";
import { useMe } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated, tenantType } = useAuthStore();
  const hasToken = !!tokenStorage.getAccess();

  // Always fetch /me when a token exists — ensures fresh diagnosticCompleted flag
  // after test submission, page refresh, or session restore.
  const { isLoading } = useMe(hasToken);

  // No token at all → go to login
  if (!hasToken && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Still loading user profile
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tenantType === "school" && !location.pathname.startsWith("/school")) {
    const schoolRedirects: Record<string, string> = {
      "/super-admin/teachers": "/school/admin/teachers",
      "/super-admin/students": "/school/admin/students",
      "/super-admin/parents": "/school/admin/users?role=PARENT",
      "/super-admin/announcements": "/school/admin/notices",
      "/student": "/school/student",
      "/student/profile": "/school/student/profile",
      "/student/settings": "/school/student/settings",
      "/student/notifications": "/school/student/announcements",
      "/teacher": "/school/teacher",
      "/teacher/profile": "/school/teacher/profile",
      "/teacher/settings": "/school/teacher/settings",
      "/admin": "/school/admin",
      "/admin/students": "/school/admin/students",
      "/admin/settings": "/school/admin/settings",
    };
    const fallbackByRole: Partial<Record<UserRole, string>> = {
      super_admin: "/school/admin",
      institute_admin: "/school/admin",
      teacher: "/school/teacher",
      student: "/school/student",
      parent: "/school/parent",
    };
    return (
      <Navigate
        to={schoolRedirects[location.pathname] ?? fallbackByRole[user?.role ?? "student"] ?? "/school/student"}
        replace
      />
    );
  }

  // Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
