import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

/* ─────────────────────────────── Types ─────────────────────────────── */

export interface SidebarNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  /** If true, the item is active only on an exact path match */
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
  /** Pinned state: true = icon rail, false = fully expanded */
  collapsed: boolean;
  /** Toggle the pinned state */
  onToggleCollapse: () => void;
  /** Mobile drawer open state */
  mobileOpen: boolean;
  /** Close the mobile drawer */
  onMobileClose: () => void;
  /** Rendered in the expanded header */
  logo?: React.ReactNode;
  /** Rendered in the collapsed header */
  logoCollapsed?: React.ReactNode;
  /** Profile card rendered in the footer */
  profileCard?: (collapsed: boolean) => React.ReactNode;
  /** Called when any nav item is clicked */
  onNavClick?: (path: string) => void;
  /** Called when an action item is clicked (e.g. logout) */
  onAction?: (action: string) => void;
  /** Extra className on the sidebar column */
  className?: string;
  /** Overlay per path (e.g. unread dot) */
  badgeOverlay?: Record<string, React.ReactNode>;
  tourHighlight?: string | null;
  /** Show the pin/unpin chevron (defaults to true) */
  showCollapseToggle?: boolean;
  mobileBreakpoint?: "md" | "lg";
}

const EXPANDED_WIDTH = 220;
const COLLAPSED_WIDTH = 72;

/* ───────────────────────────── Helpers ────────────────────────────── */

function useIsTablet() {
  const query = "(min-width: 768px) and (max-width: 1023px)";
  const [match, setMatch] = useState(
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatch(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return match;
}

/** Keeps shadcn's internal mobile Sheet in sync with the parent's `mobileOpen` prop. */
function MobileSheetBridge({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const { openMobile, setOpenMobile } = useSidebar();
  const wasOpen = useRef(false);

  useEffect(() => {
    setOpenMobile(mobileOpen);
  }, [mobileOpen, setOpenMobile]);

  useEffect(() => {
    // Only react to the sheet closing itself (overlay click / Esc), not the initial sync.
    if (wasOpen.current && !openMobile) onMobileClose();
    wasOpen.current = openMobile;
  }, [openMobile, onMobileClose]);

  return null;
}

/* ───────────────────────────── Nav item ───────────────────────────── */

function NavItem({
  item,
  pathname,
  onNavClick,
  onAction,
  badgeOverlay,
}: {
  item: SidebarNavItem;
  pathname: string;
  onNavClick?: (path: string) => void;
  onAction?: (action: string) => void;
  badgeOverlay?: React.ReactNode;
}) {
  const buttonClass = cn(
    "h-10 gap-3 rounded-xl text-[13px] font-semibold tracking-tight",
    "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
    "data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-600 dark:data-[active=true]:bg-indigo-950/40 dark:data-[active=true]:text-indigo-400",
    "group-data-[collapsible=icon]:data-[active=true]:bg-indigo-600 group-data-[collapsible=icon]:data-[active=true]:text-white",
    "[&>svg]:size-[18px]",
  );

  if (item.action) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          tooltip={item.label}
          className={buttonClass}
          onClick={() => onAction?.(item.action!)}
        >
          <item.icon />
          <span className="truncate">{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const isActive = item.end
    ? pathname === item.path
    : pathname === item.path || pathname.startsWith(`${item.path}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label} className={buttonClass}>
        <NavLink to={item.path} end={item.end} onClick={() => onNavClick?.(item.path)}>
          <item.icon />
          <span className="truncate">{item.label}</span>
          {item.badge != null && item.badge !== "" && (
            <Badge className="ml-auto h-5 rounded-full bg-emerald-500 px-1.5 text-[9px] font-semibold uppercase leading-none text-white hover:bg-emerald-500 group-data-[collapsible=icon]:hidden">
              {item.badge}
            </Badge>
          )}
          {badgeOverlay && (
            <span className="ml-auto shrink-0 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:right-0.5 group-data-[collapsible=icon]:top-0.5 group-data-[collapsible=icon]:ml-0">
              {badgeOverlay}
            </span>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* ───────────────────────── Sidebar panel content ───────────────────────── */

function PanelHeader({
  collapsed,
  pinned,
  isMobileSheet,
  logo,
  logoCollapsed,
  showCollapseToggle,
  onToggleCollapse,
  onMobileClose,
}: Pick<UnifiedSidebarProps, "logo" | "logoCollapsed" | "onToggleCollapse" | "onMobileClose"> & {
  collapsed: boolean;
  pinned: boolean;
  isMobileSheet: boolean;
  showCollapseToggle: boolean;
}) {
  return (
    <SidebarHeader
      className={cn(
        "shrink-0 gap-1",
        collapsed
          ? "items-center px-2 py-3"
          : "flex-row items-center justify-between border-b border-sidebar-border px-4 py-4",
      )}
    >
      {collapsed ? (
        logoCollapsed && <div className="flex w-full items-center justify-center overflow-hidden">{logoCollapsed}</div>
      ) : (
        <div className="min-w-0 flex-1 overflow-hidden">{logo}</div>
      )}

      {isMobileSheet ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          onClick={onMobileClose}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </Button>
      ) : (
        showCollapseToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("hidden size-7 shrink-0 text-muted-foreground lg:inline-flex", collapsed && "mx-auto")}
            onClick={onToggleCollapse}
            aria-label={pinned ? "Pin sidebar open" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("size-4 transition-transform duration-200", pinned && "rotate-180")} />
          </Button>
        )
      )}
    </SidebarHeader>
  );
}

function PanelBody(props: UnifiedSidebarProps & { collapsed: boolean; pinned: boolean; isMobileSheet: boolean }) {
  const { groups, collapsed, pinned, isMobileSheet, logo, logoCollapsed, profileCard, onNavClick, onAction, badgeOverlay } = props;
  const { pathname } = useLocation();
  const showCollapseToggle = props.showCollapseToggle ?? true;

  return (
    <>
      <PanelHeader
        collapsed={collapsed && !isMobileSheet}
        pinned={pinned && !isMobileSheet}
        isMobileSheet={isMobileSheet}
        logo={logo}
        logoCollapsed={logoCollapsed}
        showCollapseToggle={showCollapseToggle}
        onToggleCollapse={props.onToggleCollapse}
        onMobileClose={props.onMobileClose}
      />

      <SidebarContent className="sidebar-scrollbar gap-0 px-2 py-2">
        {groups.map((group, gi) => (
          <React.Fragment key={group.heading}>
            {gi > 0 && <SidebarSeparator className="my-2 hidden group-data-[collapsible=icon]:block" />}
            <SidebarGroup className="p-0 group-data-[collapsible=icon]:py-1">
              <SidebarGroupLabel className="h-6 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {group.heading}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => (
                    <NavItem
                      key={item.action ? `action-${item.label}` : item.path}
                      item={item}
                      pathname={pathname}
                      onNavClick={onNavClick}
                      onAction={onAction}
                      badgeOverlay={badgeOverlay?.[item.path]}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>

      {profileCard && (
        <SidebarFooter className="shrink-0 border-t border-sidebar-border p-2">
          {profileCard(collapsed && !isMobileSheet)}
        </SidebarFooter>
      )}
    </>
  );
}

/* ─────────────────────────── Main component ─────────────────────────── */

export function UnifiedSidebar(props: UnifiedSidebarProps) {
  const { collapsed, onToggleCollapse, mobileOpen, onMobileClose, className } = props;
  const { pathname } = useLocation();
  const isTablet = useIsTablet();

  // Tablets always use the icon rail; desktop honours the pinned state.
  const pinnedCollapsed = collapsed || isTablet;
  const open = !pinnedCollapsed;

  useEffect(() => {
    if (mobileOpen) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      className={cn(
        "relative z-40 hidden h-full shrink-0 transition-[width] duration-200 ease-linear md:block",
        // shadcn's width spacer is not needed: this column already reserves the pinned width.
        "[&_.peer>div:first-child]:hidden",
        className,
      )}
      style={{ width: pinnedCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
    >
      <SidebarProvider
        open={open}
        onOpenChange={(next) => {
          // Ctrl/Cmd+B toggles the pinned state.
          if (next !== !collapsed) onToggleCollapse();
        }}
        className="h-full min-h-0 w-auto"
        style={
          {
            "--sidebar-width": `${EXPANDED_WIDTH}px`,
            "--sidebar-width-icon": `${COLLAPSED_WIDTH}px`,
            "--sidebar-width-mobile": "288px",
          } as React.CSSProperties
        }
      >
        <MobileSheetBridge mobileOpen={mobileOpen} onMobileClose={onMobileClose} />
        <SidebarShell
          {...props}
          collapsed={!open}
          pinned={pinnedCollapsed}
        />
      </SidebarProvider>
    </div>
  );
}

/** Renders the shadcn Sidebar; picks the Sheet (mobile) vs rail (desktop) variant via context. */
function SidebarShell(props: UnifiedSidebarProps & { pinned: boolean }) {
  const { isMobile } = useSidebar();
  const { collapsed, pinned } = props;

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        // Anchor to the column instead of the viewport so it sits correctly under any header.
        "absolute h-full border-sidebar-border bg-sidebar transition-[width] duration-200 ease-linear",
      )}
    >
      <PanelBody {...props} collapsed={collapsed} pinned={pinned} isMobileSheet={isMobile} />
    </Sidebar>
  );
}

/* ────────────────────────── Profile card helper ────────────────────────── */

/** Standard profile card for UnifiedSidebar's `profileCard` prop. */
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
    <div
      className={cn(
        "flex items-center rounded-xl transition-all duration-200",
        collapsed ? "justify-center p-1" : "gap-3 bg-muted/60 p-2.5",
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl">{avatar}</div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-foreground">{displayName}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cn("size-1.5 shrink-0 rounded-full", statusColor)} />
            <span className="truncate text-[10px] font-medium text-muted-foreground">{displayRole}</span>
          </div>
        </div>
      )}

      {!collapsed && onLogout && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Logout"
        >
          <LogOut className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

export default UnifiedSidebar;
