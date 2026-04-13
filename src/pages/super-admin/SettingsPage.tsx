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
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-10">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-2">Protocol Management</h2>
            <h1 className="text-[42px] font-black text-slate-900 tracking-tight leading-tight">System Settings</h1>
            <p className="text-slate-400 text-[17px] mt-1 font-semibold">Configuring the global parameters of the educational network</p>
          </div>
          <Button 
            onClick={handleSave}
            className="h-14 px-8 bg-white text-gray-900 rounded-[20px] font-black flex gap-3 shadow-2xl hover:bg-gray-100 transition-all text-[15px]"
          >
            {isSaving ? <Zap className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 stroke-[2.5]" />}
            Execute Sync
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-3">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-5 p-5 rounded-[28px] transition-all text-left border-2 ${
                  activeSection === s.id
                    ? "bg-white border-slate-100 shadow-xl shadow-slate-200/40"
                    : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-100 text-slate-400"
                }`}
              >
                <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-all ${
                  activeSection === s.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-white text-gray-600 border border-slate-100"
                }`}>
                  <s.icon className={`w-6 h-6 ${activeSection === s.id ? 'stroke-[2.5]' : ''}`} />
                </div>
                <div>
                  <p className={`text-[13px] font-black uppercase tracking-tight ${activeSection === s.id ? "text-slate-900" : "text-slate-500"}`}>
                    {s.label}
                  </p>
                  <p className="text-[11px] font-bold opacity-50 mt-0.5">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Settings Content Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-100 rounded-[44px] p-10 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/20 blur-[60px] translate-x-12 -translate-y-12 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <div className="space-y-10 relative z-10">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Primary Core Color</label>
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[24px] bg-indigo-600 shadow-xl shadow-indigo-600/20" />
                        <div className="flex-1">
                          <input defaultValue="#6366F1" className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-[20px] text-[16px] font-mono font-black text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all shadow-sm" />
                          <p className="text-[10px] font-bold text-slate-400 mt-2 ml-2 uppercase tracking-tight">Standard Platform Primary HEX</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Legacy Asset Management</label>
                      <div className="border-2 border-dashed border-slate-100 rounded-[32px] p-12 flex flex-col items-center justify-center bg-slate-50/50 group/upload hover:bg-white hover:border-indigo-600 transition-all cursor-pointer">
                        <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-gray-600 mb-6 group-hover/upload:scale-110 group-hover/upload:text-indigo-600 transition-all">
                          <Palette className="w-8 h-8" />
                        </div>
                        <p className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Update Primary Logo</p>
                        <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-tight">SVG • PNG • WEBP (MAX 10MB)</p>
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
            className="fixed bottom-8 right-8 bg-white text-gray-900 px-6 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 z-50 border border-gray-200"
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
