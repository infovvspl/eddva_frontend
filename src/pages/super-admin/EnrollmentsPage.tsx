import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, GraduationCap, Building2, BookOpen,
  ChevronLeft, ChevronRight, Loader2, Filter,
  Download, Users, CalendarDays, AlertCircle, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEnrollments } from "@/hooks/use-tenants";
import { useTenants } from "@/hooks/use-tenants";

// ─── Exam target badge ────────────────────────────────────────────────────────

const examColor: Record<string, string> = {
  jee:  "bg-blue-50 text-blue-700 border-blue-100",
  neet: "bg-emerald-50 text-emerald-700 border-emerald-100",
  both: "bg-violet-50 text-violet-700 border-violet-100",
};

function ExamPill({ target }: { target?: string }) {
  if (!target) return null;
  const key = target.toLowerCase();
  const cls = examColor[key] ?? "bg-slate-50 text-slate-600 border-slate-100";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${cls}`}>
      {target.toUpperCase()}
    </span>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status?: string }) {
  const s = (status || "active").toLowerCase();
  const cls = s === "active"
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : s === "dropped"
      ? "bg-rose-50 text-rose-600 border-rose-100"
      : "bg-slate-50 text-slate-500 border-slate-100";
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${s === "active" ? "bg-emerald-500" : s === "dropped" ? "bg-rose-500" : "bg-slate-400"}`} />
      <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${s === "active" ? "text-emerald-600" : s === "dropped" ? "text-rose-600" : "text-slate-500"}`}>
        {s === "active" ? "Active" : s === "dropped" ? "Dropped" : s}
      </span>
    </div>
  );
}

// ─── Initials avatar ──────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(w => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");
  const dim = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  return (
    <div className={`${dim} rounded-[14px] bg-indigo-600 flex items-center justify-center font-black text-white shrink-0 group-hover:scale-105 transition-transform`}>
      {initials}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 20;

const EnrollmentsPage = () => {
  const [search, setSearch]         = useState("");
  const [tenantId, setTenantId]     = useState("");
  const [batchId, setBatchId]       = useState("");
  const [page, setPage]             = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // live search debounce via controlled state (simple — no debounce lib needed at this scale)
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    // micro-debounce: update after brief pause
    clearTimeout((window as any).__enrollSearchTimer);
    (window as any).__enrollSearchTimer = setTimeout(() => setDebouncedSearch(v), 350);
  };

  const params = {
    search: debouncedSearch || undefined,
    tenantId: tenantId || undefined,
    batchId: batchId || undefined,
    page,
    limit: LIMIT,
  };

  const { data, isLoading, error } = useEnrollments(params);
  const { data: tenantsData } = useTenants({ limit: 100 });
  const tenants = (tenantsData as any)?.items ?? (Array.isArray(tenantsData) ? tenantsData : []);

  const enrollments = data?.items ?? [];
  const meta        = data?.meta;
  const totalPages  = meta?.totalPages ?? 1;
  const total       = meta?.total ?? 0;

  const clearFilters = () => {
    setTenantId("");
    setBatchId("");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  const hasFilters = !!tenantId || !!batchId || !!debouncedSearch;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 md:pb-8">
          <div>
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-2">Platform Control</p>
            <h1 className="text-[26px] md:text-[34px] lg:text-[40px] font-black text-slate-900 tracking-tight leading-tight">
              Student Enrollments
            </h1>
            <p className="text-slate-400 text-sm md:text-[15px] mt-1 font-semibold">
              All student-course enrollments across every institute
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button variant="outline"
              className="h-10 md:h-12 px-5 md:px-8 rounded-2xl border-2 border-slate-100 font-black text-slate-600 hover:bg-slate-50 transition-all text-sm">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </header>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Enrollments", value: total.toLocaleString(), icon: Users,         color: "text-indigo-600 bg-indigo-50" },
            { label: "Institutes",         value: tenants.length,          icon: Building2,     color: "text-violet-600 bg-violet-50" },
            { label: "Showing Page",       value: `${page} / ${totalPages}`, icon: CalendarDays, color: "text-slate-600 bg-slate-50"   },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900 leading-none">{s.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search + filter bar ── */}
        <div className="bg-slate-50/50 p-4 md:p-5 rounded-[24px] border border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, email or phone…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-white border border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 outline-none shadow-sm transition-colors"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`h-11 px-4 flex items-center gap-2 rounded-2xl border text-sm font-black transition-all ${showFilters ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasFilters && !showFilters && (
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              )}
            </button>

            {hasFilters && (
              <button onClick={clearFilters}
                className="h-11 px-4 flex items-center gap-1.5 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 text-sm font-black hover:bg-rose-100 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 flex flex-wrap gap-3">
                  {/* Institute filter */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                      Filter by Institute
                    </label>
                    <select
                      value={tenantId}
                      onChange={e => { setTenantId(e.target.value); setBatchId(""); setPage(1); }}
                      className="w-full h-10 px-3.5 bg-white border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <option value="">All Institutes</option>
                      {tenants.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Batch ID filter */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                      Filter by Batch ID
                    </label>
                    <input
                      type="text"
                      placeholder="Paste batch UUID…"
                      value={batchId}
                      onChange={e => { setBatchId(e.target.value.trim()); setPage(1); }}
                      className="w-full h-10 px-3.5 bg-white border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-300 outline-none focus:border-indigo-400 transition-colors shadow-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                <p className="text-sm font-semibold text-slate-400">Loading enrollments…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-rose-500">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-semibold">Failed to load enrollments</p>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <GraduationCap className="w-10 h-10 text-slate-200" />
                <p className="text-sm font-semibold text-slate-400">No enrollments found</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs font-bold text-indigo-600 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 md:px-7 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Student</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Contact</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Course / Batch</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Institute</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Enrolled On</th>
                    <th className="text-left px-5 md:px-7 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {enrollments.map((e, i) => (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.025 }}
                        className="group hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Student */}
                        <td className="px-5 md:px-7 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={e.studentName || "?"} />
                            <div>
                              <p className="text-sm font-black text-slate-900 leading-tight">{e.studentName || "—"}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                                ID: {e.studentId?.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 md:px-7 py-4">
                          <p className="text-sm font-semibold text-slate-700">{e.studentEmail || "—"}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{e.studentPhone || ""}</p>
                        </td>

                        {/* Course */}
                        <td className="px-5 md:px-7 py-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-slate-300 shrink-0" />
                            <div>
                              <p className="text-sm font-black text-slate-800 leading-tight">{e.batchName || "—"}</p>
                              {e.examTarget && (
                                <div className="mt-1"><ExamPill target={e.examTarget} /></div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Institute */}
                        <td className="px-5 md:px-7 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-300 shrink-0" />
                            <p className="text-sm font-bold text-slate-700">{e.tenantName || "—"}</p>
                          </div>
                        </td>

                        {/* Enrolled on */}
                        <td className="px-5 md:px-7 py-4 text-[11px] font-bold text-slate-500">
                          {e.enrolledAt
                            ? new Date(e.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </td>

                        {/* Status */}
                        <td className="px-5 md:px-7 py-4">
                          <StatusPill status={e.status} />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination footer ── */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap bg-slate-50/40">
            <p className="text-xs font-bold text-slate-400">
              {total > 0
                ? `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total.toLocaleString()} enrollments`
                : "No results"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page number pills */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pageNum = totalPages <= 7
                  ? i + 1
                  : page <= 4
                    ? i + 1
                    : page >= totalPages - 3
                      ? totalPages - 6 + i
                      : page - 3 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-9 min-w-[36px] px-3 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                      pageNum === page
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "border border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EnrollmentsPage;
