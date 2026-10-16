import { CoachingHeaderActions } from "@/components/layout/CoachingHeaderActions"
import { MobileTabBar } from "@/components/layout/MobileTabBar"
import { SuperAdminShell } from "@/components/layout/SuperAdminShell"
import {
  coachingSuperAdminGroups,
  coachingSuperAdminPrimaryTabs,
  coachingSuperAdminTabs,
  isCoachingFullWidthPage,
} from "@/components/layout/super-admin-nav"
import { EddvaLogo } from "@/components/branding/EddvaLogo"

/** Layout for /super-admin/* (coaching platform). Auth is enforced by the route's ProtectedRoute. */
export default function CoachingSuperAdminLayout() {
  return (
    <SuperAdminShell
      brand={{
        name: "Eddva",
        subtitle: "Super Admin",
        to: "/super-admin",
        logo: <EddvaLogo className="h-16 w-auto max-w-full" />,
        logoCollapsed: (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            E
          </div>
        ),
      }}
      rootLabel="Super Admin"
      groups={coachingSuperAdminGroups}
      isFullWidthPage={isCoachingFullWidthPage}
      headerActions={<CoachingHeaderActions />}
      mobileBar={
        <MobileTabBar
          items={coachingSuperAdminTabs}
          primaryPaths={coachingSuperAdminPrimaryTabs}
        />
      }
    />
  )
}
