import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Building2, Mail, Globe, Copy, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTenant } from "@/hooks/use-tenants";
import { sendOnboardingOtp, verifyOnboardingOtp } from "@/lib/api/public-tenant";

const PLANS = ["starter", "growth", "scale", "enterprise"] as const;
const PLAN_LIMITS: Record<string, { students: number; teachers: number }> = {
  starter:    { students: 500,  teachers: 20  },
  growth:     { students: 1000, teachers: 50  },
  scale:      { students: 2000, teachers: 100 },
  enterprise: { students: 5000, teachers: 200 },
};

const NewInstitutePage = () => {
  const navigate = useNavigate();
  const createTenant = useCreateTenant();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", subdomain: "", plan: "starter", billingEmail: "",
    maxStudents: 500, maxTeachers: 20, adminPhone: "", trialDays: 14,
  });
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // OTP state
  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  useEffect(() => {
    if (form.adminPhone !== verifiedPhone.replace("+91", "")) {
      setOtpStep("idle");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
    }
  }, [form.adminPhone, verifiedPhone]);

  const fullAdminPhone = `+91${form.adminPhone}`;

  const handlePlanChange = (plan: string) => {
    const limits = PLAN_LIMITS[plan] ?? { students: 500, teachers: 20 };
    setForm({ ...form, plan, maxStudents: limits.students, maxTeachers: limits.teachers });
  };

  const handleSubdomainChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setForm({ ...form, subdomain: clean });
    if (clean.length >= 3) {
      setSubdomainStatus("checking");
      setTimeout(() => setSubdomainStatus(clean === "taken" ? "taken" : "available"), 800);
    } else {
      setSubdomainStatus("idle");
    }
  };

  const handleSendOtp = async () => {
    if (form.adminPhone.length < 10) return;
    setOtpError(""); setOtpLoading(true);
    try {
      await sendOnboardingOtp(fullAdminPhone);
      setOtpStep("sent");
      setOtpCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setOtpError((err as any)?.response?.data?.message || "Failed to send OTP.");
    } finally { setOtpLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    setOtpError(""); setOtpLoading(true);
    try {
      await verifyOnboardingOtp(fullAdminPhone, otp.join(""));
      setOtpStep("verified");
      setVerifiedPhone(fullAdminPhone);
    } catch (err: unknown) {
      setOtpError((err as any)?.response?.data?.message || "Invalid OTP.");
    } finally { setOtpLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpStep !== "verified") { setError("Please verify the admin phone number first."); return; }
    setError("");
    try {
      const data = await createTenant.mutateAsync({
        name: form.name,
        subdomain: form.subdomain,
        plan: form.plan,
        billingEmail: form.billingEmail,
        maxStudents: form.maxStudents,
        maxTeachers: form.maxTeachers,
        adminPhone: fullAdminPhone,
        trialDays: form.trialDays,
      });
      setResult(data);
      setSubmitted(true);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message || "Failed to create institute. Please try again.");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canProceedStep1 = form.name.trim() && form.subdomain && subdomainStatus === "available";

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    const tempPassword = result?.tempPassword || "—";
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-[24px] bg-emerald-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-2">Institute Deployed!</h2>
          <p className="text-muted-foreground font-medium mb-8">
            <span className="text-primary font-bold">{form.name}</span> is live at <br />
            <span className="underline decoration-primary/30">{form.subdomain}.edva.in</span>
          </p>

          <div className="bg-card border border-border rounded-[32px] p-6 shadow-sm mb-8 text-left space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Temporary Password</p>
            <div className="bg-secondary rounded-2xl p-4 flex items-center justify-between">
              <code className="text-sm font-bold text-foreground font-mono">{tempPassword}</code>
              <button onClick={() => handleCopy(tempPassword)} className="p-2 hover:bg-background rounded-lg transition-all text-primary">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-500 font-bold">Copied!</p>}
            <p className="text-xs text-muted-foreground">Share this with the institute admin. They will be prompted to set a new password on first login.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/super-admin/tenants")} className="h-14 rounded-2xl bg-foreground text-background font-bold w-full">
              Go to Institutes
            </Button>
            <Button variant="ghost" onClick={() => {
              setSubmitted(false); setResult(null); setOtpStep("idle");
              setOtp(["", "", "", "", "", ""]); setVerifiedPhone("");
              setForm({ name: "", subdomain: "", plan: "starter", billingEmail: "", maxStudents: 500, maxTeachers: 20, adminPhone: "", trialDays: 14 });
              setSubdomainStatus("idle"); setStep(1);
            }} className="text-muted-foreground font-bold">
              Add another institute
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b border-slate-100 pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-900 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 mb-4 transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
            <h1 className="text-[42px] font-black text-slate-900 tracking-tight leading-tight">New Institute</h1>
            <p className="text-slate-400 text-[17px] font-semibold mt-1">Provision a new educational partner on the platform.</p>
          </div>

          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`h-2 w-20 rounded-full transition-all ${s <= step ? "bg-indigo-600" : "bg-slate-100"}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${s === step ? "text-indigo-600" : "text-gray-600"}`}>Step {s}</span>
              </div>
            ))}
          </div>
        </header>

        {error && (
          <div className="mb-8 flex items-start gap-4 p-5 rounded-[24px] bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Identity + Plan ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  <div className="bg-slate-50/50 p-10 rounded-[44px] border border-slate-100 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-[18px] bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Institute Details</h3>
                    </div>

                    {/* Name */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Institute Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Allen Career Institute"
                        className="w-full h-14 px-6 bg-white border-2 border-slate-100 rounded-[20px] text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    {/* Subdomain */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Subdomain</label>
                      <div className="relative">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          required
                          value={form.subdomain}
                          onChange={(e) => handleSubdomainChange(e.target.value)}
                          placeholder="allen-kota"
                          className="w-full h-14 pl-12 pr-36 bg-white border-2 border-slate-100 rounded-[20px] text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-600">.edva.in</span>
                          {subdomainStatus === "checking" && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                          {subdomainStatus === "available" && <Check className="w-4 h-4 text-emerald-500" />}
                          {subdomainStatus === "taken" && <X className="w-4 h-4 text-rose-500" />}
                        </div>
                      </div>
                    </div>

                    {/* Plan */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Plan</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PLANS.map((p) => (
                          <button
                            key={p} type="button"
                            onClick={() => handlePlanChange(p)}
                            className={`h-12 rounded-[16px] border-2 text-[13px] font-black capitalize transition-all ${
                              form.plan === p
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 ml-2">
                        Up to <span className="font-bold text-slate-600">{form.maxStudents.toLocaleString()} students</span> · <span className="font-bold text-slate-600">{form.maxTeachers} teachers</span>
                      </p>
                    </div>

                    {/* Trial days */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Trial Period (days)</label>
                      <input
                        type="number"
                        min={0}
                        max={90}
                        value={form.trialDays}
                        onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })}
                        className="w-full h-14 px-6 bg-white border-2 border-slate-100 rounded-[20px] text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="h-14 px-10 rounded-[20px] bg-white text-gray-900 font-black hover:bg-gray-100 shadow-2xl transition-all"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step 2: Governance ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  <div className="bg-slate-50/50 p-10 rounded-[44px] border border-slate-100 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-[18px] bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Admin Credentials</h3>
                    </div>

                    {/* Billing email */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Billing Email</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          type="email"
                          required
                          value={form.billingEmail}
                          onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                          placeholder="admin@institute.edu"
                          className="w-full h-14 pl-12 bg-white border-2 border-slate-100 rounded-[20px] text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Admin phone + OTP */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Admin Phone Number</label>
                      <div className="flex gap-3">
                        <div className="h-14 w-16 bg-slate-100 rounded-[20px] flex items-center justify-center font-black text-slate-500 text-sm shrink-0">+91</div>
                        <input
                          type="tel"
                          required
                          value={form.adminPhone}
                          onChange={(e) => setForm({ ...form, adminPhone: e.target.value.replace(/\D/g, "") })}
                          maxLength={10}
                          disabled={otpStep === "verified"}
                          placeholder="9876543210"
                          className="flex-1 h-14 px-5 bg-white border-2 border-slate-100 rounded-[20px] text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                        />
                        {otpStep === "verified" && (
                          <div className="h-14 w-14 bg-emerald-50 text-emerald-500 border-2 border-emerald-100 rounded-[20px] flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {otpError && <p className="text-xs text-rose-500 font-bold ml-2">{otpError}</p>}

                      {otpStep === "idle" && form.adminPhone.length === 10 && (
                        <Button type="button" onClick={handleSendOtp} disabled={otpLoading} className="h-12 w-full rounded-[18px] bg-indigo-600 text-white font-black">
                          {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Send OTP
                        </Button>
                      )}

                      {otpStep === "sent" && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                          <p className="text-[12px] font-bold text-slate-400 ml-1">Enter 6-digit OTP sent to +91 {form.adminPhone}</p>
                          <div className="flex justify-between gap-2">
                            {otp.map((digit, i) => (
                              <input
                                key={i}
                                ref={(el) => { otpRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                className="aspect-square w-full rounded-2xl border-2 border-slate-100 bg-white text-center font-black text-xl focus:border-indigo-600 outline-none transition-all"
                              />
                            ))}
                          </div>
                          <Button type="button" onClick={handleVerifyOtp} disabled={otp.some(d => !d) || otpLoading} className="h-12 w-full rounded-[18px] bg-white text-gray-900 font-black">
                            {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Verify OTP
                          </Button>
                          {otpCountdown > 0
                            ? <p className="text-[11px] text-slate-400 text-center">Resend in {otpCountdown}s</p>
                            : <button type="button" onClick={handleSendOtp} className="text-[11px] text-indigo-600 font-bold w-full text-center">Resend OTP</button>
                          }
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-14 px-8 rounded-[20px] border-2 border-slate-100 font-black text-slate-600">
                      Back
                    </Button>
                    <Button type="submit" disabled={otpStep !== "verified" || createTenant.isPending} className="h-14 px-10 rounded-[20px] bg-indigo-600 text-white font-black shadow-2xl flex gap-3">
                      {createTenant.isPending
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <><Check className="w-5 h-5 stroke-[3]" /> Deploy Institute</>}
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Sidebar summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-[36px] p-8 text-gray-900 sticky top-10 shadow-2xl shadow-slate-900/30 overflow-hidden">
              <div className="relative z-10 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Summary</h4>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-400">Name</p>
                  <p className="text-xl font-black leading-tight">{form.name || "—"}</p>
                  <p className="text-xs font-bold text-white/40">{form.subdomain ? `${form.subdomain}.edva.in` : "—"}</p>
                </div>

                <div className="h-px bg-white/10" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-4 rounded-[16px] border border-gray-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Plan</p>
                    <p className="text-base font-black capitalize">{form.plan}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-[16px] border border-gray-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Trial</p>
                    <p className="text-base font-black">{form.trialDays}d</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-[16px] border border-gray-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Students</p>
                    <p className="text-base font-black">{form.maxStudents.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-[16px] border border-gray-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Teachers</p>
                    <p className="text-base font-black">{form.maxTeachers}</p>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full transition-all ${otpStep === "verified" ? "bg-emerald-400" : "bg-white/10"}`} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                    {otpStep === "verified" ? "Phone Verified" : "Awaiting Verification"}
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 h-28 w-28 bg-indigo-500 opacity-10 blur-[50px]" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInstitutePage;
