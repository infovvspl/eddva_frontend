import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSubdomain } from "@/lib/tenant";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import AboutUs from "./pages/AboutUs";
import LoginPage from "./pages/LoginPage";
import StudentRegisterPage from "./pages/StudentRegisterPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import InstitutesPage from "./pages/super-admin/InstitutesPage";
import NewInstitutePage from "./pages/super-admin/NewInstitutePage";
import InstituteDetailPage from "./pages/super-admin/InstituteDetailPage";
import UsersPage from "./pages/super-admin/UsersPage";
import AnnouncementsPage from "./pages/super-admin/AnnouncementsPage";
import PlatformStatsPage from "./pages/super-admin/PlatformStatsPage";
import SettingsPage from "./pages/super-admin/SettingsPage";
import SuperAdminLoginPage from "./pages/super-admin/SuperAdminLoginPage";
import EnrollmentsPage from "./pages/super-admin/EnrollmentsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BatchesPage from "./pages/admin/BatchesPage";
import BatchDetailPage from "./pages/admin/BatchDetailPage";
import TeachersPage from "./pages/admin/TeachersPage";
import TeacherDetailPage from "./pages/admin/TeacherDetailPage";
import StudentsPage from "./pages/admin/StudentsPage";
import ContentPage from "./pages/admin/ContentPage";
import MockTestsPage from "./pages/admin/MockTestsPage";
import LecturesPage from "./pages/admin/LecturesPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminCalendarPage from "./pages/admin/AdminCalendarPage";
import TeacherCalendarPage from "./pages/teacher/TeacherCalendarPage";
import StudentCalendarPage from "./pages/student/StudentCalendarPage";
import AdminStudentDetailPage from "./pages/admin/AdminStudentDetailPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherOnboardingPage from "./pages/teacher/TeacherOnboardingPage";
import AdminOnboardingPage from "./pages/admin/AdminOnboardingPage";
import TeacherBatchesPage from "./pages/teacher/TeacherBatchesPage";
import TeacherLecturesPage from "./pages/teacher/TeacherLecturesPage";
import TeacherStudentDetailPage from "./pages/teacher/TeacherStudentDetailPage";
import TeacherQuizzesPage from "./pages/teacher/TeacherQuizzesPage";
import TeacherDoubtsPage from "./pages/teacher/TeacherDoubtsPage";
import TeacherAnalyticsPage from "./pages/teacher/TeacherAnalyticsPage";
import TeacherAIToolsPage from "./pages/teacher/TeacherAIToolsPage";
import TeacherProfilePage from "./pages/teacher/TeacherProfilePage";
import StudentDashboard from "./pages/student/StudentDashboard";
import BattleArena from "./pages/student/BattleArena";
import StudentLecturePage from "./pages/student/StudentLecturePage";
import StudentLearnPage from "./pages/student/StudentLearnPage";
import TopicDetailPage from "./pages/student/StudentLearnPage";
import StudentLecturesPage from "./pages/student/StudentLecturesPage";
import StudentDoubtsPage from "./pages/student/StudentDoubtsPage";
import StudentStudyPlanPage from "./pages/student/StudentStudyPlanPage";
import StudentLeaderboardPage from "./pages/student/StudentLeaderboardPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import DiagnosticTestPage from "./pages/student/DiagnosticTestPage";
import StudentAiStudyPage from "./pages/student/StudentAiStudyPage";
import StudentTopicQuizPage from "./pages/student/StudentTopicQuizPage";
import StudentPYQPage from "./pages/student/StudentPYQPage";
import StudentCoursesPage from "./pages/student/StudentCoursesPage";
import StudentCourseDetailPage from "./pages/student/StudentCourseDetailPage";
import StudentOnboardingPage from "./pages/student/StudentOnboardingPage";
import StudentCourseTopicPage from "./pages/student/StudentCourseTopicPage";
import StudentNotificationsPage from "./pages/student/StudentNotificationsPage";
import PYQManagementPage from "./pages/admin/PYQManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import LiveClassRoom from "./pages/live/LiveClassRoom";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import JoinBatchPage from "./pages/JoinBatchPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Landing Pages
import LandingCoursesPage from "./pages/landing/LandingCoursesPage";
import ExamsRegistrationPage from "./pages/landing/ExamsRegistrationPage";
import StudyMaterialPage from "./pages/landing/StudyMaterialPage";
import CareerPage from "./pages/landing/CareerPage";
import PrivacyPolicyPage from "./pages/landing/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/landing/TermsOfServicePage";

const queryClient = new QueryClient();

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
    {/* Onboarding — outside DashboardLayout so the layout redirect doesn't loop */}
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
    {/* Teacher pages — institute_admin can access all of these */}
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
    {/* Onboarding — fullscreen, no layout wrapper to avoid redirect loop */}
    <Route
      path="/student/onboarding"
      element={<ProtectedRoute allowedRoles={["student"]}><StudentOnboardingPage /></ProtectedRoute>}
    />
    <Route element={<ProtectedRoute allowedRoles={["student"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/learn" element={<StudentLearnPage />} />
      <Route path="/student/learn/topic/:topicId" element={<TopicDetailPage />} />
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
      <Route path="/student/notifications" element={<StudentNotificationsPage />} />
    </Route>
    {/* Live class room — full screen, accessible by all roles */}
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
    <Route path="/study-material/:type" element={<StudyMaterialPage />} />
    <Route path="/study-material" element={<StudyMaterialPage />} />
    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
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
    <Route path="/study-material/:type" element={<StudyMaterialPage />} />
    <Route path="/study-material" element={<StudyMaterialPage />} />
    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
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
          {isTenant ? <TenantRoutes /> : <PlatformRoutes />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
