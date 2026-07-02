import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, Search, ShieldCheck, Loader2, CalendarDays,
  Users, Sparkles, Zap, CheckCircle2, BookMarked, Play,
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
        <p className="text-slate-500 text-sm mt-0.5">Browse courses available from your institute.</p>
      </div>

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
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
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 overflow-hidden group flex flex-col"
              >
                <div className="relative h-44 overflow-hidden shrink-0">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-slate-700 uppercase tracking-wide shadow-sm">
                      {batch.examTarget}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1.5 items-center">
                    {isEnrolled ? (
                      <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Enrolled
                      </span>
                    ) : batch.isPaid && batch.feeAmount ? (
                      <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-sm">
                        ₹{batch.feeAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-white/90 text-emerald-700 rounded-lg text-[10px] font-bold shadow-sm">
                        FREE
                      </span>
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
                          onClick={e => { e.stopPropagation(); setExpandedDescIds(p => ({ ...p, [batch.id]: !p[batch.id] })); }}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 mt-0.5">
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
                  {(batch.studentCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mb-4">
                      <Users className="w-3.5 h-3.5" />
                      <span>{batch.studentCount!.toLocaleString()} enrolled</span>
                    </div>
                  )}
                  <div className="mt-auto">
                    <button onClick={() => handleView(batch)}
                      className={cn(
                        "w-full py-2.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                        isEnrolled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm hover:from-indigo-700 hover:to-indigo-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30"
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
