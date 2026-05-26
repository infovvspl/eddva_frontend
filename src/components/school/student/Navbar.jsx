import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  MessageCircle,
  Video,
  FileText,
  Target,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { cn } from '@/components/school/admin/Skeleton';

function pageTitle(pathname) {
  if (pathname === '/school/student' || pathname === '/school/student/dashboard') return 'Dashboard';
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
  
  const [theme, setTheme] = useState(() => localStorage.getItem('eddva-theme') || 'light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ pages: [] });
  
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const studentPages = [
        { name: 'Dashboard', path: '/school/student', icon: Target },
        { name: 'My Classes', path: '/school/student/classes', icon: Video },
        { name: 'Assignments', path: '/school/student/assignments', icon: FileText },
        { name: 'Assessments', path: '/school/student/assessments', icon: FileText },
        { name: 'Battle Arena', path: '/school/student/battle-arena', icon: Trophy },
        { name: 'Study Planner', path: '/school/student/planner', icon: Target },
      ];
      const pages = studentPages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      setSearchResults({ pages });
    } else {
      setSearchResults({ pages: [] });
    }
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-6 py-3 dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-xl p-2 text-surface-600 hover:bg-slate-50 md:hidden dark:text-slate-300 dark:hover:bg-slate-900">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-col">
            <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
              {institute?.name || 'EDDVA'}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
              Student Portal
            </p>
            <h1 className="mt-0.5 text-lg font-black leading-tight text-slate-950 dark:text-white">{title}</h1>
          </div>
        </div>

        <div className="hidden flex-1 justify-center lg:flex" ref={searchRef}>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3 pl-12 pr-12 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              placeholder="Search classes, assignments, or tests..."
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

            {searchOpen && (searchQuery.length > 0 || searchResults.pages.length > 0) && (
              <div className="absolute top-full mt-3 w-full overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="max-h-[480px] overflow-y-auto p-2">
                  {searchResults.pages.length > 0 ? (
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
                  ) : (
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/school/student/chat')}
            className="relative h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative h-10 w-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <Bell className="h-5 w-5" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 z-50 mt-4 w-80 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                </div>
                <div className="p-8 text-center text-sm font-bold text-slate-400">
                  No new notifications
                </div>
              </div>
            )}
          </div>

          <Link to="/school/student/profile" className="flex items-center gap-3 border-l border-slate-100 pl-4 dark:border-slate-800">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-black text-slate-950 dark:text-white leading-tight">{user?.name || 'Student'}</p>
              <p className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">
                Student
              </p>
            </div>
          </Link>
          <button onClick={logout} className="ml-2 rounded-2xl p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
