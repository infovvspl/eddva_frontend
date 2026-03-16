import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Building2, Zap, ArrowRight, Copy, Phone, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { id: "starter", name: "Starter", price: "₹4,999", students: 500, teachers: 10, color: "bg-slate-50 text-slate-600", features: ["Basic Analytics", "Email Support", "5 Batches"] },
  { id: "growth", name: "Growth", price: "₹9,999", students: 1000, teachers: 25, color: "bg-sky-50 text-sky-600", features: ["Advanced Analytics", "Priority Support", "20 Batches", "AI Doubts"] },
  { id: "scale", name: "Scale", price: "₹19,999", students: 2000, teachers: 50, color: "bg-indigo-50 text-indigo-600", features: ["Full Analytics", "Dedicated Support", "Unlimited Batches", "AI Doubts"] },
  { id: "enterprise", name: "Enterprise", price: "Custom", students: 5000, teachers: 100, color: "bg-purple-50 text-purple-600", features: ["Custom Branding", "API Access", "SLA Guarantee", "On-premise"] },
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
      setTimeout(() => setSubdomainStatus(clean === "taken" ? "taken" : "available"), 800);
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
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-[24px] bg-emerald-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Registration Successful!</h2>
          <p className="text-slate-500 font-medium mb-8">
            <span className="text-indigo-600 font-bold">{form.name}</span> has been provisioned at <br/>
            <span className="underline decoration-indigo-200">{form.subdomain}.apexiq.in</span>
          </p>
          
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm mb-8 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Temporary Credentials</p>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between group">
              <code className="text-sm font-bold text-slate-700 font-mono">ApX@2026!temp</code>
              <button className="p-2 hover:bg-white rounded-lg transition-all text-indigo-600">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/super-admin/tenants")} className="h-14 rounded-2xl bg-slate-900 font-bold text-white w-full">
              Go to Dashboard
            </Button>
            <Button variant="ghost" onClick={() => setSubmitted(false)} className="text-slate-400 font-bold">
              Create another institute
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-4 transition-colors">
            <X className="w-4 h-4" /> Cancel Registration
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">New Institute</h1>
          <p className="text-slate-500 font-medium">Onboard a new educational partner to the ecosystem.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Identity */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Identity & Access</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Institute Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Quantum Academy"
                    className="w-full h-14 pl-12 pr-4 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Subdomain</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    required value={form.subdomain} onChange={(e) => handleSubdomainChange(e.target.value)}
                    placeholder="quantum"
                    className="w-full h-14 pl-12 pr-28 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 uppercase">.apexiq.in</span>
                    {subdomainStatus === "checking" && <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />}
                    {subdomainStatus === "available" && <Check className="w-4 h-4 text-emerald-500" />}
                    {subdomainStatus === "taken" && <X className="w-4 h-4 text-rose-500" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Plan Selection */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Subscription Model</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id} type="button"
                  onClick={() => setForm({ ...form, plan: plan.id, maxStudents: plan.students, maxTeachers: plan.teachers })}
                  className={`p-6 rounded-[28px] text-left transition-all relative overflow-hidden border ${
                    form.plan === plan.id 
                    ? "bg-slate-900 border-slate-900 shadow-xl shadow-slate-200 -translate-y-1" 
                    : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${form.plan === plan.id ? "text-slate-400" : "text-slate-400"}`}>{plan.name}</p>
                  <p className={`text-xl font-black ${form.plan === plan.id ? "text-white" : "text-slate-900"}`}>{plan.price}</p>
                  <div className={`mt-4 space-y-2 ${form.plan === plan.id ? "text-slate-300" : "text-slate-500"}`}>
                    {plan.features.slice(0, 3).map(f => (
                      <div key={f} className="flex items-center gap-2 text-[10px] font-bold">
                        <Check className={`w-3 h-3 ${form.plan === plan.id ? "text-indigo-400" : "text-indigo-500"}`} /> {f}
                      </div>
                    ))}
                  </div>
                  {form.plan === plan.id && <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-white/5 rotate-12" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Contact & Limits */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="email" value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} className="w-full h-14 pl-12 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-bold focus:bg-white outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Admin Phone</label>
                <div className="relative group flex gap-2">
                  <div className="h-14 w-16 bg-slate-50/50 border border-slate-100 rounded-[20px] flex items-center justify-center text-sm font-black text-slate-400">+91</div>
                  <input type="tel" value={form.adminPhone} onChange={(e) => setForm({ ...form, adminPhone: e.target.value })} className="flex-1 h-14 px-5 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-bold focus:bg-white outline-none" />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50/50 rounded-[24px] p-6 space-y-4 border border-dashed border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resource Allocation</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Students</p>
                  <p className="text-xl font-black text-slate-900">{form.maxStudents.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Teachers</p>
                  <p className="text-xl font-black text-slate-900">{form.maxTeachers}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Trial Period</p>
                  <p className="text-xl font-black text-slate-900">{form.trialDays} Days</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pb-10">
             <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="font-bold text-slate-400 hover:text-slate-900">
              Discard
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !form.name || !form.subdomain}
              className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] font-black shadow-xl shadow-indigo-100 transition-all flex gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 stroke-[3]" /> Deploy Institute</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInstitutePage;