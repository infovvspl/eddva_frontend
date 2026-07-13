import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  MessageCircle,
  MessageSquare,
  GraduationCap,
  Users,
  Settings as SettingsIcon,
  ChevronRight,
  FileText,
  Shield,
  CheckCheck,
  Inbox,
  Loader2,
  UserCircle,
  KeyRound,
  CalendarDays,
  Building2,
  TrendingUp
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { cn } from './Skeleton';
import api from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { useSchoolNotification } from '@/context/SchoolNotificationContext';

function pageTitle(pathname, state) {
  if (pathname === '/' || pathname.includes('dashboard')) return 'Dashboard';
  if (/^\/school\/teacher\/course-content\/materials\/[^/]+$/.test(pathname)) return state?.materialTypeLabel || 'Material';
  if (/\/school\/admin\/teachers\/[^/]+$/.test(pathname)) return 'Teacher Profile';
  if (/\/school\/admin\/students\/[^/]+$/.test(pathname)) return 'Student Profile';
  if (/\/school\/(?:super-)?admin\/institutes\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop();
    if (id !== 'new') return 'School Detail';
  }
  return pathname
    .split('/')
    .pop()
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const getAdminFallbackUrl = (n, isTeacher) => {
  if (n.actionUrl) return n.actionUrl;
  const type = (n.type || '').toLowerCase();
  const title = (n.title || '').toLowerCase();

  if (isTeacher) {
    if (type.includes('calendar') || type.includes('event') || title.includes('calendar') || title.includes('event')) {
      return '/school/teacher/calendar';
    }
    if (type.includes('assignment') || type.includes('submission') || title.includes('assignment')) {
      return '/school/teacher/assignments';
    }
    if (type.includes('assessment') || type.includes('result') || title.includes('assessment') || title.includes('test') || title.includes('exam')) {
      return '/school/teacher/assessments';
    }
    if (type.includes('live') || type.includes('class') || title.includes('class') || title.includes('timetable') || title.includes('schedule')) {
      return '/school/teacher/classes';
    }
    if (type.includes('attendance') || title.includes('attendance') || title.includes('absent')) {
      return '/school/teacher/attendance';
    }
    return '/school/teacher';
  } else {
    // Institute Admin or Super Admin
    if (type.includes('calendar') || type.includes('event') || title.includes('calendar') || title.includes('event')) {
      return '/school/admin/calendar';
    }
    if (type.includes('announcement') || title.includes('announcement') || title.includes('notice')) {
      return '/school/admin/notices';
    }
    if (type.includes('assignment') || type.includes('submission') || title.includes('assignment')) {
      return '/school/admin/assignments';
    }
    if (type.includes('attendance') || title.includes('attendance') || title.includes('absent')) {
      return '/school/admin/attendance';
    }
    if (type.includes('timetable') || title.includes('schedule') || type.includes('live')) {
      return '/school/admin/timetable';
    }
    return '/school/admin';
  }
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, institute, logout } = useAuth();
  const title = pageTitle(location.pathname, location.state);
  const isInstitute = user?.role === 'INSTITUTE_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const roleName = isTeacher ? 'Teacher' : isInstitute ? 'Institute Admin' : 'Super Admin';
  const workspaceName = isTeacher ? user?.name || 'Teacher Workspace' : isInstitute ? institute?.name || 'Eddva Institute' : 'EDDVA HQ';
  const workspaceLabel = isTeacher ? 'Teaching Workspace' : isInstitute ? 'Active Workspace' : 'Super Admin Console';
  const messagesPath = isTeacher ? '/school/teacher/chat' : '/school/admin/communications';
  const profilePath = isTeacher ? '/school/teacher/profile' : isSuperAdmin ? '/school/super-admin/settings' : '/school/admin/settings';

  const [theme, setTheme] = useState('light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ students: [], teachers: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [schoolName, setSchoolName] = useState('');
  const instMatch = location.pathname.match(/\/school\/(?:super-)?admin\/institutes\/([^/]+)/);
  const pathInstituteId = instMatch && instMatch[1] !== 'new' && instMatch[1] !== 'edit' ? instMatch[1] : null;

  useEffect(() => {
    if (pathInstituteId) {
      apiClient.get(`/school/institutes/${pathInstituteId}`)
        .then((res) => {
          const data = res.data?.data ?? res.data;
          if (data && data.name) {
            setSchoolName(data.name);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch school name in navbar:", err);
        });
    } else {
      setSchoolName('');
    }
  }, [pathInstituteId]);

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

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('eddva-theme', 'light');
  }, []);

  useEffect(() => {
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen]);

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

  const handleMarkAsRead = async (id) => {
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

  useEffect(() => {
    function onDocClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch();
      } else {
        setSearchResults({
          students: [], teachers: [], classes: [], sections: [],
          subjects: [], events: [], announcements: [], tickets: [],
          users: [], pages: []
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const teacherPages = [
        { name: 'Dashboard', path: '/school/teacher', icon: Sparkles },
        { name: 'Course Content', path: '/school/teacher/course-content', icon: GraduationCap },
        { name: 'My Schedule', path: '/school/teacher/classes', icon: Users },
        { name: 'Attendance', path: '/school/teacher/attendance', icon: CalendarDays },
        { name: 'Timetable', path: '/school/teacher/timetable', icon: CalendarDays },
        { name: 'Academic Calendar', path: '/school/teacher/calendar', icon: CalendarDays },
        { name: 'Student Doubts', path: '/school/teacher/doubts', icon: MessageSquare },
        { name: 'Assignments', path: '/school/teacher/assignments', icon: FileText },
        { name: 'Assessments', path: '/school/teacher/assessments', icon: CalendarDays },
        { name: 'Meetings', path: '/school/teacher/meetings', icon: CalendarDays },
        { name: 'Reports', path: '/school/teacher/reports', icon: SettingsIcon },
        { name: 'Announcements', path: '/school/teacher/announcements', icon: MessageSquare },
        { name: 'Chat', path: '/school/teacher/chat', icon: MessageSquare },
        { name: 'Grievances', path: '/school/teacher/grievances', icon: Shield },
        { name: 'Profile', path: '/school/teacher/profile', icon: Users },
        { name: 'Settings', path: '/school/teacher/settings', icon: SettingsIcon },
      ];
      const adminPages = [
        { name: 'Dashboard', path: '/school/admin', icon: Sparkles },
        { name: 'Students List', path: '/school/admin/students', icon: GraduationCap },
        { name: 'Teachers Directory', path: '/school/admin/teachers', icon: Users },
        { name: 'Administrators', path: '/school/admin/admins', icon: Shield },
        { name: 'System Settings', path: '/school/admin/settings', icon: SettingsIcon },
        { name: 'Academics & Classes', path: '/school/admin/academics', icon: SettingsIcon },
        { name: 'Subjects', path: '/school/admin/subjects', icon: SettingsIcon },
        { name: 'SMS Center', path: '/school/admin/sms-center', icon: SettingsIcon },
        { name: 'Email Center', path: '/school/admin/email-center', icon: SettingsIcon },
        { name: 'User Management', path: '/school/admin/users', icon: Users },
        { name: 'Audit Logs', path: '/school/admin/audit-logs', icon: FileText },
        { name: 'Support Tickets', path: '/school/admin/complaints', icon: Shield },
      ];
      // Super Admin has its own set of pages under /school/super-admin/
      const superAdminPages = [
        { name: 'Dashboard', path: '/school/super-admin', icon: Sparkles },
        { name: 'Institutes', path: '/school/super-admin/institutes', icon: Building2 },
        { name: 'Add New Institute', path: '/school/super-admin/institutes/new', icon: Building2 },
        { name: 'Support Tickets', path: '/school/super-admin/complaints', icon: Shield },
        { name: 'Communications', path: '/school/super-admin/communications', icon: MessageCircle },
        { name: 'Analytics', path: '/school/super-admin/analytics', icon: TrendingUp },
        { name: 'Security Center', path: '/school/super-admin/security', icon: Shield },
        { name: 'Audit Logs', path: '/school/super-admin/audit-logs', icon: FileText },
        { name: 'Settings', path: '/school/super-admin/settings', icon: SettingsIcon },
        { name: 'AI Usage', path: '/school/super-admin/ai-usage', icon: Sparkles },
        { name: 'User Management', path: '/school/super-admin/users', icon: Users },
      ];
      const pageList = isTeacher ? teacherPages : isSuperAdmin ? superAdminPages : adminPages;
      const pages = pageList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      const data = res.data?.data || res.data || {};

      setSearchResults({
        students: data.students || [],
        teachers: data.teachers || [],
        classes: data.classes || [],
        sections: data.sections || [],
        subjects: data.subjects || [],
        events: data.events || [],
        announcements: data.announcements || [],
        tickets: data.tickets || [],
        users: data.users || [],
        pages
      });
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const searchPlaceholder = useMemo(
    () =>
      isTeacher
        ? 'Search lessons, classes, assignments, reports'
        : isInstitute
          ? 'Search students, classes, teachers, reports'
          : 'Search institutes, tickets, or activity',
    [isInstitute, isTeacher]
  );

  const hasResults =
    searchResults.pages?.length > 0 ||
    searchResults.students?.length > 0 ||
    searchResults.teachers?.length > 0 ||
    searchResults.classes?.length > 0 ||
    searchResults.sections?.length > 0 ||
    searchResults.subjects?.length > 0 ||
    searchResults.events?.length > 0 ||
    searchResults.announcements?.length > 0 ||
    searchResults.tickets?.length > 0 ||
    searchResults.users?.length > 0;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/50 dark:border-slate-800 bg-white/75 dark:bg-slate-905/75 backdrop-blur-md px-4 sm:px-6 py-3 shadow-[0_2px_12px_-3px_rgba(37,99,235,0.03)]">
      <div className="flex items-center justify-between gap-3 sm:gap-8">
        {/* Left Side: Mobile Menu Trigger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenuClick} className="rounded-xl p-2 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 md:hidden flex-shrink-0" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="mt-0.5 text-lg font-bold tracking-tight leading-tight text-slate-900 dark:text-white truncate">{schoolName || title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">

          {/* Search Icon Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearchOpen((prev) => !prev);
            }}
            className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100/75 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all duration-200"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* Notifications Icon & Popover */}
          <div className="relative flex items-center" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative h-10 w-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100/75 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold tracking-tight text-white border border-white dark:border-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-[-70px] sm:right-0 top-full mt-3.5 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[360px] sm:max-w-none overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-905 py-2 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-105 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <p className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold mt-0.5">
                      {unreadCount} unread messages
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
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
                      <Inbox className="h-8 w-8 text-slate-305 dark:text-slate-700 mb-2" />
                      <p className="text-xs font-bold text-slate-400">All caught up!</p>
                      <p className="text-[10px] text-slate-400/80 mt-1">No new alerts found.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) {
                            handleMarkAsRead(n.id);
                          }
                          const targetUrl = getAdminFallbackUrl(n, isTeacher);
                          if (targetUrl) {
                            navigate(targetUrl);
                          }
                          setNotifOpen(false);
                        }}
                        className={cn(
                          "group relative flex items-start gap-3 px-5 py-4 border-b border-slate-50 dark:border-slate-850/40 last:border-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors",
                          !n.isRead && "bg-blue-50/20 dark:bg-blue-950/10"
                        )}
                      >
                        {/* Dot indicator */}
                        {!n.isRead && (
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}

                        {/* Icon based on type */}
                        <div className={cn(
                          "w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold",
                          n.type === 'ALERT' || n.type === 'CRITICAL'
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-450"
                            : n.type === 'SUCCESS'
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-450"
                        )}>
                          <Bell size={14} className={cn(!n.isRead && "animate-wiggle")} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-[11px] font-bold text-slate-900 dark:text-white truncate", !n.isRead && "font-extrabold")}>
                            {n.title}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-450 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[8px] font-bold text-slate-405 dark:text-slate-500 tracking-tight uppercase block mt-1.5">
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
                      const target = user?.role === 'SUPER_ADMIN'
                        ? '/school/super-admin/notifications'
                        : isTeacher
                          ? '/school/teacher/notifications'
                          : '/school/admin/notifications';
                      navigate(target);
                      setNotifOpen(false);
                    }}
                    className="w-full text-center text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    View All Notifications →
                  </button>
                </div>
              </div>
            )}
          </div>



          {/* User Profile Avatar & Dropdown */}
          <div className="relative border-l border-slate-250 dark:border-slate-800 pl-3.5 ml-1.5" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 outline-none group"
              aria-label="User Profile menu"
            >
              <div className="relative transition-transform duration-200 group-hover:scale-105">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-sm font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-350">
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-sm" />
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-4 w-64 overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 shadow-2xl">
                {/* Profile Header */}
                <div className="px-5 py-3 border-b border-slate-105 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{roleName}</p>
                </div>

                {/* Profile Link (Teachers Only) */}
                {isTeacher && (
                  <Link
                    to="/school/teacher/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                      <UserCircle size={16} />
                    </div>
                    My Profile
                  </Link>
                )}

                {/* Institute Profile link (Institute Admin) */}
                {isInstitute && (
                  <Link
                    to="/school/admin/institute-profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                      <Building2 size={16} />
                    </div>
                    Institute Profile
                  </Link>
                )}

                {/* My Profile link (Institute Admin) */}
                {isInstitute && (
                  <Link
                    to="/school/admin/settings?tab=profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center">
                      <UserCircle size={16} />
                    </div>
                    My Profile
                  </Link>
                )}

                {/* Settings link */}
                <Link
                  to={isTeacher ? "/school/teacher/settings" : profilePath}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <SettingsIcon size={16} />
                  </div>
                  Settings
                </Link>

                {/* Change Password (Teachers Only) */}
                {isTeacher && (
                  <Link
                    to="/school/teacher/settings?tab=security"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                      <KeyRound size={16} />
                    </div>
                    Change Password
                  </Link>
                )}



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

        {/* Search Modal Overlay */}
        {searchOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/15 backdrop-blur-[2px] pt-[8vh] sm:pt-[10vh] px-4 animate-in fade-in duration-150"
            onClick={() => setSearchOpen(false)}
          >
            <div
              ref={searchRef}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] transition-all duration-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
            >
              {/* Search Input Header Bar */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs border border-blue-100 dark:border-blue-900/40">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  autoFocus
                  placeholder="Type to search students, teachers, classes, subjects, notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none border-none py-1"
                />
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 shrink-0" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-xs font-extrabold px-1.5">Clear</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-extrabold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg shadow-xs">ESC</span>
                  </div>
                )}
              </div>

              {/* Quick Suggestion Chips — role-aware */}
              <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-50/30 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto custom-scrollbar text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">Quick Options:</span>
                {isSuperAdmin ? (
                  <>
                    <button
                      onClick={() => setSearchQuery('Institutes')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 transition-colors shrink-0"
                    >
                      🏫 Institutes
                    </button>
                    <button
                      onClick={() => setSearchQuery('Support Tickets')}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold hover:bg-amber-100 transition-colors shrink-0"
                    >
                      🎟️ Support Tickets
                    </button>
                    <button
                      onClick={() => setSearchQuery('Analytics')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100 transition-colors shrink-0"
                    >
                      📊 Analytics
                    </button>
                    <button
                      onClick={() => setSearchQuery('Settings')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold hover:bg-slate-200 transition-colors shrink-0"
                    >
                      ⚙️ Settings
                    </button>
                  </>
                ) : isTeacher ? (
                  <>
                    <button
                      onClick={() => setSearchQuery('My Schedule')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 transition-colors shrink-0"
                    >
                      📅 My Schedule
                    </button>
                    <button
                      onClick={() => setSearchQuery('Timetable')}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold hover:bg-amber-100 transition-colors shrink-0"
                    >
                      🗓️ Timetable
                    </button>
                    <button
                      onClick={() => setSearchQuery('Assignments')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold hover:bg-indigo-100 transition-colors shrink-0"
                    >
                      📝 Assignments
                    </button>
                    <button
                      onClick={() => setSearchQuery('Student Doubts')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100 transition-colors shrink-0"
                    >
                      🤔 Student Doubts
                    </button>
                    <button
                      onClick={() => setSearchQuery('Attendance')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 transition-colors shrink-0"
                    >
                      ✅ Attendance
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSearchQuery('Student')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold hover:bg-indigo-100 transition-colors shrink-0"
                    >
                      🎓 Students
                    </button>
                    <button
                      onClick={() => setSearchQuery('Teacher')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100 transition-colors shrink-0"
                    >
                      👥 Faculty
                    </button>
                    <button
                      onClick={() => setSearchQuery('Class')}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[11px] font-bold hover:bg-amber-100 transition-colors shrink-0"
                    >
                      🏫 Classes
                    </button>
                    <button
                      onClick={() => setSearchQuery('Notice')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-100 transition-colors shrink-0"
                    >
                      📢 Notices
                    </button>
                  </>
                )}
              </div>

              {/* Search Results Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
                {searchQuery.length <= 1 ? (
                  <div className="py-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                      <Search className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Global System Search</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Find students, teachers, classes, subjects, notices or tickets across your institute.</p>
                    </div>
                  </div>
                ) : isSearching ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Searching institute database...</p>
                  </div>
                ) : !hasResults ? (
                  <div className="py-10 text-center space-y-2">
                    <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matches found for "{searchQuery}"</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Check your spelling or try searching for a different keyword.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Pages Category */}
                    {searchResults.pages?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Navigation Pages</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{searchResults.pages.length}</span>
                        </div>
                        <div className="grid gap-1.5">
                          {searchResults.pages.map((page, i) => (
                            <button
                              key={`p-${i}`}
                              onClick={() => {
                                navigate(page.path);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3.5 rounded-2xl p-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                                <page.icon size={16} />
                              </div>
                              <span className="text-sm font-bold">{page.name}</span>
                              <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Students Category */}
                    {searchResults.students?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Students ({searchResults.students.length})</span>
                        </div>
                        <div className="grid gap-1.5">
                          {searchResults.students.map((student) => (
                            <button
                              key={`s-${student.id}`}
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher/course-content' : `/school/admin/students/${student.id}`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3.5 rounded-2xl p-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                                <GraduationCap size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate">{student.name}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">Roll: {student.rollNo || 'N/A'} Ã‚Â· Class: {student.class?.name || 'N/A'}</p>
                              </div>
                              <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Teachers Category */}
                    {searchResults.teachers?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Faculty & Teachers ({searchResults.teachers.length})</span>
                        </div>
                        <div className="grid gap-1.5">
                          {searchResults.teachers.map((teacher) => (
                            <button
                              key={`t-${teacher.id}`}
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher' : `/school/admin/teachers/${teacher.id}`);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3.5 rounded-2xl p-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                                <Users size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-emerald-600">{teacher.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">Emp ID: {teacher.employeeId || 'N/A'} · Email: {teacher.email || 'N/A'}</p>
                              </div>
                              <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Classes Category */}
                    {searchResults.classes?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Academic Classes ({searchResults.classes.length})</span>
                        </div>
                        <div className="grid gap-1.5">
                          {searchResults.classes.map((cls) => (
                            <button
                              key={`c-${cls.id}`}
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher/classes' : isSuperAdmin ? '/school/super-admin/institutes' : '/school/admin/academics');
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3.5 rounded-2xl p-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                                <GraduationCap size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-amber-600">{cls.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">Academic Year: {cls.academicYear || '2026-2027'}</p>
                              </div>
                              <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subjects Category */}
                    {searchResults.subjects?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">Subjects ({searchResults.subjects.length})</span>
                        </div>
                        <div className="grid gap-1.5">
                          {searchResults.subjects.map((sub) => (
                            <button
                              key={`sub-${sub.id}`}
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher/course-content' : isSuperAdmin ? '/school/super-admin/institutes' : '/school/admin/subjects');
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3.5 rounded-2xl p-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 border border-transparent hover:border-purple-100 dark:hover:border-purple-900/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0 shadow-xs">
                                <Sparkles size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-purple-600">{sub.name}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">Subject Code: {sub.code || 'N/A'}</p>
                              </div>
                              <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Announcements / Notices Category */}
                    {searchResults.announcements?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Notices ({searchResults.announcements.length})</span>
                        </div>
                        <div className="grid gap-1.5">
                          {searchResults.announcements.map((notice) => (
                            <button
                              key={`n-${notice.id}`}
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher' : isSuperAdmin ? '/school/super-admin/communications' : '/school/admin/notices');
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3.5 rounded-2xl p-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                                <FileText size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-rose-600">{notice.title}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">Posted: {new Date(notice.postedDate || Date.now()).toLocaleDateString()}</p>
                              </div>
                              <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-rose-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Support Tickets Category */}
                    {searchResults.tickets?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Tickets ({searchResults.tickets.length})</span>
                        </div>
                        <div className="grid gap-1.5">
                          {searchResults.tickets.map((ticket) => (
                            <button
                              key={`tk-${ticket.id}`}
                              onClick={() => {
                                navigate(isSuperAdmin ? '/school/super-admin/complaints' : '/school/admin/complaints');
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3.5 rounded-2xl p-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/30 hover:text-cyan-600 dark:hover:text-cyan-400 border border-transparent hover:border-cyan-100 dark:hover:border-cyan-900/30 transition-all group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center shrink-0 shadow-xs">
                                <Shield size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-slate-900 dark:text-white group-hover:text-cyan-600">{ticket.title}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">Status: {ticket.status}</p>
                              </div>
                              <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-cyan-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
