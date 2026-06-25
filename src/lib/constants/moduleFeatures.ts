export interface ModuleFeature {
  key: string;
  label: string;
  description: string;
  icon: string;
  defaultEnabled: boolean;
  affectsRoles: ('TEACHER' | 'STUDENT')[];
}

export const MODULE_FEATURES: ModuleFeature[] = [
  {
    key: 'live_classes',
    label: 'Live Classes',
    description: 'Teachers stream live via OBS; students watch in real-time with chat & reactions',
    icon: 'Video',
    defaultEnabled: true,
    affectsRoles: ['TEACHER', 'STUDENT'],
  },
  {
    key: 'assessments',
    label: 'Assessments',
    description: 'Online test creation (MCQ, long-form) and student test-taking engine',
    icon: 'ClipboardList',
    defaultEnabled: true,
    affectsRoles: ['TEACHER', 'STUDENT'],
  },
  {
    key: 'assignments',
    label: 'Assignments',
    description: 'Assignment creation, student submission and teacher review workflow',
    icon: 'FileText',
    defaultEnabled: true,
    affectsRoles: ['TEACHER', 'STUDENT'],
  },
  {
    key: 'chat',
    label: 'Chat',
    description: 'Real-time teacher-student and class-wide messaging',
    icon: 'MessageSquare',
    defaultEnabled: true,
    affectsRoles: ['TEACHER', 'STUDENT'],
  },
];

export const DEFAULT_MODULES: Record<string, boolean> = MODULE_FEATURES.reduce(
  (acc, f) => ({ ...acc, [f.key]: f.defaultEnabled }),
  {},
);

/** Returns true if the module is enabled. Defaults to true if key is missing (safe default). */
export function isModuleEnabled(
  modulesPermissions: Record<string, boolean> | null | undefined,
  key: string,
): boolean {
  if (!modulesPermissions) return true;
  return modulesPermissions[key] !== false;
}
