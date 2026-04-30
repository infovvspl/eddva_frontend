import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  Loader2, CheckCircle2, AlertCircle, Shield, Smartphone, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import * as otpApi from "@/lib/api/otp";
import { EddvaLogo } from "@/components/branding/EddvaLogo";

// ── constants ────────────────────────────────────────────────────────────────
const BLUE = "#3B82F6";
const PURPLE = "#A855F7";
const GREEN = "#10B981";
const RESEND_COOLDOWN = 30;

// ── Stepper ──────────────────────────────────────────────────────────────────
const STEPS = ["Account Info", "Phone OTP", "Email OTP", "Verified"] as const;

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 ${
                  done
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : active
                    ? "text-white shadow-lg shadow-blue-200"
                    : "bg-slate-100 text-slate-400"
                }`}
                style={active ? { background: `linear-gradient(135deg,${BLUE},${PURPLE})` } : undefined}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                  active ? "text-blue-600" : done ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 mb-5 rounded-full transition-all duration-500 ${
                  i < current ? "bg-emerald-400" : "bg-slate-100"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 6-digit OTP input ────────────────────────────────────────────────────────
function OtpInput({
  value, onChange, disabled,
}: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const next = [...value.padEnd(6, " ")];
      next[i] = " ";
      const str = next.join("").replace(/ +$/, "");
      onChange(str);
      if (i > 0) refs[i - 1].current?.focus();
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = [...value.padEnd(6, " ")];
    arr[i] = ch || " ";
    const str = arr.join("").replace(/ +$/, "");
    onChange(str);
    if (ch && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); refs[Math.min(pasted.length, 5)].current?.focus(); }
    e.preventDefault();
  };

  useEffect(() => { refs[0].current?.focus(); }, []);

  return (
    <div className="flex gap-2.5 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`h-14 w-11 rounded-2xl border-2 text-center text-xl font-black outline-none transition-all
            ${value[i] ? "border-blue-400 bg-blue-50 text-blue-700 shadow-md shadow-blue-100" : "border-slate-200 bg-white text-slate-800"}
            focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50`}
        />
      ))}
    </div>
  );
}

// ── Resend timer ─────────────────────────────────────────────────────────────
function ResendTimer({ onResend, loading }: { onResend: () => void; loading: boolean }) {
  const [sec, setSec] = useState(RESEND_COOLDOWN);
  useEffect(() => {
    setSec(RESEND_COOLDOWN);
    const t = setInterval(() => setSec((s) => (s <= 1 ? (clearInterval(t), 0) : s - 1)), 1000);
    return () => clearInterval(t);
  }, [onResend]);

  return (
    <div className="text-center mt-4">
      {sec > 0 ? (
        <p className="text-sm text-slate-400 font-medium">
          Resend OTP in <span className="font-black text-blue-500">{sec}s</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={onResend}
          disabled={loading}
          className="flex items-center gap-1.5 mx-auto text-sm font-bold text-blue-600 hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Resend OTP
        </button>
      )}
    </div>
  );
}

// ── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-100 bg-red-50 px-4 py-3 mb-5"
        >
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[13px] font-medium text-red-700">{msg}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const inputCls =
  "h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-5 text-[15px] font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-8 focus:ring-blue-500/5 disabled:opacity-50 shadow-sm";

export default function RegisterWithOtpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Step 1 – form data
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [userId, setUserId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  // Step 2/3 – OTP values
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const apiErr = (e: any) =>
    e?.response?.data?.message || e?.message || "Something went wrong.";

  // ── Step 1: register + send phone OTP ────────────────────────────────────
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setBusy(true);
    const phone = form.phone.startsWith("+") ? form.phone : `+91${form.phone}`;
    try {
      const reg = await otpApi.registerUser({
        fullName: form.fullName, email: form.email,
        phoneNumber: phone, password: form.password,
      });
      setUserId(reg.userId);
      const sent = await otpApi.sendPhoneOtp({ phoneNumber: phone, userId: reg.userId });
      setMaskedPhone(sent.maskedPhone || phone);
      toast.success("OTP sent to your phone!");
      setStep(1);
    } catch (e: any) { setError(apiErr(e)); }
    finally { setBusy(false); }
  }, [form]);

  // ── Step 2: verify phone OTP + send email OTP ─────────────────────────────
  const handleVerifyPhone = useCallback(async () => {
    if (phoneOtp.length < 6) return;
    setError(""); setBusy(true);
    const phone = form.phone.startsWith("+") ? form.phone : `+91${form.phone}`;
    try {
      await otpApi.verifyPhoneOtp({ phoneNumber: phone, otp: phoneOtp, userId });
      const sent = await otpApi.sendEmailOtp({ email: form.email, userId });
      setMaskedEmail(sent.maskedEmail || form.email);
      toast.success("Phone verified! Email OTP sent.");
      setStep(2);
    } catch (e: any) { setError(apiErr(e)); }
    finally { setBusy(false); }
  }, [phoneOtp, form.phone, form.email, userId]);

  // ── Step 3: verify email OTP ──────────────────────────────────────────────
  const handleVerifyEmail = useCallback(async () => {
    if (emailOtp.length < 6) return;
    setError(""); setBusy(true);
    try {
      await otpApi.verifyEmailOtp({ email: form.email, otp: emailOtp, userId });
      toast.success("Email verified! Account activated.");
      setStep(3);
    } catch (e: any) { setError(apiErr(e)); }
    finally { setBusy(false); }
  }, [emailOtp, form.email, userId]);

  // ── Resend helpers ────────────────────────────────────────────────────────
  const resendPhone = useCallback(async () => {
    setBusy(true);
    const phone = form.phone.startsWith("+") ? form.phone : `+91${form.phone}`;
    try {
      await otpApi.sendPhoneOtp({ phoneNumber: phone, userId });
      toast.success("OTP resent to phone.");
    } catch (e: any) { toast.error(apiErr(e)); }
    finally { setBusy(false); }
  }, [form.phone, userId]);

  const resendEmail = useCallback(async () => {
    setBusy(true);
    try {
      await otpApi.sendEmailOtp({ email: form.email, userId });
      toast.success("OTP resent to email.");
    } catch (e: any) { toast.error(apiErr(e)); }
    finally { setBusy(false); }
  }, [form.email, userId]);

  const submitLabel = (base: string) =>
    busy ? (
      <><Loader2 className="h-5 w-5 animate-spin" />{base}…</>
    ) : (
      <>{base}<ArrowRight className="h-5 w-5" /></>
    );

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 font-sans overflow-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full opacity-[0.04] blur-[120px]" style={{ background: BLUE }} />
        <div className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full opacity-[0.04] blur-[120px]" style={{ background: PURPLE }} />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(#CBD5E1 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative w-full max-w-[480px] rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.10)] border border-slate-100 p-8 sm:p-10"
      >
        <div className="mb-8">
          <EddvaLogo />
        </div>

        <Stepper current={step} />

        <ErrorBanner msg={error} />

        <AnimatePresence mode="wait">

          {/* ── STEP 0: Account Info ── */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-black text-slate-900 mb-1">Create your account</h1>
              <p className="text-sm text-slate-400 font-medium mb-7">
                Fill in your details to get started with EDDVA.
              </p>
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                    <User className="h-3 w-3" /> Full Name
                  </label>
                  <input required value={form.fullName} onChange={field("fullName")} placeholder="Rahul Sharma" disabled={busy} className={inputCls} />
                </div>
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                    <Mail className="h-3 w-3" /> Email
                  </label>
                  <input required type="email" value={form.email} onChange={field("email")} placeholder="you@example.com" disabled={busy} className={inputCls} />
                </div>
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                    <Phone className="h-3 w-3" /> Phone Number
                  </label>
                  <input required type="tel" value={form.phone} onChange={field("phone")} placeholder="+91 98765 43210" disabled={busy} className={inputCls} />
                  <p className="text-[11px] text-slate-400 ml-1">Include country code (e.g. +91)</p>
                </div>
                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ml-1">
                    <Lock className="h-3 w-3" /> Password
                  </label>
                  <div className="relative">
                    <input required type={showPw ? "text" : "password"} value={form.password} onChange={field("password")} placeholder="Min 8 characters" minLength={8} disabled={busy} className={`${inputCls} pr-14`} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <motion.button
                  type="submit" whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.99 }}
                  disabled={busy || !form.fullName || !form.email || !form.phone || !form.password}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[15px] font-black text-white shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${BLUE},${PURPLE})` }}
                >
                  {submitLabel("Continue")}
                </motion.button>
              </form>
              <p className="text-center text-sm text-slate-400 mt-6">
                Already have an account?{" "}
                <Link to="/login" className="font-black text-blue-600 hover:underline">Sign in</Link>
              </p>
            </motion.div>
          )}

          {/* ── STEP 1: Phone OTP ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${BLUE}18` }}>
                <Smartphone className="h-6 w-6" style={{ color: BLUE }} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Verify your phone</h2>
              <p className="text-sm text-slate-400 font-medium mb-7">
                We sent a 6-digit code to <strong className="text-slate-700">{maskedPhone}</strong>
              </p>
              <OtpInput value={phoneOtp} onChange={setPhoneOtp} disabled={busy} />
              <ResendTimer onResend={resendPhone} loading={busy} />
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => { setStep(0); setPhoneOtp(""); setError(""); }}
                  className="flex h-12 items-center gap-1.5 px-5 rounded-xl border-2 border-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <motion.button
                  type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={handleVerifyPhone} disabled={phoneOtp.length < 6 || busy}
                  className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-black text-white shadow-lg disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${BLUE},${PURPLE})` }}
                >
                  {submitLabel("Verify Phone")}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Email OTP ── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${PURPLE}18` }}>
                <Mail className="h-6 w-6" style={{ color: PURPLE }} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Verify your email</h2>
              <p className="text-sm text-slate-400 font-medium mb-7">
                We sent a 6-digit code to <strong className="text-slate-700">{maskedEmail}</strong>
                <br />
                <span className="text-[11px]">Code expires in 5 minutes.</span>
              </p>
              <OtpInput value={emailOtp} onChange={setEmailOtp} disabled={busy} />
              <ResendTimer onResend={resendEmail} loading={busy} />
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => { setStep(1); setEmailOtp(""); setError(""); }}
                  className="flex h-12 items-center gap-1.5 px-5 rounded-xl border-2 border-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <motion.button
                  type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={handleVerifyEmail} disabled={emailOtp.length < 6 || busy}
                  className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-black text-white shadow-lg disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${PURPLE},${BLUE})` }}
                >
                  {submitLabel("Verify Email")}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-2xl shadow-emerald-200"
                style={{ background: `linear-gradient(135deg,${GREEN},#059669)` }}
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Account Verified! 🎉</h2>
              <p className="text-sm text-slate-400 font-medium mb-3">
                Both your phone and email have been verified successfully.
              </p>
              <div className="flex flex-col gap-2 items-center text-sm mb-8">
                <span className="flex items-center gap-2 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Phone verified
                </span>
                <span className="flex items-center gap-2 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Email verified
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/login")}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-black text-white shadow-xl shadow-blue-500/20"
                style={{ background: `linear-gradient(135deg,${BLUE},${PURPLE})` }}
              >
                Sign in to your account <ArrowRight className="h-5 w-5" />
              </motion.button>
              <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Shield className="h-3.5 w-3.5" />
                Secured by EDDVA Architecture
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
