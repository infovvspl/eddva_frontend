import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Plus, Send, Calendar, Eye,
  Trash2, X, Info, Sparkles, Filter, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@/hooks/use-announcements";

const AnnouncementsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all", expiresAt: "" });
  const [error, setError] = useState("");

  const { data: announcements, isLoading, error: fetchError } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const announcementList = (announcements as any)?.announcements || (Array.isArray(announcements) ? announcements : []);

  const getBadgeColor = (audience: string) => {
    const a = (audience || "").toLowerCase();
    if (a.includes("all")) return "bg-foreground text-background";
    if (a.includes("student")) return "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
    if (a.includes("teacher")) return "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
    if (a.includes("admin")) return "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
    return "bg-secondary text-muted-foreground";
  };

  const handlePublish = async () => {
    if (!form.title || !form.body) return;
    setError("");
    try {
      await createAnnouncement.mutateAsync({
        title: form.title,
        body: form.body,
        targetRole: form.audience === "all" ? undefined : form.audience,
        expiresAt: form.expiresAt || undefined,
      });
      setForm({ title: "", body: "", audience: "all", expiresAt: "" });
      setShowForm(false);
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message || "Failed to publish announcement.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement.mutateAsync(id);
    } catch {
      // Silently fail or show toast
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Broadcasts</h1>
            <p className="text-muted-foreground font-medium">Manage global announcements and system alerts</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`h-12 px-6 rounded-2xl font-bold flex gap-2 transition-all active:scale-95 ${
              showForm ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400" : "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close Form" : "New Broadcast"}
          </Button>
        </header>

        {/* Creation Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 32 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="overflow-hidden">
              <div className="bg-card border-2 border-primary/20 rounded-[32px] p-8 shadow-xl">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-black uppercase tracking-tight">Draft New Message</h3>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Headline</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Scheduled Maintenance" className="w-full h-12 px-4 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground focus:bg-background focus:ring-2 focus:ring-primary/15 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Audience</label>
                      <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="w-full h-12 px-4 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground outline-none cursor-pointer">
                        <option value="all">All Ecosystem Users</option>
                        <option value="student">Students Only</option>
                        <option value="teacher">Teachers Only</option>
                        <option value="institute_admin">Institute Admins</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiration (Optional)</label>
                      <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full h-12 px-4 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Message Content</label>
                    <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the full details here..." rows={4} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground focus:bg-background focus:ring-2 focus:ring-primary/15 outline-none transition-all resize-none" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handlePublish} disabled={createAnnouncement.isPending || !form.title || !form.body} className="h-12 px-8 bg-foreground text-background rounded-2xl font-bold flex gap-2">
                      {createAnnouncement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Publish Broadcast
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">Recent Activity</span>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : fetchError ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Failed to load announcements.</div>
        ) : announcementList.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">No announcements yet. Create your first broadcast.</div>
        ) : (
          <div className="space-y-4">
            {announcementList.map((a: any, i: number) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group bg-card p-6 rounded-[32px] border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Megaphone className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-lg font-black text-foreground tracking-tight">{a.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getBadgeColor(a.targetRole || "all")}`}>
                          {a.targetRole || "All Users"}
                        </span>
                      </div>
                      <p className="text-muted-foreground font-medium leading-relaxed py-2 max-w-2xl">{a.body}</p>
                      <div className="flex items-center gap-6 pt-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</span>
                        </div>
                        {(a.sentCount != null || a.readCount != null) && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{(a.sentCount ?? a.readCount ?? 0).toLocaleString()} sent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deleteAnnouncement.isPending}
                    className="p-2 text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <Megaphone className="absolute -right-4 -bottom-4 w-32 h-32 text-secondary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 rounded-[32px] bg-primary/5 border border-primary/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-foreground/60 leading-tight">
            Broadcasts are sent via Push Notification and In-App Toast messages instantly. Email mirroring can be enabled in <span className="underline cursor-pointer">Notification Settings</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
