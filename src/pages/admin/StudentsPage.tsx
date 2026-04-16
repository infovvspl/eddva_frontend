import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Users, Search, ChevronRight, ChevronDown,
  BookOpen, GraduationCap,
} from "lucide-react";
import { useBatches, useBatchRoster } from "@/hooks/use-admin";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Shared thumbnail (mirrors AdminDashboard) ────────────────────────────────

const EXAM_STYLES: Record<string, { from: string; to: string; badge: string }> = {
  jee:     { from: "#1D4ED8", to: "#4F46E5", badge: "JEE"  },
  neet:    { from: "#059669", to: "#0D9488", badge: "NEET" },
  both:    { from: "#7C3AED", to: "#C026D3", badge: "ALL"  },
  default: { from: "#0F172A", to: "#334155", badge: "—"    },
};

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").origin; }
  catch { return "http://localhost:3000"; }
})();
function resolveMediaUrl(url?: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${_API_ORIGIN}${url}`;
}

function CourseThumbnail({ name, examTarget, imageUrl, className = "" }: {
  name: string; examTarget: string; imageUrl?: string; className?: string;
}) {
  const [imgError, setImgError] = React.useState(false);
  const style = EXAM_STYLES[examTarget?.toLowerCase()] ?? EXAM_STYLES.default;
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
  const resolvedUrl = resolveMediaUrl(imageUrl);
  if (resolvedUrl && !imgError) {
    return (
      <div className={cn("rounded-2xl overflow-hidden shrink-0", className)}>
        <img src={resolvedUrl} alt={name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  return (
    <div
      className={cn("rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shrink-0", className)}
      style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
      <span className="text-white font-black text-xl relative z-10 leading-none">{initials}</span>
      <span className="text-white/60 text-[9px] font-black uppercase tracking-widest mt-1 relative z-10">{style.badge}</span>
    </div>
  );
}

// ─── Per-batch roster hook ────────────────────────────────────────────────────

function useBatchRosterSafe(batchId: string) {
  const { data, isLoading } = useBatchRoster(batchId);
  const list: any[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if ((data as any).data) return (data as any).data;
    if ((data as any).items) return (data as any).items;
    return [];
  }, [data]);
  return { list, isLoading };
}

// ─── Aggregate all students ───────────────────────────────────────────────────

function useAllStudents() {
  const { data: batches, isLoading: batchesLoading } = useBatches();
  const batchList: any[] = Array.isArray(batches) ? batches : [];

  const b0 = useBatchRosterSafe(batchList[0]?.id ?? "");
  const b1 = useBatchRosterSafe(batchList[1]?.id ?? "");
  const b2 = useBatchRosterSafe(batchList[2]?.id ?? "");
  const b3 = useBatchRosterSafe(batchList[3]?.id ?? "");
  const b4 = useBatchRosterSafe(batchList[4]?.id ?? "");
  const b5 = useBatchRosterSafe(batchList[5]?.id ?? "");
  const b6 = useBatchRosterSafe(batchList[6]?.id ?? "");
  const b7 = useBatchRosterSafe(batchList[7]?.id ?? "");
  const b8 = useBatchRosterSafe(batchList[8]?.id ?? "");
  const b9 = useBatchRosterSafe(batchList[9]?.id ?? "");

  const rosters = [b0, b1, b2, b3, b4, b5, b6, b7, b8, b9];
  const isLoading = batchesLoading || rosters.slice(0, batchList.length).some(r => r.isLoading);

  const courseRosters = useMemo(() =>
    batchList.map((batch, i) => ({ batch, students: rosters[i]?.list ?? [] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [batchList, ...rosters.map(r => r.list)]
  );

  const allStudents = useMemo(() => {
    const seen = new Set<string>();
    const result: any[] = [];
    courseRosters.forEach(({ batch, students }) => {
      students.forEach(s => {
        const id = s.studentId || s.id || s.userId || s.email;
        if (id && !seen.has(id)) {
          seen.add(id);
          result.push({ ...s, _batchName: batch.name, _batchId: batch.id });
        }
      });
    });
    return result;
  }, [courseRosters]);

  return { allStudents, courseRosters, isLoading, batchList };
}

// ─── Course row (expandable) ──────────────────────────────────────────────────

function CourseRow({ course, students, index, onStudentClick }: {
  course: any; students: any[]; index: number; onStudentClick: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const enrolled = students.length > 0 ? students.length : (course.studentCount ?? 0);
  const style = EXAM_STYLES[course.examTarget?.toLowerCase()] ?? EXAM_STYLES.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
    >
      {/* Course header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <CourseThumbnail name={course.name} examTarget={course.examTarget} imageUrl={course.thumbnailUrl} className="w-14 h-14" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-slate-900 truncate">{course.name}</p>
            <span className={cn(
              "shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
              course.status === "active"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-slate-50 text-slate-400 border-slate-100"
            )}>
              {course.status}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold uppercase mb-2">
            {course.examTarget?.toUpperCase()} · Class {course.class}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-slate-500 shrink-0">{enrolled} enrolled</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xl font-black text-slate-900">{enrolled}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled</p>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-gray-600 transition-transform duration-300",
            expanded && "rotate-180"
          )} />
        </div>
      </button>

      {/* Expanded student list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100">
              {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                  <GraduationCap className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">No students enrolled yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {students.map((s: any, i) => {
                    const name = s.name || s.fullName || s.studentName || "—";
                    const phone = s.phone || s.phoneNumber || "—";
                    const email = s.email || "";
                    const sid = s.studentId || s.id;
                    return (
                      <button
                        key={sid ?? i}
                        onClick={() => sid && onStudentClick(sid)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">{name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{phone}{email ? ` · ${email}` : ""}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400 shrink-0">
                          <span>🔥 {s.streakDays ?? s.currentStreak ?? 0}d streak</span>
                          {s.lastLoginAt && (
                            <span>Last seen {new Date(s.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-blue-500 transition-colors ml-2" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "courses" | "all";

const StudentsPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("courses");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const limit = 20;

  const { allStudents, courseRosters, isLoading, batchList } = useAllStudents();

  const filtered = useMemo(() => {
    if (!search) return allStudents;
    const q = search.toLowerCase();
    return allStudents.filter(s =>
      (s.name || s.fullName || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || s.phoneNumber || "").includes(q)
    );
  }, [allStudents, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalEnrolled = allStudents.length;

  return (
    <div className="max-w-[1200px] mx-auto p-6 lg:p-8 space-y-6 pb-20">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-slate-900">Students</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalEnrolled} student{totalEnrolled !== 1 ? "s" : ""} across {batchList.length} course{batchList.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-100 rounded-2xl p-1 gap-1">
          {(["courses", "all"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                viewMode === v
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {v === "courses" ? "By Course" : "All Students"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── By Course view ── */}
      {viewMode === "courses" && (
        <div className="space-y-4">
          {batchList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200">
              <BookOpen className="w-10 h-10 text-gray-800 mb-3" />
              <p className="text-sm font-bold text-slate-400">No courses yet</p>
              <button onClick={() => navigate("/admin/batches")}
                className="mt-4 text-xs font-black text-blue-600 hover:underline">
                Create your first course →
              </button>
            </div>
          ) : (
            courseRosters.map(({ batch, students }, i) => (
              <CourseRow
                key={batch.id}
                course={batch}
                students={students}
                index={i}
                onStudentClick={(id) => navigate(`/admin/students/${id}`)}
              />
            ))
          )}
        </div>
      )}

      {/* ── All Students view ── */}
      {viewMode === "all" && (
        <div className="space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by name, email or phone…"
                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <button type="submit"
              className="px-5 h-11 bg-white text-gray-900 text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-slate-700 transition-colors">
              Search
            </button>
          </form>

          {paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Users className="w-12 h-12 mb-3" />
              <p className="text-sm font-bold text-slate-400">
                {search ? "No students match your search" : "No students found"}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Name</th>
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden sm:table-cell">Phone / Email</th>
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden md:table-cell">Course</th>
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden lg:table-cell">Streak</th>
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden lg:table-cell">Last Active</th>
                      <th className="w-8 p-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((s: any, i) => {
                      const name = s.name || s.fullName || s.studentName || "—";
                      const phone = s.phone || s.phoneNumber || "—";
                      const email = s.email || "";
                      const sid = s.studentId || s.id || i;
                      const batchName = s._batchName ?? "";
                      const batchId = s._batchId ?? "";
                      const bStyle = EXAM_STYLES[
                        batchList.find(b => b.id === batchId)?.examTarget?.toLowerCase()
                      ] ?? EXAM_STYLES.default;
                      return (
                        <tr
                          key={sid}
                          onClick={() => typeof sid === "string" && navigate(`/admin/students/${sid}`)}
                          className="border-b border-slate-50 last:border-0 hover:bg-blue-50/40 transition-colors cursor-pointer group"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                                style={{ background: `linear-gradient(135deg, ${bStyle.from}, ${bStyle.to})` }}
                              >
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{name}</span>
                            </div>
                          </td>
                          <td className="p-4 hidden sm:table-cell">
                            <p className="text-sm text-slate-600">{phone}</p>
                            {email && <p className="text-xs text-slate-400">{email}</p>}
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            {batchName && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: `${bStyle.from}15`, color: bStyle.from }}>
                                {batchName}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700 hidden lg:table-cell">
                            🔥 {s.streakDays ?? s.currentStreak ?? 0}d
                          </td>
                          <td className="p-4 text-sm text-slate-400 hidden lg:table-cell">
                            {s.lastLoginAt
                              ? new Date(s.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                              : "Never"}
                          </td>
                          <td className="p-4">
                            <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-blue-500 transition-colors" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm text-slate-400">{filtered.length} students total</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                      className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:border-slate-300 transition-colors">
                      Prev
                    </button>
                    <span className="px-4 py-2 text-xs font-bold text-slate-400">
                      {page} / {totalPages}
                    </span>
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                      className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:border-slate-300 transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
