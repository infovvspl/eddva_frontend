import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  Moon,
  Radio,
  Search,
  Settings,
  Sun,
  Target,
  Trophy,
  UserCheck,
  UserCircle,
  Video,
  Loader2,
  CheckCheck,
  Inbox,
  KeyRound
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import api from '@/lib/api/school-client';
import { cn } from '@/components/school/admin/Skeleton';
import { createNotificationSocket } from '@/lib/notification-socket';
import { useSchoolNotification } from '@/context/SchoolNotificationContext';

const pageTitles = {
  '/school/student': 'Dashboard',
  '/school/student/live-classes': 'Live Classes',
  '/school/student/recorded-classes': 'Recorded Classes',
  '/school/student/classes': 'My Learning',
  '/school/student/study-materials': 'Study Materials',
  '/school/student/assignments': 'Assignments',
  '/school/student/assessments': 'Assessments',
  '/school/student/attendance': 'Attendance',
  '/school/student/analytics': 'Performance Analytics',
  '/school/student/doubts': 'My Doubts',

  '/school/student/gamification': 'Gamification',
  '/school/student/battle-arena': 'Battle Arena',
  '/school/student/timetable': 'Timetable',
  '/school/student/calendar': 'Calendar',
  '/school/student/announcements': 'Announcements',
  '/school/student/chat': 'Communication Center',
  '/school/student/profile': 'Profile',
  '/school/student/settings': 'Settings',
};

const studentPages = [
  { name: 'Dashboard', path: '/school/student', icon: Target, keywords: 'home overview academics notifications' },
  { name: 'Live Classes', path: '/school/student/live-classes', icon: Radio, keywords: 'join class attendance polls quizzes raise hand' },
  { name: 'Recorded Classes', path: '/school/student/recorded-classes', icon: Video, keywords: 'videos resume watch progress' },
  { name: 'Study Materials', path: '/school/student/study-materials', icon: BookOpen, keywords: 'notes pdf ppt videos question bank offline' },
  { name: 'Assignments', path: '/school/student/assignments', icon: FileText, keywords: 'homework upload feedback marks due date' },
  { name: 'Assessments', path: '/school/student/assessments', icon: ClipboardList, keywords: 'tests exams practice mock result timer' },
  { name: 'Attendance', path: '/school/student/attendance', icon: UserCheck, keywords: 'attendance leaves absence records presence' },
  { name: 'Performance Analytics', path: '/school/student/analytics', icon: BarChart3, keywords: 'reports progress weak areas accuracy time' },
  { name: 'Ask a Doubt', path: '/school/student/doubts', icon: BrainCircuit, keywords: 'doubt question teacher ai help homework' },

  { name: 'Gamification', path: '/school/student/gamification', icon: Trophy, keywords: 'xp badges achievements leaderboards certificates' },
  { name: 'Timetable', path: '/school/student/timetable', icon: CalendarDays, keywords: 'schedule classes periods timetable' },
  { name: 'Calendar', path: '/school/student/calendar', icon: CalendarDays, keywords: 'events holidays schedule academic calendar' },
  { name: 'Announcements', path: '/school/student/announcements', icon: Megaphone, keywords: 'notice exam holiday teacher message' },
  { name: 'Profile', path: '/school/student/profile', icon: UserCircle, keywords: 'student id roll class section parent security' },
  { name: 'Settings', path: '/school/student/settings', icon: Settings, keywords: 'password devices notification theme sessions' },
];

function pageTitle(pathname, state) {
  if (/^\/school\/student\/study-materials\/[^/]+$/.test(pathname)) return state?.materialTypeLabel || 'Material';
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles)
    .sort(([a], [b]) => b.length - a.length)
    .find(([path]) => pathname.startsWith(`${path}/`));
  if (match) return match[1];
  return pathname
    .split('/')
    .filter(Boolean)
    .pop()
    ?.split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Student Portal';
}

const getStudentFallbackUrl = (n) => {
  if (n.actionUrl) return n.actionUrl;
  const type = (n.type || '').toLowerCase();
  const title = (n.title || '').toLowerCase();

  if (type.includes('announcement') || title.includes('announcement') || title.includes('notice')) {
    return '/school/student/announcements';
  }
  if (type.includes('assignment') || type.includes('submission') || title.includes('assignment')) {
    return '/school/student/assignments';
  }
  if (type.includes('assessment') || type.includes('result') || title.includes('assessment') || title.includes('test') || title.includes('exam')) {
    return '/school/student/assessments';
  }
  if (type.includes('live') || type.includes('class') || title.includes('class') || title.includes('timetable') || title.includes('schedule')) {
    return '/school/student/live-classes';
  }
  if (type.includes('material') || title.includes('material') || title.includes('study')) {
    return '/school/student/study-materials';
  }
  if (type.includes('attendance') || title.includes('attendance') || title.includes('absent')) {
    return '/school/student/attendance';
  }
  return '/school/student';
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, institute, logout } = useAuth();
  const title = pageTitle(location.pathname, location.state);

  const [theme, setTheme] = useState(() => localStorage.getItem('eddva-theme') || 'light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchModalRef = useRef(null);

  // Notification states from context
  const {
    unreadCount,
    notifications,
    setUnreadCount,
    setNotifications,
    fetchNotifications
  } = useSchoolNotification();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('eddva-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (notifOpen && notifications.length === 0) {
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
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
      if (!notifRef.current?.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
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
  const filteredPages = normalizedQuery
    ? studentPages.filter((page) => `${page.name} ${page.keywords}`.toLowerCase().includes(normalizedQuery))
    : [];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 py-3 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between gap-3 sm:gap-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2 text-surface-600 hover:bg-slate-50 md:hidden dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="mt-0.5 text-lg font-bold tracking-tight leading-tight text-slate-950 dark:text-white">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search icon — visible on all screen sizes */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <div className="relative flex items-center gap-2" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold tracking-tight text-white border border-white dark:border-slate-950">
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
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) {
                            handleMarkAsRead(n.id);
                          }
                          const targetUrl = getStudentFallbackUrl(n);
                          if (targetUrl) {
                            navigate(targetUrl);
                          }
                          setNotifOpen(false);
                        }}
                        className={cn(
                          "group relative flex items-start gap-3 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 dark:border-slate-800/40 dark:hover:bg-slate-800/40 cursor-pointer transition-colors",
                          !n.isRead && "bg-blue-50/20 dark:bg-blue-900/10"
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
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                            : n.type === 'SUCCESS'
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        )}>
                          <Bell size={14} className={cn(!n.isRead && "animate-wiggle")} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-[11px] font-bold text-slate-900 dark:text-white truncate", !n.isRead && "font-extrabold")}>
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
                      navigate('/school/student/notifications');
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
              <div className="relative">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user?.name || 'Student'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<div class="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-300">${(user?.name || 'S').charAt(0).toUpperCase()}</div>`;
                    }}
                    className="h-10 w-10 rounded-2xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {(user?.name || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-4 w-64 overflow-hidden rounded-[2rem] border border-slate-100 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {/* Profile Header */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Student'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Student Portal</p>
                </div>

                {/* My Profile Link */}
                <Link
                  to="/school/student/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <UserCircle size={16} />
                  </div>
                  My Profile
                </Link>

                {/* Settings Link */}
                <Link
                  to="/school/student/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <Settings size={16} />
                  </div>
                  Settings
                </Link>

                {/* Change Password Link */}
                <Link
                  to="/school/student/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <KeyRound size={16} />
                  </div>
                  Change Password
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
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/15 backdrop-blur-[2px] pt-[8vh] sm:pt-[10vh] px-4 animate-in fade-in duration-150"
          onClick={() => setSearchOpen(false)}
        >
          <div
            ref={searchModalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] flex flex-col max-h-[80vh]"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search classes, assignments, tests, study materials, doubts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm sm:text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none border-none py-1"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  <span className="text-xs font-extrabold px-1.5">Clear</span>
                </button>
              ) : (
                <span className="text-[10px] font-extrabold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">ESC</span>
              )}
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-50/30 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">Quick:</span>
              {[
                { label: '📚 Classes', q: 'classes' },
                { label: '📝 Assignments', q: 'assignments' },
                { label: '📋 Tests', q: 'assessments' },
                { label: '📖 Study Materials', q: 'study materials' },
                { label: '🤔 Doubts', q: 'doubt' },
                { label: '🏆 Gamification', q: 'gamification' },
              ].map(({ label, q }) => (
                <button
                  key={q}
                  onClick={() => setSearchQuery(q)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 transition-colors shrink-0"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {searchQuery.length <= 1 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center mx-auto">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Student Portal Search</p>
                  <p className="text-xs text-slate-400">Find classes, assignments, study materials, doubts, and more.</p>
                </div>
              ) : filteredPages.length > 0 ? (
                <div>
                  <p className="px-2 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pages ({filteredPages.length})</p>
                  <div className="grid gap-1.5">
                    {filteredPages.map((page) => (
                      <Link
                        key={page.path}
                        to={page.path}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3.5 rounded-2xl p-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
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
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No results for "{searchQuery}"</p>
                  <p className="text-xs text-slate-400">Try searching for a class, assignment, subject or feature.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
