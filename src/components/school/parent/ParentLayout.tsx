import React, { useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import { useQuery } from "@tanstack/react-query";
import { parentClient } from "@/lib/api/parent-client";

const navItems = [
  { name: "Dashboard", href: "/school/parent/dashboard", icon: Home, end: true },
  { name: "Child Report", href: "/school/parent/child", icon: GraduationCap },
  { name: "Communication", href: "/school/parent/communication", icon: MessageCircle },
  { name: "Alerts", href: "/school/parent/notifications", icon: Bell },
  { name: "Profile", href: "/school/parent/profile", icon: UserIcon },
];

export default function ParentLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["parent-notifications"],
    queryFn: () => parentClient.getNotifications(),
    refetchInterval: 60000,
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead)?.length || 0;
  const pageTitle = getPageTitle(location.pathname);
  const workspaceName = user?.tenantName || "School Parent Portal";

  return (
    <div className="font-poppins relative flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/15 to-indigo-50/25">
      <ParentSidebar
        open={sidebarOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onClose={() => setSidebarOpen(false)}
        unreadCount={unreadCount}
        user={user}
        workspaceName={workspaceName}
        logout={logout}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-50 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Parent Workspace</p>
                <h1 className="truncate text-lg font-bold tracking-tight text-slate-950">{pageTitle}</h1>
              </div>
            </div>

            <div className="hidden flex-1 justify-center lg:flex">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
                  placeholder="Search alerts, teachers, reports"
                  type="search"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/school/parent/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link to="/school/parent/profile" className="flex items-center gap-3 border-l border-slate-100 pl-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold leading-none text-slate-950">{user?.name || "Parent"}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Parent</p>
                </div>
                <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">
                  {user?.name?.charAt(0).toUpperCase() || "P"}
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="mx-auto h-full max-w-[1680px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function ParentSidebar({
  open,
  collapsed,
  setCollapsed,
  onClose,
  unreadCount,
  user,
  workspaceName,
  logout,
}: {
  open: boolean;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  unreadCount: number;
  user: any;
  workspaceName: string;
  logout?: () => void;
}) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] flex-shrink-0 border-r border-slate-100 bg-white transition-all duration-300 md:sticky md:top-0 md:h-screen ${
          collapsed ? "md:w-[80px]" : "md:w-[280px]"
        } ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
            <div className={`min-w-0 transition-opacity ${collapsed ? "md:pointer-events-none md:w-0 md:overflow-hidden md:opacity-0" : ""}`}>
              <EddvaLogo className="h-7" />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCollapsed(value => !value)}
                className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 md:inline-flex"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
              </button>
              <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mb-6">
              <p className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 ${collapsed ? "md:hidden" : ""}`}>
                Overview
              </p>
              <nav className="space-y-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.end}
                    title={collapsed ? item.name : undefined}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all ${
                        isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                      }`
                    }
                  >
                    <span className="relative shrink-0">
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.name === "Alerts" && unreadCount > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </span>
                    <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="mb-6">
              <p className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 ${collapsed ? "md:hidden" : ""}`}>
                Support
              </p>
              <button
                type="button"
                onClick={() => logout?.()}
                title={collapsed ? "Logout" : undefined}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>Logout</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className={`flex items-center gap-3 rounded-xl bg-slate-50 p-3 ${collapsed ? "md:justify-center md:p-2" : ""}`}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700">
                {(user?.name || "P").charAt(0).toUpperCase()}
              </div>
              <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
                <p className="truncate text-xs font-bold text-slate-950">{workspaceName}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600">Parent Workspace</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden" onClick={onClose} aria-label="Close menu overlay" />}
    </>
  );
}

function getPageTitle(pathname: string) {
  if (pathname.endsWith("/dashboard")) return "Dashboard";
  if (pathname.endsWith("/child")) return "Child Report";
  if (pathname.endsWith("/communication")) return "Communication";
  if (pathname.endsWith("/notifications")) return "Alerts";
  if (pathname.endsWith("/profile")) return "Profile";
  return "Parent Portal";
}
