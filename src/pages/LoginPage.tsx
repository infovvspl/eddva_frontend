import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff,
  Mail, CheckCircle2, BookOpen, Trophy, GraduationCap,
  Sparkles, ArrowLeft, KeyRound, Check,
  MessageSquare, MonitorPlay, ClipboardList, FileText, BarChart2, Users
} from "lucide-react";
import * as authApi from "@/lib/api/auth";
import type { SchoolLoginResponse } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth-store";
import type { User, UserRole } from "@/lib/types";
import { getSubdomain, getSubdomainFromHost, clearStoredSubdomain, storeSubdomain } from "@/lib/tenant";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import { SchoolLogo } from "@/components/school/admin/Brand";
import login1 from "@/assets/images/login1.png";
import login2 from "@/assets/images/login2.png";
import login3 from "@/assets/images/login3.png";
import { resolveTenant, PublicTenantInfo } from "@/lib/api/public-tenant";
import { useSchoolAuth } from "@/context/SchoolAuthContext";

const B = "#3B82F6"; // Softer Blue
const P = "#A855F7"; // Softer Purple
const G = "#10B981"; // Emerald


type View = "login" | "forgot" | "forgot-sent" | "reset" | "set-password";

/* ── floating stat card ── */
const StatCard = ({
  icon, label, value, color, delay = 0,
}: { icon: React.ReactNode; label: string; value: string; color: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: "easeOut" as const }}
    className="flex items-center gap-4 rounded-3xl bg-white/60 backdrop-blur-xl border border-white px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: color + "15" }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{label}</p>
      <p className="text-[18px] font-black text-slate-900">{value}</p>
    </div>
  </motion.div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { setUser, setTenantType } = useAuthStore();
  const { setAuthSession } = useSchoolAuth();

  const [view, setView] = useState<View>("login");
  const [tenantInfo, setTenantInfo] = useState<PublicTenantInfo | null>(null);

  useEffect(() => {

    // Strictly check the URL hostname so localhost:8080 doesn't get affected
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    let strictSubdomain = null;

    if (parts.length === 2 && parts[1] === "localhost") {
      strictSubdomain = parts[0];
    } else if (parts.length >= 3 && !["localhost", "edva.in", "eddva.in", "www", "dev", "staging", "app", "admin"].includes(parts[0])) {
      strictSubdomain = parts[0];
    }

    if (strictSubdomain) {
      resolveTenant(strictSubdomain).then(setTenantInfo).catch(console.error);
    }
  }, []);

  /* login state */
  const [identifier, setIdentifier] = useState("");   // email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  /* forgot state */
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [error, setError] = useState("");

  /* set-password state (first login) */
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [setPwNew, setSetPwNew] = useState("");
  const [setPwConfirm, setSetPwConfirm] = useState("");
  const [showSetNew, setShowSetNew] = useState(false);
  const [showSetConfirm, setShowSetConfirm] = useState(false);
  const [setPwLoading, setSetPwLoading] = useState(false);

  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const inputClass =
    "h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[15px] font-semibold text-slate-800 outline-none transition-all placeholder:text-gray-600 focus:bg-white focus:border-blue-400 focus:ring-8 focus:ring-blue-500/5 disabled:opacity-50 shadow-sm";

  const loginErrorMessage = (err: any, fallback: string) => {
    if (!err?.response) {
      return "Cannot reach the server. Start the backend (npm run start:dev in eddva_backend).";
    }
    return err.response?.data?.message || fallback;
  };

  /* ── helpers ── */
  const buildUser = (meData: any, loginMeta?: { onboardingRequired?: boolean }) => {
    const profile = meData.user;
    const studentRaw = (meData as any).student as any | undefined;
    return {
      id: profile.id,
      name: profile.fullName || profile.name || "",
      phone: profile.phoneNumber || profile.phone || "",
      email: profile.email,
      role: profile.role as "super_admin" | "institute_admin" | "teacher" | "student",
      profileImage: profile.profileImage,
      tenantId: profile.tenantId,
      tenantName: profile.tenant?.name || profile.tenantName || "",
      isFirstLogin: profile.isFirstLogin ?? false,
      onboardingRequired: loginMeta?.onboardingRequired ?? false,
      permissionGroup: profile.permissionGroup,
      tenant: profile.tenant,
      teacherProfile: meData.teacherProfile ?? null,

      studentProfile: studentRaw ? {
        id: studentRaw.id ?? "",
        batchId: studentRaw.batchId,
        examTarget: studentRaw.examTarget ?? "",
        currentClass: studentRaw.currentClass ?? "",
        examYear: studentRaw.examYear,
        diagnosticCompleted: studentRaw.diagnosticCompleted ?? false,
        streakDays: studentRaw.streakDays ?? 0,
        xpPoints: studentRaw.xpPoints ?? 0,
        currentEloTier: studentRaw.currentEloTier,
      } : null,
    };
  };

  const buildSchoolUser = (loginData: SchoolLoginResponse): User => {
    const u = loginData.user;
    const inst = loginData.institute;
    const sp = u.studentProfile;
    return {
      id: u.id,
      name: u.name,
      phone: u.phone ?? "",
      role: (() => {
        const r = u.role.toLowerCase();
        if (r.includes('super_admin')) return 'super_admin';
        if (r.includes('teacher')) return 'teacher';
        if (r.includes('institute_admin') || r.includes('admin')) return 'institute_admin';
        if (r.includes('parent')) return 'parent';
        return 'student';
      })() as UserRole,
      rawRole: u.role,
      profileImage: u.photo ?? undefined,
      instituteId: u.instituteId ?? undefined,
      tenantId: u.instituteId ?? undefined,
      tenantName: inst?.name ?? undefined,
      tenantState: (inst as any)?.state ?? undefined,
      isFirstLogin: false,
      onboardingRequired: false,
      teacherProfile: null,
      studentProfile: sp
        ? {
          id: sp.id ?? u.id,
          examTarget: "",
          currentClass: sp.currentClass ?? (sp.className && sp.sectionName ? `${sp.className} · ${sp.sectionName}` : sp.className ?? ""),
          sectionId: sp.sectionId,
          sectionName: sp.sectionName,
          classId: sp.classId,
          className: sp.className,
          enrollmentNo: sp.enrollmentNo,
          rollNo: sp.rollNo,
          subjects: sp.subjects,
          diagnosticCompleted: true,
        }
        : null,
    };
  };

  const redirectUser = (user: User, tenantType: "coaching" | "school", targetTenantDomain?: string) => {
    setTenantType(tenantType);
    setUser(user);
    if (tenantType === "school") {
      const schoolPaths: Record<string, string> = {
        super_admin: "/school/super-admin",
        institute_admin: "/school/admin",
        teacher: "/school/teacher",
        student: "/school/student",
        parent: "/school/parent",
      };

      const targetPath = schoolPaths[user.role] || "/school/student";

      navigate(targetPath);
      return;
    }
    // Coaching
    if (user.role === "super_admin") {
      // Super-admin has no tenant — clear any stale subdomain from a previous
      // institute session so it is NOT sent as X-Tenant-Subdomain on API calls.
      clearStoredSubdomain();
      navigate("/super-admin/dashboard");
      return;
    }
    const paths: Record<string, string> = {
      institute_admin: "/admin",
      teacher: "/teacher",
      student: "/student",
    };
    navigate(returnTo || paths[user.role] || "/student");
  };

  /* ── Login handler ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setError(""); setLoginLoading(true);
    try {
      const isEmail = identifier.includes("@");
      // Format phone: strip non-digits then prepend +91 if not already international
      const rawPhone = identifier.trim().replace(/[^\d+]/g, "");
      const formattedPhone = rawPhone.startsWith("+") ? rawPhone : `+91${rawPhone}`;

      const schoolPayload = isEmail
        ? { email: identifier.trim(), password }
        : { phone: formattedPhone, password };

      const trySchoolLogin = async () => {
        const schoolRes = await authApi.loginSchoolWithPassword(schoolPayload);
        const schoolUser = buildSchoolUser(schoolRes);

        setAuthSession({
          token: schoolRes.token,
          user: {
            id: schoolRes.user.id,
            name: schoolRes.user.name,
            email: schoolRes.user.email,
            role: schoolRes.user.role.toUpperCase() as any,
            phone: schoolRes.user.phone,
            instituteId: schoolRes.user.instituteId,
            studentProfile: schoolRes.user.studentProfile,
          },
          institute: schoolRes.institute ? {
            id: schoolRes.institute.id,
            name: schoolRes.institute.name,
            logo: schoolRes.institute.logo ?? null,
            state: (schoolRes.institute as any).state ?? null,
            city: (schoolRes.institute as any).city ?? null,
            location: (schoolRes.institute as any).location ?? null,
            tenantDomain: schoolRes.institute.tenantDomain ?? null,
            aiEnabled: (schoolRes.institute as any).aiEnabled ?? (schoolRes.institute as any).ai_enabled ?? false,
            aiFeatures: (schoolRes.institute as any).aiFeatures ?? (schoolRes.institute as any).ai_features ?? {},
            modulesPermissions: (schoolRes.institute as any).modulesPermissions ?? (schoolRes.institute as any).modules_permissions ?? {},
          } : null,
        });

        redirectUser(schoolUser, "school", schoolRes.institute?.tenantDomain);
      };

      const tryCoachingLogin = async () => {
        const loginRes = await authApi.loginWithPassword(
          isEmail
            ? { email: identifier.trim(), password }
            : { phoneNumber: formattedPhone, password }
        );
        const user = buildUser(await authApi.getMe(), { onboardingRequired: loginRes.onboardingRequired });
        if (user.isFirstLogin) {
          setPendingUser(user as User);
          setView("set-password");
        } else {
          redirectUser(user as User, "coaching");
        }
      };

      // On institute subdomains (e.g. odm.localhost), try school DB first
      const schoolFirst = !!getSubdomainFromHost();
      let primaryErr = "";
      let fallbackErr = "";

      if (schoolFirst) {
        try {
          await trySchoolLogin();
          return;
        } catch (e: any) {
          primaryErr = loginErrorMessage(e, "School login failed");
        }
        try {
          await tryCoachingLogin();
          return;
        } catch (e: any) {
          fallbackErr = loginErrorMessage(e, "Coaching login failed");
        }
      } else {
        try {
          await tryCoachingLogin();
          return;
        } catch (e: any) {
          primaryErr = loginErrorMessage(e, "Coaching login failed");
        }
        try {
          await trySchoolLogin();
          return;
        } catch (e: any) {
          fallbackErr = loginErrorMessage(e, "School login failed");
        }
      }

      setError(
        primaryErr && fallbackErr
          ? `${primaryErr}. ${fallbackErr}.`
          : primaryErr || fallbackErr || "Invalid credentials.",
      );
    } catch (err: any) {
      setError(loginErrorMessage(err, "Invalid credentials. Please try again."));
    } finally { setLoginLoading(false); }
  };

  /* ── Set new password handler (first login) ── */
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setPwNew !== setPwConfirm) { setError("Passwords do not match."); return; }
    if (setPwNew.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setSetPwLoading(true);
    try {
      await authApi.setPassword(setPwNew);
      if (pendingUser) {
        const user: User = { ...pendingUser, isFirstLogin: false, onboardingRequired: true };
        setUser(user);
        // Institute admins always complete onboarding on first-ever login
        if (user.role === "institute_admin") {
          navigate("/admin/onboard");
        } else {
          redirectUser(user, "coaching");
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to set password. Please try again.");
    } finally { setSetPwLoading(false); }
  };

  /* ── Forgot password handler ── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setForgotLoading(true);
    try {
      const result = await authApi.forgotPassword(forgotEmail);
      if (result.token) setResetToken(result.token);
      setView("forgot-sent");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send reset email.");
    } finally { setForgotLoading(false); }
  };

  /* ── Reset password handler ── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPw) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setForgotLoading(true);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      setView("login");
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reset password.");
    } finally { setForgotLoading(false); }
  };

  const goBack = () => { setView("login"); setError(""); };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      {/* ══════════ LEFT: Form Panel ══════════ */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 md:w-1/2 md:px-12 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md mx-auto"
        >
          {/* Logo Section */}
          <div className="mb-8 flex flex-col items-center md:items-start text-center md:text-left">
            {tenantInfo?.logoUrl || (tenantInfo?.name && (tenantInfo.name.toLowerCase().includes('army') || tenantInfo.name.toLowerCase().includes('aps'))) ? (
              <SchoolLogo src={tenantInfo.logoUrl} alt={tenantInfo.name} size="login" />
            ) : tenantInfo?.name ? (
              <h1 className="text-3xl font-black text-blue-900 tracking-tight">{tenantInfo.name}</h1>
            ) : (
              <div className="flex flex-col items-center">
                <EddvaLogo className="h-24 w-auto" />
                <p className="text-base font-bold text-slate-500 mt-2 text-center whitespace-nowrap">
                  AI Powered Digital Transformation Platform For Schools & Institutes
                </p>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back!</h1>
          <p className="text-base text-slate-500 mb-8">
            Sign in to continue to your {tenantInfo?.name || "EDDVA"} dashboard
          </p>


          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm font-medium text-red-800 leading-snug">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-900 block">Email</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Enter your email address"
                    disabled={loginLoading}
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-900 block">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loginLoading}
                    className="w-full h-12 pl-10 pr-10 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="button"
                    onClick={() => { setView("forgot"); setError(""); setForgotEmail(identifier.includes("@") ? identifier : ""); }}
                    className="text-xs font-semibold text-red-500 hover:text-red-600">
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!identifier.trim() || !password || loginLoading}
                className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {loginLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
              </button>

              <p className="text-center text-sm text-slate-600 mt-6">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-700 font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          )}

          {/* ══ VIEW: FORGOT — enter email ══ */}
          {view === "forgot" && (
            <motion.div key="forgot"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.32 }}
              className="space-y-6">

              <div>
                <button type="button" onClick={goBack}
                  className="inline-flex items-center gap-1.5 text-xs font-bold mb-5 hover:gap-2.5 transition-all text-blue-700">
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </button>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <KeyRound className="h-6 w-6 text-blue-700" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1.5">Forgot password?</h1>
                <p className="text-sm font-medium text-slate-500">
                  Enter your email and we'll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email Address
                  </label>
                  <input type="email" required value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com" disabled={forgotLoading}
                    className="w-full h-12 pl-4 pr-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all placeholder:text-slate-400 shadow-sm" />
                </div>

                <motion.button type="submit"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={!forgotEmail || forgotLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-60 bg-blue-700">
                  {forgotLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
                    : <>Send Reset Link <ArrowRight className="h-4 w-4" /></>}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ══ VIEW: SET PASSWORD (first login) ══ */}
          {view === "set-password" && (
            <motion.div key="set-password"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.32 }}
              className="space-y-6">

              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                  <KeyRound className="h-6 w-6 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1.5">Set your password</h1>
                <p className="text-sm font-medium text-slate-500">
                  You're logging in for the first time. Please choose a permanent password.
                </p>
              </div>

              <form onSubmit={handleSetPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 ml-1">
                    <Lock className="h-3.5 w-3.5" /> New Password
                  </label>
                  <div className="relative">
                    <input type={showSetNew ? "text" : "password"} required
                      value={setPwNew} onChange={e => setSetPwNew(e.target.value)}
                      placeholder="Min 8 characters" minLength={8} disabled={setPwLoading}
                      className="w-full h-12 pl-4 pr-12 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 shadow-sm" />
                    <button type="button" onClick={() => setShowSetNew(s => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                      {showSetNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 ml-1">
                    <Lock className="h-3.5 w-3.5" /> Confirm Password
                  </label>
                  <div className="relative">
                    <input type={showSetConfirm ? "text" : "password"} required
                      value={setPwConfirm} onChange={e => setSetPwConfirm(e.target.value)}
                      placeholder="Repeat new password" disabled={setPwLoading}
                      className="w-full h-12 pl-4 pr-12 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 shadow-sm" />
                    <button type="button" onClick={() => setShowSetConfirm(s => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                      {showSetConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {setPwConfirm.length > 0 && (
                    <p className={`text-xs font-bold flex items-center gap-1 mt-1 ${setPwNew === setPwConfirm ? "text-emerald-600" : "text-red-500"}`}>
                      {setPwNew === setPwConfirm
                        ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                        : "Passwords do not match"}
                    </p>
                  )}
                </div>

                <motion.button type="submit"
                  whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }}
                  disabled={!setPwNew || !setPwConfirm || setPwLoading}
                  className="relative flex h-12 w-full items-center justify-center gap-3 rounded-lg text-sm font-black text-white shadow-lg transition-all disabled:opacity-50 bg-emerald-600">
                  {setPwLoading
                    ? <><Loader2 className="h-5 w-5 animate-spin" />Saving…</>
                    : <>Set Password & Continue <ArrowRight className="h-5 w-5" /></>}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ══ VIEW: FORGOT SENT — show success + reset form if token ══ */}
          {view === "forgot-sent" && (
            <motion.div key="forgot-sent"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.32 }}
              className="space-y-6">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-2 bg-emerald-50">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1.5">Check your inbox</h2>
                <p className="text-sm font-medium text-slate-500">
                  We sent password reset instructions to{" "}
                  <span className="font-bold text-slate-800">{forgotEmail}</span>
                </p>
              </div>

              {resetToken ? (
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> New Password
                    </label>
                    <div className="relative">
                      <input type={showNew ? "text" : "password"} required
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters" minLength={8} disabled={forgotLoading}
                        className="w-full h-12 pl-4 pr-12 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all shadow-sm" />
                      <button type="button" onClick={() => setShowNew(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> Confirm Password
                    </label>
                    <div className="relative">
                      <input type={showConfirm ? "text" : "password"} required
                        value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                        placeholder="Repeat new password" disabled={forgotLoading}
                        className="w-full h-12 pl-4 pr-12 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none transition-all shadow-sm" />
                      <button type="button" onClick={() => setShowConfirm(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPw.length > 0 && (
                      <p className={`text-xs font-bold flex items-center gap-1 mt-1 ${newPassword === confirmPw ? "text-green-600" : "text-red-500"}`}>
                        {newPassword === confirmPw
                          ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                          : "Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <motion.button type="submit"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={forgotLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-60 bg-blue-700">
                    {forgotLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Resetting…</>
                      : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
                  </motion.button>
                </form>
              ) : (
                <button onClick={goBack}
                  className="h-12 w-full rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  Return to Login
                </button>
              )}
            </motion.div>
          )}

        </motion.div>
      </div>

      {/* ══════════ RIGHT: Decorative Panel ══════════ */}
      <div className="hidden md:flex w-1/2 bg-blue-50 relative flex-col items-center justify-center overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.3, 0.5] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute rounded-full border-white" style={{ top: '-10%', left: '-10%', width: '800px', height: '800px', borderWidth: '60px' }} />
          <motion.div 
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.2, 0.4] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
            className="absolute rounded-full border-white" style={{ top: '20%', right: '-30%', width: '600px', height: '600px', borderWidth: '40px' }} />
          {/* Dot patterns */}
          <div className="absolute top-12 right-12 opacity-30" style={{ backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)', backgroundSize: '16px 16px', width: '120px', height: '120px' }}></div>
          <div className="absolute bottom-12 right-12 opacity-30" style={{ backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)', backgroundSize: '16px 16px', width: '120px', height: '120px' }}></div>
        </div>

        <div className="relative z-10 w-full flex flex-col items-center justify-center px-4">
          
          {/* Text Content (Top) */}
          <div className="text-center mb-10 w-full">
            <h2 className="text-[28px] xl:text-[32px] font-black text-slate-900 mb-3 tracking-tight">One Platform. Endless Possibilities.</h2>
            <p className="text-slate-500 text-[15px] mx-auto mb-6 leading-relaxed font-medium" style={{ maxWidth: '460px' }}>
              Manage classes, assignments, tests, analytics and more &ndash; all in one smart platform.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 bg-blue-100/70 backdrop-blur-sm text-blue-800 px-4 py-2.5 rounded-full font-bold border border-blue-200/50 cursor-pointer shadow-sm" style={{ fontSize: '13px' }}>
                <div className="w-6 h-6 rounded-full bg-blue-200/80 flex items-center justify-center"><GraduationCap className="w-3.5 h-3.5" /></div>
                Smart Learning
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 bg-blue-100/70 backdrop-blur-sm text-blue-800 px-4 py-2.5 rounded-full font-bold border border-blue-200/50 cursor-pointer shadow-sm" style={{ fontSize: '13px' }}>
                <div className="w-6 h-6 rounded-full bg-blue-200/80 flex items-center justify-center"><BarChart2 className="w-3.5 h-3.5" /></div>
                Real-time Analytics
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 bg-blue-100/70 backdrop-blur-sm text-blue-800 px-4 py-2.5 rounded-full font-bold border border-blue-200/50 cursor-pointer shadow-sm" style={{ fontSize: '13px' }}>
                <div className="w-6 h-6 rounded-full bg-blue-200/80 flex items-center justify-center"><Users className="w-3.5 h-3.5" /></div>
                Institute Management
              </motion.div>
            </div>
          </div>

          {/* Dashboard Mockup Composition */}
          <div className="scale-[0.6] lg:scale-[0.8] xl:scale-[0.95] 2xl:scale-100 origin-center transition-transform w-full max-w-[420px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto w-full" 
              style={{ height: '520px' }}
            >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              {/* Main Window */}
              <div className="absolute inset-0 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col">
                {/* Browser Header */}
                <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-2 bg-slate-50/50 shrink-0 z-10">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400"></div><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div><div className="w-2.5 h-2.5 rounded-full bg-green-400"></div></div>
                  <div className="mx-auto h-5 bg-white rounded-md border border-slate-200 shadow-sm" style={{ width: '60%' }}></div>
                </div>
                <div className="flex-1 relative">
                  <AnimatePresence mode="wait">
                    {[
                      {
                        id: 0,
                        title: "Good Morning, Ananya! 👋",
                        subtitle: "Let's continue your learning journey",
                        bgColor: "#F1F5F9",
                        src: login1,
                        icons: [
                          { icon: MonitorPlay, label: "Live Classes" },
                          { icon: ClipboardList, label: "Assignments" },
                          { icon: FileText, label: "Tests" },
                          { icon: BarChart2, label: "Performance" },
                        ]
                      },
                      {
                        id: 1,
                        title: "Master Your Subjects 📚",
                        subtitle: "Interactive lessons and smart quizzes",
                        bgColor: "#F0FDF4",
                        src: login2,
                        icons: [
                          { icon: BookOpen, label: "Library" },
                          { icon: Users, label: "Discussions" },
                          { icon: Trophy, label: "Leaderboard" },
                          { icon: Sparkles, label: "AI Help" },
                        ]
                      },
                      {
                        id: 2,
                        title: "Track Your Progress 📈",
                        subtitle: "Real-time analytics and insights",
                        bgColor: "#EFF6FF",
                        src: login3,
                        icons: [-
                          { icon: BarChart2, label: "Analytics" },
                          { icon: FileText, label: "Reports" },
                          { icon: CheckCircle2, label: "Completed" },
                          { icon: GraduationCap, label: "Goals" },
                        ]
                      }
                    ].map((card, idx) => (
                      activeCard === idx && (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="absolute inset-0 flex flex-col pt-6"
                        >
                          <div className="px-6 flex-none">
                            <h3 className="font-bold text-slate-800 mb-1 mt-2 text-[16px]">{card.title}</h3>
                            <p className="text-slate-500 mb-5 text-[13px] font-medium">{card.subtitle}</p>
                            
                            <div className="flex justify-between px-1 mb-6">
                              {card.icons.map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                  <div className="w-12 h-12 rounded-xl bg-white text-blue-600 flex items-center justify-center border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
                                    <item.icon className="w-5 h-5" />
                                  </div>
                                  <span className="text-slate-600 font-semibold text-[11px] whitespace-nowrap">{item.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="w-full flex-1 relative overflow-hidden rounded-b-2xl mt-2">
                               <img src={card.src} alt="Student" className="w-full h-full object-cover object-bottom" />
                          </div>
                        </motion.div>
                      )
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {activeCard === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: -20, y: 10 }}
                    transition={{ duration: 0.5 }}
                    className="absolute bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-5 z-20"
                    style={{ width: '250px', left: '-100px', bottom: '-20px' }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-[13px] font-bold text-slate-800">AI Assistant</span>
                    </div>
                    <div className="relative bg-[#F8FAFC] rounded-xl p-4 pb-5 border border-slate-100">
                      <div className="text-[13px] text-slate-600 leading-relaxed relative z-10">
                        <p className="font-bold text-slate-800 mb-1.5">Hello Ananya!</p>
                        <p>How can I help you<br/>with your studies today?</p>
                      </div>
                      <div className="absolute -bottom-4 -right-3 w-11 h-11 rounded-full bg-[#0047AB] flex items-center justify-center text-white shadow-[0_4px_10px_rgba(0,71,171,0.3)] cursor-pointer hover:bg-blue-800 transition-colors z-20">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeCard === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20, y: 10 }} 
                    animate={{ opacity: 1, x: 0, y: 0 }} 
                    exit={{ opacity: 0, x: 20, y: 10 }} 
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="absolute bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-5 z-20"
                    style={{ width: '200px', right: '-80px', top: '80px' }}
                  >
                    <h4 className="text-[13px] font-bold text-slate-800 mb-4">Today's Schedule</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><MonitorPlay className="w-4 h-4"/></div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-800">Math Class</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">09:00 AM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><BookOpen className="w-4 h-4"/></div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-800">Science</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">11:00 AM</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeCard === 1 && (
                  <div className="absolute z-20 flex flex-col gap-3" style={{ right: '-90px', top: '60px' }}>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4 }} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-3.5 w-[220px] flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><MonitorPlay className="w-5 h-5"/></div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-800 mb-1.5">Live Classes</p>
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-orange-200 border-2 border-white shadow-sm flex items-center justify-center"><Users className="w-3 h-3 text-orange-600"/></div>
                          <div className="w-6 h-6 rounded-full bg-emerald-200 border-2 border-white shadow-sm flex items-center justify-center"><Users className="w-3 h-3 text-emerald-600"/></div>
                          <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-slate-600">+25</div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-3.5 w-[220px] flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ClipboardList className="w-5 h-5"/></div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-800 mb-0.5">Assignments</p>
                        <p className="text-[18px] font-black text-slate-900 leading-none">12 <span className="text-[10px] text-slate-500 font-bold ml-1">Pending</span></p>
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-3.5 w-[220px] flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><BarChart2 className="w-5 h-5"/></div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-800 mb-0.5">Performance</p>
                        <p className="text-[18px] font-black text-emerald-600 leading-none">92% <span className="text-[10px] text-slate-500 font-bold ml-1">Excellent</span></p>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default LoginPage;
