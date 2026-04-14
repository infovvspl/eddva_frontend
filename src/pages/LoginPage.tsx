import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff,
  Mail, CheckCircle2, BookOpen, Trophy, GraduationCap,
  Sparkles, ArrowLeft, KeyRound, Check,
} from "lucide-react";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth-store";
import edvaLogo from "@/assets/EDVA LOGO 04.png";
import loginIllustration from "@/assets/bg.png";

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
  const { setUser } = useAuthStore();

  const [view, setView] = useState<View>("login");

  /* login state */
  const [identifier,    setIdentifier]    = useState("");   // email or phone
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [loginLoading,  setLoginLoading]  = useState(false);

  /* forgot state */
  const [forgotEmail,   setForgotEmail]   = useState("");
  const [resetToken,    setResetToken]    = useState("");
  const [newPassword,   setNewPassword]   = useState("");
  const [confirmPw,     setConfirmPw]     = useState("");
  const [showNew,       setShowNew]       = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [error, setError] = useState("");

  /* set-password state (first login) */
  const [pendingUser,    setPendingUser]    = useState<ReturnType<typeof buildUser> | null>(null);
  const [setPwNew,       setSetPwNew]       = useState("");
  const [setPwConfirm,   setSetPwConfirm]   = useState("");
  const [showSetNew,     setShowSetNew]     = useState(false);
  const [showSetConfirm, setShowSetConfirm] = useState(false);
  const [setPwLoading,   setSetPwLoading]   = useState(false);

  const inputClass =
    "h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[15px] font-semibold text-slate-800 outline-none transition-all placeholder:text-gray-600 focus:bg-white focus:border-blue-400 focus:ring-8 focus:ring-blue-500/5 disabled:opacity-50 shadow-sm";

  /* ── helpers ── */
  const buildUser = (meData: any) => {
    const profile    = meData.user;
    const studentRaw = (meData as any).student as any | undefined;
    return {
      id:             profile.id,
      name:           profile.fullName || profile.name || "",
      phone:          profile.phoneNumber || profile.phone || "",
      email:          profile.email,
      role:           profile.role as "super_admin" | "institute_admin" | "teacher" | "student",
      avatar:         profile.avatar,
      tenantId:       profile.tenantId,
      tenantName:     profile.tenant?.name || profile.tenantName || "",
      isFirstLogin:   profile.isFirstLogin ?? false,
      teacherProfile: meData.teacherProfile ?? null,
      studentProfile: studentRaw ? {
        id:                    studentRaw.id ?? "",
        batchId:               studentRaw.batchId,
        examTarget:            studentRaw.examTarget ?? "",
        currentClass:          studentRaw.currentClass ?? "",
        examYear:              studentRaw.examYear,
        diagnosticCompleted:   studentRaw.diagnosticCompleted ?? false,
        streakDays:            studentRaw.streakDays ?? 0,
        xpPoints:              studentRaw.xpPoints ?? 0,
        currentEloTier:        studentRaw.currentEloTier,
      } : null,
    };
  };

  const redirectUser = (user: ReturnType<typeof buildUser>) => {
    setUser(user);
    const paths: Record<string, string> = {
      super_admin:     "/super-admin",
      institute_admin: "/admin",
      teacher:         "/teacher",
      student:         "/student",
    };
    navigate(paths[user.role] || "/student");
  };

  /* ── Login handler ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setError(""); setLoginLoading(true);
    try {
      const isEmail = identifier.includes("@");
      await authApi.loginWithPassword(
        isEmail
          ? { email: identifier.trim(), password }
          : { phoneNumber: identifier.trim().startsWith("+") ? identifier.trim() : `+91${identifier.trim()}`, password }
      );
      const user = buildUser(await authApi.getMe());
      if (user.isFirstLogin) {
        setPendingUser(user);
        setView("set-password");
      } else {
        redirectUser(user);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally { setLoginLoading(false); }
  };

  /* ── Set new password handler (first login) ── */
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setPwNew !== setPwConfirm) { setError("Passwords do not match."); return; }
    if (setPwNew.length < 8)       { setError("Password must be at least 8 characters."); return; }
    setError(""); setSetPwLoading(true);
    try {
      await authApi.setPassword(setPwNew);
      if (pendingUser) {
        const user = { ...pendingUser, isFirstLogin: false };
        setUser(user);
        // Institute admins must complete teacher profile setup before dashboard
        if (user.role === "institute_admin") {
          navigate("/admin/onboard");
        } else {
          redirectUser(user);
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
    if (newPassword.length < 8)    { setError("Password must be at least 8 characters."); return; }
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
    <div className="relative flex min-h-screen w-full flex-col md:flex-row overflow-hidden font-sans">

      {/* ══════════ LEFT: Form Panel ══════════ */}
      <div className="relative flex w-full flex-col items-center justify-center bg-slate-50 px-8 py-16 md:w-[50%] md:px-16 lg:px-24">

        {/* bg orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full opacity-[0.03] blur-[100px]" style={{ background: B }} />
          <div className="absolute -bottom-16 -right-16 h-[500px] w-[500px] rounded-full opacity-[0.03] blur-[100px]" style={{ background: P }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="relative w-full max-w-[420px]"
        >
          {/* Logo */}
          <div className="mb-10">
            <img src={edvaLogo} alt="EDDVA" className=" object-contain" />
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
                <p className="text-[13px] font-medium text-red-700 leading-snug">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ══ VIEW: LOGIN ══ */}
            {view === "login" && (
              <motion.div key="login"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.32 }}
                className="space-y-6">

                <div>
                  <h1 className="text-[36px] font-black tracking-tight text-slate-900 leading-tight mb-2">Welcome back</h1>
                  <p className="text-[16px] font-semibold text-slate-400">Continue your journey of excellence.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">

                  {/* Email / Phone */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">
                      <Mail className="h-3.5 w-3.5" /> Email or Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      disabled={loginLoading}
                      className={inputClass}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" /> Password
                      </label>
                      <button type="button"
                        onClick={() => { setView("forgot"); setError(""); setForgotEmail(identifier.includes("@") ? identifier : ""); }}
                        className="text-[11px] font-black text-blue-600 uppercase tracking-wider hover:underline transition-colors">
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loginLoading}
                        className={`${inputClass} pr-14`}
                      />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-600 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={!identifier.trim() || !password || loginLoading}
                    className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[16px] font-black text-white shadow-2xl shadow-blue-500/20 transition-all disabled:opacity-50 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_2s_infinite]" />
                    {loginLoading
                      ? <><Loader2 className="h-5 w-5 animate-spin" />Signing in…</>
                      : <>Sign In <ArrowRight className="h-5 w-5" /></>}
                  </motion.button>
                </form>

                <p className="text-center text-[15px] font-semibold text-slate-400">
                  New student?{" "}
                  <Link to="/register" className="text-blue-600 font-black hover:underline underline-offset-4">
                    Create an account
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ══ VIEW: FORGOT — enter email ══ */}
            {view === "forgot" && (
              <motion.div key="forgot"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.32 }}
                className="space-y-6">

                <div>
                  <button type="button" onClick={goBack}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold mb-5 hover:gap-2.5 transition-all"
                    style={{ color: B }}>
                    <ArrowLeft className="h-4 w-4" /> Back to login
                  </button>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${B}15` }}>
                    <KeyRound className="h-6 w-6" style={{ color: B }} />
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 mb-1.5">Forgot password?</h1>
                  <p className="text-[14px] font-medium text-gray-500">
                    Enter your email and we'll send you reset instructions.
                  </p>
                </div>

                <form onSubmit={handleForgot} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Email Address
                    </label>
                    <input type="email" required value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="you@example.com" disabled={forgotLoading}
                      className={inputClass} />
                  </div>

                  <motion.button type="submit"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    disabled={!forgotEmail || forgotLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
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
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${G}15` }}>
                    <KeyRound className="h-6 w-6" style={{ color: G }} />
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 mb-1.5">Set your password</h1>
                  <p className="text-[14px] font-medium text-slate-500">
                    You're logging in for the first time. Please choose a permanent password.
                  </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">
                      <Lock className="h-3.5 w-3.5" /> New Password
                    </label>
                    <div className="relative">
                      <input type={showSetNew ? "text" : "password"} required
                        value={setPwNew} onChange={e => setSetPwNew(e.target.value)}
                        placeholder="Min 8 characters" minLength={8} disabled={setPwLoading}
                        className={`${inputClass} pr-14`} />
                      <button type="button" onClick={() => setShowSetNew(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-600 hover:text-slate-600 transition-colors">
                        {showSetNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">
                      <Lock className="h-3.5 w-3.5" /> Confirm Password
                    </label>
                    <div className="relative">
                      <input type={showSetConfirm ? "text" : "password"} required
                        value={setPwConfirm} onChange={e => setSetPwConfirm(e.target.value)}
                        placeholder="Repeat new password" disabled={setPwLoading}
                        className={`${inputClass} pr-14`} />
                      <button type="button" onClick={() => setShowSetConfirm(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-600 hover:text-slate-600 transition-colors">
                        {showSetConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {setPwConfirm.length > 0 && (
                      <p className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${setPwNew === setPwConfirm ? "text-emerald-600" : "text-red-500"}`}>
                        {setPwNew === setPwConfirm
                          ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                          : "Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <motion.button type="submit"
                    whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }}
                    disabled={!setPwNew || !setPwConfirm || setPwLoading}
                    className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[16px] font-black text-white shadow-2xl shadow-emerald-500/20 transition-all disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${G}, #059669)` }}>
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

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-2"
                  style={{ background: "#22C55E18" }}>
                  <Check className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[26px] font-extrabold text-gray-900 mb-1.5">Check your inbox</h2>
                  <p className="text-[14px] font-medium text-gray-500">
                    We sent password reset instructions to{" "}
                    <span className="font-bold text-gray-800">{forgotEmail}</span>
                  </p>
                </div>

                {/* If backend returns token directly, show inline reset form */}
                {resetToken ? (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" /> New Password
                      </label>
                      <div className="relative">
                        <input type={showNew ? "text" : "password"} required
                          value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters" minLength={8} disabled={forgotLoading}
                          className={`${inputClass} pr-12`} />
                        <button type="button" onClick={() => setShowNew(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" /> Confirm Password
                      </label>
                      <div className="relative">
                        <input type={showConfirm ? "text" : "password"} required
                          value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                          placeholder="Repeat new password" disabled={forgotLoading}
                          className={`${inputClass} pr-12`} />
                        <button type="button" onClick={() => setShowConfirm(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPw.length > 0 && (
                        <p className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${newPassword === confirmPw ? "text-green-600" : "text-red-500"}`}>
                          {newPassword === confirmPw
                            ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                            : "Passwords do not match"}
                        </p>
                      )}
                    </div>

                    <motion.button type="submit"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      disabled={forgotLoading}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                      {forgotLoading
                        ? <><Loader2 className="h-4 w-4 animate-spin" />Resetting…</>
                        : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
                    </motion.button>
                  </form>
                ) : (
                  <button onClick={goBack}
                    className="h-12 w-full rounded-xl border-2 border-gray-100 font-bold text-gray-600 hover:bg-gray-50 transition-all">
                    Return to Login
                  </button>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer */}
          <div className="mt-16 flex items-center justify-center gap-2 border-t border-slate-200/60 pt-8">
            <Lock className="h-4 w-4 text-gray-600" />
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Secured by EDDVA Architecture</p>
          </div>
        </motion.div>
      </div>

      {/* ══════════ RIGHT: Decorative Panel ══════════ */}
      <div className="relative hidden md:flex md:w-[50%] flex-col items-center justify-center overflow-hidden bg-white border-l border-slate-100">

        {/* animated aura orbs */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 h-[800px] w-[800px] rounded-full opacity-[0.08] blur-[120px]" style={{ background: B }} />
          <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-20%] -left-32 h-[700px] w-[700px] rounded-full opacity-[0.06] blur-[100px]" style={{ background: P }} />
          
          {/* dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.4]"
            style={{ 
              backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`, 
              backgroundSize: "32px 32px" 
            }} 
          />
        </div>

        {/* Floating stat cards */}
        <div className="absolute top-[10%] left-12 flex flex-col gap-6 z-20">
          <StatCard icon={<BookOpen className="h-5 w-5" />}      label="Total Topics" value="500+"      color={B} delay={0.3}  />
          <StatCard icon={<Trophy className="h-5 w-5" />}        label="Success Rate"  value="98.4%"     color={P} delay={0.45} />
        </div>
        <div className="absolute bottom-[12%] right-12 z-20">
          <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Active Students" value="50,000+" color={G} delay={0.6}  />
        </div>

        {/* Center Focal Point */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full flex flex-col items-center px-12 text-center">

          {/* image background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[140px] opacity-[0.1]"
            style={{ background: `radial-gradient(circle, ${B}, ${P})` }} />

          {/* Large Focused Illustration */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative mb-12"
          >
            <div className="absolute -inset-x-12 -bottom-6 h-12 bg-white/5 blur-3xl rounded-full scale-x-50 opacity-50" />
            <img src={loginIllustration} alt="Learn"
              className="w-full h-auto max-h-[440px] object-contain drop-shadow-[0_32px_64px_rgba(0,0,0,0.12)] relative z-10" />
          </motion.div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-5 py-2 backdrop-blur-sm shadow-sm ring-4 ring-blue-500/5">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600">Aero Platform v2</span>
          </div>

          <h2 className="mb-4 text-[42px] font-black leading-[1.1] tracking-tight text-slate-900 px-4">
            Learn Smarter,<br />Achieve <span className="text-blue-600">Anything.</span>
          </h2>
          <p className="max-w-[340px] text-[17px] font-semibold leading-relaxed text-slate-400">
            Powered by AI. Tailored for your success. Join the future of education today.
          </p>
        </motion.div>
      </div>

    </div>
  );
};

export default LoginPage;
