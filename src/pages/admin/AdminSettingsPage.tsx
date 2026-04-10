import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Calendar, CreditCard, Bell,
  Loader2, CheckCircle2, AlertTriangle, Plus, Trash2,
  ChevronRight, Sparkles, Users, GraduationCap, X,
  Upload, RefreshCw, Globe, Mail, MessageSquare,
  Smartphone, Zap, TrendingUp, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useInstituteBranding, useUpdateInstituteBranding,
  useInstituteSubscription, useUpdateBillingEmail,
  useInstituteNotificationPrefs, useUpdateInstituteNotificationPrefs,
  useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent,
} from "@/hooks/use-admin";

// ─── Types ─────────────────────────────────────────────────────────────────────

type SettingsTab = "branding" | "calendar" | "subscription" | "notifications";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "branding",      label: "Branding",       icon: <Palette className="w-4 h-4" /> },
  { id: "calendar",      label: "Academic Calendar", icon: <Calendar className="w-4 h-4" /> },
  { id: "subscription",  label: "Subscription",    icon: <CreditCard className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications",   icon: <Bell className="w-4 h-4" /> },
];

const EVENT_TYPES = [
  { value: "exam",    label: "Exam",     color: "#ef4444" },
  { value: "holiday", label: "Holiday",  color: "#10b981" },
  { value: "test",    label: "Test",     color: "#f59e0b" },
  { value: "lecture", label: "Lecture",  color: "#3b82f6" },
  { value: "other",   label: "Other",    color: "#8b5cf6" },
];

function eventTypeColor(type: string) {
  return EVENT_TYPES.find(t => t.value === type)?.color ?? "#8b5cf6";
}

// ─── Usage Bar ─────────────────────────────────────────────────────────────────

function UsageBar({ value, max, label, warn = 80 }: { value: number; max: number; label: string; warn?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const isWarn = pct >= warn;
  const isCrit = pct >= 95;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold ${isCrit ? "text-red-500" : isWarn ? "text-amber-500" : "text-foreground"}`}>
          {value} / {max}
        </span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${isCrit ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-primary"}`}
        />
      </div>
      {isWarn && (
        <p className={`text-xs flex items-center gap-1 ${isCrit ? "text-red-500" : "text-amber-500"}`}>
          <AlertTriangle className="w-3 h-3" />
          {isCrit ? "Limit almost reached — upgrade now" : `${100 - pct}% remaining`}
        </p>
      )}
    </div>
  );
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-primary" : "bg-secondary border border-border"}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

// ─── Branding Tab ──────────────────────────────────────────────────────────────

function BrandingTab() {
  const { data, isLoading } = useInstituteBranding();
  const update = useUpdateInstituteBranding();
  const [form, setForm] = useState({ logoUrl: "", brandColor: "#F97316", welcomeMessage: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm({
      logoUrl: data.logoUrl ?? "",
      brandColor: data.brandColor ?? "#F97316",
      welcomeMessage: data.welcomeMessage ?? "",
    });
  }, [data]);

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        logoUrl: form.logoUrl || undefined,
        brandColor: form.brandColor,
        welcomeMessage: form.welcomeMessage || undefined,
      });
      setSaved(true);
      toast.success("Branding updated successfully");
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("Failed to save branding");
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Preview card */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="h-2" style={{ backgroundColor: form.brandColor }} />
        <div className="p-6 bg-card flex items-center gap-4">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="Logo preview" className="w-16 h-16 rounded-2xl object-contain border border-border" />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
              style={{ backgroundColor: form.brandColor }}>
              {data?.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
          )}
          <div>
            <p className="font-bold text-foreground text-lg">{data?.name ?? "Your Institute"}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {form.welcomeMessage || "Welcome to your institute platform"}
            </p>
            {data?.subdomain && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Globe className="w-3 h-3" /> {data.subdomain}.eddva.in
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Logo URL</label>
        <p className="text-xs text-muted-foreground">Direct link to your institute logo (PNG, SVG recommended)</p>
        <div className="flex gap-3">
          <input
            placeholder="https://your-cdn.com/logo.png"
            value={form.logoUrl}
            onChange={e => setForm({ ...form, logoUrl: e.target.value })}
            className="flex-1 h-11 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
          {form.logoUrl && (
            <button onClick={() => setForm({ ...form, logoUrl: "" })}
              className="h-11 w-11 flex items-center justify-center bg-secondary border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Brand colour */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Brand Colour</label>
        <p className="text-xs text-muted-foreground">Primary colour used across buttons, highlights, and accents</p>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={form.brandColor}
            onChange={e => setForm({ ...form, brandColor: e.target.value })}
            className="w-14 h-14 rounded-xl border border-border cursor-pointer bg-secondary p-1"
          />
          <div className="space-y-1 flex-1">
            <input
              placeholder="#F97316"
              value={form.brandColor}
              onChange={e => setForm({ ...form, brandColor: e.target.value })}
              className="h-11 w-40 px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary font-mono"
            />
            <div className="flex gap-2 flex-wrap">
              {["#F97316","#3B82F6","#10B981","#EF4444","#8B5CF6","#F59E0B","#06B6D4","#EC4899"].map(c => (
                <button key={c} onClick={() => setForm({ ...form, brandColor: c })}
                  className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                  style={{ backgroundColor: c, borderColor: form.brandColor === c ? c : "transparent" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Welcome message */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Welcome Message</label>
        <p className="text-xs text-muted-foreground">Shown to students on their first login</p>
        <textarea
          rows={3}
          placeholder="Welcome to our platform — your journey to success starts here!"
          value={form.welcomeMessage}
          onChange={e => setForm({ ...form, welcomeMessage: e.target.value })}
          className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary resize-none transition-colors"
        />
      </div>

      <Button onClick={handleSave} disabled={update.isPending} className="gap-2">
        {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
        {saved ? "Saved!" : "Save Branding"}
      </Button>
    </div>
  );
}

// ─── Calendar Tab ──────────────────────────────────────────────────────────────

function CalendarTab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", type: "exam", date: "", endDate: "", description: "" });

  const { data: events = [], isLoading } = useCalendarEvents(year, month);
  const createEvent = useCreateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEvent.mutateAsync(form);
      toast.success("Event added to calendar");
      setForm({ title: "", type: "exam", date: "", endDate: "", description: "" });
      setShowForm(false);
    } catch {
      toast.error("Failed to create event");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast.success("Event removed");
    } catch {
      toast.error("Failed to remove event");
    }
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startPad = firstDay.getDay();

  const eventsByDate: Record<string, any[]> = {};
  events.forEach((ev: any) => {
    const key = ev.date?.split("T")[0];
    if (key) { eventsByDate[key] = [...(eventsByDate[key] ?? []), ev]; }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-secondary hover:bg-border transition-colors"><ChevronRight className="w-4 h-4 rotate-180" /></button>
          <h3 className="text-base font-bold text-foreground w-44 text-center">{monthLabel}</h3>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-secondary hover:bg-border transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      {/* Add event form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-card border border-border rounded-2xl p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">New Calendar Event</h4>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Event Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. JEE Main Mock Test — Physics"
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date *</label>
                <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Date (optional)</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional note"
                  className="w-full h-10 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" size="sm" disabled={createEvent.isPending} className="gap-2">
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Event
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Calendar grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="text-center py-2.5 text-xs font-bold text-muted-foreground uppercase">{d}</div>
          ))}
        </div>
        {/* Days */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-border/50 bg-secondary/10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayEvents = eventsByDate[dateStr] ?? [];
              const isToday = dateStr === today.toISOString().split("T")[0];
              const col = (startPad + i) % 7;
              return (
                <div key={dateStr}
                  className={`min-h-[80px] p-1.5 border-b border-r border-border/50 ${col === 6 ? "border-r-0" : ""} ${isToday ? "bg-primary/5" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${isToday ? "bg-primary text-white" : "text-foreground"}`}>
                    {dayNum}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev: any) => (
                      <div key={ev.id}
                        className="group flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-white truncate cursor-default hover:opacity-90"
                        style={{ backgroundColor: eventTypeColor(ev.type) }}
                        title={ev.title}>
                        <span className="flex-1 truncate">{ev.title}</span>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {EVENT_TYPES.map(t => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: t.color }} />
            <span className="text-xs text-muted-foreground">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming events list */}
      {events.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Events This Month</h4>
          <div className="space-y-2">
            {events.map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: eventTypeColor(ev.type) }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {ev.endDate ? ` – ${new Date(ev.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                    {ev.description ? ` · ${ev.description}` : ""}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize text-white"
                  style={{ backgroundColor: eventTypeColor(ev.type) }}>
                  {ev.type}
                </span>
                <button onClick={() => handleDelete(ev.id)} disabled={deleteEvent.isPending}
                  className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subscription Tab ──────────────────────────────────────────────────────────

const PLAN_FEATURES: Record<string, string[]> = {
  starter:    ["Up to 100 students", "3 teachers", "Basic analytics", "Email support"],
  growth:     ["Up to 500 students", "10 teachers", "Advanced analytics", "Priority support", "AI study plans"],
  scale:      ["Up to 2000 students", "30 teachers", "Full AI suite", "Dedicated support", "Custom branding"],
  enterprise: ["Unlimited students", "Unlimited teachers", "White-label", "SLA guarantee", "Custom integrations"],
};

function SubscriptionTab() {
  const { data, isLoading } = useInstituteSubscription();
  const updateEmail = useUpdateBillingEmail();
  const [billingEmail, setBillingEmail] = useState("");
  const [editEmail, setEditEmail] = useState(false);

  useEffect(() => { if (data?.billingEmail) setBillingEmail(data.billingEmail); }, [data]);

  const handleSaveEmail = async () => {
    try {
      await updateEmail.mutateAsync(billingEmail);
      toast.success("Billing email updated");
      setEditEmail(false);
    } catch { toast.error("Failed to update billing email"); }
  };

  if (isLoading) return <LoadingState />;
  if (!data) return null;

  const planFeatures = PLAN_FEATURES[data.plan?.toLowerCase()] ?? [];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current plan card */}
      <div className="relative rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Current Plan</span>
            </div>
            <h2 className="text-3xl font-black text-foreground">{data.planLabel}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              ₹{data.pricePerMonth.toLocaleString("en-IN")}/month
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${
              data.status === "active" ? "bg-emerald-500/10 text-emerald-600" :
              data.status === "trial"  ? "bg-amber-500/10 text-amber-600" :
              "bg-red-500/10 text-red-500"
            }`}>
              {data.status === "trial" ? `Trial` : data.status}
            </span>
            {data.status === "trial" && data.trialEndsAt && (
              <p className="text-xs text-muted-foreground">
                Ends {new Date(data.trialEndsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {planFeatures.map(f => (
            <span key={f} className="text-xs flex items-center gap-1 bg-background border border-border rounded-full px-3 py-1 text-foreground">
              <CheckCircle2 className="w-3 h-3 text-primary" /> {f}
            </span>
          ))}
        </div>
      </div>

      {/* Usage */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground">Usage</h3>
        <UsageBar value={data.studentCount} max={data.maxStudents} label="Students" />
        <UsageBar value={data.teacherCount} max={data.maxTeachers}  label="Teachers" />
      </div>

      {/* Upgrade prompt */}
      {data.nextPlan && (
        <div className="bg-gradient-to-br from-violet-500/10 to-primary/10 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">Upgrade to {data.nextPlan.label}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Get {data.nextPlan.maxStudents} students, {data.nextPlan.maxTeachers} teachers · ₹{data.nextPlan.pricePerMonth.toLocaleString("en-IN")}/month
              </p>
              <button className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Contact us to upgrade <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing email */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Billing Email</h3>
        <p className="text-xs text-muted-foreground">Invoices and renewal reminders are sent to this address</p>
        {editEmail ? (
          <div className="flex gap-3">
            <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)}
              className="flex-1 h-10 px-4 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary" />
            <Button size="sm" onClick={handleSaveEmail} disabled={updateEmail.isPending}>
              {updateEmail.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditEmail(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-foreground">{data.billingEmail || <span className="text-muted-foreground">Not set</span>}</p>
            <button onClick={() => setEditEmail(true)}
              className="text-xs font-semibold text-primary hover:underline">Edit</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notifications Tab ─────────────────────────────────────────────────────────

type NotifGroup = "studentAlerts" | "teacherAlerts" | "adminAlerts";

const NOTIF_GROUPS: { id: NotifGroup; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "studentAlerts", label: "Student Alerts", icon: <Users className="w-4 h-4" />, desc: "Test reminders, results, streak nudges sent to students" },
  { id: "teacherAlerts", label: "Teacher Alerts", icon: <GraduationCap className="w-4 h-4" />, desc: "Upload reminders, new doubt notifications, batch updates" },
  { id: "adminAlerts",   label: "Admin Alerts",   icon: <Bell className="w-4 h-4" />, desc: "Limit warnings, new enrollments, billing reminders" },
];

const CHANNELS: { key: keyof { push: boolean; whatsapp: boolean; email: boolean; sms: boolean }; label: string; icon: React.ReactNode }[] = [
  { key: "push",      label: "Push",      icon: <Smartphone className="w-4 h-4" /> },
  { key: "whatsapp",  label: "WhatsApp",  icon: <MessageSquare className="w-4 h-4" /> },
  { key: "email",     label: "Email",     icon: <Mail className="w-4 h-4" /> },
  { key: "sms",       label: "SMS",       icon: <Zap className="w-4 h-4" /> },
];

function NotificationsTab() {
  const { data, isLoading } = useInstituteNotificationPrefs();
  const updatePrefs = useUpdateInstituteNotificationPrefs();
  const [prefs, setPrefs] = useState<any>(null);

  useEffect(() => { if (data) setPrefs(data); }, [data]);

  const toggle = (group: NotifGroup, channel: string, val: boolean) => {
    setPrefs((p: any) => ({ ...p, [group]: { ...p[group], [channel]: val } }));
  };

  const handleSave = async () => {
    try {
      await updatePrefs.mutateAsync(prefs);
      toast.success("Notification preferences saved");
    } catch { toast.error("Failed to save preferences"); }
  };

  if (isLoading || !prefs) return <LoadingState />;

  return (
    <div className="space-y-5 max-w-2xl">
      {NOTIF_GROUPS.map(group => (
        <div key={group.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              {group.icon}
            </div>
            <div>
              <p className="font-semibold text-foreground">{group.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{group.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CHANNELS.map(ch => {
              const enabled = prefs[group.id]?.[ch.key] ?? false;
              return (
                <button
                  key={ch.key}
                  onClick={() => toggle(group.id, ch.key, !enabled)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    enabled
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-border/60"
                  }`}
                >
                  {ch.icon}
                  <span className="text-xs font-semibold">{ch.label}</span>
                  <Toggle checked={enabled} onChange={v => toggle(group.id, ch.key, v)} />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Button onClick={handleSave} disabled={updatePrefs.isPending} className="gap-2">
        {updatePrefs.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Save Preferences
      </Button>
    </div>
  );
}

// ─── Loading State ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("branding");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Institute Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage branding, calendar, subscription, and notifications</p>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-border gap-1 scrollbar-none -mb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "branding"      && <BrandingTab />}
          {activeTab === "calendar"      && <CalendarTab />}
          {activeTab === "subscription"  && <SubscriptionTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminSettingsPage;
