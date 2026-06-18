import React, { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
}

/* ─────────────────────── Dimension constants ──────────────────────── */

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

/* ──────────────────────── Tooltip Component ───────────────────────── */

function SidebarTooltip({ label, show }: { label: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.15, delay: 0.08 }}
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[200] pointer-events-none"
        >
          <div className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xl">
            {label}
            {/* Arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────── Nav Item Component ──────────────────────── */

function SidebarItem({
  item,
  collapsed,
  onNavClick,
  onAction,
  badgeOverlay,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  onNavClick?: (path: string) => void;
  onAction?: (action: string) => void;
  badgeOverlay?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  // Action button (e.g. logout)
  if (item.action) {
    return (
      <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <button
          type="button"
          onClick={() => onAction?.(item.action!)}
          className={cn(
            "group relative flex w-full items-center rounded-[10px] text-[13px] font-medium transition-all duration-200",
            collapsed
              ? "h-[48px] w-[48px] mx-auto justify-center"
              : "h-[40px] gap-3 px-3",
            "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
          )}
        >
          <div className={cn(
            "flex items-center justify-center shrink-0",
            collapsed ? "w-5 h-5" : "w-[18px] h-[18px]"
          )}>
            <item.icon className="w-full h-full" />
          </div>
          {!collapsed && (
            <span className="truncate transition-[opacity,width] duration-200">{item.label}</span>
          )}
        </button>
        {collapsed && <SidebarTooltip label={item.label} show={hovered} />}
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NavLink
        to={item.path}
        end={item.end}
        onClick={() => onNavClick?.(item.path)}
        className={({ isActive }) =>
          cn(
            "group relative flex items-center rounded-[10px] text-[13px] font-medium transition-all duration-200",
            collapsed
              ? "h-[48px] w-[48px] mx-auto justify-center"
              : "h-[40px] gap-3 px-3",
            isActive
              ? collapsed
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Left active indicator bar — expanded only */}
            {isActive && !collapsed && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
            )}

            <div className={cn(
              "flex items-center justify-center shrink-0 transition-all duration-200",
              collapsed ? "w-5 h-5" : "w-[18px] h-[18px]",
            )}>
              <item.icon className={cn("w-full h-full", isActive && collapsed ? "text-white" : "")} />
            </div>

            {!collapsed && (
              <span className="truncate transition-[opacity] duration-200">{item.label}</span>
            )}

            {/* Badge — expanded only */}
            {item.badge && !collapsed && (
              <span className="ml-auto shrink-0 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white leading-none">
                {item.badge}
              </span>
            )}

            {/* Badge overlay — collapsed (e.g. unread dot) */}
            {badgeOverlay && collapsed && (
              <span className="absolute top-1 right-1">{badgeOverlay}</span>
            )}

            {/* Badge overlay — expanded */}
            {badgeOverlay && !collapsed && (
              <span className="ml-auto shrink-0">{badgeOverlay}</span>
            )}
          </>
        )}
      </NavLink>
      {collapsed && <SidebarTooltip label={item.label} show={hovered} />}
    </div>
  );
}

/* ──────────────────── Sidebar Content (inner) ─────────────────────── */

function SidebarInner({
  groups,
  collapsed,
  onToggleCollapse,
  logo,
  logoCollapsed,
  profileCard,
  onNavClick,
  onAction,
  badgeOverlay,
  isMobileDrawer,
  onMobileClose,
}: UnifiedSidebarProps & { isMobileDrawer?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col bg-white border-r border-slate-100 dark:bg-slate-950 dark:border-slate-800 overflow-hidden",
        !isMobileDrawer && "transition-[width] [transition-duration:250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]"
      )}
      style={{ width: isMobileDrawer ? EXPANDED_WIDTH : (collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH) }}
    >
      {/* ── Header: logo + collapse toggle ── */}
      <div className={cn(
        "flex h-14 items-center shrink-0 border-b border-slate-100 dark:border-slate-800",
        collapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {/* Logo */}
        <div className={cn(
          "min-w-0 transition-[opacity,width] duration-200 overflow-hidden",
          collapsed && !isMobileDrawer ? "w-0 opacity-0 pointer-events-none" : "opacity-100"
        )}>
          {logo}
        </div>

        {/* Collapsed logo mark */}
        {collapsed && !isMobileDrawer && logoCollapsed && (
          <div className="flex items-center justify-center">
            {logoCollapsed}
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        {!isMobileDrawer && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")} />
          </button>
        )}

        {/* Close button — mobile drawer */}
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onMobileClose}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className={cn(
        "flex-1 min-h-0 overflow-y-auto sidebar-scrollbar py-4",
        collapsed && !isMobileDrawer ? "px-3" : "px-3"
      )}>
        {groups.map((group, gi) => (
          <div key={group.heading} className={cn(gi > 0 && "mt-4")}>
            {/* Section heading — hidden when collapsed */}
            {(!collapsed || isMobileDrawer) && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 select-none">
                {group.heading}
              </p>
            )}

            {/* Collapsed separator line */}
            {collapsed && !isMobileDrawer && gi > 0 && (
              <div className="mx-auto mb-2 w-8 border-t border-slate-100 dark:border-slate-800" />
            )}

            <div className="flex flex-col" style={{ gap: 2 }}>
              {group.items.map((item) => (
                <SidebarItem
                  key={item.action ? `action-${item.label}` : item.path}
                  item={item}
                  collapsed={collapsed && !isMobileDrawer}
                  onNavClick={onNavClick}
                  onAction={onAction}
                  badgeOverlay={badgeOverlay?.[item.path]}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer / Profile Card ── */}
      {profileCard && (
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-3">
          {profileCard(collapsed && !isMobileDrawer)}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Main Export ──────────────────────────────── */

export function UnifiedSidebar(props: UnifiedSidebarProps) {
  const {
    collapsed,
    mobileOpen,
    onMobileClose,
    className,
  } = props;

  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 relative z-40",
          className
        )}
        style={{
          width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <SidebarInner {...props} isMobileDrawer={false} />
      </aside>

      {/* ── Tablet: auto-collapsed sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex lg:hidden flex-col shrink-0 relative z-40",
          className
        )}
        style={{ width: COLLAPSED_WIDTH }}
      >
        <SidebarInner {...props} collapsed={true} isMobileDrawer={false} />
      </aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] flex md:hidden">
            {/* Drawer panel */}
            <motion.div
              initial={{ x: -EXPANDED_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -EXPANDED_WIDTH }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="h-full shadow-2xl"
            >
              <SidebarInner {...props} collapsed={false} isMobileDrawer={true} />
            </motion.div>

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="flex-1 bg-slate-900/40 backdrop-blur-[2px]"
              aria-label="Close menu"
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ────────────────── Profile Card Helper ──────────────────────────── */

/** Standard profile card for use with UnifiedSidebar's profileCard prop */
export function SidebarProfileCard({
  collapsed,
  avatar,
  name,
  roleLabel,
  statusColor = "bg-emerald-500",
  onLogout,
}: {
  collapsed: boolean;
  avatar: React.ReactNode;
  name: string;
  roleLabel: string;
  statusColor?: string;
  onLogout?: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center rounded-xl transition-all duration-200",
      collapsed ? "justify-center p-2" : "gap-3 bg-slate-50 dark:bg-slate-900 p-2.5"
    )}>
      {/* Avatar */}
      <div className="w-9 h-9 shrink-0 rounded-xl overflow-hidden flex items-center justify-center">
        {avatar}
      </div>

      {/* Name + role — hidden when collapsed */}
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-slate-900 dark:text-white">{name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusColor)} />
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{roleLabel}</span>
          </div>
        </div>
      )}

      {/* Logout button — expanded only */}
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
