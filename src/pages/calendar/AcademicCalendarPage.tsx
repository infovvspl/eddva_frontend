import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Trash2, X, ChevronRight, CalendarDays, AlertCircle, Radio, ChevronDown, Brain,
  Search, BookOpen, Users, ClipboardList, Smile, CalendarRange, Clock, Sparkles, Building, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  useCalendarBatches, 
  useCalendarFeed, 
  useCalendarStats, 
  useCreateCalendarEvent, 
  useDeleteCalendarEvent 
} from "@/hooks/use-calendar";
import { useWeeklyPlan } from "@/hooks/use-student";
import type { InstituteCalendarEvent, LiveClassCalendarItem } from "@/lib/api/calendar";
import type { StudyPlanItem } from "@/lib/api/student";
import { CustomSelect } from "@/components/ui/CustomSelect";

// Color mapping per requirement
const TYPE_COLOR_MAP: Record<string, string> = {
  lecture: "#3b82f6", // Blue
  live_class: "#10b981", // Green
  assignment: "#f97316", // Orange
  holiday: "#14b8a6", // Teal
  vacation: "#14b8a6", // Teal
  exam: "#ef4444", // Red
  test: "#ef4444", // Red
  mock_test: "#eab308", // Yellow
  pt_exam: "#ef4444", // Red
  half_yearly: "#ef4444", // Red
  annual_exam: "#ef4444", // Red
  meeting: "#8b5cf6", // Purple
  birthday: "#ec4899", // Pink
  personal: "#6b7280", // Gray
  other: "#6b7280",
  study_plan: "#6366f1",
};

const TYPE_ICON_MAP: Record<string, any> = {
  lecture: BookOpen,
  live_class: Radio,
  assignment: ClipboardList,
  holiday: Smile,
  vacation: Smile,
  exam: CalendarRange,
  test: CalendarRange,
  mock_test: CalendarRange,
  pt_exam: CalendarRange,
  half_yearly: CalendarRange,
  annual_exam: CalendarRange,
  meeting: Users,
  birthday: Smile,
  personal: Clock,
  study_plan: Brain,
};

const EVENT_CATEGORIES = [
  {
    group: "Academic Events",
    types: [
      { value: "lecture", label: "Lecture", color: "#3b82f6" },
      { value: "live_class", label: "Live Class", color: "#10b981" },
      { value: "assignment", label: "Assignment", color: "#f97316" },
    ],
  },
  {
    group: "Exams",
    types: [
      { value: "mock_test", label: "Mock Test", color: "#eab308" },
      { value: "exam", label: "Exam", color: "#ef4444" },
    ],
  },
  {
    group: "Institute Life",
    types: [
      { value: "holiday", label: "Holiday", color: "#14b8a6" },
      { value: "meeting", label: "Meeting", color: "#8b5cf6" },
      { value: "birthday", label: "Birthday", color: "#ec4899" },
      { value: "personal", label: "Personal Reminder", color: "#6b7280" },
    ],
  },
];

const FILTER_BADGES = [
  { value: "all", label: "All" },
  { value: "lecture", label: "Lectures" },
  { value: "live_class", label: "Live Classes" },
  { value: "mock_test", label: "Mock Tests" },
  { value: "exam", label: "Exams" },
  { value: "holiday", label: "Holidays" },
  { value: "meeting", label: "Meetings" },
  { value: "assignment", label: "Assignments" },
  { value: "personal", label: "Personal" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PUBLIC_HOLIDAYS = [
  { date: "2026-01-26", title: "Republic Day 🇮🇳", type: "holiday" },
  { date: "2026-03-03", title: "Holi 🎨", type: "holiday" },
  { date: "2026-03-20", title: "Id-ul-Fitr (Eid) 🌙", type: "holiday" },
  { date: "2026-04-03", title: "Good Friday ✝️", type: "holiday" },
  { date: "2026-04-14", title: "Dr. Ambedkar Jayanti", type: "holiday" },
  { date: "2026-08-15", title: "Independence Day 🇮🇳", type: "holiday" },
  { date: "2026-10-02", title: "Gandhi Jayanti 🕊️", type: "holiday" },
  { date: "2026-12-25", title: "Christmas Day 🎄", type: "holiday" },
];

export interface AcademicCalendarPageProps {
  canManageEvents?: boolean;
  pageTitle?: string;
}

export default function AcademicCalendarPage({
  canManageEvents = false,
  pageTitle = "Calendar & Schedule",
}: AcademicCalendarPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [viewFilter, setViewFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day" | "agenda">("month");
  
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

  // Live real-time stats & feed fetching
  const { data: stats } = useCalendarStats(year, month);
  const { data: feed, isLoading } = useCalendarFeed(year, month);
  const { data: eventBatches = [] } = useCalendarBatches(canManageEvents);
  
  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;
  const { data: studyPlanData = [] } = useWeeklyPlan(startOfMonth, endOfMonth);

  const createEvent = useCreateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const instituteEvents = feed?.instituteEvents ?? [];
  const liveClasses = feed?.liveClasses ?? [];
  const studyPlan = studyPlanData || [];

  // Parse and merge all events for current month
  const allEvents = useMemo(() => {
    const list: any[] = [];

    // 1. Static Public Holidays
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    PUBLIC_HOLIDAYS.forEach(ph => {
      if (ph.date.startsWith(prefix)) {
        list.push({
          id: `ph-${ph.date}-${ph.title}`,
          title: ph.title,
          type: "holiday",
          date: `${ph.date}T00:00:00.000Z`,
          description: "Public Holiday",
          color: TYPE_COLOR_MAP.holiday,
          raw: null
        });
      }
    });

    // 2. Institute events
    instituteEvents.forEach(ev => {
      const dateStr = (ev.date || "").split("T")[0];
      if (!dateStr) return;
      
      if (ev.endDate) {
        const endStr = ev.endDate.split("T")[0];
        let current = new Date(dateStr + "T00:00:00.000Z");
        const end = new Date(endStr + "T00:00:00.000Z");
        while (current.getTime() <= end.getTime()) {
          const key = current.toISOString().split("T")[0];
          list.push({
            id: `${ev.id}-${key}`,
            title: ev.title,
            type: ev.type,
            date: `${key}T09:00:00.000Z`,
            description: ev.description,
            color: TYPE_COLOR_MAP[ev.type] ?? ev.color ?? TYPE_COLOR_MAP.other,
            raw: ev
          });
          current.setDate(current.getDate() + 1);
        }
      } else {
        list.push({
          id: ev.id,
          title: ev.title,
          type: ev.type,
          date: ev.date,
          description: ev.description,
          color: TYPE_COLOR_MAP[ev.type] ?? ev.color ?? TYPE_COLOR_MAP.other,
          raw: ev
        });
      }
    });

    // 3. Live classes, assignments, mock tests
    liveClasses.forEach(lc => {
      const type = (lc as any).type || "live_class";
      list.push({
        id: lc.id,
        title: lc.title,
        type: type,
        date: lc.scheduledAt || lc.date,
        description: lc.description,
        color: TYPE_COLOR_MAP[type] ?? TYPE_COLOR_MAP.other,
        raw: lc
      });
    });

    // 4. Study plans
    studyPlan.forEach(sp => {
      if (sp.scheduledDate) {
        list.push({
          id: sp.id,
          title: sp.title,
          type: "study_plan",
          date: sp.scheduledDate,
          description: `Study Plan · ${sp.status}`,
          color: TYPE_COLOR_MAP.study_plan,
          raw: sp
        });
      }
    });

    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [instituteEvents, liveClasses, studyPlan, year, month]);

  // Handle instant search & tag filter
  const filteredEvents = useMemo(() => {
    let list = allEvents;
    if (viewFilter !== "all") {
      list = list.filter(ev => {
        if (viewFilter === "lecture") return ev.type === "lecture";
        if (viewFilter === "live_class") return ev.type === "live_class";
        if (viewFilter === "mock_test") return ev.type === "mock_test";
        if (viewFilter === "exam") return ["exam", "test", "pt_exam", "half_yearly", "annual_exam"].includes(ev.type);
        if (viewFilter === "holiday") return ["holiday", "vacation"].includes(ev.type);
        if (viewFilter === "meeting") return ev.type === "meeting";
        if (viewFilter === "assignment") return ev.type === "assignment";
        if (viewFilter === "personal") return ["personal", "birthday"].includes(ev.type);
        return ev.type === viewFilter;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(ev => 
        (ev.title || "").toLowerCase().includes(q) ||
        (ev.description || "").toLowerCase().includes(q) ||
        (ev.raw?.batchName || "").toLowerCase().includes(q) ||
        (ev.raw?.teacherName || "").toLowerCase().includes(q) ||
        (ev.raw?.topicName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allEvents, viewFilter, searchQuery]);

  // Today's Agenda
  const todayEvents = useMemo(() => {
    const todayPrefix = today.toISOString().split("T")[0];
    return allEvents
      .filter((ev) => ev.date.split("T")[0] === todayPrefix)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allEvents]);

  // Upcoming 10 Events
  const upcomingEvents = useMemo(() => {
    const nowStr = today.toISOString();
    return allEvents
      .filter((ev) => ev.date >= nowStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [allEvents]);

  // Bottom Timeline tomorrow onwards
  const timelineDays = useMemo(() => {
    const days: Record<string, any[]> = {};
    const nowStr = today.toISOString().split("T")[0];
    allEvents
      .filter(ev => ev.date.split("T")[0] > nowStr)
      .forEach(ev => {
        const d = ev.date.split("T")[0];
        if (!days[d]) days[d] = [];
        days[d].push(ev);
      });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 5);
  }, [allEvents]);

  // Month navigation helpers
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelectedDate(today);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      await createEvent.mutateAsync({
        title: form.title,
        type: form.type as any,
        date: form.date,
        endDate: form.endDate || undefined,
        description: form.description || undefined,
        batchIds: form.batchIds,
      });
      toast.success("Event added successfully.");
      setForm({ title: "", type: "holiday", date: "", endDate: "", description: "", batchIds: [] });
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to add event.");
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteEvent.mutateAsync(itemId);
      toast.success("Event removed successfully");
    } catch {
      toast.error("Failed to remove event");
    }
  };

  const handleItemClick = (item: any) => {
    if (item.type === "live_class") {
      navigate(`/live/${item.id}`);
    } else if (item.type === "mock_test") {
      navigate(canManageEvents ? `/admin/mock-tests/${item.id}/results` : `/student/mock-tests/${item.id}`);
    } else if (item.type === "assignment" && item.raw?.lectureId) {
      navigate(canManageEvents ? `/teacher/lectures?action=assignments&lectureId=${item.raw.lectureId}` : `/student/lectures/${item.raw.lectureId}#assignments`);
    }
  };

  // Month rendering calculation
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay();

  // Week view calculation
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day;
    const startOfWeek = new Date(current.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const nd = new Date(startOfWeek);
      nd.setDate(startOfWeek.getDate() + i);
      return nd;
    });
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-6 w-full p-4 sm:p-6 bg-slate-50/50 min-h-screen">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {canManageEvents
              ? "Manage academic operations, schedule tasks, and track logs."
              : "Access schedules, deadlines, lectures, and tasks."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Calendar Views Toggles */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(["month", "week", "day", "agenda"] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  calendarView === view
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {canManageEvents && (
            <Button
              onClick={() => { setShowForm((v) => !v); setFormError(""); }}
              className="gap-2 rounded-xl h-10 px-5 font-bold shadow-sm"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancel" : "Create Event"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Event Filters & Search ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filters badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_BADGES.map((badge) => (
            <button
              key={badge.value}
              onClick={() => setViewFilter(badge.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                viewFilter === badge.value
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {badge.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search classes, rooms, teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* ── Create Event Form Modal ── */}
      <AnimatePresence>
        {canManageEvents && showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreate}
            className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-lg"
          >
            <h3 className="font-bold text-sm text-slate-900">New Calendar Event</h3>
            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Title *</label>
                <input
                  required
                  placeholder="e.g. Physics Mock Test"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Category</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none bg-white cursor-pointer"
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
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Start Date *</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">End Date (optional)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Description</label>
                <input
                  placeholder="Optional details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Visible to courses (optional)</label>
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      checked={form.batchIds.length === 0}
                      onChange={(e) => { if (e.target.checked) setForm({ ...form, batchIds: [] }); }}
                    />
                    Show to all courses
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-24 overflow-auto">
                    {eventBatches.map((batch) => {
                      const checked = form.batchIds.includes(batch.id);
                      return (
                        <label key={batch.id} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
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
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" className="rounded-xl h-10 font-bold" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createEvent.isPending} className="rounded-xl h-10 px-5 font-bold">
                {createEvent.isPending ? "Saving..." : "Save Event"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Main Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Summary Cards */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 pl-1">Operations Summary</h2>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {[
              { label: "Lectures", count: allEvents.filter(e => e.type === "lecture").length, icon: BookOpen, color: "text-blue-500 bg-blue-50/50 border-blue-100" },
              { label: "Live Classes", count: allEvents.filter(e => e.type === "live_class").length, icon: Radio, color: "text-emerald-600 bg-emerald-50/50 border-emerald-100" },
              { label: "Mock Tests", count: allEvents.filter(e => e.type === "mock_test").length, icon: ClipboardList, color: "text-yellow-600 bg-yellow-50/50 border-yellow-100" },
              { label: "Holidays", count: allEvents.filter(e => e.type === "holiday" || e.type === "vacation").length, icon: Smile, color: "text-teal-600 bg-teal-50/50 border-teal-100" },
              { label: "Meetings", count: allEvents.filter(e => e.type === "meeting").length, icon: Users, color: "text-purple-600 bg-purple-50/50 border-purple-100" },
              { label: "Pending Assignments", count: allEvents.filter(e => e.type === "assignment").length, icon: ClipboardList, color: "text-orange-500 bg-orange-50/50 border-orange-100" },
            ].map((card, i) => (
              <div key={i} className={`flex items-center gap-3.5 bg-white border border-slate-200/60 p-3.5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                  <p className="text-lg font-black text-slate-900 leading-tight mt-0.5">{card.count}</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">This Month</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Calendar Panel */}
        <div className="lg:col-span-6 space-y-5">
          {/* Month Controller Navigation */}
          <div className="flex items-center justify-between bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180 text-slate-600" />
              </button>

              <div className="flex items-center bg-secondary/30 border border-border rounded-xl overflow-hidden">
                <CustomSelect
                  value={month}
                  options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
                  className="w-full"
                />
                <div className="w-[1px] h-4 bg-border" />
                <CustomSelect
                  value={year}
                  options={yearOptions.map((y) => ({ value: y, label: y }))}
                  className="w-full"
                />
              </div>

              <button onClick={nextMonth} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <button
              onClick={goToday}
              className="h-8 px-4 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
            >
              Today
            </button>
          </div>

          {/* Render Active View */}
          <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-36 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing schedule...</p>
              </div>
            ) : calendarView === "month" ? (
              /* ── Month Grid View ── */
              <div>
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {/* Start padding */}
                  {Array.from({ length: startPad }).map((_, i) => (
                    <div key={`pad-${i}`} className="min-h-[105px] border-b border-r border-slate-100/50 bg-slate-50/10" />
                  ))}
                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const evts = filteredEvents.filter(e => e.date.split("T")[0] === dateStr);
                    const isToday = dateStr === today.toISOString().split("T")[0];
                    const isSelected = dateStr === selectedDate.toISOString().split("T")[0];

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDate(new Date(year, month - 1, day))}
                        className={`min-h-[105px] p-2 border-b border-r border-slate-100/50 flex flex-col justify-between transition-all cursor-pointer group ${
                          isToday ? "bg-blue-50/10" : isSelected ? "bg-slate-50" : "hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isToday ? "bg-slate-900 text-white shadow-sm" : isSelected ? "bg-slate-200 text-slate-800" : "text-slate-600 group-hover:text-slate-900"
                          }`}>
                            {day}
                          </span>
                        </div>

                        <div className="space-y-1 mt-1.5">
                          {evts.slice(0, 3).map((ev) => {
                            const Icon = TYPE_ICON_MAP[ev.type] || Clock;
                            return (
                              <div
                                key={ev.id}
                                title={ev.title}
                                onClick={(e) => { e.stopPropagation(); handleItemClick(ev); }}
                                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold truncate leading-tight border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all hover:scale-[1.01]"
                                style={{ 
                                  backgroundColor: `${ev.color}10`, 
                                  borderColor: `${ev.color}20`,
                                  color: ev.color 
                                }}
                              >
                                <Icon className="w-2 h-2 shrink-0" />
                                <span className="truncate flex-1">{ev.title}</span>
                              </div>
                            );
                          })}
                          {evts.length > 3 && (
                            <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider text-center">
                              +{evts.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : calendarView === "week" ? (
              /* ── Week View ── */
              <div className="divide-y divide-slate-100">
                {weekDays.map((day) => {
                  const dateStr = day.toISOString().split("T")[0];
                  const evts = filteredEvents.filter(e => e.date.split("T")[0] === dateStr);
                  const isToday = dateStr === today.toISOString().split("T")[0];

                  return (
                    <div key={dateStr} className={`p-4 flex gap-4 ${isToday ? "bg-blue-50/5" : ""}`}>
                      <div className="w-16 shrink-0 flex flex-col items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black mt-1 ${
                          isToday ? "bg-slate-900 text-white shadow-sm" : "text-slate-700"
                        }`}>
                          {day.getDate()}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2">
                        {evts.length > 0 ? (
                          evts.map(ev => {
                            const Icon = TYPE_ICON_MAP[ev.type] || Clock;
                            return (
                              <div
                                key={ev.id}
                                onClick={() => handleItemClick(ev)}
                                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.02)] transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ev.color}15`, color: ev.color }}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-800 truncate">{ev.title}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{ev.type}</p>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[10px] text-slate-400 font-medium py-2">No events scheduled.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : calendarView === "day" ? (
              /* ── Day View ── */
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Schedule Details</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {filteredEvents.filter(e => e.date.split("T")[0] === selectedDate.toISOString().split("T")[0]).length > 0 ? (
                    filteredEvents
                      .filter(e => e.date.split("T")[0] === selectedDate.toISOString().split("T")[0])
                      .map((ev) => {
                        const Icon = TYPE_ICON_MAP[ev.type] || Clock;
                        return (
                          <div
                            key={ev.id}
                            onClick={() => handleItemClick(ev)}
                            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.01)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.02)] transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ev.color}15`, color: ev.color }}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate">{ev.title}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                                  {ev.type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {canManageEvents && ev.id.startsWith("evt_") && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <CalendarDays className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nothing Scheduled</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Take a break or review study material.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Agenda List View ── */
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((ev) => {
                    const Icon = TYPE_ICON_MAP[ev.type] || Clock;
                    const dateObj = new Date(ev.date);
                    return (
                      <div key={ev.id} onClick={() => handleItemClick(ev)} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ev.color}12`, color: ev.color }}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{ev.title}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                              {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border border-slate-100 text-slate-500 bg-slate-50">
                          {ev.type}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-xs text-slate-400 font-medium py-12">No upcoming events matching filter.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Today's Agenda & UpcomingTimeline */}
        <div className="lg:col-span-3 space-y-5">
          {/* Today's Agenda Panel */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Today's Agenda</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                {today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>

            <div className="space-y-2.5">
              {todayEvents.length > 0 ? (
                todayEvents.map((ev) => {
                  const Icon = TYPE_ICON_MAP[ev.type] || Clock;
                  const timeStr = new Date(ev.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                  return (
                    <div
                      key={ev.id}
                      onClick={() => handleItemClick(ev)}
                      className="p-3 border border-slate-200/50 rounded-2xl flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer"
                      style={{ backgroundColor: `${ev.color}05` }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ev.color}15`, color: ev.color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-800 truncate">{ev.title}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{timeStr}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Smile className="w-6 h-6 text-slate-350 mx-auto mb-1.5" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nothing Today</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Enjoy your day!</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming timeline list */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Upcoming Events</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Next 10 Schedule Items</p>
            </div>

            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((ev) => {
                  const Icon = TYPE_ICON_MAP[ev.type] || Clock;
                  const dateObj = new Date(ev.date);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => handleItemClick(ev)}
                      className="flex gap-3 items-start group cursor-pointer"
                    >
                      <div className="w-9 text-right shrink-0">
                        <p className="text-[9px] font-black text-slate-800 uppercase tracking-wider">
                          {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div className="w-0.5 bg-slate-100 self-stretch relative flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full absolute" style={{ backgroundColor: ev.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-slate-700 truncate group-hover:text-slate-900 transition-colors leading-tight">{ev.title}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] text-slate-400 font-medium py-4 text-center">No upcoming events scheduled.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Timeline Row ── */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Weekly Forecast</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {timelineDays.map(([dateKey, evts]) => {
            const dateObj = new Date(dateKey + "T00:00:00.000Z");
            const labelStr = dateKey === new Date(today.getTime() + 86400000).toISOString().split("T")[0]
              ? "Tomorrow"
              : dateObj.toLocaleDateString("en-US", { weekday: "long" });

            return (
              <div key={dateKey} className="p-3 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{labelStr}</p>
                <div className="space-y-1.5">
                  {evts.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => handleItemClick(ev)}
                      className="p-2 bg-white border border-slate-200/50 rounded-xl flex flex-col gap-1 hover:border-slate-300 transition-colors cursor-pointer"
                    >
                      <p className="text-[10px] font-black text-slate-800 truncate leading-tight">{ev.title}</p>
                      <span className="text-[7.5px] font-black uppercase tracking-wider w-fit px-1.5 py-0.5 rounded" style={{ backgroundColor: `${ev.color}15`, color: ev.color }}>
                        {ev.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {timelineDays.length === 0 && (
            <div className="col-span-5 py-6 text-center text-slate-400 text-xs font-medium">
              No upcoming events forecasted for the next few days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
