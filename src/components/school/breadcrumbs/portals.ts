import { buildTrail, isTrailHidden, type Crumb, type PortalConfig } from './trail';

const STUDENT_BASE = '/school/student';

export const STUDENT_PORTAL: PortalConfig = {
  base: STUDENT_BASE,
  rootLabel: 'Dashboard',
  segmentLabels: {
    'live-classes': 'Live Classes',
    'recorded-classes': 'Recorded Classes',
    classes: 'Classes',
    'study-materials': 'Study Materials',
    assignments: 'Assignments',
    assessments: 'Assessments',
    view: 'Details',
    planner: 'AI Study Planner',
    quiz: 'Quiz',
    analytics: 'Performance Analytics',
    attendance: 'Attendance',
    doubts: 'My Doubts',
    career: 'Career Guidance',
    'astro-profile': 'AI Astro Profile',
    gamification: 'Gamification',
    'battle-arena': 'Battle Arena',
    timetable: 'Timetable',
    calendar: 'Calendar',
    announcements: 'Announcements',
    notifications: 'Notifications',
    syllabus: 'Syllabus',
    chat: 'Chat',
    profile: 'Profile',
    settings: 'Settings',
  },
  pathLabels: {
    'career/quiz': 'Career Quiz',
    'career/quiz/result': 'Quiz Result',
    'career/report': 'Career Report',
    'career/explore': 'Explore Careers',
    'analytics/report-card': 'Report Card',
  },
  dynamicLabels: {
    classes: 'Course',
    topics: 'Topic',
    'study-materials': 'Material',
    'live-classes': 'Recording',
    'recorded-classes': 'Recording',
    assessments: 'Assessment',
    'ai-study': 'AI Study',
    explore: 'Career Details',
  },
  skipped: ['topics', 'recording', 'ai-study'],
  parentModule: { quiz: 'planner', 'ai-study': 'planner' },
  hidden: [/^live\/[^/]+\/watch$/, /^assessments\/[^/]+\/take$/],
  // Study Materials keeps its subject > chapter > topic position in the query string.
  queryTrail: (segments, search, base) => {
    if (segments.length !== 1 || segments[0] !== 'study-materials') return [];
    const subject = search.get('subject');
    const chapter = search.get('chapter');
    const topic = search.get('topic');
    const page = `${base}/study-materials`;
    const out: Crumb[] = [];
    if (subject) {
      out.push({ label: subject, to: `${page}?${new URLSearchParams({ subject })}` });
      if (chapter) {
        out.push({ label: chapter, to: `${page}?${new URLSearchParams({ subject, chapter })}` });
        if (topic) out.push({ label: topic, to: `${page}?${new URLSearchParams({ subject, chapter, topic })}` });
      }
    }
    return out;
  },
};

export const ADMIN_PORTAL: PortalConfig = {
  base: '/school/admin',
  rootLabel: 'Dashboard',
  segmentLabels: {
    students: 'Students',
    new: 'New',
    edit: 'Edit',
    'report-card': 'Report Card',
    exit: 'Exit',
    'student-promotion': 'Student Promotion',
    teachers: 'Teachers',
    performance: 'Performance',
    admins: 'Administrators',
    academics: 'Class & Sections',
    sections: 'Sections',
    subjects: 'Subjects',
    'syllabus-planner': 'Syllabus Planner',
    'syllabus-tracker': 'Syllabus Tracker',
    'syllabus-analytics': 'Syllabus Analytics',
    'textbook-coverage': 'Textbook Coverage',
    attendance: 'Attendance',
    timetable: 'Timetable and Roster',
    calendar: 'Academic Calendar',
    notices: 'Notices & Announcements',
    notifications: 'Notifications',
    announcements: 'Announcements',
    communications: 'Messages & Parent Connect',
    'message-logs': 'Message Logs',
    erp: 'ERP Dashboard',
    users: 'User Management',
    roles: 'Roles',
    'document-generator': 'Document Generator',
    'audit-logs': 'Audit Logs',
    complaints: 'Support Tickets',
    analytics: 'Analytics',
    'ai-usage': 'AI Usage',
    reports: 'Reports',
    gamification: 'Gamification',
    'institute-profile': 'Profile',
    security: 'Security',
    settings: 'Settings',
  },
  pathLabels: {
    'students/new': 'New Student',
    'teachers/new': 'New Teacher',
  },
  dynamicLabels: {
    students: 'Student',
    teachers: 'Teacher',
    performance: 'Details',
    academics: 'Class',
    subjects: 'Class',
    'syllabus-planner': 'Plan',
    'syllabus-tracker': 'Plan',
  },
  hidden: [/(^|\/)live\//],
};

export const TEACHER_PORTAL: PortalConfig = {
  base: '/school/teacher',
  rootLabel: 'Dashboard',
  segmentLabels: {
    'teaching-plan': 'My Teaching Plan',
    classes: 'Live & Recorded Video',
    'recorded-classes': 'Recorded Classes',
    live: 'Live',
    'course-content': 'Course Content',
    materials: 'Materials',
    topics: 'Topics',
    'textbook-coverage': 'Textbook Coverage',
    'syllabus-planner': 'Syllabus Planner',
    'lesson-plans': 'Lesson Plans',
    students: 'Students',
    attendance: 'Attendance',
    timetable: 'Timetable',
    calendar: 'Academic Calendar',
    doubts: 'Student Doubts',
    assignments: 'Assignments',
    assessments: 'Assessments',
    submissions: 'Submissions',
    review: 'Review',
    meetings: 'Meetings',
    reports: 'Reports',
    student: 'Student',
    weakness: 'Weakness',
    'report-card': 'Report Card',
    announcements: 'Announcements',
    notifications: 'Notifications',
    chat: 'Chat',
    grievances: 'Grievances',
    profile: 'Profile',
    settings: 'Settings',
  },
  dynamicLabels: {
    students: 'Student',
    student: 'Student',
    materials: 'Material',
    'recorded-classes': 'Recording',
    'syllabus-planner': 'Plan',
    'lesson-plans': 'Lesson Plan',
    assessments: 'Assessment',
    submissions: 'Student',
    weakness: 'Topic',
  },
  // The materials list has no page of its own; the course content page owns it.
  skipped: ['materials'],
  hidden: [/^live\/[^/]+\/(dashboard|studio)$/],
};

export const SUPER_ADMIN_PORTAL: PortalConfig = {
  base: '/school/super-admin',
  rootLabel: 'Dashboard',
  segmentLabels: {
    institutes: 'Schools',
    new: 'New',
    edit: 'Edit',
    'top-institutes': 'Top Schools',
    users: 'User Management',
    calendar: 'Calendar',
    timetable: 'Timetable',
    analytics: 'Analytics',
    'ai-usage': 'AI Usage',
    'live-usage': 'Live Classes',
    'feature-flags': 'Feature Flags',
    reports: 'Reports',
    communications: 'Communication',
    communication: 'Communication',
    complaints: 'Support Tickets',
    'audit-logs': 'Audit Logs',
    security: 'Security Center',
    settings: 'Settings',
    notifications: 'Notifications',
    storage: 'Storage Usage',
    'erp-modules': 'ERP Modules',
  },
  pathLabels: { 'institutes/new': 'New School' },
  dynamicLabels: { institutes: 'School' },
};

const PORTALS = [STUDENT_PORTAL, ADMIN_PORTAL, TEACHER_PORTAL, SUPER_ADMIN_PORTAL];

export function portalForPath(pathname: string): PortalConfig | undefined {
  return PORTALS.find((p) => pathname === p.base || pathname.startsWith(`${p.base}/`));
}

// Student-facing helpers kept for the existing call sites and tests.
export const buildStudentCrumbs = (pathname: string, search: URLSearchParams, lastLabel?: string) =>
  buildTrail(STUDENT_PORTAL, pathname, search, lastLabel);
export const isBreadcrumbHidden = (pathname: string) => isTrailHidden(STUDENT_PORTAL, pathname);
