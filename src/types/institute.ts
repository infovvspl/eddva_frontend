export interface Institute {
  id?: string;
  name?: string;
  tenantDomain?: string;
  status?: string;
  isSuspended?: boolean;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  board?: string;
  schoolType?: string;
  affiliationNo?: string;
  establishedYear?: string | number;
  totalStudents?: number;
  totalTeachers?: number;
  totalClasses?: number;
  aiEnabled?: boolean;
  aiFeatures?: {
    ai_doubt_solver?: boolean;
    ai_notes_generator?: boolean;
    ai_quiz_generator?: boolean;
    ai_study_planner?: boolean;
    ai_homework_checker?: boolean;
    ai_attendance_insights?: boolean;
    ai_parent_reports?: boolean;
    ai_content_recommend?: boolean;
  };
}
