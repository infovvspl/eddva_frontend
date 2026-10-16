import { SuperAdminShell } from "@/components/layout/SuperAdminShell"
import {
  isSchoolFullWidthPage,
  schoolSuperAdminGroups,
} from "@/components/layout/super-admin-nav"
import { BreadcrumbProvider } from "@/components/school/breadcrumbs/BreadcrumbContext"
import { useAuth } from "@/context/SchoolAuthContext"

/** Layout for /school/super-admin/* (school platform). Auth is enforced by the route's SchoolGuard. */
export default function SchoolSuperAdminLayout() {
  const { user, logout } = useAuth()

  return (
    <BreadcrumbProvider>
      <SuperAdminShell
        brand={{ name: "Eddva", subtitle: "School Super Admin", to: "/school/super-admin" }}
        rootLabel="School Super Admin"
        groups={schoolSuperAdminGroups}
        user={{
          name: user?.name || "Super Admin",
          email: user?.email,
          avatar: user?.profileImage,
        }}
        onLogout={() => logout()}
        isFullWidthPage={isSchoolFullWidthPage}
      />
    </BreadcrumbProvider>
  )
}
