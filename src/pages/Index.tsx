import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Brain, Zap, BarChart2, MessageCircle, FlaskConical,
  Star, Check, Menu, X, ArrowRight, Sparkles,
  BookOpen, TrendingUp, Users, Award, Clock, Target,
  Bot, ChevronRight, Play, Search, Filter,
  Atom, Stethoscope, GraduationCap, Building2, Briefcase, Globe,
  ChevronLeft, Library, ChevronDown,
} from "lucide-react";
import edvaLogo from "@/assets/EDVA LOGO 04.png";
import heroIllustration from "@/assets/hero_illustration.png";

/* ─── Design tokens ─── */
const B = "#3B82F6"; // Soft Blue
const P = "#8B5CF6"; // Soft Purple
const T = "#10B981"; // Soft Emerald
const G = "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)"; // Soft Premium Gradient
const SG = "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)"; // Soft Background Gradient

/* ─── Scroll-reveal wrapper ─── */
const FadeUp = ({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: "easeOut" as const }}
      className={className}>
      {children}
    </motion.div>
  );
};

/* ─── Section label pill ─── */
const Label = ({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "purple" | "teal" }) => {
  const styles = {
    blue:   "border-blue-100 bg-blue-50 text-blue-600",
    purple: "border-purple-100 bg-purple-50 text-purple-600",
    teal:   "border-teal-100 bg-teal-50 text-teal-600",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-[12px] font-bold uppercase tracking-widest ${styles[color]}`}>
      <Sparkles className="h-3 w-3" />{children}
    </span>
  );
};

/* ─── Floating animated badge ─── */
const HeroBadge = ({
  icon, label, value, color, bg, drift = -8, delay = 0, className = "",
}: { icon: React.ReactNode; label: string; value: string; color: string; bg: string; drift?: number; delay?: number; className?: string }) => (
  <motion.div
    animate={{ y: [0, drift, 0] }}
    transition={{ duration: 3 + delay, repeat: Infinity, ease: "easeInOut" as const, delay }}
    className={`flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white px-3.5 py-2.5 shadow-xl backdrop-blur-sm ${className}`}>
    <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: bg }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-[14px] font-extrabold text-gray-900">{value}</p>
    </div>
  </motion.div>
);

/* ─── Feature card ─── */
const FeatCard = ({
  icon, color, bg, title, desc, emoji, delay,
}: { icon: React.ReactNode; color: string; bg: string; title: string; desc: string; emoji: string; delay: number }) => (
  <FadeUp delay={delay}>
    <motion.div
      whileHover={{ y: -8, boxShadow: `0 24px 48px ${color}15` }}
      className="group relative overflow-hidden rounded-[28px] border border-white bg-white/70 p-8 shadow-sm backdrop-blur-xl transition-all duration-500">
      
      {/* decorative background element */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150 group-hover:rotate-12" 
        style={{ background: color }} />

      <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-transform duration-500 group-hover:scale-110" 
        style={{ background: bg }}>
        <span className="scale-110" style={{ color }}>{icon}</span>
      </div>
      
      <h3 className="relative z-10 mb-3 text-[18px] font-black tracking-tight text-gray-900">{title}</h3>
      <p className="relative z-10 mb-6 text-[14px] leading-relaxed text-gray-500">{desc}</p>
      
      <motion.div 
        className="relative z-10 flex items-center gap-2 text-[13px] font-black uppercase tracking-wider" 
        style={{ color }}>
        <span className="border-b-2 border-transparent transition-all group-hover:border-current">Explore Feature</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </motion.div>

      {/* Large faded emoji background */}
      <div className="pointer-events-none absolute -bottom-4 -right-2 translate-y-4 text-[80px] leading-none opacity-[0.04] transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-[0.08] select-none grayscale">
        {emoji}
      </div>
    </motion.div>
  </FadeUp>
);

/* ─── Typing indicator dots ─── */
const TypingDots = () => (
  <div className="flex items-center gap-1.5 px-5 py-4">
    {[0, 0.2, 0.4].map((d, i) => (
      <motion.div key={i} className="h-2 w-2 rounded-full"
        style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: d, ease: "easeInOut" }} />
    ))}
  </div>
);

/* ─── Exam category data ─── */
type ExamCard = {
  id: string; name: string; icon: string; iconBg: string; color: string;
  tags: string[]; students: string; desc: string; popular?: boolean;
};

const examTabs = [
  { key: "competitive", label: "Competitive Exams", icon: "🎯" },
  { key: "boards",      label: "School Boards",     icon: "📚" },
  { key: "government",  label: "Govt Exams",        icon: "🏛️" },
];

const examData: Record<string, ExamCard[]> = {
  competitive: [
    { id: "neet",    name: "NEET UG",       icon: "🩺", iconBg: "linear-gradient(135deg,#FEF2F2,#FFE4E4)", color: "#EF4444", tags: ["Class 11","Class 12","Dropper"], students: "24K+", desc: "Biology, Physics & Chemistry for medical entrance.", popular: true },
    { id: "jeead",   name: "IIT JEE Adv",  icon: "⚛️", iconBg: "linear-gradient(135deg,#EEF4FF,#DBEAFE)", color: B,        tags: ["Class 12","Dropper"],             students: "18K+", desc: "Advanced engineering entrance for IITs.", popular: true },
    { id: "jeem",    name: "JEE Mains",    icon: "🔬", iconBg: "linear-gradient(135deg,#F3F0FF,#EDE9FE)", color: P,        tags: ["Class 11","Class 12","Dropper"],  students: "32K+", desc: "Gateway to NITs, IIITs & top engineering colleges.", popular: true },
    { id: "cuet",    name: "CUET UG",      icon: "🎓", iconBg: "linear-gradient(135deg,#F0FDFA,#CCFBF1)", color: T,        tags: ["Class 12"],                       students: "12K+", desc: "Central universities entrance test." },
    { id: "bitsat",  name: "BITSAT",       icon: "💻", iconBg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", color: "#F59E0B",tags: ["Class 12","Dropper"],             students: "8K+",  desc: "BITS Pilani online entrance examination." },
    { id: "viteee",  name: "VITEEE",       icon: "🏗️", iconBg: "linear-gradient(135deg,#FFF1F0,#FFE4E4)", color: "#F97316",tags: ["Class 12"],                       students: "6K+",  desc: "VIT Engineering entrance examination." },
  ],
  boards: [
    { id: "cbse10",  name: "CBSE Class 10", icon: "📖", iconBg: "linear-gradient(135deg,#EEF4FF,#DBEAFE)", color: B,        tags: ["Class 10"],    students: "28K+", desc: "Complete CBSE board preparation for Class 10.", popular: true },
    { id: "cbse12",  name: "CBSE Class 12", icon: "📝", iconBg: "linear-gradient(135deg,#F3F0FF,#EDE9FE)", color: P,        tags: ["Class 12"],    students: "22K+", desc: "Science, Commerce & Arts streams for Class 12.", popular: true },
    { id: "icse",    name: "ICSE / ISC",   icon: "🏫", iconBg: "linear-gradient(135deg,#F0FDFA,#CCFBF1)", color: T,        tags: ["Class 10","Class 12"], students: "9K+",  desc: "CISCE board comprehensive study material." },
    { id: "state",   name: "State Boards", icon: "🗺️", iconBg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", color: "#F59E0B",tags: ["Class 10","Class 12"], students: "15K+", desc: "All major state boards — UP, MP, Bihar, MH & more." },
  ],
  government: [
    { id: "upsc",    name: "UPSC CSE",     icon: "🏛️", iconBg: "linear-gradient(135deg,#EEF4FF,#DBEAFE)", color: B,        tags: ["Prelims","Mains","Interview"], students: "14K+", desc: "Civil services exam — IAS, IPS, IFS preparation.", popular: true },
    { id: "ssc",     name: "SSC CGL",      icon: "📋", iconBg: "linear-gradient(135deg,#F3F0FF,#EDE9FE)", color: P,        tags: ["Tier 1","Tier 2","Tier 3"],    students: "11K+", desc: "Combined graduate level — Group B & C posts." },
    { id: "banking", name: "Banking",      icon: "🏦", iconBg: "linear-gradient(135deg,#F0FDFA,#CCFBF1)", color: T,        tags: ["IBPS","SBI","RBI"],            students: "9K+",  desc: "PO, Clerk & SO exams for banking sector.", popular: true },
    { id: "railway", name: "Railways",     icon: "🚂", iconBg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", color: "#F59E0B",tags: ["RRB NTPC","Group D"],          students: "7K+",  desc: "RRB NTPC, Group D & JE examination prep." },
    { id: "defence", name: "Defence",      icon: "⚔️", iconBg: "linear-gradient(135deg,#FFF1F0,#FFE4E4)", color: "#EF4444",tags: ["NDA","CDS","CAPF"],           students: "5K+",  desc: "NDA, CDS and AFCAT for defence aspirants." },
    { id: "teaching",name: "Teaching",     icon: "🍎", iconBg: "linear-gradient(135deg,#F3F0FF,#EDE9FE)", color: P,        tags: ["CTET","UPTET","NET"],          students: "6K+",  desc: "Teacher eligibility and NET/SET exams." },
  ],
};

/* ─── Exam category card ─── */
const ExamCard = ({ card, idx }: { card: ExamCard; idx: number }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.4, delay: idx * 0.05 }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="group relative cursor-pointer overflow-hidden rounded-[24px] border border-white bg-white/70 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">

    {/* soft gradient background */}
    <div className="absolute inset-0 z-0 opacity-[0.03] transition-opacity duration-300 group-hover:opacity-[0.07]"
      style={{ background: card.iconBg }} />

    <div className="relative z-10 flex h-full flex-col">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-4xl shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: card.iconBg }}>
          {card.icon}
        </div>
        {card.popular && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600 border border-amber-100/50">
            <Star className="h-3 w-3 fill-amber-500" /> Popular
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <h3 className="text-[20px] font-black tracking-tight text-gray-900">{card.name}</h3>
        </div>
        <p className="mb-4 text-[14px] leading-relaxed text-gray-500 line-clamp-2">{card.desc}</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {card.tags.map(tag => (
            <span key={tag} className="rounded-lg border border-gray-100 bg-gray-50/50 px-2.5 py-1 text-[11px] font-bold text-gray-500">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="text-[12px] font-bold text-gray-400">{card.students} Aspirants</span>
          <motion.div
            className="flex items-center gap-1.5 text-[14px] font-black"
            style={{ color: card.color }}
            whileHover={{ x: 5 }}>
            Explore <ArrowRight className="h-4 w-4" />
          </motion.div>
        </div>
      </div>
    </div>
  </motion.div>
);

/* ─── Step card ─── */
const Step = ({ num, icon, title, desc, color, delay }: {
  num: string; icon: React.ReactNode; title: string; desc: string; color: string; delay: number;
}) => (
  <FadeUp delay={delay} className="flex flex-col items-center text-center px-4 relative group">
    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] text-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 12px 32px ${color}33` }}>
      {icon}
    </div>
    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Step {num}</div>
    <h4 className="mb-2 text-[18px] font-bold text-gray-900">{title}</h4>
    <p className="text-[14px] leading-relaxed text-gray-500 max-w-[220px]">{desc}</p>
  </FadeUp>
);

/* ════════════════════════════════════════════════ */

const Index = () => {
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [activeTab,     setActiveTab]     = useState("competitive");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [showTyping,    setShowTyping]    = useState(true);
  const [showAiReply,   setShowAiReply]   = useState(false);
  const [activePricing, setActivePricing] = useState(1);
  const carouselRef = useRef<HTMLDivElement>(null);

  /* reveal AI reply after typing animation */
  useEffect(() => {
    const t1 = setTimeout(() => setShowTyping(false), 2000);
    const t2 = setTimeout(() => setShowAiReply(true),  2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* filter exams by search */
  const filteredExams = examData[activeTab].filter(e =>
    searchQuery === "" ||
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const [studyMenuOpen, setStudyMenuOpen] = useState(false);
  const navLinks = ["Home", "Courses", "About Us", "Career"];

  const studyMaterialLinks = [
    { name: "PYQs",        href: "#pyqs",   icon: <BookOpen className="h-4 w-4" /> },
    { name: "Books",       href: "#books",  icon: <Library className="h-4 w-4" /> },
    { name: "Quiz",        href: "#quiz",   icon: <GraduationCap className="h-4 w-4" /> },
    { name: "Free Videos", href: "#videos", icon: <Play className="h-4 w-4" /> },
  ];

  const scroll = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const features = [
    { icon: <Brain className="h-5 w-5" />,        color: B,        bg: "#EEF4FF", emoji: "🧠", title: "AI Assessment",        desc: "Auto question generation, adaptive difficulty, and instant evaluation with detailed insight reports." },
    { icon: <Zap className="h-5 w-5" />,           color: P,        bg: "#F3F0FF", emoji: "⚡", title: "Adaptive Learning",    desc: "Personalized 30-day study cycles that identify weak topics and build custom timetables automatically." },
    { icon: <Play className="h-5 w-5" />,          color: T,        bg: "#F0FDFA", emoji: "🎬", title: "Live Classes",         desc: "AI-assisted Q&A, real-time attendance, and post-lecture transcripts delivered to every student." },
    { icon: <BarChart2 className="h-5 w-5" />,     color: "#F59E0B",bg: "#FFFBEB", emoji: "📊", title: "Performance Tracking", desc: "Track scores, streaks, and accuracy trends with beautiful visual dashboards and weekly reports." },
    { icon: <MessageCircle className="h-5 w-5" />, color: "#10B981",bg: "#F0FDF4", emoji: "💬", title: "Doubt Solving",        desc: "24/7 bilingual AI chatbot resolves curriculum doubts in Hindi and English instantly." },
    { icon: <FlaskConical className="h-5 w-5" />,  color: "#EF4444",bg: "#FFF1F0", emoji: "🔬", title: "Test Analytics",       desc: "Deep dive into each test — mistake patterns, time analysis, and topic-level accuracy breakdown." },
  ];

  const testimonials = [
    { name: "Priya Sharma",  role: "JEE Aspirant",  text: "EDDVA's adaptive plan helped me improve my Physics score from 54% to 89% in just 3 months!", avatar: "P", color: B },
    { name: "Rahul Mehta",   role: "Parent",         text: "Finally a platform my son actually uses daily. The AI doubt solver is incredible — available at 2am!", avatar: "R", color: P },
    { name: "Ananya Singh",  role: "NEET Student",   text: "The test analytics showed me exactly where I was losing marks. Went from 550 to 680 in NEET mock.", avatar: "A", color: T },
  ];

  const pricing = [
    { name: "Basic",   price: "₹499",  period: "/month", desc: "Perfect for self-starters",          cta: "Get Started",     features: ["AI doubt solving (50/day)", "Mock tests (5/month)", "Performance dashboard", "Basic study plan"] },
    { name: "Pro",     price: "₹999",  period: "/month", desc: "Most popular for serious aspirants", cta: "Start Free Trial", features: ["Unlimited AI doubt solving", "Unlimited mock tests", "Advanced analytics", "AI adaptive study plan", "Live class access", "Priority support"] },
    { name: "Premium", price: "₹1,999",period: "/month", desc: "For institutions & coaching centers",cta: "Book Demo",        features: ["Everything in Pro", "Batch management", "Teacher dashboard", "Admin analytics", "AI proctoring", "Dedicated support"] },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 antialiased">

      {/* ══ NAVBAR ══ */}
      <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <img src={edvaLogo} alt="EDDVA" className="h-10 w-auto object-contain" />
          </Link>
          <nav className="hidden items-center gap-10 md:flex">
            {navLinks.map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="group relative text-[14px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-blue-600">
                {item}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 origin-left scale-x-0 bg-blue-600 transition-all group-hover:w-full group-hover:scale-x-100" />
              </a>
            ))}

            {/* Study Material Dropdown */}
            <div className="relative" onMouseEnter={() => setStudyMenuOpen(true)} onMouseLeave={() => setStudyMenuOpen(false)}>
              <button className="flex items-center gap-1.5 text-[14px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-blue-600">
                Study Material
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${studyMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {studyMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-1/2 top-full mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-[24px] border border-white bg-white/80 p-2 shadow-2xl backdrop-blur-xl"
                  >
                    {studyMaterialLinks.map(link => (
                      <a
                        key={link.name}
                        href={link.href}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-bold text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                          {link.icon}
                        </div>
                        {link.name}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/login" className="rounded-xl px-5 py-2.5 text-[14px] font-bold text-gray-600 transition-all hover:text-blue-600 hover:bg-blue-50/50">
              Login
            </Link>
            <motion.a href="#pricing" whileHover={{ scale: 1.05, boxShadow: `0 12px 30px ${B}33` }} whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden rounded-2xl px-7 py-3 text-[14px] font-black text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
              <span className="relative z-10 flex items-center gap-2">
                Start Free <Sparkles className="h-4 w-4" />
              </span>
              <motion.div
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </motion.a>
          </div>
          <button className="rounded-xl p-2 hover:bg-gray-100 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-100 bg-white px-6 pb-6 md:hidden">
              {navLinks.map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => setMenuOpen(false)}
                  className="block py-4 text-[14px] font-black uppercase tracking-widest text-gray-700 hover:text-blue-600 border-b border-gray-50">
                  {item}
                </a>
              ))}
              
              <div className="py-4">
                <p className="mb-3 text-[12px] font-black uppercase tracking-widest text-gray-400">Study Material</p>
                <div className="grid grid-cols-2 gap-2">
                  {studyMaterialLinks.map(link => (
                    <a key={link.name} href={link.href} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-[13px] font-bold text-gray-600">
                      {link.icon} {link.name}
                    </a>
                  ))}
                </div>
              </div>

              <Link to="/login" className="mt-4 block rounded-2xl border-2 border-gray-100 py-3.5 text-center text-[15px] font-black text-gray-700">
                Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden">
        {/* multi-layer soft bg */}
        <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(160deg, #ffffff 0%, #F0F7FF 45%, #F5F3FF 100%)" }} />
        {/* animated orbs */}
        <motion.div animate={{ scale: [1, 1.2, 1.1, 1], rotate: [0, 90, 180, 0], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full blur-[100px]" style={{ background: `radial-gradient(circle, ${B}44, transparent)` }} />
        <motion.div animate={{ scale: [1, 1.1, 1.2, 1], rotate: [0, -90, -180, 0], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="pointer-events-none absolute bottom-0 -left-24 h-96 w-96 rounded-full blur-[80px]" style={{ background: `radial-gradient(circle, ${P}33, transparent)` }} />
        {/* dot grid */}
        <div className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{ backgroundImage: `radial-gradient(circle, ${B} 1.5px, transparent 1.5px)`, backgroundSize: "36px 36px" }} />

        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            {/* Copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  <span className="text-[12px] font-bold uppercase tracking-widest text-blue-600">India's AI EdTech Platform</span>
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 text-[46px] font-extrabold leading-[1.1] tracking-tight text-gray-900 lg:text-[58px]">
                Smarter Learning.<br />
                <span style={{ background: `linear-gradient(135deg, ${B}, ${P})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Brighter Futures.
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8 max-w-lg text-[17px] font-medium leading-relaxed text-gray-500">
                AI-powered personalized education for JEE, NEET & beyond. Identify gaps, practice smart, and achieve the scores you deserve.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-10 flex flex-wrap gap-4">
                <motion.a href="#pricing" whileHover={{ scale: 1.04, boxShadow: `0 20px 40px ${B}44` }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl px-8 py-4 text-[16px] font-bold text-white shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                  Start Learning Free <ArrowRight className="h-5 w-5" />
                </motion.a>
                <motion.a href="#how-it-works" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-md px-8 py-4 text-[16px] font-bold text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50/50 shadow-sm">
                  Book Demo <ChevronRight className="h-5 w-5" />
                </motion.a>
              </motion.div>

              {/* stats */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.45 }}
                className="flex flex-wrap gap-8">
                {[{ val: "50K+", label: "Students" },{ val: "98%", label: "Pass Rate" },{ val: "500+", label: "Topics" },{ val: "24/7", label: "AI Support" }].map(({ val, label }) => (
                  <div key={label} className="text-center">
                    <p className="text-[22px] font-extrabold text-gray-900">{val}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Illustration */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" as const }}
              className="relative flex justify-center">
              <div className="absolute inset-0 m-auto h-4/5 w-4/5 rounded-full opacity-20 blur-3xl"
                style={{ background: `linear-gradient(135deg, ${B}, ${P})` }} />
              <img src={heroIllustration} alt="Learning" className="relative z-10 w-full max-w-lg drop-shadow-2xl" />

              <HeroBadge icon={<Zap className="h-4 w-4" />} label="XP Today" value="+240 pts" color={B} bg="#EEF4FF" drift={-8} delay={0} className="absolute left-0 top-16 z-20" />
              <HeroBadge icon={<TrendingUp className="h-4 w-4" />} label="Accuracy" value="89.4%" color="#10B981" bg="#F0FDF4" drift={8} delay={0.6} className="absolute bottom-12 right-0 z-20" />
              <HeroBadge icon={<Award className="h-4 w-4" />} label="Rank" value="#3 in Batch" color={P} bg="#F3F0FF" drift={-6} delay={1.2} className="absolute right-8 top-6 z-20" />

              {/* AI chat bubble */}
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay: 2 }}
                className="absolute bottom-28 left-0 z-20 flex max-w-[200px] items-start gap-2 rounded-2xl bg-white p-3 shadow-xl border border-gray-100">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>AI</div>
                <p className="text-[11px] leading-snug text-gray-700">
                  Your Chemistry needs attention. Shall I assign a recovery plan? 🎯
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 27.5C840 35 960 40 1080 37.5C1200 35 1320 25 1380 20L1440 15V60H0Z" fill="#F8FAFC"/>
          </svg>
        </div>
      </section>

      {/* ══ TRUST STRIP ══ */}
      <section className="border-b border-gray-100 bg-white py-14">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-10 text-center">
            <p className="text-[13px] font-bold uppercase tracking-widest text-gray-400">Trusted by 50,000+ students & parents across India</p>
          </FadeUp>
          <FadeUp delay={0.1} className="mb-12 flex flex-col items-center gap-2">
            <div className="flex gap-1">{Array(5).fill(0).map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}</div>
            <p className="text-[15px] font-semibold text-gray-600">4.9 / 5 — from 12,000+ reviews</p>
          </FadeUp>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.12}>
                <motion.div whileHover={{ y: -4, boxShadow: "0 16px 48px rgba(0,0,0,0.07)" }}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex gap-0.5">{Array(5).fill(0).map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                  <p className="mb-6 flex-1 text-[14px] leading-relaxed text-gray-600">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}bb)` }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">{t.name}</p>
                      <p className="text-[12px] text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EXAM CATEGORIES (MAJOR SECTION) ══ */}
      <section className="py-20 lg:py-28" id="exams" style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #EEF4FF 60%, #F3F0FF 100%)" }}>
        <div className="mx-auto max-w-7xl px-6">

          <FadeUp className="mb-12 text-center">
            <Label>Exam Categories</Label>
            <h2 className="mt-5 text-[36px] font-extrabold tracking-tight text-gray-900 lg:text-[44px]">
              Find Your Exam, Start Today
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-[17px] font-medium leading-relaxed text-gray-500">
              Comprehensive prep for 20+ exams — competitive, board, and government. Pick your goal and we'll build your path.
            </p>
          </FadeUp>

          {/* Search bar */}
          <FadeUp delay={0.1} className="mb-8 flex justify-center">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search exam (NEET, JEE, UPSC, CBSE…)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-5 text-[14px] text-gray-800 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </FadeUp>

          {/* Category tabs */}
          <FadeUp delay={0.15} className="mb-12 flex justify-center">
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-[24px] border border-gray-100 bg-white/50 backdrop-blur-xl p-2 shadow-inner">
              {examTabs.map(tab => (
                <motion.button key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
                  className={`relative flex items-center gap-2.5 rounded-[18px] px-6 py-3 text-[14px] font-black transition-all ${activeTab === tab.key ? "text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"}`}
                  whileTap={{ scale: 0.96 }}>
                  {activeTab === tab.key && (
                    <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-[18px] shadow-lg shadow-blue-500/20"
                      style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative z-10 text-lg opacity-90">{tab.icon}</span>
                  <span className="relative z-10 tracking-tight">{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </FadeUp>

          {/* Count + filter */}
          <FadeUp delay={0.2} className="mb-6 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-gray-400">
              Showing <span className="font-bold text-gray-900">{filteredExams.length}</span> exams
              {searchQuery && <span> for "<span className="text-blue-600">{searchQuery}</span>"</span>}
            </p>
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-400">
              <Filter className="h-3.5 w-3.5" />
              Sort: Popular first
            </div>
          </FadeUp>

          {/* Cards grid */}
          <AnimatePresence mode="wait">
            {filteredExams.length > 0 ? (
              <motion.div key={activeTab + searchQuery} layout
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExams.map((card, idx) => (
                  <ExamCard key={card.id} card={card} idx={idx} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="text-5xl">🔍</div>
                <p className="text-[16px] font-bold text-gray-700">No exams found for "{searchQuery}"</p>
                <p className="text-[14px] text-gray-400">Try searching for NEET, JEE, UPSC, CBSE…</p>
                <button onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-gray-200 px-5 py-2 text-[13px] font-bold text-gray-600 hover:bg-gray-50">
                  Clear search
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* popular badge callout */}
          <FadeUp delay={0.3} className="mt-10 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent max-w-xs" />
            <span className="flex items-center gap-2 rounded-full border border-yellow-100 bg-yellow-50 px-4 py-1.5 text-[12px] font-bold text-yellow-700">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              Popular exams are marked with a star
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 to-transparent max-w-xs" />
          </FadeUp>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="py-20 lg:py-28 bg-white" id="features">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-16 text-center">
            <Label>Features</Label>
            <h2 className="mt-5 text-[36px] font-extrabold tracking-tight text-gray-900 lg:text-[44px]">Everything you need to excel</h2>
            <p className="mt-4 mx-auto max-w-2xl text-[17px] font-medium leading-relaxed text-gray-500">
              Six AI-powered modules, one complete learning platform designed for real, measurable results.
            </p>
          </FadeUp>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => <FeatCard key={f.title} {...f} delay={i * 0.08} />)}
          </div>
        </div>
      </section>

      {/* ══ DASHBOARD PREVIEW ══ */}
      <section className="py-20 lg:py-28" style={{ background: "linear-gradient(180deg, #ffffff 0%, #EEF4FF 100%)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-16 text-center">
            <Label>Product Preview</Label>
            <h2 className="mt-5 text-[36px] font-extrabold tracking-tight text-gray-900">Your dashboard, reimagined</h2>
            <p className="mt-4 mx-auto max-w-xl text-[17px] text-gray-500 leading-relaxed">
              Track every metric, review every session, and get AI-powered suggestions — all in one calm, beautiful place.
            </p>
          </FadeUp>

          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.6fr]">
            {/* left: feature list */}
            <FadeUp className="space-y-6">
              {[
                { icon: "📊", color: B,        bg: "#EEF4FF", title: "Real-time Analytics",     desc: "Live score tracking, subject-wise accuracy, and weekly growth charts." },
                { icon: "🤖", color: P,        bg: "#F3F0FF", title: "AI-Powered Insights",     desc: "Personalized gap analysis and auto-assigned recovery modules." },
                { icon: "🏆", color: "#F59E0B",bg: "#FFFBEB", title: "Gamified Progress",       desc: "XP points, streaks, badges and batch leaderboards to stay motivated." },
                { icon: "📅", color: T,        bg: "#F0FDFA", title: "Smart Study Schedule",    desc: "AI builds and updates your daily plan based on exam date and performance." },
              ].map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                  className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: item.bg }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="mb-0.5 text-[15px] font-bold text-gray-900">{item.title}</h4>
                    <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </FadeUp>

            {/* right: browser mockup */}
            <FadeUp delay={0.15} className="relative">
              {/* decorative floating elements */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 -top-8 z-30 flex h-24 w-24 items-center justify-center rounded-[32px] border border-white bg-white/80 p-4 shadow-2xl backdrop-blur-xl">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase text-gray-400">Goal</p>
                  <p className="text-[20px] font-black text-emerald-500">92%</p>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-12 bottom-12 z-0 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-400/20 to-purple-400/20 blur-2xl" />

              <div className="relative z-10 overflow-hidden rounded-[32px] border border-white bg-white/40 shadow-2xl backdrop-blur-2xl"
                style={{ boxShadow: "0 40px 100px rgba(37,99,235,0.12)" }}>
                <div className="flex items-center gap-2 border-b border-gray-100 bg-white/50 px-6 py-4">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                    <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                    <div className="h-3 w-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="ml-6 flex-1 rounded-xl bg-gray-100 px-4 py-1.5 text-[12px] font-bold text-gray-400 tracking-tight">
                    app.eddva.in/student/dashboard
                  </div>
                </div>
                
                <div className="space-y-5 p-6" style={{ background: "rgba(248, 250, 252, 0.5)" }}>
                  {/* top stat row */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "XP",      val: "4,820",  icon: "⚡", color: B,        bg: "#EEF4FF" },
                      { label: "Streak",  val: "12d",    icon: "🔥", color: "#F59E0B", bg: "#FFFBEB" },
                      { label: "Accuracy",val: "89%",    icon: "🎯", color: "#10B981", bg: "#F0FDF4" },
                      { label: "Rank",    val: "#3",     icon: "🏆", color: P,        bg: "#F3F0FF" },
                    ].map(s => (
                      <motion.div key={s.label} whileHover={{ y: -4 }} className="rounded-[20px] border border-white bg-white p-4 text-center shadow-sm">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-lg shadow-sm" style={{ background: s.bg }}>{s.icon}</div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">{s.label}</p>
                        <p className="text-[17px] font-black" style={{ color: s.color }}>{s.val}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* progress */}
                  <div className="rounded-[24px] border border-white bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[12px] font-black uppercase tracking-[0.1em] text-gray-400">Active Learning</p>
                      <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">+12% gain</span>
                    </div>
                    {[
                      { name: "Physics",     pct: 78, color: B },
                      { name: "Chemistry",   pct: 62, color: P },
                      { name: "Mathematics", pct: 91, color: "#10B981" },
                    ].map(s => (
                      <div key={s.name} className="mb-4">
                        <div className="mb-2 flex justify-between text-[13px] font-black text-gray-700">
                          <span>{s.name}</span><span>{s.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <motion.div className="h-2 rounded-full"
                            initial={{ width: 0 }} whileInView={{ width: `${s.pct}%` }}
                            viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut" }}
                            style={{ background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI insight component */}
                  <motion.div initial={{ x: 20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }}
                    className="flex items-start gap-4 rounded-[24px] border border-blue-100 bg-blue-50/80 p-5 backdrop-blur-md">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-blue-700">Predictive Analysis</p>
                      <p className="text-[13px] font-medium leading-relaxed text-blue-900/80">
                        Current pace suggests a <strong>98th percentile</strong> in coming JEE Mock. Focus on "Thermodynamics" for +12 marks.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="bg-white py-20 lg:py-28" id="how-it-works">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-16 text-center">
            <Label>Learning Flow</Label>
            <h2 className="mt-5 text-[36px] font-extrabold tracking-tight text-gray-900">How EDDVA works</h2>
            <p className="mt-4 mx-auto max-w-xl text-[17px] text-gray-500 leading-relaxed">
              A simple 4-step AI-powered cycle designed to continuously improve your performance.
            </p>
          </FadeUp>
          <div className="relative">
            <div className="absolute top-7 left-[12.5%] right-[12.5%] hidden h-px lg:block"
              style={{ background: `linear-gradient(90deg, ${B}44, ${P}44, ${T}44, #F59E0B44)` }} />
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { num: "01", icon: <BookOpen className="h-6 w-6" />, title: "Learn",    desc: "Access curated AI-powered lessons tailored to your exam and level.", color: B },
                { num: "02", icon: <Target className="h-6 w-6" />,   title: "Practice", desc: "Adaptive quizzes that get progressively harder as you improve.", color: P },
                { num: "03", icon: <FlaskConical className="h-6 w-6" />, title: "Test", desc: "Full-length mock tests with proctoring, timing, and instant evaluation.", color: T },
                { num: "04", icon: <TrendingUp className="h-6 w-6" />, title: "Improve",desc: "AI pinpoints gaps and auto-assigns recovery resources for you.", color: "#F59E0B" },
              ].map((s, i) => <Step key={s.title} {...s} delay={i * 0.1} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ══ DOUBT SOLVING ══ */}
      <section className="py-20 lg:py-28" style={{ background: "#F8FAFC" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <FadeUp>
              <Label>AI Doubt Solver</Label>
              <h2 className="mt-5 text-[36px] font-extrabold leading-tight tracking-tight text-gray-900 lg:text-[42px]">
                Doubts cleared.<br />Any time. Any language.
              </h2>
              <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-gray-500">
                EDDVA's AI understands Hindi and English, resolves doubts instantly, and even corrects your notes — 24 hours a day.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: "🌙", title: "Always-On",  desc: "Available 24/7 — even at 2am" },
                  { icon: "🇮🇳", title: "Bilingual",  desc: "Hindi + English in one chat" },
                  { icon: "📝", title: "Notes AI",   desc: "Flags errors, fills gaps" },
                  { icon: "📊", title: "Tracks Doubts",desc: "Surfaces patterns to teachers" },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">{item.title}</p>
                      <p className="text-[12px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Enhanced chat UI */}
            <FadeUp delay={0.15}>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                style={{ boxShadow: "0 24px 64px rgba(37,99,235,0.10)" }}>
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4"
                  style={{ background: `linear-gradient(135deg, ${B}08, ${P}06)` }}>
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm"
                      style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                      AI
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-gray-900">EDDVA AI Assistant</p>
                    <div className="flex items-center gap-1.5">
                      <motion.span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                      <span className="text-[12px] font-medium text-green-600">Online · Responds instantly</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-500 shadow-sm">
                    24/7 Support
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3.5 p-5" style={{ background: "#FAFBFC" }}>
                  {/* AI greeting */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>AI</div>
                    <div>
                      <div className="rounded-2xl rounded-tl-none bg-white px-4 py-2.5 text-[13px] text-gray-700 shadow-sm border border-gray-100 max-w-xs leading-snug">
                        नमस्ते! 👋 Ask me anything in Hindi or English — I'm here 24/7.
                      </div>
                      <p className="mt-1 ml-1 text-[10px] text-gray-400">EDDVA AI · Just now</p>
                    </div>
                  </div>

                  {/* User message */}
                  <div className="flex justify-end">
                    <div>
                      <div className="rounded-2xl rounded-tr-none px-4 py-2.5 text-[13px] text-white max-w-xs leading-snug"
                        style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                        Newton's third law को simple way में explain करो
                      </div>
                      <p className="mt-1 mr-1 text-right text-[10px] text-gray-400">You · 1 min ago</p>
                    </div>
                  </div>

                  {/* AI reply */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[14px] text-[10px] font-black text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>AI</div>
                    <div className="max-w-[80%]">
                      <div className="rounded-[22px] rounded-tl-none bg-white px-5 py-4 text-[14px] text-gray-700 shadow-sm border border-gray-100 leading-relaxed">
                        हर <span className="font-bold text-blue-600">action</span> के लिए equal और opposite <span className="font-bold text-purple-600">reaction</span> होता है 🔄<br /><br />
                        <div className="rounded-xl bg-gray-50 p-3 text-[13px] border border-gray-100">
                          <strong>Example:</strong> जब आप दीवार को push करते हैं, दीवार भी आपको equal force से push करती है।
                        </div>
                      </div>
                      <p className="mt-2 ml-2 text-[11px] font-bold text-gray-400">EDDVA AI · 30s ago</p>
                    </div>
                  </div>

                  {/* User: check notes */}
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-none px-4 py-2.5 text-[13px] text-white max-w-xs leading-snug"
                      style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                      Can you check my notes on this?
                    </div>
                  </div>

                  {/* Typing OR result */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>AI</div>
                    <AnimatePresence mode="wait">
                      {showTyping ? (
                        <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="rounded-2xl rounded-tl-none bg-white shadow-sm border border-gray-100">
                          <TypingDots />
                        </motion.div>
                      ) : showAiReply ? (
                        <motion.div key="reply" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <div className="rounded-2xl rounded-tl-none border border-emerald-100 bg-emerald-50 px-5 py-4 text-[13px] text-emerald-800 max-w-xs leading-relaxed shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Check className="h-4 w-4 text-emerald-600" />
                              <strong className="font-black">Scan Complete</strong>
                            </div>
                            <p className="text-[12px] mb-2 font-medium">1 Conceptual error flagged · 2 sections incomplete</p>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-black text-white cursor-pointer active:scale-95 transition-all">
                              Download Corrected Version ⬇
                            </span>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Input bar */}
                <div className="border-t border-gray-100 px-5 py-3.5 bg-white">
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                    <span className="flex-1 text-[13px] text-gray-400">Ask your doubt in Hindi or English…</span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══ RESULTS ══ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-16 text-center">
            <Label>Results</Label>
            <h2 className="mt-5 text-[36px] font-extrabold tracking-tight text-gray-900">Real students, real improvements</h2>
            <p className="mt-4 mx-auto max-w-xl text-[17px] text-gray-500 leading-relaxed">
              Students using EDDVA see measurable improvement within weeks — not months.
            </p>
          </FadeUp>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <TrendingUp className="h-7 w-7" />, val: "+34%",  label: "Average score increase",      color: B,        bg: "#EEF4FF" },
              { icon: <Clock className="h-7 w-7" />,      val: "3 wks", label: "Average time to see results",  color: P,        bg: "#F3F0FF" },
              { icon: <Users className="h-7 w-7" />,      val: "92%",   label: "Students feel more confident", color: T,        bg: "#F0FDFA" },
              { icon: <Award className="h-7 w-7" />,      val: "50K+",  label: "Students enrolled",            color: "#F59E0B",bg: "#FFFBEB" },
            ].map((item, i) => (
              <FadeUp key={item.label} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4, boxShadow: `0 12px 40px ${item.color}15` }}
                  className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: item.bg, color: item.color }}>
                    {item.icon}
                  </div>
                  <p className="mb-2 text-[36px] font-extrabold leading-none" style={{ color: item.color }}>{item.val}</p>
                  <p className="text-[14px] font-medium leading-snug text-gray-500">{item.label}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="py-20 lg:py-28" id="pricing"
        style={{ background: "linear-gradient(180deg, #F8FAFC 0%, #EEF4FF 100%)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <FadeUp className="mb-16 text-center">
            <Label>Pricing</Label>
            <h2 className="mt-5 text-[36px] font-extrabold tracking-tight text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-4 mx-auto max-w-xl text-[17px] text-gray-500 leading-relaxed">
              Start free. Upgrade anytime. No hidden fees, no surprises.
            </p>
          </FadeUp>
          <div className="grid gap-6 md:grid-cols-3">
            {pricing.map((plan, i) => {
              const isHighlight = i === 1;
              return (
                <FadeUp key={plan.name} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: isHighlight ? `0 24px 64px ${B}28` : "0 12px 40px rgba(0,0,0,0.07)" }}
                    className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${isHighlight ? "border-2 bg-white shadow-xl" : "border border-gray-100 bg-white shadow-sm"}`}
                    style={isHighlight ? { borderColor: B + "55" } : {}}>
                    {isHighlight && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white shadow-md"
                          style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}>
                          Most Popular
                        </span>
                      </div>
                    )}
                    <h3 className="mb-1.5 text-[18px] font-bold text-gray-900">{plan.name}</h3>
                    <p className="mb-6 text-[13px] text-gray-400">{plan.desc}</p>
                    <div className="mb-7 flex items-end gap-1">
                      <span className="text-[40px] font-extrabold leading-none text-gray-900">{plan.price}</span>
                      <span className="mb-1.5 text-[14px] font-medium text-gray-400">{plan.period}</span>
                    </div>
                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: isHighlight ? B : "#9CA3AF" }} />
                          <span className="text-[14px] text-gray-600">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className={`w-full rounded-xl py-3 text-[15px] font-bold transition-all ${isHighlight ? "text-white shadow-md" : "border-2 border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-blue-50"}`}
                      style={isHighlight ? { background: `linear-gradient(135deg, ${B}, ${P})` } : {}}>
                      {plan.cta}
                    </motion.button>
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10"
          style={{ background: `linear-gradient(135deg, ${B} 0%, #4F46E5 50%, ${P} 100%)` }} />
        <div className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{ backgroundImage: `radial-gradient(circle, #fff 1.5px, transparent 1.5px)`, backgroundSize: "28px 28px" }} />
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" as const }}
          className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" as const, delay: 3 }}
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

        <div className="mx-auto max-w-4xl px-6 text-center">
          <FadeUp>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/80">Start Today — It's Free</span>
            </div>
            <h2 className="mb-6 text-[40px] font-extrabold leading-tight tracking-tight text-white lg:text-[52px]">
              Start Your Learning<br />Journey Today
            </h2>
            <p className="mb-10 mx-auto max-w-2xl text-[18px] font-medium leading-relaxed text-white/65">
              Join 50,000+ students already using EDDVA to study smarter, score higher, and achieve their dreams.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <motion.a href="#pricing" whileHover={{ scale: 1.05, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }} whileTap={{ scale: 0.97 }}
                className="group relative flex items-center gap-3 overflow-hidden rounded-[24px] bg-white px-10 py-5 text-[17px] font-black text-gray-900 shadow-2xl">
                Start Learning Free <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                <motion.div
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent"
                />
              </motion.a>
              <motion.a href="#how-it-works" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 rounded-[24px] border-2 border-white/40 bg-white/10 px-10 py-5 text-[17px] font-black text-white backdrop-blur-xl transition-all hover:bg-white/20">
                Book a Demo <ChevronRight className="h-6 w-6" />
              </motion.a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <img src={edvaLogo} alt="EDDVA" className="mb-5 h-10 w-auto object-contain" />
              <p className="max-w-xs text-[14px] leading-relaxed text-gray-500">
                India's AI-powered EdTech platform for JEE, NEET & beyond. Smarter learning, brighter futures.
              </p>
              <p className="mt-5 text-[13px] font-medium text-gray-400">🇮🇳 Available in Hindi & English</p>
            </div>
            {[
              { title: "Platform", links: ["AI Assessment", "Doubt Solver", "Live Classes", "Mock Tests", "Analytics"] },
              { title: "Company",  links: ["About EDDVA", "Careers", "Blog", "Press", "Contact"] },
              { title: "Support",  links: ["Help Center", "Book Demo", "Partner With Us", "Privacy Policy", "Terms"] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="mb-5 text-[12px] font-bold uppercase tracking-widest text-gray-400">{col.title}</h5>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-[14px] font-medium text-gray-500 transition-colors hover:text-blue-600">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
            <p className="text-[13px] text-gray-400">© 2025 EDDVA — Education Plus Advancement. All rights reserved.</p>
            <p className="text-[13px] text-gray-400">Made with ❤️ in India</p>
          </div>
        </div>
      </footer>

      {/* ══ FLOATING AI BUTTON ══ */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.4, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.12, boxShadow: `0 16px 48px ${B}55` }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${B}, ${P})` }}
        title="Chat with AI">
        <Bot className="h-6 w-6" />
      </motion.button>

    </div>
  );
};

export default Index;
