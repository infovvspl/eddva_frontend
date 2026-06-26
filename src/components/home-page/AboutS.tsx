import React from "react";
import { motion, type Variants, type MotionProps } from "framer-motion";
import { FiArrowUpRight, FiZap, FiAward, FiShield } from "react-icons/fi";

// Mock image placeholders - replace these with your actual asset paths
import AboutImg1 from '../../assets/h5.png';
import AboutImg2 from '../../assets/h9.png';
import AboutImg3 from '../../assets/h2.png';

export default function CreativeAboutSection() {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: i * 0.12,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  const floatAnimation = (yDelta: number, duration: number): MotionProps => ({
    animate: {
      y: [0, yDelta, 0],
    },
    transition: {
      duration: duration,
      repeat: Infinity,
      ease: "easeInOut",
    },
  });

  return (
    <section
      className="creative-about-section"
      style={{
        position: "relative",
        width: "100%",
        background: "#ffffff",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* Injecting media queries cleanly without changing desktop styles */}
      <style>{`
        .creative-about-section {
          padding: 80px 24px;
        }
        .about-grid-container {
          grid-template-columns: repeat(2, 1fr);
        }
        .about-visual-canvas {
          height: 550px;
        }
        
        @media (max-width: 968px) {
          .creative-about-section {
            padding: 60px 16px;
          }
          .about-grid-container {
            grid-template-columns: 1fr !important;
            gap: 60px !important;
          }
          .about-visual-canvas {
            height: 420px !important;
            max-width: 500px;
            margin: 0 auto;
          }
          /* Scaling down absolute positioning to fit mobile viewports nicely */
          .img-layer-1 {
            width: 60% !important;
            height: 180px !important;
            top: 0% !important;
            left: 10% !important;
          }
          .img-layer-2 {
            width: 50% !important;
            height: 150px !important;
            bottom: 5% !important;
            right: 5% !important;
          }
          .img-layer-3 {
            width: 32% !important;
            height: 110px !important;
            top: 50% !important;
            right: 65% !important;
          }
          .tech-outer-ring {
            width: 300px !important;
            height: 300px !important;
          }
        }
      `}</style>

      {/* Light subtle gradient ambient glow background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", width: "800px", height: "800px",
          borderRadius: "50%", top: "10%", left: "-10%",
          background: "radial-gradient(circle, rgba(0,166,255,0.06) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", width: "600px", height: "600px",
          borderRadius: "50%", bottom: "10%", right: "-5%",
          background: "radial-gradient(circle, rgba(0,68,153,0.05) 0%, transparent 70%)",
        }} />
      </div>

      {/* Tech Blueprint Grid Lines matching the Hero section */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(0,68,153,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,68,153,0.02) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      <div 
        className="about-grid-container"
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1200px",
          width: "100%",
          display: "grid",
          gap: "40px",
          alignItems: "center",
        }}
      >
        
        {/* ─── LEFT COLUMN: TEXT CONTENT ─── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
        >
          {/* Main Creative Title */}
          <motion.h2
            variants={fadeUp} custom={1}
            className="text-center lg:text-left"
            style={{
              fontSize: "clamp(32px, 4vw, 54px)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#002966",
              margin: "0 0 24px",
              letterSpacing: "-0.03em",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Empowering Learning Through <span></span>
            <span style={{
              background: "linear-gradient(90deg, #004499, #00a6ff)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
            }}>
              Innovation.
            </span>
          </motion.h2>

          {/* Core Body Paragraph */}
          <motion.p
            variants={fadeUp} custom={2}
            style={{
              fontSize: "17px", color: "#475569", lineHeight: 1.7,
              margin: "0 0 40px", fontWeight: 400, maxWidth: "520px", textAlign: "center"
            }}
          >
            EDDVA is dedicated to transforming education through technology-driven solutions. We help learners and institutions unlock their full potential with innovative tools, practical learning experiences, and a student-first approach. Our goal is to make quality education more accessible, efficient, and empowering for the next generation.
          </motion.p>

          {/* Micro-Features Row */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", marginBottom: "28px" }}>
            {[
              { icon: FiAward, title: "Hyper-Personalized Curations", desc: "No generic modules. Your dashboard reshapes dynamically based on actual goal performance indexes." },
              { icon: FiShield, title: "Cognitive Fatigue Mitigation", desc: "Our machine intelligence notes friction spikes and switches styles to optimize sustained analytical retention." }
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeUp} 
                custom={3 + idx}
                style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
              >
                <div style={{
                  padding: "12px", borderRadius: "14px", background: "rgba(0,166,255,0.08)",
                  color: "#004499", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <item.icon style={{ width: "20px", height: "20px" }} />
                </div>
                <div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#002966", fontFamily: "'Syne', sans-serif" }}>{item.title}</h4>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5, maxWidth: "420px" }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── RIGHT COLUMN: INTERACTIVE VISUAL CANVAS ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="about-visual-canvas"
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Decorative Backdrops: Tech Outer Ring */}
          <div 
            className="tech-outer-ring"
            style={{
              position: "absolute", width: "420px", height: "420px",
              borderRadius: "50%", border: "1px dashed rgba(0, 102, 204, 0.37)",
              zIndex: 1,
            }} 
          />

          {/* Image Layer 1 */}
          <motion.div
            {...floatAnimation(-12, 7)}
            className="img-layer-1"
            style={{
              position: "absolute", zIndex: 3, width: "320px", height: "240px",
              borderRadius: "20px", overflow: "hidden", top: "5%", left: "20%",
              boxShadow: "0 20px 50px rgba(0,41,102,0.12)",
              border: "1px solid rgba(0,68,153,0.1)", background: "#ffffff"
            }}
          >
            <img src={AboutImg1} alt="Platform Node Interface" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.div>

          {/* Image Layer 2 */}
          <motion.div
            {...floatAnimation(15, 6)}
            className="img-layer-2"
            style={{
              position: "absolute", zIndex: 5, width: "260px", height: "200px",
              borderRadius: "20px", overflow: "hidden", bottom: "12%", right: "8%",
              boxShadow: "0 30px 60px rgba(0,41,102,0.16)",
              border: "1px solid rgba(0,166,255,0.15)", background: "#ffffff"
            }}
          >
            <img src={AboutImg2} alt="AI Analytics Progress Matrix" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.div>

          {/* Image Layer 3 */}
          <motion.div
            {...floatAnimation(-18, 5)}
            className="img-layer-3"
            style={{
              position: "absolute", zIndex: 6, width: "160px", height: "160px",
              borderRadius: "16px", overflow: "hidden", top: "65%", right: "62%",
              boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,68,153,0.08)", background: "#ffffff"
            }}
          >
            <img src={AboutImg3} alt="Metric Node Overlay" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}