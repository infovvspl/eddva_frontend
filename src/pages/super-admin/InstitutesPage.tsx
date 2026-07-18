import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, ChevronLeft, ChevronRight, Loader2,
  Sparkles, MoreHorizontal, Eye, ShieldOff, ShieldCheck,
  Trash2, ExternalLink, Mail, Phone, Building2,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { useConfirm } from "@/context/ConfirmContext";
import { CustomSelect } from "@/components/ui/CustomSelect";

/* ─── small helpers ─────────────────────────────────────────── */
const StatusDot = ({ status }: { status: string }) => {
  const s = (status || "").toLowerCase();
  if (s === "suspended") return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Suspended
    </span>
  );
  if (s === "trial") return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Trial
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
    </span>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: number | string; color: string }) => {
  const colors: Record<string, string> = {
    blue:   "border-blue-200 bg-blue-50 text-blue-800",
    green:  "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber:  "border-amber-200 bg-amber-50 text-amber-800",
    red:    "border-rose-200 bg-rose-50 text-rose-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
  };
  return (
    <div className={`rounded-2xl border shadow-sm p-2 text-center sm:text-left shrink-0 w-[78px] h-[78px] sm:w-auto sm:h-auto snap-align-start flex flex-col justify-center items-center sm:items-stretch sm:justify-start ${colors[color] || colors.blue}`}>
      <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wide opacity-70 truncate w-full" title={label}>{label}</p>
      <p className="mt-0.5 sm:mt-1 text-base sm:text-3xl font-extrabold font-display leading-tight">{value}</p>
    </div>
  );
};

/* ─── action dropdown ─────────────────────────────────────────── */
function ActionMenu({
  inst,
  onSuspend,
  onReactivate,
  onDelete,
  onView,
}: {
  inst: any;
  onSuspend: () => void;
  onReactivate: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const status = (inst.status || "").toLowerCase();
  const isSuspended = status === "suspended" || inst.isSuspended;

  return (
    <div ref={ref} className="relative shrink-0 flex" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors shrink-0 flex items-center justify-center"
      >
        <MoreHorizontal className="w-4 h-4 shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 overflow-hidden"
          >
            <button
              onClick={() => { onView(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-4 h-4 text-slate-400" /> View Details
            </button>
            {isSuspended ? (
              <button
                onClick={() => { onReactivate(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Reactivate
              </button>
            ) : (
              <button
                onClick={() => { onSuspend(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <ShieldOff className="w-4 h-4 text-amber-500" /> Suspend
              </button>
            )}
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── main page ─────────────────────────────────────────────── */
const InstitutesPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [allInstitutes, setAllInstitutes] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const perPage = 10;

  /* ── fetch ── */
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    const fetch = async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
        if (search) params.set("search", search);
        if (statusFilter !== "all") params.set("status", statusFilter.toLowerCase());
        const res = await apiClient.get(`/admin/tenants?${params}`);
        const rd = res.data;
        if (mounted) {
          const list =
            rd?.items ?? rd?.data?.items ?? rd?.data ?? (Array.isArray(rd) ? rd : []);
          setAllInstitutes(Array.isArray(list) ? list : []);
          setTotalCount(rd?.meta?.total ?? rd?.total ?? rd?.data?.meta?.total ?? 0);
          setSummaryStats(rd?.stats || null);
          setError(false);
        }
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [page, search, statusFilter]);

  /* ── stats ── */
  const stats = summaryStats || {
    total: totalCount || allInstitutes.length,
    active: allInstitutes.filter((i) => (i.status || "").toLowerCase() === "active").length,
    trial: allInstitutes.filter((i) => (i.status || "").toLowerCase() === "trial").length,
    suspended: allInstitutes.filter((i) => (i.status || "").toLowerCase() === "suspended").length,
    students: allInstitutes.reduce((acc, i) => acc + (i.studentCount ?? i.student_count ?? 0), 0),
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  /* ── actions ── */
  const handleSuspend = async (inst: any) => {
    const isConfirmed = await confirm({
      title: "Suspend Institute",
      message: `Are you sure you want to suspend "${inst.name}"? This will restrict access.`,
      confirmLabel: "Suspend",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      await apiClient.post(`/super-admin/tenants/${inst.id}/suspend`, {
        reason: "Suspended by super administrator",
      });
      toast.success("Institute suspended");
      setAllInstitutes((prev) =>
        prev.map((i) => (i.id === inst.id ? { ...i, status: "suspended" } : i))
      );
    } catch {
      toast.error("Failed to suspend institute");
    }
  };

  const handleReactivate = async (inst: any) => {
    const isConfirmed = await confirm({
      title: "Reactivate Institute",
      message: `Are you sure you want to reactivate "${inst.name}"?`,
      confirmLabel: "Reactivate",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      await apiClient.post(`/super-admin/tenants/${inst.id}/reactivate`);
      toast.success("Institute reactivated");
      setAllInstitutes((prev) =>
        prev.map((i) => (i.id === inst.id ? { ...i, status: "active" } : i))
      );
    } catch {
      toast.error("Failed to reactivate institute");
    }
  };

  const handleDelete = async (inst: any) => {
    const isConfirmed = await confirm({
      title: "Confirm Delete",
      message: `Delete "${inst.name}"? This permanently deletes ALL data and cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      await apiClient.delete(`/super-admin/tenants/${inst.id}`);
      toast.success("Institute deleted");
      setAllInstitutes((prev) => prev.filter((i) => i.id !== inst.id));
      setTotalCount((c) => c - 1);
    } catch {
      toast.error("Failed to delete institute");
    }
  };

  return (
    <div className="space-y-6 pb-12 px-1">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border border-slate-200 rounded-2xl p-4 sm:border-b sm:border-t-0 sm:border-l-0 sm:border-r-0 sm:border-slate-100 dark:border-slate-800 sm:rounded-none sm:p-0 sm:pb-4 mt-4 sm:mt-0 pt-3.5 sm:pt-0">
        <div className="flex-1">
          <h1 className="font-display text-xl sm:text-3xl font-bold text-slate-900">
            Coaching Institutes
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Manage coaching institutes, control access and AI features.
          </p>
        </div>
        <button
          onClick={() => navigate("/super-admin/tenants/new")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center mt-2 sm:mt-0"
        >
          <Plus className="w-4 h-4" /> Add Institute
        </button>
      </div>

      {/* Stat Cards */}
      <div className="flex flex-row overflow-x-auto sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 pb-2 scrollbar-none snap-x snap-mandatory">
        <StatCard label="Total Institutes" value={stats.total} color="blue" />
        <StatCard label="Active" value={stats.active} color="green" />
        <StatCard label="Trial" value={stats.trial} color="amber" />
        <StatCard label="Suspended" value={stats.suspended} color="red" />
        <StatCard label="Students" value={stats.students.toLocaleString()} color="purple" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search institutes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition"
          />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "trial", label: "Trial" },
            { value: "suspended", label: "Suspended" },
          ]}
        />
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-2/3" />
            </div>
          ))
        ) : error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Failed to load institutes. Please try again.
          </div>
        ) : allInstitutes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Building2 className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold">No institutes found</p>
              <p className="text-xs">Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {allInstitutes.map((inst: any) => {
              const students = inst.studentCount ?? inst.student_count ?? 0;
              const limit = inst.studentLimit ?? inst.maxStudents ?? inst.student_limit ?? 500;
              const pct = Math.min((students / Math.max(limit, 1)) * 100, 100);
              const aiEnabled = inst.aiEnabled ?? inst.ai_enabled ?? false;
              const domain = inst.tenant_domain || inst.subdomain || inst.tenantDomain || "—";
              const email = inst.email || inst.adminEmail || inst.admin_email || "—";
              const phone = inst.phone || inst.adminPhone || "—";
              const city = inst.city || "";
              const state = inst.state || "";

              return (
                <motion.div
                  key={inst.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3 active:bg-slate-50 transition-colors"
                  onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
                >
                  {/* Top row: Avatar + Name + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        {(inst.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{inst.name}</p>
                        <p className="text-xs text-slate-400 font-medium truncate">
                          {[city, state].filter(Boolean).join(", ") || "No location"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <StatusDot status={inst.status || "active"} />
                      <ActionMenu
                        inst={inst}
                        onView={() => navigate(`/super-admin/tenants/${inst.id}`)}
                        onSuspend={() => handleSuspend(inst)}
                        onReactivate={() => handleReactivate(inst)}
                        onDelete={() => handleDelete(inst)}
                      />
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {/* Contact */}
                    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Contact</p>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{phone}</span>
                      </div>
                    </div>

                    {/* Tenant */}
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Tenant</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="font-mono text-xs font-bold text-indigo-700 truncate">{domain}</span>
                        <span className="text-slate-400 text-[10px] font-mono shrink-0">.edva.in</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {inst.plan ? (
                          <span className="font-semibold uppercase">{inst.plan}</span>
                        ) : (
                          <span className="italic">No plan</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Students progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Students</p>
                      <div className="flex items-center gap-1">
                        {aiEnabled && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 mr-2">
                            <Sparkles className="w-3 h-3" /> AI
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-700">{students.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">/ {limit.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`h-full rounded-full ${pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-amber-400" : "bg-indigo-500"}`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Mobile Pagination */}
        {!isLoading && allInstitutes.length > 0 && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-xs font-semibold text-slate-500">
              Showing{" "}
              <span className="text-slate-800">{(page - 1) * perPage + 1}</span>
              {" "}to{" "}
              <span className="text-slate-800">{Math.min(page * perPage, totalCount)}</span>
              {" "}of{" "}
              <span className="text-slate-800">{totalCount}</span> institutes
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    p === page
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <th className="px-5 py-4">Coaching Institute</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Tenant</th>
                <th className="px-5 py-4">Students</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">AI</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm font-semibold text-slate-500">
                    Failed to load institutes. Please try again.
                  </td>
                </tr>
              ) : allInstitutes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Building2 className="w-10 h-10 opacity-30" />
                      <p className="text-sm font-semibold">No institutes found</p>
                      <p className="text-xs">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {allInstitutes.map((inst: any) => {
                    const students = inst.studentCount ?? inst.student_count ?? 0;
                    const limit = inst.studentLimit ?? inst.maxStudents ?? inst.student_limit ?? 500;
                    const pct = Math.min((students / Math.max(limit, 1)) * 100, 100);
                    const aiEnabled = inst.aiEnabled ?? inst.ai_enabled ?? false;
                    const domain = inst.tenant_domain || inst.subdomain || inst.tenantDomain || "—";
                    const email = inst.email || inst.adminEmail || inst.admin_email || "—";
                    const phone = inst.phone || inst.adminPhone || "—";
                    const city = inst.city || "";
                    const state = inst.state || "";

                    return (
                      <motion.tr
                        key={inst.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/super-admin/tenants/${inst.id}`)}
                      >
                        {/* Institute */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                              {(inst.name || "?")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{inst.name}</p>
                              <p className="text-xs text-slate-400 font-medium truncate">
                                {[city, state].filter(Boolean).join(", ") || "No location"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{phone}</span>
                            </div>
                          </div>
                        </td>

                        {/* Tenant */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-indigo-700">
                              {domain}
                            </span>
                            <span className="text-slate-400 text-xs font-mono">.edva.in</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {inst.plan ? (
                              <span className="font-semibold uppercase">{inst.plan}</span>
                            ) : (
                              <span className="italic">No plan</span>
                            )}
                          </p>
                        </td>

                        {/* Students */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1.5 w-32">
                            <div className="flex justify-between text-xs font-semibold text-slate-700">
                              <span>{students.toLocaleString()}</span>
                              <span className="text-slate-400">/ {limit.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className={`h-full rounded-full ${pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-amber-400" : "bg-indigo-500"}`}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusDot status={inst.status || "active"} />
                        </td>

                        {/* AI */}
                        <td className="px-5 py-4">
                          {aiEnabled ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                              <Sparkles className="w-3 h-3" /> AI On
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">No AI</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/super-admin/tenants/${inst.id}`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </button>
                            <ActionMenu
                              inst={inst}
                              onView={() => navigate(`/super-admin/tenants/${inst.id}`)}
                              onSuspend={() => handleSuspend(inst)}
                              onReactivate={() => handleReactivate(inst)}
                              onDelete={() => handleDelete(inst)}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && allInstitutes.length > 0 && (
          <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold text-slate-500">
              Showing{" "}
              <span className="text-slate-800">{(page - 1) * perPage + 1}</span>
              {" "}to{" "}
              <span className="text-slate-800">{Math.min(page * perPage, totalCount)}</span>
              {" "}of{" "}
              <span className="text-slate-800">{totalCount}</span> institutes
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    p === page
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutesPage;
