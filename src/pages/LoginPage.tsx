import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle,
  Smartphone, RefreshCw, CheckCircle2, Globe, Users, BarChart2,
} from "lucide-react";
import { useSendOtp, useVerifyOtp } from "@/hooks/use-auth";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

const B = "#2563EB";
const P = "#7C3AED";

/* ── small floating stat card (right panel) ── */
const StatCard = ({
  icon, label, value, color, bg, delay = 0,
}: { icon: React.ReactNode; label: string; value: string; color: string; bg: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: "easeOut" as const }}
    className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 shadow-lg"
  >
    <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: bg }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="text-[11px] font-semibold text-white/55 uppercase tracking-wider">{label}</p>
      <p className="text-[15px] font-bold text-white">{value}</p>
    </div>
  </motion.div>
);

const LoginPage = () => {
  const [phone,     setPhone]     = useState("");
  const [otpSent,   setOtpSent]   = useState(false);
  const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp   = useSendOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
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
      const msg = (err as any)?.response?.data?.message || "Failed to send OTP. Please try again.";
      setError(msg);
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
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setError("");
    try {
      setSuccess(true);
      await verifyOtp.mutateAsync({ phoneNumber: fullPhone, otp: otp.join("") });
    } catch (err: unknown) {
      setSuccess(false);
      const msg = (err as any)?.response?.data?.message || "Invalid OTP. Please try again.";
      setError(msg);
    }
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 text-[14px] text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:opacity-50";

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row overflow-hidden font-sans">

      {/* ══════════ LEFT: Form Panel ══════════ */}
      <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-[52%] md:px-12 lg:px-20">

        {/* soft bg orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full opacity-[0.06] blur-3xl" style={{ background: B }} />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full opacity-[0.05] blur-3xl" style={{ background: P }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="relative w-full max-w-[420px]"
        >
          {/* Logo */}
          <div className="mb-10">
            <img src={edvaLogo} alt="EDDVA" className="h-10 w-auto object-contain" />
          </div>

          {/* Access badge */}
          <div className="mb-8 flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <Lock className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-[12px] font-semibold text-amber-700 leading-snug">
              Super Admin Console — Restricted access only
            </p>
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

            {/* ── STEP 1: Phone input ── */}
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
                  whileHover={{ scale: 1.02, boxShadow: `0 12px 32px ${B}44` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendOtp}
                  disabled={phone.length < 10 || isLoading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg transition-all disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                  {sendOtp.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
                    : <>Send Verification Code <ArrowRight className="h-4 w-4" /></>}
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 2: OTP input ── */}
            {otpSent && (
              <motion.div key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" as const }}
                className="space-y-7">

                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${B}15` }}>
                    <ShieldCheck className="h-6 w-6" style={{ color: B }} />
                  </div>
                  <h1 className="text-[30px] font-extrabold tracking-tight text-gray-900 mb-1.5">Enter OTP</h1>
                  <p className="text-[14px] font-medium text-gray-500">
                    We sent a 6-digit code to{" "}
                    <span className="font-bold text-gray-800">+91 {phone}</span>
                  </p>
                </div>

                {/* OTP boxes */}
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
                        className={`aspect-square w-full max-w-[52px] rounded-xl border text-center text-[20px] font-extrabold text-gray-900 outline-none transition-all disabled:opacity-50 ${
                          digit
                            ? "border-blue-400 bg-blue-50 ring-4 ring-blue-100"
                            : "border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Resend row */}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[12px] text-gray-400">Sent to +91 {phone}</p>
                    {countdown > 0 ? (
                      <p className="text-[12px] font-semibold text-gray-400">
                        Resend in <span className="text-gray-700">{countdown}s</span>
                      </p>
                    ) : (
                      <button onClick={handleResendOtp} disabled={sendOtp.isPending}
                        className="flex items-center gap-1 text-[12px] font-bold transition-colors disabled:opacity-50"
                        style={{ color: B }}>
                        <RefreshCw className="h-3 w-3" /> Resend Code
                      </button>
                    )}
                  </div>
                </div>

                {/* Verify button */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: `0 12px 32px ${B}44` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerify}
                    disabled={!otpFilled || isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white shadow-lg transition-all disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                    {verifyOtp.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</>
                      : success
                      ? <><CheckCircle2 className="h-4 w-4" />Verified!</>
                      : "Verify & Sign In"}
                  </motion.button>

                  <button onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); setError(""); }}
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
      <div className="relative hidden md:flex md:w-[48%] flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(145deg, #0f172a 0%, #1e1b4b 40%, #1e3a5f 100%)` }}>

        {/* animated orbs */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.35, 0.25] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" as const }}
            className="absolute -top-16 -right-16 h-80 w-80 rounded-full blur-3xl" style={{ background: P }} />
          <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.28, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" as const, delay: 2 }}
            className="absolute bottom-0 -left-16 h-64 w-64 rounded-full blur-3xl" style={{ background: B }} />
          {/* dot grid */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
        </div>

        {/* Floating stat cards */}
        <div className="absolute top-[16%] left-8 flex flex-col gap-3">
          <StatCard icon={<Users className="h-4 w-4" />}     label="Active Tenants" value="48 Institutes" color="#60A5FA" bg="rgba(96,165,250,0.2)"  delay={0.3} />
          <StatCard icon={<BarChart2 className="h-4 w-4" />} label="Total Students"  value="50,000+"      color="#A78BFA" bg="rgba(167,139,250,0.2)" delay={0.45} />
        </div>
        <div className="absolute bottom-[18%] right-8">
          <StatCard icon={<Globe className="h-4 w-4" />} label="Platform Uptime" value="99.9%" color="#34D399" bg="rgba(52,211,153,0.2)" delay={0.6} />
        </div>

        {/* Center content */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" as const }}
          className="relative z-10 max-w-sm px-8 text-center">

          {/* Shield icon */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
            <ShieldCheck className="h-12 w-12 text-white" />
          </motion.div>

          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white/70">Super Admin Console</span>
          </div>

          <h2 className="mb-4 text-[28px] font-extrabold leading-snug tracking-tight text-white">
            Platform Control<br />Centre
          </h2>
          <p className="text-[15px] font-medium leading-relaxed text-white/50">
            Manage institutes, students, teachers and platform settings — all from one secure dashboard.
          </p>

          {/* mini feature list */}
          <div className="mt-8 space-y-3 text-left">
            {[
              "Manage all institutes & tenants",
              "Monitor platform-wide analytics",
              "Control user roles & permissions",
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-400/20">
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                </div>
                <p className="text-[13px] font-medium text-white/60">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default LoginPage;
