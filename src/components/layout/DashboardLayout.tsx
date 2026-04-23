import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, roleRedirectPath } from "@/lib/auth-store";
import { useLogout } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";
import {
  Home, Building2, Users, Megaphone, BarChart3, Settings,
  BookOpen, GraduationCap, Calendar,
  Video, Layout, BarChart,
  Swords, Trophy, Brain, User, LogOut, Menu, X, MessageSquare, Sparkles,
  LayoutDashboard, ClipboardList, Headphones, Library, Bell,
  ChevronDown, Loader2,
} from "lucide-react";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePresenceHeartbeat } from "@/hooks/use-presence";
import { AeroBackground } from "@/components/shared/AeroBackground";
import { motion, AnimatePresence } from "framer-motion";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import { useStudentMe, useUpdateStudentProfile } from "@/hooks/use-student";
import { useInstituteProfile, useUpdateInstituteProfile } from "@/hooks/use-admin";
import { PageErrorBoundary } from "@/components/shared/PageErrorBoundary";
import { useUnreadCount } from "@/hooks/use-notifications";
import { tokenStorage } from "@/lib/api/client";
import { getApiOrigin } from "@/lib/api-config";
import { ensureBattleSocket, disconnectBattleSocket } from "@/lib/battle-socket";

const EXAM_OPTIONS = [
  { key: "jee",     label: "JEE",           desc: "Joint Entrance Examination", color: "from-orange-400 to-red-500",    bg: "bg-orange-50",  border: "border-orange-300", text: "text-orange-600"  },
  { key: "neet",    label: "NEET",          desc: "Medical Entrance",            color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-600" },
  { key: "cbse_10", label: "CBSE Class 10", desc: "Board Examinations",          color: "from-blue-400 to-indigo-500",  bg: "bg-blue-50",   border: "border-blue-300",   text: "text-blue-600"   },
  { key: "cbse_12", label: "CBSE Class 12", desc: "Board Examinations",          color: "from-violet-400 to-purple-500", bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-600" },
] as const;

interface IncomingBattleChallenge {
  challengeId: string;
  fromStudentId: string;
  expiresInSeconds: number;
  batchId?: string;
  batchName?: string;
}

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
    { label: "Dashboard",      path: "/admin",                    icon: Home          },
    { label: "Courses",        path: "/admin/batches",             icon: Layout        },
    { label: "Students",       path: "/admin/students",            icon: Users         },
    { label: "Content",        path: "/admin/content",             icon: GraduationCap },
    { label: "Lectures",       path: "/teacher/lectures",          icon: Video         },
    { label: "Doubt Queue",    path: "/teacher/doubts",            icon: MessageSquare },
    { label: "Analytics",      path: "/teacher/analytics",         icon: BarChart      },
    { label: "Mock Tests",     path: "/admin/mock-tests",          icon: BookOpen      },
    { label: "Calendar",       path: "/admin/calendar",            icon: Calendar      },
    { label: "Notifications",  path: "/admin/notifications",       icon: Bell          },
  ],
  teacher: [
    { label: "Dashboard",       path: "/teacher",           icon: Home            },
    { label: "Lectures",        path: "/teacher/lectures",  icon: Video           },
    { label: "Quizzes & Tests", path: "/teacher/quizzes",   icon: BookOpen        },
    { label: "Doubt Queue",     path: "/teacher/doubts",    icon: MessageSquare, badge: 5 },
    { label: "My Batches",      path: "/teacher/batches",   icon: Users           },
    { label: "Calendar",        path: "/teacher/calendar",  icon: Calendar        },
    { label: "Analytics",       path: "/teacher/analytics", icon: BarChart        },
    { label: "AI Tools",        path: "/teacher/ai-tools",  icon: Sparkles        },
    { label: "My Profile",      path: "/teacher/profile",   icon: User            },
  ],
  student: [
    { label: "Dashboard",    path: "/student",               icon: LayoutDashboard },
    { label: "Calendar",     path: "/student/calendar",      icon: Calendar        },
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
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const latestPathRef = useRef(location.pathname);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: unreadNotifCount = 0 } = useUnreadCount();
  const isCompactLayout = useIsCompactLayout();
  const lightDashboardShell = isCompactLayout || user?.role === "student" || user?.role === "teacher";

  // Close profile dropdown on any outside click (production-grade)
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
      setShowUserMenu(false);
    }
  }, []);

  useEffect(() => {
    latestPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (showUserMenu) {
      document.addEventListener("mousedown", handleOutsideClick, true);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick, true);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick, true);
  }, [showUserMenu, handleOutsideClick]);

  /* Prevent page scroll behind the mobile drawer (iOS / touch) */
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSidebarOpen]);

  usePresenceHeartbeat();

  const isStudent      = user?.role === "student";
  const isInstAdmin    = user?.role === "institute_admin";

  // ── Admin profile setup modal (shown once on first login) ────────────────
  const { data: instProfile } = useInstituteProfile(isInstAdmin);
  const updateInstProfile = useUpdateInstituteProfile();

  const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ instituteName: "", adminName: "", email: "" });
  const adminProfileKey = user ? `admin_profile_done_${user.id}` : null;

  useEffect(() => {
    if (!isInstAdmin || !adminProfileKey || instProfile === undefined) return;
    if (localStorage.getItem(adminProfileKey)) return;
    setAdminForm({
      instituteName: instProfile.instituteName ?? "",
      adminName:     instProfile.adminName     ?? "",
      email:         instProfile.email         ?? "",
    });
    setShowAdminProfileModal(true);
  }, [isInstAdmin, adminProfileKey, instProfile]);

  function handleSaveAdminProfile() {
    if (!adminProfileKey) return;
    updateInstProfile.mutate(
      { instituteName: adminForm.instituteName || undefined, adminName: adminForm.adminName || undefined, email: adminForm.email || undefined },
      { onSettled: () => { localStorage.setItem(adminProfileKey, "1"); setShowAdminProfileModal(false); } }
    );
  }

  function handleSkipAdminProfile() {
    if (adminProfileKey) localStorage.setItem(adminProfileKey, "1");
    setShowAdminProfileModal(false);
  }

  // ── Student preference (exam target) ─────────────────────────────────────
  const { data: me, isLoading: meLoading } = useStudentMe();
  const updateProfile = useUpdateStudentProfile();

  const [showPrefModal, setShowPrefModal]   = useState(false);
  const [pendingPref,   setPendingPref]     = useState("");
  const [prefDropdownOpen, setPrefDropdownOpen] = useState(false);

  const examTarget = me?.student?.examTarget ?? "";
  const prefKey    = user ? `pref_modal_done_${user.id}` : null;

  // Show preference modal exactly once per student (localStorage flag only — no repeat on skip)
  useEffect(() => {
    if (!isStudent || !prefKey || me === undefined) return;
    if (localStorage.getItem(prefKey)) return;
    // Fire as soon as we know the user is loaded — regardless of examTarget state
    setShowPrefModal(true);
  }, [isStudent, prefKey, me]);

  function handleSavePref() {
    if (!pendingPref || !prefKey) return;
    updateProfile.mutate({ examTarget: pendingPref }, {
      onSettled: () => { localStorage.setItem(prefKey, "1"); setShowPrefModal(false); },
    });
  }

  function handleDismissPref() {
    if (prefKey) localStorage.setItem(prefKey, "1");
    setShowPrefModal(false);
  }

  function handleChangeExamTarget(et: string) {
    setPrefDropdownOpen(false);
    updateProfile.mutate({ examTarget: et });
  }

  useEffect(() => {
    if (!isStudent) return;
    const myStudentId = me?.student?.id;
    if (!myStudentId) return;

    const token = tokenStorage.getAccess();
    if (!token) return;

    const raw = import.meta.env.VITE_BACKEND_URL || getApiOrigin() || "http://127.0.0.1:3000";
    const backendUrl = (() => {
      try {
        return new URL(raw).origin;
      } catch {
        return raw;
      }
    })();

    const socket = ensureBattleSocket(backendUrl, token);

    socket.on("connect", () => {
      socket.emit("lobby:join", {
        studentId: myStudentId,
        tenantId: user?.tenantId,
      });
    });

    socket.on("battle:incoming_request", (payload: IncomingBattleChallenge) => {
      if (latestPathRef.current.startsWith("/student/battle")) return;
      navigate("/student/battle", { state: { incomingChallenge: payload } });
    });

    return () => {
      disconnectBattleSocket();
    };
  }, [isStudent, me?.student?.id, navigate, user?.tenantId]);

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

  // Redirect to onboarding — driven by backend flag (set at login) so it fires exactly once
  if (user.role === "teacher" && user.teacherProfile === null) {
    return <Navigate to="/teacher/onboarding" replace />;
  }
  if (user.role === "institute_admin" && user.onboardingRequired === true) {
    return <Navigate to="/admin/onboard" replace />;
  }

  // ── Student onboarding: redirect if no exam target has been set ──────────────
  if (isStudent && location.pathname !== "/student/onboarding") {
    const onboardKey = `student_onboarded_${user.id}`;
    if (!localStorage.getItem(onboardKey)) {
      if (meLoading) {
        // Still fetching me — show a neutral loader so there's no content flash
        return (
          <div className="flex min-h-dvh items-center justify-center bg-slate-50 font-poppins">
            <Loader2 className="h-8 w-8 shrink-0 animate-spin text-indigo-400" aria-hidden />
            <span className="sr-only">Loading…</span>
          </div>
        );
      }
      if (me !== undefined) {
        if (!me?.student?.examTarget) {
          return <Navigate to="/student/onboarding" replace />;
        }
        // Already has an exam target — mark as done so we never check again
        localStorage.setItem(onboardKey, "1");
      }
    }
  }

  const navItems = navByRole[user.role];
  const section = sectionLabels[user.role];

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div
      className="relative flex h-full flex-col overflow-hidden border-r border-slate-100 bg-white"
      style={{ boxShadow: lightDashboardShell ? "2px 0 14px rgba(0,0,0,0.04)" : "4px 0 24px rgba(0,0,0,0.06)" }}
    >
      {/* ── Brand ── */}
      <div className="h-24 px-4 flex items-center justify-center shrink-0 border-b border-slate-100/50">
        <EddvaLogo className="h-16 w-auto max-w-full cursor-pointer transition-transform duration-500 hover:scale-105" />
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto space-y-1 scrollbar-none relative z-10">
        {sidebarOpen && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-5 mb-3 text-slate-500">
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
                  "group flex items-center rounded-2xl text-[16px] font-bold transition-[background-color,border-color,color,transform] duration-500 relative tracking-wide",
                  sidebarOpen ? "gap-4 px-5 py-3" : "justify-center px-0 py-3",
                  isActive
                    ? cn("text-indigo-600 bg-indigo-50/50 border border-indigo-100/50 scale-[1.02] z-10", sidebarOpen ? "shadow-sm" : "shadow-none")
                    : "text-slate-900 hover:text-black hover:bg-slate-50/50"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "flex items-center justify-center rounded-xl shrink-0 transition-[width,height,background-color,color] duration-500",
                    sidebarOpen ? "w-7 h-7" : "w-10 h-10",
                    isActive
                      ? cn("bg-indigo-600 text-white", sidebarOpen && "shadow-lg")
                      : "bg-transparent text-slate-600 group-hover:text-slate-800"
                  )}>
                    <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-current")} />
                  </div>
                  {sidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="">
                      {item.label}
                    </motion.span>
                  )}
                  {(item.badge || (item.path === "/student/notifications" && unreadNotifCount > 0)) && sidebarOpen && (
                    <span className="ml-auto bg-red-500 text-[8px] font-bold text-white px-2 py-0.5 rounded-lg">
                      {item.path === "/student/notifications" ? (unreadNotifCount > 9 ? "9+" : unreadNotifCount) : item.badge}
                    </span>
                  )}
                  {item.path === "/student/notifications" && !sidebarOpen && unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
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
      <div className="p-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
        <div className={cn("flex items-center px-2", sidebarOpen ? "gap-4" : "justify-center")}>
          <div className={cn("w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group transition-[box-shadow] duration-300 hover:scale-110", sidebarOpen ? "shadow-sm" : "shadow-none")}>
            <User className="w-4 h-4 group-hover:text-indigo-500 transition-colors" />
          </div>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 capitalize mt-0.5">{user.role.replace("_", " ")}</p>
              </motion.div>
              <button onClick={handleLogout} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const notificationPath =
    user.role === "institute_admin" ? "/admin/notifications"
    : user.role === "super_admin"   ? "/super-admin/announcements"
    : user.role === "student"       ? "/student/notifications"
    : null;

  const settingsPath =
    user.role === "institute_admin" ? "/admin/settings"
    : user.role === "super_admin"   ? "/super-admin/settings"
    : "/teacher/profile";

  const navOpen = isCompactLayout ? mobileSidebarOpen : sidebarOpen;

  return (
    <div
      className={cn("flex h-dvh max-h-dvh min-h-0 overflow-hidden text-slate-900 selection:bg-indigo-600/10", (user.role === "super_admin" || user.role === "teacher") ? "font-sans bg-white" : "font-poppins")}
    >
      {!lightDashboardShell && <AeroBackground />}
      
      {/* ── Desktop Sidebar ── */}
      <aside className={cn(
          "hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-out relative z-50",
          sidebarOpen ? "w-[280px]" : "w-[90px]"
        )}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-[100] flex lg:hidden">
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="h-full w-[min(280px,100vw-40px)] shadow-xl"
            >
              <div className="h-full w-full min-h-0">
                <SidebarContent />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                "min-h-0 min-w-0 flex-1 touch-none",
                lightDashboardShell ? "bg-slate-900/16" : "bg-slate-900/20 backdrop-blur-sm"
              )}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── Main Area (min-h-0 required so flex-1 main can scroll on mobile) ── */}
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "z-[60] flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-3 sm:px-6 md:px-8 lg:px-10",
            lightDashboardShell
              ? "bg-white"
              : "bg-white/80 backdrop-blur-md supports-[backdrop-filter]:md:bg-white/40"
          )}
          style={{ paddingTop: "max(0px, env(safe-area-inset-top, 0px))" }}
        >
           <div className="flex min-w-0 items-center gap-3 sm:gap-6">
              <button
                type="button"
                onClick={() => (isCompactLayout ? setMobileSidebarOpen((v) => !v) : setSidebarOpen((v) => !v))}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 shadow-sm transition-all hover:border-indigo-100 hover:text-indigo-600"
                aria-expanded={navOpen}
                aria-label="Toggle menu"
              >
                <Menu className="h-4 w-4" />
              </button>
           </div>

           <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
              {/* ── Exam Preference Switcher (students only) ── */}
              {isStudent && examTarget && (
                <div className="relative">
                  <button
                    onClick={() => setPrefDropdownOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full bg-gradient-to-br shrink-0",
                      EXAM_OPTIONS.find(o => o.key === examTarget.toLowerCase())?.color ?? "from-indigo-400 to-purple-500"
                    )} />
                    <span className="uppercase tracking-wide">{examTarget.replace(/_/g, " ")}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {prefDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-[80]">
                      <p className="px-4 pt-1.5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Change Preference</p>
                      {EXAM_OPTIONS.map(opt => {
                        const isActive = examTarget.toLowerCase() === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleChangeExamTarget(opt.key)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50",
                              isActive ? "text-indigo-600" : "text-slate-700"
                            )}
                          >
                            <div className={cn("w-3 h-3 rounded-full bg-gradient-to-br shrink-0", opt.color)} />
                            {opt.label}
                            {isActive && (
                              <span className="ml-auto text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full">Active</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => notificationPath && navigate(notificationPath)}
                className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm relative"
                title={unreadNotifCount > 0 ? `${unreadNotifCount} unread notifications` : "Notifications"}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  unreadNotifCount > 9 ? (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      9+
                    </span>
                  ) : (
                    <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                      {unreadNotifCount}
                    </span>
                  )
                )}
              </button>

              {/* ── Institute avatar + dropdown ── */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  aria-haspopup="true"
                  aria-expanded={showUserMenu}
                  className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm overflow-hidden hover:border-indigo-300 transition-all"
                >
                  {instProfile?.orgImageUrl ? (
                    <img src={instProfile.orgImageUrl} alt="Institute" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-indigo-600">{user.name[0]}</span>
                  )}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                      aria-label="User menu"
                      className="absolute right-0 top-13 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-[80]"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user.role.replace("_", " ")}</p>
                      </div>
                      <button
                        role="menuitem"
                        onClick={() => { setShowUserMenu(false); navigate(settingsPath); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Settings
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => { setShowUserMenu(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           </div>
        </header>

        <main className="relative min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] custom-scrollbar">
           <div
            className={cn(
              "mx-auto w-full transition-all duration-200",
              location.pathname.includes("/live") || location.pathname.includes("/quiz")
                ? "max-w-none p-0"
                : "max-w-[1700px] px-3 py-4 sm:px-4 lg:px-6 lg:py-6 pb-[max(6rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]"
            )}
           >
              <PageErrorBoundary>
                <Outlet />
              </PageErrorBoundary>
           </div>
        </main>
      </div>

      {/* ── Preference Modal (students only, shown once on first login) ── */}
      {showPrefModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={handleDismissPref}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome, {me?.fullName?.split(" ")[0] || user.name.split(" ")[0]}!
              </h2>
              <p className="text-slate-500 text-sm mt-1">What are you preparing for?</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {EXAM_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setPendingPref(opt.key)}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-left transition-all",
                    pendingPref === opt.key
                      ? `${opt.bg} ${opt.border} shadow-sm`
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br mb-2", opt.color)} />
                  <p className={cn("font-bold text-sm", pendingPref === opt.key ? opt.text : "text-slate-800")}>{opt.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleSavePref}
              disabled={!pendingPref || updateProfile.isPending}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {updateProfile.isPending ? "Saving…" : "Start Learning"}
            </button>

            <button
              onClick={handleDismissPref}
              className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* ── Admin Profile Setup Modal (shown once on first login) ── */}
      {showAdminProfileModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={handleSkipAdminProfile}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Set up your profile</h2>
              <p className="text-slate-500 text-sm mt-1">Tell students a bit about your institute</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Institute Name</label>
                <input
                  placeholder="e.g. Bright Future Academy"
                  value={adminForm.instituteName}
                  onChange={e => setAdminForm(f => ({ ...f, instituteName: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Your Name</label>
                <input
                  placeholder="Admin full name"
                  value={adminForm.adminName}
                  onChange={e => setAdminForm(f => ({ ...f, adminName: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Contact Email</label>
                <input
                  type="email"
                  placeholder="admin@institute.com"
                  value={adminForm.email}
                  onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleSaveAdminProfile}
              disabled={updateInstProfile.isPending}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateInstProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {updateInstProfile.isPending ? "Saving…" : "Save & Continue"}
            </button>

            <button
              onClick={handleSkipAdminProfile}
              className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
            >
              Skip for now — complete later in Settings
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;
