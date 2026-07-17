import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Plus, Send, Calendar, Eye,
  X, Info, Sparkles, Filter, Loader2, AlertCircle, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Communications from "./Communications/CoachingCommunications";
import { MAINTENANCE_MESSAGE, MAINTENANCE_TITLE } from "@/components/shared/MaintenanceNotice";
import { createInstituteAnnouncement, listInstituteAnnouncements } from "@/lib/api/institute-announcements";
import { CustomSelect } from "@/components/ui/CustomSelect";

const AdminCommunicationPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all", expiresAt: "", type: "general" });
  const [error, setError] = useState("");
  const [announcementList, setAnnouncementList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "broadcast";
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    if (tabId !== "chat") {
      params.delete("userId");
    }
    window.history.replaceState(null, "", "?" + params.toString());
  };

  const loadAnnouncements = async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const res = await listInstituteAnnouncements();
      const items = res?.announcements ?? [];
      setAnnouncementList(Array.isArray(items) ? items : []);
    } catch (err: unknown) {
      setFetchError((err as any)?.response?.data?.message || "Failed to load announcements.");
      setAnnouncementList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  const getBadgeColor = (audience: string) => {
    const a = (audience || "").toLowerCase();
    if (a.includes("all")) return "bg-white text-gray-900 border-gray-200";
    if (a.includes("student")) return "bg-indigo-50 text-indigo-600 border-indigo-100";
    if (a.includes("teacher")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-slate-100 text-slate-400 border-slate-200";
  };

  const applyMaintenanceTemplate = () => {
    setForm((prev) => ({
      ...prev,
      title: MAINTENANCE_TITLE,
      body: MAINTENANCE_MESSAGE,
      audience: "all",
      type: "maintenance",
    }));
  };

  const handlePublish = async () => {
    if (!form.title || !form.body) return;
    setError("");
    setSaving(true);
    try {
      await createInstituteAnnouncement({
        title: form.title,
        body: form.body,
        targetRole: form.audience,
        expiresAt: form.expiresAt || undefined,
      });
      setForm({ title: "", body: "", audience: "all", expiresAt: "", type: "general" });
      setShowForm(false);
      await loadAnnouncements();
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message || "Failed to publish announcement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Communication Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Managing institute-wide announcements and chats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900/10 dark:bg-white/5 border border-border p-1 rounded-xl mr-2">
            <button
              onClick={() => handleTabChange('broadcast')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'broadcast'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Broadcast Hub
            </button>
            <button
              onClick={() => handleTabChange('chat')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'chat'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chats
            </button>
          </div>
          {activeTab === 'broadcast' && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className={`h-9 px-4 rounded-xl font-bold flex gap-2 transition-all text-xs border border-border bg-card hover:bg-secondary/40 text-foreground`}
            >
              {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showForm ? "Close Editor" : "New Broadcast"}
            </Button>
          )}
        </div>
      </header>

      {activeTab === 'chat' ? (
        <div className="w-full">
          <Communications heightClass="h-[calc(100dvh-180px)]" />
        </div>
      ) : (
        <>
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
                <div className="bg-card border border-border rounded-2xl p-5 md:p-6 relative overflow-hidden group">
                  <div className="flex items-center gap-3 mb-5 text-foreground">
                    <div className="h-10 w-10 rounded-xl bg-secondary/30 border border-border flex items-center justify-center text-indigo-500 shadow-sm">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold">Draft Broadcast Message</h3>
                  </div>

                  {error && (
                    <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-amber-500">Maintenance broadcast</p>
                          <p className="text-xs font-medium text-amber-500/80">
                            Fill the editor with a maintenance notice for your institute.
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={applyMaintenanceTemplate}
                          className="h-9 rounded-xl bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-700 shadow-none"
                        >
                          Use Maintenance Template
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Broadcast Headline</label>
                      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Schedule Change Update" className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Broadcast Type</label>
                        <CustomSelect
                          value={form.type}
                          options={[
                            { value: "general", label: "General" },
                            { value: "maintenance", label: "Maintenance" },
                          ]}
                          className="w-full"
                          onChange={(v: any) => setForm({ ...form, type: v })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Target Audience</label>
                        <CustomSelect
                          value={form.audience}
                          options={[
                            { value: "all", label: "All Users" },
                            { value: "student", label: "Students Only" },
                            { value: "teacher", label: "Teachers Only" },
                          ]}
                          className="w-full"
                          onChange={(v: any) => setForm({ ...form, audience: v })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Expiration Protocol</label>
                        <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm font-semibold text-foreground outline-none focus:border-indigo-500" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Broadcast Content</label>
                      <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Detailed announcement details..." rows={4} className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none" />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={handlePublish} disabled={saving || !form.title || !form.body} className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Execute Broadcast
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Communication Feed</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : fetchError ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Failed to load announcements.</div>
          ) : announcementList.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">No announcements yet. Create your first broadcast.</div>
          ) : (
            <div className="space-y-4">
              {announcementList.map((a: any, i: number) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group bg-card p-5 rounded-2xl border border-border shadow-sm hover:border-indigo-500/30 transition-all relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary/40 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors">
                        <Megaphone className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-base font-bold text-foreground tracking-tight leading-tight">{a.title}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getBadgeColor((a.targetRoles?.[0] || a.targetRole || "all"))}`}>
                            {a.targetRoles?.[0] || a.targetRole || "Global Access"}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{a.content || a.body}</p>
                        <div className="flex items-center gap-6 pt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-semibold">{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                          </div>
                          {(a.sentCount != null || a.readCount != null) && (
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              <span className="font-semibold">{(a.sentCount ?? a.readCount ?? 0).toLocaleString()} Verified Reach</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 p-6 rounded-2xl bg-secondary/20 border border-border flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-indigo-500 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
              "Broadcasts are executed as high-priority protocols. Notifications are dispatched via the Neural Notification System (NNS) instantly to all connected ecosystem devices."
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCommunicationPage;
