import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiHome,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";

// Define the comprehensive shape of the form state
interface FormData {
  name: string;
  parentName: string;
  email: string;
  mobile: string;
  address: string;
  postOffice: string;
  city: string;
  landmark: string;
  pincode: string;
  state: string;
  password: string;
  confirmPassword: string;
  otp: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function RegisterPage() {
  const [step, setStep] = useState<number>(1); // 1: Info, 2: Password, 3: OTP
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  // Form States explicitly bound to Interface
  const [formData, setFormData] = useState<FormData>({
    name: "",
    parentName: "",
    email: "",
    mobile: "",
    address: "",
    postOffice: "",
    city: "",
    landmark: "",
    pincode: "",
    state: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  // Password Strength State
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ 
    score: 0, 
    label: "Weak", 
    color: "bg-rose-500" 
  });

  // Supporting both HTMLInputElement and HTMLTextAreaElement adjustments
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Evaluate password strength when password changes
  useEffect(() => {
    const pass = formData.password;
    if (!pass) {
      setPasswordStrength({ score: 0, label: "Too Short", color: "bg-slate-200" });
      return;
    }

    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) {
      setPasswordStrength({ score: 25, label: "Weak ⚠️", color: "bg-rose-500" });
    } else if (score === 2 || score === 3) {
      setPasswordStrength({ score: 60, label: "Medium 🛡️", color: "bg-amber-500" });
    } else {
      setPasswordStrength({ score: 100, label: "Strong 💪", color: "bg-emerald-500" });
    }
  }, [formData.password]);

  // Framer Motion Animation Variants Explicit Typing
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const stepVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
  };

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (step === 2 && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = (): void => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log("Registration Successful:", formData);
  };

  return (
    <section className="relative w-full bg-white text-slate-900 overflow-hidden flex items-center justify-center px-6 py-24 min-h-screen">
      {/* Animated Background Rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[120%] h-[120%] rounded-full border border-dashed border-blue-400/30"
          style={{ willChange: "transform" }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[120%] h-[100%] rounded-full border border-purple-400/30"
          style={{ willChange: "transform" }}
        />
      </div>

      {/* Background Dot Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

      {/* Decorative Floating Cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: "-12deg" }}
        animate={{ opacity: 0.4, scale: 1, rotate: "-8deg" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
        className="absolute top-20 left-12 w-32 h-40 rounded-2xl bg-gradient-to-tr from-teal-100 to-emerald-50 border border-emerald-200/30 shadow-xl hidden lg:block"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: "15deg" }}
        animate={{ opacity: 0.4, scale: 1, rotate: "12deg" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 }}
        className="absolute bottom-32 right-16 w-28 h-36 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-50 border border-purple-200/30 shadow-xl hidden lg:block"
      />

      {/* Main Container */}
      <motion.div initial="hidden" animate="visible" className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-10">
          
          {/* Heading */}
          <motion.h1 variants={fadeInUp} className="text-3xl sm:text-4xl font-black text-center tracking-tight text-slate-900 leading-[1.1] mb-2">
            Create Your Account on{" "}
            <span className="bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
              Eddva
            </span>
          </motion.h1>

          {/* Progress Bar Indicators */}
          <div className="flex items-center justify-center gap-2 mb-8 mt-4">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  step >= s ? "w-8 bg-[#0066cc]" : "w-2 bg-slate-200"
                }`} 
              />
            ))}
          </div>

          <form onSubmit={step === 3 ? handleSubmit : handleNextStep} className="space-y-5">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Personal & Address Details */}
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-[#0066cc] mb-2">Step 1: Personal Information</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Full Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="name" type="text" required value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Parent / Guardian Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="parentName" type="text" required value={formData.parentName} onChange={handleInputChange} placeholder="Robert Doe" className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Email Address</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="mobile" type="tel" required value={formData.mobile} onChange={handleInputChange} placeholder="10-digit number" className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100 my-2" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address Details</p>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Street Address</label>
                    <div className="relative">
                      <FiHome className="absolute left-4 top-3 text-slate-400" />
                      <textarea id="address" required rows={2} value={formData.address} onChange={handleInputChange} placeholder="House No, Apartment, Street Name..." className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc] resize-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Post Office</label>
                      <input id="postOffice" type="text" required value={formData.postOffice} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">City</label>
                      <input id="city" type="text" required value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Landmark / Tehsil</label>
                      <input id="landmark" type="text" required value={formData.landmark} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Pincode</label>
                      <input id="pincode" type="text" required value={formData.pincode} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700">State</label>
                      <input id="state" type="text" required value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/20 focus:border-[#0066cc]" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Password Security Configuration */}
              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-5 py-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-[#0066cc]">Step 2: Choose Password</p>
                  
                  {/* Create Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Create Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Choose a robust password"
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/30 focus:border-[#0066cc]"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Live Password Level Meter */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>Security Level:</span>
                        <span>{passwordStrength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${passwordStrength.color}`} 
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-sm font-bold text-slate-700">Confirm Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter your password"
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/30 focus:border-[#0066cc]"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Visual Status Indicator Match */}
                    {formData.confirmPassword && (
                      <div className="text-xs font-bold mt-1">
                        {formData.password === formData.confirmPassword ? (
                          <span className="text-emerald-600 flex items-center gap-1"><FiCheckCircle /> Passwords match</span>
                        ) : (
                          <span className="text-rose-500 flex items-center gap-1">❌ Passwords do not match yet</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: OTP Authentication */}
              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 py-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-50 text-[#0066cc] rounded-full flex items-center justify-center mb-2">
                    <FiShield className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#0066cc]">Step 3: Verification</p>
                    <h3 className="text-lg font-bold text-slate-800 mt-1">Confirm OTP</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                      We've dispatched a security code to your contact points. Please enter it below to finish.
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto space-y-2">
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      required
                      value={formData.otp}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit OTP"
                      className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#0066cc] focus:ring-4 focus:ring-[#0066cc]/10 transition-all"
                    />
                    <button type="button" className="text-xs font-bold text-[#0066cc] hover:underline block mx-auto pt-2">
                      Didn't get a code? Resend Code
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="flex gap-4 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-1/3 inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-6 py-3.5 rounded-xl font-bold transition-all duration-200 hover:bg-slate-50"
                >
                  <FiArrowLeft /> Back
                </button>
              )}
              
              <button
                type="submit"
                className="group relative flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/20 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">
                  {step === 1 ? "Continue to Password" : step === 2 ? "Generate OTP Verification" : "Complete Registration"}
                </span>
                {step < 3 && <FiArrowRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </div>
          </form>

          {/* Footer Back to Login Link */}
          <motion.div variants={fadeInUp} className="mt-8 text-center text-sm border-t border-slate-100 pt-6">
            <span className="text-slate-500 font-medium">Already registered? </span>
            <a href="#" className="text-[#0066cc] font-bold hover:text-[#004499] transition-colors">
              Sign In Here
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}