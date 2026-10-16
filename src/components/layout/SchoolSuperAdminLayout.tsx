import { EddvaLogo } from "@/components/branding/EddvaLogo"
import { SuperAdminShell } from "@/components/layout/SuperAdminShell"
import {
  isSchoolFullWidthPage,
  schoolSuperAdminGroups,
} from "@/components/layout/super-admin-nav"
import { BreadcrumbProvider } from "@/components/school/breadcrumbs/BreadcrumbContext"
import SchoolAdminNavbar from "@/components/school/admin/Navbar"
import SchoolAdminLayout from "@/components/school/admin/Layout"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * Layout for /school/super-admin/* (school platform). Auth is enforced by the route's SchoolGuard.
 *
 * Desktop: the shared sidebar shell, with the school Navbar (search, theme,
 * notifications, profile) as its header. Phones: the existing school layout,
 * which already has the bottom tab bar and More drawer.
 */
export default function SchoolSuperAdminLayout() {
  const isMobile = useIsMobile()

  if (isMobile) return <SchoolAdminLayout />

  return (
    <BreadcrumbProvider>
      <SuperAdminShell
        brand={{
          name: "Eddva",
          subtitle: "School Super Admin",
          to: "/school/super-admin",
          logo: <EddvaLogo className="h-8" />,
          logoCollapsed: (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              E
            </div>
          ),
        }}
        rootLabel="School Super Admin"
        groups={schoolSuperAdminGroups}
        isFullWidthPage={isSchoolFullWidthPage}
        header={
          <div className="relative z-30 flex shrink-0 items-stretch border-b border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center pl-3">
              <SidebarTrigger />
            </div>
            <div className="min-w-0 flex-1 [&>header]:border-b-0">
              <SchoolAdminNavbar />
            </div>
          </div>
        }
      />
    </BreadcrumbProvider>
  )
}
