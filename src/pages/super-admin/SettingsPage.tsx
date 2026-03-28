import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, Globe, Shield, Bell, CreditCard, Palette, 
  Mail, Save, Check, ShieldCheck, Zap, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const sections = [
    { id: "general", label: "General", icon: Settings, desc: "Platform identity & trials" },
    { id: "branding", label: "Branding", icon: Palette, desc: "Logos, colors & taglines" },
    { id: "notifications", label: "Notifications", icon: Bell, desc: "System & email alerts" },
    { id: "security", label: "Security", icon: Shield, desc: "Auth & access control" },
    { id: "billing", label: "Billing", icon: CreditCard, desc: "Gateways & invoicing" },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
            <p className="text-slate-500 font-medium">Configure the global EDVA ecosystem</p>
          </div>
          <Button 
            onClick={handleSave}
            className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            {isSaving ? <Zap className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-[24px] transition-all text-left ${
                  activeSection === s.id
                    ? "bg-white shadow-sm border border-slate-100 ring-1 ring-slate-100"
                    : "hover:bg-slate-100/50 text-slate-400"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  activeSection === s.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-black uppercase tracking-tight ${activeSection === s.id ? "text-slate-900" : "text-slate-500"}`}>
                    {s.label}
                  </p>
                  <p className="text-[11px] font-medium opacity-70">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Settings Content Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm"
              >
                {activeSection === "general" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Platform Name</label>
                        <input defaultValue="EDVA" className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Support Email</label>
                        <input defaultValue="support@edva.in" className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-500" /> Advanced Modules
                      </h4>
                      <div className="grid gap-3">
                        {[
                          { label: "Battle Arena", desc: "Gamified peer-to-peer testing", enabled: true },
                          { label: "AI Doubt Resolution", desc: "LLM-powered academic support", enabled: true },
                          { label: "Maintenance Mode", desc: "Lock platform for updates", enabled: false, warning: true },
                        ].map((toggle) => (
                          <div key={toggle.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                            <div>
                              <p className="text-sm font-black text-slate-800">{toggle.label}</p>
                              <p className="text-[11px] font-medium text-slate-500">{toggle.desc}</p>
                            </div>
                            <button
                              className={`w-12 h-6 rounded-full transition-all relative ${
                                toggle.enabled ? (toggle.warning ? "bg-rose-500" : "bg-indigo-600") : "bg-slate-200"
                              }`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${toggle.enabled ? "left-7" : "left-1"}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "branding" && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Brand Color</label>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 shadow-inner" />
                        <input defaultValue="#6366F1" className="flex-1 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-bold focus:bg-white outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Platform Logo</label>
                      <div className="border-2 border-dashed border-slate-100 rounded-[24px] p-12 flex flex-col items-center justify-center bg-slate-50 group hover:bg-white hover:border-indigo-200 transition-all cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                          <Palette className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Upload New Asset</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">SVG or Transparent PNG (Max 5MB)</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "security" && (
                  <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-xs font-bold text-amber-700 leading-tight">
                        Security changes will log out all current super-admin sessions immediately.
                      </p>
                    </div>
                    {[
                      { label: "Two-Factor Auth", desc: "Require TOTP for all staff", enabled: true, icon: ShieldCheck },
                      { label: "IP Lockdown", desc: "Access only from office range", enabled: false, icon: Globe },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
                         <div className="flex items-center gap-3">
                           <item.icon className="w-5 h-5 text-slate-400" />
                           <div>
                              <p className="text-sm font-black text-slate-800">{item.label}</p>
                              <p className="text-[11px] font-medium text-slate-400">{item.desc}</p>
                           </div>
                         </div>
                         <button className={`w-12 h-6 rounded-full transition-all relative ${item.enabled ? "bg-indigo-600" : "bg-slate-200"}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.enabled ? "left-7" : "left-1"}`} />
                         </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Billing Section Placeholder */}
                {activeSection === "billing" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Gateway</label>
                        <select className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none appearance-none">
                          <option>Razorpay Premium</option>
                          <option>Stripe Connect</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Currency</label>
                        <select className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none appearance-none">
                          <option>INR (₹) - Rupee</option>
                          <option>USD ($) - Dollar</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Success Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 z-50 border border-slate-700"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white stroke-[4]" />
            </div>
            <p className="text-sm font-bold">Configurations updated successfully</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;