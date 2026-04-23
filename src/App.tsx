import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSubdomain } from "@/lib/tenant";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

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
const SuperAdminLoginPage = lazy(() => import("./pages/super-admin/SuperAdminLoginPage"));
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
const PYQManagementPage = lazy(() => import("./pages/admin/PYQManagementPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
const LiveClassRoom = lazy(() => import("./pages/live/LiveClassRoom"));
const NotFound = lazy(() => import("./pages/NotFound"));
const JoinBatchPage = lazy(() => import("./pages/JoinBatchPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ExamsRegistrationPage = lazy(() => import("./pages/landing/ExamsRegistrationPage"));
const StudyMaterialPage = lazy(() => import("./pages/landing/StudyMaterialPage"));
const CareerPage = lazy(() => import("./pages/landing/CareerPage"));
const ExamTrackDemoPage = lazy(() => import("./pages/landing/ExamTrackDemoPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/landing/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/landing/TermsOfServicePage"));
const CookiePolicyPage = lazy(() => import("./pages/landing/CookiePolicyPage"));

const queryClient = new QueryClient();

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
    <Route path="/admin/content" element={<ContentPage />} />
    <Route path="/admin/mock-tests" element={<MockTestsPage />} />
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
    <Route path="/register" element={<StudentRegisterPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/join" element={<JoinBatchPage />} />
    {AdminRoutes()}
    {PYQRoute()}
    {TeacherRoutes()}
    {StudentRoutes()}
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
    <Route path="/register" element={<StudentRegisterPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/join" element={<JoinBatchPage />} />
    <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />

    <Route element={<ProtectedRoute allowedRoles={["super_admin"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/super-admin/tenants" element={<InstitutesPage />} />
      <Route path="/super-admin/tenants/new" element={<NewInstitutePage />} />
      <Route path="/super-admin/tenants/:id" element={<InstituteDetailPage />} />
      <Route path="/super-admin/users" element={<UsersPage />} />
      <Route path="/super-admin/enrollments" element={<EnrollmentsPage />} />
      <Route path="/super-admin/announcements" element={<AnnouncementsPage />} />
      <Route path="/super-admin/stats" element={<PlatformStatsPage />} />
      <Route path="/super-admin/settings" element={<SettingsPage />} />
    </Route>

    {AdminRoutes()}
    {PYQRoute()}
    {TeacherRoutes()}
    {StudentRoutes()}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  const isTenant = !!getSubdomain();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            {isTenant ? <TenantRoutes /> : <PlatformRoutes />}
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
