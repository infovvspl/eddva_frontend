import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import F1 from "../../assets/f1.png";
import F2 from "../../assets/f2.png";
import F3 from "../../assets/f3.png";
import F4 from "../../assets/f4.png";
import F5 from "../../assets/f5.png";
import F6 from "../../assets/f6.png";
import F7 from "../../assets/f7.png";
import F8 from "../../assets/f8.png";
import F9 from "../../assets/f9.png";
import F10 from "../../assets/f10.png";

interface Feature {
  id: string;
  title: string;
  description: string;
  image: string;
  accentBg: string;
}

const FEATURES: Feature[] = [
  {
    id: "01",
    title: "Live Interactive Classes",
    description:
      "Teachers conduct engaging live lectures using their own teaching style, ensuring interactive and personalized learning experience for students.",
    image:F1,
    accentBg: "bg-amber-100 text-amber-700",
  },
  {
    id: "02",
    title: "Auto-Recorded Lectures",
    description:
      "All live classes are recorded and stored, enabling students to revisit lessons anytime for revision or missed sessions.",
    image:F2,
    accentBg: "bg-blue-100 text-blue-700",
  },
  {
    id: "03",
    title: "Ai-Generated study material",
    description:
      "AI creates structured notes, bilingual transcripts in english and hindi, DPPs, and PDFs for comprehensive student learning support.",
    image:F3,
    accentBg: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "04",
    title: "24/7 AI Doubt solver",
    description:
      "Students receive instant doubt resolution anytme through AI-powered assistance, ensuring uninterrupted learning even when teachers are unavailable.",
    image:F4,
    accentBg: "bg-purple-100 text-purple-700",
  },
  {
    id: "05",
    title: "Smart Testing & Analytics",
    description:
      "Aigenerates mock tests, subject-wise exams, and provides instant results with detailed analytics for students, teachers, and parents.",
    image:F5,
    accentBg: "bg-rose-100 text-rose-700",
  },
  {
    id: "06",
    title: "Personalized study plans",
    description:
      "Intelligent system analyzes student performance to identify strengths and weaknesses, creating customized study plans for improved academic outcomes.",
    image:F6,
    accentBg: "bg-cyan-100 text-cyan-700",
  },
  {
    id: "07",
    title: "AI visual learning display",
    description:
      "AI generates pictorial and visual representations of lectures, enhancing student understanding, retention, and simplifying complex concepts effectively for learners.",
    image:F7,
    accentBg: "bg-violet-100 text-violet-700",
  },
  {
    id: "08",
    title: "AI teaching assistant",
    description:
      "Teachers receive auto-generated PPTs and mindmaps based on curriculum, enhancing lesson delivery, clarity, and overall classroom engagement effectively.",
    image:F8,
    accentBg: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    id: "09",
    title: "Assignment generator& tracker",
    description:
      " Ai generates assignments and tracks submissions, providing detailed insights into student engagement, progress and conceptual understanding across topics.",
    image:F9,
    accentBg: "bg-lime-100 text-lime-700",
  },
  {
    id: "10",
    title: "Unified communication platform",
    description:
      "Single platform enables seamless communication among students, teachers, parents and school administration, including announcements and grievance management system.",
    image:F10,
    accentBg: "bg-sky-100 text-sky-700",
  },
];

export const FeatureSection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const rightSectionRef = useRef<HTMLDivElement>(null);

  // Improved scroll handling with better threshold detection - ONLY manual scroll
  const handleRightScroll = () => {
    if (!rightSectionRef.current) return;

    const container = rightSectionRef.current;
    const cards = container.querySelectorAll(".feature-card");
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let closestIdx = 0;
    let minDistance = Infinity;
    const threshold = 80; // Distance threshold for smoother activation

    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(cardCenter - containerCenter);

      // Check if card is within threshold of center
      if (distance < threshold && distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    // Update active index only when user scrolls
    if (closestIdx !== activeIdx) {
      setActiveIdx(closestIdx);
    }
  };

  // Debounce scroll handler to prevent rapid state updates
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const scrollContainer = rightSectionRef.current;

    if (!scrollContainer) return;

    const debouncedScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleRightScroll();
      }, 50);
    };

    scrollContainer.addEventListener("scroll", debouncedScroll, {
      passive: true,
    });

    return () => {
      scrollContainer.removeEventListener("scroll", debouncedScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeIdx]);

  const currentFeature = FEATURES[activeIdx];

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex justify-center overflow-hidden">
      {/* Outer Container with w-7xl constraint */}
      <div className="w-full max-w-[80rem] grid grid-cols-1 md:grid-cols-12 h-screen relative">
        {/* LEFT PANEL: Sticky Visual Spotlight */}
        <div className="md:col-span-5 h-screen sticky top-0 bg-white/90 backdrop-blur-md md:bg-white flex flex-col justify-between p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 z-20 shadow-lg shadow-slate-200/30">
          {/* Header */}
          <div className="flex items-center justify-between w-full">
            <motion.span
              className="font-sans text-xs font-bold uppercase tracking-widest text-slate-400"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              Features
            </motion.span>
            <motion.span
              className="font-mono text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-100 shadow-sm"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {String(activeIdx + 1).padStart(2, "0")}{" "}
              <span className="text-slate-300">/</span> {FEATURES.length}
            </motion.span>
          </div>

          {/* Center Content: Image + Text */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left my-auto space-y-8">
            {/* Dynamic Image with enhanced animations */}
            <div className="w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 shadow-2xl shadow-slate-300/50 relative border border-slate-200">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent" />
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeIdx}
                  src={currentFeature.image}
                  alt={currentFeature.title}
                  initial={{ opacity: 0, scale: 1.15, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.92, rotate: 2 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                    opacity: { duration: 0.3 },
                  }}
                  className="w-full h-full object-cover relative z-10 p-4 bg-white"
                />
              </AnimatePresence>

              {/* Image overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
            </div>

            {/* Dynamic Typography with better spacing */}
            <div className="space-y-5 max-w-lg mx-auto md:mx-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1,
                    ease: "easeOut",
                  }}
                >
                  <motion.h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.1] bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {currentFeature.title}
                  </motion.h3>
                  <motion.p
                    className="text-base md:text-lg text-slate-600 leading-relaxed mt-4 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                  >
                    {currentFeature.description}
                  </motion.p>

                  {/* Feature accent line */}
                  <motion.div
                    className={`h-1 w-16 rounded-full mt-6 ${currentFeature.accentBg.split(" ")[0].replace("bg-", "bg-")}`}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 64, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Enhanced Progress Bar with gradient */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-8 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-full relative"
              animate={{
                width: `${((activeIdx + 1) / FEATURES.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </motion.div>
          </div>

          {/* Navigation hints */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <motion.button
              onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeIdx === 0}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </motion.button>
            <motion.button
              onClick={() =>
                setActiveIdx((prev) => Math.min(FEATURES.length - 1, prev + 1))
              }
              disabled={activeIdx === FEATURES.length - 1}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* RIGHT PANEL: Scrollable Card Stream - ONLY manual scroll */}
        <div
          ref={rightSectionRef}
          className="hidden md:block md:col-span-7 h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-white"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`
            .hide-scroll::-webkit-scrollbar { 
              display: none; 
            }
            .hide-scroll { 
              -ms-overflow-style: none; 
              scrollbar-width: none; 
            }
            
            /* Better scroll behavior */
            .overflow-y-scroll {
              overscroll-behavior: smooth;
            }
          `}</style>

          <div className="hide-scroll p-6 md:p-16 space-y-4">
            {/* Top Spacer */}
            <div className="h-[25vh] shrink-0" />

            {FEATURES.map((feature, idx) => {
              const isActive = idx === activeIdx;
              const isNearActive = Math.abs(idx - activeIdx) === 1;

              return (
                <div
                  key={feature.id}
                  className={`feature-card snap-center shrink-0 min-h-[140px] w-full transition-all duration-300 ${isActive ? "relative z-10" : ""}`}
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: isActive ? 1 : isNearActive ? 0.7 : 0.3,
                      y: 0,
                      scale: isActive ? 1 : 0.94,
                      backgroundColor: isActive
                        ? "#f8fafc"
                        : isNearActive
                          ? "#fafafa"
                          : "transparent",
                      borderColor: isActive
                        ? "#e2e8f0"
                        : isNearActive
                          ? "#f1f5f9"
                          : "transparent",
                      boxShadow: isActive
                        ? "0 20px 40px -10px rgba(0,0,0,0.12)"
                        : isNearActive
                          ? "0 10px 25px -8px rgba(0,0,0,0.06)"
                          : "none",
                    }}
                    transition={{
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                      scale: { duration: 0.3 },
                      boxShadow: { duration: 0.4 },
                    }}
                    className={`w-full p-6 md:p-8 rounded-3xl border transition-all duration-300 cursor-default group ${
                      isActive ? "ring-2 ring-transparent" : ""
                    }`}
                    whileHover={{
                      scale: isActive ? 1.01 : 0.96,
                      transition: { duration: 0.2 },
                    }}
                  >
                    <div className="flex items-start gap-6">
                      {/* Badge with enhanced animation */}
                      <motion.div
                        className={`w-14 h-14 rounded-2xl shrink-0 font-mono font-bold text-base flex items-center justify-center transition-all duration-300 ${feature.accentBg} ${
                          isActive
                            ? "rotate-0 scale-100 shadow-lg"
                            : isNearActive
                              ? "rotate-2 scale-95 opacity-80"
                              : "rotate-6 scale-90 opacity-50"
                        }`}
                        animate={{
                          rotate: isActive ? 0 : isNearActive ? 2 : 6,
                          scale: isActive ? 1 : isNearActive ? 0.95 : 0.9,
                        }}
                        transition={{ duration: 0.35 }}
                      >
                        {feature.id}
                      </motion.div>

                      {/* Card Text with staggered reveal */}
                      <div className="flex-1">
                        <motion.h4
                          className={`text-xl md:text-2xl font-bold mb-3 transition-all duration-300 ${
                            isActive
                              ? "text-slate-900"
                              : isNearActive
                                ? "text-slate-700"
                                : "text-slate-500"
                          }`}
                          animate={{
                            opacity: isActive ? 1 : isNearActive ? 0.8 : 0.6,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {feature.title}
                        </motion.h4>
                        <motion.p
                          className={`text-sm md:text-base leading-relaxed transition-all duration-300 ${
                            isActive
                              ? "text-slate-600 opacity-100 translate-x-0"
                              : isNearActive
                                ? "text-slate-500 opacity-70 translate-x-2"
                                : "text-slate-400 opacity-0 translate-x-4"
                          }`}
                          animate={{
                            opacity: isActive ? 1 : isNearActive ? 0.7 : 0,
                            x: isActive ? 0 : isNearActive ? 8 : 16,
                          }}
                          transition={{
                            duration: 0.35,
                            delay: isActive ? 0.1 : 0,
                          }}
                        >
                          {feature.description}
                        </motion.p>

                        {/* Active indicator line */}
                        {isActive && (
                          <motion.div
                            className={`h-0.5 w-12 rounded-full mt-4 ${feature.accentBg.split(" ")[0]}`}
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 48, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}

            {/* Bottom Spacer */}
            <div className="h-[30vh] shrink-0" />
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: activeIdx === 0 ? 0.5 : 0,
              y: activeIdx === 0 ? 0 : 20,
            }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-xs text-slate-400 font-medium">
              Scroll to explore
            </span>
            <motion.div
              className="w-5 h-8 rounded-full border-2 border-slate-300 flex items-start justify-center p-1"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.div
                className="w-1 h-1.5 rounded-full bg-slate-400"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};
