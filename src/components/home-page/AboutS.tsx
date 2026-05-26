import React from "react";
import { motion, Variants } from "framer-motion";
import { FiArrowUpRight, FiCheckCircle, FiTarget, FiEye } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function AboutUsSection() {
  // Animation Variants matching Hero easing with strict type definitions
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  return (
    <section className="relative w-full bg-white text-slate-900 py-24 sm:py-32 px-6 sm:px-12 overflow-hidden">
      {/* Background Subtle Dot/Grid Matrix Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          {/* LEFT: CONTENT & MISSION */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="lg:col-span-6 space-y-8"
          >
            {/* Section H2 Heading */}
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]"
            >
              We bridge the gap between <br />
              <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                Ambition and Mastery.
              </span>
            </motion.h2>

            {/* Paragraph Text */}
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-xl"
            >
              Founded by industry veterans, our platform was built on a simple
              conviction: premium education shouldn't be passive. We design
              structured learning tracks that transform complex theories into
              actionable career superpowers.
            </motion.p>

            {/* Core Value Pillars */}
            <motion.div
              variants={fadeInUp}
              className="space-y-4 border-t border-slate-100 pt-6"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 rounded-md bg-emerald-50 text-emerald-600">
                  <FiTarget className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    Curated Excellence
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    No fluff. Only highly polished, battle-tested knowledge from
                    global architects.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1 rounded-md bg-blue-50 text-blue-600">
                  <FiEye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    Community-First Growth
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    Connect and build with an elite tier of high-achieving peer
                    networks.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Action CTA Button */}
            <motion.div variants={fadeInUp} className="pt-4">
              <Link
                to="/about"
                className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] to-[#0066cc] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <span className="relative z-10">More about us</span>

                <FiArrowUpRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* RIGHT: PREMIUM INTERACTIVE GALLERY BENTO */}
          <div className="lg:col-span-6 relative w-full h-[500px] flex items-center justify-center mt-12 lg:mt-0 select-none">
            {/* Background Arch-like Frame Glow */}
            <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-blue-100/30 to-purple-100/20 rounded-[40px] blur-3xl -z-10" />

            {/* Bento Card 1: Large Base Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: "-2deg", x: -20 }}
              whileInView={{ opacity: 1, scale: 1, rotate: "-4deg", x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              whileHover={{ scale: 1.04, rotate: "-1deg", zIndex: 30 }}
              className="absolute left-8 top-12 w-64 h-80 rounded-2xl shadow-xl border border-slate-100 overflow-hidden bg-white"
            >
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600"
                alt="Our Workspace"
                className="w-full h-full object-cover transition-all duration-300"
              />
            </motion.div>

            {/* Bento Card 2: Micro Metric Gradient Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: "8deg", x: 40 }}
              whileInView={{ opacity: 1, scale: 1, rotate: "6deg", x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              whileHover={{ scale: 1.1, rotate: "2deg", zIndex: 30 }}
              className="absolute right-4 top-4 w-48 p-6 rounded-2xl shadow-xl bg-gradient-to-br from-purple-100 to-indigo-50 border border-purple-200/40 text-left"
            >
              <div className="p-2 w-fit rounded-lg bg-white shadow-sm text-purple-600 mb-4">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                100%
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Best in class
              </p>
            </motion.div>

            {/* Bento Card 3: Landscape Foreground Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 60 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -5, zIndex: 30 }}
              className="absolute bottom-6 right-12 w-72 h-48 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden bg-white"
            >
              <img
                src="https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?q=80&w=600"
                alt="Collaborative Session"
                className="w-full h-full object-cover transition-all duration-300"
              />
            </motion.div>

            {/* Bento Card 4: Micro Accent Abstract Gradient Blob */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: "-15deg" }}
              whileInView={{ opacity: 0.9, scale: 1, rotate: "-12deg" }}
              viewport={{ once: true }}
              transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.4,
              }}
              className="absolute left-4 bottom-14 w-20 h-24 rounded-2xl bg-gradient-to-tr from-amber-100 to-orange-50 border border-amber-200/30 shadow-md hidden sm:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}