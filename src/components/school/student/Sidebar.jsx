import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { useSchoolFeature } from '@/hooks/use-school-feature';
import { UnifiedSidebar, SidebarProfileCard } from '@/components/layout/UnifiedSidebar';
import { EddvaLogo } from '@/components/school/admin/Brand';
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ClipboardList,
  Compass,
  Sparkles,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  MonitorPlay,
  Trophy,
  UserCheck,
  Video,
} from 'lucide-react';

const allItems = [
  { group: 'Home', path: '/school/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { group: 'My Learning', path: '/school/student/live-classes', label: 'Live Classes', icon: MonitorPlay, featType: 'module', featKey: 'live_classes' },
  { group: 'My Learning', path: '/school/student/recorded-classes', label: 'Recorded Classes', icon: Video },
  { group: 'My Learning', path: '/school/student/study-materials', label: 'Study Materials', icon: BookOpen },
  { group: 'My Learning', path: '/school/student/planner', label: 'AI Study Planner', icon: BrainCircuit, featType: 'ai', featKey: 'ai_study_planner' },
  { group: 'Academic Work', path: '/school/student/assignments', label: 'Assignments', icon: FileText, featType: 'module', featKey: 'assignments' },
  { group: 'Academic Work', path: '/school/student/assessments', label: 'Assessments', icon: ClipboardList, featType: 'module', featKey: 'assessments' },
  { group: 'Academic Work', path: '/school/student/attendance', label: 'Attendance', icon: UserCheck },
  { group: 'Academic Work', path: '/school/student/analytics', label: 'Performance Analytics', icon: BarChart3, featType: 'module', featKey: 'reports' },
  { group: 'Growth', path: '/school/student/doubts', label: 'My Doubts', icon: HelpCircle, featType: 'ai', featKey: 'ai_doubt_solver' },
  { group: 'Growth', path: '/school/student/career', label: 'Career Guidance', icon: Compass, badge: 'New', featType: 'ai', featKey: 'ai_career_guidance' },
  // Demonstration feature — shares the career-guidance flag so it appears and
  // disappears with the section it belongs to.
  { group: 'Growth', path: '/school/student/astro-profile', label: 'AI Astro Profile', icon: Sparkles, badge: 'Demo', featType: 'ai', featKey: 'ai_career_guidance' },
  { group: 'Growth', path: '/school/student/gamification', label: 'Gamification', icon: Trophy, badge: 'New' },
  { group: 'Growth', path: '/school/student/timetable', label: 'Timetable', icon: CalendarDays, featType: 'module', featKey: 'timetable' },
  { group: 'Growth', path: '/school/student/calendar', label: 'Calendar', icon: CalendarDays, featType: 'module', featKey: 'academic_calendar' },
  { group: 'Communication', path: '/school/student/announcements', label: 'Announcements', icon: Megaphone },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const isGameRoute = location.pathname.includes('/game-zone');
  const isGamificationRoute = location.pathname.includes('/gamification') || isGameRoute;

  const [collapsed, setCollapsed] = useState(() => isGamificationRoute);

  useEffect(() => {
    if (isGamificationRoute) {
      // Auto collapse sidebar when entering Gamification or any game
      setCollapsed(true);
    } else {
      // Restore pre-gamification sidebar state when returning to main dashboard
      const savedPreState = sessionStorage.getItem('pre_gamification_sidebar');
      if (savedPreState !== null) {
        setCollapsed(savedPreState === 'true');
      }
    }
  }, [location.pathname, isGamificationRoute]);

  const handleToggleCollapse = () => {
    setCollapsed((v) => {
      const next = !v;
      if (!isGamificationRoute) {
        sessionStorage.setItem('pre_gamification_sidebar', next ? 'true' : 'false');
      }
      return next;
    });
  };

  // Custom hook usage
  const hasLiveClasses = useSchoolFeature('module', 'live_classes');
  const hasAssignments = useSchoolFeature('module', 'assignments');
  const hasAssessments = useSchoolFeature('module', 'assessments');
  const hasReports = useSchoolFeature('module', 'reports');
  const hasTimetable = useSchoolFeature('module', 'timetable');
  const hasCalendar = useSchoolFeature('module', 'academic_calendar');
  const hasPlanner = useSchoolFeature('ai', 'ai_study_planner');
  const hasDoubts = useSchoolFeature('ai', 'ai_doubt_solver');
  const hasCareer = useSchoolFeature('ai', 'ai_career_guidance');

  if (isGamificationRoute) {
    return null;
  }

  // Reconstruct groups dynamically
  const filteredGroups = [
    { heading: 'Home', items: [] },
    { heading: 'My Learning', items: [] },
    { heading: 'Academic Work', items: [] },
    { heading: 'Growth', items: [] },
    { heading: 'Communication', items: [] },
  ];

  allItems.forEach(item => {
    if (item.featType === 'module' && item.featKey === 'live_classes' && !hasLiveClasses) return;
    if (item.featType === 'module' && item.featKey === 'assignments' && !hasAssignments) return;
    if (item.featType === 'module' && item.featKey === 'assessments' && !hasAssessments) return;
    if (item.featType === 'module' && item.featKey === 'reports' && !hasReports) return;
    if (item.featType === 'module' && item.featKey === 'timetable' && !hasTimetable) return;
    if (item.featType === 'module' && item.featKey === 'academic_calendar' && !hasCalendar) return;
    if (item.featType === 'ai' && item.featKey === 'ai_study_planner' && !hasPlanner) return;
    if (item.featType === 'ai' && item.featKey === 'ai_doubt_solver' && !hasDoubts) return;
    if (item.featType === 'ai' && item.featKey === 'ai_career_guidance' && !hasCareer) return;

    const group = filteredGroups.find(g => g.heading === item.group);
    if (group) group.items.push(item);
  });

  return (
    <UnifiedSidebar
      groups={filteredGroups.filter(g => g.items.length > 0)}
      collapsed={collapsed}
      onToggleCollapse={handleToggleCollapse}
      mobileOpen={open}
      onMobileClose={onClose}
      logo={<EddvaLogo />}
      onNavClick={() => onClose?.()}
      profileCard={(isCollapsed) => (
        <SidebarProfileCard
          collapsed={isCollapsed}
          avatar={
            <div className="grid h-full w-full place-items-center rounded-xl border border-blue-200 bg-blue-50 text-xs font-bold tracking-tight text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </div>
          }
          title={user?.name || 'Student'}
          subtitle={user?.role || 'Student'}
        />
      )}
    />
  );
}
