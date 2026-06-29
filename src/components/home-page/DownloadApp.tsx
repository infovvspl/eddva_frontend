import React from "react";
import { motion, Variants } from "framer-motion";
import {
  FiArrowUpRight,
  FiLayers,
  FiZap,
  FiCheck,
  FiTrendingUp,
} from "react-icons/fi";
import app1 from "../../assets/app1.png";
import app2 from "../../assets/app2.png";
import apple from "../../assets/appstore.png";
import google from "../../assets/playstore.png";

// Interfaces for structured state configurations
interface FeatureItem {
  icon: React.ReactNode;
  text: string;
  color: string;
  bg: string;
  border: string;
}

interface ReviewItem {
  rating: number;
  downloads: string;
  label: string;
}

const features: FeatureItem[] = [
  {
    icon: <FiZap className="w-4 h-4" />,
    text: "Offline Native Playback",
    color: "text-[#0066cc]",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: <FiLayers className="w-4 h-4" />,
    text: "Progress Multi-Sync",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    icon: <FiCheck className="w-4 h-4" />,
    text: "Instant Push Notifications",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    icon: <FiTrendingUp className="w-4 h-4" />,
    text: "Bite-sized Interactive Labs",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
];

const reviews: ReviewItem[] = [
  { rating: 4.9, downloads: "50K+", label: "App Store Rating" },
  { rating: 4.8, downloads: "100K+", label: "Google Play Rating" },
];

export default function DownloadAppSection() {
  const customEase = [0.16, 1, 0.3, 1] as const;

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: customEase },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  return (
    <section className="relative w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 py-20 sm:py-20 px-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-10 items-center">
          {/* LEFT: Content & CTAs */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:col-span-5 space-y-8"
          >
            {/* Main Headline */}
            <motion.h2
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08]"
            >
              Your learning engine.
              <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent mt-2">
                <span></span> Now in your pocket.
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-md text-slate-600 font-medium leading-relaxed"
            >
              Take your courses anywhere with zero friction. Offline video
              syncing, interactive sandboxes, and instant notifications from
              your mentors — all in one beautiful app.
            </motion.p>

            {/* App Store Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              {/* App Store */}
              <motion.a
                href="https://apps.apple.com/app/idYOUR_APP_ID"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-slate-950 text-white px-7 py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 transition-all duration-300 overflow-hidden min-w-[220px]"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10"
                >
                  <img
                    src={apple}
                    alt="Apple"
                    className="w-8 h-8 object-contain"
                  />
                </motion.div>

                <div className="text-left leading-tight flex-grow">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Download on the
                  </span>
                  <span className="text-sm font-black">App Store</span>
                </div>

                <FiArrowUpRight className="w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />

                <div className="absolute inset-0 bg-gradient-to-r from-[#0066cc] to-[#00a6ff] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </motion.a>

              {/* Google Play */}
              <motion.a
                href="https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-4 border-2 border-slate-200 bg-white text-slate-700 px-7 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:border-[#0066cc]/50 hover:shadow-lg transition-all duration-300 min-w-[220px]"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50"
                >
                  <img
                    src={google}
                    alt="Google Play"
                    className="w-8 h-8 object-contain"
                  />
                </motion.div>

                <div className="text-left leading-tight flex-grow">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Get it on
                  </span>
                  <span className="text-sm font-black">Google Play</span>
                </div>

                <FiArrowUpRight className="w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.a>
            </motion.div>
          </motion.div>

          {/* RIGHT: Phone Graphics Image */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-7 relative w-full h-[650px] flex items-center justify-center"
          >
            {/* Floating Notification Cards */}
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              className="absolute top-12 left-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shadow-sm">
                  <FiCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Lesson Complete
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    Newton's law
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
              transition={{
                duration: 5,
                ease: "easeInOut",
                repeat: Infinity,
                delay: 1,
              }}
              className="absolute bottom-0 right-8 p-4 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    New Lesson
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    Matrix Multiplication
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, -2, 0] }}
              transition={{
                duration: 4.5,
                ease: "easeInOut",
                repeat: Infinity,
                delay: 0.5,
              }}
              className="absolute top-0 right-0 p-3 bg-white rounded-xl border border-slate-200 shadow-lg z-20 hidden xl:block"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <FiTrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">
                    Streak
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    14 Days 🔥
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phone Graphics Image */}
            <div className="relative flex items-center justify-center gap-6 lg:gap-10">
              {/* Left (Small Phone) */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                animate={{ y: [0, -10, 0] }}
                className="relative z-10"
              >
                <img
                  src={app2}
                  alt="App Screen 2"
                  className="w-[220px] sm:w-[250px] lg:w-[220px] rounded-[40px] shadow-2xl"
                />
              </motion.div>

              {/* Right (Large Phone) */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9 }}
                animate={{ y: [0, 10, 0] }}
                className="relative z-20"
              >
                <img
                  src={app1}
                  alt="App Screen 1"
                  className="w-[300px] sm:w-[360px] lg:w-[280px] rounded-[50px] shadow-[0_40px_90px_rgba(0,0,0,0.25)]"
                />
              </motion.div>
            </div>

            {/* Decorative Rotating Circles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, ease: "linear", repeat: Infinity }}
              className="absolute inset-0 w-full h-full border-2 border-[#0066cc]/10 rounded-full pointer-events-none"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, ease: "linear", repeat: Infinity }}
              className="absolute inset-0 w-full h-full border-2 border-purple-500/10 rounded-full pointer-events-none"
              style={{ transform: "scale(1.1)" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
