import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Shield, Zap, Users, Bot, Swords, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, getMockUser, roleRedirectPath } from "@/lib/auth-store";
import type { UserRole } from "@/lib/types";

const AnimatedCounter = ({ target, suffix = "" }: { target: string; suffix?: string }) => {
  return (
    <span className="text-2xl font-bold text-foreground">
      {target}{suffix}
    </span>
  );
};

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
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
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

  const stats = [
    { label: "Students", value: "50K+", icon: Users },
    { label: "AI Services", value: "12", icon: Bot },
    { label: "Battles", value: "1M+", icon: Swords },
  ];

  const roles: { role: UserRole; label: string }[] = [
    { role: "student", label: "Student" },
    { role: "teacher", label: "Teacher" },
    { role: "institute_admin", label: "Institute Admin" },
    { role: "super_admin", label: "Super Admin" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-10 bg-background">
        {/* Glow effect */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-ai/5 blur-[100px]" />
        
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-extrabold text-foreground tracking-tight">APEXIQ</span>
          </div>
        </div>

        {/* Main copy */}
        <motion.div 
          className="relative z-10 max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-5xl font-extrabold leading-tight">
            <span className="text-gradient-brand">Fight. Learn.</span>
            <br />
            <span className="text-foreground">Rank.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-md">
            India's AI-powered battle platform for JEE & NEET aspirants. Compete, learn, and rise to the top.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="relative z-10 flex gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <AnimatedCounter target={stat.value} />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-card">
        <motion.div 
          className="w-full max-w-sm"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold">APEXIQ</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
          <p className="text-muted-foreground mt-1 mb-6">Sign in to continue your journey</p>

          {/* Role selector (demo) */}
          <div className="mb-6">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Demo: Select Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(({ role, label }) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    selectedRole === role
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-border-light"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
              <div className="flex items-center gap-2">
                <div className="h-10 px-3 flex items-center bg-background border border-border rounded-lg text-sm text-muted-foreground">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 10-digit number"
                  className="flex-1 h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!otpSent ? (
                <motion.div key="send" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleSendOtp}
                    disabled={phone.length < 10 || loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                    Send OTP
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
                    <label className="text-sm font-medium text-foreground mb-2 block">Enter OTP</label>
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
                          className="w-11 h-12 text-center text-lg font-bold bg-background border border-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-muted-foreground">OTP sent to +91 {phone}</span>
                      {countdown > 0 ? (
                        <span className="text-xs text-muted-foreground">Resend in {countdown}s</span>
                      ) : (
                        <button className="text-xs text-primary font-medium" onClick={() => setCountdown(30)}>
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleVerify}
                    disabled={otp.some(d => !d) || loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Verify & Login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span>Your data is encrypted and secure</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
