import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Smartphone, Mail, MapPin, Lock, Eye, EyeOff,
  ArrowRight, Loader2, AlertCircle, CheckCircle2,
  BookOpen, Trophy, Users, Sparkles, GraduationCap,
  Hash, Home, ChevronDown, Target, Zap, ChevronLeft,
} from "lucide-react";
import edvaLogo from "@/assets/EDVA LOGO 04.png";
import loginIllustration from "@/assets/bg.png";
import { apiClient } from "@/lib/api/client";

/* ─── tokens ─────────────────────────────────────── */
const INDIGO  = "#3B82F6"; // Softer blue
const PURPLE  = "#A855F7"; // Softer purple
const CYAN    = "#06B6D4";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Delhi","Jammu and Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
];

/* ─── components ─────────────────────────────────── */

const Field = ({
  label, type = "text", value, onChange, icon, disabled, maxLength, numeric, placeholder, className = ""
}: {
  label?: string; type?: string; value: string;
  onChange: (v: string) => void; icon: React.ReactNode;
  disabled?: boolean; maxLength?: number; numeric?: boolean; placeholder?: string;
  className?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`relative group ${className}`}>
      {label && <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">{label}</label>}
      <div className={`
        flex items-center gap-3 rounded-2xl border-2 transition-all duration-300 bg-slate-50/50
        ${focused ? "border-blue-400/50 bg-white ring-8 ring-blue-500/5" : "border-slate-100/50 hover:border-slate-200"}
      `}>
        <div className={`pl-4 transition-colors duration-300 ${focused ? "text-blue-500" : "text-gray-600"}`}>
          {icon}
        </div>
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => onChange(numeric ? e.target.value.replace(/\D/g, "") : e.target.value)}
          className="w-full bg-transparent px-2 py-4 text-[15px] font-semibold text-slate-800 outline-none placeholder:text-gray-600 disabled:opacity-50"
        />
      </div>
    </div>
  );
};

const PwField = ({
  label, value, onChange, disabled, placeholder
}: { label?: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative group">
      {label && <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">{label}</label>}
      <div className={`
        flex items-center gap-3 rounded-2xl border-2 transition-all duration-300 bg-slate-50/50
        ${focused ? "border-blue-400/50 bg-white ring-8 ring-blue-500/5" : "border-slate-100/50 hover:border-slate-200"}
      `}>
        <div className={`pl-4 transition-colors ${focused ? "text-blue-500" : "text-gray-600"}`}>
          <Lock className="h-4 w-4" />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent px-2 py-4 text-[15px] font-semibold text-slate-800 outline-none placeholder:text-gray-600 disabled:opacity-50"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="pr-4 text-gray-600 hover:text-slate-600 transition-colors flex-shrink-0">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

const ActionButton = ({
  children, onClick, type = "button", disabled, variant = "primary"
}: { children: React.ReactNode; onClick?: () => void; type?: "button"|"submit"; disabled?: boolean; variant?: "primary"|"secondary" }) => (
  <motion.button
    type={type}
    disabled={disabled}
    onClick={onClick}
    whileHover={{ scale: 1.01, y: -2 }}
    whileTap={{ scale: 0.99 }}
    className={`
      relative h-14 w-full overflow-hidden rounded-2xl text-[16px] font-black transition-all shadow-xl disabled:opacity-50
      ${variant === "primary" ? "text-white" : "text-slate-400 bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-100"}
    `}
    style={variant === "primary" ? { background: `linear-gradient(135deg, ${INDIGO}, ${PURPLE})` } : {}}
  >
    {variant === "primary" && (
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_2s_infinite]" />
    )}
    <span className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </span>
  </motion.button>
);

const StatCard = ({
  icon, label, value, color, delay
}: { icon: React.ReactNode; label: string; value: string; color: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
    className="flex items-center gap-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white px-5 py-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-xl font-bold" style={{ backgroundColor: color + "15", color }}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">{label}</p>
      <p className="text-[16px] font-black text-slate-900">{value}</p>
    </div>
  </motion.div>
);

/* ════════════════════════════════════════════════════ */
const StudentRegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const [form, setForm] = useState({
    name: "", careOf: "", phone: "", altPhone: "",
    email: "", address: "", postOffice: "", city: "",
    landmark: "", state: "Gujarat", pinCode: "",
    password: "", confirmPassword: "",
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const pwStrengthValue = (pw: string) => {
    let s = 0;
    if (pw.length >= 8)         s++;
    if (/[A-Z]/.test(pw))       s++;
    if (/[0-9]/.test(pw))       s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return [
      { label: "",       color: "#E2E8F0", score: 0 },
      { label: "Weak",   color: "#EF4444", score: 1 },
      { label: "Fair",   color: "#F59E0B", score: 2 },
      { label: "Good",   color: "#3B82F6", score: 3 },
      { label: "Strong", color: "#10B981", score: 4 },
    ][s];
  };

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!form.name.trim()) return "Full name is required.";
      if (!form.careOf.trim()) return "Parent/Guardian name is required.";
      if (!form.email.includes("@")) return "Enter a valid email address.";
      return null;
    }
    if (s === 2) {
      if (form.phone.length < 10) return "Enter a valid 10-digit phone number.";
      if (form.altPhone.length < 10) return "Enter a valid 10-digit alternate phone number.";
      if (!form.address.trim()) return "Address is required.";
      if (!form.postOffice.trim()) return "Post office is required.";
      if (!form.city.trim()) return "City is required.";
      if (!form.landmark.trim()) return "Landmark / Tehsil is required.";
      if (form.pinCode.length < 6) return "Enter a valid 6-digit pin code.";
      return null;
    }
    if (s === 3) {
      if (form.password.length < 8) return "Password must be at least 8 characters.";
      if (form.password !== form.confirmPassword) return "Passwords do not match.";
      return null;
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    setDirection(1);
    setStep(s => s + 1);
  };

  const prevStep = () => { setError(""); setDirection(-1); setStep(s => s - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(3);
    if (err) { setError(err); return; }
    setError(""); setLoading(true);
    try {
      await apiClient.post("/auth/register", {
        fullName:               form.name,
        careOf:                 form.careOf,
        phoneNumber:            `+91${form.phone}`,
        alternatePhoneNumber:   `+91${form.altPhone}`,
        email:                  form.email,
        address:                form.address,
        postOffice:             form.postOffice,
        city:                   form.city,
        landmark:               form.landmark,
        state:                  form.state,
        pinCode:                form.pinCode,
        password:               form.password,
      });
      setSuccess(true);
      const loginUrl = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";
      setTimeout(() => navigate(loginUrl), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">

      {/* ════════ LEFT — FORM ════════ */}
      <div className="relative flex w-full flex-col items-center justify-center bg-slate-50 px-8 py-16 md:w-[50%] lg:px-24">

        {/* decorative orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 h-[400px] w-[400px] rounded-full opacity-[0.03] blur-[80px]" style={{ background: INDIGO }} />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-[0.03] blur-[80px]" style={{ background: PURPLE }} />
        </div>

        <div className="relative w-full max-w-[480px]">

          {/* Logo */}
          <div className="mb-10 flex items-center justify-between">
            <img src={edvaLogo} alt="EDDVA" className=" object-contain cursor-pointer" onClick={() => navigate("/")} />
            <Link to="/login" className="text-[13px] font-black text-blue-600 uppercase tracking-wider hover:underline underline-offset-4">
              Sign In
            </Link>
          </div>

          {!success && (
            <div className="mb-8">
              <h1 className="text-[36px] font-black tracking-tight text-slate-900 leading-tight mb-2">
                {step === 1 ? "Get Started" : step === 2 ? "Your Location" : "Secure Account"}
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-[15px] font-semibold text-slate-400">Step {step} of 3</p>
                <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden flex">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{
                        width: i <= step ? "33.33%" : "0%",
                        backgroundColor: i <= step ? INDIGO : "#E2E8F0"
                      }}
                      className="h-full border-r border-white last:border-0"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="relative min-h-[360px]">
            <AnimatePresence mode="wait" custom={direction}>
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center pt-8"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-500 shadow-2xl shadow-emerald-100">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h2 className="text-[28px] font-black text-slate-900 leading-tight">Welcome Aboard!</h2>
                  <p className="mt-2 text-slate-400 font-semibold">
                    Registration complete. Redirecting you to login...
                  </p>
                  <div className="mt-8 flex items-center gap-2 text-emerald-600 font-black text-xs bg-emerald-50 px-5 py-2.5 rounded-2xl">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    SYNCING ACCOUNT...
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="w-full"
                >
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 border-2 border-red-100/50 px-5 py-4 text-red-600">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-[14px] font-black uppercase tracking-tight leading-tight">{error}</p>
                    </motion.div>
                  )}

                  <div className="space-y-5">
                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                      <>
                        <Field icon={<User className="h-5 w-5" />} label="Full Name" placeholder="Rahul Sharma" value={form.name} onChange={set("name")} disabled={loading} />
                        <Field icon={<Users className="h-5 w-5" />} label="Parent / Guardian" placeholder="Father's or Mother's Name" value={form.careOf} onChange={set("careOf")} disabled={loading} />
                        <Field icon={<Mail className="h-5 w-5" />} label="Email Address" type="email" placeholder="rahul@example.com" value={form.email} onChange={set("email")} disabled={loading} />
                      </>
                    )}

                    {/* STEP 2: LOCATION & CONTACT */}
                    {step === 2 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <Field icon={<Smartphone className="h-5 w-5" />} label="Mobile *" placeholder="9876543210" value={form.phone} onChange={set("phone")} numeric maxLength={10} disabled={loading} />
                          <Field icon={<Smartphone className="h-5 w-5" />} label="Alt. Mobile *" placeholder="9876543210" value={form.altPhone} onChange={set("altPhone")} numeric maxLength={10} disabled={loading} />
                        </div>
                        <Field icon={<Home className="h-5 w-5" />} label="Address *" placeholder="Building, Street, Area" value={form.address} onChange={set("address")} disabled={loading} />
                        <div className="grid grid-cols-2 gap-4">
                          <Field icon={<MapPin className="h-5 w-5" />} label="Post Office *" placeholder="Post Office" value={form.postOffice} onChange={set("postOffice")} disabled={loading} />
                          <Field icon={<MapPin className="h-5 w-5" />} label="City *" placeholder="City" value={form.city} onChange={set("city")} disabled={loading} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Field icon={<MapPin className="h-5 w-5" />} label="Landmark / Tehsil *" placeholder="Landmark" value={form.landmark} onChange={set("landmark")} disabled={loading} />
                          <Field icon={<Hash className="h-5 w-5" />} label="PIN Code *" placeholder="6-digit" value={form.pinCode} onChange={set("pinCode")} numeric maxLength={6} disabled={loading} />
                        </div>
                        <div className="relative group">
                          <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">State</label>
                          <div className="flex items-center gap-3 rounded-2xl border-2 border-slate-100/50 bg-slate-50/50 px-4 py-3.5">
                            <MapPin className="h-5 w-5 text-gray-600" />
                            <select value={form.state} onChange={e => set("state")(e.target.value)}
                              className="w-full bg-transparent text-[15px] font-semibold text-slate-800 outline-none appearance-none cursor-pointer">
                              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* STEP 3: SECURITY */}
                    {step === 3 && (
                      <div className="space-y-6">
                        <div>
                          <PwField label="Create Password" placeholder="Min 8 characters" value={form.password} onChange={set("password")} disabled={loading} />
                          {form.password.length > 0 && (
                            <div className="mt-4 px-1">
                              <div className="flex gap-1.5 mb-2">
                                {[1,2,3,4].map(i => (
                                  <div key={i} className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: i <= pwStrengthValue(form.password).score ? "100%" : "0%" }}
                                      className="h-full"
                                      style={{ backgroundColor: pwStrengthValue(form.password).color }}
                                    />
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: pwStrengthValue(form.password).color }}>
                                {pwStrengthValue(form.password).label} SECURITY Level
                              </p>
                            </div>
                          )}
                        </div>
                        <PwField label="Confirm Password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} disabled={loading} />
                        {form.confirmPassword && (
                          <div className={`flex items-center gap-2 px-1 text-[12px] font-black uppercase tracking-tight ${form.password === form.confirmPassword ? "text-emerald-500" : "text-red-500"}`}>
                            {form.password === form.confirmPassword ? <><CheckCircle2 className="h-4 w-4" /> Passwords Synchronized</> : <><AlertCircle className="h-4 w-4" /> Mismatched Passwords</>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-10 flex items-center gap-4">
                    {step > 1 && (
                      <button onClick={prevStep} disabled={loading}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-slate-100 text-gray-600 hover:text-blue-500 hover:border-blue-100 transition-all">
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    )}
                    <div className="flex-1">
                      {step < 3 ? (
                        <ActionButton onClick={nextStep}>
                          Continue <ArrowRight className="h-5 w-5" />
                        </ActionButton>
                      ) : (
                        <ActionButton type="submit" onClick={handleSubmit} disabled={loading || form.password !== form.confirmPassword}>
                          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Finalizing...</> : <><GraduationCap className="h-5 w-5" /> Complete Registration</>}
                        </ActionButton>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-12 text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-800">
            Secure AI Engine • EDDVA v2.0
          </p>

        </div>
      </div>

      {/* ════════ RIGHT — VISUAL ════════ */}
      <div className="relative hidden md:flex md:w-[50%] flex-col items-center justify-center overflow-hidden bg-white border-l border-slate-100">

        {/* Dynamic Aura Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, -45, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] right-[-10%] h-[700px] w-[700px] rounded-full opacity-[0.07] blur-[120px]"
            style={{ background: INDIGO }} />
          <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 15, repeat: Infinity, delay: 2, ease: "easeInOut" }}
            className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full opacity-[0.05] blur-[100px]"
            style={{ background: PURPLE }} />
          
          {/* subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.3]"
            style={{ 
              backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`, 
              backgroundSize: "32px 32px" 
            }} 
          />
        </div>

        {/* Floating Metrics */}
        <div className="absolute top-[8%] left-12 flex flex-col gap-5 z-20">
          <StatCard icon={<Zap className="h-5 w-5"/>}    label="AI Power" value="+42% Speed" color="#FACC15" delay={0.4} />
          <StatCard icon={<Target className="h-5 w-5"/>} label="Accuracy" value="96.8%"      color={INDIGO} delay={0.5} />
        </div>
        <div className="absolute bottom-[10%] right-12 z-20">
          <StatCard icon={<Trophy className="h-5 w-5"/>} label="Global Rank" value="#1 Rate"  color={PURPLE} delay={0.6} />
        </div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
           className="relative z-10 w-full flex flex-col items-center px-12 text-center"
        >
          {/* Main Visual with Floating Animation */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mb-10 flex justify-center"
          >
            <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full scale-110" />
            <img src={loginIllustration} alt="Learning" 
              className="relative z-10 w-[110%] h-auto max-h-[460px] object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.1)]" />
          </motion.div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-5 py-2 backdrop-blur-sm shadow-sm ring-4 ring-blue-500/5">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Aero Smart Engine</span>
          </div>

          <h1 className="text-[38px] font-black leading-[1.1] tracking-tight text-slate-900 mb-4 px-2">
            Elevate Your <br/>
            <span className="text-blue-600">Learning Journey</span>
          </h1>

          <p className="max-w-[360px] text-[16px] font-semibold leading-relaxed text-slate-400">
            Secure your spot in the future of AI-driven education across India.
          </p>
        </motion.div>
      </div>

    </div>
  );
};

export default StudentRegisterPage;
