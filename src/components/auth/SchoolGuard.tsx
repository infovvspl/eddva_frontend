import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/SchoolAuthContext";

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

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={SCHOOL_ROLE_PATHS[user.role] ?? "/login"} replace />;
  }

  return <>{children}</>;
}
