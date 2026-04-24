import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import {
  Brain, Zap, MessageCircle, Star,
  Menu, X, ArrowRight, Sparkles, TrendingUp,
  Award, Target, Bot, ChevronRight, Play,
  Search, Smartphone,
  Mail, Phone, MapPin,
  GraduationCap, BarChart,
  Bell, Rocket,
} from "lucide-react";
import aboutImg from "@/assets/eddva web img 2.png";
import coursesImg from "@/assets/chalkboard-with-learn-explore-discover-create-education-concept_1296762-4420.jpg";
import careerImg from "@/assets/glowing-lightbulb-with-graduation-cap-icon-floating-digital-space-learning-new-skill-progress_982248-12957.jpg";
import aboutVideo from "@/assets/about.mp4";
import bgVideo from "@/assets/bg.mp4";
import LandingLayout from "@/components/landing/LandingLayout";
import { FadeUp, Label as SLabel, HeroBadge as FloatBadge } from "@/components/landing/LandingPrimitives";
import { B, P, T, IN, grad, gText, SG } from "@/components/landing/DesignTokens";
import bg1 from "@/assets/bg1.jpg";
import bg2 from "@/assets/bg2.jpg";
import { useIsCompactLayout } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";


const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};

function AutoPlayVideo({
  src,
  className,
  poster,
}: {
  src: string;
  className: string;
  poster?: string;
}) {
  const loadRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shouldLoad = useInView(loadRef, { amount: 0, margin: "280px 0px" });
  const isActiveView = useInView(videoRef, { amount: 0.4, margin: "-10% 0px -10% 0px" });
  const [hasLoadedSource, setHasLoadedSource] = useState(false);

  useEffect(() => {
    if (shouldLoad) setHasLoadedSource(true);
  }, [shouldLoad]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (isActiveView && !document.hidden) {
      void videoEl.play().catch(() => { });
    } else {
      videoEl.pause();
    }
  }, [isActiveView]);

  return (
    <div ref={loadRef} className="h-full w-full">
      <video
        ref={videoRef}
        src={hasLoadedSource ? src : undefined}
        className={className}
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
      />
    </div>
  );
}
/* ── Data ── */
const examCategories = [
  { id: "jee", name: "IIT JEE", icon: "⚛️", color: B, tags: ["Class 11", "Class 12", "Dropper"], students: "32K+", desc: "Crack IIT with AI-powered Physics, Chemistry & Maths prep — adaptive tests and full syllabus coverage.", popular: true, href: "/exam/iit-jee" },
  { id: "neet", name: "NEET UG", icon: "🩺", color: "#EF4444", tags: ["Class 11", "Class 12", "Dropper"], students: "24K+", desc: "Complete Biology, Physics & Chemistry preparation for MBBS & BDS entrance with mock tests.", popular: true, href: "/exam/neet-ug" },
  { id: "state", name: "State Board 9–11", icon: "📚", color: "#F59E0B", tags: ["Class 9", "Class 10", "Class 11"], students: "18K+", desc: "Foundation-level preparation for all major state boards — MP, UP, MH, Rajasthan & more.", popular: true, comingSoon: true },
  { id: "cbse", name: "CBSE 9–12", icon: "🎓", color: T, tags: ["Class 9", "Class 10", "Class 11", "Class 12"], students: "28K+", desc: "NCERT-aligned complete CBSE prep for Science, Maths, English & Social Studies.", popular: true, comingSoon: true },
  { id: "icse", name: "ICSE / ISC", icon: "🏫", color: P, tags: ["Class 9", "Class 10"], students: "9K+", desc: "CISCE board prep for Class 9 & 10 with detailed topic-wise notes and solved papers.", comingSoon: true },
  { id: "isc", name: "ISC Class 11–12", icon: "📐", color: IN, tags: ["Class 11", "Class 12"], students: "7K+", desc: "ISC Science and Commerce prep with chapter-wise tests, previous papers and AI guidance.", comingSoon: true },
];

const howSteps = [
  { num: "01", icon: <GraduationCap className="h-6 w-6" />, title: "Sign Up", desc: "Create your account in 30 seconds. No credit card required.", color: B },
  { num: "02", icon: <Target className="h-6 w-6" />, title: "Choose Exam", desc: "Pick your target exam and tell us your current level and exam date.", color: IN },
  { num: "03", icon: <Brain className="h-6 w-6" />, title: "Learn with AI", desc: "Get a personalized study plan. Practice adaptive quizzes and tests.", color: P },
  { num: "04", icon: <TrendingUp className="h-6 w-6" />, title: "Track Progress", desc: "Review performance dashboards, fix weak topics, and hit your target.", color: T },
];

const courses = [
  { id: 1, name: "Physics — Wave Optics", exam: "JEE", pct: 68, color: B, from: B, to: IN, lastSeen: "Yesterday", chapters: 12, rating: 4.8, students: "12K", instructor: "Dr. Anil Kumar", thumb: aboutImg },
  { id: 2, name: "Organic Chemistry", exam: "NEET", pct: 45, color: "#EF4444", from: "#EF4444", to: "#F97316", lastSeen: "2 days ago", chapters: 18, rating: 4.9, students: "18K", instructor: "Prof. Sunita Rao", thumb: coursesImg },
  { id: 3, name: "Indian Polity & Governance", exam: "UPSC", pct: 82, color: "#0EA5E9", from: "#0EA5E9", to: T, lastSeen: "Today", chapters: 22, rating: 4.7, students: "9K", instructor: "IAS Ravi Shankar", thumb: careerImg },
  { id: 4, name: "Quantitative Aptitude", exam: "SSC", pct: 55, color: P, from: P, to: "#6366F1", lastSeen: "3 days ago", chapters: 14, rating: 4.6, students: "14K", instructor: "Meena Sharma", thumb: careerImg },
  { id: 5, name: "Mathematics — Integration", exam: "JEE", pct: 31, color: IN, from: IN, to: P, lastSeen: "1 week ago", chapters: 9, rating: 4.9, students: "20K", instructor: "Dr. Prabhas Nair", thumb: coursesImg },
  { id: 6, name: "Reasoning & Puzzles", exam: "Banking", pct: 74, color: T, from: T, to: "#0EA5E9", lastSeen: "Today", chapters: 10, rating: 4.5, students: "7K", instructor: "Kavitha Reddy", thumb: aboutImg },
];


const testimonials = [
  { name: "Priya Sharma", role: "JEE Aspirant", text: "EDDVA's adaptive plan helped me improve my Physics score from 54% to 89% in just 3 months!", avatar: "P", color: B },
  { name: "Rahul Mehta", role: "Parent", text: "Finally a platform my son actually uses daily. The AI doubt solver is incredible — available at 2am!", avatar: "R", color: P },
  { name: "Ananya Singh", role: "NEET Student", text: "The test analytics showed me exactly where I was losing marks. Went from 550 to 680 in NEET mock.", avatar: "A", color: T },
];

/* ════════════════════════════════════════════════════════ */
const Index = () => {
  const isCompact = useIsCompactLayout();
  const reduceMotion = useReducedMotion();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lightHomeMotion = isCompact || reduceMotion || isInitialLoad;

  useEffect(() => {
    const settleTimer = window.setTimeout(() => {
      setIsInitialLoad(false);
    }, 1400);
    return () => window.clearTimeout(settleTimer);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "engineering" | "medical" | "boards">("all");
  const [coursePage, setCoursePage] = useState(0);
  const [courseProgress, setCourseProgress] = useState(0);
  const PAGES = 2; // 6 courses / 3 per page
  const INTERVAL = 4500;

  useEffect(() => {
    setCourseProgress(0);
    const prog = setInterval(() => setCourseProgress(p => Math.min(p + 100 / (INTERVAL / 50), 100)), 50);
    const adv = setTimeout(() => { setCoursePage(p => (p + 1) % PAGES); }, INTERVAL);
    return () => { clearInterval(prog); clearTimeout(adv); };
  }, [coursePage]);

  const tabMap: Record<string, string[]> = {
    all: ["jee", "neet", "state", "cbse", "icse", "isc"],
    engineering: ["jee"],
    medical: ["neet"],
    boards: ["state", "cbse", "icse", "isc"],
  };

  const filteredExams = examCategories.filter(e =>
    tabMap[activeTab].includes(e.id) &&
    (searchQuery === "" || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const features = [
    {
      icon: "🚀",
      title: "Future Learning",
      desc: "AI-powered paths for tomorrow",
      color: "from-blue-400 to-cyan-400"
    },
    {
      icon: "💡",
      title: "Knowledge Evolution",
      desc: "Grow from basics to advanced",
      color: "from-yellow-400 to-orange-400"
    },
    {
      icon: "📈",
      title: "Digital Growth",
      desc: "Track real progress easily",
      color: "from-green-400 to-emerald-400"
    },
    {
      icon: "✨",
      title: "Idea Spark",
      desc: "Unlock creativity & curiosity",
      color: "from-purple-400 to-pink-400"
    },
  ];
  return (
    <LandingLayout>


      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative overflow-hidden pb-0 pt-16 lg:pt-20">
        {/* layered soft bg */}
        <div className="absolute inset-0 -z-10" style={{ background: SG }} />
        {lightHomeMotion ? (
          <>
            <div
              className="pointer-events-none absolute -right-32 -top-32 h-[min(100vw,520px)] w-[min(100vw,520px)] max-w-[520px] rounded-full blur-[80px] sm:blur-[120px]"
              style={{ background: B, opacity: 0.24, transform: "scale(1.06)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-20 h-64 w-64 max-w-[80vw] rounded-full blur-[70px] sm:h-80 sm:w-80 sm:blur-[100px]"
              style={{ background: P, opacity: 0.16 }}
            />
          </>
        ) : (
          <>
            <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.28, 0.18] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" as const }}
              className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full blur-[120px]" style={{ background: B }} />
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.2, 0.12] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" as const, delay: 3 }}
              className="pointer-events-none absolute -bottom-16 -left-20 h-80 w-80 rounded-full blur-[100px]" style={{ background: P }} />
          </>
        )}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.025]"
          style={{ backgroundImage: `radial-gradient(circle, #3B82F6 1.5px, transparent 1.5px)`, backgroundSize: "30px 30px" }} />

        <div className="landing-shell">
          <div className="grid items-center gap-10 pb-0 lg:grid-cols-2 lg:gap-16">
            {/* ─ Left copy ─ */}
            <div className="pt-4 lg:pt-0">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-4 py-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">Eddva</span>
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="landing-title-hero mb-6">
                <span className="block text-gray-900">Smarter Learning.</span>
                <span className="block" style={gText()}>Brighter Futures.</span>
              </motion.h1>

              {/* <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.15 }}
                className="mb-5 max-w-xl text-lg font-semibold leading-snug text-gray-800 sm:text-xl">
                Because excellence demands a smarter way to learn.
              </motion.p> */}

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-6 max-w-xl space-y-4 text-[15px] font-medium leading-relaxed text-gray-600 sm:text-[16px]">
                <p className="font-bold">
                  "Eddva is not built for average learning. It is designed for those who seek precision, clarity, and an edge".
                </p>
                <p>
                  Powered by advanced AI, Eddva creates an experience that is deeply personalized, intelligently curated, and relentlessly focused on results. Every interaction is intentional. Every recommendation is refined.
                </p>
                <p className="text-gray-700">
                  You don&apos;t just study here—you evolve with purpose.
                </p>
                <p className="border-l-4 border-primary/40 pl-4 text-[15px] font-semibold text-gray-800">
                  Learn with clarity. Perform with confidence. Stay ahead with Eddva.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-10 flex flex-wrap gap-3">
                <motion.div whileHover={{ scale: 1.04, boxShadow: `0 16px 40px ${B}40` }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register"
                    className="landing-button flex items-center gap-2 text-white shadow-lg"
                    style={{ background: grad() }}>
                    Start Learning <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
                <motion.a href="#exams" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="landing-button flex items-center gap-2 border-2 border-gray-200 bg-white text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50">
                  Explore Exams <ChevronRight className="h-4 w-4" />
                </motion.a>
              </motion.div>
            </div>

            {/* ─ Right illustration (static shell + LCP image — no opacity-0 to paint faster) ─ */}
            <div className="relative flex justify-center pb-8 lg:pb-0">
              <div className="absolute inset-10 rounded-full blur-3xl opacity-20" style={{ background: grad() }} aria-hidden />
              <img
                src="/landing-hero-lcp.png"
                alt="Student learning on EDDVA with AI"
                className="relative z-10 h-auto w-full max-w-[520px] object-contain"
                width={520}
                height={416}
                sizes="(min-width: 1024px) 520px, min(90vw, 520px)"
                decoding="async"
                fetchPriority="high"
              />

              {/* floating cards */}
              {/* <FloatBadge icon={<Zap className="h-4 w-4" />} label="XP Today" value="+240 pts"
                color={B} bg="#EFF6FF" drift={-8} delay={0} className="absolute left-2 top-16 z-20" />
              <FloatBadge icon={<TrendingUp className="h-4 w-4" />} label="Accuracy" value="89.4%"
                color={T} bg="#ECFDF5" drift={8} delay={0.7} className="absolute bottom-16 right-2 z-20" />
              <FloatBadge icon={<Award className="h-4 w-4" />} label="Rank" value="#3 in Batch"
                color={P} bg="#F5F3FF" drift={-6} delay={1.4} className="absolute right-10 top-8 z-20" /> */}

              {/* AI insight bubble */}
              {/* <motion.div animate={{ y:[0,-6,0] }} transition={{ duration:4, repeat:Infinity, ease:"easeInOut" as const, delay:2 }}
                className="absolute bottom-32 left-2 z-20 max-w-[190px] rounded-2xl border border-gray-100 bg-white p-3 shadow-xl">
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: grad() }}>AI</div>
                  <p className="text-[11px] leading-snug text-gray-700">
                    Chemistry needs attention — recovery plan ready! 🎯
                  </p>
                </div>
              </motion.div> */}
            </div>
          </div>
        </div>

        {/* soft wave */}
        {/* <svg viewBox="0 0 1440 60" className="mt-0 w-full" style={{ marginBottom:"0px" }}>
          <path d="M0,40 C360,70 1080,10 1440,40 L1440,60 L0,60 Z" fill="white" />
        </svg> */}
      </section>
      {/* ══════════════════════ ABOUT ══════════════════════ */}
      <section className="landing-section" id="about"
        style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #F8FBFF 52%, #F6F5FF 100%)" }}>
        <div className="landing-shell">
          <div className="mx-auto max-w-[1280px] px-1 sm:px-2">
            <FadeUp disableInitial delay={0.08} className="mx-auto mb-8 max-w-[800px] text-center lg:mb-10">
              <h2 className="landing-title-section mx-auto  text-balance">
                Built for precision,{" "}
                <span style={gText()}>clarity, and results</span>
              </h2>
              <p className="mx-auto mt-4 max-w-[56ch] text-[15px] font-medium leading-relaxed text-slate-500 sm:text-[16px]">
                A learning journey that understands you before it guides you—curated, measurable, and always within reach when doubt appears.
              </p>
            </FadeUp>
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

              {/* About image panel */}
              <FadeUp disableInitial className="flex items-center justify-center lg:pr-2">
                <div className="relative w-full max-w-[760px] overflow-hidden rounded-[30px] shadow-[0_20px_48px_rgba(59,130,246,0.12)] lg:max-w-[720px]">
                  <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-blue-200/45 via-sky-100/35 to-violet-200/45 blur-2xl" />
                  {lightHomeMotion ? (
                    <img
                      src={aboutImg}
                      alt="EDDVA live learning preview"
                      loading="lazy"
                      decoding="async"
                      className="h-[300px] w-full object-cover bg-slate-950 object-center sm:h-[360px] lg:h-[408px]"
                    />
                  ) : (
                    <AutoPlayVideo
                      src={bgVideo}
                      poster={aboutImg}
                      className="h-[300px] w-full object-contain bg-slate-950 object-center sm:h-[360px] lg:h-[408px]"
                    />
                  )}
                  {/*            
                <div className="absolute bottom-6 left-5 right-5 flex flex-wrap gap-3">
                  {[
                    { icon:"⚡", val:"4,820 XP",   color:"#3B82F6", bg:"rgba(59,130,246,0.15)" },
                    { icon:"🔥", val:"12-day Streak", color:"#F59E0B", bg:"rgba(245,158,11,0.15)" },
                    { icon:"🎯", val:"89% Accuracy", color:"#10B981", bg:"rgba(16,185,129,0.15)" },
                    { icon:"🏆", val:"Rank #3",      color:"#8B5CF6", bg:"rgba(139,92,246,0.15)" },
                  ].map(s => (
                    <motion.div key={s.val} whileHover={{ y:-3 }}
                      className="flex items-center gap-2 rounded-2xl border border-gray-200 px-3.5 py-2 backdrop-blur-md"
                      style={{ background:s.bg }}>
                      <span className="text-[15px]">{s.icon}</span>
                      <span className="text-[12px] font-bold text-white">{s.val}</span>
                    </motion.div>
                  ))}
                </div> */}
                  {/* top label */}
                  <div className="absolute left-5 top-5">
                    <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                      <span className="text-[11px] font-bold text-white">Live Learning Platform</span>
                    </div>
                  </div>
                </div>
              </FadeUp>

              {/* Feature cards */}
              <FadeUp disableInitial delay={0.15} className="mx-auto w-full max-w-[560px] lg:pl-2">
                <div className="relative grid gap-3">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-3 -z-10 rounded-[28px] bg-gradient-to-br from-amber-200/40 via-yellow-100/25 to-orange-200/35 blur-xl"
                  />
                  {[
                    {
                      icon: <Brain className="h-5 w-5" />,
                      color: B,
                      bg: "#EFF6FF",
                      title: "Adaptive Learning",
                      desc: "A system that learns how you think before it teaches. Eddva adapts to your pace and patterns, shaping a journey that feels natural, focused, and truly yours.",
                    },
                    {
                      icon: <Zap className="h-5 w-5" />,
                      color: P,
                      bg: "#F5F3FF",
                      title: "Intelligent Recommendations",
                      desc: "Curated, not crowded. Access a refined selection of videos, notes, assessments, and mock tests—strategically aligned with your goals and timeline.",
                    },
                    {
                      icon: <BarChart className="h-5 w-5" />,
                      color: T,
                      bg: "#ECFDF5",
                      title: "Performance Intelligence",
                      desc: "Measure what truly matters. Track your progress through insightful analytics, competitive rankings, and performance indicators designed to keep you focused and driven.",
                    },
                    {
                      icon: <MessageCircle className="h-5 w-5" />,
                      color: IN,
                      bg: "#EEF2FF",
                      title: "Always-On Clarity",
                      desc: "Uninterrupted understanding. With instant AI-powered doubt resolution and contextual in-video support, clarity is never delayed.",
                    },
                  ].map(item => (
                    <motion.div key={item.title} whileHover={lightHomeMotion ? undefined : { y: -1 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white/92 p-4 shadow-[0_6px_16px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 transition-transform duration-200">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: item.bg, color: item.color }}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-slate-900 sm:text-[16px]">{item.title}</p>
                        <p className="mt-1 text-[14px] leading-relaxed text-slate-500 sm:text-[14.5px]">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </FadeUp>
            </div>
            <div className="mt-11 flex justify-center">
              <motion.a href="/courses" whileHover={lightHomeMotion ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="relative isolate inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_32px_rgba(99,102,241,0.28)] transition-transform duration-300"
                style={{ background: grad() }}>
                <span className="pointer-events-none absolute -inset-1 -z-10 rounded-[20px] bg-gradient-to-r from-blue-500/20 to-violet-500/25 blur-md" aria-hidden />
                Start Your Journey <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ EXAM CATEGORIES ══════════════════════ */}
      <section
        className="landing-section overflow-hidden"
        id="exams"
        style={{ background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)" }}
      >
        <div className="landing-shell">
          <FadeUp className="mb-4 text-center">
            <SLabel>Exam Categories</SLabel>
          </FadeUp>
          <FadeUp delay={0.05} className="mb-5 text-center">
            <h2 className="landing-title-section">
              Choose Your <span style={gText()}>Exam Path</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1} className="mb-8 text-center">
            <p className="mx-auto max-w-2xl text-[18px] font-medium leading-relaxed text-gray-500">
              Comprehensive preparation for 20+ exams. Pick your goal and we'll build your personalized path.
            </p>
          </FadeUp>

          <FadeUp delay={0.11} className="mb-8">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
              <div className={cn(
                "rounded-full border border-blue-100 px-5 py-2.5 text-[15px] font-bold text-gray-700 shadow-sm",
                "bg-white"
              )}>
                2 Live tracks: <span className="text-blue-600">JEE</span> and <span className="text-red-500">NEET</span>
              </div>
              <div className="rounded-full border border-red-100 bg-red-50 px-5 py-2.5 text-[15px] font-bold text-red-700 shadow-sm">
                School boards are Coming Soon
              </div>
            </div>
          </FadeUp>

          {/* Search + tab filter */}
          <FadeUp delay={0.12} className={cn(
            "mb-8 flex flex-col gap-4 rounded-[28px] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between",
            "border border-gray-100 bg-white"
          )}>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search JEE, NEET, Boards..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50/90 pl-10 pr-4 text-[13px] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50 p-1">
              {(["all", "engineering", "medical", "boards"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`relative whitespace-nowrap rounded-xl px-4 py-2 text-[12px] font-bold capitalize transition-all ${activeTab === tab ? "text-white shadow-md" : "text-gray-500 hover:text-gray-800"}`}
                  style={activeTab === tab ? { background: grad() } : {}}>
                  {{ all: "All Exams", engineering: "Engineering", medical: "Medical", boards: "School Boards" }[tab]}
                </button>
              ))}
            </div>
          </FadeUp>

          {/* Cards */}
          <AnimatePresence mode={lightHomeMotion ? "sync" : "wait"}>
            <motion.div
              key={activeTab + searchQuery}
              initial={lightHomeMotion ? undefined : { opacity: 0.96 }}
              animate={lightHomeMotion ? undefined : { opacity: 1 }}
              transition={lightHomeMotion ? undefined : { duration: 0.18 }}
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filteredExams.length > 0 ? filteredExams.map((exam, i) => (
                <motion.div
                  key={exam.id}
                  initial={lightHomeMotion ? undefined : { opacity: 0, y: 16 }}
                  animate={lightHomeMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={lightHomeMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={lightHomeMotion ? undefined : { duration: 0.26, delay: Math.min(i * 0.04, 0.2) }}
                  whileHover={lightHomeMotion ? undefined : { y: -3, boxShadow: `0 14px 32px ${exam.color}18` }}
                  className={`group relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-inset transition-all duration-300 ${exam.comingSoon ? "border-amber-200/80 ring-amber-200/70" : "border-gray-200 ring-slate-200/80"}`}>

                  {/* hover color wash */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at top left, ${exam.color}08, transparent 65%)` }} />

                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${exam.color}18, #ffffff)` }}>
                      {exam.icon}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {exam.comingSoon && (
                        <div className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-[13px] font-black uppercase tracking-[0.18em] text-red-700">
                          Coming Soon
                        </div>
                      )}
                      {exam.popular && (
                        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black border transition-all"
                          style={{
                            color: "#3B82F6",
                            backgroundColor: "#3B82F615",
                            borderColor: "#3B82F633",
                            boxShadow: "0 0 15px #3B82F625"
                          }}>
                          <Star className="h-3 w-3 fill-current" /> Popular
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="mb-2 text-[18px] font-extrabold tracking-tight text-gray-900">{exam.name}</h3>
                    <p className="text-[13px] leading-relaxed text-gray-500">{exam.desc}</p>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {exam.tags.map(tag => (
                      <span key={tag} className="rounded-full px-3 py-1 text-[10px] font-bold"
                        style={{ background: `${exam.color}12`, color: exam.color }}>
                        {tag}
                      </span>
                    ))}
                  </div>



                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-400">
                      {exam.comingSoon ? "Launching shortly" : "Available now"}
                    </span>
                    {exam.href ? (
                      <Link
                        to={exam.href}
                        className="flex items-center gap-1 text-[12px] font-bold"
                        style={{ color: exam.color }}
                      >
                        Explore <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <motion.span className="flex items-center gap-1 text-[12px] font-bold"
                        style={{ color: exam.color }}
                        whileHover={{ x: 3 }}>
                        {exam.comingSoon ? "Preview" : "Explore"} <ArrowRight className="h-3 w-3" />
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              )) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-4 py-16 text-center">
                  <div className="mb-3 text-5xl">🔍</div>
                  <p className="text-[16px] font-bold text-gray-700">No exams found for "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery("")}
                    className="mt-4 rounded-xl border border-gray-200 px-5 py-2 text-[13px] font-bold text-gray-600 hover:bg-gray-50">
                    Clear search
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ══════════════════════ CAREER / FUTURE LEARNING ══════════════════════ */}
      <section className="relative overflow-hidden bg-[#f8fafc]" id="career">

        {/* 🌈 Soft Corner Gradients */}
        <div className="absolute top-0 left-0 w-[340px] h-[340px] bg-blue-200/30 blur-[80px] rounded-full" />
        <div className="absolute top-0 right-0 w-[340px] h-[340px] bg-purple-200/30 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[340px] h-[340px] bg-pink-200/30 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[340px] h-[340px] bg-yellow-200/30 blur-[80px] rounded-full" />

        {/* 🌫️ Optional Background Image */}
        <img
          src={bg1}
          alt="bg"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />

        {/* CONTENT */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-14 lg:gap-16">
            <div className="max-w-xl md:max-w-none">
              {/* Badge */}
              <div className={cn(
                "mb-4 inline-flex items-center gap-2 border border-gray-200 px-4 py-1 rounded-full",
                "bg-white"
              )}>
                <span className="text-yellow-500 text-xs">🏆</span>
                <span className="text-gray-700 text-xs tracking-widest font-semibold">
                  CAREER & GROWTH
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                Build Your{" "}
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  Future
                </span>
                <br />
                with EDDVA
              </h2>

              {/* Description */}
              <p className="text-gray-600 max-w-lg mb-10 text-lg leading-relaxed">
                From cracking your dream exam to building real-world skills —
                EDDVA guides you at every step of your journey.
              </p>

              {/* ✨ FEATURE CARDS */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                {features.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={lightHomeMotion ? undefined : { opacity: 0, y: 24 }}
                    whileInView={lightHomeMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={lightHomeMotion ? undefined : { delay: i * 0.08 }}
                    whileHover={lightHomeMotion ? undefined : { y: -4 }}
                    className="group relative p-[1px] rounded-2xl"
                  >
                    {/* Gradient Border */}
                    {!lightHomeMotion && (
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 blur-sm transition`} />
                    )}

                    {/* Card */}
                    <div className="relative p-5 rounded-2xl bg-white border border-gray-200 shadow-sm group-hover:shadow-xl transition">

                      {/* Icon */}
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl mb-4 bg-gradient-to-br ${item.color} text-white shadow-md`}>
                        {item.icon}
                      </div>

                      {/* Text */}
                      <h3 className="text-gray-900 font-semibold text-sm mb-1">
                        {item.title}
                      </h3>

                      <p className="text-gray-500 text-xs leading-relaxed">
                        {item.desc}
                      </p>

                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex gap-4">
                <Link
                  to="/register"
                  className="px-7 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-yellow-500 hover:scale-105 transition shadow-md"
                >
                  Start Your Journey →
                </Link>

                <a
                  href="/about-us"
                  className="px-7 py-3 rounded-xl border border-gray-300 text-gray-800 bg-white hover:bg-gray-100 transition"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right: visual + highlight cards */}
            <div className="relative mx-auto w-full max-w-md md:max-w-lg lg:max-w-none">
              <div
                className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-30 blur-2xl"
                style={{ background: `linear-gradient(135deg, ${B}22, #fbbf2433, ${P}22)` }}
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-3xl border border-white/90 shadow-[0_24px_60px_-12px_rgba(15,23,42,0.25)] aspect-[4/3] sm:aspect-[5/4] bg-slate-900 group">
                {lightHomeMotion ? (
                  <img
                    src={aboutImg}
                    alt="Build your future with EDDVA"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <AutoPlayVideo
                    src={aboutVideo}
                    poster={aboutImg}
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover transition-transform duration-700",
                      "group-hover:scale-105"
                    )}
                  />
                )}
                {/* Dark gradient overlay for better text readability and depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                {/* <div className="absolute -left-2 top-6 max-w-[200px] z-10 rounded-2xl border border-white/90 bg-white/95 p-3 shadow-lg backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 sm:-left-4 sm:top-10 sm:max-w-[220px] sm:p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                <Brain className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">AI study paths</p>
              <p className="mt-0.5 text-[13px] font-semibold leading-snug text-gray-900">Plans that adapt to your pace and goals</p>
            </div> */}

                {/* <div className="absolute -right-1 bottom-8 max-w-[190px] z-10 rounded-2xl border border-white/90 bg-white/95 p-3 shadow-lg backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 sm:-right-2 sm:bottom-10 sm:max-w-[210px] sm:p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
                <Target className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Exam-ready focus</p>
              <p className="mt-0.5 text-[13px] font-semibold leading-snug text-gray-900">Structured prep for JEE, NEET & boards</p>
            </div> */}
              </div>
            </div>
          </div>

        </div>
      </section>



      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      {/* <section className="landing-section" id="how"
        style={{ background:"linear-gradient(160deg,#F0FDF4 0%,#EFF6FF 55%,#F5F3FF 100%)" }}>
        <div className="landing-shell">
          <FadeUp className="mb-4 text-center"><SLabel>How It Works</SLabel></FadeUp>
          <FadeUp delay={0.05} className="mb-4 text-center">
            <h2 className="landing-title-section">
              Four steps to <span style={gText()}>exam success</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1} className="mb-14 text-center">
            <p className="mx-auto max-w-xl text-[16px] text-gray-500 leading-relaxed">
              A simple AI-powered cycle designed to build your skills and keep you improving every single day.
            </p>
          </FadeUp>

  
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howSteps.map((s, i) => {
              const gradTo = s.color === B ? IN : s.color === IN ? P : s.color === P ? T : T;
              return (
                <FadeUp key={s.title} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y:-7, boxShadow:`0 28px 64px ${s.color}25` }}
                    className="relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-sm transition-all">
          
                    <div className="pointer-events-none absolute -right-3 -top-3 text-[88px] font-black leading-none select-none"
                      style={{ color:`${s.color}0E` }}>{s.num}</div>

            
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
                      style={{ background:`linear-gradient(90deg, ${s.color}, ${gradTo})` }} />

                
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
                      style={{ background:`linear-gradient(135deg, ${s.color}, ${gradTo})` }}>
                      {s.icon}
                    </div>

             
                    <span className="mb-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                      style={{ background:`${s.color}12`, color:s.color }}>
                      Step {s.num}
                    </span>

                    <h4 className="mb-2 text-[17px] font-extrabold text-gray-900">{s.title}</h4>
                    <p className="text-[13px] leading-relaxed text-gray-500">{s.desc}</p>

                   
                    {i < 3 && (
                      <div className="absolute -right-4 top-[46px] z-10 hidden h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-50 shadow-md lg:flex">
                        <ChevronRight className="h-4 w-4" style={{ color:s.color }} />
                      </div>
                    )}
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>

      
          <FadeUp delay={0.45} className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <motion.a href="#exams" whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
              className="flex items-center gap-2 rounded-2xl px-8 py-3.5 text-[15px] font-bold text-white shadow-lg"
              style={{ background: grad() }}>
              Start Your Journey <ArrowRight className="h-4 w-4" />
            </motion.a>
            <p className="text-[13px] font-medium text-gray-400">Free forever · No credit card needed</p>
          </FadeUp>
        </div>
      </section> */}


      {/* Ongoing courses section disabled */}


      {/* ══════════════════════ YOUTUBE SECTION ══════════════════════ */}
      <section className="landing-section bg-white" id="videos">
        <div className="landing-shell">
          <FadeUp className="mb-3 text-center"><SLabel color="#FF0000">YouTube</SLabel></FadeUp>
          <FadeUp delay={0.05} className="mb-3 text-center">
            <h2 className="landing-title-section">
              Explore More From{" "}
              <span className="relative inline-block">
                <span className="relative z-10" style={gText("#FF0000", "#FF6B00")}>EDDVA!</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 10" fill="none">
                  <path d="M2 7 Q50 2 100 6 Q150 10 198 4" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.08} className="mb-12 text-center">
            <p className="mx-auto max-w-xl text-[16px] text-gray-500">
              Learn smarter with our YouTube channels — free lessons designed for every class and exam goal.
            </p>
          </FadeUp>

          {/* ── Split: channels list + video embed ── */}
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">

            {/* LEFT: channel list */}
            <FadeUp className="flex flex-col gap-4">
              {[
                { emoji: "📚", title: " Complete Preparation JEE-Physics,Chemistry & Mathematics", sub: "EDDVA JEE Channel", desc: "Focused lessons for Class 11th & 12th and Droppers", color: B },
                { emoji: "🩺", title: "Complete Preparation For NEET-Physics,Chemistry & Biology", sub: "EDDVA NEET Channel", desc: "Master NCERT Biology, Physics & Chemistry", color: "#EF4444" },
                { emoji: "🎓", title: "CBSE Class 9 to 12 — All Subjects", sub: "EDDVA School Channel", desc: "Chapter-wise lessons aligned to CBSE & NCERT syllabus", color: T },
                { emoji: "🏫", title: "ICSE / ISC Boards — Science & Maths", sub: "EDDVA Boards Channel", desc: "Smart learning for ICSE/ISC Classes 9-12", color: P },
              ].map((ch, i) => (
                <motion.a key={ch.sub} href="https://www.youtube.com/@ChemistryDilSe" target="_blank" rel="noopener noreferrer"
                  initial={lightHomeMotion ? undefined : { opacity: 0, x: -18 }}
                  whileInView={lightHomeMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={lightHomeMotion ? undefined : { duration: 0.35, delay: i * 0.06 }}
                  whileHover={lightHomeMotion ? undefined : { x: 2, boxShadow: `0 8px 22px ${ch.color}14` }}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: `${ch.color}12` }}>
                    {ch.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-extrabold leading-snug text-gray-900 group-hover:text-blue-600 transition-colors">{ch.title}</p>
                    <p className="text-[14px] font-bold text-gray-500 mt-1">{ch.sub}</p>
                    <p className="text-[15px] font-medium text-gray-600 mt-2 leading-relaxed">{ch.desc}</p>
                  </div>
                  <motion.div whileHover={lightHomeMotion ? undefined : { scale: 1.05 }}
                    className="flex-shrink-0 flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[12px] font-bold transition-all"
                    style={{ borderColor: `${ch.color}44`, color: ch.color, background: `${ch.color}08` }}>
                    Visit Channel <ChevronRight className="h-3.5 w-3.5" />
                  </motion.div>
                </motion.a>
              ))}
            </FadeUp>

            {/* RIGHT: embedded video + join CTA */}
            <FadeUp delay={0.15} className="flex flex-col gap-5">
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="relative" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src="https://www.youtube.com/embed/8M5t19gOnJ8?si=ceuCYmu4AvaTy67J"
                    title="EDDVA YouTube Lesson"
                    loading="lazy"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Join CTA card */}
              <div className="flex items-center gap-5 rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-600 shadow-lg">
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-extrabold text-gray-900">Join our Main Channel!</p>
                  <p className="mt-1 text-[13px] text-gray-600 leading-snug">
                    Join millions of students learning for JEE, NEET & Boards in the most simple, visual & fun way.
                  </p>
                </div>
                <motion.a href="https://www.youtube.com/@eddva" target="_blank" rel="noopener noreferrer"
                  whileHover={lightHomeMotion ? undefined : { scale: 1.06 }} whileTap={{ scale: 0.96 }}
                  className="flex-shrink-0 rounded-2xl bg-red-600 px-5 py-2.5 text-[13px] font-black text-white shadow-md hover:bg-red-700 transition-colors">
                  Join Now!
                </motion.a>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>


      {/* ══════════════════════ TESTIMONIALS ══════════════════════ */}
      {/* <section className="landing-section" style={{ background:"linear-gradient(160deg,#F5F3FF 0%,#EFF6FF 100%)" }}>
        <div className="landing-shell">
          <FadeUp className="mb-4 text-center"><SLabel>Student Stories</SLabel></FadeUp>
          <FadeUp delay={0.05} className="mb-3 text-center">
            <h2 className="landing-title-section">
              Real students, <span style={gText()}>real results</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.08} className="mb-12 flex flex-col items-center gap-2">
            <div className="flex gap-1">{Array(5).fill(0).map((_,i)=><Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400"/>)}</div>
            <p className="text-[15px] font-bold text-gray-600">4.9 / 5 · 12,000+ reviews</p>
          </FadeUp>

          <FadeUp delay={0.1} className="mb-6">
            <div className="relative overflow-hidden rounded-3xl p-8 text-white lg:p-12"
              style={{ background:`linear-gradient(135deg, ${B}, ${P})` }}>
              <div className="pointer-events-none absolute inset-0 opacity-10"
                style={{ backgroundImage:`radial-gradient(circle,#fff 1px,transparent 1px)`, backgroundSize:"24px 24px" }} />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="mb-4 text-[48px] font-black leading-none text-white/20">"</div>
                  <p className="mb-6 text-[18px] font-medium leading-relaxed text-white/90 lg:text-[20px]">
                    EDDVA completely changed how I study. In 4 months, my JEE score went from 180 to 267. The AI study plan, doubt solver and mock tests — everything worked together perfectly. I got into IIT Bombay!
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-[22px] font-black text-gray-900 backdrop-blur-sm">
                      V
                    </div>
                    <div>
                      <p className="text-[16px] font-extrabold text-white">Vikram Iyer</p>
                      <p className="text-[13px] text-white/65">IIT-JEE 2024 · AIR 892 · IIT Bombay</p>
                    </div>
                    <div className="ml-auto hidden items-center gap-1 sm:flex">
                      {Array(5).fill(0).map((_,i)=><Star key={i} className="h-5 w-5 fill-yellow-300 text-yellow-300"/>)}
                    </div>
                  </div>
                </div>
 
                <div className="flex flex-row items-center gap-4 lg:flex-col lg:items-end lg:justify-center">
                  <div className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Before</p>
                    <p className="text-[28px] font-extrabold text-white">180</p>
                    <p className="text-[11px] text-white/60">JEE Score</p>
                  </div>
                  <div className="text-2xl text-white/40">→</div>
                  <div className="rounded-2xl bg-white/25 p-4 text-center backdrop-blur-sm ring-2 ring-white/30">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">After</p>
                    <p className="text-[28px] font-extrabold text-yellow-300">267</p>
                    <p className="text-[11px] text-white/70">JEE Score</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>

    
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.1}>
                <motion.div whileHover={{ y:-5, boxShadow:`0 20px 56px ${t.color}15` }}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
         
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex gap-0.5">{Array(5).fill(0).map((_,j)=><Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"/>)}</div>
                    <span className="text-[32px] font-black leading-none" style={{ color:`${t.color}22` }}>"</span>
                  </div>
                  <p className="mb-5 flex-1 text-[14px] leading-relaxed text-gray-600">"{t.text}"</p>
      
                  <div className="mb-4 h-px" style={{ background:`linear-gradient(90deg, ${t.color}33, transparent)` }} />
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-[16px] font-black text-white"
                      style={{ background:`linear-gradient(135deg, ${t.color}, ${t.color}bb)` }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">{t.name}</p>
                      <p className="text-[12px] font-medium" style={{ color: t.color }}>{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section> */}




      {/* ══════════════════════ APP DOWNLOAD ══════════════════════ */}
      <section className="landing-section relative overflow-hidden pt-32 sm:pt-40" id="app" style={{ background: "#FEFCE8" }}>
        {/* Top Coming Soon Pill Banner */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-5xl">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between gap-3 rounded-[24px] sm:rounded-[32px] border border-red-100 bg-gradient-to-r from-red-50/90 to-rose-50/90 px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_20px_50px_rgba(239,68,68,0.12)] backdrop-blur-md"
          >
            <div className="flex items-center gap-2 sm:gap-6">
              <Sparkles className="hidden h-4 w-4 text-red-400 opacity-60 sm:block" />
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-white shadow-sm">
                  <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 fill-red-50" />
                </div>
                <span className="text-[20px] sm:text-[20px] font-black tracking-tight text-red-600">Launching Soon!</span>
              </div>
              <div className="hidden h-8 w-px bg-red-200 sm:block" />
              <p className="hidden text-[14px] font-bold text-red-500/80 lg:block">
                We&apos;re working on something amazing for you.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-xl sm:rounded-2xl bg-white px-3 py-2 sm:px-6 sm:py-3 text-[18px] sm:text-[14px] font-black text-red-600 shadow-sm transition-all hover:shadow-md"
              >
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-red-50" />
                Stay Tuned
              </motion.button>
              <Sparkles className="hidden h-4 w-4 text-red-400 opacity-60 sm:block" />
            </div>
          </motion.div>
        </div>

        {/* doodle watermark bg */}
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden opacity-[0.07]">
          {[
            { emoji: "🚀", top: "8%", left: "3%", size: 72, rot: -20 },
            { emoji: "📐", top: "12%", right: "4%", size: 64, rot: 15 },
            { emoji: "📚", top: "65%", left: "2%", size: 60, rot: 10 },
            { emoji: "⚗️", top: "72%", right: "3%", size: 68, rot: -12 },
            { emoji: "🔭", top: "40%", left: "6%", size: 56, rot: 8 },
            { emoji: "🧲", top: "30%", right: "7%", size: 52, rot: -18 },
            { emoji: "📊", top: "82%", left: "18%", size: 48, rot: 5 },
            { emoji: "🔬", top: "18%", left: "22%", size: 44, rot: -8 },
            { emoji: "✏️", top: "55%", right: "12%", size: 50, rot: 20 },
            { emoji: "🧮", top: "88%", right: "20%", size: 44, rot: -5 },
          ].map((d, i) => (
            <div key={i} className="absolute text-gray-700"
              style={{ top: d.top, left: (d as any).left, right: (d as any).right, fontSize: d.size, transform: `rotate(${d.rot}deg)` }}>
              {d.emoji}
            </div>
          ))}
        </div>

        <div className="landing-shell">
          {/* ── Top rating badges ── */}
          <FadeUp className="mb-14 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {[
              { rating: "4.3+", store: "Play Store", icon: "▶", bg: "#34A853", label: "out of 5" },
              { rating: "4.2+", store: "App Store", icon: "⬡", bg: "#0071E3", label: "out of 5" },
            ].map(r => (
              <div key={r.store} className="flex items-center gap-2 sm:gap-3">
                {/* laurel left */}
                <svg width="24" height="40" viewBox="0 0 28 44" fill="none" className="opacity-80 sm:w-[28px] sm:h-[44px]">
                  <path d="M14 2 C8 8 4 14 5 20 C6 26 10 30 14 34 C10 30 7 26 8 20 C9 14 12 8 14 2Z" fill="#D97706" />
                  <path d="M14 8 C10 13 7 18 8 23 C9 28 12 32 14 36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <path d="M6 12 Q4 16 6 20" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <path d="M5 20 Q3 24 6 28" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <path d="M7 28 Q5 32 8 36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
                {/* icon + text */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-white text-base sm:text-lg shadow-md"
                    style={{ background: r.bg }}>{r.icon}</div>
                  <div>
                    <p className="text-[20px] sm:text-[26px] font-black leading-none text-gray-900">{r.rating}</p>
                    <p className="text-[10px] sm:text-[12px] font-semibold text-gray-500">{r.label}</p>
                  </div>
                </div>
                {/* laurel right (mirror) */}
                <svg width="24" height="40" viewBox="0 0 28 44" fill="none" className="scale-x-[-1] opacity-80 sm:w-[28px] sm:h-[44px]">
                  <path d="M14 2 C8 8 4 14 5 20 C6 26 10 30 14 34 C10 30 7 26 8 20 C9 14 12 8 14 2Z" fill="#D97706" />
                  <path d="M14 8 C10 13 7 18 8 23 C9 28 12 32 14 36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <path d="M6 12 Q4 16 6 20" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <path d="M5 20 Q3 24 6 28" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <path d="M7 28 Q5 32 8 36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            ))}
          </FadeUp>

          {/* ── Main grid: left text + right phone ── */}
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* LEFT */}
            <FadeUp>
              <h2 className="landing-title-feature mb-4 text-gray-900">
                Join a{" "}
                <em className="not-italic font-black" style={gText()}>fast-growing </em>
                <br />learning community!
              </h2>
              <p className="mb-8 max-w-md text-[16px] font-medium leading-relaxed text-gray-600">
                The EDDVA mobile app is launching shortly! Get ready to access live classes, notes, assignments, and videos anywhere — even without internet.
              </p>

              {/* Dark store buttons */}
              <div className="flex flex-wrap gap-4">
                <motion.button whileHover={{ scale: 1.05, boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 rounded-2xl bg-gray-950 px-6 py-3.5 text-white shadow-lg">
                  {/* Google Play SVG */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3.18 1.4 14.04 12 3.18 22.6a1.5 1.5 0 01-.18-.72V2.12c0-.27.06-.52.18-.72z" fill="#4285F4" />
                    <path d="M17.82 8.82L5.34.54 14.04 12l3.78-3.18z" fill="#EA4335" />
                    <path d="M17.82 15.18L14.04 12l-3.78 3.78 9.56 5.7-.06-.06a1.5 1.5 0 00.06-5.34z" fill="#FBBC05" />
                    <path d="M5.34 23.46l12.48-8.28L14.04 12 5.34 23.46z" fill="#34A853" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-white/60">GET IT ON</p>
                    <p className="text-[15px] font-bold leading-tight">Google Play</p>
                  </div>
                </motion.button>

                <motion.button whileHover={{ scale: 1.05, boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 rounded-2xl bg-gray-950 px-6 py-3.5 text-white shadow-lg">
                  {/* Apple SVG */}
                  <svg width="22" height="24" viewBox="0 0 814 1000" fill="white">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-36.8-162.8-106.3C141 420 107 238.1 107 148.2c0-61.7 29.4-115.2 59.4-153.3C214.1 32.5 270 0 330 0c58.8 0 96.5 39.5 166 39.5 67.6 0 109.6-39.5 166-39.5 60 0 114 31.4 161 85.5zm-326 12c-25.9-11.5-42.9-30.1-42.9-54.9 0-23.6 7.8-43.2 22.3-58.2 15-15.5 35.3-25.7 55.7-27.9.7 2.4.7 5.4.7 8.7 0 24.3-8.1 44.1-23.4 60.8C448.1 337.6 429 346.8 462.1 352.9z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-white/60">Download on the</p>
                    <p className="text-[15px] font-bold leading-tight">App Store</p>
                  </div>
                </motion.button>
              </div>
            </FadeUp>

            {/* RIGHT — floating phone */}
            <FadeUp delay={0.2} className="flex justify-center">
              <motion.div
                animate={lightHomeMotion ? undefined : { y: [0, -12, 0] }}
                transition={lightHomeMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" as const }}
                className="relative w-[220px] sm:w-[240px] lg:w-[252px]">
                <div className="overflow-hidden rounded-[40px] border-[5px] border-gray-800 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
                  {/* status bar */}
                  <div className="flex items-center justify-between bg-gray-900 px-4 py-2.5">
                    <span className="text-[9px] font-bold text-white">9:41</span>
                    <div className="h-4 w-20 rounded-full bg-black" />
                    <span className="text-[9px] font-bold text-white">●●●</span>
                  </div>
                  {/* app screen */}
                  <div className="space-y-2 bg-white p-4">
                    {/* top bar */}
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[10px] font-black"
                          style={{ background: grad() }}>E</div>
                        <span className="text-[10px] font-bold text-gray-700">11th Class</span>
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      </div>
                      <div className="flex gap-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <div className="relative"><Smartphone className="h-4 w-4 text-gray-400" />
                          <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" /></div>
                      </div>
                    </div>
                    {/* greeting */}
                    <p className="px-1 text-[11px] font-bold text-gray-900">Hello, Amit Kumar 👋</p>
                    {/* course banner */}
                    <div className="relative overflow-hidden rounded-xl" style={{ background: grad() }}>
                      <div className="p-3">
                        <div className="mb-1 flex items-center gap-1">
                          <span className="rounded bg-yellow-400 px-1.5 py-0.5 text-[8px] font-black text-gray-900">Topper</span>
                          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-bold text-gray-900">Class 11th</span>
                        </div>
                        <p className="text-[13px] font-black leading-tight text-white">CRASH<br />COURSE</p>
                        <p className="mt-0.5 text-[8px] text-white/70">Complete Syllabus in 45 Days</p>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 shadow-md">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </div>
                    </div>
                    {/* grid menu */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "Premium Courses", icon: "🎓", bg: "#FEF9C3" },
                        { label: "Books", icon: "📚", bg: "#FEF9C3" },
                        { label: "Free Lectures", icon: "🎬", bg: "#FEF9C3" },
                        { label: "Free Tests", icon: "📝", bg: "#FEF9C3" },
                        { label: "Quiz", icon: "🧠", bg: "#FEF9C3" },
                        { label: "Assignment & Notes", icon: "📋", bg: "#FEF9C3" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-1.5 rounded-xl px-2 py-2.5"
                          style={{ background: item.bg }}>
                          <span className="text-[14px]">{item.icon}</span>
                          <p className="text-[9px] font-bold leading-tight text-gray-800">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* shadow glow */}
                <div className="absolute -bottom-6 left-1/2 h-10 w-4/5 -translate-x-1/2 rounded-full blur-2xl opacity-40"
                  style={{ background: "#FDE68A" }} />
                {/* floating atoms */}
                {lightHomeMotion ? (
                  <>
                    <div className="absolute -left-10 top-20 text-[28px] select-none sm:text-[36px]">⚛️</div>
                    <div className="absolute -right-8 top-32 text-[24px] select-none sm:text-[30px]">📐</div>
                    <div className="absolute -left-8 bottom-24 text-[22px] select-none sm:text-[26px]">🧪</div>
                  </>
                ) : (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" as const }}
                      className="absolute -left-10 top-20 text-[28px] select-none sm:text-[36px]">⚛️</motion.div>
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                      className="absolute -right-8 top-32 text-[24px] select-none sm:text-[30px]">📐</motion.div>
                    <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay: 1 }}
                      className="absolute -left-8 bottom-24 text-[22px] select-none sm:text-[26px]">🧪</motion.div>
                  </>
                )}
              </motion.div>
            </FadeUp>
          </div>
        </div>
      </section>


      {/* ══════════════════════ FINAL CTA ══════════════════════ */}
      <section className="relative overflow-hidden text-center" id="cta">

        {/* 🌫️ Background Image */}
        <img
          src={bg2}
          alt="background"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />

        {/* 🌈 Soft Gradient Overlay (light, not dark) */}
        <div className="absolute inset-0" />

        {/* ✨ Corner Glow Effects */}
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-200/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-200/40 blur-[120px] rounded-full" />

        {/* CONTENT */}
        <div className="relative z-10 landing-shell-narrow py-20">

          <FadeUp>
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-1.5 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">
                Start Now
              </span>
            </div>

            {/* Heading */}
            <h2 className="mb-5 text-4xl font-extrabold text-gray-900">
              Ready to ace your{" "}
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                exam?
              </span>
            </h2>

            {/* Description */}
            <p className="mb-10 mx-auto max-w-xl text-lg text-gray-600 leading-relaxed">
            Start your free plan today .
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">

              {/* Primary */}
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white shadow-lg"
                  style={{ background: grad() }}
                >
                  Start Learning Free <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>

              {/* Secondary */}
              <motion.a
                href="/about-us"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-7 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 transition"
              >
                See How It Works <ChevronRight className="h-5 w-5" />
              </motion.a>

            </div>
          </FadeUp>

        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      {/* ── Footer and AI button are handled by LandingLayout ── */}

    </LandingLayout>
  );
};

export default Index;
