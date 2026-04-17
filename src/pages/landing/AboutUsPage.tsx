import { 
  Users, Target, Award, Heart, 
  ChevronRight, Sparkles, Brain, 
  MessageCircle, Rocket, Shield, 
  Zap, Globe, ZapIcon
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { B, P, T, IN, grad, gText, SG, TYPO, BG_STUDIO, BG_AERO, NEURAL_BG, SHADOW_PREMIUM } from "@/components/landing/DesignTokens";

// Assets
import bgHero from "@/assets/bg2.jpg";
import storyImg from "@/assets/Learn with AI_ educational inspiration.png";
import visionImg from "@/assets/glowing-lightbulb-with-graduation-cap-icon-floating-digital-space-learning-new-skill-progress_982248-12957.jpg";

const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 p-8 backdrop-blur-xl shadow-2xl ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
    <div className="relative z-10">{children}</div>
  </div>
);

export default function AboutUsPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen font-sans text-gray-900 antialiased selection:bg-blue-100" style={{ background: BG_STUDIO }}>
      <LandingNavbar />

      <main>
        {/* ══ HERO SECTION ══ */}
        <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
          {/* Background Image with Parallax */}
          <motion.div 
            style={{ y: heroY, opacity: heroOpacity }}
            className="absolute inset-0 z-0"
          >
            <img
              src={bgHero}
              alt="EDDVA Hero Background"
              className="h-full w-full object-cover object-center scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-[#f8faff]" />
          </motion.div>

          {/* Neural Pattern Overlay */}
          <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: NEURAL_BG }} />

          <div className="landing-shell-wide relative z-10">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <FadeUp>
                <div className="max-w-2xl">
                  <motion.span 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md"
                  >
                    <Sparkles className="h-4 w-4 text-yellow-400" /> Shaping the Future of Education
                  </motion.span>
                  <h1 className="text-[clamp(2.5rem,5vw+1rem,5.5rem)] font-black leading-[0.95] tracking-tighter text-white mb-8">
                    Beyond <br /> Our <span style={gText("#60A5FA", "#A78BFA")}>Vision.</span>
                  </h1>
                  <p className="mb-10 text-xl font-medium leading-relaxed text-white/80">
                    EDDVA isn't just a platform; it's a movement to democratize premium education through artificial intelligence.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-xl transition-all"
                    >
                      Our Story
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
                    >
                      Impact Report
                    </motion.button>
                  </div>
                </div>
              </FadeUp>

              <div className="hidden lg:block">
                <FadeUp delay={0.2}>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: <Users className="h-6 w-6" />, val: "1.2M+", label: "Active Learners", color: B },
                      { icon: <Target className="h-6 w-6" />, val: "98%", label: "Satisfaction", color: P },
                      { icon: <Globe className="h-6 w-6" />, val: "24/7", label: "AI Mentorship", color: T },
                      { icon: <Shield className="h-6 w-6" />, val: "Certified", label: "Expert Content", color: IN },
                    ].map((s, idx) => (
                      <GlassCard key={idx} className="hover:border-white/40 transition-all duration-500 group">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ color: s.color }}>
                          {s.icon}
                        </div>
                        <p className="text-3xl font-black text-white">{s.val}</p>
                        <p className="text-sm font-bold text-white/60 uppercase tracking-widest">{s.label}</p>
                      </GlassCard>
                    ))}
                  </div>
                </FadeUp>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden lg:block">
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-10 w-6 rounded-full border-2 border-white/30 flex justify-center pt-2"
            >
              <div className="h-2 w-1 rounded-full bg-white/50" />
            </motion.div>
          </div>
        </section>

        {/* ── THE EDDVA STORY ── */}
        <section className="py-24 relative overflow-hidden bg-white">
          <div className="landing-shell">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <FadeUp>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-[3rem]" />
                  <img 
                    src={storyImg} 
                    alt="The EDDVA Story" 
                    className="relative rounded-[3rem] shadow-2xl border border-gray-100"
                  />
                  <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-[2rem] bg-indigo-600 p-8 text-white shadow-2xl hidden md:block">
                    <ZapIcon className="h-12 w-12 mb-4" />
                    <p className="text-sm font-bold leading-tight">Lightning fast learning personalized for you.</p>
                  </div>
                </div>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div>
                  <span className={TYPO.label + " mb-4 block"}>Our Origins</span>
                  <h2 className={TYPO.h2 + " mb-8"}>
                    Engineered to <span style={gText()}>Inspire</span> and Empower.
                  </h2>
                  <div className="space-y-6 text-lg text-gray-600 leading-relaxed font-medium">
                    <p>
                      EDDVA was born from a simple realization: the classroom of the future isn't a room — it's a personalized environment that travels with you. 
                    </p>
                    <p>
                      We've combined world-class educators with cutting-edge AI to create a platform that doesn't just teach, but understands. We look at cognitive patterns, emotional engagement, and long-term retention to build paths that work.
                    </p>
                    <div className="pt-6 flex items-center gap-6">
                      <div className="flex -space-x-4">
                        {[1, 2, 3, 4].map(idx => (
                          <div key={idx} className="h-14 w-14 rounded-full border-4 border-white bg-gray-200 shadow-lg overflow-hidden">
                            <img src={`https://i.pravatar.cc/150?u=${idx + 10}`} alt="Expert" />
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xl font-black text-gray-900 leading-none">500+</p>
                        <p className="text-sm font-bold text-gray-400">Expert Educators</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── MISSION & VISION ── */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-500/5 blur-[120px] rounded-full translate-x-1/2" />
          <div className="landing-shell relative z-10">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Mission Card */}
              <FadeUp>
                <div className="group relative h-full overflow-hidden rounded-[3rem] bg-white p-12 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2">
                  <div className="absolute top-0 right-0 h-32 w-32 translate-x-16 -translate-y-16 rounded-full bg-blue-50 transition-transform group-hover:scale-150" />
                  <div className="relative z-10">
                    <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg group-hover:rotate-6 transition-transform">
                      <Target className="h-10 w-10" />
                    </div>
                    <h3 className="text-3xl font-black mb-6">Our Mission</h3>
                    <p className="text-xl text-gray-500 leading-relaxed font-medium">
                      To bridge the gap between traditional classroom learning and modern digital needs by providing high-quality, AI-personalized study paths accessible to every student, everywhere.
                    </p>
                    <div className="mt-12 h-1 w-24 bg-blue-600 rounded-full group-hover:w-full transition-all duration-700" />
                  </div>
                </div>
              </FadeUp>

              {/* Vision Card */}
              <FadeUp delay={0.2}>
                <div className="group relative h-full overflow-hidden rounded-[3rem] bg-gray-900 p-12 shadow-2xl transition-all hover:-translate-y-2">
                  <div className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40">
                    <img src={visionImg} className="h-full w-full object-cover" alt="Vision bg" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                  <div className="relative z-10">
                    <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500 text-white shadow-lg group-hover:-rotate-6 transition-transform">
                      <Rocket className="h-10 w-10" />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-6">Our Vision</h3>
                    <p className="text-xl text-white/70 leading-relaxed font-medium">
                      We envision a future where every student in India has a personal AI mentor that understands their unique learning style, helping them unlock their full potential and achieve their dreams.
                    </p>
                    <div className="mt-12 h-1 w-24 bg-indigo-500 rounded-full group-hover:w-full transition-all duration-700" />
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── CORE VALUES (PILLARS) ── */}
        <section className="py-24 bg-white">
          <div className="landing-shell">
            <div className="mb-20 text-center max-w-3xl mx-auto">
              <FadeUp>
                <span className={TYPO.label + " mb-4 block"}>Our Foundation</span>
                <h2 className={TYPO.h2}> The Pillars of <span style={gText()}>EDDVA</span></h2>
                <p className="mt-6 text-xl text-gray-500 font-medium">
                  We are guided by principles that prioritize student growth and technological integrity above all else.
                </p>
              </FadeUp>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Student First", icon: Heart, color: "#EF4444", desc: "Every decision is made with the student's success in mind." },
                { title: "Innovation", icon: Brain, color: B, desc: "We push the boundaries of EdTech with AI-driven insights." },
                { title: "Accessibility", icon: Zap, color: T, desc: "Quality education should be high-speed and reachable." },
                { title: "Excellence", icon: Award, color: P, desc: "We strive for the highest standards in content and technology." },
              ].map((pillar, idx) => (
                <FadeUp key={idx} delay={idx * 0.1}>
                  <div className="relative group h-full">
                    <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 blur transition duration-500 group-hover:opacity-20" />
                    <div className="relative flex h-full flex-col rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm transition-all hover:shadow-xl">
                      <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: pillar.color + '15', color: pillar.color }}>
                        <pillar.icon className="h-7 w-7" />
                      </div>
                      <h4 className="text-2xl font-black mb-4">{pillar.title}</h4>
                      <p className="text-gray-500 leading-relaxed font-medium">{pillar.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-gray-900" />
          <div className="absolute inset-0 z-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 50%, ${B}44 0%, transparent 70%)` }} />
          
          <div className="landing-shell-narrow relative z-10 text-center">
            <FadeUp>
              <div className="mb-12 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-20" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white text-gray-900 shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                    <MessageCircle className="h-12 w-12" />
                  </div>
                </div>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">
                Be Part of the <br /> <span style={gText()}>Future.</span>
              </h2>
              <p className="text-xl text-white/60 mb-12 max-w-xl mx-auto font-medium">
                Whether you're a student seeking excellence or an educator ready to scale, EDDVA is your partner in growth.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full bg-blue-600 px-10 py-5 text-xl font-bold text-white shadow-2xl"
                >
                  Join the Mission
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full border-2 border-white/20 bg-white/5 px-10 py-5 text-xl font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Contact Team
                </motion.button>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
