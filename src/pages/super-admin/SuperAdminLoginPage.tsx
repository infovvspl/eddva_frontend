import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff,
  User, ShieldCheck, Zap, Server, Globe, Sparkles
} from "lucide-react";
import * as authApi from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth-store";
import edvaLogo from "@/assets/EDVA LOGO 04.png";

const INDIGO = "#4F46E5";
const VIOLET = "#7C3AED";
const SLATE_BG = "#F8FAFC";

/* ── Platform Stat Component ── */
const PlatformStat = ({ icon: Icon, label, value, delay }: { icon: any; label: string; value: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.6 }}
    className="flex items-center gap-4 group"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white shadow-sm">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">{label}</p>
      <p className="text-[18px] font-black text-slate-900 leading-tight">{value}</p>
    </div>
  </motion.div>
);

const SuperAdminLoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [email,         setEmail]        = useState("");
  const [password,      setPassword]     = useState("");
  const [showPassword,  setShowPassword] = useState(false);
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(""); setLoading(true);

    try {
      const data = await authApi.loginWithPassword({ email: email.trim(), password });
      
      // Get full user details after login
      const meData = await authApi.getMe();
      const profile = meData.user;

      if (profile.role !== "super_admin") {
        throw new Error("Unauthorized: This portal is reserved for Super Administrators.");
      }

      const userObj = {
        id: profile.id,
        name: profile.fullName || profile.name || "",
        email: profile.email || "",
        role: profile.role as "super_admin",
        avatar: profile.avatar,
        tenantId: profile.tenantId,
      };

      setUser(userObj as any);
      navigate("/super-admin");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Login failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-14 w-full rounded-2xl border-2 border-slate-100 bg-white px-6 text-[15px] font-semibold text-slate-800 outline-none transition-all placeholder:text-gray-600 focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 disabled:opacity-50 shadow-sm";

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row overflow-hidden font-sans bg-white">

      {/* ══════════ LEFT: Form Panel ══════════ */}
      <div className="relative flex w-full flex-col items-center justify-center bg-slate-50 px-8 py-16 md:w-[45%] md:px-16 lg:px-24">
        
        {/* Soft Aura */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full opacity-[0.05] blur-[100px] bg-indigo-500" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-[400px]"
        >
          {/* Logo */}
          <div className="mb-12">
            <img src={edvaLogo} alt="EDDVA" className="h-10 w-auto object-contain" />
          </div>

          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 mb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-700">Governance Portal</span>
            </div>
            <h1 className="text-[36px] font-black tracking-tight text-slate-900 leading-tight mb-2">Platform Admin</h1>
            <p className="text-[16px] font-semibold text-slate-400">Authorized access to the EDVA ecosystem.</p>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-start gap-3 overflow-hidden rounded-2xl border border-red-100 bg-red-50 px-5 py-4"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                <p className="text-[13px] font-bold text-red-700 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">
                <User className="h-3.5 w-3.5" /> Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="superadmin@edva.in"
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2 ml-1">
                <Lock className="h-3.5 w-3.5" /> Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`${inputClass} pr-14`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-[16px] font-black text-white shadow-2xl shadow-indigo-500/20 transition-all disabled:opacity-50 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${INDIGO}, ${VIOLET})` }}
            >
              {loading
                ? <><Loader2 className="h-5 w-5 animate-spin" />Securing Connection…</>
                : <>Access Dashboard <ArrowRight className="h-5 w-5" /></>}
            </motion.button>
          </form>

          <div className="mt-16 flex items-center justify-center gap-2 border-t border-slate-200/60 pt-8">
            <Globe className="h-4 w-4 text-gray-600" />
            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.2em]">Zero-Trust Security Active</p>
          </div>
        </motion.div>
      </div>

      {/* ══════════ RIGHT: Decorative Panel ══════════ */}
      <div className="relative hidden md:flex md:w-[55%] flex-col items-start justify-center overflow-hidden bg-white border-l border-slate-100 px-16 lg:px-24">
        
        {/* Animated Background Orbs */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 h-[800px] w-[800px] rounded-full opacity-[0.06] blur-[120px] bg-indigo-500" 
          />
          <div className="absolute inset-0 opacity-[0.3]"
            style={{ 
              backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`, 
              backgroundSize: "32px 32px" 
            }} 
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full"
        >
          <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-5 py-2 backdrop-blur-sm shadow-sm">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600">EDVA Cloud Infrastructure</span>
          </div>

          <h2 className="text-[48px] font-black leading-[1.1] tracking-tight text-slate-900 mb-6">
            Global Platform <br />
            <span className="text-indigo-600">Unified Governance</span>
          </h2>

          <p className="max-w-[440px] text-[18px] font-semibold leading-relaxed text-slate-400 mb-16">
            Real-time management of multitenant systems, analytics insights, and platform-wide growth.
          </p>

          <div className="grid grid-cols-2 gap-x-12 gap-y-12">
            <PlatformStat icon={Server} label="Platform Nodes" value="Active & Healthy" delay={0.3} />
            <PlatformStat icon={Zap}    label="Throughput"     value="1.2M req/sec"      delay={0.4} />
            <PlatformStat icon={Globe}  label="SLA Up-time"    value="99.99%"            delay={0.5} />
            <PlatformStat icon={ShieldCheck} label="Security Core" value="Lvl 4 Active"  delay={0.6} />
          </div>
        </motion.div>

        {/* Floating Abstract Element */}
        <div className="absolute bottom-[8%] right-[8%] opacity-[0.05]">
          <Lock className="h-96 w-96 text-indigo-900" />
        </div>
      </div>

    </div>
  );
};

export default SuperAdminLoginPage;
