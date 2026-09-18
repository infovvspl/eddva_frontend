// HeroSection.jsx — New Website Mockup
// Banner: badge + headline + subtext + two CTAs on the left,
// photo inside a soft arc mask (ringed by pale arcs) on the right,
// with cards floating over the arc. No background image — plain white.
//
// Motion: the left column fades up in a stagger on load; the cards float and
// shift with the pointer. The photograph itself never moves. All of it stops
// under prefers-reduced-motion.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Brain, Users, Sparkles, Star, Quote, X } from "lucide-react";
import schoolHero from "../assets/school-banner.png";

// youtube.com/shorts/OXY5dOQ9wlw — the demo walkthrough linked from "Watch Video"
const DEMO_VIDEO_ID = "OXY5dOQ9wlw";

const HeroSection = () => {
  const ref = useRef(null);
  const [videoOpen, setVideoOpen] = useState(false);

  // Esc closes the modal; body scroll is locked while it's open
  useEffect(() => {
    if (!videoOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setVideoOpen(false); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [videoOpen]);

  // Pointer parallax — publishes a normalised -1..1 cursor offset as CSS vars.
  // Each layer multiplies it by its own depth, so nearer things move further.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Pointer parallax is meaningless on touch, and would fire on every scroll.
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    const onMove = (e) => {
      if (frame) return;                       // coalesce to one write per frame
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = node.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        node.style.setProperty("--nw-mx", x.toFixed(3));
        node.style.setProperty("--nw-my", y.toFixed(3));
      });
    };
    const onLeave = () => {
      node.style.setProperty("--nw-mx", "0");
      node.style.setProperty("--nw-my", "0");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section className="nw-hero" id="nw-home" ref={ref}>
      <div className="nw-hero__container">

        {/* LEFT */}
        <div className="nw-hero__content" id="nw-hero-content">
          <span className="nw-hero__glowspot" aria-hidden="true" />

          <span className="nw-hero__badge nw-rise" id="nw-hero-badge" style={{ "--nw-delay": "0s" }}>
            <Sparkles size={14} strokeWidth={2.2} />
            EDDVA – Education Development &amp; Advancement
          </span>

          <h1 className="nw-hero__heading nw-rise" style={{ "--nw-delay": "0.1s" }}>
            Transforming Education<br />
            with <span className="nw-hero__heading--accent">AI-Powered</span> Solutions
          </h1>

          <p className="nw-hero__sub nw-rise" id="nw-hero-sub" style={{ "--nw-delay": "0.22s" }}>
            Keeping the essence of traditional teaching alive, while
            empowering it with the intelligence of AI. EDDVA connects
            Students, Teachers, Parents and School Management through one
            intelligent ecosystem designed to enhance learning, empower
            educators and enable smarter decisions.
          </p>

          <p className="nw-hero__tagline nw-rise" id="nw-hero-tagline" style={{ "--nw-delay": "0.3s" }}>
            Personalised Learning. Smarter Teaching. Better Decisions.
          </p>

          <div className="nw-hero__actions nw-rise" style={{ "--nw-delay": "0.34s" }}>
            <Link to="/contact" className="nw-hero__btn nw-hero__btn--primary" id="nw-hero-demo">
              Request Free Demo
              <span className="nw-hero__btn-arrow" aria-hidden="true">
                <ArrowRight size={15} strokeWidth={2.6} />
              </span>
            </Link>
            <button
              type="button"
              className="nw-hero__btn nw-hero__btn--secondary"
              id="nw-hero-video"
              onClick={() => setVideoOpen(true)}
            >
              <span className="nw-hero__play" aria-hidden="true">
                <Play size={11} strokeWidth={2} fill="currentColor" />
              </span>
              Watch Video
            </button>
          </div>

        </div>

        {/* RIGHT — Arc-masked image, ringed by pale sweeping arcs */}
        <div className="nw-hero__image-wrap" id="nw-hero-image-wrap">
          <span className="nw-hero__glow" aria-hidden="true" />
          <span className="nw-hero__arc nw-hero__arc--outer" aria-hidden="true" />
          <span className="nw-hero__arc nw-hero__arc--inner" aria-hidden="true" />
          <span className="nw-hero__dots" aria-hidden="true" />

          <div className="nw-hero__image-mask">
            <img
              src={schoolHero}
              alt="A teacher presenting a solar system lesson on a smartboard to her class"
              className="nw-hero__image"
              id="nw-hero-school-img"
            />
          </div>


          {/* Floating cards */}
          <div className="nw-hcard nw-hcard--live" id="nw-hcard-live">
            <span className="nw-hcard__pulse" aria-hidden="true" />
            <span className="nw-hcard__live-label">Live Class</span>
          </div>

          {/* Sticky-note style prompt */}
          <div className="nw-hcard nw-hcard--note" id="nw-hcard-note">
            <span className="nw-hcard__icon nw-hcard__icon--blue" aria-hidden="true">
              <Quote size={15} strokeWidth={2} />
            </span>
            <span className="nw-hcard__note-text">
              Teach smarter,<br />not harder
            </span>
          </div>

          <div className="nw-hcard nw-hcard--ai" id="nw-hcard-ai">
            <span className="nw-hcard__icon nw-hcard__icon--blue" aria-hidden="true">
              <Brain size={17} strokeWidth={2} />
            </span>
            <span className="nw-hcard__text">
              <strong>AI Insights</strong>
              <small>Real-time analytics</small>
            </span>
          </div>

          {/* Metric card with a sparkline */}
          <div className="nw-hcard nw-hcard--metric" id="nw-hcard-metric">
            <span className="nw-hcard__metric-head">
              <small>Attendance this term</small>
              <strong>98.2%</strong>
              <em className="nw-hcard__delta">&#9650; 6.4% vs last term</em>
            </span>
            <svg className="nw-hcard__spark" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="nwSparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M2 32 L20 27 L38 29 L56 19 L74 21 L92 11 L118 5 L118 40 L2 40 Z" fill="url(#nwSparkFill)" />
              <path d="M2 32 L20 27 L38 29 L56 19 L74 21 L92 11 L118 5"
                    fill="none" stroke="#16a34a" strokeWidth="2.4"
                    strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="118" cy="5" r="3.4" fill="#16a34a" />
            </svg>
          </div>

          {/* Testimonial card */}
          <div className="nw-hcard nw-hcard--quote" id="nw-hcard-quote">
            <p className="nw-hcard__quote-text">
              &ldquo;Admin work halved, and parents finally see progress as it happens.&rdquo;
            </p>
            <div className="nw-hcard__quote-foot">
              <span className="nw-hcard__avatar" aria-hidden="true">
                <Users size={14} strokeWidth={2} />
              </span>
              <span className="nw-hcard__quote-meta">
                <strong>Priya S.</strong>
                <small>Principal</small>
              </span>
              <span className="nw-hcard__quote-stars" role="img" aria-label="Rated 5 out of 5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={11} fill="currentColor" strokeWidth={0} />
                ))}
              </span>
            </div>
          </div>

        </div>

      </div>

      {videoOpen && (
        <div
          className="nw-video-modal"
          id="nw-video-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Demo video"
          onClick={(e) => { if (e.target === e.currentTarget) setVideoOpen(false); }}
        >
          <div className="nw-video-modal__frame">
            <button
              type="button"
              className="nw-video-modal__close"
              aria-label="Close video"
              onClick={() => setVideoOpen(false)}
            >
              <X size={20} strokeWidth={2.4} />
            </button>
            <iframe
              className="nw-video-modal__iframe"
              src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1`}
              title="EDDVA demo video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
