import { SuperAdminShell } from "@/components/layout/SuperAdminShell"
import {
  coachingSuperAdminGroups,
  isCoachingFullWidthPage,
} from "@/components/layout/super-admin-nav"
import { useLogout } from "@/hooks/use-auth"
import { useAuthStore } from "@/lib/auth-store"

/** Layout for /super-admin/* (coaching platform). Auth is enforced by the route's ProtectedRoute. */
export default function CoachingSuperAdminLayout() {
  const user = useAuthStore((s) => s.user)
  const platformName = useAuthStore((s) => s.platformName)
  const logout = useLogout()

  return (
    <SuperAdminShell
      brand={{ name: platformName || "Eddva", subtitle: "Super Admin", to: "/super-admin" }}
      rootLabel="Super Admin"
      groups={coachingSuperAdminGroups}
      user={{
        name: user?.name || "Super Admin",
        email: user?.email,
        avatar: user?.profileImage,
      }}
      settingsUrl="/super-admin/settings"
      onLogout={logout}
      isFullWidthPage={isCoachingFullWidthPage}
    />
  )
}
