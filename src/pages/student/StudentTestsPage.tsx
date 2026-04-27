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

  const isLoading = loadingCourses || loadingTests || loadingSessions;

  const enrolledBatchIds = new Set(courses.map(c => c.id));
  
  // Filter by courses they are enrolled in
  // Allow if batchId is missing (platform-wide) or if enrolled
  const filteredTests = mockTests.filter(t => !t.batchId || enrolledBatchIds.has(t.batchId));

  // Determine attempted status
  const attemptedTestIds = new Set(
    sessions
      .filter(s => s.status === "completed" || s.status === "submitted" || s.status === "auto_submitted" || s.status === "in_progress")
      .map(s => s.mockTestId)
  );

  const inferExamLane = (t: { examMode?: string; title?: string; type?: string }) => {
    const mode = String(t.examMode || "").toLowerCase();
    const hint = `${t.title || ""} ${t.type || ""} ${mode}`.toLowerCase();
    if (hint.includes("compet") || hint.includes("jee") || hint.includes("neet") || hint.includes("olympiad")) return "competitive";
    if (hint.includes("acad") || hint.includes("cbse") || hint.includes("board") || hint.includes("school") || hint.includes("class") || hint.includes("ncert")) return "academic";
    return "competitive";
  };
  const examFilteredTests =
    examFilter === "all" ? filteredTests : filteredTests.filter((t) => inferExamLane(t) === examFilter);

  const unattemptedTests = examFilteredTests.filter(t => !attemptedTestIds.has(t.id));
  const attemptedTests = examFilteredTests.filter(t => attemptedTestIds.has(t.id));

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Take a Test</h1>
        <p className="text-slate-500 text-sm mt-0.5">Attempt practice tests available for your enrolled courses.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["all", "All"],
          ["competitive", "Competitive"],
          ["academic", "Academic (CBSE)"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setExamFilter(id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              examFilter === id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {label}
          </button>
        ))}
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
            const course = courses.find(c => c.id === test.batchId);
            
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
                <div className={cn(
                  "p-5 border-b",
                  isAttempted ? "bg-slate-50" : "bg-gradient-to-r from-indigo-50 to-blue-50"
                )}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                       {isAttempted ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-slate-200 text-slate-600">
                            Attempted
                          </span>
                       ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-indigo-100 text-indigo-700">
                            New Test
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
                    {isAttempted ? (
                      <>Review / Retake</>
                    ) : (
                      <><Play className="w-4 h-4 fill-current" /> Start Test</>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
}
