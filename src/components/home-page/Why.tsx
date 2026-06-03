import React from "react";
import { motion, Variants } from "framer-motion";
import { FiCpu, FiTrendingUp, FiShield, FiCheck, FiZap, FiAward, FiUsers } from "react-icons/fi";

// Configuration blueprints for strict data typing
interface FeatureItem {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  iconColor: string;
  gradient: string;
  lightGradient: string;
}

interface ValuePropItem {
  icon: React.ReactNode;
  label: string;
}

const features: FeatureItem[] = [
  {
    id: 1,
    icon: <FiCpu className="w-6 h-6" />,
    title: "Hyper-Focused Curriculum",
    description: "We cut out the fluff. Every single lesson is engineered to deliver deep domain expertise in half the time of traditional certificates.",
    color: "from-blue-500/10 to-sky-500/5",
    iconColor: "text-[#0066cc] bg-blue-50 border-blue-100 shadow-xl scale-110",
    gradient: "from-[#0066cc] to-[#00a6ff]",
    lightGradient: "from-blue-500/20 to-sky-500/10",
  },
  {
    id: 2,
    icon: <FiTrendingUp className="w-6 h-6" />,
    title: "Vetted Industry Architecture",
    description: "Learn directly from active Principal Engineers, Design Partners, and tech executives who build the systems you use daily.",
    color: "from-purple-500/10 to-indigo-500/5",
    iconColor: "text-purple-600 bg-purple-50 border-purple-100 shadow-xl scale-110",
    gradient: "from-purple-600 to-indigo-600",
    lightGradient: "from-purple-500/20 to-indigo-500/10",
  },
  {
    id: 3,
    icon: <FiShield className="w-6 h-6" />,
    title: "Elite Alumni Network",
    description: "Gain lifetime access to an invite-only collective of high-performing builders, engineers, and creatives worldwide.",
    color: "from-emerald-500/10 to-teal-500/5",
    iconColor: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-xl scale-110",
    gradient: "from-emerald-600 to-teal-600",
    lightGradient: "from-emerald-500/20 to-teal-500/10",
  },
];

const valueProps: ValuePropItem[] = [
  { icon: <FiZap className="w-4 h-4" />, label: "2x Faster Learning" },
  { icon: <FiAward className="w-4 h-4" />, label: "Industry Vetted" },
  { icon: <FiUsers className="w-4 h-4" />, label: "Elite Community" },
  { icon: <FiCheck className="w-4 h-4" />, label: "Lifetime Access" },
];

export default function WhyChooseUsSection() {
  // Shared fixed ease curve configuration
  const customEase = [0.16, 1, 0.3, 1] as const;

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: customEase },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      y: -16, // Anchored elevated layout state
      scale: 1.03, // Anchored structural scale setting
      transition: { duration: 0.8, ease: customEase },
    },
  };

  return (
    <section className="relative w-full bg-white text-slate-900 py-24 sm:py-20 px-6 sm:px-12 overflow-hidden">
      {/* Background with original color scheme */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:auto_6rem] pointer-events-none" />
      
      {/* Subtle color accents matching original palette */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0066cc]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        {/* Header Section */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20 sm:mb-28"
        >
          {/* Main Headline */}
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#002966] leading-[1.1] mb-6"
          >
            Why industry leaders
            <span className="font-spicy block bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
              choose our platform
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p 
            variants={fadeInUp}
            className="text-md sm:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-10"
          >
            We don't do bootcamps, and we don't do boring multi-hour lecture dumps. Our ecosystem is custom-tuned for high-impact knowledge synthesis and rapid technical execution.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4"
        >
          {features.map((feat) => (
            <motion.div
              key={feat.id}
              variants={cardVariants}
              className="group relative h-full rounded-2xl border border-slate-100 bg-white p-8 shadow-2xl transition-all duration-500 flex flex-col justify-between overflow-hidden"
            >
              {/* Radial Background Light Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-100 transition-opacity duration-500 pointer-events-none`} />
              
              {/* Animated gradient border */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feat.gradient} opacity-10 transition-opacity duration-500 pointer-events-none`} />

              {/* Content */}
              <div className="space-y-6 relative z-10">
                {/* Icon with persistent styles */}
                <div className={`p-4 w-fit rounded-xl border transition-all duration-300 ${feat.iconColor}`}>
                  {feat.icon}
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-base text-slate-500 font-medium leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>

              {/* Bottom Spacer Tag */}
              <div className="pt-6 mt-6 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wider uppercase relative z-10" />

              {/* Decorative corner accent */}
              <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl ${feat.lightGradient} opacity-100 transition-opacity duration-500 pointer-events-none`} />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}