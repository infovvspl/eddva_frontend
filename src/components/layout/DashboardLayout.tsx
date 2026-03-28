import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuthStore, roleRedirectPath } from "@/lib/auth-store";
import { useLogout } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";
import {
  Home, Building2, Users, Megaphone, BarChart3, Settings,
  BookOpen, GraduationCap, FolderOpen, Calendar, FileText,
  Video, HelpCircle, Layout, BarChart,
  Swords, Trophy, Brain, User, Zap, LogOut, Menu, X, MessageSquare, Sparkles
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePresenceHeartbeat } from "@/hooks/use-presence";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navByRole: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Overview", path: "/super-admin", icon: Home },
    { label: "Institutes", path: "/super-admin/tenants", icon: Building2 },
    { label: "Users", path: "/super-admin/users", icon: Users },
    { label: "Announcements", path: "/super-admin/announcements", icon: Megaphone },
    { label: "Stats", path: "/super-admin/stats", icon: BarChart3 },
    { label: "Settings", path: "/super-admin/settings", icon: Settings },
  ],
  institute_admin: [
    { label: "Dashboard", path: "/admin", icon: Home },
    { label: "Batches", path: "/admin/batches", icon: Layout },
    { label: "Teachers", path: "/admin/teachers", icon: GraduationCap },
    { label: "Students", path: "/admin/students", icon: Users },
    { label: "Content", path: "/admin/content", icon: FolderOpen },
    { label: "Mock Tests", path: "/admin/mock-tests", icon: BookOpen },
    { label: "PYQ Bank", path: "/admin/pyq", icon: FileText },
    { label: "Lectures", path: "/admin/lectures", icon: Video },
    { label: "Calendar", path: "/admin/calendar", icon: Calendar },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher", icon: Home },
    { label: "Lectures", path: "/teacher/lectures", icon: Video },
    { label: "Quizzes & Tests", path: "/teacher/quizzes", icon: BookOpen },
    { label: "Doubt Queue", path: "/teacher/doubts", icon: MessageSquare, badge: 5 },
    { label: "My Batches", path: "/teacher/batches", icon: Users },
    { label: "Analytics", path: "/teacher/analytics", icon: BarChart },
    { label: "AI Tools", path: "/teacher/ai-tools", icon: Sparkles },
    { label: "My Profile", path: "/teacher/profile", icon: User },
  ],
  student: [
    { label: "Dashboard", path: "/student", icon: Home },
    { label: "Learn", path: "/student/learn", icon: Brain },
    { label: "Lectures", path: "/student/lectures", icon: Video },
    { label: "Battle Arena", path: "/student/battle", icon: Swords },
    { label: "Doubts", path: "/student/doubts", icon: HelpCircle },
    { label: "Leaderboard", path: "/student/leaderboard", icon: Trophy },
    { label: "Study Plan", path: "/student/study-plan", icon: Calendar },
    { label: "Profile", path: "/student/profile", icon: User },
  ],
};

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const logout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  usePresenceHeartbeat();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "teacher" && user.teacherProfile === null) {
    return <Navigate to="/teacher/onboarding" replace />;
  }

  const navItems = navByRole[user.role];

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Institute Name */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <span className="text-lg font-extrabold text-foreground tracking-tight block truncate">
              {user.tenantName || "EDVA"}
            </span>
            {user.tenantName && (
              <span className="text-[10px] text-muted-foreground font-medium -mt-1 block">Powered by EDVA</span>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === roleRedirectPath[user.role]}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )
            }
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
            {item.badge && sidebarOpen && (
              <span className="ml-auto text-xs bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {user.name.charAt(0)}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role.replace("_", " ")}</p>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar shrink-0 transition-all duration-300",
          sidebarOpen ? "w-[220px]" : "w-[60px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[260px] bg-sidebar border-r border-sidebar-border">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-background/80 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileSidebarOpen(!mobileSidebarOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            {user.tenantName && (
              <span className="text-sm text-muted-foreground hidden sm:block">{user.tenantName}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground hidden sm:block">
              Welcome, <span className="text-foreground font-medium">{user.name.split(" ")[0]}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
