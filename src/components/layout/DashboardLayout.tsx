import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuthStore, roleRedirectPath } from "@/lib/auth-store";
import { useLogout } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";
import {
  Home, Building2, Users, Megaphone, BarChart3, Settings,
  BookOpen, GraduationCap, FolderOpen, Calendar, FileText,
  Video, HelpCircle, Layout, BarChart,
  Swords, Trophy, Brain, User, LogOut, Menu, X, MessageSquare, Sparkles,
  LayoutDashboard, Layers, ClipboardList, Headphones,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePresenceHeartbeat } from "@/hooks/use-presence";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

const BLUE = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navByRole: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Overview",      path: "/super-admin",               icon: Home       },
    { label: "Institutes",    path: "/super-admin/tenants",        icon: Building2  },
    { label: "Users",         path: "/super-admin/users",          icon: Users      },
    { label: "Announcements", path: "/super-admin/announcements",  icon: Megaphone  },
    { label: "Stats",         path: "/super-admin/stats",          icon: BarChart3  },
    { label: "Settings",      path: "/super-admin/settings",       icon: Settings   },
  ],
  institute_admin: [
    { label: "Dashboard",   path: "/admin",               icon: Home         },
    { label: "Batches",     path: "/admin/batches",        icon: Layout       },
    { label: "Students",    path: "/admin/students",       icon: Users        },
    { label: "Content",     path: "/admin/content",        icon: FolderOpen   },
    { label: "Mock Tests",  path: "/admin/mock-tests",     icon: BookOpen     },
    { label: "PYQ Bank",    path: "/admin/pyq",            icon: FileText     },
    { label: "Lectures",    path: "/admin/lectures",       icon: Video        },
    { label: "Calendar",    path: "/admin/calendar",       icon: Calendar     },
    { label: "Settings",    path: "/admin/settings",       icon: Settings     },
  ],
  teacher: [
    { label: "Dashboard",       path: "/teacher",           icon: Home            },
    { label: "Lectures",        path: "/teacher/lectures",  icon: Video           },
    { label: "Quizzes & Tests", path: "/teacher/quizzes",   icon: BookOpen        },
    { label: "Doubt Queue",     path: "/teacher/doubts",    icon: MessageSquare, badge: 5 },
    { label: "My Batches",      path: "/teacher/batches",   icon: Users           },
    { label: "Analytics",       path: "/teacher/analytics", icon: BarChart        },
    { label: "AI Tools",        path: "/teacher/ai-tools",  icon: Sparkles        },
    { label: "My Profile",      path: "/teacher/profile",   icon: User            },
  ],
  student: [
    { label: "Dashboard",    path: "/student",               icon: LayoutDashboard },
    { label: "Learn",        path: "/student/learn",         icon: Brain           },
    { label: "Lectures",     path: "/student/lectures",      icon: Video           },
    { label: "Study Plan",    path: "/student/study-plan",    icon: ClipboardList   },
    { label: "Doubts",       path: "/student/doubts",        icon: Headphones      },
    { label: "Leaderboard",  path: "/student/leaderboard",   icon: Trophy          },
    { label: "Battle Arena", path: "/student/battle",        icon: Swords          },
    { label: "Profile",      path: "/student/profile",       icon: User            },
  ],
};

const sectionLabels: Record<UserRole, { main: string }> = {
  super_admin:      { main: "Main Menu" },
  institute_admin:  { main: "Main Menu" },
  teacher:          { main: "Main Menu" },
  student:          { main: "Main Menu" },
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
  const section = sectionLabels[user.role];

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "#fff" }}>
      {/* ── Logo / Brand ── */}
      <div
        className="flex items-center gap-2.5 px-4 shrink-0"
        style={{
          height: "72px",
          borderBottom: "1px solid #F0F4FF",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={edvaLogo}
            alt="EDVA"
            className={cn(
              "object-contain transition-all duration-300",
              sidebarOpen ? "h-10 w-auto" : "h-8 w-8"
            )}
          />
          {sidebarOpen && (
            <div className="min-w-0 leading-tight">
              <span className="text-base font-extrabold block truncate" style={{ color: BLUE }}>
                {user.tenantName || "EDVA"}
              </span>
              {user.tenantName && (
                <span className="text-[10px] font-medium block" style={{ color: BLUE_M, opacity: 0.7 }}>
                  Powered by EDVA
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
        {/* Section Label */}
        {sidebarOpen && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] px-4 mb-3" style={{ color: "#64748B" }}>
            {section.main}
          </p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === roleRedirectPath[user.role]}
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 relative mx-2",
                isActive
                  ? "text-white shadow-2xl scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )
            }
            style={({ isActive }) =>
              isActive
                ? { 
                    background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)`, 
                    boxShadow: `0 8px 20px rgba(1,56,137,0.3)` 
                  }
                : {}
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "flex items-center justify-center rounded-lg shrink-0 transition-all",
                    sidebarOpen ? "w-7 h-7" : "w-8 h-8"
                  )}
                  style={
                    isActive
                      ? { background: "rgba(255,255,255,0.2)" }
                      : { background: "transparent" }
                  }
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                    )}
                  />
                </div>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {item.badge && sidebarOpen && (
                  <span
                    className="ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0"
                    style={{ background: "#EF4444", color: "#fff" }}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Tooltip when collapsed */}
                {!sidebarOpen && (
                  <div
                    className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"
                    style={{ background: BLUE, color: "#fff" }}
                  >
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom: Quick Links ── */}
      {sidebarOpen && (
        <div className="px-3 pb-3 space-y-1">
          <div
            className="rounded-2xl p-4 mb-2"
            style={{ background: "linear-gradient(135deg, #E6EEF8 0%, #CCE0F5 100%)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: BLUE }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-bold" style={{ color: BLUE }}>Quick Add</p>
            </div>
            <p className="text-[11px] text-gray-500 mb-2.5 leading-tight">
              Jump into your next study session
            </p>
            <button
              onClick={() => {}}
              className="w-full py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
              style={{ background: BLUE }}
            >
              + Start Session
            </button>
          </div>
        </div>
      )}

      {/* ── User Footer ── */}
      <div style={{ borderTop: "1px solid #F0F4FF" }} className="p-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                <p className="text-[10px] font-medium capitalize" style={{ color: BLUE_M }}>
                  {user.role.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
          {!sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "#F7FAFF" }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col shrink-0 transition-all duration-300",
          sidebarOpen ? "w-[230px]" : "w-[68px]"
        )}
        style={{
          borderRight: "1px solid #EEF2FF",
          background: "#fff",
          boxShadow: "2px 0 20px rgba(1,56,137,0.05)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[260px] bg-white border-r border-gray-100 shadow-2xl">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-4 shrink-0"
          style={{
            background: "#fff",
            borderBottom: "1px solid #EEF2FF",
            boxShadow: "0 1px 8px rgba(1,56,137,0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileSidebarOpen(!mobileSidebarOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            {user.tenantName && (
              <span className="text-sm text-gray-400 hidden sm:block font-medium">
                {user.tenantName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400 hidden sm:block">
              Welcome,{" "}
              <span className="font-semibold" style={{ color: BLUE }}>
                {user.name.split(" ")[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
