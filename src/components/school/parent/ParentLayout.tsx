import React, { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  UserCircle,
  Loader2,
  CheckCheck,
  Inbox,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import { useSchoolFeature } from "@/hooks/use-school-feature";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import api from "@/lib/api/school-client";
import { useSchoolNotification } from "@/context/SchoolNotificationContext";
import { UnifiedSidebar, SidebarProfileCard } from "@/components/layout/UnifiedSidebar";
import MaintenanceNotice from "@/components/shared/MaintenanceNotice";

const parentPages = [
  { name: 'Dashboard', path: '/school/parent/dashboard', icon: Home, keywords: 'overview summary' },
  { name: 'Child Report', path: '/school/parent/child', icon: GraduationCap, keywords: 'child student attendance marks performance progress' },
  { name: 'Communication', path: '/school/parent/communication', icon: MessageCircle, keywords: 'chat message teacher contact' },
  { name: 'Alerts & Notifications', path: '/school/parent/notifications', icon: Bell, keywords: 'alerts notice notifications updates' },
  { name: 'Profile', path: '/school/parent/profile', icon: UserCircle, keywords: 'account settings password' },
];

const parentNavGroups = [
  {
    heading: 'Overview',
    items: [
      { label: "Dashboard", path: "/school/parent/dashboard", icon: Home, end: true },
      { label: "Child Report", path: "/school/parent/child", icon: GraduationCap, featType: 'module', featKey: 'reports' },
      { label: "Communication", path: "/school/parent/communication", icon: MessageCircle, featType: 'module', featKey: 'chat' },
      { label: "Alerts", path: "/school/parent/notifications", icon: Bell },
    ],
  },
];

export default function ParentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const hasChat = useSchoolFeature('module', 'chat');
  const hasReports = useSchoolFeature('module', 'reports');

  const filteredNavGroups = parentNavGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.featType === 'module' && item.featKey === 'chat' && !hasChat) return false;
      if (item.featType === 'module' && item.featKey === 'reports' && !hasReports) return false;
      return true;
    })
  })).filter(g => g.items.length > 0);

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    else setSearchQuery('');
  }, [searchOpen]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredParentPages = normalizedQuery
    ? parentPages.filter(p => `${p.name} ${p.keywords}`.toLowerCase().includes(normalizedQuery))
    : [];

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
      <UnifiedSidebar
        groups={filteredNavGroups}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        logo={<EddvaLogo className="h-7" />}
        onNavClick={() => setSidebarOpen(false)}
        badgeOverlay={
          unreadCount > 0
            ? {
                '/school/parent/notifications': (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ),
              }
            : undefined
        }
        profileCard={(isCollapsed) => (
          <SidebarProfileCard
            collapsed={isCollapsed}
            avatar={
              <div className="grid h-full w-full place-items-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700">
                {(user?.name || 'P').charAt(0).toUpperCase()}
              </div>
            }
            name={workspaceName}
            roleLabel="Parent Workspace"
          />
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-4 sm:px-6">
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

            <div className="flex items-center gap-3">
              {/* Search icon — visible on all screen sizes */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
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
                  <div className="absolute right-[-70px] sm:right-0 top-full mt-3.5 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[360px] sm:max-w-none overflow-hidden rounded-[2rem] border border-slate-100 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
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
                          navigate('/school/parent/notifications');
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

          {/* Full-Screen Search Modal Overlay */}
          {searchOpen && (
            <div
              className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/15 backdrop-blur-[2px] pt-[8vh] sm:pt-[10vh] px-4"
              onClick={() => setSearchOpen(false)}
            >
              <div
                ref={searchModalRef}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] flex flex-col max-h-[80vh]"
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search child report, communication, alerts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm sm:text-base font-bold text-slate-900 placeholder-slate-400 outline-none border-none py-1"
                  />
                  {searchQuery ? (
                    <button type="button" onClick={() => setSearchQuery('')} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors">
                      <span className="text-xs font-extrabold px-1.5">Clear</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-extrabold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-lg">ESC</span>
                  )}
                </div>

                {/* Quick Chips */}
                <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-50/30 border-b border-slate-100 overflow-x-auto text-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">Quick:</span>
                  {[
                    { label: '👶 Child Report', q: 'child' },
                    { label: '💬 Communication', q: 'communication' },
                    { label: '🔔 Alerts', q: 'alerts' },
                    { label: '📊 Dashboard', q: 'dashboard' },
                  ].map(({ label, q }) => (
                    <button key={q} onClick={() => setSearchQuery(q)} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-bold hover:bg-blue-100 transition-colors shrink-0">
                      {label}
                    </button>
                  ))}
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {searchQuery.length <= 1 ? (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Parent Portal Search</p>
                      <p className="text-xs text-slate-400">Find child reports, communication, alerts and more.</p>
                    </div>
                  ) : filteredParentPages.length > 0 ? (
                    <div>
                      <p className="px-2 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pages ({filteredParentPages.length})</p>
                      <div className="grid gap-1.5">
                        {filteredParentPages.map((page) => (
                          <Link
                            key={page.path}
                            to={page.path}
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                            className="flex items-center gap-3.5 rounded-2xl p-3 text-xs font-bold text-slate-800 hover:bg-blue-50/60 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <page.icon size={16} />
                            </div>
                            <span className="text-sm font-bold">{page.name}</span>
                            <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center space-y-2">
                      <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-1" />
                      <p className="text-sm font-bold text-slate-700">No results for "{searchQuery}"</p>
                      <p className="text-xs text-slate-400">Try searching for a report, alert, or message.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>

        <MaintenanceNotice />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="h-full w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
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
