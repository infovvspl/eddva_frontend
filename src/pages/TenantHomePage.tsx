import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, AlertCircle, GraduationCap, BookOpen, Eye, EyeOff, ArrowLeft, Check, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useTenantResolver } from "@/hooks/use-tenant-resolver";
import { useAuthStore } from "@/lib/auth-store";
import * as authApi from "@/lib/api/auth";

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

  const brandColor = tenant.brandColor || "hsl(var(--primary))";

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4 font-sans text-foreground">
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, ${brandColor}12, transparent 50%)` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--accent)/0.06),_transparent_50%)]" />

      <div className="absolute right-4 top-4 z-20 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <motion.div className="relative z-10 w-full max-w-[440px]" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
        {/* Institute Branding */}
        <div className="mb-8 text-center">
          <motion.div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg overflow-hidden"
            style={{ backgroundColor: tenant.logoUrl ? "transparent" : brandColor, boxShadow: `0 10px 25px ${brandColor}40` }}
            initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          >
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
            ) : (
              <GraduationCap className="h-10 w-10 text-white" />
            )}
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{tenant.name}</h1>
          {tenant.welcomeMessage && <p className="mt-1.5 text-sm text-muted-foreground">{tenant.welcomeMessage}</p>}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-7 shadow-2xl shadow-black/5 dark:shadow-black/20">

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
              <span className="text-xs font-medium text-destructive">{error}</span>
            </motion.div>
          )}

          {/* ── LOGIN VIEW ── */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-3.5 py-2.5">
                <BookOpen className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-xs font-medium text-primary">Sign in with your email and password</span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" disabled={loading}
                  className="h-11 w-full rounded-lg border border-border bg-secondary px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15 disabled:opacity-50" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" disabled={loading}
                    className="h-11 w-full rounded-lg border border-border bg-secondary px-4 pr-11 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15 disabled:opacity-50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => { setView("forgot"); setError(""); }} className="text-xs font-semibold text-primary hover:text-primary/80">
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="h-11 w-full font-semibold" disabled={loading || !email || !password}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          )}

          {/* ── FORGOT PASSWORD VIEW ── */}
          {view === "forgot" && !forgotSuccess && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <button type="button" onClick={() => { setView("login"); setError(""); }} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </button>
              <div>
                <h3 className="text-lg font-bold text-foreground">Reset Password</h3>
                <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a password reset link.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="your@email.com" disabled={loading}
                  className="h-11 w-full rounded-lg border border-border bg-secondary px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15 disabled:opacity-50" />
              </div>
              <Button type="submit" className="h-11 w-full font-semibold" disabled={loading || !forgotEmail}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>
          )}

          {/* ── FORGOT SUCCESS — show reset form (dev mode) ── */}
          {view === "forgot" && forgotSuccess && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-600">
                <Check className="h-5 w-5" />
                <span className="font-medium text-sm">Reset link sent!</span>
              </div>
              {resetToken ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-muted-foreground">Dev mode: enter your new password below.</p>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" minLength={8}
                      className="h-11 w-full rounded-lg border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                      className="h-11 w-full rounded-lg border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                  </div>
                  <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">Check your email for the reset link.</p>
              )}
              {resetSuccess && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-600">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Password reset! You can now log in.</span>
                </motion.div>
              )}
              <button onClick={() => { setView("login"); setError(""); setForgotSuccess(false); setResetToken(""); setResetSuccess(false); }}
                className="text-xs font-semibold text-primary hover:text-primary/80">Back to login</button>
            </div>
          )}

          {/* ── FIRST LOGIN PASSWORD CHANGE ── */}
          {view === "change-password" && (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Set New Password</h3>
                  <p className="text-xs text-muted-foreground">You must change your temporary password before continuing.</p>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
                <input type="password" required value={changeNewPassword} onChange={(e) => setChangeNewPassword(e.target.value)} placeholder="Min 8 characters" minLength={8}
                  className="h-11 w-full rounded-lg border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                <input type="password" required value={changeConfirmPassword} onChange={(e) => setChangeConfirmPassword(e.target.value)} placeholder="Repeat password"
                  className="h-11 w-full rounded-lg border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              </div>
              <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Set Password & Continue"}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 border-t border-border pt-5 text-center">
            <span className="text-[11px] text-muted-foreground/70">
              Powered by <span className="font-semibold text-muted-foreground">EdVa</span> — Education Plus Advancement
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TenantHomePage;
