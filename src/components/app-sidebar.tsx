import * as React from "react"

import { NavMain, type NavGroup } from "@/components/nav-main"
import { NavUser, type NavUserData } from "@/components/nav-user"
import { SidebarBrand, type SidebarBrandData } from "@/components/sidebar-brand"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  brand: SidebarBrandData
  groups: NavGroup[]
  user: NavUserData
  settingsUrl?: string
  onLogout: () => void
}

/** The sidebar-07 layout (collapses to icons), driven by props so each portal supplies its own menu. */
export function AppSidebar({
  brand,
  groups,
  user,
  settingsUrl,
  onLogout,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarBrand {...brand} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} settingsUrl={settingsUrl} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
