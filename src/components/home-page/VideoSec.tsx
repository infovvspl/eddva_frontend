import React, { useState, useRef, useEffect } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { FiPlay, FiX, FiSliders, FiLayers, FiActivity, FiCpu } from "react-icons/fi";
import Intro from '../../assets/intro.mp4';

export default function VideoSection() {
  const [isOpen, setIsOpen] = useState(false);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Synchronize playback state inside the expanded modal
  useEffect(() => {
    if (isOpen && modalVideoRef.current) {
      modalVideoRef.current.play().catch((err) => {
        console.log("Autoplay unmuted video handle caught:", err);
      });
    }
  }, [isOpen]);

  // Animation Variants matching your AboutUs / Hero easing
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
    <section className="relative w-full bg-slate-50 text-slate-900 py-24 sm:py-32 px-6 sm:px-12 overflow-hidden">
      {/* Background Subtle Dot Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Reordered Grid: Video first on mobile/desktop, text follows */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">
          
          {/* LEFT: INTERACTIVE AUTO-PLAYING CARD */}
          <div className="lg:col-span-7 order-2 lg:order-1 relative w-full h-[320px] sm:h-[440px] flex items-center justify-center select-none">
            {/* Arch Blur Glow background layer */}
            <div className="absolute w-[90%] h-[90%] bg-gradient-to-tr from-blue-200/20 to-purple-200/20 rounded-[40px] blur-3xl -z-10" />

            {/* Video Inline Card Wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              onClick={() => setIsOpen(true)}
              className="group relative w-full h-full rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden bg-slate-900 cursor-pointer"
            >
              {/* Native Continuous Local Background Loop Video */}
              <video
                src={Intro}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover opacity-80 group-hover:scale-[1.03] transition-transform duration-700 ease-[0.16, 1, 0.3, 1]"
              />

              {/* Tint overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-950/10 to-transparent animate-fade-in" />

              {/* Centered Pulse Play Button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  {/* Pulse Ring 1 */}
                  <div className="absolute w-20 h-20 bg-blue-500/30 rounded-full animate-ping [animation-duration:2s]" />
                  {/* Pulse Ring 2 */}
                  <div className="absolute w-16 h-16 bg-white/20 rounded-full group-hover:scale-110 transition-transform duration-300" />
                  
                  {/* Button Content */}
                  <button className="relative w-16 h-16 flex items-center justify-center bg-white text-blue-600 rounded-full shadow-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <FiPlay className="w-6 h-6 ml-1 transition-transform group-hover:scale-110" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: CONTENT & COPY */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="lg:col-span-5 order-1 lg:order-2 space-y-6"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.15]"
            >
              Built for precision, <br />
              <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                 clarity, and results
              </span>
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-md"
            >
              A learning journey that understands you before it guides you—curated, measurable, and always within reach when doubt appears.
            </motion.p>

            {/* Micro Stats Row */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8 border-t border-slate-200/60 pt-8"
            >
              {/* Pillar 1: Adaptive Learning */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shadow-sm border border-blue-100/40">
                    <FiSliders className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 tracking-tight">Adaptive Learning</h4>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  A system that learns how you think before it teaches. Eddva adapts to your pace and patterns, shaping a journey that feels natural.
                </p>
              </div>

              {/* Pillar 2: Intelligent Recommendations */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 shadow-sm border border-purple-100/40">
                    <FiLayers className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 tracking-tight">Intelligent Recommendations</h4>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Curated, not crowded. Access a refined selection of videos, notes, assessments, and mock tests aligned with your goals.
                </p>
              </div>

              {/* Pillar 3: Performance Intelligence */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/40">
                    <FiActivity className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 tracking-tight">Performance Intelligence</h4>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Measure what truly matters. Track your progress through insightful analytics, competitive rankings, and performance indicators.
                </p>
              </div>

              {/* Pillar 4: Always-On Clarity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shadow-sm border border-amber-100/40">
                    <FiCpu className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 tracking-tight">Always-On Clarity</h4>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Uninterrupted understanding. With instant AI-powered doubt resolution and contextual support, clarity is never delayed.
                </p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* LIGHTBOX VIDEO EXPAND MODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            {/* Close button */}
            <button 
              className="absolute top-6 right-6 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Interactive Expanded Frame */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                ref={modalVideoRef}
                src={Intro}
                className="w-full h-full"
                controls
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}