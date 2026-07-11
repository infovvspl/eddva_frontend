import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
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
import { AiFeatureGate } from "@/components/ai/AiFeatureGate";
import { NotificationProvider } from "@/context/SchoolNotificationContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { useModuleAccess } from "@/hooks/use-module-access";
import { useAuthStore, roleRedirectPath } from "@/lib/auth-store";
import { apiClient, extractData } from "@/lib/api/client";

function CoachingFontManager() {
  const location = useLocation();
  const tenantType = useAuthStore((state) => state.tenantType);

  useEffect(() => {
    if (location.pathname.startsWith("/school") || tenantType === "school") {
      document.documentElement.style.removeProperty("--font-sans");
    } else {
      document.documentElement.style.setProperty("--font-sans", '"Poppins"');
    }
  }, [location.pathname, tenantType]);

  return null;
}

function FeatureGuard({ moduleKey, children }: { moduleKey: string, children: React.ReactNode }) {
  const allowed = useModuleAccess(moduleKey);
  const user = useAuthStore((state) => state.user);
  if (!allowed) {
    const fallback = user?.role ? (roleRedirectPath[user.role] ?? "/login") : "/login";
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}
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
const SuperAdminCurriculumPage = lazy(() => import("./pages/super-admin/CurriculumPage"));
const SuperAdminContentLibraryPage = lazy(() => import("./pages/super-admin/ContentLibraryPage"));
const SuperAdminExamCalendarPage = lazy(() => import("./pages/super-admin/ExamCalendarPage"));
const SuperAdminFeeOverviewPage = lazy(() => import("./pages/super-admin/FeeOverviewPage"));
const SuperAdminPaymentsPage = lazy(() => import("./pages/super-admin/PaymentsPage"));
const SuperAdminRevenueReportsPage = lazy(() => import("./pages/super-admin/RevenueReportsPage"));
const SuperAdminAttendanceReportsPage = lazy(() => import("./pages/super-admin/AttendanceReportsPage"));
const SuperAdminFeatureFlagsPage = lazy(() => import("./pages/super-admin/FeatureFlagsPage"));
const CoachingFeatureFlagsPage = lazy(() => import("./pages/super-admin/CoachingFeatureFlagsPage"));
const PlatformStatsPage = lazy(() => import("./pages/super-admin/PlatformStatsPage"));
const CoachingLiveUsagePage = lazy(() => import("./pages/super-admin/LiveUsagePage"));
const SchoolLiveUsagePage = lazy(() => import("./pages/school/admin/LiveUsagePage"));
const TenantHealthPage = lazy(() => import("./pages/super-admin/TenantHealthPage"));
const SystemHealthPage = lazy(() => import("./pages/super-admin/SystemHealthPage"));
const BillingManagementPage = lazy(() => import("./pages/super-admin/BillingManagementPage"));
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
const RolesPage = lazy(() => import("./pages/admin/RolesPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const SupportTicketsPage = lazy(() => import("./pages/admin/SupportTicketsPage"));
const TeacherSupportTicketsPage = lazy(() => import("./pages/teacher/TeacherSupportTicketsPage"));
const SuperAdminSupportTicketsPage = lazy(() => import("./pages/super-admin/SuperAdminSupportTicketsPage"));
const CoachingTicketDetailPage = lazy(() => import("./pages/shared/CoachingTicketDetailPage"));
const AdminCalendarPage = lazy(() => import("./pages/admin/AdminCalendarPage"));
const TeacherCalendarPage = lazy(() => import("./pages/teacher/TeacherCalendarPage"));
const StudentCalendarPage = lazy(() => import("./pages/student/StudentCalendarPage"));
const AdminStudentDetailPage = lazy(() => import("./pages/admin/AdminStudentDetailPage"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherOnboardingPage = lazy(() => import("./pages/teacher/TeacherOnboardingPage"));
const AdminOnboardingPage = lazy(() => import("./pages/admin/AdminOnboardingPage"));
const TeacherBatchesPage = lazy(() => import("./pages/teacher/TeacherBatchesPage"));
const TeacherCommunications = lazy(() => import("./pages/teacher/Communications/TeacherCommunications"));
const TeacherLecturesPage = lazy(() => import("./pages/teacher/TeacherLecturesPage"));
const TeacherStudentDetailPage = lazy(() => import("./pages/teacher/TeacherStudentDetailPage"));
const TeacherQuizzesPage = lazy(() => import("./pages/teacher/TeacherQuizzesPage"));
const TeacherDoubtsPage = lazy(() => import("./pages/teacher/TeacherDoubtsPage"));
const TeacherAnalyticsPage = lazy(() => import("./pages/teacher/TeacherAnalyticsPage"));
const TeacherContentPage = lazy(() => import("./pages/teacher/TeacherContentPage"));
const TeacherProfilePage = lazy(() => import("./pages/teacher/TeacherProfilePage"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentCommunications = lazy(() => import("./pages/student/Communications/StudentCommunications"));
const BattleArena = lazy(() => import("./pages/student/BattleArena"));
const StudentLecturePage = lazy(() => import("./pages/student/StudentLecturePage"));
const StudentLearnPage = lazy(() => import("./pages/student/StudentLearnPage"));
const StudentLecturesPage = lazy(() => import("./pages/student/StudentLecturesPage"));
const StudentLiveClassesPage = lazy(() => import("./pages/student/StudentLiveClassesPage"));
const RecordedClassDetails = lazy(() => import("./pages/student/RecordedClassDetails"));
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
const CoachingResourcePage = lazy(() => import("./pages/resources/CoachingResourcePage"));
const StudentNotificationsPage = lazy(() => import("./pages/student/StudentNotificationsPage"));
const StudentMockTestPage = lazy(() => import("./pages/student/StudentMockTestPage"));
const StudentTestsPage = lazy(() => import("./pages/student/StudentTestsPage"));
const StudentProgressPage = lazy(() => import("./pages/student/StudentProgressPage"));
const PYQManagementPage = lazy(() => import("./pages/admin/PYQManagementPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const TeacherTestResultsPage = lazy(() => import("./pages/admin/TeacherTestResultsPage"));
const TeacherManualGradingPage = lazy(() => import("./pages/admin/TeacherManualGradingPage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
const AdminCommunicationPage = lazy(() => import("./pages/admin/AdminCommunicationPage"));
const LiveClassRoom = lazy(() => import("./pages/live/LiveClassRoom"));
const TeacherLiveDashboard = lazy(() => import("./pages/teacher/TeacherLiveDashboard"));
const StudentLiveRoomPage = lazy(() => import("./pages/student/StudentLiveRoomPage"));
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
const SchoolAdminLayout = lazy(() => import("./components/school/admin/Layout"));
const SchoolAdminDashboard = lazy(() => import("./pages/school/admin/AdminDashboard"));
const SchoolStudents = lazy(() => import("./pages/school/admin/Students"));
const SchoolStudentRegistration = lazy(() => import("./pages/school/admin/StudentRegistration"));
const SchoolStudentPromotion = lazy(() => import("./pages/school/admin/StudentPromotion"));
const SchoolAdminStudentProfile = lazy(() => import("./pages/school/admin/StudentProfile"));
const SchoolTeachers = lazy(() => import("./pages/school/admin/Teachers"));
const SchoolTeacherRegistration = lazy(() => import("./pages/school/admin/TeacherRegistration"));
const SchoolAdminTeacherProfile = lazy(() => import("./pages/school/admin/TeacherProfile"));
const SchoolTeacherStudentBracketList = lazy(() => import("./pages/school/admin/TeacherStudentBracketList"));
const SchoolAttendance = lazy(() => import("./pages/school/admin/Attendance"));
const SchoolAcademics = lazy(() => import("./pages/school/admin/Academics"));
const SchoolClassSections = lazy(() => import("./pages/school/admin/ClassSections"));
const SchoolNotices = lazy(() => import("./pages/school/admin/Notices"));
const SchoolFees = lazy(() => import("./pages/school/admin/Fees"));
const SchoolAcademicCalendar = lazy(() => import("./pages/school/admin/AcademicCalendar"));
const SchoolComplaints = lazy(() => import("./pages/school/admin/Complaints"));
const SchoolAnalytics = lazy(() => import("./pages/school/admin/Analytics"));
const SchoolAiUsage = lazy(() => import("./pages/school/admin/AiUsage"));
const SchoolTimetable = lazy(() => import("./pages/school/admin/Timetable"));
const SchoolAdminSettings = lazy(() => import("./pages/school/admin/AdminSettings"));
const SchoolReports = lazy(() => import("./pages/school/admin/Reports"));
const SchoolFinance = lazy(() => import("./pages/school/admin/Finance"));
const SchoolCommunications = lazy(() => import("./pages/school/admin/Communications"));
const SchoolAuditLogs = lazy(() => import("./pages/school/admin/AuditLogs"));
const SchoolSecurity = lazy(() => import("./pages/school/admin/SecurityCenter"));
const SchoolSubjects = lazy(() => import("./pages/school/admin/Subjects"));
const SchoolClassSubjects = lazy(() => import("./pages/school/admin/ClassSubjects"));
const SchoolAssignments = lazy(() => import("./pages/school/admin/Assignments"));
const SchoolStudyMaterials = lazy(() => import("./pages/school/admin/StudyMaterials"));
const SchoolSyllabus = lazy(() => import("./pages/school/admin/Syllabus"));
const SchoolExams = lazy(() => import("./pages/school/admin/Exams"));
const SchoolQuestionBank = lazy(() => import("./pages/school/admin/QuestionBank"));
const SchoolMarksEntry = lazy(() => import("./pages/school/admin/MarksEntry"));
const SchoolResults = lazy(() => import("./pages/school/admin/Results"));
const SchoolReportCards = lazy(() => import("./pages/school/admin/ReportCards"));
const SchoolFeeStructures = lazy(() => import("./pages/school/admin/FeeStructures"));
const SchoolPaymentCollection = lazy(() => import("./pages/school/admin/PaymentCollection"));
const SchoolPaymentHistory = lazy(() => import("./pages/school/admin/PaymentHistory"));
const SchoolFeeDefaulters = lazy(() => import("./pages/school/admin/FeeDefaulters"));
const SchoolMessageLogs = lazy(() => import("./pages/school/admin/MessageLogs"));
const SchoolAiInsights = lazy(() => import("./pages/school/admin/AiInsights"));
const SchoolStudentPerformance = lazy(() => import("./pages/school/admin/StudentPerformance"));
const SchoolAttendanceAnalytics = lazy(() => import("./pages/school/admin/AttendanceAnalytics"));
const SchoolCustomReports = lazy(() => import("./pages/school/admin/CustomReports"));
const SchoolInstitutes = lazy(() => import("./pages/school/admin/Institutes"));
const SchoolAdminUsers = lazy(() => import("./pages/school/admin/Users"));
const SchoolAdminNotifications = lazy(() => import("./pages/school/admin/NotificationsCenter"));
const SchoolInstituteProfile = lazy(() => import("./pages/school/admin/InstituteProfile"));
const SchoolTopInstitutes = lazy(() => import("./pages/school/admin/TopInstitutes"));
const SuperAdminCommunication = lazy(() => import("./pages/school/admin/SuperAdminCommunication"));

// ── School teacher pages ─────────────────────────────────────────────────────
// SchoolTeacherLayout intentionally reuses SchoolAdminLayout — the single
// components/school/admin/Layout renders role-aware sidebar nav via SchoolAuthContext.
const SchoolTeacherLayout = SchoolAdminLayout;
const SchoolTeacherDashboard = lazy(() => import("./pages/school/teacher/Dashboard"));
const SchoolTeacherStudents = lazy(() => import("./pages/school/teacher/Students"));
const SchoolTopicManagement = lazy(() => import("./pages/school/teacher/TopicManagement"));
const SchoolClassManagement = lazy(() => import("./pages/school/teacher/ClassManagement"));
const SchoolTeacherCalendar = lazy(() => import("./pages/school/teacher/Calendar"));
const SchoolAttendanceSystem = lazy(() => import("./pages/school/teacher/AttendanceSystem"));
const SchoolAssignmentManagement = lazy(() => import("./pages/school/teacher/AssignmentManagement"));
const SchoolAssessmentSystem = lazy(() => import("./pages/school/teacher/AssessmentSystem"));
const SchoolAssessmentDetails = lazy(() => import("./pages/school/teacher/AssessmentDetails"));
const SchoolAssessmentSubmissionReview = lazy(() => import("./pages/school/teacher/AssessmentSubmissionReview"));
const SchoolTeacherReports = lazy(() => import("./pages/school/teacher/Reports"));
const SchoolWeaknessDetails = lazy(() => import("./pages/school/teacher/WeaknessDetails"));
const SchoolGrievanceHandling = lazy(() => import("./pages/school/teacher/GrievanceHandling"));
const SchoolChatSystem = lazy(() => import("./pages/school/teacher/ChatSystem"));
const SchoolTeacherMeetings = lazy(() => import("./pages/school/teacher/Meetings"));
const SchoolTeacherProfile = lazy(() => import("./pages/school/teacher/Profile"));
const SchoolTeacherNotifications = lazy(() => import("./pages/school/teacher/Notifications"));
const SchoolTeacherAnnouncements = lazy(() => import("./pages/school/teacher/Announcements"));
const SchoolTeacherDoubtQueue = lazy(() => import("./pages/school/teacher/DoubtQueue"));
const SchoolTeacherSettings = lazy(() => import("./pages/school/teacher/Settings"));
const SchoolTeacherTimetable = lazy(() => import("./pages/school/teacher/Timetable"));
const SchoolTeacherCreateLive = lazy(() => import("./pages/school/teacher/live/TeacherCreateLive"));
const SchoolTeacherLiveDashboard = lazy(() => import("./pages/school/teacher/live/TeacherLiveDashboard"));
const SchoolStudentLivePlayer = lazy(() => import("./pages/school/student/live/StudentLivePlayer"));
const SchoolMaterialViewPage = lazy(() => import("./pages/school/MaterialViewPage"));

// ── School student pages ─────────────────────────────────────────────────────
const SchoolStudentLayout = lazy(() => import("./components/school/student/Layout"));
const SchoolStudentDashboard = lazy(() => import("./pages/school/student/Dashboard"));
const SchoolStudentClasses = lazy(() => import("./pages/school/student/Classes"));
const SchoolStudentRecordedClassDetails = lazy(() => import("./pages/school/student/RecordedClassDetails"));
const SchoolStudentClassDetails = lazy(() => import("./pages/school/student/ClassDetails"));
const SchoolStudentTopicDetails = lazy(() => import("./pages/school/student/TopicDetails"));
const SchoolStudentStudyMaterials = lazy(() => import("./pages/school/student/StudyMaterials"));
const SchoolStudentAssignments = lazy(() => import("./pages/school/student/Assignments"));
const SchoolStudentAssessments = lazy(() => import("./pages/school/student/Assessments"));
const SchoolStudentAssessmentView = lazy(() => import("./pages/school/student/AssessmentView"));
const SchoolStudentTestEngine = lazy(() => import("./pages/school/student/TestEngine"));
const SchoolStudentSessionResult = lazy(() => import("./pages/school/student/SessionResult"));

const SchoolStudentDoubts = lazy(() => import("./pages/school/student/Doubts"));
const SchoolStudentBattleArena = lazy(() => import("./pages/school/student/BattleArena"));
const SchoolStudentGamification = lazy(() => import("./pages/school/student/Gamification"));
const SchoolStudentQuizRush = lazy(() => import("./pages/school/student/game-zone/QuizRush"));
const SchoolStudentTreasureHunt = lazy(() => import("./pages/school/student/game-zone/TreasureHunt"));
const SchoolStudentMathSprint = lazy(() => import("./pages/school/student/game-zone/MathSprint"));
const SchoolStudentMemoryMatch = lazy(() => import("./pages/school/student/game-zone/MemoryMatch"));
const SchoolStudentWordMaster = lazy(() => import("./pages/school/student/game-zone/WordMaster"));
const SchoolStudentStudyPlanner = lazy(() => import("./pages/school/student/StudyPlanner"));
const SchoolStudentAttendance = lazy(() => import("./pages/school/student/Attendance"));
const SchoolStudentCalendar = lazy(() => import("./pages/school/student/Calendar"));
const SchoolStudentTimetable = lazy(() => import("./pages/school/student/Timetable"));
const SchoolStudentAnalytics = lazy(() => import("./pages/school/student/Analytics"));
const SchoolStudentAnnouncements = lazy(() => import("./pages/school/student/Announcements"));
const SchoolStudentChat = lazy(() => import("./pages/school/student/Chat"));
const SchoolStudentProfile = lazy(() => import("./pages/school/student/Profile"));
const SchoolStudentSettings = lazy(() => import("./pages/school/student/Settings"));
const SchoolStudentCareer = lazy(() => import("./pages/school/student/career/CareerHome"));
const SchoolStudentCareerQuiz = lazy(() => import("./pages/school/student/career/CareerQuiz"));
const SchoolStudentCareerQuizResult = lazy(() => import("./pages/school/student/career/CareerQuizResult"));
const SchoolStudentCareerReport = lazy(() => import("./pages/school/student/career/CareerReport"));
const SchoolStudentCareerExplorer = lazy(() => import("./pages/school/student/career/CareerExplorer"));
const SchoolStudentCareerDetail = lazy(() => import("./pages/school/student/career/CareerDetail"));
const SchoolStudentAiStudyPage = lazy(() => import("./pages/school/student/SchoolStudentAiStudyPage"));
const SchoolStudentTopicQuizPage = lazy(() => import("./pages/school/student/SchoolStudentTopicQuizPage"));

// ── School parent pages ──────────────────────────────────────────────────────
const SchoolParentLayout = lazy(() => import("./components/school/parent/ParentLayout"));
const SchoolParentAuthGuard = lazy(() => import("./components/school/parent/ParentAuthGuard").then(m => ({ default: m.ParentAuthGuard })));
const SchoolParentLogin = lazy(() => import("./pages/school/parent/Login"));
const SchoolParentDashboard = lazy(() => import("./pages/school/parent/Dashboard"));
const SchoolParentChild = lazy(() => import("./pages/school/parent/Child"));
const SchoolParentCommunication = lazy(() => import("./pages/school/parent/Communication"));
const SchoolParentNotifications = lazy(() => import("./pages/school/parent/Notifications"));
const SchoolStudentNotifications = lazy(() => import("./pages/school/student/Notifications"));
const SchoolParentProfile = lazy(() => import("./pages/school/parent/Profile"));

// ── Super-admin school pages ─────────────────────────────────────────────────
const SuperAdminSchoolPage = lazy(() => import("./pages/super-admin/SchoolPage"));
const SuperAdminSchoolDetailPage = lazy(() => import("./pages/super-admin/SchoolDetailPage"));
const CreateSchoolPage = lazy(() => import("./pages/super-admin/CreateSchoolPage"));
const SuperAdminCourseDetailPage = lazy(() => import("./pages/super-admin/CourseDetailPage"));

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
    <Route path="/admin/roles" element={<RolesPage />} />
    <Route path="/admin/students" element={<StudentsPage />} />
    <Route path="/admin/students/:studentId" element={<AdminStudentDetailPage />} />
    <Route path="/admin/content/*" element={<ContentPage />} />
    <Route path="/admin/resources/:resourceId" element={<CoachingResourcePage />} />
    <Route path="/admin/mock-tests" element={<MockTestsPage />} />
    <Route path="/admin/mock-tests/:testId/results" element={<TeacherTestResultsPage />} />
    <Route path="/admin/mock-tests/:testId/sessions/:sessionId/grade" element={<TeacherManualGradingPage />} />
    <Route path="/admin/lectures" element={<LecturesPage />} />
    <Route path="/admin/calendar" element={<AdminCalendarPage />} />
    <Route path="/admin/reports" element={<ReportsPage />} />
    <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
    <Route path="/admin/communication" element={<AdminCommunicationPage />} />
    <Route path="/admin/support-tickets" element={<SupportTicketsPage />} />
    <Route path="/admin/support-tickets/:ticketId" element={<CoachingTicketDetailPage />} />
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
      path="/teacher/live/:id"
      element={<ProtectedRoute allowedRoles={["teacher", "institute_admin"]}><FeatureGuard moduleKey="live_lectures"><TeacherLiveDashboard /></FeatureGuard></ProtectedRoute>}
    />
    <Route
      path="/teacher/students/:studentId"
      element={<ProtectedRoute allowedRoles={["teacher", "institute_admin"]}><DashboardLayout /></ProtectedRoute>}
    >
      <Route index element={<TeacherStudentDetailPage />} />
    </Route>
    <Route element={<ProtectedRoute allowedRoles={["teacher", "institute_admin"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/content/*" element={<ContentPage />} />
      <Route path="/teacher/resources/:resourceId" element={<CoachingResourcePage />} />
      <Route path="/teacher/lectures" element={<FeatureGuard moduleKey="live_lectures"><TeacherLecturesPage defaultTab="live" /></FeatureGuard>} />
      <Route path="/teacher/recorded-lectures" element={<FeatureGuard moduleKey="recorded_lectures"><TeacherLecturesPage defaultTab="recorded" /></FeatureGuard>} />
      <Route path="/teacher/quizzes" element={<TeacherQuizzesPage />} />
      <Route path="/teacher/doubts" element={<TeacherDoubtsPage />} />
      <Route path="/teacher/batches" element={<TeacherBatchesPage />} />
      <Route path="/teacher/communication" element={<TeacherCommunications />} />
      <Route path="/teacher/calendar" element={<TeacherCalendarPage />} />
      <Route path="/teacher/analytics" element={<TeacherAnalyticsPage />} />
      <Route path="/teacher/support-tickets" element={<TeacherSupportTicketsPage />} />
      <Route path="/teacher/support-tickets/:ticketId" element={<CoachingTicketDetailPage />} />
      <Route path="/teacher/profile" element={<TeacherProfilePage />} />
      <Route path="/teacher/notifications" element={<AdminNotificationsPage />} />
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
      <Route path="/student/learn" element={<FeatureGuard moduleKey="content_library"><StudentLearnPage /></FeatureGuard>} />
      <Route path="/student/learn/topic/:topicId" element={<FeatureGuard moduleKey="content_library"><StudentLearnPage /></FeatureGuard>} />
      <Route path="/student/calendar" element={<FeatureGuard moduleKey="calendar"><StudentCalendarPage /></FeatureGuard>} />
      <Route path="/student/communication" element={<StudentCommunications />} />
      <Route path="/student/lectures" element={<StudentLecturesPage />} />
      <Route path="/student/lectures/:id" element={<FeatureGuard moduleKey="recorded_lectures"><StudentLecturePage /></FeatureGuard>} />
      <Route path="/student/live-classes" element={<FeatureGuard moduleKey="live_lectures"><StudentLiveClassesPage /></FeatureGuard>} />
      <Route path="/student/live-classes/:recordingId/recording" element={<FeatureGuard moduleKey="live_lectures"><RecordedClassDetails /></FeatureGuard>} />
      <Route path="/student/battle" element={<AiFeatureGate feature="ai_battle_arena" title="Battle Arena"><BattleArena /></AiFeatureGate>} />
      <Route path="/student/doubts" element={<FeatureGuard moduleKey="doubt_queue"><StudentDoubtsPage /></FeatureGuard>} />
      <Route path="/student/leaderboard" element={<FeatureGuard moduleKey="leaderboard"><StudentLeaderboardPage /></FeatureGuard>} />
      <Route path="/student/study-plan" element={<AiFeatureGate feature="ai_study_plan" title="AI Study Plan"><StudentStudyPlanPage /></AiFeatureGate>} />
      <Route path="/student/profile" element={<StudentProfilePage />} />
      <Route path="/student/progress" element={<StudentProgressPage />} />
      <Route path="/student/pyq/:topicId" element={<FeatureGuard moduleKey="pyq_bank"><StudentPYQPage /></FeatureGuard>} />
      <Route path="/student/courses" element={<StudentCoursesPage />} />
      <Route path="/student/courses/:batchId" element={<StudentCourseDetailPage />} />
      <Route path="/student/courses/:batchId/topics/:topicId" element={<StudentCourseTopicPage />} />
      <Route path="/student/resources/:resourceId" element={<CoachingResourcePage />} />
      <Route path="/student/diagnostic" element={<DiagnosticTestPage />} />
      <Route path="/student/ai-study/:topicId" element={<AiFeatureGate feature="ai_study_assistant" title="AI Study Assistant"><StudentAiStudyPage /></AiFeatureGate>} />
      <Route path="/student/quiz" element={<StudentTopicQuizPage />} />
      <Route path="/student/tests" element={<FeatureGuard moduleKey="mock_tests"><StudentTestsPage /></FeatureGuard>} />
      <Route path="/student/mock-tests/:id" element={<FeatureGuard moduleKey="mock_tests"><StudentMockTestPage /></FeatureGuard>} />
      <Route path="/student/notifications" element={<FeatureGuard moduleKey="notifications"><StudentNotificationsPage /></FeatureGuard>} />
    </Route>
    <Route
      path="/live/:lectureId"
      element={<ProtectedRoute allowedRoles={["student", "teacher", "institute_admin"]}><FeatureGuard moduleKey="live_lectures"><LiveClassRoom /></FeatureGuard></ProtectedRoute>}
    />
    <Route
      path="/student/live/:id"
      element={<ProtectedRoute allowedRoles={["student"]}><FeatureGuard moduleKey="live_lectures"><StudentLiveRoomPage /></FeatureGuard></ProtectedRoute>}
    />
  </>
);

// ── School routes ─────────────────────────────────────────────────────────────
const SchoolRoutes = () => (
  <>
    {/* School Admin */}
    <Route
      path="/school/admin"
      element={<SchoolGuard roles={["INSTITUTE_ADMIN"]}><SchoolAdminLayout /></SchoolGuard>}
    >
      <Route index element={<SchoolAdminDashboard />} />
      <Route path="users" element={<SchoolGuard roles={["INSTITUTE_ADMIN"]}><SchoolAdminUsers /></SchoolGuard>} />
      <Route path="students" element={<SchoolStudents />} />
      <Route path="students/new" element={<SchoolStudentRegistration />} />
      <Route path="students/:id/edit" element={<SchoolStudentRegistration />} />
      <Route path="students/:id" element={<SchoolAdminStudentProfile />} />
      <Route path="student-promotion" element={<SchoolStudentPromotion />} />
      <Route path="teachers" element={<SchoolTeachers />} />
      <Route path="teachers/new" element={<SchoolTeacherRegistration />} />
      <Route path="teachers/:id/edit" element={<SchoolTeacherRegistration />} />
      <Route path="teachers/:id/performance/:bracket" element={<SchoolTeacherStudentBracketList />} />
      <Route path="teachers/:id" element={<SchoolAdminTeacherProfile />} />
      <Route path="attendance" element={<SchoolAttendance />} />
      <Route path="academics" element={<SchoolAcademics />} />
      <Route path="academics/:classId/sections" element={<SchoolClassSections />} />
      <Route path="notices" element={<SchoolNotices />} />
      <Route path="notifications" element={<SchoolAdminNotifications />} />
      <Route path="announcements" element={<Navigate to="/school/admin/notices" replace />} />
      <Route path="calendar" element={<SchoolGuard roles={["INSTITUTE_ADMIN"]} feature={{ type: 'module', key: 'academic_calendar' }}><SchoolAcademicCalendar /></SchoolGuard>} />
      <Route path="complaints" element={<SchoolComplaints />} />
      <Route path="timetable" element={<SchoolGuard roles={["INSTITUTE_ADMIN"]} feature={{ type: 'module', key: 'timetable' }}><SchoolTimetable /></SchoolGuard>} />
      <Route path="settings" element={<SchoolAdminSettings />} />
      <Route path="analytics" element={<SchoolGuard roles={["INSTITUTE_ADMIN"]} feature={{ type: 'module', key: 'reports' }}><SchoolAnalytics /></SchoolGuard>} />
      <Route path="ai-usage" element={<SchoolAiUsage />} />
      <Route path="reports" element={<SchoolGuard roles={["INSTITUTE_ADMIN"]} feature={{ type: 'module', key: 'reports' }}><SchoolReports /></SchoolGuard>} />
      <Route path="communications" element={<SchoolGuard roles={["INSTITUTE_ADMIN"]} feature={{ type: 'module', key: 'chat' }}><SchoolCommunications /></SchoolGuard>} />
      <Route path="audit-logs" element={<SchoolAuditLogs />} />
      <Route path="institute-profile" element={<SchoolInstituteProfile />} />
      <Route path="security" element={<SchoolSecurity />} />
      <Route path="subjects" element={<SchoolSubjects />} />
      <Route path="subjects/:classId" element={<SchoolClassSubjects />} />
      <Route path="message-logs" element={<SchoolMessageLogs />} />
    </Route>

    {/* School Super Admin */}
    <Route
      path="/school/super-admin"
      element={<SchoolGuard roles={["SUPER_ADMIN"]}><SchoolAdminLayout /></SchoolGuard>}
    >
      <Route index element={<SchoolAdminDashboard />} />
      <Route path="institutes" element={<SchoolInstitutes />} />
      <Route path="top-institutes" element={<SchoolTopInstitutes />} />
      <Route path="institutes/new" element={<CreateSchoolPage />} />
      <Route path="institutes/:id/edit" element={<CreateSchoolPage />} />
      <Route path="institutes/:id" element={<SuperAdminSchoolDetailPage />} />
      <Route path="users" element={<SchoolAdminUsers />} />
      <Route path="calendar" element={<SchoolAcademicCalendar />} />
      <Route path="timetable" element={<SchoolTimetable />} />
      <Route path="analytics" element={<SchoolAnalytics />} />
      <Route path="ai-usage" element={<SchoolAiUsage />} />
      <Route path="live-usage" element={<SchoolLiveUsagePage />} />
      <Route path="feature-flags" element={<SuperAdminFeatureFlagsPage />} />
      <Route path="reports" element={<SchoolReports />} />
      <Route path="communications" element={<SchoolCommunications />} />
      <Route path="communication" element={<SuperAdminCommunication />} />
      <Route path="complaints" element={<SchoolComplaints />} />
      <Route path="audit-logs" element={<SchoolAuditLogs />} />
      <Route path="security" element={<SchoolSecurity />} />
      <Route path="settings" element={<SchoolAdminSettings />} />
      <Route path="notifications" element={<SchoolAdminNotifications />} />
    </Route>

    {/* School Teacher */}
    <Route
      path="/school/teacher"
      element={<SchoolGuard roles={["TEACHER"]}><SchoolTeacherLayout /></SchoolGuard>}
    >
      <Route index element={<SchoolTeacherDashboard />} />
      <Route path="students" element={<SchoolTeacherStudents />} />
      <Route path="profile" element={<SchoolTeacherProfile />} />
      <Route path="settings" element={<SchoolTeacherSettings />} />
      <Route path="notifications" element={<SchoolTeacherNotifications />} />
      <Route path="announcements" element={<SchoolTeacherAnnouncements />} />
      <Route path="timetable" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'timetable' }}><SchoolTeacherTimetable /></SchoolGuard>} />
      <Route path="course-content" element={<SchoolTopicManagement />} />
      <Route path="course-content/materials/:materialId" element={<SchoolMaterialViewPage />} />
      <Route path="live" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'live_classes' }}><SchoolTeacherCreateLive /></SchoolGuard>} />
      <Route path="live/:id/dashboard" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'live_classes' }}><SchoolTeacherLiveDashboard /></SchoolGuard>} />
      <Route path="topics" element={<Navigate to="/school/teacher/course-content" replace />} />
      <Route path="classes" element={<SchoolClassManagement />} />
      <Route path="calendar" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'academic_calendar' }}><SchoolTeacherCalendar /></SchoolGuard>} />
      <Route path="attendance" element={<SchoolAttendanceSystem />} />
      <Route path="assignments" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'assignments' }}><SchoolAssignmentManagement /></SchoolGuard>} />
      <Route path="assessments" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'assessments' }}><SchoolAssessmentSystem /></SchoolGuard>} />
      <Route path="assessments/:id/submissions/:studentId/review" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'assessments' }}><SchoolAssessmentSubmissionReview /></SchoolGuard>} />
      <Route path="assessments/:id" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'assessments' }}><SchoolAssessmentDetails /></SchoolGuard>} />
      <Route path="reports" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'reports' }}><SchoolTeacherReports /></SchoolGuard>} />
      <Route path="reports/weakness/:topic" element={<SchoolWeaknessDetails />} />
      <Route path="meetings" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'meetings' }}><SchoolTeacherMeetings /></SchoolGuard>} />
      <Route path="grievances" element={<SchoolGrievanceHandling />} />
      <Route path="chat" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'module', key: 'chat' }}><SchoolChatSystem /></SchoolGuard>} />
      <Route path="doubts" element={<SchoolGuard roles={["TEACHER"]} feature={{ type: 'ai', key: 'ai_doubt_solver' }}><SchoolTeacherDoubtQueue /></SchoolGuard>} />
    </Route>

    {/* School Student */}
    <Route
      path="/school/student"
      element={<SchoolGuard roles={["STUDENT"]}><SchoolStudentLayout /></SchoolGuard>}
    >
      <Route index element={<SchoolStudentDashboard />} />
      <Route path="live-classes" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'live_classes' }}><SchoolStudentClasses /></SchoolGuard>} />
      <Route path="live-classes/:recordingId/recording" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'live_classes' }}><SchoolStudentRecordedClassDetails /></SchoolGuard>} />
      <Route path="live/:id/watch" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'live_classes' }}><SchoolStudentLivePlayer /></SchoolGuard>} />
      <Route path="recorded-classes" element={<SchoolStudentClasses />} />
      <Route path="recorded-classes/:recordingId" element={<SchoolStudentRecordedClassDetails />} />
      <Route path="classes" element={<SchoolStudentClasses />} />
      <Route path="classes/:id" element={<SchoolStudentClassDetails />} />
      <Route path="classes/:batchId/topics/:topicId" element={<SchoolStudentTopicDetails />} />
      <Route path="study-materials" element={<SchoolStudentStudyMaterials />} />
      <Route path="study-materials/:materialId" element={<SchoolMaterialViewPage />} />
      <Route path="assignments" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'assignments' }}><SchoolStudentAssignments /></SchoolGuard>} />
      <Route path="assessments" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'assessments' }}><SchoolStudentAssessments /></SchoolGuard>} />
      <Route path="assessments/:id/view" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'assessments' }}><SchoolStudentAssessmentView /></SchoolGuard>} />
      <Route path="assessments/:id/take" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'assessments' }}><SchoolStudentTestEngine /></SchoolGuard>} />
      <Route path="assessments/:id" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'assessments' }}><SchoolStudentSessionResult /></SchoolGuard>} />
      <Route path="notifications" element={<SchoolStudentNotifications />} />
      <Route path="doubts" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'ai', key: 'ai_doubt_solver' }}><SchoolStudentDoubts /></SchoolGuard>} />
      <Route path="battle-arena" element={<SchoolStudentBattleArena />} />
      <Route path="gamification" element={<SchoolStudentGamification />} />
      <Route path="game-zone/quiz-rush" element={<SchoolStudentQuizRush />} />
      <Route path="game-zone/treasure-hunt" element={<SchoolStudentTreasureHunt />} />
      <Route path="game-zone/math-sprint" element={<SchoolStudentMathSprint />} />
      <Route path="game-zone/memory-match" element={<SchoolStudentMemoryMatch />} />
      <Route path="game-zone/word-master" element={<SchoolStudentWordMaster />} />
      <Route path="planner" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'ai', key: 'ai_study_planner' }}><SchoolStudentStudyPlanner /></SchoolGuard>} />
      <Route path="ai-study/:topicId" element={<SchoolStudentAiStudyPage />} />
      <Route path="quiz" element={<SchoolStudentTopicQuizPage />} />
      <Route path="attendance" element={<SchoolStudentAttendance />} />
      <Route path="timetable" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'timetable' }}><SchoolStudentTimetable /></SchoolGuard>} />
      <Route path="calendar" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'academic_calendar' }}><SchoolStudentCalendar /></SchoolGuard>} />
      <Route path="analytics" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'reports' }}><SchoolStudentAnalytics /></SchoolGuard>} />
      <Route path="career" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'ai', key: 'ai_career_guidance' }}><SchoolStudentCareer /></SchoolGuard>} />
      <Route path="career/quiz" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'ai', key: 'ai_career_guidance' }}><SchoolStudentCareerQuiz /></SchoolGuard>} />
      <Route path="career/quiz/result" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'ai', key: 'ai_career_guidance' }}><SchoolStudentCareerQuizResult /></SchoolGuard>} />
      <Route path="career/report" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'ai', key: 'ai_career_guidance' }}><SchoolStudentCareerReport /></SchoolGuard>} />
      <Route path="career/explore" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'ai', key: 'ai_career_guidance' }}><SchoolStudentCareerExplorer /></SchoolGuard>} />
      <Route path="career/explore/:careerId" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'ai', key: 'ai_career_guidance' }}><SchoolStudentCareerDetail /></SchoolGuard>} />
      <Route path="announcements" element={<SchoolStudentAnnouncements />} />
      <Route path="chat" element={<SchoolGuard roles={["STUDENT"]} feature={{ type: 'module', key: 'chat' }}><SchoolStudentChat /></SchoolGuard>} />
      <Route path="profile" element={<SchoolStudentProfile />} />
      <Route path="settings" element={<SchoolStudentSettings />} />
    </Route>

    {/* School Parent */}
    <Route path="/school/parent/login" element={<SchoolParentLogin />} />
    <Route
      path="/school/parent"
      element={<SchoolParentAuthGuard><SchoolParentLayout /></SchoolParentAuthGuard>}
    >
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<SchoolParentDashboard />} />
      <Route path="child" element={<SchoolGuard roles={["PARENT"]} feature={{ type: 'module', key: 'reports' }}><SchoolParentChild /></SchoolGuard>} />
      <Route path="communication" element={<SchoolGuard roles={["PARENT"]} feature={{ type: 'module', key: 'chat' }}><SchoolParentCommunication /></SchoolGuard>} />
      <Route path="notifications" element={<SchoolParentNotifications />} />
      <Route path="profile" element={<SchoolParentProfile />} />
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
      <Route path="/super-admin/tenants/:id/courses/:courseId" element={<SuperAdminCourseDetailPage />} />
      <Route path="/super-admin/users" element={<UsersPage />} />
      <Route path="/super-admin/enrollments" element={<EnrollmentsPage />} />
      <Route path="/super-admin/announcements" element={<Navigate to="/super-admin/communication" replace />} />
      <Route path="/super-admin/communication" element={<SuperAdminCommunication />} />
      <Route path="/super-admin/stats" element={<Navigate to="/super-admin/analytics" replace />} />
      <Route path="/super-admin/analytics" element={<PlatformStatsPage />} />
      <Route path="/super-admin/live-usage" element={<CoachingLiveUsagePage />} />
      <Route path="/super-admin/tenant-health" element={<TenantHealthPage />} />
      <Route path="/super-admin/system-health" element={<SystemHealthPage />} />
      <Route path="/super-admin/billing" element={<BillingManagementPage />} />
      <Route path="/super-admin/complaints" element={<SuperAdminSupportTicketsPage />} />
      <Route path="/super-admin/support-tickets" element={<SuperAdminSupportTicketsPage />} />
      <Route path="/super-admin/support-tickets/:ticketId" element={<CoachingTicketDetailPage />} />
      <Route path="/super-admin/ai-usage" element={<SchoolAiUsage />} />
      <Route path="/super-admin/audit-logs" element={<SchoolAuditLogs />} />
      <Route path="/super-admin/security" element={<SchoolSecurity />} />
      <Route path="/super-admin/teachers" element={<Navigate to="/super-admin/tenants" replace />} />
      <Route path="/super-admin/students" element={<Navigate to="/super-admin/tenants" replace />} />
      <Route path="/super-admin/parents" element={<Navigate to="/super-admin/tenants" replace />} />
      <Route path="/super-admin/curriculum" element={<SuperAdminCurriculumPage />} />
      <Route path="/super-admin/content-library" element={<SuperAdminContentLibraryPage />} />
      <Route path="/super-admin/exam-calendar" element={<SuperAdminExamCalendarPage />} />
      <Route path="/super-admin/fees" element={<SuperAdminFeeOverviewPage />} />
      <Route path="/super-admin/payments" element={<SuperAdminPaymentsPage />} />
      <Route path="/super-admin/revenue" element={<SuperAdminRevenueReportsPage />} />
      <Route path="/super-admin/attendance-reports" element={<SuperAdminAttendanceReportsPage />} />
      <Route path="/super-admin/feature-flags" element={<CoachingFeatureFlagsPage />} />
      <Route path="/super-admin/settings" element={<SettingsPage />} />
      <Route path="/super-admin/school" element={<Navigate to="/super-admin/tenants" replace />} />
      <Route path="/super-admin/school/new" element={<Navigate to="/super-admin/tenants/new" replace />} />
      <Route path="/super-admin/school/:id/edit" element={<Navigate to="/super-admin/tenants" replace />} />
      <Route path="/super-admin/school/:id" element={<Navigate to="/super-admin/tenants" replace />} />
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

const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { maintenanceMode, setPlatformConfig, user, tenantType } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const fetchConfig = () => {
      const vertical = location.pathname.startsWith('/school/') || tenantType === 'school'
        ? 'school'
        : 'coaching';
      apiClient.get(`/tenants/public/platform-config?vertical=${vertical}&t=${Date.now()}`)
        .then(res => {
          const data = extractData<{
            maintenanceMode: boolean;
            platformName: string;
            supportEmail: string;
          }>(res);
          if (active && data) {
            setPlatformConfig({
              maintenanceMode: !!data.maintenanceMode,
              platformName: data.platformName || "EDVA",
              supportEmail: data.supportEmail || "support@edva.in"
            });
          }
        })
        .catch(err => {
          console.error("Failed to fetch platform config:", err);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchConfig();

    // Poll every 5 seconds so user screens automatically unlock when maintenance mode is turned off
    const interval = setInterval(fetchConfig, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [location.pathname, setPlatformConfig, tenantType]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isLoginPage = location.pathname.includes("/login");

  if (maintenanceMode && user?.role !== "super_admin" && !isLoginPage) {
    return (
      <Suspense fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-900 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }>
        <MaintenancePage />
      </Suspense>
    );
  }

  return <>{children}</>;
}

const App = () => {
  const isTenant = !!getSubdomain();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SchoolAuthProvider>
          <XPToastProvider>
            <Toaster />
            <Sonner />
            <ConfirmProvider>
              <BrowserRouter>
                <NotificationProvider>
                  <CoachingFontManager />
                  <Suspense fallback={<RouteLoading />}>
                    <MaintenanceGate>
                      {isTenant ? <TenantRoutes /> : <PlatformRoutes />}
                    </MaintenanceGate>
                  </Suspense>
                </NotificationProvider>
              </BrowserRouter>
            </ConfirmProvider>
          </XPToastProvider>
        </SchoolAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
