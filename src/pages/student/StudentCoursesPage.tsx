import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Play, FileText, FlaskConical, BookOpen, Search,
  ShieldCheck, Loader2, CalendarDays,
  Users, Sparkles, Trophy, Zap, ClipboardList,
  CheckCircle2, BookMarked, ArrowLeft,
} from "lucide-react";
import { useMyCourses, useDiscoverBatches, useStudentMe } from "@/hooks/use-student";
import { useAuthStore } from "@/lib/auth-store";
import type { MyCourse } from "@/lib/api/student";
import type { PublicBatch } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { getApiOrigin } from "@/lib/api-config";
import { useIsCompactLayout } from "@/hooks/use-mobile";

const _API_ORIGIN = getApiOrigin();

function resolveUrl(url?: string | null): string | undefined {
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

const EXAM_FILTERS = [
  { label: "All",      value: "all",     color: "from-indigo-500 to-purple-600" },
  { label: "JEE",      value: "JEE",     color: "from-orange-500 to-red-500" },
  { label: "NEET",     value: "NEET",    color: "from-emerald-500 to-teal-500" },
  { label: "CBSE 10",  value: "CBSE_10", color: "from-blue-500 to-indigo-500" },
  { label: "CBSE 12",  value: "CBSE_12", color: "from-violet-500 to-purple-500" },
];

const EXAM_GRADIENTS: Record<string, string> = {
  JEE:     "from-orange-400 to-red-500",
  NEET:    "from-emerald-400 to-teal-500",
  CBSE_10: "from-blue-400 to-indigo-500",
  CBSE_12: "from-violet-400 to-purple-500",
  default: "from-indigo-400 to-purple-500",
};

// ─── All Courses Tab ──────────────────────────────────────────────────────────

function AllCoursesTab({ enrolledIds, lightMotion }: { enrolledIds: Set<string>; lightMotion: boolean }) {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: discoverData, isLoading } = useDiscoverBatches();
  const batches: PublicBatch[] = discoverData?.availableBatches ?? [];

  const [examFilter, setExamFilter] = useState("all");
  const [search, setSearch] = useState("");
  const prefApplied = useRef(false);
  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (prefApplied.current || !me?.student?.examTarget) return;
    const et = me.student.examTarget.toUpperCase().replace(/-/g, "_");
    if (EXAM_FILTERS.some(f => f.value === et)) setExamFilter(et);
    prefApplied.current = true;
  }, [me?.student?.examTarget]);

  const filtered = batches.filter(b => {
    const bTarget = (b.examTarget ?? "").toUpperCase().replace(/-/g, "_");
    if (examFilter !== "all" && bTarget !== examFilter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !(b.examTarget ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleView = (batch: PublicBatch) => {
    import("@/lib/api/client").then(({ apiClient }) => {
      apiClient.post(`/batches/${batch.id}/view`).catch(() => {});
    });
    navigate(`/student/courses/${batch.id}`, { state: { preview: batch } });
  };

  return (
    <div className="space-y-6">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {EXAM_FILTERS.map(f => (
            <button key={f.value} onClick={() => setExamFilter(f.value)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all border",
                examFilter === f.value
                  ? `bg-gradient-to-r ${f.color} text-white border-transparent shadow`
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-600">{filtered.length}</span> course{filtered.length !== 1 ? "s" : ""}
          {examFilter !== "all" ? ` · ${examFilter}` : ""}
          {search ? ` matching "${search}"` : ""}
        </p>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-slate-500 font-medium">Loading courses…</p>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
            <BookMarked className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-600">No courses found</p>
          <p className="text-slate-400 text-sm mt-1">Try a different exam target or clear the search</p>
          <button onClick={() => { setExamFilter("all"); setSearch(""); }}
            className="mt-4 px-5 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl text-sm hover:bg-indigo-100 transition-colors">
            Clear filters
          </button>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <motion.div initial={lightMotion ? undefined : { opacity: 0 }} animate={lightMotion ? undefined : { opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((batch, i) => {
            const thumb = resolveUrl(batch.thumbnailUrl);
            const gradient = EXAM_GRADIENTS[batch.examTarget] ?? EXAM_GRADIENTS.default;
            const isEnrolled = enrolledIds.has(batch.id);

            return (
              <motion.div
                key={batch.id}
                initial={lightMotion ? undefined : { opacity: 0, y: 14 }}
                animate={lightMotion ? undefined : { opacity: 1, y: 0 }}
                transition={lightMotion ? undefined : { delay: i * 0.03, duration: 0.24 }}
                className={cn(
                  "bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 overflow-hidden group flex flex-col",
                  lightMotion ? "hover:shadow-sm" : "hover:shadow-lg hover:border-indigo-100"
                )}
              >
                <div className="relative h-44 overflow-hidden shrink-0">
                  {thumb ? (
                    <img src={thumb} alt={batch.name}
                      loading="lazy"
                      decoding="async"
                      className={cn("w-full h-full object-cover transition-transform duration-500", lightMotion ? "" : "group-hover:scale-105")}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <BookOpen className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 uppercase tracking-wide shadow-sm",
                      lightMotion ? "bg-white" : "bg-white/90 backdrop-blur-sm"
                    )}>
                      {batch.examTarget}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-1.5 items-center">
                    {isEnrolled && (
                      <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Enrolled
                      </span>
                    )}
                    {!isEnrolled && (
                      batch.isPaid && batch.feeAmount ? (
                        <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-sm">
                          ₹{batch.feeAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-white/90 text-emerald-700 rounded-lg text-[10px] font-bold shadow-sm">
                          FREE
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                    {batch.name}
                  </h3>
                  {batch.teacher && (
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {batch.teacher.fullName}
                    </p>
                  )}
                  {batch.description && (
                    <div className="mb-2">
                      <p className={cn("text-xs text-slate-500 leading-relaxed transition-all", !expandedDescIds[batch.id] && "line-clamp-2")}>
                        {batch.description}
                      </p>
                      {batch.description.length > 100 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedDescIds(p => ({ ...p, [batch.id]: !p[batch.id] })); }}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 mt-0.5"
                        >
                          {expandedDescIds[batch.id] ? "See less" : "See more"}
                        </button>
                      )}
                    </div>
                  )}
                  {(batch.startDate || batch.endDate) && (
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-2">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                      {fmtDate(batch.startDate) ?? "—"} → {fmtDate(batch.endDate) ?? "—"}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mb-4 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{(batch.studentCount ?? 0).toLocaleString()} enrolled</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <button onClick={() => handleView(batch)}
                      className={cn(
                        "w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                        isEnrolled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5 hover:shadow-indigo-500/30 hover:shadow-lg"
                      )}>
                      {isEnrolled
                        ? <><Play className="w-4 h-4 fill-current" /> Continue Learning</>
                        : batch.isPaid
                          ? <><Zap className="w-4 h-4" /> View · ₹{batch.feeAmount?.toLocaleString()}</>
                          : <><Sparkles className="w-4 h-4" /> View Course</>
                      }
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

// ─── Enrolled course card ─────────────────────────────────────────────────────

function EnrolledCourseCard({ course, onResume, instituteName }: { course: MyCourse; onResume: () => void; instituteName?: string }) {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);
  const pct = course.progress?.overallPct ?? 0;
  const thumb = resolveUrl(course.thumbnailUrl);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 group">
      <div className="w-full sm:w-44 h-32 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
        {thumb && !imgErr ? (
          <img src={thumb} alt={course.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)} />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${EXAM_GRADIENTS[course.examTarget] ?? EXAM_GRADIENTS.default}`}>
            <BookOpen className="w-8 h-8 text-white/50" />
          </div>
        )}
        {course.examTarget && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur text-[10px] font-bold rounded-lg uppercase text-slate-700 shadow-sm">
            {course.examTarget}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-0.5">{course.name}</h3>
        <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {instituteName || course.teacher?.fullName || "Institute"}
        </p>
        {(course.startDate || course.endDate) && (
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-2">
            <CalendarDays className="w-3 h-3 shrink-0 text-indigo-400" />
            {fmtDate(course.startDate) ?? "—"} → {fmtDate(course.endDate) ?? "—"}
          </p>
        )}

        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">{pct}% complete</span>
            <span className="text-slate-400">
              {(course.progress?.totalTopics ?? 0) > 0
                ? `${course.progress?.completedTopics ?? 0}/${course.progress?.totalTopics} topics`
                : `${course.progress?.completedLectures ?? 0}/${course.progress?.totalLectures ?? 0} lectures`}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-1000 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onResume}
            className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
            <Play className="w-3 h-3 fill-current" /> Resume
          </button>
          <button onClick={() => navigate(`/student/courses/${course.id}?tab=material`)}
            className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-teal-600 rounded-xl hover:bg-teal-50 transition-colors flex items-center gap-1">
            <FileText className="w-3 h-3" /> Notes
          </button>
          <button onClick={() => navigate(`/student/courses/${course.id}?tab=mock_test`)}
            className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1">
            <FlaskConical className="w-3 h-3" /> Test
          </button>
          <button onClick={() => navigate(`/student/courses/${course.id}?tab=pyq`)}
            className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-violet-600 rounded-xl hover:bg-violet-50 transition-colors flex items-center gap-1">
            <Trophy className="w-3 h-3" /> PYQ
          </button>
          <button onClick={() => navigate(`/student/courses/${course.id}?tab=dpp`)}
            className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-1">
            <ClipboardList className="w-3 h-3" /> DPP
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "courses" | "ongoing" | "completed";

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const isCompactLayout = useIsCompactLayout();
  const prefersReducedMotion = useReducedMotion();
  const lightMotion = isCompactLayout || !!prefersReducedMotion;
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: courses = [], isLoading } = useMyCourses();
  const { user } = useAuthStore();
  const instituteName = user?.tenantName || "";
  const hasActiveTab = !!searchParams.get("tab");
  const defaultTab = hasActiveTab ? (searchParams.get("tab") as Tab) : "courses";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab && ["courses", "ongoing", "completed"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    setSearch("");
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabId);
    setSearchParams(newParams, { replace: true });
  };

  const enrolledIds = new Set(courses.map(c => c.id));

  const ongoing   = courses.filter(c => (c.progress?.overallPct ?? 0) < 100);
  const completed = courses.filter(c => (c.progress?.overallPct ?? 0) >= 100);

  const filterBySearch = (list: MyCourse[]) =>
    search ? list.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : list;

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "courses",   label: "Courses" },
    { id: "ongoing",   label: "Ongoing",   count: ongoing.length },
    { id: "completed", label: "Completed", count: completed.length },
  ];

  if (isLoading) return (
    <div className="py-40 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24 space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-500 text-sm mt-0.5">Browse all courses or track your enrolled ones.</p>
        </div>
        {activeTab !== "courses" && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search enrolled courses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}>
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                activeTab === tab.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={lightMotion ? undefined : { opacity: 0, y: 8 }}
          animate={lightMotion ? undefined : { opacity: 1, y: 0 }}
          exit={lightMotion ? undefined : { opacity: 0 }}
          transition={lightMotion ? undefined : { duration: 0.18 }}
        >

          {/* ── All Courses ── */}
          {activeTab === "courses" && (
            <AllCoursesTab enrolledIds={enrolledIds} lightMotion={lightMotion} />
          )}

          {/* ── Ongoing ── */}
          {activeTab === "ongoing" && (
            <div className="space-y-4">
              {filterBySearch(ongoing).length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No ongoing courses</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {courses.length === 0
                      ? "Browse the Courses tab to find and enroll in a course."
                      : "All your courses are completed!"}
                  </p>
                  <button onClick={() => setActiveTab("courses")}
                    className="mt-4 px-5 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl text-sm hover:bg-indigo-100 transition-colors">
                    Browse Courses
                  </button>
                </div>
              ) : (
                filterBySearch(ongoing).map(course => (
                  <EnrolledCourseCard
                    key={course.id}
                    course={course}
                    instituteName={instituteName}
                    onResume={() => navigate(`/student/courses/${course.id}`)}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Completed ── */}
          {activeTab === "completed" && (
            <div className="space-y-4">
              {filterBySearch(completed).length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No completed courses yet</p>
                  <p className="text-slate-400 text-sm mt-1">Keep learning — completed courses will appear here.</p>
                </div>
              ) : (
                filterBySearch(completed).map(course => (
                  <EnrolledCourseCard
                    key={course.id}
                    course={course}
                    instituteName={instituteName}
                    onResume={() => navigate(`/student/courses/${course.id}`)}
                  />
                ))
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
