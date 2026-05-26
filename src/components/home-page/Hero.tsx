import React, { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  MotionValue,
  Variants,
} from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiPlay,
  FiBookOpen,
} from "react-icons/fi";

// Define strict typing for the gallery item variations
interface BaseGalleryItem {
  id: number;
  rotate: number;
  x: number;
  y: number;
}

interface ImageGalleryItem extends BaseGalleryItem {
  type: "image";
  url: string;
}

interface GradientGalleryItem extends BaseGalleryItem {
  type: "gradient";
  color: string;
}

interface IconGalleryItem extends BaseGalleryItem {
  type: "icon";
}

type GalleryItem = ImageGalleryItem | GradientGalleryItem | IconGalleryItem;

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    type: "gradient",
    color: "from-teal-100 to-emerald-50",
    rotate: -45,
    x: -360,
    y: 180,
  },
  {
    id: 2,
    type: "image",
    url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400",
    rotate: -35,
    x: -300,
    y: 60,
  },
  {
    id: 3,
    type: "image",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400",
    rotate: -25,
    x: -240,
    y: -40,
  },
  {
    id: 4,
    type: "gradient",
    color: "from-purple-100 to-indigo-50",
    rotate: -15,
    x: -180,
    y: -110,
  },
  {
    id: 5,
    type: "image",
    url: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=400",
    rotate: -5,
    x: -100,
    y: -140,
  },
  { id: 6, type: "icon", rotate: 0, x: 0, y: -150 }, // Center
  {
    id: 7,
    type: "image",
    url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=400",
    rotate: 5,
    x: 100,
    y: -140,
  },
  {
    id: 8,
    type: "gradient",
    color: "from-amber-100 to-orange-50",
    rotate: 15,
    x: 180,
    y: -110,
  },
  {
    id: 9,
    type: "image",
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400",
    rotate: 25,
    x: 240,
    y: -40,
  },
  {
    id: 10,
    type: "image",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
    rotate: 35,
    x: 300,
    y: 60,
  },
  {
    id: 11,
    type: "gradient",
    color: "from-blue-100 to-cyan-50",
    rotate: 45,
    x: 360,
    y: 180,
  },
];

interface ArchCardProps {
  item: GalleryItem;
  scatterMultiplier: MotionValue<number>;
}

// Split each card out to handle merging entrance variants + scroll offsets cleanly
function ArchCard({ item, scatterMultiplier }: ArchCardProps) {
  // 1. Calculate how far this specific card should scroll outward
  const scrollX = useTransform(
    scatterMultiplier,
    (multi) => item.x * (multi - 1),
  );
  const scrollY = useTransform(
    scatterMultiplier,
    (multi) => item.y * (multi - 1),
  );
  const scrollRotate = useTransform(
    scatterMultiplier,
    (multi) => item.rotate * (multi - 1) * 0.2,
  );

  // 2. These variants handle your classic "one by one" entrance animation cleanly
  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      x: 0,
      y: 0,
      rotate: 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: item.x,
      y: item.y,
      rotate: item.rotate,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      style={{
        // Combines your static layout values with dynamic scroll delta shifts
        translateX: scrollX,
        translateY: scrollY,
        rotateZ: scrollRotate,
        pointerEvents: "auto",
      }}
      whileHover={{
        scale: 1.15,
        zIndex: 50,
        transition: { duration: 0.2 },
      }}
      className="absolute w-20 h-28 sm:w-32 sm:h-40 rounded-2xl shadow-xl overflow-hidden bg-white border border-slate-100 flex-shrink-0 origin-center"
    >
      {item.type === "image" && (
        <img
          src={item.url}
          alt="Platform Preview"
          className="w-full h-full object-cover"
        />
      )}
      {item.type === "gradient" && (
        <div
          className={`w-full h-full bg-gradient-to-tr ${item.color} opacity-80`}
        />
      )}
      {item.type === "icon" && (
        <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
          <div className="p-3 bg-emerald-500 rounded-full text-white shadow-lg shadow-emerald-200">
            <FiBookOpen className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Controls how extreme the scattering is as you scroll down
  const scatterMultiplier = useTransform(scrollYProgress, [0, 1], [1, 2.5]);
  const galleryOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Typography entry variants
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // This parent container orchestrates the staggered cascade entrance
  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Controls speed between each card opening
        delayChildren: 0.1,
      },
    },
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full bg-white text-slate-900 overflow-hidden flex flex-col justify-between pt-24 pb-12 px-6 sm:px-12"
    >
      {/* Background Rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[140%] h-[140%] rounded-full border border-dashed border-blue-400/30"
          style={{ willChange: "transform" }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[115%] h-[115%] rounded-full border border-purple-400/30"
          style={{ willChange: "transform" }}
        />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col items-center justify-center relative z-10 mt-12">
        {/* ARCH GALLERY */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none h-[450px] top-[-80px]">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            style={{ opacity: galleryOpacity }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {galleryItems.map((item) => (
              <ArchCard
                key={item.id}
                item={item}
                scatterMultiplier={scatterMultiplier}
              />
            ))}
          </motion.div>
        </div>

        {/* HERO TYPOGRAPHY & CALL TO ACTIONS */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="text-center max-w-3xl pt-52 sm:pt-48 relative z-20"
        >
          {/* Main H1 Heading */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6"
          >
            Smarter Learning. <br />
            <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
              Brighter Futures.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg text-slate-500 font-medium max-w-xl mx-auto leading-relaxed mb-10"
          >
            "Eddva is not built for average learning. It is designed for those
            who seek precision, clarity, and an edge".
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg text-slate-500 font-medium max-w-xl mx-auto leading-relaxed mb-10"
          >
            Powered by advanced AI, Eddva creates an experience that is deeply personalized, intelligently curated, and relentlessly focused on results. Every interaction is intentional. Every recommendation is refined. You don't just study here—you evolve with purpose.
          </motion.p>

          {/* Dual Action CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <span className="relative z-10">Start learning</span>

              <FiArrowUpRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            {/* Meet Our Mentors */}
            <Link
              to="/courses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-700 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-slate-50 hover:border-[#0066cc]/40 hover:shadow-lg"
            >
              <span className="p-1 rounded-full bg-gradient-to-r from-[#004499] to-[#0066cc] text-white">
                <FiPlay className="w-4 h-4 fill-white" />
              </span>

              <span>Explore Courses</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}