import React from "react";
import { motion, Variants } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

// Refactored structure blueprint focusing on core course information
interface CourseItem {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  badge: string;
}

// Cleaned up mock data aligned with your new card elements
const coursesData: CourseItem[] = [
  {
    id: 1,
    title: "IIT JEE",
    category: "Engineering",
    description: "Crack premium engineering institutes with an adaptive curriculum packed with advanced physics, chemistry, and high-tier mathematical modeling.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600",
    badge: "Best Seller",
  },
  {
    id: 2,
    title: "NEET UG",
    category: "Medical",
    description: "Master medical entrance parameters with comprehensive conceptual breakdown of human anatomy, plant physiology, and core chemical reactions.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600",
    badge: "Trending",
  },
  {
    id: 3,
    title: "CBSE 9–12",
    category: "CBSE Boards",
    description: "Build an unbreakable academic foundation. Streamlined structured notes and mock tests structured around latest state board parameters.",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600",
    badge: "New",
  },
];

export default function CoursesSection() {
  // Shared fluid ease curve from your Hero Section
  const fluidEase = [0.16, 1, 0.3, 1] as const;

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: fluidEase },
    },
  };

  const cardContainerVariant: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: fluidEase },
    },
  };

  return (
    <section className="relative w-full bg-white text-slate-900 py-24 px-6 sm:px-12 overflow-hidden">
      
      {/* Background Decorative Grid - Seamless Continuity */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* SECTION HEADER */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div className="max-w-xl">
            {/* Title */}
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]"
            >
              Choose Your <br />
              <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                Exam Path
              </span>
            </motion.h2>
          </div>

          {/* Subtitle / CTA combo */}
          <motion.div variants={fadeInUp} className="flex flex-col items-start md:items-end gap-3">
            <p className="text-base text-slate-500 font-medium max-w-xs md:text-right leading-relaxed">
              Comprehensive preparation for various tiers. Pick your goal and we'll build your personalized path.
            </p>
          </motion.div>
        </motion.div>

        {/* COURSES CARD GRID */}
        <motion.div
          variants={cardContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {coursesData.map((course) => (
            <motion.div
              key={course.id}
              variants={cardVariant}
              whileHover={{ y: -8, transition: { duration: 0.3, ease: fluidEase } }}
              className="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-shadow duration-300 flex flex-col h-full"
            >
              {/* Image & Badge Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Custom Card Badge */}
                <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-800 shadow-sm">
                  {course.badge}
                </span>
                
                {/* Dark Vignette Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1">
                {/* Meta details / Category */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0066cc] bg-blue-50 px-2.5 py-1 rounded-md">
                    {course.category}
                  </span>
                </div>

                {/* Course Title */}
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug mb-2 group-hover:text-[#0066cc] transition-colors duration-200">
                  {course.title}
                </h3>

                {/* Course Description */}
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                  {course.description}
                </p>

                {/* Full Width Elegant Explore Path Button */}
                <button className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-700 text-sm font-bold tracking-tight transition-all duration-300 group-hover:bg-gradient-to-tr group-hover:from-[#004499] group-hover:to-[#0066cc] group-hover:border-transparent group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/20">
                  <span>Explore</span>
                  <FiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>

              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}