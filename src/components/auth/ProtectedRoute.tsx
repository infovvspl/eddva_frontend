import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { tokenStorage } from "@/lib/api/client";
import { useMe } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  /** Set true on the /student/diagnostic route itself to prevent redirect loop */
  skipDiagnosticGuard?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, skipDiagnosticGuard }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
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

  // Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Diagnostic guard — student must complete diagnostic before accessing any student page
  if (
    !skipDiagnosticGuard &&
    user?.role === "student" &&
    user.studentProfile !== undefined &&   // studentProfile has been loaded
    user.studentProfile !== null &&
    !user.studentProfile.diagnosticCompleted &&
    !location.pathname.startsWith("/student/diagnostic")
  ) {
    return <Navigate to="/student/diagnostic" replace />;
  }

  return <>{children}</>;
}
