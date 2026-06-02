import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  type Variants,
  useScroll,
  useTransform,
} from "framer-motion";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiPlay } from "react-icons/fi";
import H1 from '../../assets/H1.png';
import H2 from '../../assets/h7.png';
import H3 from '../../assets/h8.png';
import H4 from '../../assets/H4.png';

// ─── Particle field ───────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let W: number, H: number;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      alpha: Math.random() * 0.5 + 0.15,
    }));

    function resize() {
      if (!canvas) return;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 220, 255, ${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = (particles[i].x - particles[j].x) * W;
          const dy = (particles[i].y - particles[j].y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x * W, particles[i].y * H);
            ctx.lineTo(particles[j].x * W, particles[j].y * H);
            ctx.strokeStyle = `rgba(100, 180, 255, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

// ─── Rotating words ───────────────────────────────────────────────────────────
const WORDS = ["Precision.", "Clarity.", "Purpose.", "Mastery."];

function RotatingWord() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        minWidth: "200px",
        textAlign: "left",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "inline-block",
            background: "linear-gradient(90deg, #7dd3fc, #ffffff, #93c5fd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {WORDS[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ─── Feature pill ─────────────────────────────────────────────────────────────
function FeaturePill({ icon, label, delay }: { icon: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "rgba(255,255,255,0.85)",
        fontSize: "13px",
        fontWeight: 500,
        backdropFilter: "blur(4px)",
        letterSpacing: "0.01em",
      }}
    >
      {/* <span style={{ fontSize: "15px" }}>{icon}</span> */}
      {label}
    </motion.div>
  );
}

// ─── Floating Decorative Image Component ──────────────────────────────────────
interface FloatingImageProps {
  style: React.CSSProperties;
  src: string;
  alt: string;
  delay?: number;
  directionX: number; // Positive values move right, negative move left
  directionY: number; // Positive values move down, negative move up
}

function FloatingImage({ style, src, alt, delay = 0, directionX, directionY }: FloatingImageProps) {
  // Tracks overall window scroll progress
  const { scrollY } = useScroll();
  
  // Transform scroll pixels (e.g., 0px to 600px) into subtle convergence offsets
  const translateX = useTransform(scrollY, [0, 600], [0, directionX]);
  const translateY = useTransform(scrollY, [0, 600], [0, directionY]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute",
        zIndex: 5,
        pointerEvents: "none",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(4px)",
        x: translateX, // Dynamically driven by scroll
        y: translateY, // Dynamically driven by scroll
        ...style,
      }}
    >
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </motion.div>
  );
}

// ─── Main Hero ────────────────────────────────────────────────────────────────
export default function HeroSection() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        delay: i * 0.12,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #002966 0%, #004499 30%, #0066cc 65%, #00a6ff 100%)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px 80px",
        boxSizing: "border-box",
      }}
    >
      {/* Deep background orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", width: "700px", height: "700px",
          borderRadius: "50%", top: "-200px", right: "-150px",
          background: "radial-gradient(circle, rgba(0,166,255,0.22) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", width: "500px", height: "500px",
          borderRadius: "50%", bottom: "-100px", left: "-100px",
          background: "radial-gradient(circle, rgba(0,80,200,0.3) 0%, transparent 70%)",
        }} />
      </div>

      {/* Grid lines */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      <ParticleField />

      {/* Floating Accent Images with direction configuration */}
      {isDesktop && (
        <>
          {/* Top Left: moves Right & Down */}
          <FloatingImage 
            src={H1} 
            alt="Dashboard Element"
            style={{ top: "15%", left: "6%", width: "200px", height: "200px" }} 
            delay={1.2}
            directionX={80}
            directionY={40}
          />
          {/* Top Right: moves Left & Down */}
          <FloatingImage 
            src={H2} 
            alt="Analytics Graphic"
            style={{ top: "20%", right: "6%", width: "240px", height: "180px" }} 
            delay={1.4}
            directionX={-80}
            directionY={40}
          />
          {/* Bottom Left: moves Right & Up */}
          <FloatingImage 
            src={H4}
            alt="Student Interface Profile"
            style={{ bottom: "16%", left: "8%", width: "190px", height: "210px" }} 
            delay={1.6}
            directionX={80}
            directionY={-40}
          />
          {/* Bottom Right: moves Left & Up */}
          <FloatingImage 
            src={H3}
            alt="Course Matrix Chart"
            style={{ bottom: "18%", right: "8%", width: "190px", height: "210px" }} 
            delay={1.8}
            directionX={-80}
            directionY={-40}
          />
        </>
      )}

      {/* Content Canvas */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "760px" }}>
        
        {/* Trust badge */}
        <motion.div
          variants={fadeUp} custom={0}
          initial="hidden" animate="visible"
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 18px 6px 8px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {["#60a5fa","#34d399","#f472b6"].map((c, i) => (
              <div key={i} style={{
                width: "24px", height: "24px", borderRadius: "50%",
                background: c, border: "2px solid rgba(0,50,140,0.8)",
                marginLeft: i === 0 ? 0 : "-6px", fontSize: "11px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {["😊","🎓","💡"][i]}
              </div>
            ))}
          </div>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500 }}>
            Trusted by 10,000+ learners
          </span>
          <span style={{
            background: "rgba(125,211,252,0.25)", color: "#7dd3fc",
            fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
          }}>
            NEW
          </span>
        </motion.div>

        {/* H1 Title */}
        <motion.h1
          variants={fadeUp} custom={1}
          initial="hidden" animate="visible"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#ffffff",
            margin: "0 0 16px",
            letterSpacing: "-0.03em",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          Smarter Learning.<br />
          <RotatingWord />
        </motion.h1>

        {/* Divider line with label */}
        <motion.div
          variants={fadeUp} custom={2}
          initial="hidden" animate="visible"
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            justifyContent: "center", margin: "24px 0",
          }}
        >
          <div style={{ height: "1px", width: "60px", background: "rgba(255, 255, 255, 0.42)" }} />
          <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.74)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Built for those who seek an edge
          </span>
          <div style={{ height: "1px", width: "60px", background: "rgba(255, 255, 255, 0.43)" }} />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp} custom={3}
          initial="hidden" animate="visible"
          style={{
            fontSize: "clamp(15px, 1.8vw, 18px)",
            color: "rgb(255, 255, 255)",
            lineHeight: 1.7,
            maxWidth: "580px",
            margin: "0 auto 14px",
            fontWeight: 400,
          }}
        >
          "EDDVA is created for students who want to achieve more. It is designed for those who seek precision, clarity, and an edge."
        </motion.p>
        <motion.p
          variants={fadeUp} custom={3}
          initial="hidden" animate="visible"
          style={{
            fontSize: "clamp(15px, 1.8vw, 18px)",
            color: "rgb(255, 255, 255)",
            lineHeight: 1.7,
            maxWidth: "580px",
            margin: "0 auto 36px",
            fontWeight: 400,
          }}
        >
          Powered by advanced AI, Eddva creates a learning experience that is deeply personalized,
          intelligently curated, and relentlessly focused on results. You don't just study here — you evolve with purpose.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          variants={fadeUp} custom={4}
          initial="hidden" animate="visible"
          style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "40px" }}
        >
          <FeaturePill icon="⚡" label="AI-Personalized" delay={0.8} />
          <FeaturePill icon="🎯" label="Goal-Driven" delay={0.9} />
          <FeaturePill icon="📊" label="Progress Tracking" delay={1.0} />
          <FeaturePill icon="🌐" label="Learn Anywhere" delay={1.1} />
        </motion.div>

        {/* CTAs */}
        <motion.div
          variants={fadeUp} custom={5}
          initial="hidden" animate="visible"
          style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link
            to="/register"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "15px 32px", borderRadius: "14px",
              background: "#ffffff",
              color: "#004499",
              fontSize: "15px", fontWeight: 700,
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.2)"; }}
          >
            Start learning free
            <FiArrowUpRight style={{ width: "18px", height: "18px" }} />
          </Link>

          <Link
            to="/courses"
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              padding: "15px 32px", borderRadius: "14px",
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              fontSize: "15px", fontWeight: 600,
              textDecoration: "none",
              transition: "transform 0.2s, background 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          >
            <span style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FiPlay style={{ width: "12px", height: "12px", fill: "white", color: "white" }} />
            </span>
            Explore courses
          </Link>
        </motion.div>

        {/* Social proof strip */}
        {/* <motion.div
          variants={fadeUp} custom={6}
          initial="hidden" animate="visible"
          style={{
            display: "flex", gap: "32px", justifyContent: "center",
            marginTop: "52px", flexWrap: "wrap",
          }}
        >
          {[
            { value: "10K+", label: "Active learners" },
            { value: "500+", label: "Expert courses" },
            { value: "4.9★", label: "Average rating" },
            { value: "94%", label: "Completion rate" },
          ].map((s, i) => (
            <React.Fragment key={s.value}>
              {i > 0 && (
                <div style={{ width: "1px", background: "rgba(255,255,255,0.15)", alignSelf: "stretch" }} />
              )}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "clamp(22px, 3vw, 28px)",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1,
                  fontFamily: "'Syne', sans-serif",
                }}>{s.value}</div>
                <div style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </motion.div> */}
      </div>

      {/* Bottom gradient fade */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "120px",
        background: "linear-gradient(to bottom, transparent, rgba(0,40,120,0.3))",
        pointerEvents: "none", zIndex: 2,
      }} />
    </section>
  );
}