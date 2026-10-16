import type { LucideIcon } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  DEFAULT_NAV_COLOR,
  NAV_ICON_COLORS,
} from "@/components/layout/nav-colors"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

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

/**
 * Sidebar item styling per colour family (expanded and collapsed). Written out in full (not built
 * from strings) so Tailwind can see every class. `!` beats the base
 * sidebar-accent hover/active colours.
 */
const TINTS: Record<string, { hover: string; filled: string; icon: string }> = {
  amber: {
    hover: "group-data-[collapsible=icon]:hover:bg-amber-50! group-data-[collapsible=icon]:hover:text-amber-600! dark:group-data-[collapsible=icon]:hover:bg-amber-950/40! dark:group-data-[collapsible=icon]:hover:text-amber-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-amber-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-amber-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-amber-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-amber-400 dark:data-[active=true]:[&>svg]:text-amber-400",
  },
  emerald: {
    hover: "group-data-[collapsible=icon]:hover:bg-emerald-50! group-data-[collapsible=icon]:hover:text-emerald-600! dark:group-data-[collapsible=icon]:hover:bg-emerald-950/40! dark:group-data-[collapsible=icon]:hover:text-emerald-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-emerald-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-emerald-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-emerald-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-emerald-400 dark:data-[active=true]:[&>svg]:text-emerald-400",
  },
  slate: {
    hover: "group-data-[collapsible=icon]:hover:bg-slate-50! group-data-[collapsible=icon]:hover:text-slate-600! dark:group-data-[collapsible=icon]:hover:bg-slate-950/40! dark:group-data-[collapsible=icon]:hover:text-slate-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-slate-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-slate-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-slate-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-slate-400 dark:data-[active=true]:[&>svg]:text-slate-400",
  },
  rose: {
    hover: "group-data-[collapsible=icon]:hover:bg-rose-50! group-data-[collapsible=icon]:hover:text-rose-600! dark:group-data-[collapsible=icon]:hover:bg-rose-950/40! dark:group-data-[collapsible=icon]:hover:text-rose-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-rose-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-rose-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-rose-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-rose-400 dark:data-[active=true]:[&>svg]:text-rose-400",
  },
  orange: {
    hover: "group-data-[collapsible=icon]:hover:bg-orange-50! group-data-[collapsible=icon]:hover:text-orange-600! dark:group-data-[collapsible=icon]:hover:bg-orange-950/40! dark:group-data-[collapsible=icon]:hover:text-orange-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-orange-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-orange-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-orange-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-orange-400 dark:data-[active=true]:[&>svg]:text-orange-400",
  },
  indigo: {
    hover: "group-data-[collapsible=icon]:hover:bg-indigo-50! group-data-[collapsible=icon]:hover:text-indigo-600! dark:group-data-[collapsible=icon]:hover:bg-indigo-950/40! dark:group-data-[collapsible=icon]:hover:text-indigo-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-indigo-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-indigo-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-indigo-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-indigo-400 dark:data-[active=true]:[&>svg]:text-indigo-400",
  },
  blue: {
    hover: "group-data-[collapsible=icon]:hover:bg-blue-50! group-data-[collapsible=icon]:hover:text-blue-600! dark:group-data-[collapsible=icon]:hover:bg-blue-950/40! dark:group-data-[collapsible=icon]:hover:text-blue-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-blue-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-blue-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-blue-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-blue-400 dark:data-[active=true]:[&>svg]:text-blue-400",
  },
  violet: {
    hover: "group-data-[collapsible=icon]:hover:bg-violet-50! group-data-[collapsible=icon]:hover:text-violet-600! dark:group-data-[collapsible=icon]:hover:bg-violet-950/40! dark:group-data-[collapsible=icon]:hover:text-violet-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-violet-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-violet-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-violet-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-violet-400 dark:data-[active=true]:[&>svg]:text-violet-400",
  },
  teal: {
    hover: "group-data-[collapsible=icon]:hover:bg-teal-50! group-data-[collapsible=icon]:hover:text-teal-600! dark:group-data-[collapsible=icon]:hover:bg-teal-950/40! dark:group-data-[collapsible=icon]:hover:text-teal-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-teal-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-teal-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-teal-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-teal-400 dark:data-[active=true]:[&>svg]:text-teal-400",
  },
  sky: {
    hover: "group-data-[collapsible=icon]:hover:bg-sky-50! group-data-[collapsible=icon]:hover:text-sky-600! dark:group-data-[collapsible=icon]:hover:bg-sky-950/40! dark:group-data-[collapsible=icon]:hover:text-sky-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-sky-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-sky-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-sky-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-sky-400 dark:data-[active=true]:[&>svg]:text-sky-400",
  },
  red: {
    hover: "group-data-[collapsible=icon]:hover:bg-red-50! group-data-[collapsible=icon]:hover:text-red-600! dark:group-data-[collapsible=icon]:hover:bg-red-950/40! dark:group-data-[collapsible=icon]:hover:text-red-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-red-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-red-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-red-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-red-400 dark:data-[active=true]:[&>svg]:text-red-400",
  },
  yellow: {
    hover: "group-data-[collapsible=icon]:hover:bg-yellow-50! group-data-[collapsible=icon]:hover:text-yellow-600! dark:group-data-[collapsible=icon]:hover:bg-yellow-950/40! dark:group-data-[collapsible=icon]:hover:text-yellow-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-yellow-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-yellow-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-yellow-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-yellow-400 dark:data-[active=true]:[&>svg]:text-yellow-400",
  },
  pink: {
    hover: "group-data-[collapsible=icon]:hover:bg-pink-50! group-data-[collapsible=icon]:hover:text-pink-600! dark:group-data-[collapsible=icon]:hover:bg-pink-950/40! dark:group-data-[collapsible=icon]:hover:text-pink-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-pink-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-pink-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-pink-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-pink-400 dark:data-[active=true]:[&>svg]:text-pink-400",
  },
  fuchsia: {
    hover: "group-data-[collapsible=icon]:hover:bg-fuchsia-50! group-data-[collapsible=icon]:hover:text-fuchsia-600! dark:group-data-[collapsible=icon]:hover:bg-fuchsia-950/40! dark:group-data-[collapsible=icon]:hover:text-fuchsia-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-fuchsia-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-fuchsia-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-fuchsia-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-fuchsia-400 dark:data-[active=true]:[&>svg]:text-fuchsia-400",
  },
  cyan: {
    hover: "group-data-[collapsible=icon]:hover:bg-cyan-50! group-data-[collapsible=icon]:hover:text-cyan-600! dark:group-data-[collapsible=icon]:hover:bg-cyan-950/40! dark:group-data-[collapsible=icon]:hover:text-cyan-400!",
    filled: "group-data-[collapsible=icon]:data-[active=true]:bg-cyan-600! group-data-[collapsible=icon]:data-[active=true]:text-white! group-data-[collapsible=icon]:data-[active=true]:shadow-md group-data-[collapsible=icon]:data-[active=true]:[&>svg]:text-white!",
    icon: "hover:[&>svg]:text-cyan-600 hover:[&>svg]:fill-current/25 data-[active=true]:[&>svg]:text-cyan-600 data-[active=true]:[&>svg]:fill-current/25 dark:hover:[&>svg]:text-cyan-400 dark:data-[active=true]:[&>svg]:text-cyan-400",
  },
}

/** Row highlight for the expanded sidebar: one colour for every item, so the icon is what varies. */
const ROW =
  "hover:bg-indigo-100! hover:text-indigo-900! data-[active=true]:bg-indigo-100! data-[active=true]:text-indigo-700! data-[active=true]:ring-1 data-[active=true]:ring-indigo-300 " +
  "dark:hover:bg-indigo-900/40! dark:hover:text-indigo-200! dark:data-[active=true]:bg-indigo-900/40! dark:data-[active=true]:text-indigo-300! dark:data-[active=true]:ring-indigo-800"

/** School super admin routes reuse the colour of their coaching twin (/school/super-admin/x → /super-admin/x). */
function tintFor(url: string) {
  const color =
    NAV_ICON_COLORS[url] ??
    NAV_ICON_COLORS[url.replace(/^\/school/, "")] ??
    DEFAULT_NAV_COLOR
  const family = /text-([a-z]+)-/.exec(color.active)?.[1] ?? "indigo"
  return TINTS[family] ?? TINTS.indigo
}

function NavEntry({ item, active }: { item: NavItem; active: boolean }) {
  const tint = tintFor(item.url)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={active}
        className={cn(
          "h-10 gap-3 rounded-xl text-[13px] font-semibold tracking-tight transition-colors",
          "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
          "data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-600 dark:data-[active=true]:bg-indigo-950/40 dark:data-[active=true]:text-indigo-400",
          "[&>svg]:size-[18px] [&>svg]:transition-colors",
          // Expanded: one row colour (indigo); only the icon lights up in the item's own colour.
          ROW,
          tint.icon,
          // Collapsed rail: light up in the item's own tint on hover, solid when current.
          tint.hover,
          tint.filled,
          "group-data-[collapsible=icon]:hover:[&>svg]:fill-current/20",
          "group-data-[collapsible=icon]:data-[active=true]:[&>svg]:fill-current/25",
        )}
      >
        <NavLink to={item.url} end={item.end}>
          {item.icon && <item.icon />}
          <span className="truncate">{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
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
              <NavEntry
                key={item.url}
                item={item}
                active={isNavItemActive(pathname, item)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
