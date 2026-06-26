import React, { useState, useRef, useEffect } from "react";
import { motion, type Variants, type MotionProps, AnimatePresence } from "framer-motion";
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

  // Animation Variants matching Hero / AboutUs structures
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

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  return (
    <section
      className="video-section-wrapper"
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
      {/* Dynamic responsive CSS rules */}
      <style>{`
        .video-section-wrapper {
          padding: 80px 24px;
        }
        .video-grid-container {
          grid-template-columns: repeat(2, 1fr);
          gap: 80px;
        }
        .video-card-canvas {
          height: 460px;
        }
        .video-feature-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .play-btn-hover:hover {
          background: #004499 !important;
          color: #ffffff !important;
        }

        @media (max-width: 991px) {
          .video-section-wrapper {
            padding: 60px 20px;
          }
          .video-grid-container {
            grid-template-columns: 1fr !important;
            gap: 50px !important;
          }
          .video-card-canvas {
            height: 340px !important;
            max-width: 580px;
            margin: 0 auto;
          }
          .tech-outer-circle-bg {
            width: 360px !important;
            height: 360px !important;
          }
        }

        @media (max-width: 540px) {
          .video-card-canvas {
            height: 240px !important;
          }
          .video-feature-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .tech-outer-circle-bg {
            width: 260px !important;
            height: 260px !important;
          }
        }
      `}</style>

      {/* Light subtle gradient ambient glow background matching premium vibe */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", width: "700px", height: "700px",
          borderRadius: "50%", top: "20%", right: "-10%",
          background: "radial-gradient(circle, rgba(0,166,255,0.05) 0%, transparent 65%)",
        }} />
        <div style={{
          position: "absolute", width: "600px", height: "600px",
          borderRadius: "50%", bottom: "-5%", left: "-5%",
          background: "radial-gradient(circle, rgba(0,68,153,0.04) 0%, transparent 70%)",
        }} />
      </div>

      {/* Tech Blueprint Grid Lines */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(0,68,153,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,68,153,0.02) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      <div 
        className="video-grid-container"
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1200px",
          width: "100%",
          display: "grid",
          alignItems: "center",
        }}
      >
        
        {/* ─── LEFT COLUMN: INTERACTIVE AUTO-PLAYING VIDEO CARD ─── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="video-card-canvas"
          style={{
            position: "relative",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Decorative Backdrops: Tech Outer Circle */}
          <div 
            className="tech-outer-circle-bg"
            style={{
              position: "absolute", width: "480px", height: "480px",
              borderRadius: "50%", border: "1px dashed rgba(0,102,204,0.12)",
              zIndex: 1,
            }} 
          />

          {/* Interactive Cinematic Video Card Block */}
          <motion.div
            variants={fadeUp} custom={1}
            onClick={() => setIsOpen(true)}
            whileHover={{ y: -6, boxShadow: "0 30px 60px rgba(0,41,102,0.16)" }}
            style={{
              position: "relative",
              zIndex: 5,
              width: "100%",
              height: "100%",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,41,102,0.1)",
              border: "1px solid rgba(0,68,153,0.12)",
              background: "#001a40",
              cursor: "pointer",
              transition: "box-shadow 0.4s, transform 0.4s",
            }}
          >
            <video
              src={Intro}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.75,
              }}
            />

            {/* Premium Deep Tint Overlay Matrix */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,41,102,0.5) 0%, rgba(0,0,0,0) 60%)",
            }} />

            {/* Central High-Tech Pulsing Trigger Overlay */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ position: "absolute", width: "88px", height: "88px", background: "rgba(0,166,255,0.25)", borderRadius: "50%" }}
                />
                <div style={{
                  width: "68px", height: "68px", borderRadius: "50%",
                  background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(0,41,102,0.15)", color: "#004499",
                  transition: "background 0.3s, color 0.3s",
                }}
                className="play-btn-hover"
                >
                  <FiPlay style={{ width: "22px", height: "22px", marginLeft: "4px", fill: "currentColor" }} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── RIGHT COLUMN: GRID CONTENT & COPY MATRIX ─── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
        >
          {/* Main Title Structure */}
          <motion.h2
            variants={fadeUp} custom={0}
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#002966",
              margin: "0 0 20px",
              letterSpacing: "-0.03em",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Built for precision, <span></span>
            <span style={{
              background: "linear-gradient(90deg, #004499, #00a6ff)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
            }}>
              clarity, and results.
            </span>
          </motion.h2>

          {/* Editorial Subtitle Description */}
          <motion.p
            variants={fadeUp} custom={1}
            style={{
              fontSize: "16px", color: "#475569", lineHeight: 1.7,
              margin: "0 0 44px", fontWeight: 400, maxWidth: "480px", textAlign: "center"
            }}
          >
            A learning journey that understands you before it guides you—curated, measurable, and always within reach when doubt appears.
          </motion.p>

          {/* Core Feature Matrix Grid Blocks */}
          <div 
            className="video-feature-grid"
            style={{
              display: "grid",
              gap: "36px 28px",
              width: "100%",
              borderTop: "1px solid rgba(0, 68, 153, 0.08)",
              paddingTop: "40px"
            }}
          >
            {[
              { icon: FiSliders, color: "#004499", bg: "rgba(0,68,153,0.06)", title: "Adaptive Learning", desc: "A system that learns how you think before it teaches. Eddva adapts to your pace and patterns, shaping a journey that feels natural." },
              { icon: FiLayers, color: "#8b5cf6", bg: "rgba(139,92,246,0.06)", title: "Intelligent Recom.", desc: "Curated, not crowded. Access a refined selection of videos, notes, assessments, and mock tests aligned with your goals." },
              { icon: FiActivity, color: "#10b981", bg: "rgba(16,185,129,0.06)", title: "Performance Intel.", desc: "Measure what truly matters. Track your progress through insightful analytics, competitive rankings, and performance indicators." },
              { icon: FiCpu, color: "#f59e0b", bg: "rgba(245,158,11,0.06)", title: "Always-On Clarity", desc: "Uninterrupted understanding. With instant AI-powered doubt resolution and contextual support, clarity is never delayed." }
            ].map((pillar, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                custom={2 + idx}
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "12px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    padding: "10px", borderRadius: "10px", background: pillar.bg,
                    color: pillar.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <pillar.icon style={{ width: "16px", height: "16px" }} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#002966", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.01em" }}>
                    {pillar.title}
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.6, fontWeight: 400 }}>
                  {pillar.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>

      {/* ─── LIGHTBOX VIDEO EXPAND MODAL ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px", background: "rgba(0, 15, 40, 0.85)", backdropFilter: "blur(16px)",
            }}
            onClick={() => setIsOpen(false)}
          >
            {/* Action Frame Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute", top: "16px", right: "16px", padding: "12px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#ffffff", borderRadius: "50%", display: "flex", cursor: "pointer",
                transition: "background 0.2s, color 0.2s", zIndex: 10
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            >
              <FiX style={{ width: "20px", height: "20px" }} />
            </button>

            {/* Scaled Interactive Canvas Container Frame */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "relative", width: "100%", maxWidth: "1040px",
                aspectRatio: "16/9", background: "#000000", borderRadius: "16px",
                overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <video
                ref={modalVideoRef}
                src={Intro}
                style={{ width: "100%", height: "100%", display: "block" }}
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