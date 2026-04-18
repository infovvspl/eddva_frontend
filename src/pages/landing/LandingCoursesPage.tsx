import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Play, ChevronDown, Star, Filter, Users, Loader2 } from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { B, P, T, gText, SG, TYPO, BG_STUDIO } from "@/components/landing/DesignTokens";
import { useAllPublicBatches } from "@/hooks/use-student";
import type { PublicBatch } from "@/lib/api/student";

const fallbackThumb = "/assets/jee_neet.png";

const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
);

const courseCategories = [
  { id: "all",        name: "All Courses",    icon: "✨", color: B },
  { id: "jee",        name: "IIT JEE",         icon: "⚛️", color: B },
  { id: "neet",       name: "NEET UG",         icon: "🩺", color: "#EF4444" },
  { id: "foundation", name: "Foundation (9-10)", icon: "🎒", color: T },
  { id: "boards",     name: "School Boards",   icon: "🎓", color: P },
];

function normalizeExam(t?: string) {
  return (t ?? "").toLowerCase().replace(/[\s_]+/g, "");
}

function matchesCategory(batch: PublicBatch, category: string) {
  if (category === "all") return true;
  const exam = normalizeExam(batch.examTarget);
  const cls  = normalizeExam(batch.class);
  switch (category) {
    case "jee":        return exam.includes("jee");
    case "neet":       return exam.includes("neet");
    case "foundation": return cls === "9" || cls === "10" || cls.includes("class9") || cls.includes("class10");
    case "boards":     return exam.includes("cbse") || exam.includes("icse") || exam.includes("board") || cls === "11" || cls === "12";
    default:           return true;
  }
}

function categoryColor(examTarget?: string) {
  const e = normalizeExam(examTarget);
  if (e.includes("neet")) return "#EF4444";
  if (e.includes("jee")) return B;
  if (e.includes("cbse") || e.includes("board")) return P;
  return T;
}

export default function LandingCoursesPage() {
  const { data: batches, isLoading, isError } = useAllPublicBatches();
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = batches ?? [];
    const q = query.trim().toLowerCase();
    return list.filter(b => {
      if (!matchesCategory(b, category)) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.teacher?.fullName?.toLowerCase().includes(q) ||
        b.examTarget.toLowerCase().includes(q)
      );
    });
  }, [batches, category, query]);

  return (
    <div className="min-h-screen font-sans text-gray-900 antialiased" style={{ background: BG_STUDIO }}>
      <LandingNavbar />

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-20 pb-12 lg:pt-32 lg:pb-16">
          <div className="absolute inset-0 -z-10" style={{ background: SG }} />
          <div className="landing-shell text-center">
            <FadeUp>
              <h1 className={TYPO.h1}>
                Explore our <span style={gText()}>Mastery Courses.</span>
              </h1>
              <p className={TYPO.p + " mx-auto max-w-2xl mt-8"}>
                Premium AI-powered courses designed to help you master every subject and crack your dream exams.
              </p>

              {/* Search Bar */}
              <div className="mx-auto max-w-2xl relative mb-16">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search for courses, subjects or instructors..."
                  className="h-14 w-full rounded-[2rem] border border-gray-100 bg-white/60 pl-14 pr-5 text-gray-900 shadow-2xl backdrop-blur-xl outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:h-16 sm:pl-16 sm:pr-6"
                />
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── Course Grid ── */}
        <section className="landing-section bg-white">
          <div className="landing-shell">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 pb-8 border-b border-gray-100">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full sm:w-auto">
                {courseCategories.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={
                        active
                          ? "whitespace-nowrap rounded-full px-6 py-2 bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                          : "whitespace-nowrap rounded-full px-6 py-2 border border-gray-100 bg-white text-gray-500 font-bold text-sm hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95"
                      }
                    >
                      {cat.icon} {cat.name}
                    </button>
                  );
                })}
              </div>
              <button className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm self-end">
                <Filter className="h-4 w-4" /> Filter By Rank
              </button>
            </div>

            {/* Loading / Error / Empty states */}
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

            {/* Courses List */}
            {!isLoading && !isError && filtered.length > 0 && (
              <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course, i) => {
                  const color = categoryColor(course.examTarget);
                  const thumb = course.thumbnailUrl || fallbackThumb;
                  const isLive = course.status?.toLowerCase() === "active";
                  const priceLabel = course.isPaid
                    ? course.feeAmount != null
                      ? `₹${course.feeAmount.toLocaleString("en-IN")}`
                      : "Paid"
                    : "Free";

                  return (
                    <FadeUp key={course.id} delay={i * 0.05}>
                      <Link to={`/login`} className="block">
                        <motion.div
                          whileHover={{ y: -10 }}
                          className="overflow-hidden rounded-[2.5rem] bg-white transition-all duration-500 group cursor-pointer"
                        >
                          <div className="relative aspect-video overflow-hidden rounded-[2.5rem] shadow-2xl">
                            <img
                              src={thumb}
                              alt={course.name}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackThumb; }}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-gray-950 shadow-[0_0_50px_rgba(255,255,255,0.4)] scale-75 group-hover:scale-100 transition-transform duration-300">
                                <Play className="h-7 w-7 fill-current translate-x-0.5" />
                              </div>
                            </div>

                            <div className="absolute left-4 top-4 flex gap-2">
                              {isLive && (
                                <div className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-[10px] uppercase font-black text-white shadow-lg animate-pulse">
                                  <div className="h-1.5 w-1.5 rounded-full bg-white" /> Live
                                </div>
                              )}
                              <div
                                className="rounded-lg px-3 py-1 text-[10px] uppercase font-black text-white backdrop-blur-md border border-white/30 shadow"
                                style={{ background: color }}
                              >
                                {course.examTarget?.toUpperCase() ?? "Course"}
                              </div>
                            </div>

                            <div className="absolute bottom-4 right-4 rounded-lg bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                              {priceLabel}
                            </div>
                          </div>

                          <div className="pt-6 px-2">
                            <h3 className={TYPO.cardTitle + " group-hover:text-blue-600 transition-colors mb-2 line-clamp-2"}>
                              {course.name}
                            </h3>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-xs font-black text-gray-500">
                                  {(course.teacher?.fullName ?? "E").slice(0, 1).toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-500 truncate max-w-[140px]">
                                  {course.teacher?.fullName ?? "EDDVA Faculty"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-600 border border-blue-100">
                                <Star className="h-3.5 w-3.5 fill-current" /> 4.8
                              </div>
                            </div>

                            <div className="mt-6 flex items-center gap-4 border-t border-gray-50 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {course.studentCount ?? 0} Enrolled
                              </span>
                              <div className="h-1 w-1 rounded-full bg-gray-300" />
                              <span className="text-[12px] font-black text-blue-600 uppercase tracking-widest">Enroll Now</span>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    </FadeUp>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── FAQ Section ── */}
        <section className="landing-section bg-slate-50">
          <div className="landing-shell-narrow text-center">
            <FadeUp>
              <h2 className={TYPO.h2 + " mb-12"}>Frequently Asked Questions</h2>
              <div className="space-y-4 text-left">
                {[
                  "How does the AI personalization work?",
                  "Can I access courses offline?",
                  "Is there a free trial for premium courses?",
                  "Will I get a certificate after completion?"
                ].map((q, i) => (
                  <div key={i} className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">{q}</span>
                      <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-hover:rotate-180" />
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
