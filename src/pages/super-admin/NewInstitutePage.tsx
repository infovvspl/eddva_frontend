import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Loader2, Building2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

const plans = [
  { id: "starter", name: "Starter", price: "₹4,999/mo", students: 500, teachers: 10, features: ["Basic Analytics", "Email Support", "5 Batches"] },
  { id: "growth", name: "Growth", price: "₹9,999/mo", students: 1000, teachers: 25, features: ["Advanced Analytics", "Priority Support", "20 Batches", "AI Doubts"] },
  { id: "scale", name: "Scale", price: "₹19,999/mo", students: 2000, teachers: 50, features: ["Full Analytics", "Dedicated Support", "Unlimited Batches", "AI Doubts", "Battle Arena"] },
  { id: "enterprise", name: "Enterprise", price: "Custom", students: 5000, teachers: 100, features: ["Everything in Scale", "Custom Branding", "API Access", "SLA Guarantee", "On-premise Option"] },
];

const NewInstitutePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", subdomain: "", plan: "growth", billingEmail: "",
    maxStudents: 1000, maxTeachers: 25, adminPhone: "", trialDays: 14,
  });
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubdomainChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setForm({ ...form, subdomain: clean });
    if (clean.length >= 3) {
      setSubdomainStatus("checking");
      setTimeout(() => {
        setSubdomainStatus(clean === "taken" ? "taken" : "available");
      }, 800);
    } else {
      setSubdomainStatus("idle");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Institute Created!</h2>
        <p className="text-muted-foreground mb-4">{form.name} is ready at <span className="text-primary">{form.subdomain}.apexiq.in</span></p>
        <div className="card-surface p-4 mb-6 text-left">
          <p className="text-xs text-muted-foreground mb-1">Temporary Admin Password</p>
          <div className="flex items-center justify-between bg-background rounded-lg p-3">
            <code className="text-sm text-foreground font-mono">ApX@2025!temp</code>
            <button className="text-xs text-primary font-medium">Copy</button>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/super-admin/tenants")}>View All Institutes</Button>
          <Button variant="secondary" onClick={() => { setSubmitted(false); setForm({ name: "", subdomain: "", plan: "growth", billingEmail: "", maxStudents: 1000, maxTeachers: 25, adminPhone: "", trialDays: 14 }); }}>
            Create Another
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Create New Institute" subtitle="Add a new coaching centre to the platform" backPath="/super-admin/tenants" />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="card-surface p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Institute Name *</label>
              <input
                required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Elite IIT Academy"
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subdomain *</label>
              <div className="relative">
                <input
                  required value={form.subdomain} onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="elite-iit"
                  className="w-full h-10 px-3 pr-20 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">.apexiq.in</span>
                {subdomainStatus === "checking" && <Loader2 className="absolute right-24 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
                {subdomainStatus === "available" && <Check className="absolute right-24 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />}
                {subdomainStatus === "taken" && <X className="absolute right-24 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Billing Email</label>
              <input
                type="email" value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                placeholder="admin@institute.com"
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Admin Phone *</label>
              <div className="flex gap-2">
                <span className="h-10 px-3 flex items-center bg-background border border-border rounded-lg text-sm text-muted-foreground">+91</span>
                <input
                  required type="tel" maxLength={10} value={form.adminPhone}
                  onChange={(e) => setForm({ ...form, adminPhone: e.target.value.replace(/\D/g, "") })}
                  placeholder="9876543210"
                  className="flex-1 h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Max Students</label>
              <input
                type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: +e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Max Teachers</label>
              <input
                type="number" value={form.maxTeachers} onChange={(e) => setForm({ ...form, maxTeachers: +e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Trial Days</label>
              <input
                type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: +e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Plan Selector */}
        <div className="card-surface p-5">
          <h3 className="font-semibold text-foreground mb-4">Select Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((plan) => (
              <button
                key={plan.id} type="button"
                onClick={() => setForm({ ...form, plan: plan.id, maxStudents: plan.students, maxTeachers: plan.teachers })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  form.plan === plan.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-background hover:border-border-light"
                }`}
              >
                <p className="font-bold text-foreground">{plan.name}</p>
                <p className="text-lg font-bold text-primary mt-1">{plan.price}</p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Up to {plan.students.toLocaleString()} students</p>
                  <p className="text-xs text-muted-foreground">Up to {plan.teachers} teachers</p>
                </div>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate("/super-admin/tenants")}>Cancel</Button>
          <Button type="submit" disabled={submitting || !form.name || !form.subdomain || !form.adminPhone}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            Create Institute
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default NewInstitutePage;
