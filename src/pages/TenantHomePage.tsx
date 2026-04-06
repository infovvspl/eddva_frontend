import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, AlertCircle, GraduationCap, Eye, EyeOff, ArrowLeft,
  Check, KeyRound, Mail, Lock, Sparkles, Trophy, Flame, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantResolver } from "@/hooks/use-tenant-resolver";
import { useAuthStore } from "@/lib/auth-store";
import * as authApi from "@/lib/api/auth";
import loginIllustration from "@/assets/bg.png";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";

type View = "login" | "forgot" | "reset" | "change-password";

/* ── small floating stat card used on the right panel ── */
const FloatCard = ({
  icon, label, value, color, delay = 0,
}: { icon: React.ReactNode; label: string; value: string; color: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: "easeOut" }}
    className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 shadow-lg"
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: color + "33" }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{label}</p>
      <p className="text-[15px] font-bold text-white">{value}</p>
    </div>
  </motion.div>
);

const TenantHomePage = () => {
  const { tenant, isLoading: tenantLoading, error: tenantError, subdomain } = useTenantResolver();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const [view, setView]               = useState<View>("login");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  const [forgotEmail, setForgotEmail]   = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [resetToken, setResetToken]     = useState("");

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changeNewPassword, setChangeNewPassword]         = useState("");
  const [changeConfirmPassword, setChangeConfirmPassword] = useState("");

  /* ── helpers ── */
  const buildUser = (meData: any) => {
    const profile   = meData.user;
    const studentRaw = (meData as any).student as any | undefined;
    return {
      id: profile.id,
      name: profile.fullName || profile.name || "",
      phone: profile.phoneNumber || profile.phone || "",
      email: profile.email,
      role: profile.role as "super_admin" | "institute_admin" | "teacher" | "student",
      avatar: profile.avatar,
      tenantId: profile.tenantId,
      tenantName: profile.tenant?.name || profile.tenantName || "",
      isFirstLogin: profile.isFirstLogin ?? false,
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

  const redirectUser = (user: ReturnType<typeof buildUser>) => {
    setUser(user);
    if (user.role === "student" && user.studentProfile && !user.studentProfile.diagnosticCompleted) {
      navigate("/student/diagnostic");
      return;
    }
    const paths: Record<string, string> = { institute_admin: "/admin", teacher: "/teacher", student: "/student" };
    navigate(paths[user.role] || "/admin");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await authApi.loginWithPassword({ email, password });
      if ((result as any).isFirstLogin) { setView("change-password"); setLoading(false); return; }
      redirectUser(buildUser(await authApi.getMe()));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await authApi.forgotPassword(forgotEmail);
      setForgotSuccess(true);
      if (result.token) setResetToken(result.token);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send reset email.");
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      setView("login"); setForgotSuccess(false); setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reset password.");
    } finally { setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changeNewPassword !== changeConfirmPassword) { setError("Passwords do not match."); return; }
    if (changeNewPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);
    try {
      await authApi.setPassword(changeNewPassword);
      redirectUser(buildUser(await authApi.getMe()));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to set password.");
    } finally { setLoading(false); }
  };

  /* ── tenant loading / error states ── */
  if (tenantLoading) return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${BLUE}15, ${PURPLE}15)` }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
        <p className="text-sm font-semibold text-gray-500">Loading your institution…</p>
      </div>
    </div>
  );

  if (tenantError || !tenant) return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50 p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Institute Not Found</h1>
      <p className="text-sm text-gray-500 text-center max-w-md">
        The institute at <span className="font-semibold">{subdomain}.edva.in</span> does not exist or has been suspended.
      </p>
    </div>
  );

  /* ── shared input style ── */
  const inputBase =
    "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 text-[14px] text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 disabled:opacity-50";


  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row overflow-hidden font-sans">

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-[52%] md:px-12 lg:px-20">

        {/* subtle BG orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full opacity-[0.07]"
            style={{ background: `radial-gradient(circle, ${BLUE}, transparent)` }} />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full opacity-[0.05]"
            style={{ background: `radial-gradient(circle, ${PURPLE}, transparent)` }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-[420px]"
        >
          {/* Logo */}
          <div className="mb-10">
            <img src={edvaLogo} alt="EdVa" className="h-16 w-auto object-contain" />
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 overflow-hidden"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
                <p className="text-[13px] font-medium text-red-700 leading-snug">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── VIEW SWITCHER ── */}
          <AnimatePresence mode="wait">

            {/* LOGIN */}
            {view === "login" && (
              <motion.div key="login" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: "easeOut" as const }} className="space-y-7">
                <div>
                  <h1 className="text-[32px] font-extrabold tracking-tight text-gray-900 mb-1.5">Welcome back</h1>
                  <p className="text-[14px] text-gray-500 font-medium">Sign in to continue your learning journey.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" disabled={loading} className={inputBase} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" /> Password
                      </label>
                      <button type="button" onClick={() => { setView("forgot"); setError(""); }}
                        className="text-[12px] font-bold hover:underline" style={{ color: BLUE }}>
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} required value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Your password"
                        disabled={loading} className={`${inputBase} pr-12`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading || !email || !password}
                    className="h-12 w-full rounded-xl text-[15px] font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})`, boxShadow: `0 8px 24px ${BLUE}40` }}>
                    {loading
                      ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Signing in…</span>
                      : "Sign In"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* FORGOT — enter email */}
            {view === "forgot" && !forgotSuccess && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: "easeOut" as const }} className="space-y-7">
                <div>
                  <button type="button" onClick={() => { setView("login"); setError(""); }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold mb-5 hover:gap-2.5 transition-all"
                    style={{ color: BLUE }}>
                    <ArrowLeft className="h-4 w-4" /> Back to login
                  </button>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 mb-1.5">Reset password</h1>
                  <p className="text-[14px] text-gray-500 font-medium">Enter your email and we'll send reset instructions.</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Email Address</label>
                    <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="you@example.com" disabled={loading} className={inputBase} />
                  </div>
                  <Button type="submit" disabled={loading || !forgotEmail}
                    className="h-12 w-full rounded-xl text-[15px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* FORGOT SUCCESS / reset form */}
            {view === "forgot" && forgotSuccess && (
              <motion.div key="forgot-ok" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: "easeOut" as const }} className="space-y-7">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-2"
                  style={{ background: `linear-gradient(135deg, #22C55E22, #16A34A22)` }}>
                  <Check className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[28px] font-extrabold text-gray-900 mb-1.5">Check your inbox</h2>
                  <p className="text-[14px] text-gray-500 font-medium">We sent password reset instructions to your email.</p>
                </div>
                {resetToken ? (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">New Password</label>
                      <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters" minLength={8} className={inputBase} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Confirm Password</label>
                      <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password" className={inputBase} />
                    </div>
                    <Button type="submit" disabled={loading}
                      className="h-12 w-full rounded-xl font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                    </Button>
                  </form>
                ) : (
                  <button onClick={() => { setView("login"); setError(""); setForgotSuccess(false); }}
                    className="h-12 w-full rounded-xl border-2 border-gray-100 font-bold text-gray-600 hover:bg-gray-50 transition-all">
                    Return to Login
                  </button>
                )}
              </motion.div>
            )}

            {/* FIRST-LOGIN CHANGE PASSWORD */}
            {view === "change-password" && (
              <motion.div key="change" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: "easeOut" as const }} className="space-y-7">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-2"
                  style={{ background: `${BLUE}15` }}>
                  <KeyRound className="h-7 w-7" style={{ color: BLUE }} />
                </div>
                <div>
                  <h2 className="text-[28px] font-extrabold text-gray-900 mb-1.5">Security update</h2>
                  <p className="text-[14px] text-gray-500 font-medium">Please set a new password before you continue.</p>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">New Password</label>
                    <input type="password" required value={changeNewPassword}
                      onChange={e => setChangeNewPassword(e.target.value)}
                      placeholder="Create a strong password" minLength={8} className={inputBase} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">Confirm Password</label>
                    <input type="password" required value={changeConfirmPassword}
                      onChange={e => setChangeConfirmPassword(e.target.value)}
                      placeholder="Verify your new password" className={inputBase} />
                  </div>
                  <Button type="submit" disabled={loading}
                    className="h-12 w-full rounded-xl font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Password & Continue"}
                  </Button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-100">
            <p className="text-[12px] text-gray-400 font-medium">
              Powered by <span className="font-bold text-gray-800">EdVa</span> — Education Plus Advancement
            </p>
          </div>
        </motion.div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div
        className="relative hidden md:flex md:w-[48%] flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(145deg, #0f172a 0%, #1e1b4b 40%, #1e3a5f 100%)` }}
      >
        {/* animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] right-[-10%] h-[55%] w-[55%] rounded-full blur-[120px] opacity-30"
            style={{ background: PURPLE }} />
          <div className="absolute bottom-[10%] left-[-10%] h-[40%] w-[40%] rounded-full blur-[100px] opacity-25"
            style={{ background: BLUE }} />
          {/* dot grid */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
        </div>

        {/* Tenant badge — top right */}
        <div className="absolute top-8 right-8 flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5">
          <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/15 overflow-hidden">
            {tenant.logoUrl
              ? <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
              : <GraduationCap className="h-5 w-5 text-white" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Institution</p>
            <p className="text-[13px] font-bold text-white leading-tight">{tenant.name}</p>
          </div>
        </div>

        {/* floating stat cards */}
        <div className="absolute top-[18%] left-8 flex flex-col gap-3">
          <FloatCard icon={<Flame className="h-4 w-4" />} label="Active Streak" value="12 Days" color="#F59E0B" delay={0.3} />
          <FloatCard icon={<Trophy className="h-4 w-4" />} label="Top Rank"     value="#3 in Batch" color="#A78BFA" delay={0.45} />
        </div>
        <div className="absolute bottom-[22%] right-8">
          <FloatCard icon={<Zap className="h-4 w-4" />} label="XP Earned" value="4,820 pts" color="#60A5FA" delay={0.6} />
        </div>

        {/* center illustration */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md px-8 text-center"
        >
          {/* glow under image */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 h-12 w-2/3 rounded-full blur-3xl opacity-30"
            style={{ background: BLUE }} />

          <img src={loginIllustration} alt="Learn"
            className="w-full h-auto max-h-[380px] object-contain drop-shadow-2xl relative z-10 mb-10" />

          {/* badge pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[12px] font-bold text-white/80 uppercase tracking-widest">Smart Learning Platform</span>
          </div>

          <h3 className="text-[30px] font-extrabold text-white tracking-tight leading-snug mb-4">
            {tenant.welcomeMessage || "Learn Smarter,\nAchieve More"}
          </h3>
          <p className="text-[15px] text-white/55 font-medium leading-relaxed max-w-sm mx-auto">
            Access your courses, practice tests, and progress analytics — all in one premium platform.
          </p>

          {/* bottom mini-stats row */}
          <div className="mt-10 flex items-center justify-center gap-6">
            {[
              { val: "50K+", lbl: "Students" },
              { val: "500+", lbl: "Topics" },
              { val: "98%",  lbl: "Pass Rate" },
            ].map(({ val, lbl }) => (
              <div key={lbl} className="text-center">
                <p className="text-[20px] font-extrabold text-white">{val}</p>
                <p className="text-[11px] font-semibold text-white/45 uppercase tracking-wider">{lbl}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default TenantHomePage;
