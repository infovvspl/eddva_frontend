import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Building2, Mail, Globe, Copy, AlertCircle, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTenant } from "@/hooks/use-tenants";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/api/otp";
import { COACHING_AI_FEATURES } from "@/lib/constants/coachingAiFeatures";

const DEFAULT_STUDENTS = 1000;
const DEFAULT_TEACHERS = 50;

const AI_FEATURE_OPTIONS = COACHING_AI_FEATURES.map(f => ({
  key: f.key,
  label: f.label,
  desc: f.description,
}));

const NewInstitutePage = () => {
  const navigate = useNavigate();
  const createTenant = useCreateTenant();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", subdomain: "", billingEmail: "",
    maxStudents: DEFAULT_STUDENTS, maxTeachers: DEFAULT_TEACHERS, adminPhone: "", 
    address: "", city: "", state: "", pincode: ""
  });
  const [aiEnabled, setAiEnabled] = useState(false);
  
  const [aiFeatures, setAiFeatures] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem("coaching_ai_feature_defaults");
      if (s) {
        const parsed = JSON.parse(s);
        return Object.entries(parsed).filter(([, v]) => v).map(([k]) => k);
      }
    } catch {}
    return COACHING_AI_FEATURES.filter(f => f.defaultEnabled).map(f => f.key);
  });

  const [modulesPermissions, setModulesPermissions] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem("coaching_standard_feature_defaults");
      if (s) return JSON.parse(s);
    } catch {}
    // Need to import STANDARD_FEATURES or default to true
    return {
      live_lectures: true, mock_tests: true, doubt_queue: true, leaderboard: true,
      calendar: true, pyq_bank: true, content_library: true, notifications: true
    };
  });

  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);



  // Email OTP state
  const [emailOtpStep, setEmailOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState(0);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const emailOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailOtpCountdown > 0) {
      const t = setTimeout(() => setEmailOtpCountdown(emailOtpCountdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [emailOtpCountdown]);

  useEffect(() => {
    if (form.billingEmail !== verifiedEmail) {
      setEmailOtpStep("idle");
      setEmailOtp(["", "", "", "", "", ""]);
      setEmailOtpError("");
    }
  }, [form.billingEmail, verifiedEmail]);

  const fullAdminPhone = `+91${form.adminPhone}`;

  // No plan logic needed

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



  const handleSendEmailOtp = async () => {
    if (!form.billingEmail || !/\S+@\S+\.\S+/.test(form.billingEmail)) return;
    setEmailOtpError("");
    setEmailOtpLoading(true);
    try {
      await sendEmailOtp({ email: form.billingEmail });
      setEmailOtpStep("sent");
      setEmailOtpCountdown(30);
      setTimeout(() => emailOtpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setEmailOtpError((err as any)?.response?.data?.message || "Failed to send email verification code.");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleEmailOtpChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const newOtp = [...emailOtp];
    newOtp[index] = value;
    setEmailOtp(newOtp);
    if (value && index < 5) emailOtpRefs.current[index + 1]?.focus();
  };

  const handleEmailOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !emailOtp[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailOtpError("");
    setEmailOtpLoading(true);
    try {
      await verifyEmailOtp({ email: form.billingEmail, otp: emailOtp.join("") });
      setEmailOtpStep("verified");
      setVerifiedEmail(form.billingEmail);
    } catch (err: unknown) {
      setEmailOtpError((err as any)?.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtpStep !== "verified") {
      setError("Please verify the billing email address first.");
      return;
    }
    setError("");
    try {
      const data = await createTenant.mutateAsync({
        name: form.name,
        subdomain: form.subdomain,
        billingEmail: form.billingEmail,
        maxStudents: form.maxStudents,
        maxTeachers: form.maxTeachers,
        adminPhone: fullAdminPhone,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        aiEnabled,
        aiFeatures: aiEnabled ? aiFeatures : [],
        modulesPermissions,
      } as any);
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
          <div className="w-20 h-20 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Institute Deployed!</h2>
          <p className="text-muted-foreground font-medium mb-8">
            <span className="text-primary font-bold">{form.name}</span> is live at <br />
            <span className="underline decoration-primary/30">{form.subdomain}.edva.in</span>
          </p>

          <div className="bg-card border border-border rounded-[32px] p-6 shadow-sm mb-8 text-left space-y-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Admin Login Credentials</p>

            {/* Login identifier */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Login Phone Number</p>
              <div className="bg-secondary rounded-2xl p-4 flex items-center justify-between">
                <code className="text-sm font-bold text-foreground font-mono">{fullAdminPhone}</code>
                <button onClick={() => handleCopy(fullAdminPhone)} className="p-2 hover:bg-background rounded-lg transition-all text-primary">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Temp password */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Temporary Password</p>
              <div className="bg-secondary rounded-2xl p-4 flex items-center justify-between">
                <code className="text-sm font-bold text-foreground font-mono">{tempPassword}</code>
                <button onClick={() => handleCopy(tempPassword)} className="p-2 hover:bg-background rounded-lg transition-all text-primary">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {copied && <p className="text-xs text-emerald-500 font-bold">Copied!</p>}
            <p className="text-xs text-muted-foreground">
              Share both the phone number and this password with the institute admin. They MUST log in at their specific portal:{" "}
              <span className="font-bold text-indigo-600 underline cursor-pointer" onClick={() => window.open(`http://${form.subdomain}.localhost:8080/login`, '_blank')}>
                {form.subdomain}.localhost:8080/login
              </span>{" "}
              using their phone number and the temporary password above.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/super-admin/tenants")} className="h-14 rounded-2xl bg-foreground text-background font-bold w-full">
              Go to Institutes
            </Button>
            <Button variant="ghost" onClick={() => {
              setSubmitted(false); setResult(null);
              setEmailOtpStep("idle");
              setEmailOtp(["", "", "", "", "", ""]);
              setVerifiedEmail("");
              setForm({ name: "", subdomain: "", billingEmail: "", maxStudents: DEFAULT_STUDENTS, maxTeachers: DEFAULT_TEACHERS, adminPhone: "", address: "", city: "", state: "", pincode: "" });
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
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-900 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-2 mb-4 transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
            <h1 className="text-[42px] font-bold text-slate-900 tracking-tight leading-tight">New Institute</h1>
            <p className="text-slate-400 text-[17px] font-semibold mt-1">Provision a new educational partner on the platform.</p>
          </div>

          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className={`h-2 w-20 rounded-full transition-all ${s <= step ? "bg-indigo-600" : "bg-slate-100"}`} />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${s === step ? "text-indigo-600" : "text-gray-600"}`}>Step {s}</span>
              </div>
            ))}
          </div>
        </header>

        {error && (
          <div className="mb-8 flex items-start gap-4 p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          <div>
            <AnimatePresence mode="wait">

              {/* ── Step 1: Identity + Plan ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                  <div className="bg-slate-50/50 p-10 rounded-[44px] border border-slate-100 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Institute Details</h3>
                    </div>

                    {/* Name */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-2">Institute Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Allen Career Institute"
                        className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    {/* Subdomain */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-2">Subdomain</label>
                      <div className="relative">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                          required
                          value={form.subdomain}
                          onChange={(e) => handleSubdomainChange(e.target.value)}
                          placeholder="allen-kota"
                          className="w-full h-14 pl-12 pr-36 bg-white border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className="text-[11px] font-bold text-gray-600">.edva.in</span>
                          {subdomainStatus === "checking" && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                          {subdomainStatus === "available" && <Check className="w-4 h-4 text-emerald-500" />}
                          {subdomainStatus === "taken" && <X className="w-4 h-4 text-rose-500" />}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Address */}
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-2">Full Address</label>
                        <input
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          placeholder="e.g. 1st Floor, Building A, Street Name"
                          className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-2">City</label>
                        <input
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="e.g. Kota"
                          className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-2">State</label>
                        <input
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          placeholder="e.g. Rajasthan"
                          className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>

                      {/* Pincode */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-2">Pincode</label>
                        <input
                          value={form.pincode}
                          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                          placeholder="e.g. 324005"
                          className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="h-14 px-10 rounded-2xl bg-white text-gray-900 font-semibold hover:bg-gray-100 shadow-lg transition-all"
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
                      <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Admin Credentials</h3>
                    </div>

                    {/* Billing email */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-2">Billing Email</label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                          <input
                            type="email"
                            required
                            value={form.billingEmail}
                            onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                            disabled={emailOtpStep === "verified"}
                            placeholder="admin@institute.edu"
                            className="w-full h-14 pl-12 pr-5 bg-white border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                          />
                        </div>
                        {emailOtpStep === "verified" && (
                          <div className="h-14 w-14 bg-emerald-50 text-emerald-500 border-2 border-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {emailOtpError && <p className="text-xs text-rose-500 font-bold ml-2">{emailOtpError}</p>}

                      {emailOtpStep === "idle" && form.billingEmail && /\S+@\S+\.\S+/.test(form.billingEmail) && (
                        <Button type="button" onClick={handleSendEmailOtp} disabled={emailOtpLoading} className="h-12 w-full rounded-xl bg-indigo-600 text-white font-semibold">
                          {emailOtpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Send Verification Code
                        </Button>
                      )}

                      {emailOtpStep === "sent" && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                          <p className="text-[12px] font-bold text-slate-400 ml-1">Enter 6-digit verification code sent to {form.billingEmail}</p>
                          <div className="flex justify-between gap-2">
                            {emailOtp.map((digit, i) => (
                              <input
                                key={i}
                                ref={(el) => { emailOtpRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleEmailOtpChange(i, e.target.value)}
                                onKeyDown={(e) => handleEmailOtpKeyDown(i, e)}
                                className="aspect-square w-full rounded-2xl border border-slate-200 bg-white text-center font-semibold text-xl focus:border-indigo-600 outline-none transition-all"
                              />
                            ))}
                          </div>
                          <Button type="button" onClick={handleVerifyEmailOtp} disabled={emailOtp.some(d => !d) || emailOtpLoading} className="h-12 w-full rounded-xl bg-white text-gray-900 font-semibold">
                            {emailOtpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Verify Code
                          </Button>
                          {emailOtpCountdown > 0
                            ? <p className="text-[11px] text-slate-400 text-center">Resend in {emailOtpCountdown}s</p>
                            : <button type="button" onClick={handleSendEmailOtp} className="text-[11px] text-indigo-600 font-bold w-full text-center">Resend Code</button>
                          }
                        </motion.div>
                      )}
                    </div>

                    {/* Admin phone */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400 ml-2">Admin Phone Number</label>
                      <div className="flex gap-3">
                        <div className="h-14 w-16 bg-slate-100 rounded-2xl flex items-center justify-center font-semibold text-slate-500 text-sm shrink-0">+91</div>
                        <input
                          type="tel"
                          required
                          value={form.adminPhone}
                          onChange={(e) => setForm({ ...form, adminPhone: e.target.value.replace(/\D/g, "") })}
                          maxLength={10}
                          placeholder="9876543210"
                          className="flex-1 h-14 px-5 bg-white border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── AI Features Section ── */}
                  <div className="bg-slate-50/50 p-8 rounded-[36px] border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">AI Features</h3>
                          <p className="text-[11px] font-semibold text-slate-400">Enable AI-powered learning for this institute</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAiEnabled(!aiEnabled); if (aiEnabled) setAiFeatures([]); }}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none ${aiEnabled ? "bg-indigo-600" : "bg-slate-200"}`}
                      >
                        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${aiEnabled ? "translate-x-7" : ""}`} />
                      </button>
                    </div>

                    {aiEnabled && (
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">Select features to enable:</p>
                        {AI_FEATURE_OPTIONS.map((feat) => {
                          const checked = aiFeatures.includes(feat.key);
                          return (
                            <button
                              key={feat.key}
                              type="button"
                              onClick={() => setAiFeatures(checked
                                ? aiFeatures.filter(f => f !== feat.key)
                                : [...aiFeatures, feat.key]
                              )}
                              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                                checked ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                                checked ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                              }`}>
                                {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{feat.label}</p>
                                <p className="text-[11px] font-semibold text-slate-400">{feat.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setAiFeatures(AI_FEATURE_OPTIONS.map(f => f.key) as any)}
                          className="text-[11px] font-medium text-indigo-600 hover:underline text-left mt-1"
                        >
                          Select all features
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-14 px-8 rounded-2xl border border-slate-200 font-semibold text-slate-600">
                      Back
                    </Button>
                    <Button type="submit" disabled={emailOtpStep !== "verified" || createTenant.isPending || form.adminPhone.length < 10} className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-semibold shadow-lg flex gap-3">
                      {createTenant.isPending
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <><Check className="w-5 h-5 stroke-[3]" /> Deploy Institute</>}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInstitutePage;
