import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore, roleRedirectPath } from "@/lib/auth-store";
import { useLogout } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";
import {
  Home, Building2, Users, Megaphone, BarChart3, Settings,
  BookOpen, GraduationCap, Calendar, FileText,
  Video, Layout, BarChart,
  Swords, Trophy, Brain, User, LogOut, Menu, X, MessageSquare, Sparkles,
  LayoutDashboard, ClipboardList, Headphones, Library, Activity, Zap, Layers, ChevronRight
} from "lucide-react";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePresenceHeartbeat } from "@/hooks/use-presence";
import { AeroBackground } from "@/components/shared/AeroBackground";
import { CardGlass } from "@/components/shared/CardGlass";
import { motion, AnimatePresence } from "framer-motion";
import edvaLogo from "@/assets/EDVA LOGO 04.png";
import { useDiscoverBatches } from "@/hooks/use-student";
import { BatchDiscoveryModal } from "@/components/student/BatchDiscoveryModal";

const BLUE = "#3B82F6";
const BLUE_VIBRANT = "#60A5FA";

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
    { label: "Enrollments",   path: "/super-admin/enrollments",    icon: GraduationCap },
    { label: "Announcements", path: "/super-admin/announcements",  icon: Megaphone  },
    { label: "Stats",         path: "/super-admin/stats",          icon: BarChart3  },
    { label: "Settings",      path: "/super-admin/settings",       icon: Settings   },
  ],
  institute_admin: [
    { label: "Dashboard",    path: "/admin",               icon: Home          },
    { label: "Courses",       path: "/admin/batches",        icon: Layout        },
    { label: "Students",     path: "/admin/students",       icon: Users         },
    { label: "Content",      path: "/admin/content",        icon: GraduationCap },
    { label: "Lectures",     path: "/teacher/lectures",     icon: Video         },
    { label: "Doubt Queue",  path: "/teacher/doubts",       icon: MessageSquare },
    { label: "Analytics",    path: "/teacher/analytics",    icon: BarChart      },
    { label: "AI Tools",     path: "/teacher/ai-tools",     icon: Sparkles      },
    { label: "Mock Tests",   path: "/admin/mock-tests",     icon: BookOpen      },
    { label: "PYQ Bank",     path: "/admin/pyq",            icon: FileText      },
    { label: "Calendar",     path: "/admin/calendar",       icon: Calendar      },
    { label: "Settings",     path: "/admin/settings",       icon: Settings      },
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
    { label: "My Courses",   path: "/student/courses",       icon: Library         },
    { label: "Learn",        path: "/student/learn",         icon: Brain           },
    { label: "Lectures",     path: "/student/lectures",      icon: Video           },
    { label: "Study Plan",   path: "/student/study-plan",    icon: ClipboardList   },
    { label: "Doubts",       path: "/student/doubts",        icon: Headphones      },
    { label: "Leaderboard",  path: "/student/leaderboard",   icon: Trophy          },
    { label: "Battle Arena", path: "/student/battle",        icon: Swords          },
    { label: "Profile",      path: "/student/profile",       icon: User            },
  ],
};

const sectionLabels: Record<UserRole, { main: string }> = {
  super_admin:      { main: "Governance" },
  institute_admin:  { main: "Operations" },
  teacher:          { main: "Instruction" },
  student:          { main: "Advancement" },
};

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const logout = useLogout();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  usePresenceHeartbeat();

  // ── Batch Discovery Modal (students only) ──────────────────────────────────
  const isStudent = user?.role === "student";
  const batchModalSeenKey = user ? `batch_discovery_seen_${user.id}` : null;
  const { data: discoverData } = useDiscoverBatches(isStudent);

  useEffect(() => {
    if (!isStudent || !discoverData || !batchModalSeenKey) return;
    const alreadySeen = sessionStorage.getItem(batchModalSeenKey) === "true";
    if (alreadySeen) return;
    if (discoverData.isFirstLogin || discoverData.availableBatches.length > 0) {
      setShowBatchModal(true);
      sessionStorage.setItem(batchModalSeenKey, "true");
    }
  }, [discoverData, isStudent, batchModalSeenKey]);

  // On focus pages (Quiz, Live, AI Study), collapse sidebar by default
  useEffect(() => {
    const isFocusPage = /quiz|live|ai-study|diagnostic|lectures\/\w+/.test(location.pathname);
    if (isFocusPage && window.innerWidth >= 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const onboardingSeenKey = `onboarding_seen_${user.id}`;
  const onboardingSeen = localStorage.getItem(onboardingSeenKey) === "true";

  if (!onboardingSeen) {
    if (user.role === "teacher" && user.teacherProfile === null) {
      localStorage.setItem(onboardingSeenKey, "true");
      return <Navigate to="/teacher/onboarding" replace />;
    }
    if (user.role === "institute_admin" && user.teacherProfile === null) {
      localStorage.setItem(onboardingSeenKey, "true");
      return <Navigate to="/admin/onboard" replace />;
    }
  }

  const navItems = navByRole[user.role];
  const section = sectionLabels[user.role];

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/20 backdrop-blur-3xl border-r border-slate-100 relative overflow-hidden">
      {/* ── Brand ── */}
      <div className="h-24 px-8 flex items-center gap-4 shrink-0 border-b border-slate-100/50">
        <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group cursor-pointer overflow-hidden transition-all duration-500 hover:rotate-6">
           <img src={edvaLogo} alt="EDVA" className="w-7 h-7 object-contain" />
        </div>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="min-w-0">
            <span className="text-sm font-bold text-slate-900 block truncate">
              EDVA
            </span>
            {user.tenantName && (
              <span className="text-[10px] font-medium text-slate-500 block truncate">{user.tenantName}</span>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-10 px-4 overflow-y-auto space-y-1 scrollbar-none relative z-10">
        {sidebarOpen && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] px-5 mb-4 text-slate-500">
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
                "group flex items-center gap-4 px-5 py-3 rounded-2xl text-[16px] font-bold transition-all duration-500 relative tracking-wide",
                isActive
                  ? "text-indigo-600 bg-indigo-50/50 shadow-sm border border-indigo-100/50 scale-[1.02] z-10"
                  : "text-slate-900 hover:text-black hover:bg-slate-50/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "flex items-center justify-center rounded-xl shrink-0 transition-all duration-500",
                  sidebarOpen ? "w-7 h-7" : "w-10 h-10",
                  isActive ? "bg-indigo-600 text-white shadow-lg" : "bg-transparent text-slate-300 group-hover:text-slate-500"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-current")} />
                </div>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="">
                    {item.label}
                  </motion.span>
                )}
                {item.badge && sidebarOpen && (
                  <span className="ml-auto bg-indigo-100 text-[8px] font-bold text-indigo-600 px-2 py-0.5 rounded-lg">
                    {item.badge}
                  </span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-6 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-xl bg-slate-900 text-white translate-x-10 group-hover:translate-x-0">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-4 px-2">
           <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm group transition-all duration-500 hover:scale-110">
              <User className="w-4 h-4 group-hover:text-indigo-500 transition-colors" />
           </div>
           {sidebarOpen && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 capitalize mt-0.5">{user.role.replace("_", " ")}</p>
             </motion.div>
           )}
           <button onClick={handleLogout} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white text-slate-900 selection:bg-indigo-600/10 font-sans">
      <AeroBackground />
      
      {/* ── Desktop Sidebar ── */}
      <aside className={cn(
          "hidden lg:flex flex-col shrink-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative z-50",
          sidebarOpen ? "w-[280px]" : "w-[90px]"
        )}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] flex">
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25 }} className="w-[280px]">
              <SidebarContent />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileSidebarOpen(false)} className="flex-1 bg-slate-900/10 backdrop-blur-sm" />
          </div>
        )}
      </AnimatePresence>

      {/* ── Main Area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-20 shrink-0 flex items-center justify-between px-10 border-b border-slate-100 bg-white/40 backdrop-blur-3xl sticky top-0 z-[60]">
           <div className="flex items-center gap-6">
              <button
                onClick={() => window.innerWidth < 1024 ? setMobileSidebarOpen(!mobileSidebarOpen) : setSidebarOpen(!sidebarOpen)}
                className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
              {user.tenantName && (
                <div className="hidden sm:flex items-center gap-4">
                   <div className="w-px h-5 bg-slate-100" />
                   <div className="flex items-center gap-3">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{user.tenantName}</span>
                   </div>
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-3 px-5 py-2 rounded-full bg-slate-50 border border-slate-100 shadow-inner">
                 <Zap className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    SYNCING
                 </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm text-[10px] font-bold">
                 {user.name[0]}
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
           <div className={cn(
             "mx-auto w-full transition-all duration-1000",
             location.pathname.includes("/live") || location.pathname.includes("/quiz") ? "max-w-none p-0" : "max-w-[1700px] p-8 lg:p-12 pb-24"
           )}>
              <Outlet />
           </div>
        </main>
      </div>

      {/* ── Batch Discovery Modal (students only) ── */}
      {showBatchModal && (
        <BatchDiscoveryModal onClose={() => setShowBatchModal(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
