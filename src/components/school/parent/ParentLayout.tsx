import React, { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  UserCircle,
  X,
  Loader2,
  CheckCheck,
  Inbox
} from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import api from "@/lib/api/school-client";
import { useSchoolNotification } from "@/context/SchoolNotificationContext";
import NotificationCenterModal from "@/components/school/NotificationCenterModal";

const navItems = [
  { name: "Dashboard", href: "/school/parent/dashboard", icon: Home, end: true },
  { name: "Child Report", href: "/school/parent/child", icon: GraduationCap },
  { name: "Communication", href: "/school/parent/communication", icon: MessageCircle },
  { name: "Alerts", href: "/school/parent/notifications", icon: Bell },
];

export default function ParentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const {
    unreadCount,
    notifications,
    setUnreadCount,
    setNotifications,
    fetchUnreadCount,
    fetchNotifications
  } = useSchoolNotification();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifCenterOpen, setNotifCenterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data?.success) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      if (res.data?.success) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getParentFallbackUrl = (n: any) => {
    if (n.actionUrl) return n.actionUrl;
    const type = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    if (type.includes('attendance') || title.includes('attendance')) {
      return '/school/parent/child';
    }
    return '/school/parent/dashboard';
  };

  const pageTitle = getPageTitle(location.pathname);
  const workspaceName = user?.tenantName || "School Parent Portal";

  return (
    <div className="layout-fixed font-poppins relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/15 to-indigo-50/25">
      <ParentSidebar
        open={sidebarOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onClose={() => setSidebarOpen(false)}
        unreadCount={unreadCount}
        user={user}
        workspaceName={workspaceName}
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
              <div className="relative flex items-center gap-2" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white border border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full z-50 mt-4 w-96 overflow-hidden rounded-[2rem] border border-slate-100 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h3>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          {unreadCount} unread messages
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                        >
                          <CheckCheck size={12} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                      {notifLoading ? (
                        <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
                          <p className="text-xs font-bold">Fetching updates...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <Inbox className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-400">All caught up!</p>
                          <p className="text-[10px] text-slate-400/80 mt-1">No new alerts found.</p>
                        </div>
                      ) : (
                        notifications.map((n: any) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.isRead) {
                                handleMarkAsRead(n.id);
                              }
                              const targetUrl = getParentFallbackUrl(n);
                              if (targetUrl) {
                                navigate(targetUrl);
                              }
                              setNotifOpen(false);
                            }}
                            className={`group relative flex items-start gap-3 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/20 dark:bg-blue-900/10" : ""
                              }`}
                          >
                            {!n.isRead && (
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}

                            <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold ${n.priority === 'urgent'
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
                                : n.priority === 'high'
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}>
                              <Bell size={14} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className={`text-[11px] font-bold text-slate-900 dark:text-white truncate ${!n.isRead ? "font-extrabold" : ""}`}>
                                {n.title}
                              </h4>
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[8px] font-bold text-slate-400 tracking-tight uppercase block mt-1.5">
                                {new Date(n.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer link to open modal */}
                    <div className="border-t border-slate-100 dark:border-slate-800 p-2.5 text-center flex-shrink-0">
                      <button
                        onClick={() => {
                          setNotifCenterOpen(true);
                          setNotifOpen(false);
                        }}
                        className="w-full text-center text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                      >
                        View All Notifications →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative border-l border-slate-100 pl-4 dark:border-slate-800" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-2 outline-none"
                  aria-label="User Profile menu"
                >
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold leading-none text-slate-950">{user?.name || "Parent"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Parent</p>
                  </div>
                  <div className="relative">
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={user?.name || 'Parent'} 
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<div class="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-300">${(user?.name || 'P').charAt(0).toUpperCase()}</div>`;
                        }}
                        className="h-10 w-10 rounded-2xl border border-slate-200 object-cover" 
                      />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {(user?.name || 'P').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 z-50 mt-4 w-64 overflow-hidden rounded-[2rem] border border-slate-100 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                    {/* Profile Header */}
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Parent'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Parent Portal</p>
                    </div>
                    
                    {/* My Profile Link */}
                    <Link
                      to="/school/parent/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                        <UserCircle size={16} />
                      </div>
                      My Profile
                    </Link>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-4" />

                    {/* Logout button */}
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                        <LogOut size={16} />
                      </div>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>
      {user && (
        <NotificationCenterModal
          isOpen={notifCenterOpen}
          onClose={() => setNotifCenterOpen(false)}
          currentUser={user}
          onUpdate={fetchUnreadCount}
        />
      )}
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
        className={`flex flex-col fixed inset-y-0 left-0 z-50 w-[280px] flex-shrink-0 border-r border-slate-100 bg-white transition-all duration-300 md:sticky md:top-0 md:h-screen ${collapsed ? "md:w-[80px]" : "md:w-[280px]"
          } ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-1 flex-col overflow-hidden">
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

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
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
                      `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
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
          </div>

          <div className="mt-auto border-t border-slate-100 p-4">
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
