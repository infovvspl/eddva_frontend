import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import {
  FiArrowUpRight,
  FiClock,
  FiHeart,
  FiGlobe,
  FiMonitor,
  FiTrendingUp,
  FiShield,
} from "react-icons/fi";

// ─── Shared ease ──────────────────────────────────────────────────────────────
const ease = [0.16, 1, 0.3, 1] as const;

// ─── Data Interfaces ──────────────────────────────────────────────────────────
type CategoryType = "School Board" | "Engineering" | "Higher Secondary" | "Medical";

interface Exam {
  id: number;
  title: string;
  category: CategoryType;
  date: string;
  daysLeft: number;
  description: string;
  bg: string;
  text: string;
  border: string;
  shadow: string;
}

interface Perk {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const exams: Exam[] = [
  {
    id: 1,
    title: "CBSE Class X Board Exams",
    category: "School Board",
    date: "May 31, 2026",
    daysLeft: 5,
    description:
      "National level competitive exam for recruitment to various Civil Services of the Government of India.",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "group-hover:border-amber-500/30",
    shadow: "group-hover:shadow-amber-500/10",
  },
  {
    id: 2,
    title: "IIT JEE Advanced",
    category: "Engineering",
    date: "June 07, 2026",
    daysLeft: 12,
    description:
      "Elite engineering entrance assessment for top-tier Indian Institutes of Technology.",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "group-hover:border-blue-500/30",
    shadow: "group-hover:shadow-blue-500/10",
  },
  {
    id: 3,
    title: "JEE Main 2027",
    category: "Engineering",
    date: "November 29, 2026",
    daysLeft: 187,
    description:
      "Prerequisite for admission into various management programmes at the IIMs and premier business schools.",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "group-hover:border-purple-500/30",
    shadow: "group-hover:shadow-purple-500/10",
  },
  {
    id: 4,
    title: "NEET UG",
    category: "Medical",
    date: "May 03, 2027",
    daysLeft: 342,
    description:
      "All India pre-medical entrance test for students wishing to pursue undergraduate medical courses.",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "group-hover:border-emerald-500/30",
    shadow: "group-hover:shadow-emerald-500/10",
  },
];

const _perks: Perk[] = [
  {
    title: "Work from Anywhere",
    description:
      "We are a remote-first team. Work from the comfort of your home, a cafe, or a co-working space anywhere in the world.",
    icon: <FiGlobe className="w-6 h-6" />,
  },
  {
    title: "Health & Wellness",
    description:
      "Comprehensive medical, dental, and vision coverage for you and your dependents, plus mental health days.",
    icon: <FiHeart className="w-6 h-6" />,
  },
  {
    title: "Continuous Learning",
    description:
      "$2,000 annual budget for courses, books, and conferences. Because we believe in growth.",
    icon: <FiTrendingUp className="w-6 h-6" />,
  },
  {
    title: "Home Office Setup",
    description:
      "We'll provide the latest gear and a stipend to make sure your workspace is comfortable and productive.",
    icon: <FiMonitor className="w-6 h-6" />,
  },
];

type CategoryFilter = "All" | CategoryType;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CareersPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const filteredExams =
    activeCategory === "All"
      ? exams
      : exams.filter((e) => e.category === activeCategory);

  const categories: CategoryFilter[] = [
    "All",
    "School Board",
    "Engineering",
    "Higher Secondary",
    "Medical",
  ];

  return (
    <LandingLayout>
      <main className="w-full bg-white text-slate-900 overflow-hidden">
        {/* HERO */}
        <section ref={heroRef} className="relative min-h-screen flex overflow-hidden bg-slate-950" >
          {/* Left panel — text */}
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative z-10 flex flex-col justify-center px-8 sm:px-16 lg:px-24 pt-28 pb-16 w-full lg:w-1/2"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease }}
              className="flex items-center gap-3 mb-8"
            >
              <span className="h-px w-10 bg-[#0066cc]" />
              <span className="text-xs font-bold tracking-[0.2em] text-[#0066cc] uppercase">
                Careers at Eddva
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-8"
            >
              Your Next Big
              <br />
              <span className="font-spicy bg-gradient-to-r from-[#0066cc] via-[#00a6ff] to-cyan-300 bg-clip-text text-transparent">
                Exam is Coming.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.2 }}
              className="text-slate-400 text-lg leading-relaxed max-w-md mb-10 font-medium"
            >
              Stay ahead of every important exam date — JEE, NEET, CBSE, ICSE,
              State Boards and more. Start your preparation today.
            </motion.p>
          </motion.div>

          {/* Right panel — image mosaic */}
          <div className="hidden lg:block absolute right-0 top-0 w-1/2 h-full overflow-hidden">
            {/* Dark overlay on left edge for blend */}
            <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-slate-950 to-transparent z-10" />
            <div className="absolute inset-0 bg-slate-950/30 z-10" />

            {/* Large Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.2 }}
              className="absolute inset-0 p-4 pl-0 py-8"
            >
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200"
                  alt="Team collaborating"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2 text-slate-600 text-xs font-semibold tracking-widest uppercase z-20"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-px h-8 bg-gradient-to-b from-transparent to-slate-600"
            />
            Scroll
          </motion.div>
        </section>

        {/* UPCOMING EXAMS */}
        <section
          id="upcoming-exams"
          className="relative py-24 sm:py-32 px-8 sm:px-16 lg:px-24 overflow-hidden bg-slate-50"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px)] bg-[size:6rem] opacity-40 pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10">
            {/* Header & Category Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px w-8 bg-[#0066cc]" />
                  <span className="text-xs font-bold tracking-[0.2em] text-[#0066cc] uppercase">
                    Stay Ahead
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  Upcoming
                  <span className="font-spicy ml-3 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                    Exams Tracker.
                  </span>
                </h2>
              </motion.div>

              {/* Category Tabs */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease }}
                className="flex flex-wrap gap-2"
              >
                {categories.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                      activeCategory === cat
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Exams List */}
            <div className="flex flex-col gap-4">
              {filteredExams.map((exam) => (
                <motion.div
                  key={exam.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease }}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 hover:shadow-xl transition-all duration-300 ${exam.shadow} ${exam.border}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${exam.bg} ${exam.text}`}
                      >
                        {exam.category}
                      </span>

                      {exam.daysLeft <= 15 && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 animate-pulse">
                          Exam Approaching
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 group-hover:text-[#0066cc] transition-colors">
                      {exam.title}
                    </h3>

                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl mb-4">
                      {exam.description}
                    </p>

                    <div className="flex items-center gap-5 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <FiClock className="w-4 h-4 text-[#0066cc]" />
                        Date: {exam.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        {exam.daysLeft} Days Left
                      </div>
                    </div>
                  </div>

                  {/* React Router Link Action */}
                  <div className="flex-shrink-0">
                    <Link
                      to="/study-material"
                      state={{ examId: exam.id, examTitle: exam.title }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-[#0066cc] px-6 py-3 rounded-xl font-bold text-sm transition-colors duration-300 shadow-sm"
                    >
                      Start Prep
                      <FiArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}

              {filteredExams.length === 0 && (
                <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-500 font-medium">
                    No upcoming exams tracked under this field yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-24 sm:py-32 px-8 sm:px-16 lg:px-24 overflow-hidden bg-white border-t border-slate-100">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-50/60 to-transparent pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease }}
                className="lg:col-span-7"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-px w-8 bg-[#0066cc]" />
                  <span className="text-xs font-bold tracking-[0.2em] text-[#0066cc] uppercase">
                    Don't see a fit?
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight">
                  Ready to crack
                  <br />
                  <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                    your exam?
                  </span>
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease, delay: 0.1 }}
                className="lg:col-span-5 space-y-6"
              >
                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                  Join 50,000+ students already preparing on EDDVA. AI-powered
                  study plans, mock tests, and doubt solving — all in one place.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden">
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">Email Us</span>
                    <FiArrowUpRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </LandingLayout>
  );
}
