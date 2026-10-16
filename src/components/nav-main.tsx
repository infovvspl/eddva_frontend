import type { LucideIcon } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  /** Match the URL exactly (use for dashboard/index routes). */
  end?: boolean
}

export type NavGroup = {
  heading: string
  items: NavItem[]
}

export function isNavItemActive(pathname: string, item: NavItem) {
  if (pathname === item.url) return true
  return !item.end && pathname.startsWith(`${item.url}/`)
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const { pathname } = useLocation()

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.heading}>
          <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isNavItemActive(pathname, item)}
                >
                  <NavLink to={item.url} end={item.end}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
