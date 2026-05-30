import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSubdomain } from "@/lib/tenant";
import { XPToastProvider } from "@/components/student/XPToast";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { SchoolGuard } from "./components/auth/SchoolGuard";
import DashboardLayout from "./components/layout/DashboardLayout";
import { SchoolAuthProvider } from "@/context/SchoolAuthContext";

// ── Route-level code splitting: each page loads its own JS chunk (faster first paint) ──

const Index = lazy(() => import("./pages/Index"));
const Courses = lazy(() => import("./pages/Courses"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const StudentRegisterPage = lazy(() => import("./pages/StudentRegisterPage"));
const SuperAdminDashboard = lazy(() => import("./pages/super-admin/SuperAdminDashboard"));
const InstitutesPage = lazy(() => import("./pages/super-admin/InstitutesPage"));
const NewInstitutePage = lazy(() => import("./pages/super-admin/NewInstitutePage"));
const InstituteDetailPage = lazy(() => import("./pages/super-admin/InstituteDetailPage"));
const UsersPage = lazy(() => import("./pages/super-admin/UsersPage"));
const AnnouncementsPage = lazy(() => import("./pages/super-admin/AnnouncementsPage"));
const PlatformStatsPage = lazy(() => import("./pages/super-admin/PlatformStatsPage"));
const SettingsPage = lazy(() => import("./pages/super-admin/SettingsPage"));

const EnrollmentsPage = lazy(() => import("./pages/super-admin/EnrollmentsPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const BatchesPage = lazy(() => import("./pages/admin/BatchesPage"));
const BatchDetailPage = lazy(() => import("./pages/admin/BatchDetailPage"));
const TeachersPage = lazy(() => import("./pages/admin/TeachersPage"));
const TeacherDetailPage = lazy(() => import("./pages/admin/TeacherDetailPage"));
const StudentsPage = lazy(() => import("./pages/admin/StudentsPage"));
const ContentPage = lazy(() => import("./pages/admin/ContentPage"));
const MockTestsPage = lazy(() => import("./pages/admin/MockTestsPage"));
const LecturesPage = lazy(() => import("./pages/admin/LecturesPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminCalendarPage = lazy(() => import("./pages/admin/AdminCalendarPage"));
const TeacherCalendarPage = lazy(() => import("./pages/teacher/TeacherCalendarPage"));
const StudentCalendarPage = lazy(() => import("./pages/student/StudentCalendarPage"));
const AdminStudentDetailPage = lazy(() => import("./pages/admin/AdminStudentDetailPage"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherOnboardingPage = lazy(() => import("./pages/teacher/TeacherOnboardingPage"));
const AdminOnboardingPage = lazy(() => import("./pages/admin/AdminOnboardingPage"));
const TeacherBatchesPage = lazy(() => import("./pages/teacher/TeacherBatchesPage"));
const TeacherLecturesPage = lazy(() => import("./pages/teacher/TeacherLecturesPage"));
const TeacherStudentDetailPage = lazy(() => import("./pages/teacher/TeacherStudentDetailPage"));
const TeacherQuizzesPage = lazy(() => import("./pages/teacher/TeacherQuizzesPage"));
const TeacherDoubtsPage = lazy(() => import("./pages/teacher/TeacherDoubtsPage"));
const TeacherAnalyticsPage = lazy(() => import("./pages/teacher/TeacherAnalyticsPage"));
const TeacherContentPage = lazy(() => import("./pages/teacher/TeacherContentPage"));
const TeacherAIToolsPage = lazy(() => import("./pages/teacher/TeacherAIToolsPage"));
const TeacherProfilePage = lazy(() => import("./pages/teacher/TeacherProfilePage"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const BattleArena = lazy(() => import("./pages/student/BattleArena"));
const StudentLecturePage = lazy(() => import("./pages/student/StudentLecturePage"));
const StudentLearnPage = lazy(() => import("./pages/student/StudentLearnPage"));
const StudentLecturesPage = lazy(() => import("./pages/student/StudentLecturesPage"));
const StudentDoubtsPage = lazy(() => import("./pages/student/StudentDoubtsPage"));
const StudentStudyPlanPage = lazy(() => import("./pages/student/StudentStudyPlanPage"));
const StudentLeaderboardPage = lazy(() => import("./pages/student/StudentLeaderboardPage"));
const StudentProfilePage = lazy(() => import("./pages/student/StudentProfilePage"));
const DiagnosticTestPage = lazy(() => import("./pages/student/DiagnosticTestPage"));
const StudentAiStudyPage = lazy(() => import("./pages/student/StudentAiStudyPage"));
const StudentTopicQuizPage = lazy(() => import("./pages/student/StudentTopicQuizPage"));
const StudentPYQPage = lazy(() => import("./pages/student/StudentPYQPage"));
const StudentCoursesPage = lazy(() => import("./pages/student/StudentCoursesPage"));
const StudentCourseDetailPage = lazy(() => import("./pages/student/StudentCourseDetailPage"));
const StudentOnboardingPage = lazy(() => import("./pages/student/StudentOnboardingPage"));
const StudentCourseTopicPage = lazy(() => import("./pages/student/StudentCourseTopicPage"));
const StudentNotificationsPage = lazy(() => import("./pages/student/StudentNotificationsPage"));
const StudentMockTestPage = lazy(() => import("./pages/student/StudentMockTestPage"));
const StudentTestsPage = lazy(() => import("./pages/student/StudentTestsPage"));
const StudentProgressPage = lazy(() => import("./pages/student/StudentProgressPage"));
const PYQManagementPage = lazy(() => import("./pages/admin/PYQManagementPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const TeacherTestResultsPage = lazy(() => import("./pages/admin/TeacherTestResultsPage"));
const TeacherManualGradingPage = lazy(() => import("./pages/admin/TeacherManualGradingPage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
const LiveClassRoom = lazy(() => import("./pages/live/LiveClassRoom"));
const NotFound = lazy(() => import("./pages/NotFound"));
const JoinBatchPage = lazy(() => import("./pages/JoinBatchPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const RegisterWithOtpPage = lazy(() => import("./pages/RegisterWithOtpPage"));
const ExamsRegistrationPage = lazy(() => import("./pages/landing/ExamsRegistrationPage"));
const StudyMaterialPage = lazy(() => import("./pages/landing/StudyMaterialPage"));
const CareerPage = lazy(() => import("./pages/landing/CareerPage"));
const ExamTrackDemoPage = lazy(() => import("./pages/landing/ExamTrackDemoPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/landing/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/landing/TermsOfServicePage"));
const CookiePolicyPage = lazy(() => import("./pages/landing/CookiePolicyPage"));
const SuspendedPage = lazy(() => import("./pages/SuspendedPage"));

// ── School admin pages ───────────────────────────────────────────────────────
const SchoolAdminLayout       = lazy(() => import("./components/school/admin/Layout"));
const SchoolAdminDashboard    = lazy(() => import("./pages/school/admin/AdminDashboard"));
const SchoolStudents          = lazy(() => import("./pages/school/admin/Students"));
const SchoolAdminStudentProfile = lazy(() => import("./pages/school/admin/StudentProfile"));
const SchoolTeachers          = lazy(() => import("./pages/school/admin/Teachers"));
const SchoolAdminTeacherProfile = lazy(() => import("./pages/school/admin/TeacherProfile"));
const SchoolAttendance        = lazy(() => import("./pages/school/admin/Attendance"));
const SchoolAcademics         = lazy(() => import("./pages/school/admin/Academics"));
const SchoolNotices           = lazy(() => import("./pages/school/admin/Notices"));
const SchoolFees              = lazy(() => import("./pages/school/admin/Fees"));
const SchoolAcademicCalendar  = lazy(() => import("./pages/school/admin/AcademicCalendar"));
const SchoolComplaints        = lazy(() => import("./pages/school/admin/Complaints"));
const SchoolAnalytics         = lazy(() => import("./pages/school/admin/Analytics"));
const SchoolTimetable         = lazy(() => import("./pages/school/admin/Timetable"));
const SchoolAdminSettings     = lazy(() => import("./pages/school/admin/AdminSettings"));
const SchoolReports           = lazy(() => import("./pages/school/admin/Reports"));
const SchoolFinance           = lazy(() => import("./pages/school/admin/Finance"));
const SchoolCommunications    = lazy(() => import("./pages/school/admin/Communications"));
const SchoolRoles             = lazy(() => import("./pages/school/admin/Roles"));
const SchoolAuditLogs         = lazy(() => import("./pages/school/admin/AuditLogs"));
const SchoolSecurity          = lazy(() => import("./pages/school/admin/SecurityCenter"));
const SchoolSubjects          = lazy(() => import("./pages/school/admin/Subjects"));
const SchoolAssignments       = lazy(() => import("./pages/school/admin/Assignments"));
const SchoolStudyMaterials    = lazy(() => import("./pages/school/admin/StudyMaterials"));
const SchoolSyllabus          = lazy(() => import("./pages/school/admin/Syllabus"));
const SchoolExams             = lazy(() => import("./pages/school/admin/Exams"));
const SchoolQuestionBank      = lazy(() => import("./pages/school/admin/QuestionBank"));
const SchoolMarksEntry        = lazy(() => import("./pages/school/admin/MarksEntry"));
const SchoolResults           = lazy(() => import("./pages/school/admin/Results"));
const SchoolReportCards       = lazy(() => import("./pages/school/admin/ReportCards"));
const SchoolFeeStructures     = lazy(() => import("./pages/school/admin/FeeStructures"));
const SchoolPaymentCollection = lazy(() => import("./pages/school/admin/PaymentCollection"));
const SchoolPaymentHistory    = lazy(() => import("./pages/school/admin/PaymentHistory"));
const SchoolFeeDefaulters     = lazy(() => import("./pages/school/admin/FeeDefaulters"));
const SchoolNotificationsCenter = lazy(() => import("./pages/school/admin/NotificationsCenter"));
const SchoolMessageLogs       = lazy(() => import("./pages/school/admin/MessageLogs"));
const SchoolEmailCenter       = lazy(() => import("./pages/school/admin/EmailCenter"));
const SchoolAiInsights        = lazy(() => import("./pages/school/admin/AiInsights"));
const SchoolStudentPerformance = lazy(() => import("./pages/school/admin/StudentPerformance"));
const SchoolAttendanceAnalytics = lazy(() => import("./pages/school/admin/AttendanceAnalytics"));
const SchoolCustomReports     = lazy(() => import("./pages/school/admin/CustomReports"));
const SchoolInstitutes        = lazy(() => import("./pages/school/admin/Institutes"));
const SchoolAdminUsers        = lazy(() => import("./pages/school/admin/Users"));

// ── School teacher pages ─────────────────────────────────────────────────────
const SchoolTeacherLayout       = lazy(() => import("./components/school/admin/Layout"));
const SchoolTeacherDashboard    = lazy(() => import("./pages/school/teacher/Dashboard"));
const SchoolTopicManagement     = lazy(() => import("./pages/school/teacher/TopicManagement"));
const SchoolClassManagement     = lazy(() => import("./pages/school/teacher/ClassManagement"));
const SchoolAttendanceSystem    = lazy(() => import("./pages/school/teacher/AttendanceSystem"));
const SchoolAssignmentManagement = lazy(() => import("./pages/school/teacher/AssignmentManagement"));
const SchoolAssessmentSystem    = lazy(() => import("./pages/school/teacher/AssessmentSystem"));
const SchoolAssessmentDetails   = lazy(() => import("./pages/school/teacher/AssessmentDetails"));
const SchoolCreatorStudio       = lazy(() => import("./pages/school/teacher/CreatorStudio"));
const SchoolTeacherReports      = lazy(() => import("./pages/school/teacher/Reports"));
const SchoolGrievanceHandling   = lazy(() => import("./pages/school/teacher/GrievanceHandling"));
const SchoolChatSystem          = lazy(() => import("./pages/school/teacher/ChatSystem"));
const SchoolTeacherProfile      = lazy(() => import("./pages/school/teacher/Profile"));
const SchoolTeacherNotifications = lazy(() => import("./pages/school/teacher/Notifications"));

// ── School student pages ─────────────────────────────────────────────────────
const SchoolStudentLayout       = lazy(() => import("./components/school/student/Layout"));
const SchoolStudentDashboard    = lazy(() => import("./pages/school/student/Dashboard"));
const SchoolStudentClasses      = lazy(() => import("./pages/school/student/Classes"));
const SchoolStudentClassDetails = lazy(() => import("./pages/school/student/ClassDetails"));
const SchoolStudentTopicDetails = lazy(() => import("./pages/school/student/TopicDetails"));
const SchoolStudentAssignments  = lazy(() => import("./pages/school/student/Assignments"));
const SchoolStudentAssessments  = lazy(() => import("./pages/school/student/Assessments"));
const SchoolStudentTestEngine   = lazy(() => import("./pages/school/student/TestEngine"));
const SchoolStudentSessionResult = lazy(() => import("./pages/school/student/SessionResult"));
const SchoolStudentAiAssistant  = lazy(() => import("./pages/school/student/AiAssistant"));
const SchoolStudentBattleArena  = lazy(() => import("./pages/school/student/BattleArena"));
const SchoolStudentStudyPlanner = lazy(() => import("./pages/school/student/StudyPlanner"));
const SchoolStudentCalendar     = lazy(() => import("./pages/school/student/Calendar"));
const SchoolStudentAnalytics    = lazy(() => import("./pages/school/student/Analytics"));
const SchoolStudentFeedback     = lazy(() => import("./pages/school/student/Feedback"));
const SchoolStudentChat         = lazy(() => import("./pages/school/student/Chat"));
const SchoolStudentProfile      = lazy(() => import("./pages/school/student/Profile"));

// ── Super-admin school pages ─────────────────────────────────────────────────
const SuperAdminSchoolPage      = lazy(() => import("./pages/super-admin/SchoolPage"));
const SuperAdminSchoolDetailPage = lazy(() => import("./pages/super-admin/SchoolDetailPage"));
const CreateSchoolPage          = lazy(() => import("./pages/super-admin/CreateSchoolPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,           // 1 min base — individual queries override upward
      gcTime: 10 * 60_000,         // keep unused data 10 min before garbage-collecting
      retry: 1,                    // one retry on failure, not the default 3
      refetchOnWindowFocus: false, // tab-switching must not hammer the API
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 0,
    },
  },
});

function RouteLoading() {
  return (
    <div
      className="flex min-h-dvh w-full items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/** Admin routes shared between tenant and platform */
const AdminRoutes = () => (
  <Route element={<ProtectedRoute allowedRoles={["institute_admin"]}><DashboardLayout /></ProtectedRoute>}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/batches" element={<BatchesPage />} />
    <Route path="/admin/batches/:id" element={<BatchDetailPage />} />
    <Route path="/admin/teachers" element={<TeachersPage />} />
    <Route path="/admin/teachers/:id" element={<TeacherDetailPage />} />
    <Route path="/admin/students" element={<StudentsPage />} />
    <Route path="/admin/students/:studentId" element={<AdminStudentDetailPage />} />
    <Route path="/admin/content/*" element={<ContentPage />} />
    <Route path="/admin/mock-tests" element={<MockTestsPage />} />
    <Route path="/admin/mock-tests/:testId/results" element={<TeacherTestResultsPage />} />
    <Route path="/admin/mock-tests/:testId/sessions/:sessionId/grade" element={<TeacherManualGradingPage />} />
    <Route path="/admin/lectures" element={<LecturesPage />} />
    <Route path="/admin/calendar" element={<AdminCalendarPage />} />
    <Route path="/admin/reports" element={<ReportsPage />} />
    <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
    <Route path="/admin/settings" element={<AdminSettingsPage />} />
  </Route>
);

// PYQ management — institute admin only
const PYQRoute = () => (
  <Route element={<ProtectedRoute allowedRoles={["institute_admin"]}><DashboardLayout /></ProtectedRoute>}>
    <Route path="/admin/pyq" element={<PYQManagementPage />} />
  </Route>
);

const TeacherRoutes = () => (
  <>
    <Route
      path="/teacher/onboarding"
      element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherOnboardingPage /></ProtectedRoute>}
    />
    <Route
      path="/admin/onboard"
      element={<ProtectedRoute allowedRoles={["institute_admin"]}><AdminOnboardingPage /></ProtectedRoute>}
    />
    <Route
      path="/teacher/students/:studentId"
      element={<ProtectedRoute allowedRoles={["teacher", "institute_admin"]}><DashboardLayout /></ProtectedRoute>}
    >
      <Route index element={<TeacherStudentDetailPage />} />
    </Route>
    <Route element={<ProtectedRoute allowedRoles={["teacher", "institute_admin"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/content/*" element={<TeacherContentPage />} />
      <Route path="/teacher/lectures" element={<TeacherLecturesPage />} />
      <Route path="/teacher/quizzes" element={<TeacherQuizzesPage />} />
      <Route path="/teacher/doubts" element={<TeacherDoubtsPage />} />
      <Route path="/teacher/batches" element={<TeacherBatchesPage />} />
      <Route path="/teacher/calendar" element={<TeacherCalendarPage />} />
      <Route path="/teacher/analytics" element={<TeacherAnalyticsPage />} />
      <Route path="/teacher/ai-tools" element={<TeacherAIToolsPage />} />
      <Route path="/teacher/profile" element={<TeacherProfilePage />} />
    </Route>
  </>
);

const StudentRoutes = () => (
  <>
    <Route
      path="/student/onboarding"
      element={<ProtectedRoute allowedRoles={["student"]}><StudentOnboardingPage /></ProtectedRoute>}
    />
    <Route element={<ProtectedRoute allowedRoles={["student"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/learn" element={<StudentLearnPage />} />
      <Route path="/student/learn/topic/:topicId" element={<StudentLearnPage />} />
      <Route path="/student/calendar" element={<StudentCalendarPage />} />
      <Route path="/student/lectures" element={<StudentLecturesPage />} />
      <Route path="/student/lectures/:id" element={<StudentLecturePage />} />
      <Route path="/student/battle" element={<BattleArena />} />
      <Route path="/student/doubts" element={<StudentDoubtsPage />} />
      <Route path="/student/leaderboard" element={<StudentLeaderboardPage />} />
      <Route path="/student/study-plan" element={<StudentStudyPlanPage />} />
      <Route path="/student/profile" element={<StudentProfilePage />} />
      <Route path="/student/progress" element={<StudentProgressPage />} />
      <Route path="/student/pyq/:topicId" element={<StudentPYQPage />} />
      <Route path="/student/courses" element={<StudentCoursesPage />} />
      <Route path="/student/courses/:batchId" element={<StudentCourseDetailPage />} />
      <Route path="/student/courses/:batchId/topics/:topicId" element={<StudentCourseTopicPage />} />
      <Route path="/student/diagnostic" element={<DiagnosticTestPage />} />
      <Route path="/student/ai-study/:topicId" element={<StudentAiStudyPage />} />
      <Route path="/student/quiz" element={<StudentTopicQuizPage />} />
      <Route path="/student/tests" element={<StudentTestsPage />} />
      <Route path="/student/mock-tests/:id" element={<StudentMockTestPage />} />
      <Route path="/student/notifications" element={<StudentNotificationsPage />} />
    </Route>
    <Route
      path="/live/:lectureId"
      element={<ProtectedRoute allowedRoles={["student", "teacher", "institute_admin"]}><LiveClassRoom /></ProtectedRoute>}
    />
  </>
);

// ── School routes ─────────────────────────────────────────────────────────────
const SchoolRoutes = () => (
  <>
    {/* School Admin */}
    <Route
      path="/school/admin"
      element={<SchoolGuard roles={["INSTITUTE_ADMIN", "SUPER_ADMIN"]}><SchoolAdminLayout /></SchoolGuard>}
    >
      <Route index element={<SchoolAdminDashboard />} />
      {/* School super-admin only */}
      <Route path="institutes" element={<SchoolGuard roles={["SUPER_ADMIN"]}><SchoolInstitutes /></SchoolGuard>} />
      <Route path="users"      element={<SchoolGuard roles={["SUPER_ADMIN", "INSTITUTE_ADMIN"]}><SchoolAdminUsers /></SchoolGuard>} />
      <Route path="students" element={<SchoolStudents />} />
      <Route path="students/:id" element={<SchoolAdminStudentProfile />} />
      <Route path="teachers" element={<SchoolTeachers />} />
      <Route path="teachers/:id" element={<SchoolAdminTeacherProfile />} />
      <Route path="attendance" element={<SchoolAttendance />} />
      <Route path="academics" element={<SchoolAcademics />} />
      <Route path="notices" element={<SchoolNotices />} />
      <Route path="fees" element={<SchoolFees />} />
      <Route path="calendar" element={<SchoolAcademicCalendar />} />
      <Route path="complaints" element={<SchoolComplaints />} />
      <Route path="analytics" element={<SchoolAnalytics />} />
      <Route path="timetable" element={<SchoolTimetable />} />
      <Route path="settings" element={<SchoolAdminSettings />} />
      <Route path="reports" element={<SchoolReports />} />
      <Route path="finance" element={<SchoolFinance />} />
      <Route path="communications" element={<SchoolCommunications />} />
      <Route path="roles" element={<SchoolRoles />} />
      <Route path="audit-logs" element={<SchoolAuditLogs />} />
      <Route path="security" element={<SchoolSecurity />} />
      <Route path="subjects" element={<SchoolSubjects />} />
      <Route path="assignments" element={<SchoolAssignments />} />
      <Route path="study-materials" element={<SchoolStudyMaterials />} />
      <Route path="syllabus" element={<SchoolSyllabus />} />
      <Route path="exams" element={<SchoolExams />} />
      <Route path="question-bank" element={<SchoolQuestionBank />} />
      <Route path="marks-entry" element={<SchoolMarksEntry />} />
      <Route path="results" element={<SchoolResults />} />
      <Route path="report-cards" element={<SchoolReportCards />} />
      <Route path="fee-structures" element={<SchoolFeeStructures />} />
      <Route path="payment-collection" element={<SchoolPaymentCollection />} />
      <Route path="payment-history" element={<SchoolPaymentHistory />} />
      <Route path="fee-defaulters" element={<SchoolFeeDefaulters />} />
      <Route path="notifications-center" element={<SchoolNotificationsCenter />} />
      <Route path="message-logs" element={<SchoolMessageLogs />} />
      <Route path="email-center" element={<SchoolEmailCenter />} />
      <Route path="ai-insights" element={<SchoolAiInsights />} />
      <Route path="student-performance" element={<SchoolStudentPerformance />} />
      <Route path="attendance-analytics" element={<SchoolAttendanceAnalytics />} />
      <Route path="custom-reports" element={<SchoolCustomReports />} />
    </Route>

    {/* School Teacher */}
    <Route
      path="/school/teacher"
      element={<SchoolGuard roles={["TEACHER"]}><SchoolTeacherLayout /></SchoolGuard>}
    >
      <Route index element={<SchoolTeacherDashboard />} />
      <Route path="profile" element={<SchoolTeacherProfile />} />
      <Route path="notifications" element={<SchoolTeacherNotifications />} />
      <Route path="topics" element={<SchoolTopicManagement />} />
      <Route path="classes" element={<SchoolClassManagement />} />
      <Route path="attendance" element={<SchoolAttendanceSystem />} />
      <Route path="assignments" element={<SchoolAssignmentManagement />} />
      <Route path="assessments" element={<SchoolAssessmentSystem />} />
      <Route path="assessments/:id" element={<SchoolAssessmentDetails />} />
      <Route path="creator" element={<SchoolCreatorStudio />} />
      <Route path="reports" element={<SchoolTeacherReports />} />
      <Route path="grievances" element={<SchoolGrievanceHandling />} />
      <Route path="chat" element={<SchoolChatSystem />} />
    </Route>

    {/* School Student */}
    <Route
      path="/school/student"
      element={<SchoolGuard roles={["STUDENT"]}><SchoolStudentLayout /></SchoolGuard>}
    >
      <Route index element={<SchoolStudentDashboard />} />
      <Route path="classes" element={<SchoolStudentClasses />} />
      <Route path="classes/:id" element={<SchoolStudentClassDetails />} />
      <Route path="classes/:batchId/topics/:topicId" element={<SchoolStudentTopicDetails />} />
      <Route path="assignments" element={<SchoolStudentAssignments />} />
      <Route path="assessments" element={<SchoolStudentAssessments />} />
      <Route path="assessments/:id/take" element={<SchoolStudentTestEngine />} />
      <Route path="assessments/:id" element={<SchoolStudentSessionResult />} />
      <Route path="ai-assistant" element={<SchoolStudentAiAssistant />} />
      <Route path="battle-arena" element={<SchoolStudentBattleArena />} />
      <Route path="planner" element={<SchoolStudentStudyPlanner />} />
      <Route path="calendar" element={<SchoolStudentCalendar />} />
      <Route path="analytics" element={<SchoolStudentAnalytics />} />
      <Route path="feedback" element={<SchoolStudentFeedback />} />
      <Route path="chat" element={<SchoolStudentChat />} />
      <Route path="profile" element={<SchoolStudentProfile />} />
    </Route>
  </>
);

// Super-admin routes — available in BOTH tenant and platform contexts so a
// super-admin visiting on localhost (with a stored tenant subdomain) doesn't get 404.
const SuperAdminRoutes = () => (
  <>
    <Route path="/super-admin/login" element={<Navigate to="/login" replace />} />
    <Route element={<ProtectedRoute allowedRoles={["super_admin"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
      <Route path="/super-admin/tenants" element={<InstitutesPage />} />
      <Route path="/super-admin/tenants/new" element={<NewInstitutePage />} />
      <Route path="/super-admin/tenants/:id" element={<InstituteDetailPage />} />
      <Route path="/super-admin/users" element={<UsersPage />} />
      <Route path="/super-admin/enrollments" element={<EnrollmentsPage />} />
      <Route path="/super-admin/announcements" element={<AnnouncementsPage />} />
      <Route path="/super-admin/stats" element={<PlatformStatsPage />} />
      <Route path="/super-admin/settings" element={<SettingsPage />} />
      <Route path="/super-admin/school" element={<SuperAdminSchoolPage />} />
      <Route path="/super-admin/school/new" element={<CreateSchoolPage />} />
      <Route path="/super-admin/school/:id" element={<SuperAdminSchoolDetailPage />} />
    </Route>
  </>
);

/** Routes for tenant subdomains (e.g. iit.edva.in) */
const TenantRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/about-us" element={<AboutUs />} />
    <Route path="/about" element={<AboutUs />} />
    <Route path="/exams-registration" element={<ExamsRegistrationPage />} />
    <Route path="/career" element={<CareerPage />} />
    <Route path="/exam/:track" element={<ExamTrackDemoPage />} />
    <Route path="/study-material/:type" element={<StudyMaterialPage />} />
    <Route path="/study-material" element={<StudyMaterialPage />} />
    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
    <Route path="/cookie-policy" element={<CookiePolicyPage />} />
    <Route path="/terms" element={<TermsOfServicePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/suspended" element={<SuspendedPage />} />
    <Route path="/register" element={<StudentRegisterPage />} />
    <Route path="/register-admin" element={<RegisterWithOtpPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/join" element={<JoinBatchPage />} />
    {/* Super-admin always accessible even if a tenant subdomain is cached */}
    {SuperAdminRoutes()}
    {AdminRoutes()}
    {PYQRoute()}
    {TeacherRoutes()}
    {StudentRoutes()}
    {SchoolRoutes()}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

/** Routes for the main platform domain */
const PlatformRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/courses" element={<Courses />} />
    <Route path="/about-us" element={<AboutUs />} />
    <Route path="/about" element={<AboutUs />} />
    <Route path="/exams-registration" element={<ExamsRegistrationPage />} />
    <Route path="/career" element={<CareerPage />} />
    <Route path="/exam/:track" element={<ExamTrackDemoPage />} />
    <Route path="/study-material/:type" element={<StudyMaterialPage />} />
    <Route path="/study-material" element={<StudyMaterialPage />} />
    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
    <Route path="/cookie-policy" element={<CookiePolicyPage />} />
    <Route path="/terms" element={<TermsOfServicePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/suspended" element={<SuspendedPage />} />
    <Route path="/register" element={<StudentRegisterPage />} />
    <Route path="/register-admin" element={<RegisterWithOtpPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/join" element={<JoinBatchPage />} />
    {SuperAdminRoutes()}
    {AdminRoutes()}
    {PYQRoute()}
    {TeacherRoutes()}
    {StudentRoutes()}
    {SchoolRoutes()}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  const isTenant = !!getSubdomain();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SchoolAuthProvider>
          <XPToastProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<RouteLoading />}>
                {isTenant ? <TenantRoutes /> : <PlatformRoutes />}
              </Suspense>
            </BrowserRouter>
          </XPToastProvider>
        </SchoolAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
