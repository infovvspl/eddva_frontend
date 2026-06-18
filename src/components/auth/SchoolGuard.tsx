import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/SchoolAuthContext";
import { tokenStorage } from "@/lib/api/client";

interface SchoolGuardProps {
  children: React.ReactNode;
  roles?: string[];
}

const SCHOOL_ROLE_PATHS: Record<string, string> = {
  INSTITUTE_ADMIN: "/school/admin",
  TEACHER:         "/school/teacher",
  STUDENT:         "/school/student",
  PARENT:          "/school/parent",
};

export function SchoolGuard({ children, roles }: SchoolGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasToken = !!tokenStorage.getAccess();

  if (!hasToken || !isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || "").toUpperCase();

  if (roles && !roles.includes(role)) {
    return <Navigate to={SCHOOL_ROLE_PATHS[role] ?? "/login"} replace />;
  }

  return <>{children}</>;
}
