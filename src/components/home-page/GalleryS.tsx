import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { FiAward, FiImage, FiMaximize2, FiExternalLink } from "react-icons/fi";

// Mock Images - Replace with your actual assets
import GalleryImg1 from '../../assets/h5.png'; 
import GalleryImg2 from '../../assets/h9.png';
import GalleryImg3 from '../../assets/h2.png';
import A1 from '../../assets/award1.jpeg';
import A2 from '../../assets/award2.jpeg';
import A3 from '../../assets/award3.jpeg';
import A4 from '../../assets/award4.jpeg';
import A5 from '../../assets/award5.jpeg';
import A6 from '../../assets/award6.jpeg';
import A7 from '../../assets/news1.jpeg';
import A8 from '../../assets/news2.jpeg';

// Add more images as needed...

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

  // Your item database containing both real-life captures and award assets
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.92, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { duration: 0.3 },
    },
  };

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
      {/* Dynamic Style injection ensuring seamless grid adaptation */}
      <style>{`
        .creative-gallery-section {
          padding: 80px 24px;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 32px;
          width: 100%;
          max-width: 1200px;
        }
        @media (max-width: 768px) {
          .creative-gallery-section {
            padding: 60px 16px;
          }
          .gallery-grid {
            grid-template-columns: 1fr !important;
            gap: 24px;
          }
        }
      `}</style>

      {/* Matching Ambient Background Glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", width: "700px", height: "700px",
          borderRadius: "50%", bottom: "-10%", left: "5%",
          background: "radial-gradient(circle, rgba(0,166,255,0.04) 0%, transparent 70%)",
        }} />
      </div>

      {/* Tech Blueprint Grid Lines (Identical to your Section Match) */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(0,68,153,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,68,153,0.015) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      {/* ─── HEADER SECTION ─── */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", marginBottom: "48px", maxWidth: "600px" }}>
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            fontSize: "clamp(30px, 3.5vw, 46px)",
            fontWeight: 900,
            color: "#002966",
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

      {/* ─── FILTER CONTROL CONTROLLER ─── */}
      <div style={{
        position: "relative", zIndex: 10, display: "flex", gap: "8px",
        background: "rgba(0,41,102,0.04)", padding: "6px", borderRadius: "30px",
        marginBottom: "40px", backdropFilter: "blur(8px)"
      }}>
        {[
          { id: "all", label: "All Items" },
          { id: "gallery", label: "Campus Gallery", icon: FiImage },
          { id: "award", label: "Awards & Honors", icon: FiAward }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            style={{
              position: "relative",
              padding: "10px 20px",
              borderRadius: "24px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: activeFilter === tab.id ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "color 0.25s ease",
            }}
          >
            {tab.icon && <tab.icon style={{ fontSize: "16px" }} />}
            <span style={{ position: "relative", zIndex: 2 }}>{tab.label}</span>
            {activeFilter === tab.id && (
              <motion.div
                layoutId="activeFilterBg"
                style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(135deg, #004499 0%, #002966 100%)",
                  borderRadius: "24px", zIndex: 1,
                  boxShadow: "0 4px 12px rgba(0,41,102,0.15)"
                }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ─── MASONRY-LIKE LAYOUT GRID ─── */}
      <motion.div 
        className="gallery-grid"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
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
                cursor: "pointer"
              }}
            >
              {/* Dynamic Image Wrapper */}
              <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
                <motion.img 
                  src={item.image} 
                  alt={item.title}
                  animate={{ scale: hoveredIndex === idx ? 1.06 : 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                {/* Ambient Category Tag pill overlay */}
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

                {/* Clean Hover Mask Overlay with Content Slide Up */}
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
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}