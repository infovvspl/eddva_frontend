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
  GraduationCap,
  Users,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { cn } from './Skeleton';
import api from '@/lib/api/school-client';

function pageTitle(pathname) {
  if (pathname === '/' || pathname.includes('dashboard')) return 'Dashboard';
  return pathname
    .split('/')
    .pop()
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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
  const [quickOpen, setQuickOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ students: [], teachers: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  const quickRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('eddva-theme', theme);
  }, [theme]);

  useEffect(() => {
    function onDocClick(e) {
      if (!quickRef.current?.contains(e.target)) setQuickOpen(false);
      if (!searchRef.current?.contains(e.target)) setSearchOpen(false);
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
        setSearchResults({ students: [], teachers: [], pages: [] });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      // Internal page matching
      const teacherPages = [
        { name: 'Dashboard', path: '/school/teacher', icon: Sparkles },
        { name: 'Course Content', path: '/school/teacher/topics', icon: GraduationCap },
        { name: 'My Schedule', path: '/school/teacher/classes', icon: Users },
        { name: 'Assignments', path: '/school/teacher/assignments', icon: SettingsIcon },
        { name: 'Assessments', path: '/school/teacher/assessments', icon: SettingsIcon },
        { name: 'Reports', path: '/school/teacher/reports', icon: SettingsIcon },
      ];
      const adminPages = [
        { name: 'Dashboard', path: '/school/admin', icon: Sparkles },
        { name: 'Students List', path: '/school/admin/students', icon: GraduationCap },
        { name: 'Teachers Directory', path: '/school/admin/teachers', icon: Users },
        { name: 'Fees Management', path: '/school/admin/fees', icon: SettingsIcon },
        { name: 'System Settings', path: '/school/admin/settings', icon: SettingsIcon },
        { name: 'Academics & Classes', path: '/school/admin/academics', icon: SettingsIcon },
        { name: 'Subjects', path: '/school/admin/subjects', icon: SettingsIcon },
        { name: 'Assignments & Homework', path: '/school/admin/assignments', icon: SettingsIcon },
        { name: 'Study Materials', path: '/school/admin/study-materials', icon: SettingsIcon },
        { name: 'Syllabus Tracking', path: '/school/admin/syllabus', icon: SettingsIcon },
        { name: 'Exams', path: '/school/admin/exams', icon: SettingsIcon },
        { name: 'Question Bank', path: '/school/admin/question-bank', icon: SettingsIcon },
        { name: 'Marks Entry', path: '/school/admin/marks-entry', icon: SettingsIcon },
        { name: 'Results', path: '/school/admin/results', icon: SettingsIcon },
        { name: 'Report Cards', path: '/school/admin/report-cards', icon: SettingsIcon },
        { name: 'Payment Collection', path: '/school/admin/payment-collection', icon: SettingsIcon },
        { name: 'Payment History', path: '/school/admin/payment-history', icon: SettingsIcon },
        { name: 'Fee Defaulters', path: '/school/admin/fee-defaulters', icon: SettingsIcon },
        { name: 'Notifications Center', path: '/school/admin/notifications-center', icon: SettingsIcon },
        { name: 'SMS Center', path: '/school/admin/sms-center', icon: SettingsIcon },
        { name: 'Email Center', path: '/school/admin/email-center', icon: SettingsIcon },
        { name: 'AI Insights', path: '/school/admin/ai-insights', icon: SettingsIcon },
        { name: 'Student Performance Analytics', path: '/school/admin/student-performance', icon: SettingsIcon },
        { name: 'Attendance Analytics', path: '/school/admin/attendance-analytics', icon: SettingsIcon },
        { name: 'Custom Reports', path: '/school/admin/custom-reports', icon: SettingsIcon },
      ];
      const pages = (isTeacher ? teacherPages : adminPages).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (isTeacher) {
        setSearchResults({ students: [], teachers: [], pages });
        return;
      }

      // Mock API calls for students and teachers (would be real API in production)
      const [sRes, tRes] = await Promise.all([
        api.get('/students'),
        api.get('/teachers')
      ]);

      const students = (sRes.data || [])
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3);
      
      const teachers = (tRes.data || [])
        .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3);

      setSearchResults({ students, teachers, pages });
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

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-6 py-3 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-xl p-2 text-surface-600 hover:bg-slate-50 md:hidden dark:text-slate-300 dark:hover:bg-slate-900" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-col">
            <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
              {workspaceName}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
              {workspaceLabel}
            </p>
            <h1 className="mt-0.5 text-lg font-black leading-tight text-slate-950 dark:text-white">{title}</h1>
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
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-400 md:inline dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              Ctrl K
            </kbd>

            {/* Search Results Dropdown */}
            {searchOpen && (searchQuery.length > 0 || searchResults.pages.length > 0) && (
              <div className="absolute top-full mt-3 w-full overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="max-h-[480px] overflow-y-auto p-2">
                  {isSearching && (
                    <div className="p-4 text-center text-xs font-bold text-slate-400 animate-pulse">Searching the intelligence engine...</div>
                  )}
                  
                  {searchResults.pages.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Navigation</p>
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

                  {searchResults.students.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Students</p>
                      {searchResults.students.map(s => (
                        <Link key={s.id} to="/school/admin/students" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">
                            {s.photo ? <img src={s.photo} className="w-full h-full object-cover rounded-xl" /> : s.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{s.studentProfile?.enrollmentNo || 'No ID'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.teachers.length > 0 && (
                    <div className="mb-4">
                      <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Teachers</p>
                      {searchResults.teachers.map(t => (
                        <Link key={t.id} to="/school/admin/teachers" onClick={() => setSearchOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">
                            {t.photo ? <img src={t.photo} className="w-full h-full object-cover rounded-xl" /> : t.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{t.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{t.email || 'Teacher profile'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {!isSearching && searchResults.pages.length === 0 && searchResults.students.length === 0 && searchResults.teachers.length === 0 && (
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
          <div className="relative" ref={quickRef}>
            <button
              type="button"
              onClick={() => setQuickOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:scale-105 active:scale-95"
              aria-label="Quick create"
            >
              <Plus className={cn('h-6 w-6 transition-transform duration-300', quickOpen && 'rotate-45')} />
            </button>
            {quickOpen && (
              <div className="absolute right-0 z-50 mt-4 w-56 overflow-hidden rounded-[2rem] border border-slate-100 bg-white py-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <Link to={isTeacher ? '/school/teacher/assignments' : '/school/admin/students'} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <GraduationCap size={16} />
                  </div>
                  {isTeacher ? 'Add assignment' : 'Add student'}
                </Link>
                <Link to={isTeacher ? '/school/teacher/assessments' : '/school/admin/teachers'} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  {isTeacher ? 'Create assessment' : 'Add teacher'}
                </Link>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-4" />
                <Link to={isTeacher ? '/school/teacher/creator' : '/school/admin/notices'} className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => setQuickOpen(false)}>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                    <MessageCircle size={16} />
                  </div>
                  {isTeacher ? 'Open creator' : 'Publish notice'}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => navigate(messagesPath)}
              className="relative h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white border-2 border-white dark:border-slate-950">
                  5
                </span>
              </button>
              {notifOpen && (
                <div className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">5 Unread</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/50">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">New Institute Registered</p>
                      <p className="text-xs text-slate-500 mt-1">Delhi Public School just registered on the platform.</p>
                      <p className="text-[10px] text-slate-400 mt-2">2 minutes ago</p>
                    </div>
                    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/50">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">System Update</p>
                      <p className="text-xs text-slate-500 mt-1">Version 2.4.1 has been deployed successfully.</p>
                      <p className="text-[10px] text-slate-400 mt-2">1 hour ago</p>
                    </div>
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark all as read</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Link to={profilePath} className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-black text-slate-950 dark:text-white leading-tight">{user?.name || 'Admin'}</p>
              <p className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">
                {roleName}
              </p>
            </div>
          </Link>
          <button onClick={logout} className="ml-2 rounded-2xl p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors" aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
