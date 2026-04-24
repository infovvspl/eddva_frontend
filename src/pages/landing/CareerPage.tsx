import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { B, P, T, IN, grad, gText, BG_STUDIO } from "@/components/landing/DesignTokens";
import {
  ArrowRight, ChevronRight, Sparkles, Calendar,
  Clock, Bell, BookOpen, Target, TrendingUp, Award,
  CheckCircle, AlertCircle, Timer,
} from "lucide-react";
import careerImg from "@/assets/glowing-lightbulb-with-graduation-cap-icon-floating-digital-space-learning-new-skill-progress_982248-12957.jpg";

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.55, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ── Exam data ── */
const exams = [
  {
    id: "jee-mains-1",
    name: "JEE Mains — Session 1",
    icon: "⚛️",
    color: B,
    category: "Engineering",
    date: "Jan 22 – Feb 1, 2025",
    regStart: "Nov 1, 2024",
    regEnd: "Dec 5, 2024",
    status: "upcoming",
    daysLeft: 45,
    students: "13L+",
    eligibility: "Class 12 / Dropper",
    desc: "National-level engineering entrance for IITs, NITs and GFTIs. Physics, Chemistry, Mathematics.",
    tags: ["Class 11", "Class 12", "Dropper"],
  },
  {
    id: "neet-2025",
    name: "NEET UG 2025",
    icon: "🩺",
    color: "#EF4444",
    category: "Medical",
    date: "May 4, 2025",
    regStart: "Feb 7, 2025",
    regEnd: "Mar 7, 2025",
    status: "upcoming",
    daysLeft: 116,
    students: "24L+",
    eligibility: "Class 12 / Dropper",
    desc: "Single national medical entrance for MBBS, BDS and Ayush admissions. Biology, Physics, Chemistry.",
    tags: ["Class 11", "Class 12", "Dropper"],
  },
  {
    id: "jee-mains-2",
    name: "JEE Mains — Session 2",
    icon: "⚛️",
    color: IN,
    category: "Engineering",
    date: "Apr 1–15, 2025",
    regStart: "Jan 27, 2025",
    regEnd: "Feb 25, 2025",
    status: "upcoming",
    daysLeft: 83,
    students: "13L+",
    eligibility: "Class 12 / Dropper",
    desc: "Second session of JEE Mains. Best of two scores considered for JEE Advanced eligibility.",
    tags: ["Class 12", "Dropper"],
  },
  {
    id: "cbse-boards",
    name: "CBSE Board Exams 2025",
    icon: "🎓",
    color: T,
    category: "Boards",
    date: "Feb 15 – Apr 4, 2025",
    regStart: "Sep 2024",
    regEnd: "Oct 2024",
    status: "reg-closed",
    daysLeft: 58,
    students: "38L+",
    eligibility: "Class 10 & 12",
    desc: "Central Board of Secondary Education annual exams for Class 10 (All India) and Class 12.",
    tags: ["Class 10", "Class 12"],
  },
  {
    id: "icse-isc",
    name: "ICSE / ISC Boards 2025",
    icon: "🏫",
    color: P,
    category: "Boards",
    date: "Feb 18 – Mar 28, 2025",
    regStart: "Aug 2024",
    regEnd: "Oct 2024",
    status: "reg-closed",
    daysLeft: 61,
    students: "3L+",
    eligibility: "Class 10 & 12",
    desc: "CISCE board examinations for ICSE (Class 10) and ISC (Class 12) students.",
    tags: ["Class 10", "Class 12"],
  },
  {
    id: "state-board",
    name: "State Board Exams 2025",
    icon: "📚",
    color: "#F59E0B",
    category: "Boards",
    date: "Mar 1 – Apr 15, 2025",
    regStart: "Varies by state",
    regEnd: "Varies by state",
    status: "upcoming",
    daysLeft: 72,
    students: "50L+",
    eligibility: "Class 9 – 12",
    desc: "Annual examinations for all major state boards — MP, UP, Maharashtra, Rajasthan, Karnataka & more.",
    tags: ["Class 9", "Class 10", "Class 11", "Class 12"],
  },
  {
    id: "jee-advanced",
    name: "JEE Advanced 2025",
    icon: "🏆",
    color: "#F59E0B",
    category: "Engineering",
    date: "May 18, 2025",
    regStart: "Apr 23, 2025",
    regEnd: "May 2, 2025",
    status: "upcoming",
    daysLeft: 130,
    students: "1.8L+",
    eligibility: "JEE Mains Top 2.5L",
    desc: "IIT entrance exam. Only the top 2.5 lakh JEE Mains qualified students are eligible.",
    tags: ["Dropper", "Class 12"],
  },
  {
    id: "isc-12",
    name: "ISC Class 11–12 Practicals",
    icon: "📐",
    color: IN,
    category: "Boards",
    date: "Jan 6 – Feb 14, 2025",
    regStart: "School registered",
    regEnd: "School registered",
    status: "live",
    daysLeft: 0,
    students: "1.5L+",
    eligibility: "ISC Class 12",
    desc: "Practical examinations for ISC Class 12 Science and Commerce streams.",
    tags: ["Class 12"],
  },
];

const categories = ["All", "Engineering", "Medical", "Boards"];

const statusConfig = {
  live: { label: "Live Now", bg: "#ECFDF5", color: "#059669", dot: "#10B981" },
  upcoming: { label: "Upcoming", bg: "#EFF6FF", color: "#2563EB", dot: "#3B82F6" },
  "reg-closed": { label: "Reg Closed", bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
};

export default function CareerPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = activeTab === "All" ? exams : exams.filter(e => e.category === activeTab);

  return (
    <div className="min-h-screen font-sans text-gray-900 antialiased" style={{ background: BG_STUDIO }}>
      <LandingNavbar />

      <main>
        {/* ══ HERO BANNER ══ */}
        <section className="relative h-[72vh] min-h-[500px] overflow-hidden">
          <img
            src={careerImg}
            alt="Upcoming Exams — Future Learning"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(110deg, rgba(3,8,24,0.92) 0%, rgba(3,8,24,0.75) 55%, rgba(3,8,24,0.50) 100%)" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-36"
            style={{ background: `linear-gradient(to bottom, transparent, ${BG_STUDIO})` }}
          />

          <div className="relative z-10 flex h-full items-center">
            <div className="landing-shell-wide">
              <FadeUp>
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white/80 backdrop-blur-sm">
                  <Calendar className="h-3 w-3" /> Upcoming Exams 2025
                </span>
                <h1 className="landing-title-hero mb-5 text-white">
                  Your Next Big<br />
                  <span style={{ background: "linear-gradient(135deg,#FBBF24,#F59E0B,#FCD34D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Exam is Coming.
                  </span>
                </h1>
                <p className="mb-10 max-w-xl text-[17px] font-medium leading-relaxed text-white/65">
                  Stay ahead of every important exam date — JEE, NEET, CBSE, ICSE, State Boards and more. Start your preparation today.
                </p>
                <div className="flex flex-wrap gap-4">
                  <motion.a
                    href="#exams"
                    whileHover={{ scale: 1.04, boxShadow: "0 16px 40px rgba(251,191,36,0.35)" }}
                    whileTap={{ scale: 0.97 }}
                    className="landing-button flex items-center gap-2 text-gray-900 shadow-lg"
                    style={{ background: "linear-gradient(135deg,#FBBF24,#F59E0B)" }}
                  >
                    View All Exams <ArrowRight className="h-4 w-4" />
                  </motion.a>

                </div>
              </FadeUp>

              {/* floating exam stat chips */}
              <div className="absolute bottom-16 right-8 hidden flex-col gap-3 lg:flex">
                {[
                  { icon: "⚛️", val: "JEE Mains",  },
                  { icon: "🩺", val: "NEET UG",  },
                  { icon: "🎓", val: "CBSE Boards",  },
                ].map((s, i) => (
                  <motion.div
                    key={s.val}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/10 px-4 py-2.5 backdrop-blur-md"
                  >
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-[13px] font-bold text-white leading-none">{s.val}</p>
                      <p className="mt-0.5 text-[11px] text-white/50">{s.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* ══ UPCOMING EXAMS LIST ══ */}
        <section className="landing-section" id="exams"
          style={{ background: "linear-gradient(160deg,#F0FDF4 0%,#EFF6FF 55%,#F5F3FF 100%)" }}>
          <div className="landing-shell">
            <FadeUp className="mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-blue-600">
                <Calendar className="h-3 w-3" /> Exam Calendar 2025
              </span>
            </FadeUp>
            <FadeUp delay={0.05} className="mb-4 text-center">
              <h2 className="landing-title-section">
                Upcoming <span style={gText()}>Exams</span>
              </h2>
            </FadeUp>
            <FadeUp delay={0.08} className="mb-10 text-center">
              <p className="mx-auto max-w-xl text-[16px] text-gray-500">
                All major competitive and board exams in one place. Never miss a date.
              </p>
            </FadeUp>

            {/* Category tabs */}
            <FadeUp delay={0.1} className="mb-8 flex justify-center">
              <div className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
                {categories.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="relative rounded-xl px-5 py-2 text-[13px] font-bold transition-all"
                    style={{ color: activeTab === tab ? "white" : "#6B7280" }}
                  >
                    {activeTab === tab && (
                      <motion.div
                        layoutId="examTabBg"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: grad() }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{tab}</span>
                  </button>
                ))}
              </div>
            </FadeUp>

            {/* Exam cards */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid gap-5 lg:grid-cols-2"
              >
                {filtered.map((exam, i) => {
                  const st = statusConfig[exam.status as keyof typeof statusConfig];
                  const isOpen = expanded === exam.id;
                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      whileHover={{ y: -4, boxShadow: `0 20px 48px ${exam.color}18` }}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all"
                    >
                      {/* top accent */}
                      <div className="h-1" style={{ background: `linear-gradient(90deg, ${exam.color}, ${exam.color}88)` }} />

                      <div className="p-5">
                        <div className="mb-4 flex items-start gap-4">
                          {/* icon */}
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
                            style={{ background: `${exam.color}12` }}>
                            {exam.icon}
                          </div>
                          {/* title + status */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                              <h3 className="text-[16px] font-extrabold text-gray-900">{exam.name}</h3>
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                style={{ background: st.bg, color: st.color }}>
                                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: st.dot }} />
                                {st.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {exam.tags.map(t => (
                                <span key={t} className="rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* date + days left */}
                        <div className="mb-4 grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                            <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: exam.color }} />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Exam Date</p>
                              <p className="text-[13px] font-bold text-gray-800">{exam.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                            {exam.status === "live" ? (
                              <Bell className="h-4 w-4 flex-shrink-0 text-green-500" />
                            ) : (
                              <Timer className="h-4 w-4 flex-shrink-0" style={{ color: exam.color }} />
                            )}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {exam.status === "live" ? "In Progress" : "Days Left"}
                              </p>
                              <p className="text-[13px] font-bold" style={{ color: exam.color }}>
                                {exam.status === "live" ? "Ongoing" : `${exam.daysLeft} days`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* expand toggle */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="mb-4 space-y-2 rounded-xl border border-gray-100 p-4">
                                <p className="text-[13px] leading-relaxed text-gray-600">{exam.desc}</p>
                                <div className="flex flex-wrap gap-4 pt-2 text-[12px] font-semibold text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Eligibility: {exam.eligibility}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" style={{ color: exam.color }} /> Reg Starts: {exam.regStart}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 text-red-400" /> Reg Ends: {exam.regEnd}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* action row */}
                        <div className="flex items-center gap-3">
                          <motion.a
                            href="/study-material"
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${exam.color}, ${exam.color}cc)` }}
                          >
                            Start Prep <ArrowRight className="h-3.5 w-3.5" />
                          </motion.a>
                          <button
                            onClick={() => setExpanded(isOpen ? null : exam.id)}
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            {isOpen ? "Less" : "Details"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ══ PREP CTA ══ */}
        <section className="landing-section bg-white text-center">
          <div className="landing-shell-narrow">
            <FadeUp>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">Start Free — No Credit Card</span>
              </div>
              <h2 className="landing-title-feature mb-5">
                Ready to crack your <span style={gText()}>exam?</span>
              </h2>
              <p className="mx-auto mb-10 max-w-lg text-[16px] font-medium leading-relaxed text-gray-500">
                Join 50,000+ students already preparing on EDDVA. AI-powered study plans, mock tests, and doubt solving — all in one place.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <motion.a href="/study-material"
                  whileHover={{ scale: 1.05, boxShadow: `0 20px 48px ${B}44` }} whileTap={{ scale: 0.97 }}
                  className="landing-button flex items-center gap-2 text-white shadow-xl"
                  style={{ background: grad() }}>
                  Start Preparing Free <ArrowRight className="h-4 w-4" />
                </motion.a>
                <motion.a href="/about"
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="landing-button flex items-center gap-2 border-2 border-gray-200 text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50">
                  Learn About EDDVA <ChevronRight className="h-4 w-4" />
                </motion.a>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
