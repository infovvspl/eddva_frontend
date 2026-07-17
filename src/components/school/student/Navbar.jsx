import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
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
  KeyRound,
  ArrowLeft,
  X,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import api from '@/lib/api/school-client';
import { cn } from '@/components/school/admin/Skeleton';
import { createNotificationSocket } from '@/lib/notification-socket';
import { useSchoolNotification } from '@/context/SchoolNotificationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { SchoolLogo } from '@/components/school/admin/Brand';

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
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, institute, logout } = useAuth();
  const title = pageTitle(location.pathname, location.state);

  const [theme, setTheme] = useState(() => localStorage.getItem('eddva-theme') || 'light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (name) => {
    if (!name || !name.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter(x => x.name.toLowerCase() !== name.toLowerCase());
      const updated = [{ name }, ...filtered].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const context = useMemo(() => {
    if (location.pathname.includes('/classes') || location.pathname.includes('/study-materials') || location.pathname.includes('/timetable') || location.pathname.includes('/calendar')) {
      return {
        module: 'Academics & Learning',
        suggestions: [
          { label: 'My Classes', path: '/school/student/classes', icon: BookOpen },
          { label: 'Study Materials', path: '/school/student/study-materials', icon: FileText },
          { label: 'Class Timetable', path: '/school/student/timetable', icon: CalendarDays },
          { label: 'Academic Calendar', path: '/school/student/calendar', icon: CalendarDays }
        ],
        trending: [
          { label: 'Weekly Timetable Schedule', q: 'timetable' },
          { label: 'Registered Classes info', q: 'classes' }
        ]
      };
    }
    if (location.pathname.includes('/assignments') || location.pathname.includes('/assessments') || location.pathname.includes('/attendance')) {
      return {
        module: 'Assignments & Attendance',
        suggestions: [
          { label: 'My Assignments', path: '/school/student/assignments', icon: FileText },
          { label: 'Assessments & Tests', path: '/school/student/assessments', icon: Trophy },
          { label: 'My Attendance', path: '/school/student/attendance', icon: ClipboardList }
        ],
        trending: [
          { label: 'Homework due dates', q: 'assignments' },
          { label: 'Monthly Attendance sheet', q: 'attendance' }
        ]
      };
    }
    if (location.pathname.includes('/doubts') || location.pathname.includes('/planner') || location.pathname.includes('/chat') || location.pathname.includes('/career')) {
      return {
        module: 'AI Support & Interaction',
        suggestions: [
          { label: 'AI Doubt Solver', path: '/school/student/doubts', icon: BrainCircuit },
          { label: 'AI Study Planner', path: '/school/student/planner', icon: Target },
          { label: 'Student Chat Room', path: '/school/student/chat', icon: MessageCircle },
          { label: 'Career Guidance Hub', path: '/school/student/career', icon: Trophy }
        ],
        trending: [
          { label: 'Doubt solver queue', q: 'doubts' },
          { label: 'Explore Career Options', q: 'career' }
        ]
      };
    }
    if (location.pathname.includes('/battle-arena') || location.pathname.includes('/gamification') || location.pathname.includes('/game-zone')) {
      return {
        module: 'Game Zone & Battles',
        suggestions: [
          { label: 'Battle Arena PvP', path: '/school/student/battle-arena', icon: Target },
          { label: 'Gamification Leaderboards', path: '/school/student/gamification', icon: Trophy },
          { label: 'Quiz Rush Game', path: '/school/student/game-zone/quiz-rush', icon: Trophy },
          { label: 'Treasure Hunt Game', path: '/school/student/game-zone/treasure-hunt', icon: Trophy },
          { label: 'Math Sprint Game', path: '/school/student/game-zone/math-sprint', icon: Trophy },
          { label: 'Memory Match Game', path: '/school/student/game-zone/memory-match', icon: Trophy },
          { label: 'Word Master Game', path: '/school/student/game-zone/word-master', icon: Trophy }
        ],
        trending: [
          { label: 'Word Master sprint', q: 'game-zone/word-master' },
          { label: 'Math Sprint matches', q: 'game-zone/math-sprint' }
        ]
      };
    }
    if (location.pathname.includes('/fees')) {
      return {
        module: 'Fees & Invoices',
        suggestions: [
          { label: 'Fee Invoices & Payments', path: '/school/student/fees', icon: FileText }
        ],
        trending: [
          { label: 'Pay School Fee', q: 'fees' }
        ]
      };
    }
    return {
      module: 'Student Dashboard',
      suggestions: [
        { label: 'Dashboard Overview', path: '/school/student', icon: Home },
        { label: 'My Classes', path: '/school/student/classes', icon: BookOpen },
        { label: 'AI Doubt Solver', path: '/school/student/doubts', icon: BrainCircuit },
        { label: 'Fee Invoices', path: '/school/student/fees', icon: FileText }
      ],
      trending: [
        { label: 'Class Timetable info', q: 'timetable' },
        { label: 'Resolve homework doubts', q: 'doubts' }
      ]
    };
  }, [location.pathname]);

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
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
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
  const filteredPages = normalizedQuery
    ? studentPages.filter((page) => `${page.name} ${page.keywords}`.toLowerCase().includes(normalizedQuery))
    : [];

  return (
    <header className={cn(
      "sticky top-0 z-30",
      isMobile
        ? "border-b border-slate-200/50 dark:border-slate-800 bg-white/75 dark:bg-slate-905/75 backdrop-blur-md px-4 py-3 shadow-[0_2px_12px_-3px_rgba(37,99,235,0.03)]"
        : "border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 py-3 dark:border-slate-800 dark:bg-slate-950/80"
    )}>
      <div className="flex items-center justify-between gap-3 sm:gap-8">
        <div className="flex items-center gap-2.5 min-w-0">
          {isMobile ? (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 overflow-hidden">
                <SchoolLogo
                  src={institute?.logo}
                  alt={institute?.name}
                  size="navbar"
                  className="w-[28px] h-[28px] object-contain"
                />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white truncate max-w-[170px]">
                {institute?.name || 'EDDVA SCHOOL'}
              </span>
            </>
          ) : (
            <>
              {onMenuClick && (
                <button
                  onClick={onMenuClick}
                  className="rounded-xl p-2 text-surface-600 hover:bg-slate-50 md:hidden dark:text-slate-300 dark:hover:bg-slate-900"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}
              <div className="flex flex-col">
                <h1 className="mt-0.5 text-lg font-bold tracking-tight leading-tight text-slate-955 dark:text-white">
                  {title}
                </h1>
              </div>
            </>
          )}
        </div>

          {/* Search Section */}
          <div className="relative flex items-center" ref={searchRef}>
            {isMobile && searchOpen ? (
              <div className="fixed inset-x-0 top-0 h-16 bg-white dark:bg-slate-905 z-50 flex items-center px-4 gap-3 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchOpen(false);
                    setDropdownOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 shrink-0"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 flex items-center bg-slate-100/80 dark:bg-slate-805 rounded-xl px-3 py-1.5 border border-slate-200/60 dark:border-slate-700">
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
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-none border-none w-full"
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
                <div className={`flex items-center rounded-xl transition-all duration-300 ease-in-out ${searchOpen ? 'w-48 sm:w-64 md:w-80 bg-slate-100/80 dark:bg-slate-800 px-3 py-1.5 border border-slate-200/60 dark:border-slate-700' : 'w-0 overflow-hidden border-transparent'}`}>
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
                    className="bg-transparent text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 outline-none border-none w-full"
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
                  className={`h-10 w-10 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100/75 dark:hover:bg-slate-800 transition-all duration-200 ${searchOpen ? 'text-blue-600 bg-slate-100/50 dark:bg-slate-800' : ''}`}
                  aria-label="Search"
                >
                  <Search className="h-[18px] w-[18px]" />
                </button>
              </>
            )}

            {/* Dropdown Panel */}
            {searchOpen && dropdownOpen && (
              <div className={cn(
                "absolute top-full z-50 overflow-y-auto bg-white/95 dark:bg-slate-905/95 backdrop-blur-md shadow-2xl p-4 custom-scrollbar",
                isMobile
                  ? "fixed inset-x-0 bottom-0 top-16 w-full max-h-none border-t border-slate-100 dark:border-slate-800"
                  : "mt-2 right-0 w-[320px] sm:w-[420px] md:w-[485px] max-h-[440px] rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-top-2 duration-150"
              )}>
                {searchQuery.length <= 1 ? (
                  <div className="space-y-4">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Recent Searches</span>
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
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">{context.module} Suggestions</span>
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
                              className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 hover:text-blue-600 transition-colors"
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
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">Trending ({context.module})</span>
                      <div className="grid grid-cols-2 gap-2">
                        {context.trending.map((trend) => (
                          <button
                            key={trend.q}
                            type="button"
                            onClick={() => {
                              setSearchQuery(trend.q);
                              searchInputRef.current?.focus();
                            }}
                            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left text-xs font-bold text-slate-750 dark:text-slate-300 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                          >
                            <TrendingUp className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>{trend.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : filteredPages.length > 0 ? (
                  <div>
                    <p className="px-2 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pages ({filteredPages.length})</p>
                    <div className="grid gap-1">
                      {filteredPages.map((page) => (
                        <Link
                          key={page.path}
                          to={page.path}
                          onClick={() => {
                            setSearchOpen(false);
                            setDropdownOpen(false);
                            saveRecentSearch(page.name);
                          }}
                          className="flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:text-blue-600 border border-transparent transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
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
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No results for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative flex items-center" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className={cn(
                "relative h-10 w-10 flex items-center justify-center transition-all duration-200",
                isMobile
                  ? "rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100/75 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  : "rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
              )}
              aria-label="Notifications"
            >
              <Bell className={isMobile ? "h-[18px] w-[18px]" : "h-5 w-5"} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold tracking-tight text-white border border-white dark:border-slate-950">
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
          </div>          {!isMobile && (
            <div className="relative border-l border-slate-100 dark:border-slate-800 pl-4 ml-1.5" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 outline-none group"
                aria-label="User Profile menu"
              >
                <div className="relative transition-transform duration-200">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user?.name || 'Student'}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `<div class="grid h-10 w-10 place-items-center rounded-2xl bg-blue-100 text-sm font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-350">${(user?.name || 'S').charAt(0).toUpperCase()}</div>`;
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
                    <p className="text-[10px] font-bold text-slate-405 uppercase tracking-widest mt-0.5">Student Portal</p>
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
          )}
      </div>
    </header>
  );
}
