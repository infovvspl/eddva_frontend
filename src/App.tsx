import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSubdomain } from "@/lib/tenant";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import TenantHomePage from "./pages/TenantHomePage";
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
import AdminDashboard from "./pages/admin/AdminDashboard";
import BatchesPage from "./pages/admin/BatchesPage";
import TeachersPage from "./pages/admin/TeachersPage";
import TeacherDetailPage from "./pages/admin/TeacherDetailPage";
import StudentsPage from "./pages/admin/StudentsPage";
import ContentPage from "./pages/admin/ContentPage";
import MockTestsPage from "./pages/admin/MockTestsPage";
import LecturesPage from "./pages/admin/LecturesPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminCalendarPage from "./pages/admin/AdminCalendarPage";
import AdminStudentDetailPage from "./pages/admin/AdminStudentDetailPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherOnboardingPage from "./pages/teacher/TeacherOnboardingPage";
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
import StudentLearnPage, { TopicDetailPage } from "./pages/student/StudentLearnPage";
import StudentLecturesPage from "./pages/student/StudentLecturesPage";
import StudentDoubtsPage from "./pages/student/StudentDoubtsPage";
import StudentStudyPlanPage from "./pages/student/StudentStudyPlanPage";
import StudentLeaderboardPage from "./pages/student/StudentLeaderboardPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import DiagnosticTestPage from "./pages/student/DiagnosticTestPage";
import StudentAiStudyPage from "./pages/student/StudentAiStudyPage";
import StudentTopicQuizPage from "./pages/student/StudentTopicQuizPage";
import StudentPYQPage from "./pages/student/StudentPYQPage";
import PYQManagementPage from "./pages/admin/PYQManagementPage";
import LiveClassRoom from "./pages/live/LiveClassRoom";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Admin routes shared between tenant and platform */
const AdminRoutes = () => (
  <Route element={<ProtectedRoute allowedRoles={["institute_admin"]}><DashboardLayout /></ProtectedRoute>}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/batches" element={<BatchesPage />} />
    <Route path="/admin/teachers" element={<TeachersPage />} />
    <Route path="/admin/teachers/:id" element={<TeacherDetailPage />} />
    <Route path="/admin/students" element={<StudentsPage />} />
    <Route path="/admin/students/:studentId" element={<AdminStudentDetailPage />} />
    <Route path="/admin/content" element={<ContentPage />} />
    <Route path="/admin/mock-tests" element={<MockTestsPage />} />
    <Route path="/admin/lectures" element={<LecturesPage />} />
    <Route path="/admin/calendar" element={<AdminCalendarPage />} />
    <Route path="/admin/reports" element={<PlaceholderPage title="Reports" />} />
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
    {/* Student detail — full-page within DashboardLayout is fine here */}
    <Route
      path="/teacher/students/:studentId"
      element={<ProtectedRoute allowedRoles={["teacher", "institute_admin"]}><DashboardLayout /></ProtectedRoute>}
    >
      <Route index element={<TeacherStudentDetailPage />} />
    </Route>
    <Route element={<ProtectedRoute allowedRoles={["teacher"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/lectures" element={<TeacherLecturesPage />} />
      <Route path="/teacher/quizzes" element={<TeacherQuizzesPage />} />
      <Route path="/teacher/doubts" element={<TeacherDoubtsPage />} />
      <Route path="/teacher/batches" element={<TeacherBatchesPage />} />
      <Route path="/teacher/analytics" element={<TeacherAnalyticsPage />} />
      <Route path="/teacher/ai-tools" element={<TeacherAIToolsPage />} />
      <Route path="/teacher/profile" element={<TeacherProfilePage />} />
    </Route>
  </>
);

const StudentRoutes = () => (
  <>
    {/* Diagnostic test — full-page, mandatory, no DashboardLayout, skips diagnostic guard to avoid redirect loop */}
    <Route
      path="/student/diagnostic"
      element={<ProtectedRoute allowedRoles={["student"]} skipDiagnosticGuard><DiagnosticTestPage /></ProtectedRoute>}
    />
    {/* Full-page live class room — outside DashboardLayout */}
    <Route
      path="/live/:lectureId"
      element={<ProtectedRoute allowedRoles={["student", "teacher"]}><LiveClassRoom /></ProtectedRoute>}
    />
    {/* Full-page lecture player — outside DashboardLayout */}
    <Route
      path="/student/lectures/:id"
      element={<ProtectedRoute allowedRoles={["student"]}><StudentLecturePage /></ProtectedRoute>}
    />
    {/* Full-page AI study session — outside DashboardLayout */}
    <Route
      path="/student/ai-study/:topicId"
      element={<ProtectedRoute allowedRoles={["student"]}><StudentAiStudyPage /></ProtectedRoute>}
    />
    {/* Full-page topic quiz — outside DashboardLayout */}
    <Route
      path="/student/quiz"
      element={<ProtectedRoute allowedRoles={["student"]}><StudentTopicQuizPage /></ProtectedRoute>}
    />
    <Route element={<ProtectedRoute allowedRoles={["student"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/learn" element={<StudentLearnPage />} />
      <Route path="/student/learn/topic/:topicId" element={<TopicDetailPage />} />
      <Route path="/student/lectures" element={<StudentLecturesPage />} />
      <Route path="/student/battle" element={<BattleArena />} />
      <Route path="/student/doubts" element={<StudentDoubtsPage />} />
      <Route path="/student/leaderboard" element={<StudentLeaderboardPage />} />
      <Route path="/student/study-plan" element={<StudentStudyPlanPage />} />
      <Route path="/student/profile" element={<StudentProfilePage />} />
      <Route path="/student/pyq/:topicId" element={<StudentPYQPage />} />
    </Route>
  </>
);

/** Routes for tenant subdomains (e.g. iit.edva.in) */
const TenantRoutes = () => (
  <Routes>
    <Route path="/" element={<TenantHomePage />} />
    <Route path="/login" element={<TenantHomePage />} />
    {AdminRoutes()}
    {PYQRoute()}
    {TeacherRoutes()}
    {StudentRoutes()}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

/** Routes for the main platform domain (edva.in / localhost) */
const PlatformRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<LoginPage />} />

    <Route element={<ProtectedRoute allowedRoles={["super_admin"]}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/super-admin/tenants" element={<InstitutesPage />} />
      <Route path="/super-admin/tenants/new" element={<NewInstitutePage />} />
      <Route path="/super-admin/tenants/:id" element={<InstituteDetailPage />} />
      <Route path="/super-admin/users" element={<UsersPage />} />
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
