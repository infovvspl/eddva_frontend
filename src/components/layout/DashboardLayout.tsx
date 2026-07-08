import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, roleRedirectPath } from "@/lib/auth-store";
import { useLogout, useDismissFirstLogin } from "@/hooks/use-auth";
import { useIsCompactLayout, useIsMobile } from "@/hooks/use-mobile";
import type { UserRole } from "@/lib/types";
import { UnifiedSidebar } from "@/components/layout/UnifiedSidebar";
import {
  Home, Building2, Users, Megaphone, BarChart3, Settings,
  BookOpen, GraduationCap, Calendar,
  Video, Layout, BarChart, Radio,
  Swords, Trophy, Brain, User, LogOut, Menu, X, MessageSquare, MessageCircle, Sparkles,
  LayoutDashboard, ClipboardList, Library, Bell, BellOff,
  ChevronDown, ChevronLeft, Loader2, HelpCircle,
  Ticket, FileText, Shield, ToggleRight,
} from "lucide-react";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { cn } from "@/lib/utils";
import { usePresenceHeartbeat } from "@/hooks/use-presence";
import { useTenantFeatures } from "@/hooks/use-tenant-features";
import { AeroBackground } from "@/components/shared/AeroBackground";
import { motion, AnimatePresence } from "framer-motion";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { useStudentMe, useUpdateStudentProfile } from "@/hooks/use-student";
import { useInstituteProfile, useUpdateInstituteProfile } from "@/hooks/use-admin";
import { PageErrorBoundary } from "@/components/shared/PageErrorBoundary";
import MaintenanceNotice from "@/components/shared/MaintenanceNotice";
import { useUnreadCount, useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/use-notifications";
import { WelcomeWalkthrough } from "@/components/onboarding/WelcomeWalkthrough";
import { useNavTour } from "@/components/onboarding/useNavTour";
import { NavTourCard } from "@/components/onboarding/NavTourCard";
import { PageTourCard } from "@/components/onboarding/PageTourCard";
import { tokenStorage } from "@/lib/api/client";
import { getApiOrigin } from "@/lib/api-config";
import { ensureBattleSocket, disconnectBattleSocket } from "@/lib/battle-socket";

const EXAM_OPTIONS = [
  { key: "jee", label: "JEE", desc: "Joint Entrance Examination", color: "from-orange-400 to-red-500", bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-600" },
  { key: "neet", label: "NEET", desc: "Medical Entrance", color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-600" },
  { key: "cbse_10", label: "CBSE Class 10", desc: "Board Examinations", color: "from-blue-400 to-indigo-500", bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-600" },
  { key: "cbse_12", label: "CBSE Class 12", desc: "Board Examinations", color: "from-violet-400 to-purple-500", bg: "bg-violet-50", border: "border-violet-300", text: "text-violet-600" },
] as const;

interface IncomingBattleChallenge {
  challengeId: string;
  fromStudentId: string;
  expiresInSeconds: number;
  batchId?: string;
  batchName?: string;
}

// Custom composite icon: Brain + question mark — represents learning + confusion/doubt
function BrainQuestion({ className }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className ?? ""}`}>
      <Brain className="w-full h-full" />
      <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-indigo-600 text-white" style={{ width: "40%", height: "40%", fontSize: "60%", fontWeight: 900, lineHeight: 1 }}>?</span>
    </span>
  );
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const superAdminGroups = [
  {
    heading: "Overview",
    items: [
      { path: "/super-admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { path: "/super-admin/tenants", label: "Institutes", icon: Building2 },
    ],
  },
  {
    heading: "Communication",
    items: [
      { path: "/super-admin/communication", label: "Communication", icon: Megaphone },
      { path: "/super-admin/complaints", label: "Support Tickets", icon: Ticket },
    ],
  },
  {
    heading: "Insights",
    items: [
      { path: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
      { path: "/super-admin/ai-usage", label: "AI Usage", icon: Sparkles },
    ],
  },
  {
    heading: "Governance",
    items: [
      { path: "/super-admin/audit-logs", label: "Audit Logs", icon: FileText },
      { path: "/super-admin/security", label: "Security Center", icon: Shield },
      { path: "/super-admin/settings", label: "Settings", icon: Settings },
      { path: "/super-admin/feature-flags", label: "Feature Flags", icon: ToggleRight },
      { action: "logout", label: "Logout", icon: LogOut, path: "" },
    ],
  },
];

const navByRole: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Dashboard", path: "/super-admin", icon: LayoutDashboard },
    { label: "Institutes", path: "/super-admin/tenants", icon: Building2 },
    { label: "Support Tickets", path: "/super-admin/support-tickets", icon: Ticket },
    { label: "Communication", path: "/super-admin/communication", icon: Megaphone },
    { label: "Analytics", path: "/super-admin/analytics", icon: BarChart3 },
    { label: "AI Usage", path: "/super-admin/ai-usage", icon: Sparkles },
    { label: "Audit Logs", path: "/super-admin/audit-logs", icon: FileText },
    { label: "Security Centre", path: "/super-admin/security", icon: Shield },
    { label: "Settings", path: "/super-admin/settings", icon: Settings },
    { label: "Feature Flags", path: "/super-admin/feature-flags", icon: ToggleRight },
  ],
  institute_admin: [
    { label: "Dashboard", path: "/admin", icon: Home },
    { label: "Courses", path: "/admin/batches", icon: Layout },
    { label: "Students", path: "/admin/students", icon: Users },
    { label: "Content", path: "/admin/content", icon: GraduationCap },
    { label: "Lectures", path: "/teacher/lectures", icon: Video },
    { label: "Doubt Queue", path: "/teacher/doubts", icon: MessageSquare },
    { label: "Analytics", path: "/teacher/analytics", icon: BarChart },
    { label: "Mock Tests", path: "/admin/mock-tests", icon: BookOpen },
    { label: "Calendar", path: "/admin/calendar", icon: Calendar },
    { label: "Notifications", path: "/admin/notifications", icon: Bell },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher", icon: Home },
    { label: "Content", path: "/teacher/content", icon: GraduationCap },
    { label: "Live Classes", path: "/teacher/lectures", icon: Radio },
    { label: "Recorded Lectures", path: "/teacher/recorded-lectures", icon: Video },
    { label: "Quizzes & Tests", path: "/teacher/quizzes", icon: BookOpen },
    { label: "Doubt Queue", path: "/teacher/doubts", icon: MessageSquare, badge: 5 },
    { label: "My Batches", path: "/teacher/batches", icon: Users },
    { label: "Calendar", path: "/teacher/calendar", icon: Calendar },
    { label: "Analytics", path: "/teacher/analytics", icon: BarChart },
    { label: "Communication", path: "/teacher/communication", icon: MessageCircle },
    { label: "AI Tools", path: "/teacher/ai-tools", icon: Sparkles },
    { label: "Support Tickets", path: "/teacher/support-tickets", icon: Ticket },
    { label: "My Profile", path: "/teacher/profile", icon: User },
  ],
  student: [
    { label: "Dashboard", path: "/student", icon: LayoutDashboard },
    { label: "Live Classes", path: "/student/live-classes", icon: Radio },
    { label: "Calendar", path: "/student/calendar", icon: Calendar },
    { label: "My Courses", path: "/student/courses", icon: Library },
    { label: "Courses", path: "/student/learn", icon: Brain },
    { label: "Study Plan", path: "/student/study-plan", icon: ClipboardList },
    { label: "Doubts", path: "/student/doubts", icon: BrainQuestion },
    { label: "Leaderboard", path: "/student/leaderboard", icon: Trophy },
    { label: "Communication", path: "/student/communication", icon: MessageCircle },
    { label: "Battle Arena", path: "/student/battle", icon: Swords },
    { label: "My Progress", path: "/student/progress", icon: BarChart },
    { label: "Profile", path: "/student/profile", icon: User },
  ],
  parent: [],
};

const sectionLabels: Record<UserRole, { main: string }> = {
  super_admin: { main: "Governance" },
  institute_admin: { main: "Operations" },
  teacher: { main: "Instruction" },
  student: { main: "Advancement" },
  parent: { main: "Parent Portal" },
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
  const [showTeacherNotif, setShowTeacherNotif] = useState(false);
  const teacherNotifRef = useRef<HTMLDivElement>(null);
  const { data: notifResult } = useNotifications({ limit: 15 });
  const notifs = Array.isArray(notifResult) ? notifResult : (notifResult?.data ?? []);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const isCompactLayout = useIsCompactLayout();
  const isMobile = useIsMobile();
  const lightDashboardShell = isCompactLayout || user?.role === "student" || user?.role === "teacher";

  // Close profile dropdown on any outside click (production-grade)
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
      setShowUserMenu(false);
    }
  }, []);

  const handleOutsideClickNotif = useCallback((e: MouseEvent) => {
    if (teacherNotifRef.current && !teacherNotifRef.current.contains(e.target as Node)) {
      setShowTeacherNotif(false);
    }
  }, []);

  useEffect(() => {
    latestPathRef.current = location.pathname;
  }, [location.pathname]);

  // Ensure mobile/tablet drawer always closes after route changes.
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (showUserMenu) {
      document.addEventListener("mousedown", handleOutsideClick, true);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick, true);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick, true);
  }, [showUserMenu, handleOutsideClick]);

  useEffect(() => {
    if (showTeacherNotif) {
      document.addEventListener("mousedown", handleOutsideClickNotif, true);
    } else {
      document.removeEventListener("mousedown", handleOutsideClickNotif, true);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClickNotif, true);
  }, [showTeacherNotif, handleOutsideClickNotif]);

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
  useTenantFeatures(); // fetch + cache AI feature flags for this tenant
  const { aiEnabled, aiFeatures } = useAuthStore();

  const isStudent = user?.role === "student";
  const isInstAdmin = user?.role === "institute_admin";

  // ── Welcome walkthrough (disabled for now) ─────────────────────────────────
  const walkthroughKey = user ? `walkthrough_v1_${user.id}` : null;
  const [walkthroughDone] = useState(true); // Tour disabled — always skip
  const {
    startTour,
    isActive: tourActive,
    currentStep: tourStep,
    currentStepIdx,
    totalSteps: tourTotalSteps,
    phase: tourPhase,
    currentPageFeature,
    pageFeatureIdx,
    totalPageFeatures,
    advanceFromNav,
    advancePageFeature,
    skip: skipTour,
  } = useNavTour(user.role);
  function handleWalkthroughDone() {
    if (walkthroughKey) localStorage.setItem(walkthroughKey, "1");
    // Tour disabled — do not start nav tour
  }

  // ── Admin profile setup modal (shown once on first login) ────────────────
  const { data: instProfile } = useInstituteProfile(isInstAdmin);
  const updateInstProfile = useUpdateInstituteProfile();
  const dismissFirstLogin = useDismissFirstLogin();

  const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ instituteName: "", adminName: "", email: "" });
  const adminProfileKey = user ? `admin_profile_done_${user.id}` : null;

  useEffect(() => {
    if (!isInstAdmin || instProfile === undefined) return;
    if (!user?.isFirstLogin) return;
    if (!walkthroughDone) return;
    if (adminProfileKey && localStorage.getItem(adminProfileKey)) return;

    setAdminForm({
      instituteName: instProfile.instituteName ?? "",
      adminName: instProfile.adminName ?? "",
      email: instProfile.email ?? "",
    });
    setShowAdminProfileModal(true);
  }, [isInstAdmin, user?.isFirstLogin, adminProfileKey, instProfile]);

  function handleSaveAdminProfile() {
    updateInstProfile.mutate(
      { instituteName: adminForm.instituteName || undefined, adminName: adminForm.adminName || undefined, email: adminForm.email || undefined },
      {
        onSettled: () => {
          if (adminProfileKey) localStorage.setItem(adminProfileKey, "1");
          setShowAdminProfileModal(false);
        }
      }
    );
  }

  function handleSkipAdminProfile() {
    dismissFirstLogin.mutate(undefined, {
      onSettled: () => {
        if (adminProfileKey) localStorage.setItem(adminProfileKey, "1");
        setShowAdminProfileModal(false);
      }
    });
  }

  // ── Student preference (exam target) ─────────────────────────────────────
  const { data: me, isLoading: meLoading } = useStudentMe();
  const updateProfile = useUpdateStudentProfile();

  const [showPrefModal, setShowPrefModal] = useState(false);
  const [pendingPref, setPendingPref] = useState("");
  const [prefDropdownOpen, setPrefDropdownOpen] = useState(false);

  const examTarget = me?.student?.examTarget ?? "";
  const prefKey = user ? `pref_modal_done_${user.id}` : null;

  // Show preference modal exactly once per student: only on first login, and only if not already dismissed
  useEffect(() => {
    if (!isStudent || !prefKey || me === undefined) return;
    if (!user?.isFirstLogin) return;
    if (!walkthroughDone) return;
    if (localStorage.getItem(prefKey)) return;
    setShowPrefModal(true);
  }, [isStudent, prefKey, me, user?.isFirstLogin, walkthroughDone]);

  function handleSavePref() {
    if (!pendingPref || !prefKey) return;
    updateProfile.mutate({ examTarget: pendingPref }, {
      onSettled: () => {
        localStorage.setItem(prefKey, "1");
        setShowPrefModal(false);
        dismissFirstLogin.mutate();
      },
    });
  }

  function handleDismissPref() {
    if (prefKey) localStorage.setItem(prefKey, "1");
    setShowPrefModal(false);
    dismissFirstLogin.mutate();
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

    const handleConnect = () => {
      socket.emit("lobby:join", {
        studentId: myStudentId,
        tenantId: user?.tenantId,
      });
    };

    const handleIncomingRequest = (payload: IncomingBattleChallenge) => {
      if (latestPathRef.current.startsWith("/student/battle")) return;
      navigate("/student/battle", { state: { incomingChallenge: payload } });
    };

    // Prevent duplicate listeners when this effect re-runs.
    socket.off("connect", handleConnect);
    socket.off("battle:incoming_request", handleIncomingRequest);
    socket.on("connect", handleConnect);
    socket.on("battle:incoming_request", handleIncomingRequest);

    // If socket is already connected, `connect` won't fire again; join immediately.
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("battle:incoming_request", handleIncomingRequest);
      disconnectBattleSocket();
    };
  }, [isStudent, me?.student?.id, navigate, user?.tenantId]);

  // On focus pages (Quiz, Live, AI Study), collapse sidebar by default
  useEffect(() => {
    const isFocusPage = /quiz|live\/\w+|ai-study|diagnostic|lectures\/\w+/.test(location.pathname);
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

  // ── Portal Configuration Gating ──────────────────────────────────────────
  const tenant = user?.tenant;
  if (tenant) {
    if (user.role === "institute_admin" && tenant.adminPortalEnabled === false) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="bg-white rounded-[32px] border border-slate-100 p-10 max-w-md shadow-sm space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Portal Disabled</h3>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                The Admin Portal has been disabled for this institute. Please contact your system administrator.
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }
    if (user.role === "teacher" && tenant.teacherPortalEnabled === false) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="bg-white rounded-[32px] border border-slate-100 p-10 max-w-md shadow-sm space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Portal Disabled</h3>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                The Teacher Portal has been disabled for this institute. Please contact your system administrator.
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }
    if (user.role === "student" && tenant.studentPortalEnabled === false) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="bg-white rounded-[32px] border border-slate-100 p-10 max-w-md shadow-sm space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Portal Disabled</h3>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                The Student Portal has been disabled for this institute. Please contact your system administrator.
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }
    if (user.role === "parent" && tenant.parentPortalEnabled === false) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="bg-white rounded-[32px] border border-slate-100 p-10 max-w-md shadow-sm space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Home className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Portal Disabled</h3>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                The Parent Portal has been disabled for this institute. Please contact your system administrator.
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }
  }
  const { modulesPermissions = {} } = useAuthStore();

  // AI nav paths that require specific feature flags
  const AI_NAV_GATES: Record<string, string> = {
    "/teacher/ai-tools": "ai_content_generation",
    "/student/battle": "ai_battle_arena",
    "/student/study-plan": "ai_study_plan",
    "/student/doubts": "ai_doubt_resolution",
    "/student/ai-study": "ai_study_assistant",
    "/teacher/analytics": "ai_analytics",
  };

  const MODULE_NAV_GATES: Record<string, string> = {
    "/teacher/lectures": "live_lectures",
    "/teacher/recorded-lectures": "recorded_lectures",
    "/admin/lectures": "recorded_lectures",
    "/admin/mock-tests": "mock_tests",
    "/teacher/quizzes": "mock_tests",
    "/teacher/doubts": "doubt_queue",
    "/student/doubts": "doubt_queue",
    "/student/leaderboard": "leaderboard",
    "/admin/calendar": "calendar",
    "/teacher/calendar": "calendar",
    "/student/calendar": "calendar",
    "/admin/content": "content_library",
    "/teacher/content": "content_library",
    "/student/learn": "content_library",
    "/admin/notifications": "notifications",
    "/student/live-classes": "live_lectures",
  };

  const isStaffBased = user.tenant?.teacherPortalEnabled === false || user.tenant?.operationalModel === 'STAFF_BASED';

  const getAdminNavItems = (): NavItem[] => {
    if (!isStaffBased) {
      // Teacher-Based Coaching: Admin Sidebar
      return [
        { label: "Dashboard", path: "/admin", icon: Home },
        { label: "Teachers", path: "/admin/teachers", icon: Users },
        { label: "Students", path: "/admin/students", icon: Users },
        { label: "Batches", path: "/admin/batches", icon: Layout },
        { label: "Content", path: "/admin/content", icon: GraduationCap },
        { label: "Live Classes", path: "/teacher/lectures", icon: Radio },
        { label: "Recorded Classes", path: "/teacher/recorded-lectures", icon: Video },
        { label: "Mock Tests", path: "/admin/mock-tests", icon: BookOpen },
        { label: "Reports", path: "/admin/reports", icon: ClipboardList },
        { label: "Calendar", path: "/admin/calendar", icon: Calendar },
        { label: "Communication", path: "/admin/communication", icon: Megaphone },
        { label: "Support Tickets", path: "/admin/support-tickets", icon: Ticket },
        { label: "Notifications", path: "/admin/notifications", icon: Bell },
        { label: "Settings", path: "/admin/settings", icon: Settings },
      ];
    }

    // Staff-Based Coaching: Admin Sidebar with Permission Groups
    const group = String(user.permissionGroup || '').toUpperCase();

    if (group === 'ACADEMIC_COORDINATOR') {
      return [
        { label: "Dashboard", path: "/admin", icon: Home },
        { label: "Batches", path: "/admin/batches", icon: Layout },
        { label: "Mock Tests", path: "/admin/mock-tests", icon: BookOpen },
        { label: "Content Library", path: "/admin/content", icon: GraduationCap },
        { label: "Students", path: "/admin/students", icon: Users },
        { label: "Lectures", path: "/teacher/lectures", icon: Video },
        { label: "Doubt Queue", path: "/teacher/doubts", icon: MessageSquare },
        { label: "Quizzes", path: "/teacher/quizzes", icon: BookOpen },
        { label: "Analytics", path: "/teacher/analytics", icon: BarChart },
      ];
    }

    if (group === 'RECEPTION') {
      return [
        { label: "Dashboard", path: "/admin", icon: Home },
        { label: "Students", path: "/admin/students", icon: Users },
        { label: "Calendar", path: "/admin/calendar", icon: Calendar },
        { label: "Notifications", path: "/admin/notifications", icon: Bell },
      ];
    }

    if (group === 'FINANCE_MANAGER') {
      return [
        { label: "Dashboard", path: "/admin", icon: Home },
        { label: "Reports", path: "/admin/reports", icon: ClipboardList },
        { label: "Calendar", path: "/admin/calendar", icon: Calendar },
      ];
    }

    if (group === 'OPERATOR') {
      return [
        { label: "Dashboard", path: "/admin", icon: Home },
        { label: "Students", path: "/admin/students", icon: Users },
        { label: "Calendar", path: "/admin/calendar", icon: Calendar },
        { label: "Notifications", path: "/admin/notifications", icon: Bell },
      ];
    }

    // Default (Director or Owner with Full Access)
    return [
      { label: "Dashboard", path: "/admin", icon: Home },
      { label: "Staff", path: "/admin/teachers", icon: Users },
      { label: "Students", path: "/admin/students", icon: Users },
      { label: "Batches", path: "/admin/batches", icon: Layout },
      { label: "Content Library", path: "/admin/content", icon: GraduationCap },
      { label: "Mock Tests", path: "/admin/mock-tests", icon: BookOpen },
      { label: "Live Classes", path: "/teacher/lectures", icon: Radio },
      { label: "Recorded Classes", path: "/teacher/recorded-lectures", icon: Video },
      { label: "Doubt Queue", path: "/teacher/doubts", icon: MessageSquare },
      { label: "Quizzes & Tests", path: "/teacher/quizzes", icon: BookOpen },
      { label: "Reports", path: "/admin/reports", icon: ClipboardList },
      { label: "Analytics", path: "/teacher/analytics", icon: BarChart },
      { label: "Calendar", path: "/admin/calendar", icon: Calendar },
      { label: "Communication", path: "/admin/communication", icon: Megaphone },
      { label: "Support Tickets", path: "/admin/support-tickets", icon: Ticket },
      { label: "Notifications", path: "/admin/notifications", icon: Bell },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ];
  };

  const rawNavItems = user.role === 'institute_admin' ? getAdminNavItems() : (navByRole[user.role] || []);

  const navItems = rawNavItems.filter((item) => {
    // 1. AI check
    const requiredFeature = AI_NAV_GATES[item.path];
    if (requiredFeature && !(aiEnabled && aiFeatures.includes(requiredFeature as any))) {
      return false;
    }

    // 2. Portal active check
    const tenant = user?.tenant;
    if (tenant) {
      if (item.path.startsWith("/admin") && tenant.adminPortalEnabled === false) {
        return false;
      }
      if (item.path.startsWith("/teacher") && tenant.teacherPortalEnabled === false) {
        return false;
      }
      if (item.path.startsWith("/student") && tenant.studentPortalEnabled === false) {
        return false;
      }
      if (item.path.startsWith("/school/parent") && tenant.parentPortalEnabled === false) {
        return false;
      }
    }

    // 3. Check standard modules gates
    const requiredModule = MODULE_NAV_GATES[item.path];
    if (requiredModule && modulesPermissions[requiredModule] === false) {
      return false;
    }

    return true;
  });


  const section = sectionLabels[user.role];

  const handleLogout = () => {
    logout();
  };

  const renderSidebarContent = (forceOpen: boolean = false) => {
    const isExpanded = sidebarOpen || forceOpen;
    return (
      <div
        className="relative flex h-full flex-col overflow-hidden border-r border-slate-100 bg-white"
        style={{ boxShadow: lightDashboardShell ? "2px 0 14px rgba(0,0,0,0.04)" : "4px 0 24px rgba(0,0,0,0.06)" }}
      >
        {/* ── Brand ── */}
        <div className="h-24 px-4 flex items-center justify-between shrink-0 border-b border-slate-100/50">
          <EddvaLogo className="h-16 w-auto max-w-full cursor-pointer transition-transform duration-500 hover:scale-105" />
          {forceOpen && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-white text-slate-900 shadow-sm transition-all hover:bg-slate-100"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={3} />
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className={cn("flex-1 py-6 px-4 space-y-1 scrollbar-none relative z-10", user.role === "super_admin" ? "overflow-hidden" : "overflow-y-auto")}>
          {isExpanded && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-5 mb-3 text-slate-500">
              {section.main}
            </p>
          )}
          {navItems.map((item) => {
            const itemNavKey = item.path.split("/").filter(Boolean).pop();
            const isTourTarget = tourActive && tourPhase === "nav" && tourStep?.navKey === itemNavKey;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === roleRedirectPath[user.role]}
                data-tour={`nav-${itemNavKey}`}
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setShowUserMenu(false);
                  setPrefDropdownOpen(false);
                  if (isTourTarget) advanceFromNav();
                }}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center rounded-2xl text-[15px] font-medium transition-[background-color,border-color,color,transform] duration-500 relative tracking-tight",
                    isExpanded ? "gap-4 px-5 py-3.5 my-0.5" : "justify-center px-0 py-3.5 my-0.5",
                    isActive
                      ? cn("text-indigo-600 bg-indigo-50/50 border border-indigo-100/50 scale-[1.01] z-10 font-bold", isExpanded ? "shadow-sm" : "shadow-none")
                      : "text-slate-600 hover:text-black hover:bg-slate-50/40",
                    isTourTarget && "ring-2 ring-indigo-500 ring-offset-1 animate-pulse z-10"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      "flex items-center justify-center rounded-xl shrink-0 transition-[width,height,background-color,color] duration-500",
                      isExpanded ? "w-7 h-7" : "w-10 h-10",
                      isActive
                        ? cn("bg-indigo-600 text-white", isExpanded && "shadow-lg")
                        : "bg-transparent text-slate-600 group-hover:text-slate-800"
                    )}>
                      <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-current")} />
                    </div>
                    {isExpanded && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="">
                        {item.label}
                      </motion.span>
                    )}
                    {(item.badge || (item.path === "/student/notifications" && unreadNotifCount > 0)) && isExpanded && (
                      <span className="ml-auto bg-red-500 text-[8px] font-bold text-white px-2 py-0.5 rounded-lg">
                        {item.path === "/student/notifications" ? (unreadNotifCount > 9 ? "9+" : unreadNotifCount) : item.badge}
                      </span>
                    )}
                    {item.path === "/student/notifications" && !isExpanded && unreadNotifCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    {!isExpanded && (
                      <div className="absolute left-full ml-6 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-xl bg-slate-900 text-white translate-x-10 group-hover:translate-x-0">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div
          data-tour="nav-sidebar-footer"
          className={cn(
            "p-4 border-t border-slate-100 bg-slate-50/30 shrink-0 rounded-b-2xl transition-all",
            tourActive && tourPhase === "nav" && tourStep?.navKey === "sidebar-footer" && "ring-2 ring-indigo-500 ring-offset-1 animate-pulse"
          )}
        >
          <div className={cn("flex items-center px-2", isExpanded ? "gap-4" : "justify-center")}>
            <div className={cn("w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group transition-[box-shadow] duration-300 hover:scale-110", isExpanded ? "shadow-sm" : "shadow-none")}>
              <User className="w-4 h-4 group-hover:text-indigo-500 transition-colors" />
            </div>
            {isExpanded && (
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
  };

  const notificationPath =
    user.role === "institute_admin" ? "/admin/notifications"
      : user.role === "super_admin" ? "/super-admin/announcements"
        : user.role === "student" ? "/student/notifications"
          : null;

  const settingsPath =
    user.role === "institute_admin" ? "/admin/settings"
      : user.role === "super_admin" ? "/super-admin/settings"
        : user.role === "student" ? "/student/profile"
          : "/teacher/profile";

  const navOpen = isCompactLayout ? mobileSidebarOpen : sidebarOpen;
  const isFullWidthSuperAdminPage = [
    "/super-admin/communication",
    "/super-admin/analytics",
    "/super-admin/audit-logs",
    "/super-admin/settings",
    "/super-admin/feature-flags",
  ].includes(location.pathname);
  const isFullWidthCoachingAdminPage = [
    "/admin",
    "/admin/students",
    "/admin/mock-tests",
    "/admin/calendar",
    "/admin/reports",
    "/admin/communication",
    "/admin/notifications",
    "/admin/settings",
    "/teacher/lectures",
    "/teacher/recorded-lectures",
    "/teacher/doubts",
    "/teacher/analytics",
    "/teacher/communication",
  ].includes(location.pathname) ||
    location.pathname.startsWith("/admin/batches") ||
    location.pathname.startsWith("/admin/content") ||
    location.pathname.startsWith("/admin/students/") ||
    location.pathname.startsWith("/teacher/students/");
  const isFullWidthCoachingStudentPage = [
    "/student",
    "/student/calendar",
    "/student/study-plan",
    "/student/doubts",
    "/student/leaderboard",
    "/student/battle",
    "/student/progress",
    "/student/profile",
    "/student/notifications",
  ].includes(location.pathname) || location.pathname.startsWith("/student/courses") || location.pathname.startsWith("/student/learn");

  return (
    <div
      className={cn("layout-fixed flex h-dvh max-h-dvh min-h-0 overflow-hidden text-slate-900 selection:bg-indigo-600/10 font-poppins", (user.role === "super_admin" || user.role === "teacher") ? "bg-white" : "")}
    >
      {!lightDashboardShell && <AeroBackground />}

      {/* ── Sidebar (UnifiedSidebar for Super Admin, legacy for others) ── */}
      {user.role === "super_admin" ? (
        <UnifiedSidebar
          groups={superAdminGroups}
          collapsed={!sidebarOpen}
          onToggleCollapse={() => setSidebarOpen((v) => !v)}
          showCollapseToggle={false}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          logo={<EddvaLogo className="h-16 w-auto max-w-full cursor-pointer transition-transform duration-500 hover:scale-105" />}
          logoCollapsed={<div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">E</div>}
          onNavClick={() => setMobileSidebarOpen(false)}
          onAction={(action) => {
            if (action === "logout") {
              handleLogout();
            }
          }}
          profileCard={(isCollapsed) =>
            isCollapsed ? (
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">SA</div>
            ) : (
              <div className="rounded-xl bg-blue-50 p-3 dark:bg-slate-900 text-center">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Super Admin</p>
              </div>
            )
          }
        />
      ) : (
        <>
          <aside data-tour="sidebar" className={cn(
            "hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-out relative z-50",
            sidebarOpen ? "w-64 xl:w-72" : "w-[90px]"
          )}>
            {renderSidebarContent()}
          </aside>
          {/* Mobile Sidebar Backdrop (only rendered if not mobile) */}
          <AnimatePresence>
            {isCompactLayout && mobileSidebarOpen && !isMobile && (
              <motion.div
                key="sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]"
              />
            )}
          </AnimatePresence>

          {/* Mobile Sidebar Drawer */}
          <AnimatePresence>
            {isCompactLayout && mobileSidebarOpen && (
              <motion.div
                key="sidebar-drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 top-0 left-0 z-[110] w-full md:w-64 shrink-0 flex flex-col"
              >
                {renderSidebarContent(true)}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Main Area (min-h-0 required so flex-1 main can scroll on mobile) ── */}
      <div
        className={`relative z-10 flex min-h-0 min-w-0 flex-1 flex-col ${isCompactLayout && mobileSidebarOpen && isMobile ? 'pointer-events-none' : ''}`}
        onClick={() => {
          if (isCompactLayout && mobileSidebarOpen) {
            setMobileSidebarOpen(false);
          }
        }}
        inert={isCompactLayout && mobileSidebarOpen && isMobile ? "" : undefined}
      >
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

          <div data-tour="nav-header-controls" className="flex min-w-0 items-center gap-1.5 sm:gap-3">
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

            {modulesPermissions?.notifications !== false && (
              <div className="relative" ref={teacherNotifRef}>
                <button
                  data-tour="notifications"
                  onClick={() => {
                    if (user?.role === "teacher") {
                      setShowTeacherNotif(v => !v);
                    } else if (notificationPath) {
                      navigate(notificationPath);
                    }
                  }}
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

                <AnimatePresence>
                  {user?.role === "teacher" && showTeacherNotif && (
                    <motion.div
                      initial={lightDashboardShell ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
                      animate={lightDashboardShell ? undefined : { opacity: 1, scale: 1, y: 0 }}
                      exit={lightDashboardShell ? undefined : { opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-14 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-sm text-slate-800">
                          Notifications
                          {unreadNotifCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{unreadNotifCount}</span>}
                        </h3>
                        <div className="flex items-center gap-2">
                          {unreadNotifCount > 0 && (
                            <button onClick={() => markAllRead.mutate()} className="text-xs text-indigo-600 font-medium hover:underline">
                              Mark all read
                            </button>
                          )}
                          <button onClick={() => setShowTeacherNotif(false)}><X className="w-4 h-4 text-slate-400" /></button>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 bg-white">
                        {notifs.length === 0 ? (
                          <div className="flex flex-col items-center py-10 text-slate-400">
                            <BellOff className="w-8 h-8 mb-2 opacity-30" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : notifs.map((n: any) => (
                          <button key={n.id}
                            onClick={() => { if (!n.readAt) markRead.mutate(n.id); }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!n.readAt ? "bg-indigo-50/50" : ""}`}
                          >
                            <div className="flex gap-2">
                              <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.readAt ? "bg-indigo-600" : "bg-transparent"}`} />
                              <div>
                                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Institute avatar + dropdown ── */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                aria-haspopup="true"
                aria-expanded={showUserMenu}
                className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm overflow-hidden hover:border-indigo-300 transition-all"
              >
                <ProfileAvatar
                  src={user.profileImage || (user as any).profilePictureUrl || user.teacherProfile?.profilePhotoUrl || null}
                  name={user.name}
                  className="h-full w-full"
                  fallbackClassName="text-[10px] font-bold text-indigo-600"
                />
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

        <MaintenanceNotice />

        <main data-tour="main-content" className="relative min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] custom-scrollbar">
          <div
            className={cn(
              "mx-auto w-full transition-all duration-200",
              location.pathname.includes("/live") || location.pathname.includes("/quiz") || isFullWidthSuperAdminPage
                ? "max-w-none p-0"
                : location.pathname.startsWith("/super-admin") || isFullWidthCoachingAdminPage || isFullWidthCoachingStudentPage
                  ? "max-w-none px-3 py-4 sm:px-4 lg:px-6 lg:py-6 pb-[max(6rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]"
                  : "max-w-screen-2xl px-3 py-4 sm:px-4 lg:px-6 lg:py-6 pb-[max(6rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]"
            )}
          >
            <PageErrorBoundary>
              <Suspense fallback={
                <div className="flex h-[50vh] w-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
              }>
                <Outlet />
              </Suspense>
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

      {/* ── Welcome Walkthrough (shown once per user, before other first-login modals) ── */}
      {!walkthroughDone && <WelcomeWalkthrough onDone={handleWalkthroughDone} />}

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

      {/* ── Nav Tour: point at sidebar item → click to navigate ── */}
      {tourActive && tourStep && tourPhase === "nav" && (
        <NavTourCard
          step={tourStep}
          stepIndex={currentStepIdx}
          totalSteps={tourTotalSteps}
          onNext={() => { navigate(tourStep.path); advanceFromNav(); }}
          onSkip={skipTour}
        />
      )}

      {/* ── Page Tour: describe features of the current page ── */}
      {tourActive && tourStep && tourPhase === "page" && currentPageFeature && (
        <PageTourCard
          step={tourStep}
          stepIndex={currentStepIdx}
          totalSteps={tourTotalSteps}
          feature={currentPageFeature}
          featureIndex={pageFeatureIdx}
          totalFeatures={totalPageFeatures}
          onNext={advancePageFeature}
          onSkip={skipTour}
        />
      )}

    </div>
  );
};

export default DashboardLayout;
