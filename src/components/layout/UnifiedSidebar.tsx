import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

/* ─────────────────────────────── Types ─────────────────────────────── */

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  /** If true, NavLink uses `end` matching (exact path) */
  end?: boolean;
  /** Badge text (e.g. "New", count) */
  badge?: string | number;
  /** If set, the item fires an action instead of navigating */
  action?: string;
}

export interface SidebarGroup {
  heading: string;
  items: SidebarNavItem[];
}

export interface UnifiedSidebarProps {
  /** Grouped navigation items */
  groups: SidebarGroup[];
  /** Controlled collapsed state */
  collapsed: boolean;
  /** Toggle collapsed / expanded */
  onToggleCollapse: () => void;
  /** Mobile drawer open state */
  mobileOpen: boolean;
  /** Close mobile drawer */
  onMobileClose: () => void;
  /** Logo rendered in expanded sidebar header */
  logo?: React.ReactNode;
  /** Small logo/icon rendered in collapsed sidebar header */
  logoCollapsed?: React.ReactNode;
  /** Profile card content — rendered at the bottom */
  profileCard?: (collapsed: boolean) => React.ReactNode;
  /** Called when any nav item is clicked (for closing mobile drawer, etc.) */
  onNavClick?: (path: string) => void;
  /** Called when an action item is clicked (e.g. logout) */
  onAction?: (action: string) => void;
  /** Extra className on the sidebar root */
  className?: string;
  /** Badge overlay for a specific path (e.g. unread count dot) */
  badgeOverlay?: Record<string, React.ReactNode>;
  /** Tour-related highlight data-attributes */
  tourHighlight?: string | null;
  /** Whether to show the sidebar collapse chevron toggle (defaults to true) */
  showCollapseToggle?: boolean;
  /** Breakpoint below which the overlay drawer is used (defaults to `md`) */
  mobileBreakpoint?: "md" | "lg";
}

function isItemActive(item: SidebarNavItem, pathname: string) {
  if (item.end) return pathname === item.path;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

/**
 * Bridges the externally-controlled `mobileOpen`/`onMobileClose` props onto
 * SidebarProvider's internal mobile-sheet state (which has no controlled-prop
 * escape hatch of its own) — lets every caller keep owning "is the drawer
 * open" without reaching into shadcn's context themselves. Also closes the
 * drawer on route change, matching the previous behavior.
 */
function MobileBridge({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const { openMobile, setOpenMobile } = useSidebar();
  const wasOpen = useRef(openMobile);
  const location = useLocation();

  useEffect(() => {
    setOpenMobile(mobileOpen);
  }, [mobileOpen, setOpenMobile]);

  useEffect(() => {
    if (wasOpen.current && !openMobile) onMobileClose();
    wasOpen.current = openMobile;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMobile]);

  useEffect(() => {
    if (mobileOpen) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}

function NavItemButton({
  item,
  collapsed,
  isMobile,
  onNavClick,
  onAction,
  badgeOverlay,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  isMobile: boolean;
  onNavClick?: (path: string) => void;
  onAction?: (action: string) => void;
  badgeOverlay?: React.ReactNode;
}) {
  const location = useLocation();
  const tooltip = collapsed && !isMobile ? item.label : undefined;

  const buttonClassName = cn(
    "h-11 rounded-2xl px-3 text-[13.5px] font-semibold tracking-tight text-slate-500 transition-all duration-200 dark:text-slate-400",
    "data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 data-[active=true]:font-bold data-[active=true]:shadow-sm",
    "dark:data-[active=true]:bg-blue-950/40 dark:data-[active=true]:text-blue-400",
    "hover:bg-slate-50 dark:hover:bg-slate-800/40",
    "group-data-[collapsible=icon]:data-[active=true]:bg-blue-600 group-data-[collapsible=icon]:data-[active=true]:text-white"
  );

  if (item.action) {
    return (
      <SidebarMenuButton onClick={() => onAction?.(item.action!)} tooltip={tooltip} className={buttonClassName}>
        <item.icon className="size-[18px]" />
        <span className="truncate">{item.label}</span>
      </SidebarMenuButton>
    );
  }

  const active = isItemActive(item, location.pathname);

  return (
    <SidebarMenuButton asChild isActive={active} tooltip={tooltip} className={buttonClassName}>
      <NavLink to={item.path} end={item.end} onClick={() => onNavClick?.(item.path)}>
        <item.icon className="size-[18px]" />
        <span className="truncate flex-1">{item.label}</span>
        {item.badge && (
          <span className="ml-auto shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase leading-none text-white">
            {item.badge}
          </span>
        )}
        {badgeOverlay && <span className="ml-auto shrink-0">{badgeOverlay}</span>}
        {!item.badge && !badgeOverlay && (
          <ChevronDown className={cn("size-3.5 shrink-0 opacity-0 transition-opacity", active && "opacity-60")} />
        )}
      </NavLink>
    </SidebarMenuButton>
  );
}

function SidebarBody(props: UnifiedSidebarProps) {
  const { groups, logo, logoCollapsed, profileCard, onNavClick, onAction, badgeOverlay, showCollapseToggle = true } = props;
  const { isMobile, state } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  return (
    <>
      <SidebarHeader className="gap-0 py-4">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            {logoCollapsed}
            {showCollapseToggle && !isMobile && <SidebarTrigger />}
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0 flex-1">{logo}</div>
            {showCollapseToggle && !isMobile && <SidebarTrigger className="shrink-0" />}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {groups.map((group, gi) => (
          <React.Fragment key={group.heading}>
            {collapsed && gi > 0 && <SidebarSeparator className="mx-auto my-1 w-8" />}
            <SidebarGroup>
              {!collapsed && <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{group.heading}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.action ? `action-${item.label}` : item.path}>
                      <NavItemButton
                        item={item}
                        collapsed={collapsed}
                        isMobile={isMobile}
                        onNavClick={onNavClick}
                        onAction={onAction}
                        badgeOverlay={badgeOverlay?.[item.path]}
                      />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>

      {profileCard && <SidebarFooter className="border-t border-sidebar-border p-2">{profileCard(collapsed)}</SidebarFooter>}
    </>
  );
}

/* ─────────────────────── Main Export ──────────────────────────────── */

export function UnifiedSidebar(props: UnifiedSidebarProps) {
  const { collapsed, onToggleCollapse, mobileOpen, onMobileClose, className } = props;
  const open = !collapsed;

  return (
    <SidebarProvider
      open={open}
      onOpenChange={(next) => {
        if (next === collapsed) onToggleCollapse();
      }}
      className={cn("w-auto min-h-0", className)}
    >
      <MobileBridge mobileOpen={mobileOpen} onMobileClose={onMobileClose} />
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarBody {...props} />
      </Sidebar>
    </SidebarProvider>
  );
}

/* ────────────────── Profile Card Helper ──────────────────────────── */

/** Standard profile card for use with UnifiedSidebar's profileCard prop */
export function SidebarProfileCard({
  collapsed,
  avatar,
  name,
  roleLabel,
  title,
  subtitle,
  statusColor = "bg-emerald-500",
  onLogout,
}: {
  collapsed: boolean;
  avatar: React.ReactNode;
  name?: string;
  roleLabel?: string;
  title?: string;
  subtitle?: string;
  statusColor?: string;
  onLogout?: () => void;
}) {
  const displayName = name || title || "";
  const displayRole = roleLabel || subtitle || "";

  return (
    <div className={cn(
      "flex items-center rounded-xl transition-all duration-200",
      collapsed ? "justify-center p-2" : "gap-3 bg-slate-50 dark:bg-slate-900 p-2.5"
    )}>
      <div className="w-9 h-9 shrink-0 rounded-xl overflow-hidden flex items-center justify-center">
        {avatar}
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-slate-900 dark:text-white">{displayName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusColor)} />
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{displayRole}</span>
          </div>
        </div>
      )}

      {!collapsed && onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          aria-label="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default UnifiedSidebar;
