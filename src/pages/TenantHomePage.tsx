  import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, GraduationCap, Eye, EyeOff, ArrowLeft, Check, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenantResolver } from "@/hooks/use-tenant-resolver";
import { useAuthStore } from "@/lib/auth-store";
import * as authApi from "@/lib/api/auth";
import loginIllustration from "@/assets/bg.png";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

type View = "login" | "forgot" | "reset" | "change-password";

const TenantHomePage = () => {
  const { tenant, isLoading: tenantLoading, error: tenantError, subdomain } = useTenantResolver();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [resetToken, setResetToken] = useState("");

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // First-login password change state
  const [changeNewPassword, setChangeNewPassword] = useState("");
  const [changeConfirmPassword, setChangeConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authApi.loginWithPassword({ email, password });

      // If first login, force password change
      if (result.isFirstLogin) {
        setView("change-password");
        setLoading(false);
        return;
      }

      // Fetch profile and redirect
      const meData = await authApi.getMe();
      const profile = meData.user;
      const studentRaw = (meData as any).student as {
        id?: string; batchId?: string; examTarget?: string; currentClass?: string;
        examYear?: number; diagnosticCompleted?: boolean; streakDays?: number;
        xpPoints?: number; currentEloTier?: string;
      } | undefined;
      const user = {
        id: profile.id,
        name: (profile as any).fullName || profile.name || "",
        phone: (profile as any).phoneNumber || (profile as any).phone || "",
        email: profile.email,
        role: profile.role as "super_admin" | "institute_admin" | "teacher" | "student",
        avatar: profile.avatar,
        tenantId: profile.tenantId,
        tenantName: profile.tenant?.name || (profile as any).tenantName || "",
        isFirstLogin: (profile as any).isFirstLogin ?? false,
        teacherProfile: (meData as any).teacherProfile ?? null,
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
      setUser(user);
      if (user.role === "student" && user.studentProfile && !user.studentProfile.diagnosticCompleted) {
        navigate("/student/diagnostic");
        return;
      }
      const paths: Record<string, string> = { institute_admin: "/admin", teacher: "/teacher", student: "/student" };
      navigate(paths[user.role] || "/admin");
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(forgotEmail);
      setForgotSuccess(true);
      // In dev mode, backend returns token directly
      if (result.token) setResetToken(result.token);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "Failed to send reset email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      setResetSuccess(true);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "Failed to reset password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changeNewPassword !== changeConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (changeNewPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.setPassword(changeNewPassword);
      // Now fetch profile and redirect
      const meData = await authApi.getMe();
      const profile = meData.user;
      const studentRaw = (meData as any).student as {
        id?: string; batchId?: string; examTarget?: string; currentClass?: string;
        examYear?: number; diagnosticCompleted?: boolean; streakDays?: number;
        xpPoints?: number; currentEloTier?: string;
      } | undefined;
      const user = {
        id: profile.id,
        name: (profile as any).fullName || profile.name || "",
        phone: (profile as any).phoneNumber || (profile as any).phone || "",
        email: profile.email,
        role: profile.role as "super_admin" | "institute_admin" | "teacher" | "student",
        avatar: profile.avatar,
        tenantId: profile.tenantId,
        tenantName: profile.tenant?.name || (profile as any).tenantName || "",
        isFirstLogin: (profile as any).isFirstLogin ?? false,
        teacherProfile: (meData as any).teacherProfile ?? null,
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
      setUser(user);
      if (user.role === "student" && user.studentProfile && !user.studentProfile.diagnosticCompleted) {
        navigate("/student/diagnostic");
        return;
      }
      const paths: Record<string, string> = { institute_admin: "/admin", teacher: "/teacher", student: "/student" };
      navigate(paths[user.role] || "/admin");
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "Failed to set password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Loading state while resolving tenant
  if (tenantLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Tenant not found
  if (tenantError || !tenant) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Institute Not Found</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          The institute at <span className="font-semibold">{subdomain}.edva.in</span> does not exist or has been suspended.
        </p>
      </div>
    );
  }

  const inputClass = "h-14 w-full rounded-[12px] border border-gray-200 bg-white px-4 text-[15px] text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#013889] focus:ring-4 focus:ring-[#013889]/10 disabled:opacity-50 shadow-sm";

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row overflow-hidden font-sans bg-white">
      {/* ── LEFT: Form Panel ── */}
      <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-1/2 md:px-12 lg:px-20">
        {/* Background Decorative Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-blue-50 blur-3xl opacity-60" />
          <div className="absolute bottom-[5%] right-[-5%] h-[30%] w-[30%] rounded-full bg-orange-50 blur-3xl opacity-40" />
          <div className="absolute left-[10%] top-[20%] h-3 w-3 rounded-full bg-[#013889]/20" />
          <div className="absolute right-[15%] bottom-[25%] h-5 w-5 rounded-full bg-blue-100" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-[440px]"
        >
          {/* Logo */}
          <div className="mb-14 flex flex-col items-start">
            <img src={edvaLogo} alt="EdVa" className="h-24 w-auto object-contain mb-10" />
            
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-red-800">Authentication Error</span>
                  <span className="text-xs text-red-600 mt-0.5 leading-relaxed">{error}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── LOGIN VIEW ── */}
          {view === "login" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Login</h1>
                <p className="text-[15px] text-gray-500 leading-relaxed font-medium">
                  Welcome back! Please enter your details to access your account.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setView("forgot"); setError(""); }}
                      className="text-[13px] font-bold text-[#013889] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={loading}
                      className={`${inputClass} pr-14`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-[#013889] transition-colors focus:bg-gray-100"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="h-14 w-full rounded-[12px] bg-[#013889] text-[16px] font-bold text-white shadow-xl shadow-[#013889]/20 hover:bg-[#012a6b] hover:shadow-2xl hover:shadow-[#013889]/30 transition-all duration-300 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : "Login to Account"}
                </Button>
              </form>
            </div>
          )}

          {/* ── FORGOT PASSWORD VIEW ── */}
          {view === "forgot" && !forgotSuccess && (
            <div className="space-y-8">
              <div>
                <button
                  type="button"
                  onClick={() => { setView("login"); setError(""); }}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#013889] hover:gap-3 transition-all mb-6"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </button>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Reset Password</h1>
                <p className="text-[15px] text-gray-500 leading-relaxed font-medium">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                    className={inputClass}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !forgotEmail}
                  className="h-14 w-full rounded-[12px] bg-[#013889] text-[16px] font-bold text-white shadow-xl shadow-[#013889]/20 hover:bg-[#012a6b] transition-all duration-300"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
            </div>
          )}

          {/* ── FORGOT SUCCESS ── */}
          {view === "forgot" && forgotSuccess && (
            <div className="space-y-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mb-6">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Email Sent!</h2>
                <p className="text-[15px] text-gray-500 leading-relaxed font-medium">
                  Check your inbox for instructions to reset your password.
                </p>
              </div>
              
              {resetToken ? (
                <form onSubmit={handleResetPassword} className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider ml-1">New Password</label>
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters" minLength={8} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider ml-1">Confirm Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password" className={inputClass} />
                  </div>
                  <Button type="submit" disabled={loading}
                    className="h-14 w-full rounded-[12px] bg-[#013889] font-bold text-white shadow-xl hover:bg-[#012a6b] transition-all duration-300">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
                  </Button>
                </form>
              ) : (
                <button
                  onClick={() => { setView("login"); setError(""); setForgotSuccess(false); }}
                  className="h-14 w-full rounded-[12px] border-2 border-gray-100 font-bold text-gray-600 hover:bg-gray-50 transition-all duration-300"
                >
                  Return to Login
                </button>
              )}
            </div>
          )}

          {/* ── FIRST LOGIN PASSWORD CHANGE ── */}
          {view === "change-password" && (
            <div className="space-y-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#013889]/10 mb-6">
                <KeyRound className="h-8 w-8 text-[#013889]" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Security Update</h2>
                <p className="text-[15px] text-gray-500 leading-relaxed font-medium">
                  For your security, please update your temporary password before continuing.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider ml-1">New Password</label>
                  <input type="password" required value={changeNewPassword} onChange={(e) => setChangeNewPassword(e.target.value)}
                    placeholder="Create a strong password" minLength={8} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider ml-1">Confirm New Password</label>
                  <input type="password" required value={changeConfirmPassword} onChange={(e) => setChangeConfirmPassword(e.target.value)}
                    placeholder="Verify your new password" className={inputClass} />
                </div>
                <Button type="submit" disabled={loading}
                  className="h-14 w-full rounded-[12px] bg-[#013889] font-bold text-white shadow-xl hover:bg-[#012a6b] transition-all duration-300">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Set Password & Continue"}
                </Button>
              </form>
            </div>
          )}

          {/* Footer Branding */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <p className="text-[13px] text-gray-400 font-medium">
              Powered by <span className="font-bold text-gray-900">EdVa</span> — Education Plus Advancement
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT: Illustration Panel ── */}
      <div className="relative hidden w-1/2 md:flex flex-col items-center justify-center bg-[#f8fafc] overflow-hidden px-12">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 h-[60%] w-[60%] bg-blue-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 h-[40%] w-[40%] bg-blue-50/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
          
          {/* Subtle Decorative Dots */}
          <div className="absolute left-[15%] top-[25%] h-5 w-5 bg-blue-100 rounded-full opacity-40" />
          <div className="absolute right-[20%] top-[40%] h-3 w-3 bg-blue-200 rounded-full opacity-30" />
          <div className="absolute left-[30%] bottom-[20%] h-4 w-4 bg-orange-100 rounded-full opacity-40" />
          <div className="absolute right-[10%] bottom-[15%] h-8 w-8 bg-blue-50 rounded-full border border-blue-100/50" />
        </div>

        {/* Top Branding Tag */}
        <div className="absolute top-10 right-10 flex items-center gap-4 py-2.5 px-5">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[3px] text-gray-400 font-bold">eLearning</p>
            <p className="text-sm font-bold text-gray-800">{tenant.name}</p>
          </div>
          <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-white border border-blue-100 overflow-hidden shadow-sm">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
            ) : (
              <GraduationCap className="h-6 w-6 text-[#013889]" />
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-xl text-center"
        >
          <div className="relative mb-16 flex justify-center group">
            {/* Soft Shadow Base */}
            <div className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-[80%] h-8 bg-blue-900/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <img
              src={loginIllustration}
              alt="Login Illustration"
              className="w-full h-auto max-h-[520px] object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.15)] transition-transform duration-700 hover:scale-[1.02] relative z-10"
            />
          </div>
          
          <div className="space-y-5 px-6">
            <h3 className="text-[32px] font-extrabold text-[#111827] tracking-tight leading-tight">
              {tenant.welcomeMessage || "Learn Smarter, Achieve More"}
            </h3>
            <p className="text-[17px] text-gray-500 font-medium leading-relaxed">
              Connect with our state-of-the-art platform to access all your courses, 
              resources, and academic metrics in one place.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TenantHomePage;
