import * as React from "react"

import { NavMain, type NavGroup } from "@/components/nav-main"
import { SidebarBrand, type SidebarBrandData } from "@/components/sidebar-brand"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  brand: SidebarBrandData
  groups: NavGroup[]
}

/** The sidebar-07 layout (collapses to icons), driven by props so each portal supplies its own menu. */
export function AppSidebar({ brand, groups, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarBrand {...brand} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
