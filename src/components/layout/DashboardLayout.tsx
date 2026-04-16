import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore, roleRedirectPath } from "@/lib/auth-store";
import { useLogout } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";
import {
  Home, Building2, Users, Megaphone, BarChart3, Settings,
  BookOpen, GraduationCap, Calendar, FileText,
  Video, Layout, BarChart,
  Swords, Trophy, Brain, User, LogOut, Menu, X, MessageSquare, Sparkles,
  LayoutDashboard, ClipboardList, Headphones, Library, Activity, Layers, ChevronRight, Bell,
  ChevronDown, Loader2,
} from "lucide-react";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePresenceHeartbeat } from "@/hooks/use-presence";
import { AeroBackground } from "@/components/shared/AeroBackground";
import { CardGlass } from "@/components/shared/CardGlass";
import { motion, AnimatePresence } from "framer-motion";
import edvaLogo from "@/assets/EDVA LOGO 04.png";
import { useDiscoverBatches, useStudentMe, useUpdateStudentProfile } from "@/hooks/use-student";
import { BatchDiscoveryModal } from "@/components/student/BatchDiscoveryModal";
import { useInstituteProfile, useUpdateInstituteProfile } from "@/hooks/use-admin";

const EXAM_OPTIONS = [
  { key: "jee",     label: "JEE",           desc: "Joint Entrance Examination", color: "from-orange-400 to-red-500",    bg: "bg-orange-50",  border: "border-orange-300", text: "text-orange-600"  },
  { key: "neet",    label: "NEET",          desc: "Medical Entrance",            color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-600" },
  { key: "cbse_10", label: "CBSE Class 10", desc: "Board Examinations",          color: "from-blue-400 to-indigo-500",  bg: "bg-blue-50",   border: "border-blue-300",   text: "text-blue-600"   },
  { key: "cbse_12", label: "CBSE Class 12", desc: "Board Examinations",          color: "from-violet-400 to-purple-500", bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-600" },
] as const;

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
    { label: "Settings",       path: "/admin/settings",            icon: Settings      },
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

  const isStudent      = user?.role === "student";
  const isInstAdmin    = user?.role === "institute_admin";

  // ── Admin profile setup modal (shown once on first login) ────────────────
  const { data: instProfile } = useInstituteProfile();
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

  const { data: discoverData } = useDiscoverBatches(isStudent);

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

  // ── Batch Discovery Modal (students only) ──────────────────────────────────
  const batchModalSeenKey = user ? `batch_discovery_seen_${user.id}` : null;

  useEffect(() => {
    if (!isStudent || !discoverData || !batchModalSeenKey) return;
    const alreadySeen = sessionStorage.getItem(batchModalSeenKey) === "true";
    if (alreadySeen) return;
    if (discoverData.availableBatches.length > 0) {
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

  // ── Student onboarding: redirect if no exam target has been set ──────────────
  if (isStudent && location.pathname !== "/student/onboarding") {
    const onboardKey = `student_onboarded_${user.id}`;
    if (!localStorage.getItem(onboardKey)) {
      if (meLoading) {
        // Still fetching me — show a neutral loader so there's no content flash
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 font-poppins">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
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
    <div className="flex flex-col h-full bg-white border-r border-slate-100 relative overflow-hidden" style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.06)" }}>
      {/* ── Brand ── */}
      <div className="h-24 px-4 flex items-center justify-center shrink-0 border-b border-slate-100/50">
        <img src={edvaLogo} alt="EDDVA" className="h-16 w-auto max-w-full object-contain cursor-pointer transition-transform duration-500 hover:scale-105" />
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
                  isActive ? "bg-indigo-600 text-white shadow-lg" : "bg-transparent text-slate-600 group-hover:text-slate-800"
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
    <div
      className={cn("flex min-h-screen text-slate-900 selection:bg-indigo-600/10", (user.role === "institute_admin" || user.role === "student") ? "font-poppins" : "font-sans bg-white")}
      style={user.role === "institute_admin" ? { background: "#F5F8FC" } : undefined}
    >
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
        <header className="h-20 shrink-0 flex items-center justify-between px-10 border-b border-slate-100 sticky top-0 z-[60] backdrop-blur-3xl" style={{ background: user.role === "institute_admin" ? "rgba(245,248,252,0.85)" : "rgba(255,255,255,0.4)" }}>
           <div className="flex items-center gap-6">
              <button
                onClick={() => window.innerWidth < 1024 ? setMobileSidebarOpen(!mobileSidebarOpen) : setSidebarOpen(!sidebarOpen)}
                className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
           </div>

           <div className="flex items-center gap-3">
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

              <button className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm relative">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span>
              </button>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm text-[10px] font-bold">
                 {user.name[0]}
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
           <div className={cn(
             "mx-auto w-full transition-all duration-1000",
             location.pathname.includes("/live") || location.pathname.includes("/quiz") ? "max-w-none p-0" : "max-w-[1700px] p-4 lg:p-6 pb-24"
           )}>
              <Outlet />
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

      {/* ── Batch Discovery Modal (students only) ── */}
      {showBatchModal && (
        <BatchDiscoveryModal onClose={() => setShowBatchModal(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
