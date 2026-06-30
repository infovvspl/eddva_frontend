import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiAward, FiImage, FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Swiper React components and required modules
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Mock Images - Replace with your actual assets
import A1 from '../../assets/award1.jpeg';
import A2 from '../../assets/award2.jpeg';
import A3 from '../../assets/award3.jpeg';
import A4 from '../../assets/award4.jpeg';
import A5 from '../../assets/award5.jpeg';
import A6 from '../../assets/award6.jpeg';
import A7 from '../../assets/news1.jpeg';
import A8 from '../../assets/news2.jpeg';

interface GalleryItem {
  id: number;
  title: string;
  category: "gallery" | "award";
  tag: string;
  image: string;
  description?: string;
}

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState<"all" | "gallery" | "award">("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items: GalleryItem[] = [
    {
      id: 1,
      title: "Next-Gen EdTech Summit Winner",
      category: "award",
      tag: "Excellence Award",
      image: A1,
      description: "Recognized for breaking friction benchmarks in digital student onboarding.",
    },
    {
      id: 2,
      title: "Interactive Learning Workshop",
      category: "gallery",
      tag: "Campus Life",
      image: A2,
      description: "Students collaborating during our micro-module retention sprints.",
    },
    {
      id: 3,
      title: "AI Integration Breakthrough",
      category: "award",
      tag: "Innovation Token",
      image: A3,
      description: "Awarded for cognitive fatigue mitigation architecture algorithms.",
    },
    {
      id: 4,
      title: "Annual Ecosystem Hackathon",
      category: "gallery",
      tag: "Live Event",
      image: A4,
      description: "Building functional user-interface sandboxes over a active 48-hour cycle.",
    },
    {
      id: 5,
      title: "Annual Ecosystem Hackathon",
      category: "gallery",
      tag: "Live Event",
      image: A5,
      description: "Building functional user-interface sandboxes over a active 48-hour cycle.",
    },
    {
      id: 6,
      title: "Annual Ecosystem Hackathon",
      category: "gallery",
      tag: "Live Event",
      image: A6,
      description: "Building functional user-interface sandboxes over a active 48-hour cycle.",
    },
    {
      id: 7,
      title: "Annual Ecosystem Hackathon",
      category: "gallery",
      tag: "Live Event",
      image: A7,
      description: "Building functional user-interface sandboxes over a active 48-hour cycle.",
    },
    {
      id: 8,
      title: "Annual Ecosystem Hackathon",
      category: "gallery",
      tag: "Live Event",
      image: A8,
      description: "Building functional user-interface sandboxes over a active 48-hour cycle.",
    },
  ];

  const filteredItems = items.filter(
    (item) => activeFilter === "all" || item.category === activeFilter
  );

  return (
    <section
      className="creative-gallery-section"
      style={{
        position: "relative",
        width: "100%",
        background: "#ffffff",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Global CSS styles injection */}
      <style>{`
        .creative-gallery-section {
          padding: 80px 24px;
        }
        .swiper-container-7xl {
          width: 100%;
          max-width: 1280px;
          padding: 20px 0 60px 0;
          position: relative;
          z-index: 10;
        }
        
        /* Premium Custom Buttons Layout & Reset */
        .custom-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 68, 153, 0.1);
          color: #002966;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0, 41, 102, 0.08);
        }
        .custom-nav-btn:hover {
          background: linear-gradient(135deg, #1174ec 0%, #002966 100%);
          color: #ffffff;
          box-shadow: 0 8px 25px rgba(0, 41, 102, 0.25);
          border-color: transparent;
        }
        .custom-nav-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
        .custom-prev {
          left: -26px;
        }
        .custom-next {
          right: -26px;
        }

        /* Swiper defaults cleanups */
        .swiper-button-disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }
        
        /* Custom Active Pagination Indicator Line */
        .swiper-pagination-bullet-active {
          background: #004499 !important;
          width: 28px !important;
          border-radius: 4px !important;
        }

        @media (max-width: 1340px) {
          /* Shift buttons inside a bit if window boundaries push against 7xl container */
          .custom-prev { left: 10px; }
          .custom-next { right: 10px; }
        }

        @media (max-width: 768px) {
          .creative-gallery-section {
            padding: 60px 16px;
          }
          /* Hide navigation buttons entirely on mobile for natural swipe gestures */
          .custom-nav-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* Ambient Background Glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", width: "700px", height: "700px",
          borderRadius: "50%", bottom: "-10%", left: "5%",
          background: "radial-gradient(circle, rgba(0,166,255,0.04) 0%, transparent 70%)",
        }} />
      </div>

      {/* Tech Blueprint Grid Lines */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(0,68,153,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,68,153,0.015) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      {/* ─── HEADER SECTION ─── */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", marginBottom: "48px" }}>
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            fontSize: "clamp(30px, 3.5vw, 46px)",
            fontWeight: 900,
            color: "black",
            fontFamily: "'Syne', sans-serif",
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
          }}
        >
          Moments of <span style={{
            background: "linear-gradient(90deg, #004499, #00a6ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
          }}>Impact & Honor</span>
        </motion.h2>
        <p style={{ fontSize: "16px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
          Explore our visual history—from breakthrough innovations and platform awards to milestones shaped alongside our scaling community.
        </p>
      </div>

      {/* ─── RESPONSIBLE 7XL SLIDER WITH CUSTOM NAVIGATION ─── */}
      <div className="swiper-container-7xl">
        {/* Beautiful Custom Navigation Buttons */}
        <button className="custom-nav-btn custom-prev" id="gallery-swiper-prev">
          <FiChevronLeft size={24} />
        </button>
        <button className="custom-nav-btn custom-next" id="gallery-swiper-next">
          <FiChevronRight size={24} />
        </button>

        <Swiper
          modules={[Navigation, Pagination, A11y, Autoplay]}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          navigation={{
            prevEl: "#gallery-swiper-prev",
            nextEl: "#gallery-swiper-next",
          }}
          // pagination={{ clickable: true }}
          grabCursor={true}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 32,
            },
          }}
          style={{ width: "100%" }}
        >
          {filteredItems.map((item, idx) => (
            <SwiperSlide key={`${item.id}-${activeFilter}`} style={{ height: "auto" }}>
              <div
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  position: "relative",
                  borderRadius: "24px",
                  overflow: "hidden",
                  background: "#ffffff",
                  border: "1px solid rgba(0,68,153,0.08)",
                  boxShadow: "0 10px 30px rgba(0,41,102,0.04)",
                  aspectRatio: "3/4",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                {/* Image Structure */}
                <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
                  <motion.img 
                    src={item.image} 
                    alt={item.title}
                    animate={{ scale: hoveredIndex === idx ? 1.06 : 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Overlays */}
                  {/* <div style={{
                    position: "absolute", top: "16px", left: "16px", zIndex: 12,
                    padding: "6px 14px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.03em", textTransform: "uppercase",
                    background: item.category === "award" ? "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)" : "rgba(255,255,255,0.9)",
                    color: item.category === "award" ? "#c2410c" : "#004499",
                    backdropFilter: "blur(4px)", boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                    display: "flex", alignItems: "center", gap: "6px"
                  }}>
                    {item.category === "award" && <FiAward />}
                    {item.tag}
                  </div> */}

                  {/* Context Info Slide */}
                  {/* <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredIndex === idx ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,26,66,0.92) 0%, rgba(0,41,102,0.4) 60%, transparent 100%)",
                      display: "flex", flexDirection: "column", justifyContent: "flex-end",
                      padding: "24px", zIndex: 10
                    }}
                  >
                    <motion.div
                      animate={{ y: hoveredIndex === idx ? 0 : 15 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <h4 style={{
                        margin: "0 0 6px", color: "#ffffff", fontSize: "18px", 
                        fontWeight: 700, fontFamily: "'Syne', sans-serif"
                      }}>
                        {item.title}
                      </h4>
                      {item.description && (
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "13px", lineHeight: 1.4 }}>
                          {item.description}
                        </p>
                      )}
                    </motion.div>
                  </motion.div> */}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}