import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  FiArrowUpRight,
  FiBookOpen,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiShield,
  FiLayers,
  FiMonitor,
  FiCode,
  FiTerminal,
  FiAward,
} from "react-icons/fi";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { Link } from "react-router-dom";

// ─── Shared ease ──────────────────────────────────────────────────────────────
const ease = [0.16, 1, 0.3, 1] as const;

// ─── Data Interfaces ──────────────────────────────────────────────────────────
interface Course {
  id: number;
  title: string;
  category: "Engineering" | "Design" | "Business";
  level: string;
  duration: string;
  rating: string;
  reviews: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  text: string;
}

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const courses: Course[] = [
  {
    id: 1,
    title: "Full-Stack Web Engineering",
    category: "Engineering",
    level: "Intermediate to Advanced",
    duration: "12 Weeks",
    rating: "4.9",
    reviews: "2.1k",
    description:
      "Master React, Node.js, and system architecture. Build production-ready, scalable applications from scratch.",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600",
    icon: <FiCode className="w-5 h-5" />,
    color: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    id: 2,
    title: "Advanced UI/UX Design",
    category: "Design",
    level: "All Levels",
    duration: "8 Weeks",
    rating: "4.8",
    reviews: "1.5k",
    description:
      "Go beyond the basics. Learn design systems, micro-interactions, and psychological principles of user flow.",
    image:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600",
    icon: <FiMonitor className="w-5 h-5" />,
    color: "from-violet-500 to-fuchsia-400",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    id: 3,
    title: "Backend Architecture & DevOps",
    category: "Engineering",
    level: "Advanced",
    duration: "10 Weeks",
    rating: "4.9",
    reviews: "950",
    description:
      "Design robust APIs, manage microservices, and deploy pipelines using Docker, Kubernetes, and AWS.",
    image:
      "https://images.unsplash.com/photo-1618401471353-b98a520d9c1a?q=80&w=600",
    icon: <FiTerminal className="w-5 h-5" />,
    color: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    id: 4,
    title: "Product Management Mastery",
    category: "Business",
    level: "Intermediate",
    duration: "6 Weeks",
    rating: "4.7",
    reviews: "1.2k",
    description:
      "Learn how to define product vision, manage roadmaps, and lead cross-functional teams to launch successful products.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600",
    icon: <FiLayers className="w-5 h-5" />,
    color: "from-amber-500 to-orange-400",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
];

// Explicitly typed array in case you choose to uncomment the features section later
const _features: Feature[] = [
  {
    title: "Project-Based Learning",
    description:
      "No endless lectures. Build real-world projects that you can showcase in your portfolio from day one.",
    icon: <FiLayers className="w-6 h-6" />,
  },
  {
    title: "Expert Mentorship",
    description:
      "Get 1-on-1 guidance from industry leaders who actively work at top tech companies.",
    icon: <FiAward className="w-6 h-6" />,
  },
  {
    title: "Lifetime Access",
    description:
      "Your learning doesn't expire. Revisit the materials and updates anytime in your career.",
    icon: <FiClock className="w-6 h-6" />,
  },
];

type CategoryFilter = "All" | "Engineering" | "Design" | "Business";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoursesPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const filteredCourses =
    activeCategory === "All"
      ? courses
      : courses.filter((c) => c.category === activeCategory);

  const categories: CategoryFilter[] = ["All", "Engineering", "Design", "Business"];

  return (
    <LandingLayout>
    <main className="w-full bg-white text-slate-900 overflow-hidden">
      {/* hero */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex overflow-hidden bg-slate-950"
      >
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
              Our Programs
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.0] tracking-tight mb-8"
          >
            Master your craft.
            <br />
            <span className="font-spicy bg-gradient-to-r from-[#0066cc] via-[#00a6ff] to-cyan-300 bg-clip-text text-transparent">
              Build your future.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed max-w-md mb-10 font-medium"
          >
            Industry-aligned curriculum designed to take you from fundamentals
            to mastery. No fluff, just high-impact skills that employers
            actually want.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <button
              onClick={() => {
                document
                  .getElementById("courses-grid")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group relative inline-flex items-center gap-2 bg-[#0066cc] hover:bg-[#004499] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Browse Courses</span>
              <FiArrowUpRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </motion.div>
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
                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200"
                alt="Coding workspace"
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
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-transparent to-slate-600"
          />
          Explore
        </motion.div>
      </section>

      {/* courses content grid */}
      <section
        id="courses-grid"
        className="relative py-24 sm:py-32 px-8 sm:px-16 lg:px-24 overflow-hidden bg-slate-50"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px)] bg-[size:6rem] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-8 bg-[#0066cc]" />
                <span className="text-xs font-bold tracking-[0.2em] text-[#0066cc] uppercase">
                  Curriculum
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Find your
                <span className="font-spicy ml-3 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                  learning path.
                </span>
              </h2>
            </motion.div>

            {/* Tabs */}
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

          {/* Grid Container */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease }}
                className="group flex flex-col bg-white border border-slate-200/80 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
              >
                {/* Image Area */}
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Overlay Badges */}
                  <div className="absolute top-5 left-5 flex gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-black uppercase tracking-wider text-slate-900 shadow-sm">
                      {course.category}
                    </span>
                  </div>
                  <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm">
                    <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {course.rating} ({course.reviews})
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <FiTrendingUp className="w-4 h-4 text-[#0066cc]" />
                      {course.level}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-1.5">
                      <FiClock className="w-4 h-4 text-[#0066cc]" />
                      {course.duration}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-[#0066cc] transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-1">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${course.color} text-white shadow-sm`}
                      >
                        {course.icon}
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        View Curriculum
                      </span>
                    </div>
                    <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#0066cc] group-hover:border-[#0066cc] group-hover:text-white transition-all duration-300">
                      <FiArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
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
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight">
                Don't just learn.
                <br />
                <span className="font-spicy bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] bg-clip-text text-transparent">
                  Build and deploy.
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
                Get full access to all our interactive courses, community
                discord, and 1-on-1 mentorship sessions. Start building your
                portfolio today.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register"
                  className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#004499] via-[#0066cc] to-[#00a6ff] text-white px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">Enroll Now</span>
                  <FiArrowUpRight className="relative z-10 w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:border-[#0066cc]/40 hover:text-slate-900 px-7 py-4 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-md"
                >
                  <FiBookOpen className="w-4 h-4" />
                  <span>Sign in to continue</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                Secure checkout. Cancel anytime.
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
    </LandingLayout>
  );
}