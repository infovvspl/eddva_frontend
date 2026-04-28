import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Clock, Trophy, Play, BookOpen, ArrowLeft } from "lucide-react";
import { useMyCourses, useMockTests, useStudentSessions } from "@/hooks/use-student";
import { cn } from "@/lib/utils";

export default function StudentTestsPage() {
  const navigate = useNavigate();
  const { data: courses = [], isLoading: loadingCourses } = useMyCourses();
  const { data: mockTests = [], isLoading: loadingTests } = useMockTests({ isPublished: true });
  const { data: sessions = [], isLoading: loadingSessions } = useStudentSessions();
  const [examFilter, setExamFilter] = useState<"all" | "competitive" | "academic">("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

  const isLoading = loadingCourses || loadingTests || loadingSessions;

  const enrolledBatchIds = new Set(courses.map(c => c.id));
  
  // 1. Filter by enrollment first (platform-wide vs course-specific)
  let baseTests = mockTests.filter(t => !t.batchId || enrolledBatchIds.has(t.batchId));

  // 2. Filter by selected course if specified
  if (selectedCourseId !== "all") {
    baseTests = baseTests.filter(t => t.batchId === selectedCourseId);
  }

  const filteredTests = baseTests;

  // Determine attempted status
  const attemptedTestIds = new Set(
    sessions
      .filter(s => s.status === "completed" || s.status === "submitted" || s.status === "auto_submitted" || s.status === "in_progress")
      .map(s => s.mockTestId)
  );

  const inferExamLane = (t: any) => {
    // 1. Check explicit examMode set during creation
    const rawMode = t.examMode || t.exam_mode;
    if (rawMode) {
      const mode = String(rawMode).toLowerCase();
      if (mode.includes("jee") || mode.includes("neet")) return "competitive";
      if (mode.includes("cbse") || mode.includes("acad") || mode.includes("class") || mode.includes("school") || mode.includes("board")) return "academic";
    }

    // 2. Fallback to course examTarget
    const course = courses.find((c) => c.id === t.batchId);
    if (course) {
      const target = (course.examTarget || "").toLowerCase();
      if (target.includes("jee") || target.includes("neet") || target.includes("comp")) return "competitive";
      if (
        target.includes("cbse") ||
        target.includes("board") ||
        target.includes("school") ||
        target.includes("acad") ||
        target.includes("class")
      )
        return "academic";
    }

    // 3. Fallback to title/type hints
    const hint = `${t.title || ""} ${t.type || ""}`.toLowerCase();
    if (hint.includes("compet") || hint.includes("jee") || hint.includes("neet") || hint.includes("olympiad"))
      return "competitive";
    if (
      hint.includes("acad") ||
      hint.includes("cbse") ||
      hint.includes("board") ||
      hint.includes("school") ||
      hint.includes("class") ||
      hint.includes("ncert") ||
      hint.includes("exam")
    )
      return "academic";

    return "competitive";
  };

  const counts = {
    all: filteredTests.length,
    competitive: filteredTests.filter((t) => inferExamLane(t) === "competitive").length,
    academic: filteredTests.filter((t) => inferExamLane(t) === "academic").length,
  };

  const examFilteredTests =
    examFilter === "all" ? filteredTests : filteredTests.filter((t) => inferExamLane(t) === examFilter);

  const unattemptedTests = examFilteredTests.filter((t) => !attemptedTestIds.has(t.id));
  const attemptedTests = examFilteredTests.filter((t) => attemptedTestIds.has(t.id));

  // Top priority to unattempted tests
  const sortedTests = [
    ...unattemptedTests.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()),
    ...attemptedTests.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()),
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-slate-500 font-medium">Loading tests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 pb-32">
      {/* Back */}
      <div className="mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Take a Test</h1>
            <p className="text-slate-500 text-sm mt-0.5">Attempt practice tests available for your enrolled courses.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Course Dropdown Filter */}
            <div className="relative group">
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  // Reset exam filter when course changes to avoid empty state confusion?
                  // Actually safer to keep it.
                }}
                className="appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all cursor-pointer shadow-sm hover:border-indigo-200"
              >
                <option value="all">All Courses ({courses.length})</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5 -rotate-90" />
              </div>
            </div>

            {/* Exam Lane Filters */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl h-fit border border-slate-200/50 shadow-inner">
              {([
                ["all", "All"],
                ["competitive", "Competitive"],
                ["academic", "Academic"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setExamFilter(id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    examFilter === id ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                      examFilter === id ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {counts[id]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {sortedTests.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No tests available</p>
          <p className="text-slate-400 text-sm mt-1">Check back later for new mock tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTests.map((test, i) => {
            const isAttempted = attemptedTestIds.has(test.id);
            const course = courses.find((c) => c.id === test.batchId);
            const lane = inferExamLane(test);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={test.id}
                className={cn(
                  "bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group",
                  isAttempted ? "border-slate-200" : "border-indigo-100 hover:border-indigo-300"
                )}
              >
                <div className={cn("p-5 border-b", isAttempted ? "bg-slate-50" : "bg-gradient-to-r from-indigo-50 to-blue-50")}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border",
                          lane === "competitive"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-sky-50 border-sky-200 text-sky-700"
                        )}
                      >
                        {lane}
                      </span>
                      {isAttempted ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-200 text-slate-600">
                          Attempted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-100 text-indigo-700">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                    {test.title}
                  </h3>

                  {course?.name && (
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 flex items-center gap-1.5 mt-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.name}
                    </p>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-xl">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="font-medium">{test.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-xl">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="font-medium">{test.totalMarks} marks</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/student/mock-tests/${test.id}`)}
                    className={cn(
                      "w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                      isAttempted
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                    )}
                  >
                    {isAttempted ? <>Review / Retake</> : <><Play className="w-4 h-4 fill-current" /> Start Test</>}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
