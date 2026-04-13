import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle,
  Smartphone, RefreshCw, CheckCircle2, Sparkles, Trophy, Flame, Zap,
  GraduationCap,
} from "lucide-react";
import { useSendOtp, useVerifyOtp } from "@/hooks/use-auth";
import { useTenantResolver } from "@/hooks/use-tenant-resolver";
import loginIllustration from "@/assets/bg.png";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

const BLUE = "#2563EB";
const PURPLE = "#7C3AED";

/* ── floating stat card ── */
const FloatCard = ({
  icon, label, value, color, delay = 0,
}: { icon: React.ReactNode; label: string; value: string; color: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: "easeOut" }}
    className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-gray-200 px-4 py-3 shadow-lg"
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

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const fullPhone = `+91${phone}`;
  const isLoading = sendOtp.isPending || verifyOtp.isPending;
  const otpFilled = otp.every(d => d !== "");

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setError("");
    try {
      await sendOtp.mutateAsync({ phoneNumber: fullPhone });
      setOtpSent(true);
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message || "Failed to send OTP. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      await sendOtp.mutateAsync({ phoneNumber: fullPhone });
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Failed to resend OTP.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    setError("");
    try {
      setSuccess(true);
      await verifyOtp.mutateAsync({ phoneNumber: fullPhone, otp: otp.join("") });
    } catch (err: unknown) {
      setSuccess(false);
      setError((err as any)?.response?.data?.message || "Invalid OTP. Please try again.");
    }
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 text-[14px] text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-50";

  /* ── tenant loading / error ── */
  if (tenantLoading) return (
    <div className="flex h-screen w-full items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${BLUE}15, ${PURPLE}15)` }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
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

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row overflow-hidden font-sans">

      {/* ══════════ LEFT: Form Panel ══════════ */}
      <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-[52%] md:px-12 lg:px-20">

        {/* soft bg orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full opacity-[0.06] blur-3xl" style={{ background: BLUE }} />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full opacity-[0.05] blur-3xl" style={{ background: PURPLE }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="relative w-full max-w-[420px]"
        >
          {/* Logo */}
          <div className="mb-10">
            <img src={edvaLogo} alt="EDDVA" className="object-contain" />
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

            {/* ── STEP 1: Phone ── */}
            {!otpSent && (
              <motion.div key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" as const }}
                className="space-y-7">

                <div>
                  <h1 className="text-[30px] font-extrabold tracking-tight text-gray-900 mb-1.5">Welcome back</h1>
                  <p className="text-[14px] font-medium text-gray-500">
                    Enter your registered mobile number to receive a verification code.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5" /> Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-[14px] font-bold text-gray-600 flex-shrink-0">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={e => e.key === "Enter" && phone.length >= 10 && handleSendOtp()}
                      placeholder="10-digit mobile number"
                      disabled={isLoading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: `0 12px 32px ${BLUE}44` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendOtp}
                  disabled={phone.length < 10 || isLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg transition-all disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
                  {sendOtp.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
                    : <>Send Verification Code <ArrowRight className="h-4 w-4" /></>}
                </motion.button>

                {/* Register link */}
                <p className="text-center text-[13px] text-gray-400">
                  New student?{" "}
                  <Link to="/register" className="font-bold hover:underline" style={{ color: BLUE }}>
                    Create an account
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: OTP ── */}
            {otpSent && (
              <motion.div key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" as const }}
                className="space-y-7">

                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${BLUE}15` }}>
                    <ShieldCheck className="h-6 w-6" style={{ color: BLUE }} />
                  </div>
                  <h1 className="text-[30px] font-extrabold tracking-tight text-gray-900 mb-1.5">Enter OTP</h1>
                  <p className="text-[14px] font-medium text-gray-500">
                    We sent a 6-digit code to{" "}
                    <span className="font-bold text-gray-800">+91 {phone}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
                    Verification Code
                  </label>
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, i) => (
                      <motion.input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => {
                          handleOtpKeyDown(i, e);
                          if (e.key === "Enter" && otpFilled) handleVerify();
                        }}
                        disabled={isLoading}
                        whileFocus={{ scale: 1.05 }}
                        className={`aspect-square w-full max-w-[52px] rounded-xl border text-center text-[20px] font-extrabold text-gray-900 outline-none transition-all disabled:opacity-50 ${digit
                            ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100"
                            : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[12px] text-gray-400">Sent to +91 {phone}</p>
                    {countdown > 0 ? (
                      <p className="text-[12px] font-semibold text-gray-400">
                        Resend in <span className="text-gray-700">{countdown}s</span>
                      </p>
                    ) : (
                      <button onClick={handleResendOtp} disabled={sendOtp.isPending}
                        className="flex items-center gap-1 text-[12px] font-bold transition-colors disabled:opacity-50"
                        style={{ color: BLUE }}>
                        <RefreshCw className="h-3 w-3" /> Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: `0 12px 32px ${BLUE}44` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerify}
                    disabled={!otpFilled || isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg transition-all disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
                    {verifyOtp.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</>
                      : success
                        ? <><CheckCircle2 className="h-4 w-4" />Verified!</>
                        : "Verify & Sign In"}
                  </motion.button>

                  <button onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    className="w-full py-2 text-[13px] font-semibold text-gray-400 hover:text-gray-700 transition-colors">
                    ← Change phone number
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer */}
          <div className="mt-12 flex items-center justify-center gap-1.5 border-t border-gray-100 pt-6">
            <Lock className="h-3 w-3 text-gray-300" />
            <p className="text-[11px] text-gray-400 font-medium">
              Encrypted session — Authorized access only
            </p>
          </div>
        </motion.div>
      </div>

      {/* ══════════ RIGHT: Decorative Panel ══════════ */}
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
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
        </div>

        {/* Tenant badge */}
        <div className="absolute top-8 right-8 flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-gray-200 px-4 py-2.5">
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

        {/* Floating stat cards */}
        <div className="absolute top-[18%] left-8 flex flex-col gap-3">
          <FloatCard icon={<Flame className="h-4 w-4" />} label="Active Streak" value="12 Days" color="#F59E0B" delay={0.3} />
          <FloatCard icon={<Trophy className="h-4 w-4" />} label="Top Rank" value="#3 in Batch" color="#A78BFA" delay={0.45} />
        </div>
        <div className="absolute bottom-[22%] right-8">
          <FloatCard icon={<Zap className="h-4 w-4" />} label="XP Earned" value="4,820 pts" color="#60A5FA" delay={0.6} />
        </div>

        {/* Center illustration */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" as const }}
          className="relative z-10 w-full max-w-md px-8 text-center"
        >
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 h-12 w-2/3 rounded-full blur-3xl opacity-30"
            style={{ background: BLUE }} />
          <img src={loginIllustration} alt="Learn"
            className="w-full h-auto max-h-[380px] object-contain drop-shadow-2xl relative z-10 mb-10" />

          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-[12px] font-bold text-white/80 uppercase tracking-widest">Smart Learning Platform</span>
          </div>

          <h3 className="text-[30px] font-extrabold text-white tracking-tight leading-snug mb-4">
            {tenant.welcomeMessage || "Learn Smarter,\nAchieve More"}
          </h3>
          <p className="text-[15px] text-white/55 font-medium leading-relaxed max-w-sm mx-auto">
            Access your courses, practice tests, and progress analytics — all in one premium platform.
          </p>

          <div className="mt-10 flex items-center justify-center gap-6">
            {[
              { val: "50K+", lbl: "Students" },
              { val: "500+", lbl: "Topics" },
              { val: "98%", lbl: "Pass Rate" },
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
