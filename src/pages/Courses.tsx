import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Star, Clock, Users, Play, ArrowRight,
  Brain, Sparkles, Target, LineChart, Rocket, GraduationCap,
  Trophy, Briefcase, Lightbulb, Loader2,
} from "lucide-react";
import { B, P } from "@/components/landing/DesignTokens";
import { useAllPublicBatches } from "@/hooks/use-student";
import type { PublicBatch } from "@/lib/api/student";

// ── Fallback imagery ───────────────────────────────────────────────────────
const FALLBACK_IMAGES: Record<string, string> = {
  jee:   "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1200",
  neet:  "https://images.unsplash.com/photo-1532187875605-186c73196ed8?auto=format&fit=crop&q=80&w=1200",
  cbse:  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200",
  govt:  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200",
  skill: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&q=80&w=1200",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const normalize = (s?: string) => (s ?? "").toLowerCase().replace(/[\s_-]+/g, "");

type CourseType = "All" | "Competitive" | "School" | "Govt" | "Skill-Based";

const CATEGORIES: { id: CourseType; icon: React.ReactNode }[] = [
  { id: "All",         icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: "Competitive", icon: <Trophy className="h-3.5 w-3.5" /> },
  { id: "School",      icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { id: "Govt",        icon: <Briefcase className="h-3.5 w-3.5" /> },
  { id: "Skill-Based", icon: <Lightbulb className="h-3.5 w-3.5" /> },
];

function batchType(batch: PublicBatch): CourseType {
  const e = normalize(batch.examTarget);
  const c = normalize(batch.class);
  if (e.includes("ssc") || e.includes("ibps") || e.includes("upsc") || e.includes("govt") || e.includes("banking")) return "Govt";
  if (e.includes("jee") || e.includes("neet") || e.includes("cat") || e.includes("olympiad") || e.includes("iit")) return "Competitive";
  if (e.includes("cbse") || e.includes("icse") || e.includes("board") || ["9", "10", "11", "12"].includes(c)) return "School";
  return "Skill-Based";
}

function imageFor(batch: PublicBatch): string {
  if (batch.thumbnailUrl) return batch.thumbnailUrl;
  const e = normalize(batch.examTarget);
  if (e.includes("neet")) return FALLBACK_IMAGES.neet;
  if (e.includes("jee"))  return FALLBACK_IMAGES.jee;
  if (e.includes("cbse") || e.includes("board")) return FALLBACK_IMAGES.cbse;
  if (e.includes("ssc")  || e.includes("upsc") || e.includes("govt")) return FALLBACK_IMAGES.govt;
  return FALLBACK_IMAGES.skill;
}

function formatDuration(b: PublicBatch): string {
  if (!b.startDate || !b.endDate) return "Self-paced";
  const months = Math.max(1, Math.round((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)));
  return `${months} mo${months > 1 ? "s" : ""}`;
}

// ── Course Card (premium) ──────────────────────────────────────────────────
function CourseCard({ batch, delay = 0 }: { batch: PublicBatch; delay?: number }) {
  const priceLabel = batch.isPaid
    ? batch.feeAmount != null ? `₹${batch.feeAmount.toLocaleString("en-IN")}` : "Paid"
    : "Free";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_40px_-12px_rgba(59,130,246,0.15)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_20px_60px_-12px_rgba(124,58,237,0.25)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={imageFor(batch)}
          alt={batch.name}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES.skill; }}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-800 backdrop-blur-md">
            {batch.examTarget}
          </span>
          <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow">
            {priceLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-5">
        <h3 className="text-[17px] font-black leading-snug text-gray-900 line-clamp-2 min-h-[44px]">
          {batch.name}
        </h3>

        <div className="flex items-center gap-4 text-[12px] font-semibold text-gray-500">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> 4.8</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {batch.studentCount ?? 0}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDuration(batch)}</span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-[11px] font-black text-blue-700">
              {(batch.teacher?.fullName ?? "E").slice(0, 1).toUpperCase()}
            </div>
            <span className="text-[12px] font-bold text-gray-600 truncate max-w-[120px]">
              {batch.teacher?.fullName ?? "EDDVA Faculty"}
            </span>
          </div>
          <Link
            to="/login"
            className="group/cta flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3.5 py-1.5 text-[12px] font-black text-white shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
          >
            View <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Feature cards (Why EDVA) ───────────────────────────────────────────────
const FEATURES = [
  { icon: <Brain    className="h-6 w-6" />, title: "AI Personalized Learning", desc: "Custom study plans tuned to your rank target and weak areas — updated every session." },
  { icon: <LineChart className="h-6 w-6" />, title: "Smart Progress Tracking",  desc: "See chapter mastery, mock rank trajectory, and retention metrics at a glance." },
  { icon: <Target   className="h-6 w-6" />, title: "Adaptive Tests & Practice", desc: "Questions that get harder as you improve, with PYQs tagged by difficulty and topic." },
  { icon: <Rocket   className="h-6 w-6" />, title: "Exam-Focused Strategy",     desc: "Stay locked onto syllabus coverage with timed revision sprints before test day." },
];

// ── Testimonials ───────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "Riya Sharma", role: "AIR 142 • JEE Mains 2024",  quote: "EDDVA's adaptive mocks exposed exactly the topics I was avoiding. My physics score jumped 38 marks in 6 weeks." },
  { name: "Arjun Mehta", role: "NEET Aspirant",             quote: "The AI planner builds my day around my school timings. I've never felt this in control of my prep." },
  { name: "Kavya Iyer",  role: "Class 12 • CBSE",            quote: "Concepts finally click. The short video explainers + instant doubt solver are magic before board exams." },
];

// ── Curated fallback courses (shown when the public batches API returns empty)
// ──────────────────────────────────────────────────────────────────────────────
// The /batches endpoint is tenant-scoped and auth-required, so unauthenticated
// landing traffic won't see any real batches. Show a curated preview instead.
const SAMPLE_COURSES: PublicBatch[] = [
  { id: "s1",  name: "IIT-JEE Ultimate Prep 2025",    examTarget: "JEE",  class: "12", status: "active", isPaid: true,  feeAmount: 14999, maxStudents: 500, studentCount: 12400, teacher: { id: "t1", fullName: "Dr. Arvind Kumar" } },
  { id: "s2",  name: "NEET Biology Masterclass",      examTarget: "NEET", class: "12", status: "active", isPaid: true,  feeAmount: 9999,  maxStudents: 500, studentCount: 8200,  teacher: { id: "t2", fullName: "Sarah D'souza" } },
  { id: "s3",  name: "CBSE Class 12 Board Booster",   examTarget: "CBSE", class: "12", status: "active", isPaid: false, feeAmount: null,  maxStudents: 500, studentCount: 15000, teacher: { id: "t3", fullName: "Team EDDVA" } },
  { id: "s4",  name: "Quantum Physics AI Guide",      examTarget: "JEE",  class: "12", status: "active", isPaid: true,  feeAmount: 4999,  maxStudents: 500, studentCount: 2100,  teacher: { id: "t4", fullName: "AI Tutor" } },
  { id: "s5",  name: "SSC CGL Strategy Course",       examTarget: "SSC",  class: "12", status: "active", isPaid: true,  feeAmount: 3999,  maxStudents: 500, studentCount: 5400,  teacher: { id: "t5", fullName: "Vikram Singh" } },
  { id: "s6",  name: "Foundation Maths — Class 10",   examTarget: "CBSE", class: "10", status: "active", isPaid: false, feeAmount: null,  maxStudents: 500, studentCount: 20000, teacher: { id: "t6", fullName: "Kavitha Reddy" } },
  { id: "s7",  name: "Python for Future Engineers",   examTarget: "SKILL",class: "12", status: "active", isPaid: true,  feeAmount: 2499,  maxStudents: 500, studentCount: 7000,  teacher: { id: "t7", fullName: "Vikram Seth" } },
  { id: "s8",  name: "UPSC Prelims Crash Course",     examTarget: "UPSC", class: "12", status: "active", isPaid: true,  feeAmount: 7999,  maxStudents: 500, studentCount: 3800,  teacher: { id: "t8", fullName: "Priya Iyer" } },
];

// ── Page ───────────────────────────────────────────────────────────────────
export default function Courses() {
  const { data: fetchedBatches, isLoading, isError } = useAllPublicBatches();
  const [activeType, setActiveType] = useState<CourseType>("All");
  const [query, setQuery] = useState("");

  // Fall back to curated samples if the public API returns empty
  const batches: PublicBatch[] = useMemo(
    () => (fetchedBatches && fetchedBatches.length > 0) ? fetchedBatches : SAMPLE_COURSES,
    [fetchedBatches]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches.filter((b) => {
      if (activeType !== "All" && batchType(b) !== activeType) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.teacher?.fullName?.toLowerCase().includes(q) ||
        b.examTarget.toLowerCase().includes(q)
      );
    });
  }, [batches, activeType, query]);

  const trending = useMemo(
    () => [...batches].sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0)).slice(0, 6),
    [batches]
  );

  return (
    <LandingLayout>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg,#F8FAFC 0%,#EEF4FF 50%,#F5F3FF 100%)" }} />
        <motion.div
          aria-hidden
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-16 -z-10 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
          style={{ background: `radial-gradient(circle, ${B}66, transparent 70%)` }}
        />
        <motion.div
          aria-hidden
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -right-10 -z-10 h-[480px] w-[480px] rounded-full blur-3xl opacity-40"
          style={{ background: `radial-gradient(circle, ${P}66, transparent 70%)` }}
        />
        <div className="absolute inset-0 -z-10 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(circle, ${B} 1.5px, transparent 1.5px)`, backgroundSize: "32px 32px" }} />

        <div className="landing-shell text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/70 px-4 py-1.5 backdrop-blur-md shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Learning • Made in India
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mx-auto mt-6 max-w-4xl text-[36px] font-black leading-[1.05] tracking-tight text-gray-900 sm:text-[56px]"
          >
            Learn Smarter.{" "}
            <span style={{ background: `linear-gradient(135deg, ${B}, ${P})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Rank Faster.
            </span>{" "}
            Powered by AI.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-[17px] font-medium leading-relaxed text-gray-500"
          >
            Personalized AI tutoring for JEE, NEET, UPSC and beyond — adaptive mocks, smart planners, and instant doubt solving in one place.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3.5 text-[14px] font-black text-white shadow-xl shadow-blue-500/30 transition-all hover:shadow-2xl hover:shadow-purple-500/40 active:scale-95"
            >
              Start Learning <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#courses"
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-7 py-3.5 text-[14px] font-black text-gray-900 backdrop-blur-md transition-all hover:border-blue-300 hover:bg-white active:scale-95"
            >
              Explore Courses
            </a>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-12 w-full max-w-2xl"
          >
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search courses (JEE Physics, Python, etc.)"
                className="h-16 w-full rounded-[24px] border border-white/80 bg-white/70 pl-16 pr-6 text-[15px] font-bold text-gray-800 shadow-2xl shadow-blue-500/10 backdrop-blur-xl outline-none transition-all focus:border-blue-200 focus:bg-white focus:shadow-purple-500/20"
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["JEE Mains", "NEET UG", "Class 12 Boards", "UPSC", "Coding"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="rounded-full border border-blue-100 bg-white/60 px-4 py-1.5 text-[12px] font-bold text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white hover:shadow-md"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CATEGORY FILTERS (sticky) ─── */}
      <div id="courses" className="sticky top-[73px] z-30 border-y border-gray-100 bg-white/80 py-4 backdrop-blur-xl">
        <div className="landing-shell flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(({ id, icon }) => {
              const active = activeType === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => setActiveType(id)}
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: active ? 1.04 : 1 }}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-[12px] font-black uppercase tracking-widest transition-all
                    ${active
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "border border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:text-blue-600"
                    }`}
                >
                  {icon} {id}
                </motion.button>
              );
            })}
          </div>

          <button className="hidden items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-[12px] font-bold text-gray-600 hover:bg-gray-50 md:flex">
            <Filter className="h-3.5 w-3.5" /> More Filters
          </button>
        </div>
      </div>

      {/* ─── WHY EDVA ─── */}
      <section className="landing-section bg-white">
        <div className="landing-shell">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14 text-center"
          >
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-600">Why EDDVA</span>
            <h2 className="mt-3 text-[32px] font-black tracking-tight text-gray-900 sm:text-[42px]">
              Built for rank jumps, not busywork.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-500 font-medium">
              Four core systems that work silently in the background so you can focus on learning.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-[0_20px_60px_-12px_rgba(124,58,237,0.2)]"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-blue-50/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-blue-50 group-hover:to-purple-50" />
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-[17px] font-black text-gray-900">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500 font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COURSES CATALOG ─── */}
      <section className="landing-section bg-gradient-to-b from-slate-50/60 to-white">
        <div className="landing-shell">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
          >
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">Explore Catalog</span>
              <h2 className="mt-3 text-[32px] font-black tracking-tight text-gray-900 sm:text-[42px]">
                Courses picked by AI, taught by humans.
              </h2>
            </div>
            <p className="text-[14px] text-gray-500 font-medium max-w-sm">
              {filtered.length} {filtered.length === 1 ? "course" : "courses"} matching your filters.
            </p>
          </motion.div>

          {/* States */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="mt-4 text-sm font-medium">Loading courses…</p>
            </div>
          )}
          {!isLoading && isError && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <p className="text-sm">Unable to load courses right now. Please try again later.</p>
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <p className="text-lg font-bold text-gray-700">No courses found</p>
              <p className="mt-2 text-sm">Try a different category or search term.</p>
            </div>
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filtered.map((b, i) => (
                  <CourseCard key={b.id} batch={b} delay={i * 0.04} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ─── CONTINUE LEARNING (Trending strip, public-safe) ─── */}
      {trending.length > 0 && (
        <section className="landing-section bg-white">
          <div className="landing-shell">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-purple-600">Trending Now</span>
                <h2 className="mt-2 text-[28px] font-black tracking-tight text-gray-900">Most enrolled this week</h2>
              </div>
              <Link to="/register" className="text-[13px] font-black text-blue-600 hover:underline">View all →</Link>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
              {trending.map((b) => {
                const progress = Math.min(95, 20 + ((b.studentCount ?? 0) % 75));
                return (
                  <motion.div
                    key={b.id}
                    whileHover={{ y: -4 }}
                    className="min-w-[320px] flex-shrink-0 snap-start overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={imageFor(b)}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGES.skill; }}
                        alt={b.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-800 backdrop-blur-md">
                        {b.examTarget}
                      </span>
                    </div>
                    <div className="p-5">
                      <h4 className="mb-3 text-[15px] font-black text-gray-900 line-clamp-1">{b.name}</h4>
                      <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-gray-400">Class Progress</span>
                        <span className="text-blue-600">{progress}%</span>
                      </div>
                      <div className="mb-4 h-1.5 w-full rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                        />
                      </div>
                      <Link
                        to="/login"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-[12px] font-black text-white transition-colors hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600"
                      >
                        Continue <Play className="h-3 w-3 fill-current" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── TESTIMONIALS / TRUST ─── */}
      <section className="landing-section bg-gradient-to-b from-white to-slate-50/60">
        <div className="landing-shell">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">Loved by learners</span>
            <h2 className="mt-3 text-[32px] font-black tracking-tight text-gray-900 sm:text-[42px]">
              Trusted by <span style={{ background: `linear-gradient(135deg, ${B}, ${P})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>10,000+</span> students
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-500 font-medium">
              Real ranks, real feedback, real outcomes.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="mx-auto mb-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: "10K+", label: "Students" },
              { value: "500+", label: "Mock Tests" },
              { value: "98%",  label: "Retention" },
              { value: "4.9★", label: "Avg Rating" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-5 text-center shadow-sm">
                <div className="text-[26px] font-black" style={{ background: `linear-gradient(135deg, ${B}, ${P})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="relative rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-[0_20px_60px_-12px_rgba(59,130,246,0.2)]"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-6 text-[14px] leading-relaxed text-gray-700">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-[13px] font-black text-white">
                    {t.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-gray-900">{t.name}</div>
                    <div className="text-[11px] font-bold text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="landing-section">
        <div className="landing-shell">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-[32px] p-10 text-center text-white sm:p-16"
            style={{ background: `linear-gradient(135deg, ${B} 0%, ${P} 100%)` }}
          >
            {/* Decorative orbs */}
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <Sparkles className="mx-auto h-8 w-8" />
            <h2 className="mx-auto mt-6 max-w-3xl text-[30px] font-black leading-tight sm:text-[44px]">
              Start your AI-powered learning journey today.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium opacity-90">
              Join thousands of students cracking India's toughest exams with EDDVA.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-[14px] font-black text-gray-900 shadow-xl transition-transform active:scale-95 hover:scale-105"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </LandingLayout>
  );
}
