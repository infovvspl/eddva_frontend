import React from "react";
import { motion, Variants } from "framer-motion";
import { FiArrowUpRight, FiBookOpen, FiCornerDownRight } from "react-icons/fi";
import { Link } from "react-router-dom";

// Define a strict union type based on item layout behaviors
type CTAGalleryItem =
  | { id: number; type: "gradient"; color: string; rotate: string; translate: string }
  | { id: number; type: "image"; url: string; rotate: string; translate: string }
  | { id: number; type: "icon"; rotate: string; translate: string };

const ctaGalleryItems: CTAGalleryItem[] = [
  {
    id: 1,
    type: "gradient",
    color: "from-teal-100 to-emerald-50",
    rotate: "-25deg",
    translate: "-280px 120px",
  },
  {
    id: 2,
    type: "image",
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=200",
    rotate: "-15deg",
    translate: "-190px 50px",
  },
  {
    id: 3,
    type: "gradient",
    color: "from-purple-100 to-indigo-50",
    rotate: "-5deg",
    translate: "-100px 10px",
  },
  // Center Launcher Icon
  { id: 4, type: "icon", rotate: "0deg", translate: "0px 0px" },
  {
    id: 5,
    type: "image",
    url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=200",
    rotate: "5deg",
    translate: "100px 10px",
  },
  {
    id: 6,
    type: "gradient",
    color: "from-amber-100 to-orange-50",
    rotate: "15deg",
    translate: "190px 50px",
  },
  {
    id: 7,
    type: "image",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200",
    rotate: "25deg",
    translate: "280px 120px",
  },
];

export default function CTASection() {
  // Converted easing array into a strict read-only tuple
  const fluidEase = [0.16, 1, 0.3, 1] as const;

  const archCardVariant = (translate: string, rotate: string): Variants => {
    const [translateX, translateY] = translate.split(" ");
    
    return {
      hidden: {
        opacity: 0,
        scale: 0.8,
        transform: `translate(0px, 40px) rotate(0deg)`,
      },
      visible: {
        opacity: 1,
        scale: 1,
        transform: `translate(${translateX}, ${translateY}) rotate(${rotate})`,
        transition: { duration: 1.2, ease: fluidEase },
      },
    };
  };

  return (
    <section className="relative w-full bg-white text-slate-900 py-20 px-6 sm:px-12 overflow-hidden border-t border-slate-100 flex flex-col items-center justify-center">
      {/* Background Decorative Grid matching the Hero pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      {/* Radial ambient background glow behind text */}
      <div className="absolute w-[600px] h-[300px] bg-gradient-to-tr from-blue-100/20 via-sky-100/30 to-transparent rounded-full blur-3xl pointer-events-none top-12" />

      <div className="max-w-4xl mx-auto w-full text-center relative z-20 space-y-8">
        {/* Main Title Head */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: fluidEase }}
          className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]"
        >
          Ready to ace your <br />
          <span className="font-spicy block sm:inline bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent pr-1">
             exam?
          </span>
        </motion.h2>

        {/* Subtitle description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: fluidEase }}
          className="text-base sm:text-lg text-slate-500 font-medium max-w-xl mx-auto leading-relaxed"
        >
          Start your free plan today .
        </motion.p>

        {/* Action Buttons matching Hero Weights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: fluidEase }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-16"
        >
          <Link
            to="/register"
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <span className="relative z-10">Get Instant Access</span>

            <FiArrowUpRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <Link
            to="/courses"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-slate-50 hover:border-[#0066cc]/40 hover:shadow-lg"
          >
            <FiCornerDownRight className="w-4 h-4 text-slate-400" />

            <span>Explore Courses</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}