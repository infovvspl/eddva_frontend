import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2, Users, Search, ChevronRight, ChevronDown, BarChart3,
} from "lucide-react";
import { useBatches, useBatchRoster } from "@/hooks/use-admin";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─── Exam gradient map ────────────────────────────────────────────────────────

const EXAM_STYLES: Record<string, { from: string; to: string; badge: string }> = {
  jee:     { from: "#1D4ED8", to: "#4F46E5", badge: "JEE"  },
  neet:    { from: "#059669", to: "#0D9488", badge: "NEET" },
  both:    { from: "#7C3AED", to: "#C026D3", badge: "ALL"  },
  default: { from: "#0F172A", to: "#334155", badge: "—"    },
};

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

// ─── Aggregate all students from up to 10 batches ────────────────────────────

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

  const allStudents = useMemo(() => {
    const studentMap = new Map<string, any>();
    batchList.forEach((batch, i) => {
      const students = rosters[i]?.list ?? [];
      students.forEach((s: any) => {
        const id = s.studentId || s.id || s.userId || s.email;
        if (!id) return;
        if (studentMap.has(id)) {
          const existing = studentMap.get(id);
          if (!existing._batchNames.includes(batch.name)) {
            existing._batchNames.push(batch.name);
          }
        } else {
          studentMap.set(id, {
            ...s,
            _batchNames: [batch.name],
            _examTarget: batch.examTarget
          });
        }
      });
    });
    return Array.from(studentMap.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchList, ...rosters.map(r => r.list)]);

  return { allStudents, isLoading, batchList };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const StudentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState(searchParams.get("batch") ?? "");
  const [page, setPage] = useState(1);

  const { allStudents, isLoading, batchList } = useAllStudents();

  // Sync URL param → filter on first load / navigation
  useEffect(() => {
    const b = searchParams.get("batch") ?? "";
    setBatchFilter(b);
    setPage(1);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = allStudents;
    if (batchFilter) {
      result = result.filter(s => (s._batchNames || []).some((bn: string) => bn.toLowerCase() === batchFilter.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        (s.name || s.fullName || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.phone || s.phoneNumber || "").includes(q)
      );
    }
    return result;
  }, [allStudents, batchFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleBatchFilter = (value: string) => {
    setBatchFilter(value);
    setPage(1);
    if (value) {
      setSearchParams({ batch: value });
    } else {
      setSearchParams({});
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
            {allStudents.length} student{allStudents.length !== 1 ? "s" : ""} across {batchList.length} course{batchList.length !== 1 ? "s" : ""}
          </p>
        </div>
      </motion.div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 h-11 bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-slate-700 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Batch filter */}
        <div className="relative">
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={batchFilter}
            onChange={e => handleBatchFilter(e.target.value)}
            className="h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 appearance-none cursor-pointer transition-colors min-w-[180px]"
          >
            <option value="">All Batches</option>
            {batchList.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Active filter chip ── */}
      {batchFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Filtering by:</span>
          <button
            onClick={() => handleBatchFilter("")}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            {batchFilter} ×
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-3xl border-2 border-dashed border-slate-200">
          <Users className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-400">
            {search || batchFilter ? "No students match your filters" : "No students found"}
          </p>
          {(search || batchFilter) && (
            <button
              onClick={() => { setSearch(""); setSearchInput(""); handleBatchFilter(""); }}
              className="mt-3 text-xs font-bold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">#</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Name</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden sm:table-cell">Phone / Email</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden md:table-cell">Course</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden lg:table-cell">Enrolled On</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 hidden lg:table-cell">Last Active</th>
                  <th className="w-8 p-4" />
                </tr>
              </thead>
              <tbody>
                {paged.map((s: any, i) => {
                  const name = s.name || s.fullName || s.studentName || "—";
                  const phone = s.phone || s.phoneNumber || "—";
                  const email = s.email || "";
                  const sid = s.studentId || s.id;
                  const bStyle = EXAM_STYLES[s._examTarget?.toLowerCase()] ?? EXAM_STYLES.default;
                  const rowNum = (page - 1) * PAGE_SIZE + i + 1;
                  return (
                    <tr
                      key={sid ?? i}
                      onClick={() => typeof sid === "string" && navigate(`/teacher/students/${sid}`)}
                      className={cn(
                        "border-b border-slate-50 last:border-0 transition-colors group",
                        typeof sid === "string" ? "cursor-pointer hover:bg-blue-50/40" : ""
                      )}
                    >
                      <td className="p-4 text-xs font-bold text-slate-400">{rowNum}</td>
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
                        <div className="flex flex-wrap gap-1.5 align-middle">
                          {(s._batchNames || []).map((bName: string, bIdx: number) => (
                            <span
                              key={bIdx}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${bStyle.from}15`, color: bStyle.from }}
                            >
                              {bName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400 hidden lg:table-cell">
                        {s.enrolledAt
                          ? new Date(s.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="p-4 text-sm text-slate-400 hidden lg:table-cell">
                        {s.lastLoginAt
                          ? new Date(s.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                          : "Never"}
                      </td>
                      <td className="p-4 flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/teacher/students/${sid}`);
                          }}
                          className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                          title="View Advanced Progress"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-slate-400">
              {filtered.length} student{filtered.length !== 1 ? "s" : ""}
              {batchFilter ? ` in "${batchFilter}"` : ""}
              {search ? ` matching "${search}"` : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:border-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="text-slate-400 text-xs px-1">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-colors",
                        page === p
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 disabled:opacity-40 hover:border-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentsPage;
