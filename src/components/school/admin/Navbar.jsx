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
  CalendarDays
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { cn } from './Skeleton';
import api from '@/lib/api/school-client';
import { useSchoolNotification } from '@/context/SchoolNotificationContext';
import NotificationCenterModal from '@/components/school/NotificationCenterModal';

function pageTitle(pathname) {
  if (pathname === '/' || pathname.includes('dashboard')) return 'Dashboard';
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
  const title = pageTitle(location.pathname);
  const isInstitute = user?.role === 'INSTITUTE_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const roleName = isTeacher ? 'Teacher' : isInstitute ? 'Institute Admin' : 'Super Admin';
  const workspaceName = isTeacher ? user?.name || 'Teacher Workspace' : isInstitute ? institute?.name || 'Eddva Institute' : 'EDDVA HQ';
  const workspaceLabel = isTeacher ? 'Teaching Workspace' : isInstitute ? 'Active Workspace' : 'Super Admin Console';
  const messagesPath = isTeacher ? '/school/teacher/chat' : '/school/admin/communications';
  const profilePath = isTeacher ? '/school/teacher/profile' : '/school/admin/settings';

  const [theme, setTheme] = useState(() => localStorage.getItem('eddva-theme') || 'light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ students: [], teachers: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
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

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('eddva-theme', theme);
  }, [theme]);

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
      if (!searchRef.current?.contains(e.target)) setSearchOpen(false);
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
      if (!notifRef.current?.contains(e.target)) setNotifOpen(false);
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

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const teacherPages = [
        { name: 'Dashboard', path: '/school/teacher', icon: Sparkles },
        { name: 'Course Content', path: '/school/teacher/course-content', icon: GraduationCap },
        { name: 'Student Doubts', path: '/school/teacher/doubts', icon: MessageSquare },
        { name: 'My Schedule', path: '/school/teacher/classes', icon: Users },
        { name: 'Academic Calendar', path: '/school/teacher/calendar', icon: CalendarDays },
        { name: 'Assignments', path: '/school/teacher/assignments', icon: SettingsIcon },
        { name: 'Assessments', path: '/school/teacher/assessments', icon: SettingsIcon },
        { name: 'Meetings', path: '/school/teacher/meetings', icon: CalendarDays },
        { name: 'Reports', path: '/school/teacher/reports', icon: SettingsIcon },
      ];
      const adminPages = [
        { name: 'Dashboard', path: '/school/admin', icon: Sparkles },
        { name: 'Students List', path: '/school/admin/students', icon: GraduationCap },
        { name: 'Teachers Directory', path: '/school/admin/teachers', icon: Users },
        { name: 'System Settings', path: '/school/admin/settings', icon: SettingsIcon },
        { name: 'Academics & Classes', path: '/school/admin/academics', icon: SettingsIcon },
        { name: 'Subjects', path: '/school/admin/subjects', icon: SettingsIcon },
        { name: 'SMS Center', path: '/school/admin/sms-center', icon: SettingsIcon },
        { name: 'Email Center', path: '/school/admin/email-center', icon: SettingsIcon },
        { name: 'User Management', path: '/school/admin/users', icon: Users },
        { name: 'Audit Logs', path: '/school/admin/audit-logs', icon: FileText },
        { name: 'Support Tickets', path: '/school/admin/complaints', icon: Shield },
      ];
      const pages = (isTeacher ? teacherPages : adminPages).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (isTeacher) {
        setSearchResults({
          students: [], teachers: [], classes: [], sections: [],
          subjects: [], events: [], announcements: [], tickets: [],
          users: [], pages
        });
        return;
      }

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
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-6 py-3 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-xl p-2 text-surface-600 hover:bg-slate-50 md:hidden dark:text-slate-300 dark:hover:bg-slate-900" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="mt-0.5 text-lg font-bold tracking-tight leading-tight text-slate-950 dark:text-white">{title}</h1>
          </div>
        </div>

        <div className="hidden flex-1 justify-center lg:flex" ref={searchRef}>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3 pl-12 pr-12 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder={searchPlaceholder}
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-slate-100 bg-white px-2 py-1 text-[10px] font-bold tracking-tight text-slate-400 md:inline dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              Ctrl K
            </kbd>

            {/* Search Results Dropdown */}
            {searchOpen && searchQuery.length > 0 && (
              <div className="absolute top-full mt-3 w-full overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="max-h-[480px] overflow-y-auto p-2">
                  {isSearching && (
                    <div className="p-4 text-center text-xs font-bold text-slate-400 animate-pulse">Searching the intelligence engine...</div>
                  )}
                  
                  {searchResults.pages?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Navigation</p>
                      {searchResults.pages.map(page => (
                        <Link key={page.path} to={page.path} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                            <page.icon size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{page.name}</span>
                          <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-blue-600" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.students?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Students</p>
                      {searchResults.students.map(s => (
                        <Link key={s.id} to={`/school/admin/students/${s.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold tracking-tight">
                            {s.photo ? <img src={s.photo} className="w-full h-full object-cover rounded-xl" /> : s.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">ID: {s.enrollmentNo || 'No ID'} • {s.email}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.teachers?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Teachers</p>
                      {searchResults.teachers.map(t => (
                        <Link key={t.id} to={`/school/admin/teachers/${t.id}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold tracking-tight">
                            {t.photo ? <img src={t.photo} className="w-full h-full object-cover rounded-xl" /> : t.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">ID: {t.employeeId || 'No Emp ID'} • {t.email}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.classes?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Classes</p>
                      {searchResults.classes.map(c => (
                        <Link key={c.id} to="/school/admin/academics" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
                            <GraduationCap size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">Academic Year: {c.academicYear || '—'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.sections?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Sections</p>
                      {searchResults.sections.map(sec => (
                        <Link key={sec.id} to="/school/admin/academics" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                            <Users size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Section {sec.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">Class: {sec.className || '—'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.subjects?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Subjects</p>
                      {searchResults.subjects.map(sub => (
                        <Link key={sub.id} to="/school/admin/subjects" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                            <FileText size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{sub.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">Code: {sub.code || '—'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.events?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Events</p>
                      {searchResults.events.map(ev => (
                        <Link key={ev.id} to="/school/admin/calendar" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                            <Sparkles size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ev.title}</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : '—'} {ev.location ? `• ${ev.location}` : ''}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.announcements?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Announcements</p>
                      {searchResults.announcements.map(ann => (
                        <Link key={ann.id} to="/school/admin/notices" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                            <Bell size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{ann.title}</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Published: {ann.postedDate ? new Date(ann.postedDate).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.tickets?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">Support Tickets</p>
                      {searchResults.tickets.map(t => (
                        <Link key={t.id} to="/school/admin/complaints" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center">
                            <MessageCircle size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.title}</span>
                            <span className="text-[10px] font-bold text-slate-400">Status: {t.status}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.users?.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-bold tracking-tight uppercase tracking-widest text-slate-400">User Accounts</p>
                      {searchResults.users.map(u => (
                        <Link key={u.id} to="/school/admin/users" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold tracking-tight">
                            {u.photo ? <img src={u.photo} className="w-full h-full object-cover rounded-xl" /> : u.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{u.name} ({u.role?.replace('_', ' ')})</span>
                            <span className="text-[10px] font-bold text-slate-400">{u.email} • {u.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {!isSearching && !hasResults && (
                    <div className="p-8 text-center">
                      <Search className="mx-auto h-8 w-8 text-slate-200 mb-3" />
                      <p className="text-sm font-bold text-slate-400 italic">No matching records found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              <div className="relative">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-4 w-64 overflow-hidden rounded-[2rem] border border-slate-100 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {/* Profile Header */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
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

                {/* Dark Mode toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </div>
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

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
      <NotificationCenterModal
        isOpen={notifCenterOpen}
        onClose={() => setNotifCenterOpen(false)}
        currentUser={user}
        onUpdate={fetchUnreadCount}
      />
    </header>
  );
}
