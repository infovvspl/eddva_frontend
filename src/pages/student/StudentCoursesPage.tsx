import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Play, FileText, FlaskConical, BookOpen, Search,
  ShieldCheck, Loader2, CalendarDays,
  Trophy, ClipboardList, CheckCircle2, ArrowLeft,
} from "lucide-react";
import { useMyCourses } from "@/hooks/use-student";
import { useAuthStore } from "@/lib/auth-store";
import type { MyCourse } from "@/lib/api/student";
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

const EXAM_GRADIENTS: Record<string, string> = {
  JEE:     "from-orange-400 to-red-500",
  NEET:    "from-emerald-400 to-teal-500",
  CBSE_10: "from-blue-400 to-indigo-500",
  CBSE_12: "from-violet-400 to-purple-500",
  default: "from-indigo-400 to-purple-500",
};

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

// ─── Format filter pills ─────────────────────────────────────────────────────

const FORMAT_FILTERS = [
  { value: "all",      label: "All" },
  { value: "live",     label: "🔴 Live" },
  { value: "hybrid",   label: "🔀 Hybrid" },
  { value: "recorded", label: "🎬 Recorded" },
];

import { useModuleAccess } from "@/hooks/use-module-access";

function EnrolledTabSection({
  courses, allCount, emptyIcon, emptyTitle, emptyDesc, instituteName, navigate, lightMotion,
}: {
  courses: MyCourse[]; allCount: number; emptyIcon: React.ReactNode; emptyTitle: string;
  emptyDesc: string; instituteName: string; navigate: ReturnType<typeof useNavigate>;
  lightMotion: boolean;
}) {
  const canAccessLiveLectures = useModuleAccess("live_lectures");
  const activeFilters = FORMAT_FILTERS.filter(f => {
    if (!canAccessLiveLectures && (f.value === "live" || f.value === "hybrid")) return false;
    return true;
  });
  const [fmt, setFmt] = useState("all");

  const filtered = courses.filter(c => {
    if (fmt === "all") return true;
    const mode = (c as any).deliveryMode?.toLowerCase() ?? "";
    if (fmt === "live")     return mode === "live";
    if (fmt === "hybrid")   return mode === "hybrid" || mode === "";
    if (fmt === "recorded") return mode === "recorded";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Format filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {activeFilters.map(f => (
          <button key={f.value} onClick={() => setFmt(f.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all",
              fmt === f.value
                ? "bg-indigo-600 text-white border-indigo-600 shadow"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            )}>
            {f.label}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-1">{filtered.length} of {allCount}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          {emptyIcon}
          <p className="text-slate-500 font-medium">{emptyTitle}</p>
          <p className="text-slate-400 text-sm mt-1">{emptyDesc}</p>
        </div>
      ) : (
        filtered.map(course => (
          <EnrolledCourseCard
            key={course.id}
            course={course}
            instituteName={instituteName}
            onResume={() => navigate(`/student/courses/${course.id}`)}
          />
        ))
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "ongoing" | "completed";

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const isCompactLayout = useIsCompactLayout();
  const prefersReducedMotion = useReducedMotion();
  const lightMotion = isCompactLayout || !!prefersReducedMotion;
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: courses = [], isLoading } = useMyCourses();
  const { user } = useAuthStore();
  const instituteName = user?.tenantName || "";
  const rawTab = searchParams.get("tab") as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(
    rawTab === "completed" ? "completed" : "ongoing"
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab && ["ongoing", "completed"].includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    setSearch("");
    const p = new URLSearchParams(searchParams);
    p.set("tab", tabId);
    setSearchParams(p, { replace: true });
  };

  const ongoing   = courses.filter(c => (c.progress?.overallPct ?? 0) < 100);
  const completed = courses.filter(c => (c.progress?.overallPct ?? 0) >= 100);

  const filterBySearch = (list: MyCourse[]) =>
    search ? list.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : list;

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "ongoing",   label: "Ongoing",   count: ongoing.length },
    { id: "completed", label: "Completed", count: completed.length },
  ];

  if (isLoading) return (
    <div className="py-40 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="w-full p-4 sm:p-6 pb-24 space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your enrolled courses.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search courses…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full" />
        </div>
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
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
              activeTab === tab.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500")}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={lightMotion ? undefined : { opacity: 0, y: 8 }}
          animate={lightMotion ? undefined : { opacity: 1, y: 0 }}
          exit={lightMotion ? undefined : { opacity: 0 }}
          transition={lightMotion ? undefined : { duration: 0.18 }}
        >
          {activeTab === "ongoing" && (
            <EnrolledTabSection
              courses={filterBySearch(ongoing)} allCount={ongoing.length}
              emptyIcon={<BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />}
              emptyTitle="No ongoing courses"
              emptyDesc={courses.length === 0 ? "Enroll in a course to start learning." : "All your courses are completed!"}
              instituteName={instituteName} navigate={navigate} lightMotion={lightMotion}
            />
          )}

          {activeTab === "completed" && (
            <EnrolledTabSection
              courses={filterBySearch(completed)} allCount={completed.length}
              emptyIcon={<CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />}
              emptyTitle="No completed courses yet"
              emptyDesc="Keep learning — completed courses will appear here."
              instituteName={instituteName} navigate={navigate} lightMotion={lightMotion}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
