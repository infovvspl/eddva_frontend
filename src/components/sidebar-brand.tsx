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
  /** Full logo shown when the sidebar is expanded. Defaults to icon + name. */
  logo?: React.ReactNode
  /** Small logo shown in the collapsed rail. */
  logoCollapsed?: React.ReactNode
}

/**
 * Header slot of the sidebar. sidebar-07 uses a team switcher here; the super
 * admin portals have a single "team" (the platform), so this is a plain brand
 * link.
 */
export function SidebarBrand({ name, subtitle, to, logo, logoCollapsed }: SidebarBrandData) {
  if (logo) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Link
            to={to}
            aria-label={name}
            className="flex items-center justify-center overflow-hidden rounded-lg px-2 py-1 outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="group-data-[collapsible=icon]:hidden">{logo}</span>
            <span className="hidden group-data-[collapsible=icon]:block">
              {logoCollapsed ?? (
                <GraduationCap className="size-6 text-sidebar-primary" />
              )}
            </span>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link to={to}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {logoCollapsed ?? <GraduationCap className="size-4" />}
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
