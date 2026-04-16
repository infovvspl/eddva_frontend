import { useNavigate } from "react-router-dom";
import {
  BookOpen, Play, Loader2, Flame, Star, Trophy,
  Clock, ChevronRight, GraduationCap, BarChart3, Zap, CalendarDays,
} from "lucide-react";
import { useStudentMe, useMyCourses, useDiscoverBatches, useStudentDashboard } from "@/hooks/use-student";
import { cn } from "@/lib/utils";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL ?? "").origin; } catch { return ""; }
})();

function resolveUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

function fmtDate(d?: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return null; }
}

const EXAM_COLORS: Record<string, string> = {
  jee:     "from-orange-400 to-red-500",
  neet:    "from-emerald-400 to-teal-500",
  cbse_10: "from-blue-400 to-indigo-500",
  cbse_12: "from-violet-400 to-purple-500",
  default: "from-indigo-400 to-purple-500",
};

function examGradient(examTarget?: string) {
  return EXAM_COLORS[(examTarget ?? "").toLowerCase()] ?? EXAM_COLORS.default;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: courses = [], isLoading: coursesLoading } = useMyCourses();
  const { data: discoverData } = useDiscoverBatches(true);
  const { data: dash } = useStudentDashboard();

  const firstName   = me?.fullName?.split(" ")[0] || "Student";
  const avatar      = resolveUrl(me?.profilePictureUrl);
  const streak      = me?.student?.streakDays ?? 0;
  const xp          = me?.student?.xpPoints ?? 0;
  const tier        = me?.student?.currentEloTier ?? "Iron";
  const todayPlan   = (dash as any)?.todayPlan ?? [];
  const weakTopics  = (dash as any)?.weakTopics ?? [];

  // Active exam target — updated preference takes effect immediately
  const activeExamTarget = me?.student?.examTarget || discoverData?.studentPreferences?.examTarget || "";

  // Compute overall progress across enrolled courses
  const avgProgress =
    courses.length > 0
      ? Math.round(courses.reduce((s, c) => s + (c.progress?.overallPct ?? 0), 0) / courses.length)
      : 0;

  // Discover batches filtered by the student's exam preference
  const discoverBatches = (discoverData?.availableBatches ?? [])
    .filter(b => !activeExamTarget || (b.examTarget ?? "").toLowerCase() === activeExamTarget.toLowerCase())
    .slice(0, 3);

  if (meLoading) {
    return (
      <div className="py-40 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-300/20 blur-3xl rounded-full pointer-events-none" />

      <div className="grid grid-cols-12 gap-6 relative z-10 w-full">

        {/* ── LEFT MAIN ── */}
        <div className="col-span-12 lg:col-span-9 space-y-6">

          {/* HERO BANNER */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-3xl p-8 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5" />
            <div className="relative z-10 space-y-3 max-w-sm">
              <h1 className="text-3xl font-bold">
                Welcome Back, {firstName}! 👋
              </h1>
              {courses.length > 0 ? (
                <>
                  <p className="text-indigo-100 text-sm">
                    {avgProgress > 0
                      ? `You've completed ${avgProgress}% of your enrolled courses`
                      : "Start learning to track your progress"}
                  </p>
                  <div className="w-64 h-2 bg-indigo-400/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-indigo-100 text-sm">
                  Discover and enroll in courses to start your learning journey.
                </p>
              )}
              <button
                onClick={() => navigate(courses.length > 0 ? "/student/courses" : "/student/courses?discover=1")}
                className="mt-2 px-6 py-2.5 bg-white text-indigo-600 font-semibold rounded-full shadow-sm hover:scale-105 transition-transform text-sm"
              >
                {courses.length > 0 ? "Continue Lessons" : "Browse Courses"}
              </button>
            </div>
            <div className="hidden md:block relative z-10 w-36 h-36 mr-8">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
              <img
                src="https://illustrations.popsy.co/amber/student-going-to-school.svg"
                alt="Student"
                className="w-full h-full object-contain relative z-10"
              />
            </div>
          </div>

          {/* STAT CHIPS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{streak}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Day Streak</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{xp.toLocaleString()}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">XP Points</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 capitalize">{tier}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ELO Tier</p>
              </div>
            </div>
          </div>

          {/* NEW / AVAILABLE COURSES */}
          {discoverBatches.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">
                  {courses.length === 0 ? "Start Learning" : "More Courses"}
                </h2>
                <button
                  onClick={() => navigate("/student/courses?discover=1")}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {discoverBatches.map((batch) => {
                  const thumb = resolveUrl(batch.thumbnailUrl);
                  const grad = examGradient(batch.examTarget);
                  return (
                    <div
                      key={batch.id}
                      onClick={() => navigate("/student/courses?discover=1")}
                      className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer overflow-hidden group flex flex-col"
                    >
                      <div className={cn("w-full h-28 flex items-center justify-center relative overflow-hidden")}>
                        {thumb ? (
                          <img src={thumb} alt={batch.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
                            <BookOpen className="w-9 h-9 text-white/50" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          {batch.isPaid && batch.feeAmount ? (
                            <span className="px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-sm">₹{batch.feeAmount.toLocaleString()}</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm">FREE</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">{batch.name}</h3>
                        {(batch.startDate || batch.endDate) && (
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                            <CalendarDays className="w-3 h-3 text-indigo-400 shrink-0" />
                            {fmtDate(batch.startDate) ?? "—"} → {fmtDate(batch.endDate) ?? "—"}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-auto pt-3 text-xs font-semibold text-slate-400">
                          <span>{batch.examTarget?.toUpperCase()}</span>
                          <div className="flex items-center gap-1">
                            <span>{(batch.studentCount ?? 0).toLocaleString()} enrolled</span>
                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center ml-1 group-hover:bg-indigo-600 transition-colors">
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* MY COURSES TABLE */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">My Courses</h2>
            {coursesLoading ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-200 p-10 text-center">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-500">No enrolled courses yet</p>
                <p className="text-sm text-slate-400 mt-1">Browse courses above to get started.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Course</th>
                      <th className="px-6 py-4 font-semibold">Target</th>
                      <th className="px-6 py-4 font-semibold">Lectures</th>
                      <th className="px-6 py-4 font-semibold text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {courses.map((course) => {
                      const pct = course.progress?.overallPct ?? 0;
                      const thumb = resolveUrl(course.thumbnailUrl);
                      const grad = examGradient(course.examTarget);
                      return (
                        <tr
                          key={course.id}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/student/courses/${course.id}`)}
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl overflow-hidden shrink-0", !thumb && `bg-gradient-to-br ${grad}`, "flex items-center justify-center")}>
                              {thumb ? (
                                <img src={thumb} alt={course.name} className="w-full h-full object-cover" />
                              ) : (
                                <BookOpen className="w-5 h-5 text-white/70" />
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800 line-clamp-1">{course.name}</span>
                              {(course.startDate || course.endDate) && (
                                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                  <CalendarDays className="w-3 h-3 text-indigo-400 shrink-0" />
                                  {fmtDate(course.startDate) ?? "—"} → {fmtDate(course.endDate) ?? "—"}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[11px] font-bold uppercase">{course.examTarget}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {course.progress?.completedLectures ?? 0} / {course.progress?.totalLectures ?? 0}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="font-bold text-slate-700 text-xs w-8">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50">
                  <button
                    onClick={() => navigate("/student/courses")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    View all courses <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="col-span-12 lg:col-span-3 space-y-5">

          {/* PROFILE CARD */}
          <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-full blur-2xl pointer-events-none" />
            {avatar ? (
              <img src={avatar} alt={me?.fullName} className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-indigo-100 object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-indigo-100 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-xl">
                {(me?.fullName?.[0] ?? "S").toUpperCase()}
              </div>
            )}
            <h3 className="font-semibold text-slate-900">{me?.fullName || "Student"}</h3>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{me?.student?.examTarget || "Student"}</p>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                <p className="text-base font-black text-orange-500">{streak}</p>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wide">Streak</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-2.5 text-center">
                <p className="text-base font-black text-indigo-600">{xp.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">XP</p>
              </div>
            </div>
          </div>

          {/* WEAK TOPICS */}
          {weakTopics.length > 0 && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm text-slate-800">Focus Areas</h3>
              </div>
              <div className="space-y-2">
                {weakTopics.slice(0, 4).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium line-clamp-1 flex-1 mr-2">
                      {t.topic?.name ?? t.topicName ?? "Topic"}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-bold shrink-0",
                      t.accuracy < 40 ? "bg-red-100 text-red-600" :
                      t.accuracy < 65 ? "bg-amber-100 text-amber-600" :
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {t.accuracy ?? 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TODAY'S PLAN */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 opacity-80" />
              <h3 className="font-semibold text-sm">Today's Plan</h3>
            </div>
            {todayPlan.length === 0 ? (
              <p className="text-indigo-200 text-xs">No tasks scheduled for today.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {todayPlan.slice(0, 4).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-indigo-100">
                    {item.type === "lecture" ? (
                      <Play className="w-3.5 h-3.5 shrink-0" />
                    ) : item.type === "quiz" ? (
                      <Star className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="line-clamp-1">{item.topicName ?? item.title ?? "Study session"}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate("/student/study-plan")}
              className="mt-4 w-full text-center text-xs font-bold text-indigo-200 hover:text-white flex items-center justify-center gap-1 transition-colors"
            >
              Full Study Plan <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
