import React, { useState } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import { UnifiedSidebar, SidebarProfileCard } from '@/components/layout/UnifiedSidebar';
import { EddvaLogo } from '@/components/school/admin/Brand';
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ClipboardList,
  Compass,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  Radio,
  Trophy,
  UserCheck,
  Video,
} from 'lucide-react';

const studentGroups = [
  {
    heading: 'Home',
    items: [
      { path: '/school/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    heading: 'My Learning',
    items: [
      { path: '/school/student/live-classes', label: 'Live Classes', icon: Radio },
      { path: '/school/student/recorded-classes', label: 'Recorded Classes', icon: Video },
      { path: '/school/student/study-materials', label: 'Study Materials', icon: BookOpen },
      { path: '/school/student/planner', label: 'AI Study Planner', icon: BrainCircuit },
    ],
  },
  {
    heading: 'Academic Work',
    items: [
      { path: '/school/student/assignments', label: 'Assignments', icon: FileText },
      { path: '/school/student/assessments', label: 'Assessments', icon: ClipboardList },
      { path: '/school/student/attendance', label: 'Attendance', icon: UserCheck },
      { path: '/school/student/analytics', label: 'Performance Analytics', icon: BarChart3 },
    ],
  },
  {
    heading: 'Growth',
    items: [
      { path: '/school/student/doubts', label: 'My Doubts', icon: HelpCircle },
      { path: '/school/student/career', label: 'Career Guidance', icon: Compass, badge: 'New' },
      { path: '/school/student/gamification', label: 'Gamification', icon: Trophy },
      { path: '/school/student/timetable', label: 'Timetable', icon: CalendarDays },
      { path: '/school/student/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { path: '/school/student/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <UnifiedSidebar
      groups={studentGroups}
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed((v) => !v)}
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
          name={user?.name || 'Student'}
          roleLabel="Student Portal"
        />
      )}
    />
  );
}
