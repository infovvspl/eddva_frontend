import React, { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Outlet, NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
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
  ChevronRight,
  ArrowLeft,
  X,
  Clock,
  TrendingUp,
  Plus,
  BarChart3,
  ClipboardList
} from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import { useSchoolFeature } from "@/hooks/use-school-feature";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import { InstituteLogo } from "@/components/school/admin/Brand";
import { cn } from "@/lib/utils";
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
  const { user, institute, logout } = useAuth();
  const isMobile = useIsMobile();
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

  const mobileNavItems = [
    { label: "Dashboard", path: "/school/parent/dashboard", icon: Home },
    ...(hasReports ? [{ label: "Report", path: "/school/parent/child", icon: GraduationCap }] : []),
    ...(hasChat ? [{ label: "Chat", path: "/school/parent/communication", icon: MessageCircle }] : []),
    { label: "Alerts", path: "/school/parent/notifications", icon: Bell, badge: unreadCount },
    { label: "Profile", path: "/school/parent/profile", icon: UserCircle },
  ];

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (name: string) => {
    if (!name || !name.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter(x => x.name.toLowerCase() !== name.toLowerCase());
      const updated = [{ name }, ...filtered].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const context = useMemo(() => {
    if (location.pathname.includes('/child')) {
      return {
        module: 'Child Performance',
        suggestions: [
          { label: 'Child Performance Analytics', path: '/school/parent/child', icon: GraduationCap },
          { label: 'Child Attendance Records', path: '/school/parent/child', icon: ClipboardList }
        ],
        trending: [
          { label: 'Child Weekly Grades', q: 'child' },
          { label: 'Attendance reports', q: 'child' }
        ]
      };
    }
    if (location.pathname.includes('/communication') || location.pathname.includes('/notifications')) {
      return {
        module: 'Communication & Alerts',
        suggestions: [
          { label: 'Chat with Teachers', path: '/school/parent/communication', icon: MessageCircle },
          { label: 'Alerts & Notifications', path: '/school/parent/notifications', icon: Bell }
        ],
        trending: [
          { label: 'Direct Messages to Teacher', q: 'communication' },
          { label: 'School circular updates', q: 'notifications' }
        ]
      };
    }
    return {
      module: 'Parent Dashboard',
      suggestions: [
        { label: 'Parent Dashboard', path: '/school/parent/dashboard', icon: Home },
        { label: 'Child Performance Analytics', path: '/school/parent/child', icon: GraduationCap },
        { label: 'Chat with Teachers', path: '/school/parent/communication', icon: MessageCircle }
      ],
      trending: [
        { label: 'Child progress cards', q: 'child' },
        { label: 'Circular notification logs', q: 'notifications' }
      ]
    };
  }, [location.pathname]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setDropdownOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 150);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



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

      <div 
        className={`flex min-w-0 flex-1 flex-col overflow-hidden ${sidebarOpen && isMobile ? 'pointer-events-none' : ''}`}
        inert={sidebarOpen && isMobile ? "" : undefined}
      >
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {!isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-xl p-2 text-slate-600 hover:bg-slate-50 md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}
              {isMobile ? (
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 shrink-0 border border-slate-100 dark:border-slate-800">
                    <InstituteLogo institute={institute} size="sm" className="h-7 w-7 object-contain" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white truncate max-w-[145px]">
                    {user?.tenantName || institute?.name || 'EDDVA Parent'}
                  </span>
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Parent Workspace</p>
                  <h1 className="truncate text-lg font-bold tracking-tight text-slate-950">{pageTitle}</h1>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Search Section */}
              <div className="relative flex items-center" ref={searchRef}>
                {isMobile && searchOpen ? (
                  <div className="fixed inset-x-0 top-0 h-16 bg-white z-50 flex items-center px-4 gap-3 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchOpen(false);
                        setDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className="p-1 rounded-lg text-slate-505 hover:text-slate-800 shrink-0"
                      aria-label="Back"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 flex items-center bg-slate-100/80 rounded-xl px-3 py-1.5 border border-slate-200/60">
                      <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setDropdownOpen(true);
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        className="bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none border-none w-full"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                          className="p-0.5 rounded-lg text-slate-400 hover:text-slate-650"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`flex items-center rounded-xl transition-all duration-300 ease-in-out ${searchOpen ? 'w-48 sm:w-64 md:w-80 bg-slate-100/80 px-3 py-1.5 border border-slate-200/60' : 'w-0 overflow-hidden border-transparent'}`}>
                      <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setDropdownOpen(true);
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        className="bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none border-none w-full"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                          className="p-0.5 rounded-lg text-slate-400 hover:text-slate-605"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextState = !searchOpen;
                        setSearchOpen(nextState);
                        if (!nextState) {
                          setDropdownOpen(false);
                          setSearchQuery('');
                        }
                      }}
                      className={`h-10 w-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 transition-all duration-200 ${searchOpen ? 'text-blue-600 bg-slate-100/50' : ''}`}
                      aria-label="Search"
                    >
                      <Search className="h-[18px] w-[18px]" />
                    </button>
                  </>
                )}

                {/* Dropdown Panel */}
                {searchOpen && dropdownOpen && (
                  <div className={cn(
                    "absolute top-full z-50 overflow-y-auto bg-white/95 backdrop-blur-md shadow-2xl p-4 custom-scrollbar",
                    isMobile
                      ? "fixed inset-x-0 bottom-0 top-16 w-full max-h-none border-t border-slate-100"
                      : "mt-2 right-0 w-[320px] sm:w-[420px] md:w-[485px] max-h-[440px] rounded-2xl border border-slate-200/80 animate-in slide-in-from-top-2 duration-150"
                  )}>
                    {searchQuery.length <= 1 ? (
                      <div className="space-y-4">
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Recent Searches</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setRecentSearches([]);
                                  localStorage.removeItem('recent_searches');
                                }}
                                className="text-[9px] font-black uppercase text-rose-500 hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="grid gap-1">
                              {recentSearches.map((s, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(s.name);
                                    searchInputRef.current?.focus();
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{s.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggestions Section */}
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">{context.module} Suggestions</span>
                          <div className="grid grid-cols-2 gap-2">
                            {context.suggestions.map((sug, i) => {
                              const Icon = sug.icon;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    navigate(sug.path);
                                    setSearchOpen(false);
                                    setDropdownOpen(false);
                                  }}
                                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-left text-xs font-bold text-slate-700 hover:bg-blue-50/50 hover:text-blue-600 transition-colors"
                                >
                                  <Icon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                  <span>{sug.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Trending Section */}
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Trending ({context.module})</span>
                          <div className="grid grid-cols-2 gap-2">
                            {context.trending.map((trend) => (
                              <button
                                key={trend.q}
                                type="button"
                                onClick={() => {
                                  setSearchQuery(trend.q);
                                  searchInputRef.current?.focus();
                                }}
                                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-left text-xs font-bold text-slate-750 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                              >
                                <TrendingUp className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <span>{trend.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : filteredParentPages.length > 0 ? (
                      <div>
                        <p className="px-2 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pages ({filteredParentPages.length})</p>
                        <div className="grid gap-1">
                          {filteredParentPages.map((page) => (
                            <Link
                              key={page.path}
                              to={page.path}
                              onClick={() => {
                                setSearchOpen(false);
                                setDropdownOpen(false);
                                saveRecentSearch(page.name);
                              }}
                              className="flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 hover:bg-blue-50/50 hover:text-blue-600 border border-transparent transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <page.icon size={15} />
                              </div>
                              <span className="text-xs font-bold">{page.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center space-y-2">
                        <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-700">No results for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                  <div className="absolute right-[-12px] sm:right-0 top-full mt-3.5 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[360px] sm:max-w-none overflow-hidden rounded-[2rem] border border-slate-100 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
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

              {!isMobile && (
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

                      {/* Log Out */}
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                          <LogOut size={16} />
                        </div>
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <MaintenanceNotice />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="h-full w-full">
            <Suspense fallback={
              <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            }>
              <Outlet />
            </Suspense>
          </div>
        </main>

        {/* Sticky Mobile Bottom Navigation Bar */}
        <nav className="flex md:hidden relative z-40 h-16 w-full shrink-0 items-center justify-around border-t border-slate-100 bg-white/95 px-2 pb-safe shadow-lg dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center justify-center w-14 h-full relative"
              >
                <div className="relative">
                  <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white border border-white dark:border-slate-900">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase mt-1 tracking-wider ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.label}
                </span>
                {isActive && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />}
              </Link>
            );
          })}
        </nav>
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
