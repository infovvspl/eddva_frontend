import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, FileText, FlaskConical, BookOpen, Search,
  ShieldCheck, Loader2,
  Users, Sparkles, ArrowRight, BookMarked, Trophy, Zap,
} from "lucide-react";
import { useMyCourses, useDiscoverBatches, useStudentMe } from "@/hooks/use-student";
import type { MyCourse } from "@/lib/api/student";
import type { PublicBatch } from "@/lib/api/student";
import { cn } from "@/lib/utils";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();

function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

// ─── Exam target filter config ────────────────────────────────────────────────

const EXAM_FILTERS = [
  { label: "All Courses", value: "all", color: "from-indigo-500 to-purple-600" },
  { label: "JEE",         value: "JEE",     color: "from-orange-500 to-red-500" },
  { label: "NEET",        value: "NEET",    color: "from-emerald-500 to-teal-500" },
  { label: "CBSE 10",     value: "CBSE_10", color: "from-blue-500 to-indigo-500" },
  { label: "CBSE 12",     value: "CBSE_12", color: "from-violet-500 to-purple-500" },
];

const EXAM_GRADIENTS: Record<string, string> = {
  JEE:     "from-orange-400 to-red-500",
  NEET:    "from-emerald-400 to-teal-500",
  CBSE_10: "from-blue-400 to-indigo-500",
  CBSE_12: "from-violet-400 to-purple-500",
  default: "from-indigo-400 to-purple-500",
};

// ─── Course Discovery (shown when 0 enrolled courses) ─────────────────────────

function CourseDiscovery() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: discoverData, isLoading } = useDiscoverBatches();
  const batches: PublicBatch[] = discoverData?.availableBatches ?? [];

  const [examFilter, setExamFilter] = useState("all");
  const [search, setSearch]         = useState("");
  const prefApplied = useRef(false);

  // Once the student's preference loads, set it as the default (only once)
  useEffect(() => {
    if (prefApplied.current || !me?.student?.examTarget) return;
    const et = me.student.examTarget.toUpperCase().replace(/-/g, "_");
    if (EXAM_FILTERS.some(f => f.value === et)) {
      setExamFilter(et);
    }
    prefApplied.current = true;
  }, [me?.student?.examTarget]);

  // Normalize batch examTarget to uppercase_underscore for comparison
  const filtered = batches.filter(b => {
    const bTarget = (b.examTarget ?? "").toUpperCase().replace(/-/g, "_");
    if (examFilter !== "all" && bTarget !== examFilter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !(b.examTarget ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleViewCourse = (batch: PublicBatch) => {
    // Navigate to detail page, passing batch data as state for instant display
    navigate(`/student/courses/${batch.id}`, {
      state: { preview: batch },
    });
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 md:p-12 text-white">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wider uppercase">
              ✨ Discover
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Find Your Perfect<br />
            <span className="text-indigo-200">Learning Journey</span>
          </h1>
          <p className="text-indigo-100 text-base mb-6 leading-relaxed">
            Browse courses across all institutes. Enroll for free or at a fee — start learning today.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-indigo-100">
              <BookOpen className="w-4 h-4" />
              <span><strong className="text-white">{batches.length}</strong> courses</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-100">
              <Users className="w-4 h-4" />
              <span><strong className="text-white">{batches.reduce((s, b) => s + (b.studentCount ?? 0), 0).toLocaleString()}</strong> students</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-100">
              <Trophy className="w-4 h-4" />
              <span><strong className="text-white">{new Set(batches.map(b => b.examTarget)).size}</strong> exam targets</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses, exams…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-sm"
          />
        </div>

        {/* Exam filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {EXAM_FILTERS.map(f => (
            <button key={f.value} onClick={() => setExamFilter(f.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all border",
                examFilter === f.value
                  ? `bg-gradient-to-r ${f.color} text-white border-transparent shadow-md`
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ── */}
      {!isLoading && (
        <p className="text-sm text-slate-400 mb-5">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> course{filtered.length !== 1 ? "s" : ""}
          {examFilter !== "all" ? ` for ${examFilter}` : ""}
          {search ? ` matching "${search}"` : ""}
        </p>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-slate-500 font-medium">Fetching courses…</p>
        </div>
      )}

      {/* ── Empty result ── */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
            <BookMarked className="w-9 h-9 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-600 text-lg">No courses found</p>
          <p className="text-slate-400 text-sm mt-1">Try a different exam target or search term</p>
          <button onClick={() => { setExamFilter("all"); setSearch(""); }}
            className="mt-4 px-5 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl text-sm hover:bg-indigo-100 transition-colors">
            Clear filters
          </button>
        </div>
      )}

      {/* ── Course Grid ── */}
      {!isLoading && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map((batch, i) => {
            const thumb = resolveUrl(batch.thumbnailUrl);
            const gradient = EXAM_GRADIENTS[batch.examTarget] ?? EXAM_GRADIENTS.default;

            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 overflow-hidden group flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative h-44 overflow-hidden shrink-0">
                  {thumb ? (
                    <img src={thumb} alt={batch.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <BookOpen className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-slate-700 uppercase tracking-wide shadow-sm">
                      {batch.examTarget}
                    </span>
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-slate-700 shadow-sm">
                      {batch.class}
                    </span>
                  </div>

                  {/* Free / Paid badge */}
                  <div className="absolute top-3 right-3">
                    {batch.isPaid && batch.feeAmount ? (
                      <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-sm">
                        ₹{batch.feeAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm">
                        FREE
                      </span>
                    )}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                    {batch.name}
                  </h3>

                  {batch.teacher && (
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-3">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {batch.teacher.fullName}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-4 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{(batch.studentCount ?? 0).toLocaleString()} enrolled</span>
                    </div>
                    {batch.maxStudents && (
                      <div className="flex items-center gap-1">
                        <span className="text-slate-300">·</span>
                        <span>Max {batch.maxStudents}</span>
                      </div>
                    )}
                  </div>

                  {/* View Course button */}
                  <div className="mt-auto">
                    <button
                      onClick={() => handleViewCourse(batch)}
                      className={cn(
                        "w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                        "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm",
                        "hover:from-indigo-700 hover:to-indigo-600 hover:shadow-indigo-500/30 hover:shadow-lg hover:-translate-y-0.5"
                      )}
                    >
                      {batch.isPaid ? <Zap className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      {batch.isPaid ? `View · ₹${batch.feeAmount?.toLocaleString()}` : "View Course"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showDiscover = searchParams.get("discover") === "1";
  const { data: courses = [], isLoading } = useMyCourses();
  const [activeTab, setActiveTab] = useState<"ongoing" | "completed" | "not_started">("ongoing");
  const [search, setSearch] = useState("");

  if (isLoading) return (
    <div className="py-40 flex flex-col items-center justify-center gap-6">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
    </div>
  );

  // ── No enrolments OR user clicked "Discover More" → show discovery page ──
  if (courses.length === 0 || showDiscover) {
    return (
      <div className="max-w-7xl mx-auto p-6 pb-24">
        {showDiscover && courses.length > 0 && (
          <button
            onClick={() => setSearchParams({})}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Back to My Courses
          </button>
        )}
        <CourseDiscovery />
      </div>
    );
  }

  // ── Has enrolments → existing courses view ────────────────────────────────
  const filteredCourses = courses.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    const pct = c.progress?.overallPct ?? 0;
    if (activeTab === "completed"   && pct < 100) return false;
    if (activeTab === "not_started" && pct > 0)   return false;
    if (activeTab === "ongoing"     && pct === 100) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 pb-32">

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Courses</h1>
          <p className="text-slate-500 text-sm">Track, manage, and continue your learning journey.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-64"
            />
          </div>
        </div>
      </header>

      {/* Continue learning banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Play className="w-3.5 h-3.5 fill-current" /> Continue Learning 🚀
          </div>
          <h2 className="text-2xl font-bold mb-1">Pick up where you left off</h2>
          <p className="text-indigo-200 text-sm">Keep your streak going — every session counts.</p>
        </div>
        <button onClick={() => navigate("/student/learn")}
          className="relative z-10 px-8 py-3.5 bg-white text-indigo-900 font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform shadow-lg whitespace-nowrap">
          <Play className="w-4 h-4 fill-current" /> Resume Now
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
            {[
              { id: "ongoing",     label: "🔵 Ongoing" },
              { id: "completed",   label: "🟢 Completed" },
              { id: "not_started", label: "🔴 Not Started" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-6 py-3 text-sm font-semibold border-b-2 transition-all",
                  activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
                )}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Course cards */}
          <div className="space-y-6">
            {filteredCourses.length > 0 ? filteredCourses.map(course => {
              const pct = course.progress?.overallPct ?? 0;
              const thumb = resolveUrl(course.thumbnailUrl);
              return (
                <div key={course.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 group">
                  <div className="w-full sm:w-48 h-36 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                    {thumb ? (
                      <img src={thumb} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
                        <BookOpen className="w-8 h-8 text-indigo-200" />
                      </div>
                    )}
                    {course.examTarget && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold rounded-lg uppercase text-slate-700 shadow-sm">
                        {course.examTarget}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">{course.name}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> By {course.teacher?.fullName || "Expert Faculty"}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">Progress: {pct}%</span>
                        <span className="text-slate-500">{course.progress?.completedTopics || 0} / {course.progress?.totalTopics || 0} topics done</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => navigate(`/student/courses/${course.id}`)}
                        className="px-4 py-2 text-[13px] font-bold bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-100/50">
                        <Play className="w-3 h-3 fill-current" /> Resume
                      </button>
                      <button className="px-4 py-2 text-[13px] font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Notes
                      </button>
                      <button className="px-4 py-2 text-[13px] font-semibold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5" /> Test
                      </button>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <p className="text-slate-500 font-medium">No courses in this category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Your Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/60">
                <p className="text-2xl font-black text-slate-800">{courses.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">📚 Total</p>
              </div>
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-2xl font-black text-indigo-600">
                  {courses.filter(c => (c.progress?.overallPct ?? 0) > 0 && (c.progress?.overallPct ?? 0) < 100).length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mt-1">🔥 Active</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p className="text-2xl font-black text-emerald-600">
                  {courses.filter(c => (c.progress?.overallPct ?? 0) === 100).length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mt-1">✅ Done</p>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <p className="text-2xl font-black text-amber-600">
                  {courses.filter(c => (c.progress?.overallPct ?? 0) === 0).length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mt-1">⏳ Not Started</p>
              </div>
            </div>
          </div>

          {/* Browse more */}
          <button
            onClick={() => setSearchParams({ discover: "1" })}
            className="w-full p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white text-left shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Sparkles className="w-5 h-5 mb-2 opacity-80" />
            <p className="font-bold text-sm mb-1">Discover More Courses</p>
            <p className="text-indigo-200 text-xs">Browse all available courses across all institutes</p>
            <div className="flex items-center gap-1 text-indigo-200 text-xs mt-3 font-semibold">
              Explore <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
