import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play, BookOpen, Flame, Sparkles, ArrowRight,
  Loader2, CheckCircle2, Clock, BarChart2, ChevronRight,
} from "lucide-react";

import { useStudentMe, useMyCourses, useContinueLearning } from "@/hooks/use-student";
import { cn } from "@/lib/utils";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();
function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${_API_ORIGIN}${url}`;
}

// ─── Course progress card ─────────────────────────────────────────────────────

function CourseCard({ course, onResume }: { course: any; onResume: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const thumb = resolveUrl(course.thumbnailUrl);
  const pct = course.progress?.overallPct ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group"
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-slate-100 overflow-hidden">
        {thumb && !imgErr ? (
          <img
            src={thumb} alt={course.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
            <BookOpen className="w-8 h-8 text-indigo-200" />
          </div>
        )}
        {/* Progress bar overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-indigo-500 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        {course.examTarget && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur text-[10px] font-bold rounded-md uppercase text-slate-700 shadow-sm">
            {course.examTarget}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors mb-1">
          {course.name}
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">
          {course.teacher?.fullName || "Expert Faculty"}
        </p>

        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
          <span>{pct}% done</span>
          <span>{course.progress?.completedTopics ?? 0}/{course.progress?.totalTopics ?? 0} topics</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>

        <button
          onClick={onResume}
          className="w-full py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5 border border-indigo-100/60"
        >
          <Play className="w-3 h-3 fill-current" />
          {pct > 0 ? "Continue" : "Start Learning"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StudentLearnPage() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: courses = [], isLoading: coursesLoading } = useMyCourses();
  const { data: continueLearning = [] } = useContinueLearning();

  const streak = me?.student?.streakDays ?? 0;
  const xp = me?.student?.xpPoints ?? 0;

  const ongoingCourses = courses.filter(c => (c.progress?.overallPct ?? 0) < 100);
  const completedCourses = courses.filter(c => (c.progress?.overallPct ?? 0) >= 100);

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-10">

      {/* ── Stats header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Learning</h1>
          <p className="text-slate-500 text-sm mt-1">Track your enrolled courses and pick up where you left off.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl text-sm font-bold text-orange-600">
            <Flame className="w-4 h-4 fill-current" />
            {streak} day streak
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 bg-yellow-50 border border-yellow-100 rounded-xl text-sm font-bold text-yellow-600">
            <Sparkles className="w-4 h-4 fill-current" />
            {xp.toLocaleString()} XP
          </div>
        </div>
      </header>

      {/* ── Continue Learning ── */}
      {continueLearning.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Continue Learning
          </h2>
          <div className="space-y-3">
            {continueLearning.slice(0, 3).map(item => (
              <button
                key={item.topicId}
                onClick={() => navigate(item.batchId ? `/student/courses/${item.batchId}/topics/${item.topicId}` : `/student/courses`)}
                className="w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                  <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
                    {item.topicName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.subjectName} · {item.chapterName}
                    {item.progressPct > 0 && <span className="ml-1 text-indigo-500 font-semibold">· {item.progressPct}% done</span>}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Loading ── */}
      {coursesLoading && (
        <div className="py-20 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400 font-medium">Loading your courses…</p>
        </div>
      )}

      {/* ── No courses ── */}
      {!coursesLoading && courses.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-600 text-lg mb-1">No courses yet</p>
          <p className="text-slate-400 text-sm mb-6">Browse available courses and enroll to start learning.</p>
          <button
            onClick={() => navigate("/student/courses?discover=1")}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            Discover Courses <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Ongoing courses ── */}
      {!coursesLoading && ongoingCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" /> In Progress
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{ongoingCourses.length}</span>
            </h2>
            <button
              onClick={() => navigate("/student/courses")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ongoingCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onResume={() => navigate(`/student/courses/${course.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed courses ── */}
      {!coursesLoading && completedCourses.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{completedCourses.length}</span>
          </h2>
          <div className={cn(
            "grid gap-5",
            completedCourses.length === 1 ? "grid-cols-1 max-w-xs" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {completedCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onResume={() => navigate(`/student/courses/${course.id}`)}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
