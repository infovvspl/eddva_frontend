import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Animation Variants matching Hero & About sections
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", { email, password });
  };

  return (
    <section className="relative w-full bg-white text-slate-900 overflow-hidden flex items-center justify-center px-6 py-32">
      {/* Animated Background Rings (matching Hero) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-[120%] h-[120%] rounded-full border border-dashed border-blue-400/30"
          style={{ willChange: "transform" }}
        />

        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-[120%] h-[100%] rounded-full border border-purple-400/30"
          style={{ willChange: "transform" }}
        />
      </div>

      {/* Background Dot Matrix (matching About section) */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

      {/* Decorative Floating Cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: "-12deg" }}
        animate={{ opacity: 0.6, scale: 1, rotate: "-8deg" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
        className="absolute top-20 left-12 w-32 h-40 rounded-2xl bg-gradient-to-tr from-teal-100 to-emerald-50 border border-emerald-200/30 shadow-xl hidden lg:block"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: "15deg" }}
        animate={{ opacity: 0.6, scale: 1, rotate: "12deg" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 }}
        className="absolute bottom-32 right-16 w-28 h-36 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-50 border border-purple-200/30 shadow-xl hidden lg:block"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: "-20deg" }}
        animate={{ opacity: 0.6, scale: 1, rotate: "-15deg" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const, delay: 0.4 }}
        className="absolute top-1/3 right-24 w-24 h-32 rounded-2xl bg-gradient-to-tr from-amber-100 to-orange-50 border border-amber-200/30 shadow-xl hidden xl:block"
      />

      {/* Main Login Container */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 w-full max-w-md"
      >
        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-10">

          {/* Heading */}
          <motion.h1
            variants={fadeInUp}
            className="text-3xl sm:text-4xl font-black text-center tracking-tight text-slate-900 leading-[1.1] mb-3"
          >
            Welcome Back to{" "}
            <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
              Eddva
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="text-sm text-slate-500 font-medium mb-8"
          >
            Continue your journey to mastery. Log in to access your courses and community.
          </motion.p>

          {/* Login Form */}
          <motion.form
            variants={fadeInUp}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiMail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/30 focus:border-[#0066cc] hover:border-slate-300"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/30 focus:border-[#0066cc] hover:border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[#0066cc] focus:ring-[#0066cc]/30 cursor-pointer"
                />
                <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="text-[#0066cc] font-bold hover:text-[#004499] transition-colors duration-200"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="group relative w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
            >
              {/* Shine effect */}
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <span className="relative z-10">Sign In</span>

              <FiArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </motion.form>

          {/* Sign Up Link */}
          <motion.div
            variants={fadeInUp}
            className="mt-8 text-center text-sm"
          >
            <span className="text-slate-500 font-medium">
              Don't have an account?{" "}
            </span>
            <a
              href="#"
              className="text-[#0066cc] font-bold hover:text-[#004499] transition-colors duration-200"
            >
              Sign Up Free
            </a>
          </motion.div>
        </div>

        {/* Bottom Note */}
        <motion.p
          variants={fadeInUp}
          className="text-center text-xs text-slate-400 font-medium mt-6"
        >
          By signing in, you agree to our{" "}
          <a href="#" className="text-slate-600 hover:text-[#0066cc] underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-slate-600 hover:text-[#0066cc] underline">
            Privacy Policy
          </a>
        </motion.p>
      </motion.div>
    </section>
  );
}