import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Loader2, Building2, Zap, Mail, Globe, Copy, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTenant } from "@/hooks/use-tenants";
import { sendOnboardingOtp, verifyOnboardingOtp } from "@/lib/api/public-tenant";

const plans = [
  { id: "starter", name: "Starter", price: "₹4,999", students: 500, teachers: 10, features: ["Basic Analytics", "Email Support", "5 Batches"] },
  { id: "growth", name: "Growth", price: "₹9,999", students: 1000, teachers: 25, features: ["Advanced Analytics", "Priority Support", "20 Batches", "AI Doubts"] },
  { id: "scale", name: "Scale", price: "₹19,999", students: 2000, teachers: 50, features: ["Full Analytics", "Dedicated Support", "Unlimited Batches", "AI Doubts"] },
  { id: "enterprise", name: "Enterprise", price: "Custom", students: 5000, teachers: 100, features: ["Custom Branding", "API Access", "SLA Guarantee", "On-premise"] },
];

const NewInstitutePage = () => {
  const navigate = useNavigate();
  const createTenant = useCreateTenant();
  const [form, setForm] = useState({
    name: "", subdomain: "", plan: "growth", billingEmail: "",
    maxStudents: 1000, maxTeachers: 25, adminPhone: "", trialDays: 14,
  });
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // OTP verification state
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

  // Reset OTP state when phone number changes
  useEffect(() => {
    if (form.adminPhone !== verifiedPhone.replace("+91", "")) {
      setOtpStep("idle");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
    }
  }, [form.adminPhone, verifiedPhone]);

  const fullAdminPhone = `+91${form.adminPhone}`;

  const handleSendOtp = async () => {
    if (form.adminPhone.length < 10) return;
    setOtpError("");
    setOtpLoading(true);
    try {
      await sendOnboardingOtp(fullAdminPhone);
      setOtpStep("sent");
      setOtpCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "Failed to send OTP.";
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setOtpLoading(true);
    try {
      await sendOnboardingOtp(fullAdminPhone);
      setOtpCountdown(30);
    } catch {
      setOtpError("Failed to resend OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpLoading(true);
    try {
      await verifyOnboardingOtp(fullAdminPhone, otp.join(""));
      setOtpStep("verified");
      setVerifiedPhone(fullAdminPhone);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "Invalid OTP.";
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpStep !== "verified") {
      setError("Please verify the admin phone number first.");
      return;
    }
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
      const msg = (err as any)?.response?.data?.message || "Failed to create institute. Please try again.";
      setError(msg);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    const tempPassword = result?.tempPassword || "—";
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-[24px] bg-emerald-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground font-medium mb-8">
            <span className="text-primary font-bold">{form.name}</span> has been provisioned at <br />
            <span className="underline decoration-primary/30">{form.subdomain}.edva.in</span>
          </p>

          <div className="bg-card border border-border rounded-[32px] p-6 shadow-sm mb-8 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Temporary Credentials</p>
            <div className="bg-secondary rounded-2xl p-4 flex items-center justify-between group">
              <code className="text-sm font-bold text-foreground font-mono">{tempPassword}</code>
              <button onClick={() => handleCopy(tempPassword)} className="p-2 hover:bg-background rounded-lg transition-all text-primary">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-500 font-bold mt-2">Copied!</p>}
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/super-admin/tenants")} className="h-14 rounded-2xl bg-foreground text-background font-bold w-full">
              Go to Dashboard
            </Button>
            <Button variant="ghost" onClick={() => { setSubmitted(false); setResult(null); setOtpStep("idle"); setOtp(["", "", "", "", "", ""]); setVerifiedPhone(""); setForm({ name: "", subdomain: "", plan: "growth", billingEmail: "", maxStudents: 1000, maxTeachers: 25, adminPhone: "", trialDays: 14 }); }} className="text-muted-foreground font-bold">
              Create another institute
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4 transition-colors">
            <X className="w-4 h-4" /> Cancel Registration
          </button>
          <h1 className="text-4xl font-black text-foreground tracking-tight">New Institute</h1>
          <p className="text-muted-foreground font-medium">Onboard a new educational partner to the ecosystem.</p>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identity */}
          <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-foreground text-lg uppercase tracking-tight">Identity & Access</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Institute Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Quantum Academy" className="w-full h-14 pl-12 pr-4 bg-secondary/50 border border-border rounded-[20px] text-sm font-bold text-foreground focus:bg-background focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subdomain</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                  <input required value={form.subdomain} onChange={(e) => handleSubdomainChange(e.target.value)} placeholder="quantum" className="w-full h-14 pl-12 pr-28 bg-secondary/50 border border-border rounded-[20px] text-sm font-bold text-foreground focus:bg-background focus:border-primary outline-none transition-all" />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground/50 uppercase">.edva.in</span>
                    {subdomainStatus === "checking" && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                    {subdomainStatus === "available" && <Check className="w-4 h-4 text-emerald-500" />}
                    {subdomainStatus === "taken" && <X className="w-4 h-4 text-rose-500" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-4">Subscription Model</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id} type="button"
                  onClick={() => setForm({ ...form, plan: plan.id, maxStudents: plan.students, maxTeachers: plan.teachers })}
                  className={`p-6 rounded-[28px] text-left transition-all relative overflow-hidden border ${
                    form.plan === plan.id
                      ? "bg-foreground border-foreground shadow-xl -translate-y-1"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${form.plan === plan.id ? "text-background/60" : "text-muted-foreground"}`}>{plan.name}</p>
                  <p className={`text-xl font-black ${form.plan === plan.id ? "text-background" : "text-foreground"}`}>{plan.price}</p>
                  <div className={`mt-4 space-y-2 ${form.plan === plan.id ? "text-background/60" : "text-muted-foreground"}`}>
                    {plan.features.slice(0, 3).map(f => (
                      <div key={f} className="flex items-center gap-2 text-[10px] font-bold">
                        <Check className={`w-3 h-3 ${form.plan === plan.id ? "text-primary" : "text-primary"}`} /> {f}
                      </div>
                    ))}
                  </div>
                  {form.plan === plan.id && <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-background/5 rotate-12" />}
                </button>
              ))}
            </div>
          </div>

          {/* Contact & Phone Verification */}
          <div className="bg-card p-8 rounded-[32px] border border-border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Billing Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input type="email" required value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} className="w-full h-14 pl-12 bg-secondary/50 border border-border rounded-[20px] text-sm font-bold text-foreground focus:bg-background outline-none" />
                </div>
              </div>

              {/* Admin Phone with OTP */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Admin Phone
                  {otpStep === "verified" && (
                    <span className="ml-2 text-emerald-500 normal-case tracking-normal font-bold">Verified</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <div className="h-14 w-16 bg-secondary/50 border border-border rounded-[20px] flex items-center justify-center text-sm font-black text-muted-foreground">+91</div>
                  <input
                    type="tel"
                    required
                    value={form.adminPhone}
                    onChange={(e) => setForm({ ...form, adminPhone: e.target.value.replace(/\D/g, "") })}
                    maxLength={10}
                    disabled={otpStep === "verified"}
                    className="flex-1 h-14 px-5 bg-secondary/50 border border-border rounded-[20px] text-sm font-bold text-foreground focus:bg-background outline-none disabled:opacity-60"
                  />
                  {otpStep === "verified" && (
                    <div className="h-14 w-14 bg-emerald-500/10 border border-emerald-500/30 rounded-[20px] flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                </div>

                {/* OTP Error */}
                {otpError && (
                  <div className="flex items-center gap-2 text-xs text-destructive font-medium">
                    <AlertCircle className="w-3 h-3" /> {otpError}
                  </div>
                )}

                {/* Send OTP button */}
                {otpStep === "idle" && form.adminPhone.length === 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="h-10 w-full rounded-2xl font-bold text-xs"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send Verification OTP
                  </Button>
                )}

                {/* OTP input */}
                {otpStep === "sent" && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
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
                          onKeyDown={(e) => {
                            handleOtpKeyDown(i, e);
                            if (e.key === "Enter" && otp.every(d => d)) handleVerifyOtp();
                          }}
                          disabled={otpLoading}
                          className="aspect-square w-full max-w-[44px] rounded-xl border border-border bg-secondary text-center text-lg font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Sent to +91 {form.adminPhone}</span>
                      {otpCountdown > 0 ? (
                        <span className="text-[10px] text-muted-foreground">Resend in {otpCountdown}s</span>
                      ) : (
                        <button type="button" onClick={handleResendOtp} disabled={otpLoading} className="text-[10px] font-bold text-primary hover:text-primary/80 disabled:opacity-50">
                          Resend
                        </button>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otp.some(d => !d) || otpLoading}
                      className="h-10 w-full rounded-2xl font-bold text-xs"
                    >
                      {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Phone"}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="bg-secondary/50 rounded-[24px] p-6 space-y-4 border border-dashed border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resource Allocation</p>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-bold text-muted-foreground mb-1">Students</p><p className="text-xl font-black text-foreground">{form.maxStudents.toLocaleString()}</p></div>
                <div><p className="text-xs font-bold text-muted-foreground mb-1">Teachers</p><p className="text-xl font-black text-foreground">{form.maxTeachers}</p></div>
                <div><p className="text-xs font-bold text-muted-foreground mb-1">Trial Period</p><p className="text-xl font-black text-foreground">{form.trialDays} Days</p></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pb-10">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="font-bold text-muted-foreground hover:text-foreground">Discard</Button>
            <Button
              type="submit"
              disabled={createTenant.isPending || !form.name || !form.subdomain || !form.billingEmail || !form.adminPhone || otpStep !== "verified"}
              className="h-14 px-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[20px] font-black shadow-xl transition-all flex gap-2"
            >
              {createTenant.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 stroke-[3]" /> Deploy Institute</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInstitutePage;
