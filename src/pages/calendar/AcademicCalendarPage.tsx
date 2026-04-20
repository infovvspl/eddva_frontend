import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Trash2, X, ChevronRight, CalendarDays, AlertCircle, Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCalendarFeed, useCreateCalendarEvent, useDeleteCalendarEvent } from "@/hooks/use-calendar";
import type { InstituteCalendarEvent, LiveClassCalendarItem } from "@/lib/api/calendar";

const EVENT_TYPES = [
  { value: "exam", label: "Exam", color: "#ef4444" },
  { value: "holiday", label: "Holiday", color: "#10b981" },
  { value: "test", label: "Test", color: "#f59e0b" },
  { value: "lecture", label: "Lecture", color: "#3b82f6" },
  { value: "other", label: "Other", color: "#8b5cf6" },
];

const LIVE_COLOR = "#dc2626";

function eventColor(type: string) {
  return EVENT_TYPES.find((t) => t.value === type)?.color ?? "#8b5cf6";
}

type DayItem =
  | { kind: "institute"; id: string; title: string; type: string; color: string; raw: InstituteCalendarEvent }
  | { kind: "live"; id: string; title: string; type: string; color: string; raw: LiveClassCalendarItem };

function buildByDate(
  instituteEvents: InstituteCalendarEvent[],
  liveClasses: LiveClassCalendarItem[],
): Record<string, DayItem[]> {
  const byDate: Record<string, DayItem[]> = {};

  for (const ev of instituteEvents) {
    const key = (ev.date || "").split("T")[0];
    if (!key) continue;
    const item: DayItem = {
      kind: "institute",
      id: ev.id,
      title: ev.title,
      type: ev.type,
      color: ev.color || eventColor(ev.type),
      raw: ev,
    };
    byDate[key] = [...(byDate[key] ?? []), item];
  }

  for (const lec of liveClasses) {
    const key = new Date(lec.scheduledAt).toISOString().split("T")[0];
    const item: DayItem = {
      kind: "live",
      id: lec.id,
      title: lec.title,
      type: "live_class",
      color: LIVE_COLOR,
      raw: lec,
    };
    byDate[key] = [...(byDate[key] ?? []), item];
  }

  return byDate;
}

function mergedList(
  instituteEvents: InstituteCalendarEvent[],
  liveClasses: LiveClassCalendarItem[],
): { sortKey: string; label: string; sub: string; color: string; kind: string; id: string }[] {
  const rows: { sortKey: string; label: string; sub: string; color: string; kind: string; id: string }[] = [];
  for (const ev of instituteEvents) {
    rows.push({
      sortKey: ev.date,
      label: ev.title,
      sub: `${(ev.date || "").split("T")[0]}${ev.description ? ` · ${ev.description}` : ""}`,
      color: ev.color || eventColor(ev.type),
      kind: ev.type,
      id: ev.id,
    });
  }
  for (const lec of liveClasses) {
    const d = new Date(lec.scheduledAt);
    rows.push({
      sortKey: lec.scheduledAt,
      label: lec.title,
      sub: `${d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}${lec.batchName ? ` · ${lec.batchName}` : ""}`,
      color: LIVE_COLOR,
      kind: "Live class",
      id: lec.id,
    });
  }
  return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export interface AcademicCalendarPageProps {
  /** Teachers and institute admins can add/delete institute calendar events (not live sessions). */
  canManageEvents?: boolean;
  /** Optional page title override */
  pageTitle?: string;
}

export default function AcademicCalendarPage({
  canManageEvents = false,
  pageTitle = "Calendar",
}: AcademicCalendarPageProps) {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "exam",
    date: "",
    endDate: "",
    description: "",
  });
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useCalendarFeed(year, month);
  const createEvent = useCreateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const instituteEvents = data?.instituteEvents ?? [];
  const liveClasses = data?.liveClasses ?? [];

  const byDate = useMemo(
    () => buildByDate(instituteEvents, liveClasses),
    [instituteEvents, liveClasses],
  );

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay();
  const todayStr = today.toISOString().split("T")[0];

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
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
      });
      toast.success("Event added — students have been notified.");
      setForm({ title: "", type: "exam", date: "", endDate: "", description: "" });
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
    }
  };

  const listRows = useMemo(
    () => mergedList(instituteEvents, liveClasses),
    [instituteEvents, liveClasses],
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Exams, holidays, and scheduled live classes. {canManageEvents ? "Students see the same view." : "Events are added by your teachers or institute."}
          </p>
        </div>
        {canManageEvents && (
          <Button onClick={() => { setShowForm((v) => !v); setFormError(""); }} className="gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "Add Event"}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {canManageEvents && showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-card border border-border rounded-2xl p-5 space-y-4 overflow-hidden"
          >
            <h3 className="font-semibold text-foreground">New calendar event</h3>
            {formError && (
              <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
                <input
                  required
                  placeholder="e.g. JEE Main mock"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start date *</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">End date (optional)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
                <input
                  placeholder="Optional"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={createEvent.isPending} className="gap-2">
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save & notify students
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl bg-secondary hover:bg-border transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <h2 className="text-base font-bold text-foreground w-48 text-center">{monthLabel}</h2>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl bg-secondary hover:bg-border transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
        >
          Today
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[96px] border-b border-r border-border/40 bg-secondary/10" />
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
                  className={`min-h-[96px] p-1.5 border-b border-r border-border/40 transition-colors ${isLastCol ? "border-r-0" : ""} ${isToday ? "bg-primary/5" : "hover:bg-secondary/20"}`}
                >
                  <div
                    className={`w-7 h-7 mb-1 rounded-full flex items-center justify-center text-xs font-bold ${isToday ? "bg-primary text-white shadow-sm shadow-primary/40" : "text-foreground"}`}
                  >
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {evts.slice(0, 3).map((ev) => (
                      <div
                        key={`${ev.kind}-${ev.id}`}
                        title={ev.title}
                        className={`group flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white truncate leading-tight ${ev.kind === "live" ? "cursor-pointer hover:opacity-90" : ""}`}
                        style={{ backgroundColor: ev.color }}
                        onClick={() => handleChipClick(ev)}
                        onKeyDown={(e) => e.key === "Enter" && handleChipClick(ev)}
                        role={ev.kind === "live" ? "button" : undefined}
                      >
                        {ev.kind === "live" && <Radio className="w-3 h-3 shrink-0" />}
                        <span className="flex-1 truncate">{ev.title}</span>
                        {canManageEvents && ev.kind === "institute" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(ev);
                            }}
                            disabled={deleteEvent.isPending}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {evts.length > 3 && (
                      <p className="text-[10px] text-muted-foreground px-1 font-medium">
                        +{evts.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {EVENT_TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: t.color }} />
            <span className="text-xs text-muted-foreground capitalize">{t.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: LIVE_COLOR }} />
          <span className="text-xs text-muted-foreground">Live class</span>
        </div>
      </div>

      {!isLoading && listRows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            This month ({listRows.length})
          </h3>
          <div className="space-y-2">
            {listRows.map((row) => {
              const isLive = row.kind === "Live class";
              const ev = instituteEvents.find((e) => e.id === row.id);
              return (
                <div
                  key={`${row.kind}-${row.id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-secondary/30 transition-colors group"
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{row.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.sub}</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white capitalize shrink-0"
                    style={{ backgroundColor: row.color }}
                  >
                    {row.kind}
                  </span>
                  {isLive && (
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => navigate(`/live/${row.id}`)}>
                      Join
                    </Button>
                  )}
                  {canManageEvents && ev && (
                    <button
                      type="button"
                      onClick={() => handleDelete({ kind: "institute", id: ev.id, title: ev.title, type: ev.type, color: row.color, raw: ev })}
                      disabled={deleteEvent.isPending}
                      className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && listRows.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Nothing scheduled in {monthLabel}</p>
          <p className="text-sm mt-1">
            {canManageEvents ? "Add events or schedule a live class from Lectures." : "Your teachers will add dates and live classes here."}
          </p>
        </div>
      )}
    </motion.div>
  );
}
