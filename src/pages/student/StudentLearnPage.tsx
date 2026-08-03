import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, Search, ShieldCheck, Loader2, CalendarDays,
  Users, Sparkles, Zap, CheckCircle2, BookMarked, Play, Filter, ChevronDown,
} from "lucide-react";
import { useDiscoverBatches, useStudentMe, useMyCourses } from "@/hooks/use-student";
import type { PublicBatch } from "@/lib/api/student";
import { cn } from "@/lib/utils";
import { getApiOrigin } from "@/lib/api-config";

const _API_ORIGIN = getApiOrigin();

function resolveUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${_API_ORIGIN}${url}`;
}

function fmtDate(d?: string | null) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return null; }
}

const EXAM_FILTERS = [
  { label: "All",     value: "all",     color: "from-indigo-500 to-purple-600" },
  { label: "JEE",     value: "JEE",     color: "from-orange-500 to-red-500"    },
  { label: "NEET",    value: "NEET",    color: "from-emerald-500 to-teal-500"  },
  { label: "CBSE 10", value: "CBSE_10", color: "from-blue-500 to-indigo-500"   },
  { label: "CBSE 12", value: "CBSE_12", color: "from-violet-500 to-purple-500" },
];

const EXAM_GRADIENTS: Record<string, string> = {
  JEE:     "from-orange-400 to-red-500",
  NEET:    "from-emerald-400 to-teal-500",
  CBSE_10: "from-blue-400 to-indigo-500",
  CBSE_12: "from-violet-400 to-purple-500",
  default: "from-indigo-400 to-purple-500",
};

export default function StudentLearnPage() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: discoverData, isLoading } = useDiscoverBatches();
  const { data: myCourses = [] } = useMyCourses();

  const batches: PublicBatch[] = discoverData?.availableBatches ?? [];
  const enrolledIds = new Set(myCourses.map(c => c.id));

  const [examFilter, setExamFilter] = useState("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
    <div className="w-full p-4 sm:p-6 pb-24 space-y-6">
      {/* Header Card */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="text-slate-500 text-sm mt-0.5">Browse courses available from your institute.</p>
        </div>
        
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          
          {/* Mobile View: Search and Filter Button Row */}
          <div className="flex sm:hidden items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className={`flex items-center justify-center w-10 h-10 border rounded-xl shadow-sm transition-all active:scale-95 shrink-0 ${
                mobileFiltersOpen 
                  ? "bg-indigo-50 border-indigo-300 text-indigo-600" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile View Dropdown container */}
          {mobileFiltersOpen && (
            <div className="block sm:hidden w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-2 mt-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Filter by Category</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAM_FILTERS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setExamFilter(f.value);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                      examFilter === f.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop View: Search */}
          <div className="hidden sm:block relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full"
            />
          </div>

          {/* Desktop View: Normal Filter Badges */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            {EXAM_FILTERS.map(f => (
              <button key={f.value} onClick={() => setExamFilter(f.value)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all",
                  examFilter === f.value
                    ? "bg-indigo-600 text-white border-indigo-600 shadow"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                )}>
                {f.label}
              </button>
            ))}
          </div>
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {filtered.map((batch, i) => {
            const thumb = resolveUrl(batch.thumbnailUrl);
            const gradient = EXAM_GRADIENTS[batch.examTarget] ?? EXAM_GRADIENTS.default;
            const isEnrolled = enrolledIds.has(batch.id);

            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.24 }}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 group"
              >
                {/* Thumbnail */}
                <div className="w-full sm:w-44 h-32 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                  {thumb ? (
                    <img src={thumb} alt={batch.name}
                      loading="lazy" decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <BookOpen className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 bg-white/90 backdrop-blur text-[10px] font-bold rounded-lg uppercase text-slate-700 shadow-sm">
                      {batch.examTarget}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {batch.name}
                    </h3>
                    <div className="shrink-0">
                      {isEnrolled ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Enrolled
                        </span>
                      ) : batch.isPaid && batch.feeAmount ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold shadow-sm border border-amber-200">
                          ₹{batch.feeAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold shadow-sm border border-emerald-100">
                          FREE
                        </span>
                      )}
                    </div>
                  </div>

                  {batch.teacher && (
                    <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {batch.teacher.fullName}
                    </p>
                  )}

                  {batch.description && (
                    <div className="mb-2">
                      <p className={cn("text-xs text-slate-500 leading-relaxed transition-all", !expandedDescIds[batch.id] && "line-clamp-1")}>
                        {batch.description}
                      </p>
                      {batch.description.length > 100 && (
                        <button
                          onClick={e => { e.stopPropagation(); setExpandedDescIds(p => ({ ...p, [batch.id]: !p[batch.id] })); }}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 mt-0.5">
                          {expandedDescIds[batch.id] ? "See less" : "See more"}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                    {(batch.startDate || batch.endDate) && (
                      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 shrink-0 text-indigo-400" />
                        {fmtDate(batch.startDate) ?? "—"} → {fmtDate(batch.endDate) ?? "—"}
                      </p>
                    )}
                    {(batch.studentCount ?? 0) > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{batch.studentCount!.toLocaleString()} enrolled</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleView(batch)}
                      className={cn(
                        "px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all",
                        isEnrolled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      )}>
                      {isEnrolled
                        ? <><Play className="w-3 h-3 fill-current" /> Continue Learning</>
                        : batch.isPaid
                          ? <><Zap className="w-3 h-3" /> View · ₹{batch.feeAmount?.toLocaleString()}</>
                          : <><Sparkles className="w-3 h-3" /> View Course</>
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
