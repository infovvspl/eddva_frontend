import React from "react";
import { motion, type Variants } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";

interface CourseItem {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  badge: string;
}

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
  const fluidEase = [0.16, 1, 0.3, 1] as const;

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: i * 0.12,
        ease: fluidEase,
      },
    }),
  };

  const cardContainerVariant: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
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
    <section
      style={{
        position: "relative",
        width: "100%",
        background: "#ffffff",
        overflow: "hidden",
        padding: "80px 24px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* Light subtle gradient ambient glow background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", width: "700px", height: "700px",
          borderRadius: "50%", bottom: "10%", right: "-10%",
          background: "radial-gradient(circle, rgba(0,166,255,0.05) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", width: "600px", height: "600px",
          borderRadius: "50%", top: "-5%", left: "-5%",
          background: "radial-gradient(circle, rgba(0,68,153,0.04) 0%, transparent 70%)",
        }} />
      </div>

      {/* Tech Blueprint Grid Lines matching parent frameworks */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(0,68,153,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,68,153,0.02) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      <div style={{ position: "relative", zIndex: 10, maxWidth: "1200px", width: "100%" }}>
        
        {/* ─── SECTION HEADER ─── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "32px",
            marginBottom: "72px",
            width: "100%"
          }}
        >
          <div style={{ maxWidth: "540px" }}>
            <motion.h2
              variants={fadeUp} custom={0}
              style={{
                fontSize: "clamp(36px, 4.5vw, 52px)",
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#002966",
                margin: 0,
                letterSpacing: "-0.03em",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Choose Your <br />
              <span style={{
                background: "linear-gradient(90deg, #004499, #00a6ff)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
              }}>
                Exam Path.
              </span>
            </motion.h2>
          </div>

          <motion.div variants={fadeUp} custom={1} style={{ maxWidth: "380px" }}>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
              Comprehensive preparation matrices designed for top tier results. Select your focal point and engineer your personalized dashboard map.
            </p>
          </motion.div>
        </motion.div>

        {/* ─── COURSES CARD MATRIX GRID ─── */}
        <motion.div
          variants={cardContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "40px 32px",
            width: "100%"
          }}
        >
          {coursesData.map((course) => (
            <motion.div
              key={course.id}
              variants={cardVariant}
              whileHover={{ y: -8, boxShadow: "0 30px 60px rgba(0,41,102,0.12)" }}
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,68,153,0.1)",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,41,102,0.03)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                transition: "box-shadow 0.4s, transform 0.4s",
              }}
              className="course-card-group"
            >
              {/* Image Visual Container Frame */}
              <div style={{ position: "relative", aspectRatio: "16/10", width: "100%", overflow: "hidden", background: "#f8fafc" }}>
                <img
                  src={course.image}
                  alt={course.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  className="course-img-layer"
                />
                
                {/* Float Absolute Status Pill Badge */}
                <span style={{
                  position: "absolute", top: "20px", left: "20px", zIndex: 10,
                  padding: "6px 14px", borderRadius: "999px",
                  background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(0,68,153,0.08)",
                  fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.06em", color: "#002966", textTransform: "uppercase",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                }}>
                  {course.badge}
                </span>
                
                {/* Tech Dark Vignette Film Overlay */}
                <div 
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,41,102,0.2) 0%, transparent 60%)",
                    opacity: 0, transition: "opacity 0.4s"
                  }} 
                  className="course-vignette-layer"
                />
              </div>

              {/* Dynamic Content Structure Block */}
              <div style={{ padding: "32px", display: "flex", flexDirection: "column", flex: "1" }}>
                
                {/* Meta details / Category Pill */}
                <div style={{ display: "flex", marginBottom: "16px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.08em", color: "#0066cc",
                    background: "rgba(0,102,204,0.06)", padding: "4px 12px", borderRadius: "8px"
                  }}>
                    {course.category}
                  </span>
                </div>

                {/* Main Component Title */}
                <h3 
                  style={{
                    margin: "0 0 12px", fontSize: "22px", fontWeight: 800,
                    color: "#002966", letterSpacing: "-0.01em", fontFamily: "'Syne', sans-serif",
                    transition: "color 0.3s"
                  }}
                  className="course-title-layer"
                >
                  {course.title}
                </h3>

                {/* Summary Meta Description paragraph */}
                <p style={{ margin: "0 0 32px", fontSize: "14px", color: "#64748b", lineHeight: 1.6, fontWeight: 400 }}>
                  {course.description}
                </p>

                {/* Full Width Micro-Interactive Target Action Button */}
                <button style={{
                  width: "100%", marginTop: "auto", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "8px", padding: "14px 24px", borderRadius: "14px",
                  background: "rgba(0,68,153,0.04)", border: "1px solid rgba(0,68,153,0.08)",
                  color: "#475569", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                className="course-action-btn"
                >
                  <span>Explore Path</span>
                  <FiArrowRight style={{ width: "16px", height: "16px", transition: "transform 0.3s" }} className="course-arrow-icon" />
                </button>

              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Global Style overrides to track internal nesting classes cleanly */}
      <style>{`
        .course-card-group:hover .course-img-layer {
          transform: scale(1.04);
        }
        .course-card-group:hover .course-vignette-layer {
          opacity: 1 !important;
        }
        .course-card-group:hover .course-title-layer {
          color: #0066cc !important;
        }
        .course-card-group:hover .course-action-btn {
          background: linear-gradient(135deg, #002966 0%, #004499 100%) !important;
          border-color: transparent !important;
          color: #ffffff !important;
          box-shadow: 0 12px 24px rgba(0,68,153,0.15) !important;
        }
        .course-card-group:hover .course-arrow-icon {
          transform: translateX(4px);
        }
      `}</style>
    </section>
  );
}