import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import BattleArena from "./pages/student/BattleArena";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Super Admin */}
          <Route element={<DashboardLayout />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/tenants" element={<PlaceholderPage title="All Institutes" subtitle="Manage platform tenants" />} />
            <Route path="/super-admin/users" element={<PlaceholderPage title="Users" subtitle="Platform-wide user management" />} />
            <Route path="/super-admin/announcements" element={<PlaceholderPage title="Announcements" />} />
            <Route path="/super-admin/stats" element={<PlaceholderPage title="Platform Stats" />} />
            <Route path="/super-admin/settings" element={<PlaceholderPage title="Settings" />} />

            {/* Institute Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/batches" element={<PlaceholderPage title="Batches" subtitle="Manage student batches" />} />
            <Route path="/admin/teachers" element={<PlaceholderPage title="Teachers" subtitle="Faculty management" />} />
            <Route path="/admin/students" element={<PlaceholderPage title="Students" subtitle="Student management" />} />
            <Route path="/admin/content" element={<PlaceholderPage title="Content" subtitle="Subject & question management" />} />
            <Route path="/admin/calendar" element={<PlaceholderPage title="Academic Calendar" />} />
            <Route path="/admin/reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="/admin/settings" element={<PlaceholderPage title="Settings" />} />

            {/* Teacher */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/lectures" element={<PlaceholderPage title="Lectures" subtitle="Manage your lectures" />} />
            <Route path="/teacher/quizzes" element={<PlaceholderPage title="Quizzes & Tests" />} />
            <Route path="/teacher/doubts" element={<PlaceholderPage title="Doubt Queue" />} />
            <Route path="/teacher/batches" element={<PlaceholderPage title="My Batches" />} />
            <Route path="/teacher/analytics" element={<PlaceholderPage title="Analytics" />} />

            {/* Student */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/learn" element={<PlaceholderPage title="Learn" subtitle="Subject → Chapter → Topic" />} />
            <Route path="/student/battle" element={<BattleArena />} />
            <Route path="/student/doubts" element={<PlaceholderPage title="Doubts" subtitle="Ask AI or your teacher" />} />
            <Route path="/student/leaderboard" element={<PlaceholderPage title="Leaderboard" />} />
            <Route path="/student/study-plan" element={<PlaceholderPage title="Study Plan" />} />
            <Route path="/student/profile" element={<PlaceholderPage title="Profile" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
