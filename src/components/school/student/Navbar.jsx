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
  LifeBuoy,
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
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';

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
  '/school/student/ai-assistant': 'AI Study Assistant',
  '/school/student/gamification': 'Gamification',
  '/school/student/battle-arena': 'Battle Arena',
  '/school/student/planner': 'Study Planner',
  '/school/student/calendar': 'Calendar',
  '/school/student/announcements': 'Announcements',
  '/school/student/support-tickets': 'Support Tickets',
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
  { name: 'Attendance', path: '/school/student/attendance', icon: UserCheck, keywords: 'present absent monthly subject warnings' },
  { name: 'Performance Analytics', path: '/school/student/analytics', icon: BarChart3, keywords: 'reports progress weak areas accuracy time' },
  { name: 'AI Study Assistant', path: '/school/student/ai-assistant', icon: BrainCircuit, keywords: 'doubt notes summary planner coach recommendations' },
  { name: 'Gamification', path: '/school/student/gamification', icon: Trophy, keywords: 'xp badges achievements leaderboards certificates' },
  { name: 'Calendar', path: '/school/student/calendar', icon: CalendarDays, keywords: 'planner goals exams events schedule' },
  { name: 'Announcements', path: '/school/student/announcements', icon: Megaphone, keywords: 'notice exam holiday teacher message' },
  { name: 'Support Tickets', path: '/school/student/support-tickets', icon: LifeBuoy, keywords: 'support help ticket status issue' },
  { name: 'Profile', path: '/school/student/profile', icon: UserCircle, keywords: 'student id roll class section parent security' },
  { name: 'Settings', path: '/school/student/settings', icon: Settings, keywords: 'password devices notification theme sessions' },
];

function pageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(([path]) => pathname.startsWith(`${path}/`));
  if (match) return match[1];
  return pathname
    .split('/')
    .filter(Boolean)
    .pop()
    ?.split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Student Portal';
}

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, institute, logout } = useAuth();
  const title = pageTitle(location.pathname);

  const [theme, setTheme] = useState(() => localStorage.getItem('eddva-theme') || 'light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      if (!searchRef.current?.contains(e.target)) setSearchOpen(false);
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredPages = normalizedQuery
    ? studentPages.filter((page) => `${page.name} ${page.keywords}`.toLowerCase().includes(normalizedQuery))
    : [];

  const notificationTypes = [
    { label: 'New Assignment', to: '/school/student/assignments', icon: FileText, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
    { label: 'New Notice', to: '/school/student/announcements', icon: Megaphone, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Exam Announcement', to: '/school/student/assessments', icon: ClipboardList, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
    { label: 'Teacher Message', to: '/school/student/chat', icon: MessageCircle, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {institute?.name || 'EDDVA'}
            </p>
            <h1 className="mt-0.5 truncate text-lg font-black leading-tight text-slate-950 dark:text-white">{title}</h1>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex" ref={searchRef}>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-16 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder="Search subjects, notes, assignments, tests, classes..."
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-400 md:inline dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              Ctrl K
            </kbd>

            {searchOpen && searchQuery.length > 0 && (
              <div className="absolute top-full mt-3 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="max-h-[420px] overflow-y-auto p-2">
                  {filteredPages.length > 0 ? (
                    <div>
                      <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Module</p>
                      {filteredPages.map((page) => (
                        <Link
                          key={page.path}
                          to={page.path}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="group flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                            <page.icon size={16} />
                          </div>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700 dark:text-slate-200">{page.name}</span>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Search className="mx-auto mb-3 h-8 w-8 text-slate-200" />
                      <p className="text-sm font-bold text-slate-400">No module match for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/school/student/chat')}
            className="relative hidden h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 sm:flex"
            aria-label="Open class chat"
          >
            <MessageCircle className="h-5 w-5" />
          </button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((open) => !open)}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Notifications</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">Quick links for recent student updates.</p>
                </div>
                <div className="p-2">
                  {notificationTypes.map((note) => (
                    <Link
                      key={note.label}
                      to={note.to}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${note.tone}`}>
                        <note.icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{note.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/school/student/profile" className="hidden items-center gap-3 border-l border-slate-100 pl-3 dark:border-slate-800 sm:flex">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
            </div>
            <div className="hidden min-w-0 xl:block">
              <p className="truncate text-xs font-black leading-tight text-slate-950 dark:text-white">{user?.name || 'Student'}</p>
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
