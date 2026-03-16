import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, Zap, Users, Bot, Swords, Lock, ArrowRight, Loader2, 
  GraduationCap, School, UserCog, ShieldCheck, Trophy, Sparkles, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, getMockUser, roleRedirectPath } from "@/lib/auth-store";
import type { UserRole } from "@/lib/types";

// Animated background gradient component
const AnimatedGradient = () => (
  <motion.div 
    className="absolute inset-0 opacity-30"
    animate={{
      background: [
        "radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
        "radial-gradient(circle at 100% 100%, rgba(20, 184, 166, 0.15) 0%, transparent 50%)",
        "radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
      ],
      transition: { duration: 10, repeat: Infinity, ease: "linear" }
    }}
  />
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = () => {
    if (phone.length < 10) return;
    setLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }, 1000);
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

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      const user = getMockUser(selectedRole);
      setUser(user);
      navigate(roleRedirectPath[selectedRole]);
    }, 1000);
  };

  const roles: { role: UserRole; label: string; icon: React.ElementType }[] = [
    { role: "student", label: "Student", icon: GraduationCap },
    { role: "teacher", label: "Teacher", icon: School },
    { role: "institute_admin", label: "Admin", icon: UserCog },
    { role: "super_admin", label: "Super", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden relative flex items-center justify-center p-4 md:p-8">
      
      <AnimatedGradient />
      
      {/* Bento Grid Layout */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
        
        {/* 1. Brand Hero Card (Top Left) */}
        <motion.div 
          className="hidden md:flex col-span-1 md:col-span-2 lg:col-span-1 lg:row-span-2 bg-white rounded-3xl p-6 flex-col justify-between border border-slate-100 shadow-sm overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-0" />
          
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">APEXIQ</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              The ultimate arena for academic excellence. AI-powered battles, real-time analytics, and global rankings.
            </p>
          </div>

          {/* <div className="relative z-10 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span class="text-xs text-slate-400">+50k active users</span>
            </div>
          </div> */}
        </motion.div>

        {/* 2. Main Login Card (Center) */}
        <motion.div 
          className="col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-lg flex flex-col justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-full max-w-md mx-auto">
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">APEXIQ</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in to access your dashboard.</p>

            {/* Role Selector - Pill Style */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Select Role
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map(({ role, label, icon: Icon }) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedRole === role
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Phone Number</label>
                <div className="flex items-center gap-2">
                  <div className="h-11 px-3 flex items-center bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter mobile number"
                    className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!otpSent ? (
                  <motion.div key="send" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button 
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all" 
                      onClick={handleSendOtp}
                      disabled={phone.length < 10 || loading}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue with OTP"}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="otp" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-2 block">Enter 6-Digit OTP</label>
                      <div className="flex gap-2 justify-between">
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
                            className="w-full aspect-square max-w-[45px] text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-slate-400">Sent to +91 {phone}</span>
                        {countdown > 0 ? (
                          <span className="text-xs text-slate-400">Resend in {countdown}s</span>
                        ) : (
                          <button onClick={() => setCountdown(30)} className="text-xs text-indigo-600 font-semibold">
                            Resend
                          </button>
                        )}
                      </div>
                    </div>

                    <Button 
                      className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl transition-colors" 
                      onClick={handleVerify}
                      disabled={otp.some(d => !d) || loading}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <Lock className="w-3 h-3" />
              <span>End-to-end encrypted connection</span>
            </div>
          </div>
        </motion.div>

        {/* 3. Stats Widget (Top Right) */}
        <motion.div 
          className="hidden lg:flex col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 flex-col justify-between border border-slate-700 shadow-lg text-white overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/20 rounded-bl-[100px] -z-0" />
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Stats</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
          </div>
          
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <div>
                <p className="text-sm font-bold">1,204</p>
                <p className="text-[10px] text-slate-400">Battles Today</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
              <Users className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-sm font-bold">892</p>
                <p className="text-[10px] text-slate-400">Online Now</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. Features Widget (Middle Right) */}
        <motion.div 
          className="hidden lg:flex col-span-1 bg-[#F0FDF4] border border-green-100 rounded-3xl p-6 flex-col justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-green-200 flex items-center justify-center mb-4 shadow-sm">
            <Trophy className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Rank #1</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Climb the leaderboard by winning AI-powered battles and quizzes.
          </p>
        </motion.div>

        {/* 5. AI Widget (Bottom Row) */}
        <motion.div 
          className="hidden md:flex col-span-1 bg-indigo-600 rounded-3xl p-6 items-center justify-between border border-indigo-500 shadow-lg shadow-indigo-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">AI Power</span>
            </div>
            <h3 className="text-lg font-bold text-white">Personalized</h3>
            <p className="text-xs text-indigo-200">Adaptive learning paths.</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        {/* 6. Battle Widget (Bottom Row) */}
        <motion.div 
          className="hidden md:flex col-span-1 bg-white border border-slate-100 rounded-3xl p-6 items-center justify-between shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Competition</span>
            <h3 className="text-lg font-bold text-slate-900">Live Battles</h3>
            <p className="text-xs text-slate-500">Challenge your friends.</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
            <Swords className="w-5 h-5 text-rose-500" />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default LoginPage;