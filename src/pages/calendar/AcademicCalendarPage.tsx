import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Trash2, X, ChevronRight, CalendarDays, AlertCircle, Radio, ChevronDown, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCalendarBatches, useCalendarFeed, useCreateCalendarEvent, useDeleteCalendarEvent } from "@/hooks/use-calendar";
import { useWeeklyPlan } from "@/hooks/use-student";
import type { InstituteCalendarEvent, LiveClassCalendarItem } from "@/lib/api/calendar";
import type { StudyPlanItem } from "@/lib/api/student";

// Color lookup for all event types (including legacy exam/test for existing data)
const TYPE_COLOR_MAP: Record<string, string> = {
  holiday: "#10b981",
  vacation: "#f59e0b", // Amber for vacations
  monthly_planner: "#0ea5e9",
  mock_test: "#f97316",
  pt_exam: "#ef4444",
  half_yearly: "#dc2626",
  annual_exam: "#9f1239",
  lecture: "#3b82f6",
  exam: "#f59e0b",
  test: "#f59e0b",
  other: "#6b7280",
  study_plan: "#6366f1",
  assignment: "#8b5cf6", // Purple for assignments
};

// Grouped categories for the "Add Event" form dropdown
const EVENT_CATEGORIES = [
  {
    group: "Holidays & Vacations",
    types: [
      { value: "holiday", label: "School/Institution Holiday", color: "#10b981" },
      { value: "vacation", label: "Vacation", color: "#f59e0b" },
    ],
  },
  {
    group: "Monthly Planner",
    types: [
      { value: "monthly_planner", label: "Monthly Planner", color: "#0ea5e9" },
    ],
  },
  {
    group: "Exams",
    types: [
      { value: "mock_test", label: "Mock Test", color: "#f97316" },
      { value: "pt_exam", label: "PT Exam", color: "#ef4444" },
      { value: "half_yearly", label: "Half Yearly Exam", color: "#dc2626" },
      { value: "annual_exam", label: "Annual Exam", color: "#9f1239" },
    ],
  },
  {
    group: "Other",
    types: [
      { value: "lecture", label: "Lecture", color: "#3b82f6" },
      { value: "other", label: "Other", color: "#6b7280" },
    ],
  },
];

// Flat list used for the legend (non-legacy types only)
const LEGEND_TYPES = EVENT_CATEGORIES.flatMap((cat) => cat.types);

const LIVE_COLOR = "#dc2626";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// View filter options for both admin and student
const VIEW_FILTERS = [
  { value: "all", label: "All Events" },
  { value: "public_holiday", label: "Public Holidays" },
  { value: "holiday", label: "School/Institution Holidays" },
  { value: "vacation", label: "Vacations" },
  { value: "monthly_planner", label: "Monthly Planner" },
  { value: "exam", label: "Exams (All)" },
  { value: "live_class", label: "Live Classes" },
  { value: "study_plan", label: "Study Plan" },
  { value: "assignment", label: "Assignments" },
];

const EXAM_TYPES = new Set(["exam", "test", "mock_test", "pt_exam", "half_yearly", "annual_exam"]);

// ── Confirmed Indian public holidays (national + major gazetted) ──────────────
const PUBLIC_HOLIDAYS: { date: string; title: string }[] = [
  // 2025
  { date: "2025-01-26", title: "Republic Day 🇮🇳" },
  { date: "2025-03-14", title: "Holi 🎨" },
  { date: "2025-03-31", title: "Id-ul-Fitr (Eid) 🌙" },
  { date: "2025-04-14", title: "Dr. Ambedkar Jayanti" },
  { date: "2025-04-18", title: "Good Friday ✝️" },
  { date: "2025-05-12", title: "Buddha Purnima" },
  { date: "2025-06-07", title: "Id-ul-Zuha (Bakrid) 🐑" },
  { date: "2025-07-06", title: "Muharram" },
  { date: "2025-08-15", title: "Independence Day 🇮🇳" },
  { date: "2025-08-27", title: "Janmashtami 🪈" },
  { date: "2025-09-05", title: "Milad-un-Nabi (Prophet's Birthday)" },
  { date: "2025-10-02", title: "Gandhi Jayanti / Mahatma Gandhi Birthday" },
  { date: "2025-10-02", title: "Dussehra" },
  { date: "2025-10-20", title: "Diwali 🪔" },
  { date: "2025-10-22", title: "Govardhan Puja" },
  { date: "2025-11-05", title: "Guru Nanak Jayanti" },
  { date: "2025-12-25", title: "Christmas Day 🎄" },
  // 2026
  { date: "2026-01-26", title: "Republic Day 🇮🇳" },
  { date: "2026-03-03", title: "Holi 🎨" },
  { date: "2026-03-20", title: "Id-ul-Fitr (Eid) 🌙" },
  { date: "2026-04-03", title: "Good Friday ✝️" },
  { date: "2026-04-14", title: "Dr. Ambedkar Jayanti" },
  { date: "2026-04-30", title: "Buddha Purnima" },
  { date: "2026-08-15", title: "Independence Day 🇮🇳" },
  { date: "2026-08-16", title: "Janmashtami 🪈" },
  { date: "2026-10-02", title: "Gandhi Jayanti 🕊️" },
  { date: "2026-10-19", title: "Dussehra" },
  { date: "2026-11-08", title: "Diwali 🪔" },
  { date: "2026-11-25", title: "Guru Nanak Jayanti" },
  { date: "2026-12-25", title: "Christmas Day 🎄" },
];

const PUBLIC_HOLIDAY_COLOR = "#059669"; // emerald-600

function eventColor(type: string) {
  return TYPE_COLOR_MAP[type] ?? "#8b5cf6";
}

function matchesFilter(viewFilter: string, kind: string, type: string): boolean {
  if (viewFilter === "all") return true;
  if (viewFilter === "public_holiday") return kind === "public_holiday" || type === "holiday" || type === "vacation";
  if (kind === "public_holiday") return false;
  if (viewFilter === "live_class") return type === "live_class";
  if (viewFilter === "assignment") return type === "assignment";
  if (viewFilter === "study_plan") return kind === "study_plan";
  if (viewFilter === "exam") return EXAM_TYPES.has(type);
  if (viewFilter === "vacation") return type === "vacation";
  return type === viewFilter;
}

const itemStyle = (kind: string) => 
  ["live", "assignment", "mock_test"].includes(kind) ? "cursor-pointer hover:opacity-90 transition-opacity" : "";


type DayItem =
  | { kind: "public_holiday"; id: string; title: string; type: string; color: string; raw: null }
  | { kind: "institute"; id: string; title: string; type: string; color: string; raw: InstituteCalendarEvent }
  | { kind: "live"; id: string; title: string; type: string; color: string; raw: LiveClassCalendarItem }
  | { kind: "study_plan"; id: string; title: string; type: string; color: string; raw: StudyPlanItem };

function buildByDate(
  instituteEvents: InstituteCalendarEvent[],
  liveClasses: LiveClassCalendarItem[],
  studyPlan: StudyPlanItem[],
  viewFilter: string,
  year: number,
  month: number,
): Record<string, DayItem[]> {
  const byDate: Record<string, DayItem[]> = {};

  // Inject public holidays for the visible month
  if (viewFilter === "all" || viewFilter === "public_holiday") {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    for (const ph of PUBLIC_HOLIDAYS) {
      if (!ph.date.startsWith(prefix)) continue;
      byDate[ph.date] = [
        { kind: "public_holiday", id: `ph-${ph.date}-${ph.title}`, title: ph.title, type: "public_holiday", color: PUBLIC_HOLIDAY_COLOR, raw: null },
        ...(byDate[ph.date] ?? []),
      ];
    }
  }

  for (const ev of instituteEvents) {
    if (!matchesFilter(viewFilter, "institute", ev.type)) continue;
    const startStr = (ev.date || "").split("T")[0];
    if (!startStr) continue;

    if (ev.endDate) {
      const endStr = ev.endDate.split("T")[0];
      let current = new Date(startStr + "T00:00:00.000Z");
      const end = new Date(endStr + "T00:00:00.000Z");
      while (current.getTime() <= end.getTime()) {
        const key = current.toISOString().split("T")[0];
        byDate[key] = [
          ...(byDate[key] ?? []),
          { kind: "institute", id: `${ev.id}-${key}`, title: ev.title, type: ev.type, color: ev.color || eventColor(ev.type), raw: ev },
        ];
        current.setUTCDate(current.getUTCDate() + 1);
      }
    } else {
      byDate[startStr] = [
        ...(byDate[startStr] ?? []),
        { kind: "institute", id: ev.id, title: ev.title, type: ev.type, color: ev.color || eventColor(ev.type), raw: ev },
      ];
    }
  }

  for (const lec of liveClasses) {
    // liveClasses array now also includes assignments and mock tests from the backend feed
    const actualType = (lec as any).type || "live_class";
    if (!matchesFilter(viewFilter, "live", actualType)) continue;
    
    const key = new Date(lec.scheduledAt).toISOString().split("T")[0];
    
    let color = LIVE_COLOR;
    let finalKind = "live";
    if (actualType === "assignment") {
      color = TYPE_COLOR_MAP.assignment;
      finalKind = "assignment";
    } else if (actualType === "mock_test") {
      color = TYPE_COLOR_MAP.mock_test;
      finalKind = "mock_test";
    }
    
    byDate[key] = [
      ...(byDate[key] ?? []),
      { kind: finalKind as any, id: lec.id, title: lec.title, type: actualType, color, raw: lec as any },
    ];
  }

  // Group study plan items to avoid grid clutter
  const studyPlanByDate: Record<string, StudyPlanItem[]> = {};
  for (const item of studyPlan) {
    const key = (item.scheduledDate || "").split("T")[0];
    if (!key) continue;
    if (!studyPlanByDate[key]) studyPlanByDate[key] = [];
    studyPlanByDate[key].push(item);
  }

  for (const [key, items] of Object.entries(studyPlanByDate)) {
    if (!matchesFilter(viewFilter, "study_plan", "study_plan")) continue;
    byDate[key] = [
      ...(byDate[key] ?? []),
      {
        kind: "study_plan",
        id: `study-group-${key}`,
        title: `Study Plan (${items.length} tasks)`,
        type: "study_plan",
        color: "#6366f1",
        raw: items[0],
      },
    ];
  }

  return byDate;
}

function mergedList(
  instituteEvents: InstituteCalendarEvent[],
  liveClasses: LiveClassCalendarItem[],
  studyPlan: StudyPlanItem[],
  viewFilter: string,
  year: number,
  month: number,
): { sortKey: string; label: string; sub: string; color: string; kind: string; id: string; raw?: any }[] {
  const rows: { sortKey: string; label: string; sub: string; color: string; kind: string; id: string; raw?: any }[] = [];

  // Public holidays for the month
  if (viewFilter === "all" || viewFilter === "public_holiday") {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    for (const ph of PUBLIC_HOLIDAYS) {
      if (!ph.date.startsWith(prefix)) continue;
      rows.push({
        sortKey: ph.date,
        label: ph.title,
        sub: ph.date,
        color: PUBLIC_HOLIDAY_COLOR,
        kind: "Public Holiday",
        id: `ph-${ph.date}-${ph.title}`,
        raw: null,
      });
    }
  }

  for (const ev of instituteEvents) {
    if (!matchesFilter(viewFilter, "institute", ev.type)) continue;
    const typeLabel = LEGEND_TYPES.find((t) => t.value === ev.type)?.label ?? ev.type;
    const startStr = (ev.date || "").split("T")[0];
    const endStr = ev.endDate ? ` to ${ev.endDate.split("T")[0]}` : "";
    rows.push({
      sortKey: ev.date,
      label: ev.title,
      sub: `${startStr}${endStr}${ev.description ? ` · ${ev.description}` : ""}`,
      color: ev.color || eventColor(ev.type),
      kind: typeLabel,
      id: ev.id,
      raw: ev,
    });
  }

  for (const lec of liveClasses) {
    const actualType = (lec as any).type || "live_class";
    if (!matchesFilter(viewFilter, "live", actualType)) continue;
    const d = new Date(lec.scheduledAt);
    
    let color = LIVE_COLOR;
    let finalKind = "Live class";
    if (actualType === "assignment") {
      color = TYPE_COLOR_MAP.assignment;
      finalKind = "Assignment Deadline";
    } else if (actualType === "mock_test") {
      color = TYPE_COLOR_MAP.mock_test;
      finalKind = "Mock Test Deadline";
    }

    rows.push({
      sortKey: lec.scheduledAt,
      label: lec.title,
      sub: `${d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}${lec.batchName ? ` · ${lec.batchName}` : ""}`,
      color,
      kind: finalKind,
      id: lec.id,
      raw: lec,
    });
  }

  for (const item of studyPlan) {
    if (!matchesFilter(viewFilter, "study_plan", "study_plan")) continue;
    rows.push({
      sortKey: item.scheduledDate,
      label: item.title,
      sub: `Study Plan · ${item.status}`,
      color: "#6366f1",
      kind: "Study Plan",
      id: item.id,
      raw: item,
    });
  }

  return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export interface AcademicCalendarPageProps {
  /** Teachers and institute admins can add/delete institute calendar events. */
  canManageEvents?: boolean;
  pageTitle?: string;
}

export default function AcademicCalendarPage({
  canManageEvents = false,
  pageTitle = "Calendar",
}: AcademicCalendarPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [viewFilter, setViewFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "holiday",
    date: "",
    endDate: "",
    description: "",
    batchIds: [] as string[],
  });
  const [formError, setFormError] = useState("");

  const { data, isLoading: isFeedLoading } = useCalendarFeed(year, month);
  const { data: eventBatches = [] } = useCalendarBatches(canManageEvents);
  
  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;
  const { data: studyPlanData = [], isLoading: isPlanLoading } = useWeeklyPlan(startOfMonth, endOfMonth);
  
  const isLoading = isFeedLoading || (!canManageEvents && isPlanLoading);
  
  const createEvent = useCreateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  
  const instituteEvents = data?.instituteEvents ?? [];
  const liveClasses = data?.liveClasses ?? [];
  const studyPlan = studyPlanData || [];

  const byDate = useMemo(
    () => buildByDate(instituteEvents, liveClasses, studyPlan, viewFilter, year, month),
    [instituteEvents, liveClasses, studyPlan, viewFilter, year, month],
  );

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay();
  const todayStr = today.toISOString().split("T")[0];

  const yearOptions = Array.from({ length: 8 }, (_, i) => today.getFullYear() - 2 + i);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await createEvent.mutateAsync({
        title: form.title,
        type: form.type,
        date: form.date,
        endDate: form.endDate || undefined,
        description: form.description || undefined,
        batchIds: form.batchIds,
      });
      toast.success("Event added — students have been notified.");
      setForm({ title: "", type: "holiday", date: "", endDate: "", description: "", batchIds: [] });
      setShowForm(false);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setFormError(msg || "Failed to add event.");
    }
  };

  const handleDelete = async (item: DayItem) => {
    if (item.kind !== "institute") return;
    try {
      await deleteEvent.mutateAsync(item.id);
      toast.success("Event removed");
    } catch {
      toast.error("Failed to remove event");
    }
  };

  const handleChipClick = (item: DayItem) => {
    if (item.kind === "live") {
      navigate(`/live/${item.id}`);
    } else if (item.kind === "mock_test") {
      navigate(canManageEvents ? `/admin/mock-tests/${item.id}/results` : `/student/mock-tests/${item.id}`, { state: { from: location.pathname } });
    } else if (item.kind === "assignment") {
      if (canManageEvents && item.raw && (item.raw as any).lectureId) {
        navigate(`/teacher/lectures?action=assignments&lectureId=${(item.raw as any).lectureId}`, { state: { from: location.pathname } });
      } else if (item.raw && (item.raw as any).lectureId) {
        navigate(`/student/lectures/${(item.raw as any).lectureId}#assignments`, { state: { from: location.pathname } });
      }
    }
  };

  const listRows = useMemo(
    () => mergedList(instituteEvents, liveClasses, studyPlan, viewFilter, year, month),
    [instituteEvents, liveClasses, studyPlan, viewFilter, year, month],
  );

  const todayRows = useMemo(() => {
    const allToday = mergedList(instituteEvents, liveClasses, studyPlan, "all", today.getFullYear(), today.getMonth() + 1)
      .filter((row) => row.sortKey.split("T")[0] === todayStr);
    
    const studyItems = allToday.filter(r => r.kind === "Study Plan");
    const nonStudy = allToday.filter(r => r.kind !== "Study Plan");
    
    if (studyItems.length > 0) {
      nonStudy.push({
        sortKey: todayStr,
        label: "Your Daily Study Plan",
        sub: `${studyItems.length} tasks scheduled for today`,
        color: "#6366f1",
        kind: "Study Plan",
        id: "today-summary",
      });
    }
    return nonStudy.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [instituteEvents, liveClasses, studyPlan, todayStr]);

  const fmtToday = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {canManageEvents
              ? "Manage holidays, exams, study plans, and live classes."
              : "Holidays, exams, and study plan events added by your institute."}
          </p>
        </div>
        {canManageEvents && (
          <Button onClick={() => { setShowForm((v) => !v); setFormError(""); }} className="gap-2 rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Event"}
          </Button>
        )}
      </div>

      {/* Add Event Form */}
      <AnimatePresence>
        {canManageEvents && showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-card border border-border rounded-3xl p-6 space-y-5 overflow-hidden shadow-xl shadow-black/5"
          >
            <h3 className="font-bold text-lg text-foreground">New calendar event</h3>
            {formError && (
              <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-500 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">Title *</label>
                <input
                  required
                  placeholder="e.g. Diwali Holiday"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">Category</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-sm text-foreground outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <optgroup key={cat.group} label={cat.group}>
                      {cat.types.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">Start date *</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">End date (optional)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">Description</label>
                <input
                  placeholder="Optional details"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full h-12 px-4 bg-secondary/50 border border-border rounded-2xl text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2 block">Visible to courses (optional)</label>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <label className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      checked={form.batchIds.length === 0}
                      onChange={(e) => { if (e.target.checked) setForm({ ...form, batchIds: [] }); }}
                    />
                    Show to all courses
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-auto pr-2 custom-scrollbar">
                    {eventBatches.map((batch) => {
                      const checked = form.batchIds.includes(batch.id);
                      return (
                        <label key={batch.id} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.batchIds, batch.id]
                                : form.batchIds.filter((id) => id !== batch.id);
                              setForm({ ...form, batchIds: next });
                            }}
                          />
                          <span className="truncate">{batch.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createEvent.isPending} className="gap-2 rounded-xl px-6 font-bold shadow-lg shadow-primary/20">
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Event
              </Button>
              <Button type="button" variant="ghost" className="rounded-xl px-6 font-bold" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Calendar Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border p-3 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">View</span>
              <div className="relative">
                <select
                  value={viewFilter}
                  onChange={(e) => setViewFilter(e.target.value)}
                  className="h-10 pl-4 pr-10 bg-secondary/50 border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary appearance-none cursor-pointer hover:bg-secondary transition-colors"
                >
                  {VIEW_FILTERS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-all active:scale-95 border border-border">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>

              <div className="flex items-center bg-secondary/30 border border-border rounded-xl overflow-hidden">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="h-10 pl-4 pr-2 bg-transparent text-sm font-black text-foreground outline-none cursor-pointer hover:bg-secondary/20 appearance-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <div className="w-[1px] h-4 bg-border" />
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-10 pl-2 pr-4 bg-transparent text-sm font-black text-foreground outline-none cursor-pointer hover:bg-secondary/20 appearance-none"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button onClick={nextMonth} className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-all active:scale-95 border border-border">
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={goToday}
                className="ml-2 h-10 px-4 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl border border-primary/20 transition-all active:scale-95"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5">
            <div className="grid grid-cols-7 border-b border-border bg-secondary/30 backdrop-blur-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {d}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
                <p className="text-xs font-bold text-muted-foreground animate-pulse">SYNCING CALENDAR...</p>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[110px] border-b border-r border-border/30 bg-secondary/5" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const evts = byDate[key] ?? [];
                  const isToday = key === todayStr;
                  const colIndex = (startPad + i) % 7;
                  const isLastCol = colIndex === 6;

                  return (
                    <div
                      key={key}
                      className={`min-h-[110px] p-2 border-b border-r border-border/30 transition-all group ${isLastCol ? "border-r-0" : ""} ${isToday ? "bg-primary/5" : "hover:bg-secondary/10"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${isToday ? "bg-primary text-white shadow-lg shadow-primary/40 scale-110" : "text-muted-foreground group-hover:text-foreground"}`}
                        >
                          {day}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {evts.slice(0, 3).map((ev) => (
                          <div
                            key={`${ev.kind}-${ev.id}`}
                            title={ev.title}
                            className={`group/chip flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-white truncate leading-tight shadow-sm ${itemStyle(ev.kind)}`}
                            style={{ backgroundColor: ev.color }}
                            onClick={() => handleChipClick(ev)}
                          >
                            {ev.kind === "live" && <Radio className="w-3 h-3 shrink-0" />}
                            {ev.kind === "study_plan" && <Brain className="w-3 h-3 shrink-0" />}
                            <span className="flex-1 truncate uppercase tracking-tighter">{ev.title}</span>
                          </div>
                        ))}
                        {evts.length > 3 && (
                          <p className="text-[9px] text-muted-foreground/60 px-1 font-black uppercase tracking-widest text-center mt-1">
                            +{evts.length - 3} MORE
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: PUBLIC_HOLIDAY_COLOR }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Public Holiday</span>
            </div>
            {LEGEND_TYPES.map((t) => (
              <div key={t.value} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: t.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: TYPE_COLOR_MAP.assignment }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: LIVE_COLOR }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: "#6366f1" }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Study Plan</span>
            </div>
          </div>
        </div>

        {/* Right: Today's Agenda Column */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-2xl shadow-black/5 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative space-y-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-black text-foreground tracking-tight">Today's Agenda</h3>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{fmtToday}</p>
              </div>

              <div className="space-y-4">
                {todayRows.length > 0 ? (
                  todayRows.map((row) => {
                    const isLive = row.kind === "Live class";
                    const isStudy = row.kind === "Study Plan";
                    const ev = instituteEvents.find((e) => e.id === row.id);

                    return (
                      <div
                        key={`${row.kind}-${row.id}`}
                        className="relative group/item flex items-center gap-4 bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border p-4 rounded-3xl transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
                        onClick={() => {
                          if (row.kind === "Live class") navigate(`/live/${row.id}`);
                          else if (row.kind === "Study Plan") navigate("/student/study-plan");
                          else if (row.kind === "Mock Test Deadline") {
                            navigate(canManageEvents ? `/admin/mock-tests/${row.id}/results` : `/student/mock-tests/${row.id}`, { state: { from: location.pathname } });
                          }
                          else if (row.kind === "Assignment Deadline") {
                            if (canManageEvents && row.raw?.lectureId) {
                              navigate(`/teacher/lectures?action=assignments&lectureId=${row.raw.lectureId}`, { state: { from: location.pathname } });
                            } else if (row.raw?.lectureId) {
                              navigate(`/student/lectures/${row.raw.lectureId}#assignments`, { state: { from: location.pathname } });
                            }
                          }
                        }}
                      >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/5" style={{ backgroundColor: `${row.color}15` }}>
                          {isLive ? <Radio className="w-6 h-6" style={{ color: row.color }} /> :
                           isStudy ? <Brain className="w-6 h-6" style={{ color: row.color }} /> :
                           <CalendarDays className="w-6 h-6" style={{ color: row.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-foreground truncate leading-tight group-hover/item:text-primary transition-colors">{row.label}</p>
                          <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.color }} />
                            {row.kind}
                          </p>
                        </div>
                        {["Live class", "Study Plan", "Mock Test Deadline", "Assignment Deadline"].includes(row.kind) && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover/item:scale-110 transition-transform shrink-0 ml-2">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                        {canManageEvents && ev && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete({ kind: "institute", id: ev.id, title: ev.title, type: ev.type, color: row.color, raw: ev }); }}
                            disabled={deleteEvent.isPending}
                            className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100 shrink-0 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 flex flex-col items-center text-center space-y-4 px-4 bg-secondary/10 rounded-[2rem] border border-dashed border-border/50">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                      <CalendarDays className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground uppercase tracking-widest">Nothing Scheduled</p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-1">Take a break or review your previous lessons.</p>
                    </div>
                  </div>
                )}
              </div>

              {todayRows.length > 0 && (
                <p className="text-[10px] text-center text-muted-foreground/40 font-bold uppercase tracking-[0.2em] pt-2">
                  Stay focused on your goals
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
