import * as React from "react"
import { GraduationCap } from "lucide-react"
import { Link } from "react-router-dom"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type SidebarBrandData = {
  name: string
  subtitle?: string
  /** Where clicking the brand goes (the portal's dashboard). */
  to: string
  logo?: React.ReactNode
}

/**
 * Header slot of the sidebar. sidebar-07 uses a team switcher here; the super
 * admin portals have a single "team" (the platform), so this is a plain brand
 * link with the same look.
 */
export function SidebarBrand({ name, subtitle, to, logo }: SidebarBrandData) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link to={to}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {logo ?? <GraduationCap className="size-4" />}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              {subtitle && <span className="truncate text-xs">{subtitle}</span>}
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
