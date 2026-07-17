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
  ArrowLeft,
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
  TrendingUp,
  X,
  Clock,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { cn } from './Skeleton';
import api from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { useSchoolNotification } from '@/context/SchoolNotificationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { InstituteLogo } from './Brand';
import logoUrl from '@/assets/eddva-logo.svg';

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
  const isMobile = useIsMobile();
  const title = pageTitle(location.pathname, location.state);
  const rawRole = String(user?.rawRole || user?.role || '')
    .toUpperCase()
    .trim();
  const hasSuperAdminRole = rawRole.includes('SUPER_ADMIN') || rawRole.includes('SUPER ADMIN');
  const hasInstituteAdminRole = !hasSuperAdminRole && (
    rawRole.includes('INSTITUTE_ADMIN') ||
    rawRole.includes('INSTITUTE ADMIN') ||
    /\bADMIN\b/.test(rawRole)
  );
  const hasTeacherRole = rawRole.includes('TEACHER');
  const isAdminPath = location.pathname.startsWith('/school/admin');
  const isTeacherPath = location.pathname.startsWith('/school/teacher');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || hasSuperAdminRole;
  const isInstitute = !isSuperAdmin && (user?.role === 'INSTITUTE_ADMIN' || (isAdminPath && hasInstituteAdminRole));
  const isTeacher = !isSuperAdmin && !isInstitute && (user?.role === 'TEACHER' || (isTeacherPath && hasTeacherRole));
  const canOpenInstituteAdmin = !isAdminPath && hasInstituteAdminRole && (user?.role === 'TEACHER' || hasTeacherRole);
  const canOpenTeacherPortal = isAdminPath && hasInstituteAdminRole && hasTeacherRole;
  const useTeacherFallback = !isSuperAdmin && !isInstitute;
  const roleName = isTeacher || useTeacherFallback ? 'Teacher' : isInstitute ? 'Institute Admin' : 'Super Admin';
  const workspaceName = isTeacher || useTeacherFallback ? user?.name || 'Teacher Workspace' : isInstitute ? institute?.name || 'Eddva Institute' : 'EDDVA HQ';
  const workspaceLabel = isTeacher || useTeacherFallback ? 'Teaching Workspace' : isInstitute ? 'Active Workspace' : 'Super Admin Console';
  const messagesPath = isTeacher || useTeacherFallback ? '/school/teacher/chat' : '/school/admin/communications';
  const profilePath = isTeacher || useTeacherFallback ? '/school/teacher/profile' : isSuperAdmin ? '/school/super-admin/settings' : '/school/admin/settings';

  const [theme, setTheme] = useState('light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ students: [], teachers: [], pages: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    if (isSuperAdmin) {
      if (location.pathname.includes('/institutes') || location.pathname.includes('/top-institutes')) {
        return {
          module: 'Institutes',
          suggestions: [
            { label: 'Institutes Directory', path: '/school/super-admin/institutes', icon: Building2 },
            { label: 'Add New Institute', path: '/school/super-admin/institutes/new', icon: Plus },
            { label: 'Top Performing Institutes', path: '/school/super-admin/top-institutes', icon: TrendingUp }
          ],
          trending: [
            { label: 'Manage Institutes List', q: 'institutes' },
            { label: 'Setup New School', q: 'institutes/new' }
          ]
        };
      }
      if (location.pathname.includes('/analytics') || location.pathname.includes('/live-usage') || location.pathname.includes('/ai-usage') || location.pathname.includes('/feature-flags')) {
        return {
          module: 'System Analytics',
          suggestions: [
            { label: 'Analytics Overview', path: '/school/super-admin/analytics', icon: BarChart3 },
            { label: 'Live System Usage', path: '/school/super-admin/live-usage', icon: Sparkles },
            { label: 'AI Usage Analysis', path: '/school/super-admin/ai-usage', icon: Sparkles },
            { label: 'Super Admin Feature Flags', path: '/school/super-admin/feature-flags', icon: Shield }
          ],
          trending: [
            { label: 'Live Server Metrics', q: 'live-usage' },
            { label: 'AI Token Usage', q: 'ai-usage' }
          ]
        };
      }
      if (location.pathname.includes('/complaints') || location.pathname.includes('/audit-logs') || location.pathname.includes('/security') || location.pathname.includes('/settings')) {
        return {
          module: 'Support & Security',
          suggestions: [
            { label: 'Support Complaints', path: '/school/super-admin/complaints', icon: Shield },
            { label: 'System Audit Logs', path: '/school/super-admin/audit-logs', icon: FileText },
            { label: 'Global Security Settings', path: '/school/super-admin/security', icon: Shield },
            { label: 'Super Admin Settings', path: '/school/super-admin/settings', icon: SettingsIcon }
          ],
          trending: [
            { label: 'View Complaints Log', q: 'complaints' },
            { label: 'Audit Log Records', q: 'audit-logs' }
          ]
        };
      }
      return {
        module: 'Super Admin Dashboard',
        suggestions: [
          { label: 'Dashboard Overview', path: '/school/super-admin', icon: Sparkles },
          { label: 'Institutes List', path: '/school/super-admin/institutes', icon: Building2 },
          { label: 'Support Complaints', path: '/school/super-admin/complaints', icon: Shield },
          { label: 'Global Settings', path: '/school/super-admin/settings', icon: SettingsIcon }
        ],
        trending: [
          { label: 'Subdomains List', q: 'institutes' },
          { label: 'Open Support complaints', q: 'complaints' }
        ]
      };
    }

    if (isTeacher) {
      if (location.pathname.includes('/students') || location.pathname.includes('/reports')) {
        return {
          module: 'Student Reports',
          suggestions: [
            { label: 'Student Directory', path: '/school/teacher/students', icon: Users },
            { label: 'Teacher Performance Reports', path: '/school/teacher/reports', icon: BarChart3 }
          ],
          trending: [
            { label: 'View Student Performance', q: 'reports' },
            { label: 'My Students Directory', q: 'students' }
          ]
        };
      }
      if (location.pathname.includes('/course-content') || location.pathname.includes('/classes') || location.pathname.includes('/timetable') || location.pathname.includes('/calendar')) {
        return {
          module: 'Academics & Timetable',
          suggestions: [
            { label: 'Course Content Management', path: '/school/teacher/course-content', icon: GraduationCap },
            { label: 'Manage Class Rooms', path: '/school/teacher/classes', icon: Users },
            { label: 'Teacher Timetable', path: '/school/teacher/timetable', icon: CalendarDays },
            { label: 'Academic Calendar', path: '/school/teacher/calendar', icon: CalendarDays }
          ],
          trending: [
            { label: 'Upload Materials', q: 'course-content' },
            { label: 'Class Timetable Schedule', q: 'timetable' }
          ]
        };
      }
      if (location.pathname.includes('/attendance') || location.pathname.includes('/assignments') || location.pathname.includes('/assessments') || location.pathname.includes('/live')) {
        return {
          module: 'Classroom Activity',
          suggestions: [
            { label: 'Mark Classroom Attendance', path: '/school/teacher/attendance', icon: ClipboardList },
            { label: 'Homework Assignments', path: '/school/teacher/assignments', icon: FileText },
            { label: 'Create Assessments', path: '/school/teacher/assessments', icon: GraduationCap },
            { label: 'Go Live (Live Class)', path: '/school/teacher/live', icon: Sparkles }
          ],
          trending: [
            { label: 'Take Attendance', q: 'attendance' },
            { label: 'Assign Homework Assignments', q: 'assignments' }
          ]
        };
      }
      if (location.pathname.includes('/chat') || location.pathname.includes('/doubts') || location.pathname.includes('/meetings') || location.pathname.includes('/grievances')) {
        return {
          module: 'Support & Interaction',
          suggestions: [
            { label: 'Teacher Chat System', path: '/school/teacher/chat', icon: MessageCircle },
            { label: 'Doubt Solver Queue', path: '/school/teacher/doubts', icon: MessageSquare },
            { label: 'Teacher Meetings', path: '/school/teacher/meetings', icon: CalendarDays },
            { label: 'Submit Grievance', path: '/school/teacher/grievances', icon: Shield }
          ],
          trending: [
            { label: 'AI Doubt solver Queue', q: 'doubts' },
            { label: 'Chat Messaging System', q: 'chat' }
          ]
        };
      }
      return {
        module: 'Teacher Dashboard',
        suggestions: [
          { label: 'Dashboard Overview', path: '/school/teacher', icon: Sparkles },
          { label: 'Mark Classroom Attendance', path: '/school/teacher/attendance', icon: ClipboardList },
          { label: 'Teacher Chat System', path: '/school/teacher/chat', icon: MessageCircle },
          { label: 'Teacher Profile', path: '/school/teacher/profile', icon: UserCircle }
        ],
        trending: [
          { label: 'Weekly Schedule timetable', q: 'timetable' },
          { label: 'Chat with Parents/Students', q: 'chat' }
        ]
      };
    }

    // Otherwise, Institute Admin
    if (location.pathname.includes('/students') || location.pathname.includes('/student-promotion')) {
      return {
        module: 'Student Management',
        suggestions: [
          { label: 'Students List', path: '/school/admin/students', icon: GraduationCap },
          { label: 'Add Student', path: '/school/admin/students/new', icon: Plus },
          { label: 'Student Promotion', path: '/school/admin/student-promotion', icon: TrendingUp }
        ],
        trending: [
          { label: 'Add New Student Record', q: 'students/new' },
          { label: 'Promote Student Batches', q: 'student-promotion' }
        ]
      };
    }
    if (location.pathname.includes('/teachers')) {
      return {
        module: 'Teacher Management',
        suggestions: [
          { label: 'Teachers Directory', path: '/school/admin/teachers', icon: Users },
          { label: 'Add Teacher', path: '/school/admin/teachers/new', icon: Plus }
        ],
        trending: [
          { label: 'Register New Teacher', q: 'teachers/new' },
          { label: 'Faculty Directory Directory', q: 'teachers' }
        ]
      };
    }
    if (location.pathname.includes('/attendance')) {
      return {
        module: 'Attendance',
        suggestions: [
          { label: 'Mark Student Attendance', path: '/school/admin/attendance', icon: ClipboardList }
        ],
        trending: [
          { label: 'Class Attendance Sheets', q: 'attendance' }
        ]
      };
    }
    if (location.pathname.includes('/academics') || location.pathname.includes('/subjects') || location.pathname.includes('/timetable') || location.pathname.includes('/calendar')) {
      return {
        module: 'Academics & Timetable',
        suggestions: [
          { label: 'Manage Classes', path: '/school/admin/academics', icon: SettingsIcon },
          { label: 'Manage Subjects', path: '/school/admin/subjects', icon: SettingsIcon },
          { label: 'Academic Timetable', path: '/school/admin/timetable', icon: CalendarDays },
          { label: 'Academic Calendar', path: '/school/admin/calendar', icon: CalendarDays }
        ],
        trending: [
          { label: 'Class sections allocation', q: 'academics' },
          { label: 'Manage Subjects list', q: 'subjects' }
        ]
      };
    }
    if (location.pathname.includes('/complaints') || location.pathname.includes('/communications') || location.pathname.includes('/notices') || location.pathname.includes('/notifications')) {
      return {
        module: 'Support & Communications',
        suggestions: [
          { label: 'Support Tickets (Complaints)', path: '/school/admin/complaints', icon: Shield },
          { label: 'Institute Communications', path: '/school/admin/communications', icon: MessageCircle },
          { label: 'Announcement Board', path: '/school/admin/notices', icon: Bell }
        ],
        trending: [
          { label: 'Support Complaints Tickets', q: 'complaints' },
          { label: 'Notices Board announcements', q: 'notices' }
        ]
      };
    }
    if (location.pathname.includes('/settings') || location.pathname.includes('/users') || location.pathname.includes('/admins') || location.pathname.includes('/audit-logs') || location.pathname.includes('/institute-profile') || location.pathname.includes('/security') || location.pathname.includes('/ai-usage')) {
      return {
        module: 'System Settings & Security',
        suggestions: [
          { label: 'System Settings', path: '/school/admin/settings', icon: SettingsIcon },
          { label: 'User Management', path: '/school/admin/users', icon: Users },
          { label: 'Administrators List', path: '/school/admin/admins', icon: Shield },
          { label: 'System Audit Logs', path: '/school/admin/audit-logs', icon: FileText },
          { label: 'Institute Profile', path: '/school/admin/institute-profile', icon: Building2 },
          { label: 'Security Center', path: '/school/admin/security', icon: Shield },
          { label: 'AI Usage Dashboard', path: '/school/admin/ai-usage', icon: Sparkles }
        ],
        trending: [
          { label: 'System Audit Logs logs', q: 'audit-logs' },
          { label: 'Security Firewalls settings', q: 'security' }
        ]
      };
    }
    return {
      module: 'Institute Admin Dashboard',
      suggestions: [
        { label: 'Dashboard Overview', path: '/school/admin', icon: Sparkles },
        { label: 'System Settings', path: '/school/admin/settings', icon: SettingsIcon },
        { label: 'User Management', path: '/school/admin/users', icon: Users },
        { label: 'Support Tickets (Complaints)', path: '/school/admin/complaints', icon: Shield }
      ],
      trending: [
        { label: 'Students List Directory', q: 'students' },
        { label: 'Teachers Directory Directory', q: 'teachers' }
      ]
    };
  }, [location.pathname, isSuperAdmin, isTeacher]);

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
        setDropdownOpen(false);
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
        {/* Left Side: logo & name on mobile, title on desktop */}
        <div className="flex items-center gap-3 min-w-0">
          {isMobile ? (
            isSuperAdmin ? (
              <img src={logoUrl} alt="EDDVA" className="h-6 w-auto object-contain dark:brightness-110" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 shrink-0 border border-slate-100 dark:border-slate-800">
                  <InstituteLogo institute={institute} size="sm" className="h-7 w-7 object-contain" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white truncate max-w-[140px]">
                  {institute?.name || 'EDDVA Admin'}
                </span>
              </div>
            )
          ) : (
            <>
              {onMenuClick && (
                <button onClick={onMenuClick} className="rounded-xl p-2 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 md:hidden flex-shrink-0" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </button>
              )}
              <div className="flex flex-col min-w-0">
                <h1 className="mt-0.5 text-lg font-bold tracking-tight leading-tight text-slate-900 dark:text-white truncate">{schoolName || title}</h1>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">

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
                <div className="flex-1 flex items-center bg-slate-100/80 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-200/60 dark:border-slate-700">
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
                    className="bg-transparent text-xs font-bold text-slate-805 dark:text-white placeholder-slate-400 outline-none border-none w-full"
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
                    className="bg-transparent text-xs font-bold text-slate-805 dark:text-white placeholder-slate-400 outline-none border-none w-full"
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
                ) : isSearching ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Searching database...</p>
                  </div>
                ) : !hasResults ? (
                  <div className="py-10 text-center space-y-2">
                    <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-750 mx-auto mb-1" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matches found for "{searchQuery}"</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Try a different keyword.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {searchResults.pages?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pages</span>
                        </div>
                        <div className="grid gap-1">
                          {searchResults.pages.map((page, i) => (
                            <button
                              key={`p-${i}`}
                              type="button"
                              onClick={() => {
                                navigate(page.path);
                                setSearchOpen(false);
                                setDropdownOpen(false);
                                saveRecentSearch(page.name);
                              }}
                              className="w-full flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:text-blue-600 border border-transparent transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                <page.icon size={15} />
                              </div>
                              <span className="text-xs font-bold">{page.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.students?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Students</span>
                        </div>
                        <div className="grid gap-1">
                          {searchResults.students.map((student) => (
                            <button
                              key={`s-${student.id}`}
                              type="button"
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher/course-content' : `/school/admin/students/${student.id}`);
                                setSearchOpen(false);
                                setDropdownOpen(false);
                                saveRecentSearch(student.name);
                              }}
                              className="w-full flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:text-indigo-600 border border-transparent transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                                <GraduationCap size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-bold">{student.name}</p>
                                <p className="text-[9px] text-slate-400 truncate">Roll: {student.rollNo || 'N/A'} · Class: {student.class?.name || 'N/A'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.teachers?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Faculty</span>
                        </div>
                        <div className="grid gap-1">
                          {searchResults.teachers.map((teacher) => (
                            <button
                              key={`t-${teacher.id}`}
                              type="button"
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher' : `/school/admin/teachers/${teacher.id}`);
                                setSearchOpen(false);
                                setDropdownOpen(false);
                                saveRecentSearch(teacher.name);
                              }}
                              className="w-full flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 border border-transparent transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
                                <Users size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-bold">{teacher.name}</p>
                                <p className="text-[9px] text-slate-400 truncate">Emp ID: {teacher.employeeId || 'N/A'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.classes?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Classes</span>
                        </div>
                        <div className="grid gap-1">
                          {searchResults.classes.map((cls) => (
                            <button
                              key={`c-${cls.id}`}
                              type="button"
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher/classes' : isSuperAdmin ? '/school/super-admin/institutes' : '/school/admin/academics');
                                setSearchOpen(false);
                                setDropdownOpen(false);
                                saveRecentSearch(cls.name);
                              }}
                              className="w-full flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:text-amber-600 border border-transparent transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0">
                                <GraduationCap size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-bold">{cls.name}</p>
                                <p className="text-[9px] text-slate-400 truncate">Year: {cls.academicYear || '2026'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.subjects?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">Subjects</span>
                        </div>
                        <div className="grid gap-1">
                          {searchResults.subjects.map((sub) => (
                            <button
                              key={`sub-${sub.id}`}
                              type="button"
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher/course-content' : isSuperAdmin ? '/school/super-admin/institutes' : '/school/admin/subjects');
                                setSearchOpen(false);
                                setDropdownOpen(false);
                                saveRecentSearch(sub.name);
                              }}
                              className="w-full flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 hover:text-purple-600 border border-transparent transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                                <Sparkles size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-bold">{sub.name}</p>
                                <p className="text-[9px] text-slate-400 truncate">Code: {sub.code || 'N/A'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.announcements?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Notices</span>
                        </div>
                        <div className="grid gap-1">
                          {searchResults.announcements.map((notice) => (
                            <button
                              key={`n-${notice.id}`}
                              type="button"
                              onClick={() => {
                                navigate(isTeacher ? '/school/teacher' : isSuperAdmin ? '/school/super-admin/communications' : '/school/admin/notices');
                                setSearchOpen(false);
                                setDropdownOpen(false);
                                saveRecentSearch(notice.title);
                              }}
                              className="w-full flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 hover:text-rose-600 border border-transparent transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center shrink-0">
                                <FileText size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-bold">{notice.title}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.tickets?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Tickets</span>
                        </div>
                        <div className="grid gap-1">
                          {searchResults.tickets.map((ticket) => (
                            <button
                              key={`tk-${ticket.id}`}
                              type="button"
                              onClick={() => {
                                navigate(isSuperAdmin ? '/school/super-admin/complaints' : '/school/admin/complaints');
                                setSearchOpen(false);
                                setDropdownOpen(false);
                                saveRecentSearch(ticket.title);
                              }}
                              className="w-full flex items-center gap-3.5 rounded-xl p-2.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 hover:text-cyan-600 border border-transparent transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 flex items-center justify-center shrink-0">
                                <Shield size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-bold">{ticket.title}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
              <div className="absolute right-[-12px] sm:right-0 top-full mt-3.5 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-[360px] sm:max-w-none overflow-hidden rounded-[2rem] border border-slate-105 dark:border-slate-800 bg-white dark:bg-slate-905 py-2 shadow-2xl">
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


          {!isMobile && (
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
                    <p className="text-[10px] font-bold text-slate-405 uppercase tracking-widest mt-0.5">{roleName}</p>
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

                  {canOpenInstituteAdmin && (
                    <Link
                      to="/school/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                        <Shield size={16} />
                      </div>
                      Institute Admin
                    </Link>
                  )}

                  {canOpenTeacherPortal && (
                    <Link
                      to="/school/teacher"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                        <GraduationCap size={16} />
                      </div>
                      Teacher Portal
                    </Link>
                  )}

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-4" />

                  {/* Logout button */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/40 text-left"
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
      </div>
    </header>
  );
}
