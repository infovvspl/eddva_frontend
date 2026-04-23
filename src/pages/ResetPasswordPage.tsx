import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ArrowRight, Loader2, AlertCircle,
  Eye, EyeOff, CheckCircle2, KeyRound,
  BookOpen, Trophy, GraduationCap, Sparkles, XCircle,
} from "lucide-react";
import * as authApi from "@/lib/api/auth";
import { EddvaLogo } from "@/components/branding/EddvaLogo";
import loginIllustration from "@/assets/bg.png";

const B = "#3B82F6";
const P = "#A855F7";
const G = "#10B981";

type PageState = "form" | "success" | "invalid";

const StatCard = ({
  icon, label, value, color, delay = 0,
}: { icon: React.ReactNode; label: string; value: string; color: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: "easeOut" }}
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

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [pageState, setPageState]   = useState<PageState>(token ? "form" : "invalid");
  const [newPassword,  setNewPassword]  = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  // Redirect after success
  useEffect(() => {
    if (pageState !== "success") return;
    const t = setTimeout(() => navigate("/login", { replace: true }), 4000);
    return () => clearTimeout(t);
  }, [pageState, navigate]);

  const passwordsMatch = confirmPw.length > 0 && newPassword === confirmPw;
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 8;

  const inputClass =
    "h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[15px] font-semibold text-slate-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-blue-400 focus:ring-8 focus:ring-blue-500/5 disabled:opacity-50 shadow-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPw) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8)    { setError("Password must be at least 8 characters."); return; }

    setError(""); setLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setPageState("success");
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? "";
      // Treat invalid/expired token as a hard error state
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setPageState("invalid");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row overflow-hidden font-sans">

      {/* ══ LEFT: Form Panel ══ */}
      <div className="relative flex w-full flex-col items-center justify-center bg-slate-50 px-8 py-16 md:w-[50%] md:px-16 lg:px-24">

        {/* bg orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full opacity-[0.03] blur-[100px]" style={{ background: B }} />
          <div className="absolute -bottom-16 -right-16 h-[500px] w-[500px] rounded-full opacity-[0.03] blur-[100px]" style={{ background: P }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-[420px]"
        >
          {/* Logo */}
          <div className="mb-10">
            <EddvaLogo className="h-12 w-auto sm:h-14" />
          </div>

          <AnimatePresence mode="wait">

            {/* ══ STATE: FORM ══ */}
            {pageState === "form" && (
              <motion.div key="form"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.32 }}
                className="space-y-6"
              >
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${B}15` }}>
                    <KeyRound className="h-6 w-6" style={{ color: B }} />
                  </div>
                  <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 mb-1.5">Set a new password</h1>
                  <p className="text-[14px] font-medium text-gray-500">
                    Choose a strong password with at least 8 characters.
                  </p>
                </div>

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div key="err"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-4 py-3"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
                      <p className="text-[13px] font-medium text-red-700 leading-snug">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New password */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">
                      <Lock className="h-3.5 w-3.5" /> New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setError(""); }}
                        placeholder="Min 8 characters"
                        minLength={8}
                        disabled={loading}
                        className={`${inputClass} pr-14`}
                      />
                      <button type="button" onClick={() => setShowNew(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-slate-600 transition-colors">
                        {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordTooShort && (
                      <p className="text-[11px] font-bold text-red-500 ml-1">
                        Password must be at least 8 characters
                      </p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">
                      <Lock className="h-3.5 w-3.5" /> Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPw}
                        onChange={e => { setConfirmPw(e.target.value); setError(""); }}
                        placeholder="Repeat new password"
                        disabled={loading}
                        className={`${inputClass} pr-14`}
                      />
                      <button type="button" onClick={() => setShowConfirm(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-slate-600 transition-colors">
                        {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPw.length > 0 && (
                      <p className={`text-[11px] font-bold flex items-center gap-1 ml-1 ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                        {passwordsMatch
                          ? <><CheckCircle2 className="h-3 w-3" /> Passwords match</>
                          : "Passwords do not match"}
                      </p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={!newPassword || !confirmPw || loading || passwordTooShort}
                    className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[16px] font-black text-white shadow-2xl shadow-blue-500/20 transition-all disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}
                  >
                    {loading
                      ? <><Loader2 className="h-5 w-5 animate-spin" />Resetting…</>
                      : <>Reset Password <ArrowRight className="h-5 w-5" /></>}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ══ STATE: SUCCESS ══ */}
            {pageState === "success" && (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6 text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `${G}18` }}>
                    <CheckCircle2 className="h-8 w-8" style={{ color: G }} />
                  </div>
                  <div>
                    <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 mb-2">Password reset!</h1>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed">
                      Your password has been updated successfully.<br />
                      Redirecting you to login in a moment…
                    </p>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${G}, #059669)` }}
                >
                  Go to Login <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )}

            {/* ══ STATE: INVALID TOKEN ══ */}
            {pageState === "invalid" && (
              <motion.div key="invalid"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6 text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <div>
                    <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900 mb-2">Link expired</h1>
                    <p className="text-[14px] font-medium text-gray-500 leading-relaxed">
                      This password reset link is invalid or has expired.<br />
                      Reset links are only valid for <strong>15 minutes</strong>.
                    </p>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}
                >
                  Request a new link <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer */}
          <div className="mt-16 flex items-center justify-center gap-2 border-t border-slate-200/60 pt-8">
            <Lock className="h-4 w-4 text-gray-400" />
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Secured by EDVA Architecture</p>
          </div>
        </motion.div>
      </div>

      {/* ══ RIGHT: Decorative Panel ══ */}
      <div className="relative hidden md:flex md:w-[50%] flex-col items-center justify-center overflow-hidden bg-white border-l border-slate-100">

        <div className="pointer-events-none absolute inset-0">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 h-[800px] w-[800px] rounded-full opacity-[0.08] blur-[120px]" style={{ background: B }} />
          <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-20%] -left-32 h-[700px] w-[700px] rounded-full opacity-[0.06] blur-[100px]" style={{ background: P }} />
          <div className="absolute inset-0 opacity-[0.4]"
            style={{ backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
        </div>
{/* 
        <div className="absolute top-[10%] left-12 flex flex-col gap-6 z-20">
          <StatCard icon={<BookOpen className="h-5 w-5" />}      label="Total Topics"    value="500+"      color={B} delay={0.3}  />
          <StatCard icon={<Trophy className="h-5 w-5" />}        label="Success Rate"    value="98.4%"     color={P} delay={0.45} />
        </div>
        <div className="absolute bottom-[12%] right-12 z-20">
          <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Active Students" value="50,000+"   color={G} delay={0.6}  />
        </div> */}

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full flex flex-col items-center px-12 text-center">

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[140px] opacity-[0.1]"
            style={{ background: `radial-gradient(circle, ${B}, ${P})` }} />

          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative mb-12">
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

export default ResetPasswordPage;
