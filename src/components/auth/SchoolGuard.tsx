import { Loader2, ShieldX } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/SchoolAuthContext";
import { tokenStorage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";
import { AI_FEATURES } from "@/lib/constants/aiFeatures";

interface SchoolGuardProps {
  children: React.ReactNode;
  roles?: string[];
  feature?: { type: 'module' | 'ai'; key: string };
}

const SCHOOL_ROLE_PATHS: Record<string, string> = {
  SUPER_ADMIN:     "/school/super-admin",
  INSTITUTE_ADMIN: "/school/admin",
  TEACHER:         "/school/teacher",
  STUDENT:         "/school/student",
  PARENT:          "/school/parent",
};

function getSchoolRoles(user: { role?: string; rawRole?: string } | null | undefined) {
  const primaryRole = String(user?.role || "").toUpperCase();
  const rawRole = String(user?.rawRole || user?.role || "").toUpperCase();
  const rawRoles = rawRole
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const derivedRoles = [
    rawRole.includes("SUPER_ADMIN") || rawRole.includes("SUPER ADMIN") ? "SUPER_ADMIN" : "",
    rawRole.includes("TEACHER") ? "TEACHER" : "",
    !rawRole.includes("SUPER_ADMIN") && !rawRole.includes("SUPER ADMIN") &&
      (rawRole.includes("INSTITUTE_ADMIN") || rawRole.includes("INSTITUTE ADMIN") || /\bADMIN\b/.test(rawRole))
      ? "INSTITUTE_ADMIN"
      : "",
  ];
  return Array.from(new Set([primaryRole, ...rawRoles, ...derivedRoles].filter(Boolean)));
}

function WrongPortalMessage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <ShieldX className="h-8 w-8 text-amber-600" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">Wrong Portal</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          You are currently logged in to the <strong>coaching</strong> portal. This page is only accessible
          to school users. Please log in with school credentials.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={() => {
            // Clear current session and go to login so user can authenticate as school user
            window.location.replace('/login');
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Switch to School Login
        </button>
      </div>
    </div>
  );
}

export function SchoolGuard({ children, roles, feature }: SchoolGuardProps) {
  const { user, institute, loading, isAuthenticated } = useAuth();

  // Read coaching auth state to detect cross-portal access
  const isCoachingAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (loading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasToken = !!tokenStorage.getAccess();

  // A token exists but school auth failed AND the user is authenticated via coaching:
  // they are in the wrong portal — show a clear message instead of a redirect loop.
  if (hasToken && !isAuthenticated && isCoachingAuthenticated) {
    return <WrongPortalMessage />;
  }

  if (!hasToken || !isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || "").toUpperCase();
  const userRoles = getSchoolRoles(user);

  if (roles && !userRoles.some((userRole) => roles.includes(userRole))) {
    return <Navigate to={SCHOOL_ROLE_PATHS[role] ?? "/login"} replace />;
  }

  if (feature && institute) {
    if (role !== 'SUPER_ADMIN') {
      if (feature.type === 'module') {
        if (institute.modulesPermissions?.[feature.key] === false) {
          return <Navigate to={SCHOOL_ROLE_PATHS[role] ?? "/login"} replace />;
        }
      } else if (feature.type === 'ai') {
        const featConfig = AI_FEATURES.find(f => f.key === feature.key);
        const defaultOn = featConfig ? featConfig.defaultEnabled : true;
        const val = institute.aiFeatures?.[feature.key];
        const isEnabled = val === undefined ? defaultOn : val !== false;

        if (!institute.aiEnabled || !isEnabled) {
          return <Navigate to={SCHOOL_ROLE_PATHS[role] ?? "/login"} replace />;
        }
      }
    }
  }

  return <>{children}</>;
}
