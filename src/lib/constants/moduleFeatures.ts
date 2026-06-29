export interface ModuleFeature {
  key: string;
  label: string;
  description: string;
  icon: string;
  defaultEnabled: boolean;
}

export const MASTER_MODULE_FEATURES: ModuleFeature[] = [
  { key: 'live_classes', label: 'Live Classes', description: 'Real-time streaming via OBS', icon: 'Video', defaultEnabled: true },
  { key: 'assessments', label: 'Assessments', description: 'Online tests engine', icon: 'ClipboardList', defaultEnabled: true },
  { key: 'assignments', label: 'Assignments', description: 'Assignment creation & submission', icon: 'FileText', defaultEnabled: true },
  { key: 'chat', label: 'Chat', description: 'Real-time messaging', icon: 'MessageSquare', defaultEnabled: true },
  { key: 'academic_calendar', label: 'Academic Calendar', description: 'School calendar, events and schedules', icon: 'CalendarDays', defaultEnabled: true },
  { key: 'timetable', label: 'Timetable', description: 'Class timetable and period scheduling', icon: 'CalendarCheck', defaultEnabled: true },
  { key: 'reports', label: 'Reports & Analytics', description: 'Performance reports and progress tracking', icon: 'BarChart3', defaultEnabled: true },
  { key: 'meetings', label: 'Meetings', description: 'Parent-teacher and staff meetings', icon: 'Users', defaultEnabled: true },
];

export interface RoleFeatureGroup {
  roleLabel: string;
  features: {
    key: string;
    parentKey: string;
    label: string;
    description: string;
    defaultEnabled: boolean;
  }[];
}

export const ROLE_MODULE_FEATURES: RoleFeatureGroup[] = [
  {
    roleLabel: 'School Admin Features',
    features: [
      { key: 'admin_live_classes', parentKey: 'live_classes', label: 'Manage Live Classes', description: 'Monitor and manage live sessions', defaultEnabled: true },
      { key: 'admin_chat', parentKey: 'chat', label: 'Admin Chat', description: 'Global messaging access', defaultEnabled: true },
      { key: 'admin_academic_calendar', parentKey: 'academic_calendar', label: 'Manage Academic Calendar', description: 'Create and manage school events', defaultEnabled: true },
      { key: 'admin_timetable', parentKey: 'timetable', label: 'Manage Timetable', description: 'Create and edit class timetables', defaultEnabled: true },
      { key: 'admin_reports', parentKey: 'reports', label: 'View School Reports & Analytics', description: 'View school-wide analytics and reports', defaultEnabled: true },
      { key: 'admin_meetings', parentKey: 'meetings', label: 'Manage Meetings', description: 'Schedule and manage all meetings', defaultEnabled: true },
    ]
  },
  {
    roleLabel: 'Teacher Features',
    features: [
      { key: 'teacher_live_classes', parentKey: 'live_classes', label: 'Host Live Classes', description: 'Create and stream live sessions', defaultEnabled: true },
      { key: 'teacher_assessments', parentKey: 'assessments', label: 'Manage Assessments', description: 'Create and grade tests', defaultEnabled: true },
      { key: 'teacher_assignments', parentKey: 'assignments', label: 'Manage Assignments', description: 'Assign and review homework', defaultEnabled: true },
      { key: 'teacher_chat', parentKey: 'chat', label: 'Teacher Chat', description: 'Message students and classes', defaultEnabled: true },
      { key: 'teacher_academic_calendar', parentKey: 'academic_calendar', label: 'View Academic Calendar', description: 'View school schedule and events', defaultEnabled: true },
      { key: 'teacher_timetable', parentKey: 'timetable', label: 'View Timetable', description: 'View personal teaching schedule', defaultEnabled: true },
      { key: 'teacher_reports', parentKey: 'reports', label: 'View Class Reports', description: 'View class and student performance', defaultEnabled: true },
      { key: 'teacher_meetings', parentKey: 'meetings', label: 'Host & Join Meetings', description: 'Join and manage parent-teacher meetings', defaultEnabled: true },
    ]
  },
  {
    roleLabel: 'Student Features',
    features: [
      { key: 'student_live_classes', parentKey: 'live_classes', label: 'Attend Live Classes', description: 'Join and watch live sessions', defaultEnabled: true },
      { key: 'student_assessments', parentKey: 'assessments', label: 'Take Assessments', description: 'Attempt online tests', defaultEnabled: true },
      { key: 'student_assignments', parentKey: 'assignments', label: 'Submit Assignments', description: 'Upload homework', defaultEnabled: true },
      { key: 'student_chat', parentKey: 'chat', label: 'Student Chat', description: 'Message teachers', defaultEnabled: true },
      { key: 'student_academic_calendar', parentKey: 'academic_calendar', label: 'View Academic Calendar', description: 'View school events and schedule', defaultEnabled: true },
      { key: 'student_timetable', parentKey: 'timetable', label: 'View Timetable', description: 'View class timetable', defaultEnabled: true },
      { key: 'student_reports', parentKey: 'reports', label: 'View My Performance Reports', description: 'View personal academic progress', defaultEnabled: true },
      { key: 'student_meetings', parentKey: 'meetings', label: 'Join Meetings', description: 'Join scheduled online meetings', defaultEnabled: true },
    ]
  },
  {
    roleLabel: 'Parent Features',
    features: [
      { key: 'parent_assignments', parentKey: 'assignments', label: 'View Assignments', description: 'Track child\'s homework', defaultEnabled: true },
      { key: 'parent_chat', parentKey: 'chat', label: 'Parent Chat', description: 'Message teachers', defaultEnabled: true },
      { key: 'parent_academic_calendar', parentKey: 'academic_calendar', label: 'View Academic Calendar', description: 'View child\'s school schedule', defaultEnabled: true },
      { key: 'parent_timetable', parentKey: 'timetable', label: 'View Child\'s Timetable', description: 'View child\'s timetable', defaultEnabled: true },
      { key: 'parent_reports', parentKey: 'reports', label: 'View Child\'s Reports', description: 'View child\'s performance and progress', defaultEnabled: true },
      { key: 'parent_meetings', parentKey: 'meetings', label: 'Join Parent-Teacher Meetings', description: 'Book and attend parent-teacher meetings', defaultEnabled: true },
    ]
  }
];

export const DEFAULT_MODULES: Record<string, boolean> = [
  ...MASTER_MODULE_FEATURES.map(f => ({ key: f.key, val: f.defaultEnabled })),
  ...ROLE_MODULE_FEATURES.flatMap(g => g.features.map(f => ({ key: f.key, val: f.defaultEnabled })))
].reduce((acc, f) => ({ ...acc, [f.key]: f.val }), {});

/** Returns true if the module is enabled. Defaults to true if key is missing (safe default). */
export function isModuleEnabled(
  modulesPermissions: Record<string, boolean> | null | undefined,
  key: string,
): boolean {
  if (!modulesPermissions) return true;
  return modulesPermissions[key] !== false;
}
