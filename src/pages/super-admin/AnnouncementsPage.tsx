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
    if (a.includes("all")) return "bg-white text-gray-900 border-gray-200";
    if (a.includes("student")) return "bg-indigo-50 text-indigo-600 border-indigo-100";
    if (a.includes("teacher")) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (a.includes("admin")) return "bg-purple-50 text-purple-600 border-purple-100";
    return "bg-slate-100 text-slate-400 border-slate-200";
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
    <div className="min-h-screen bg-white p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-10">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-2">Platform Communication</h2>
            <h1 className="text-[42px] font-black text-slate-900 tracking-tight leading-tight">Broadcast Hub</h1>
            <p className="text-slate-400 text-[17px] mt-1 font-semibold">Managing global announcements and system alerts</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`h-14 px-8 rounded-2xl font-black flex gap-3 transition-all active:scale-95 text-[15px] shadow-2xl ${
              showForm ? "bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 shadow-none" : "bg-white text-gray-900 hover:bg-gray-100"
            }`}
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[3]" />}
            {showForm ? "Close Editor" : "New Broadcast"}
          </Button>
        </header>

        {/* Creation Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-12">
              <div className="bg-slate-50/50 border border-slate-100 rounded-[44px] p-10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center gap-4 mb-10 text-slate-900">
                  <div className="h-12 w-12 rounded-[18px] bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black">Draft Broadcast Message</h3>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Broadcast Headline</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Scheduled Infrastructure Maintenance" className="w-full h-16 px-6 bg-white border-2 border-slate-100 rounded-[24px] text-[16px] font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all shadow-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Target Audience</label>
                      <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="w-full h-16 px-6 bg-white border-2 border-slate-100 rounded-[24px] text-[15px] font-black text-slate-600 outline-none cursor-pointer shadow-sm">
                        <option value="all">Global Ecosystem</option>
                        <option value="student">Academic Hub (Students)</option>
                        <option value="teacher">Faculty Hub (Teachers)</option>
                        <option value="institute_admin">Institute Partners</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Expiration Protocol</label>
                      <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full h-16 px-6 bg-white border-2 border-slate-100 rounded-[24px] text-[15px] font-bold text-slate-900 outline-none shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Broadcast Content</label>
                    <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Detailed announcement details..." rows={5} className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-[32px] text-[16px] font-semibold text-slate-900 focus:border-indigo-600 outline-none transition-all resize-none shadow-sm" />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handlePublish} disabled={createAnnouncement.isPending || !form.title || !form.body} className="h-16 px-10 bg-white text-gray-900 rounded-[24px] font-black text-[16px] hover:bg-gray-100 shadow-2xl transition-all flex gap-3">
                      {createAnnouncement.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5 stroke-[2.5]" />}
                      Execute Broadcast
                    </Button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500 opacity-[0.03] blur-[60px] translate-x-12 -translate-y-12" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-900 scale-75">
               <Filter className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Governance Feed</span>
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
          <div className="space-y-6">
            {announcementList.map((a: any, i: number) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-[20px] bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors">
                      <Megaphone className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <h4 className="text-[19px] font-black text-slate-900 tracking-tight leading-tight">{a.title}</h4>
                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${getBadgeColor(a.targetRole || "all")}`}>
                          {a.targetRole || "Global Access"}
                        </span>
                      </div>
                      <p className="text-slate-500 font-semibold leading-relaxed py-3 max-w-2xl text-[15px]">{a.body}</p>
                      <div className="flex items-center gap-8 pt-2">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-[11px] font-black uppercase tracking-tight">{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                        </div>
                        {(a.sentCount != null || a.readCount != null) && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Eye className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-tight">{(a.sentCount ?? a.readCount ?? 0).toLocaleString()} Verified Reach</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deleteAnnouncement.isPending}
                    className="p-3 text-gray-800 hover:text-rose-600 hover:bg-rose-50 rounded-[14px] transition-all"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
                <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/20 opacity-0 group-hover:opacity-100 blur-[40px] transition-opacity translate-x-16 -translate-y-16 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-16 p-8 rounded-[36px] bg-slate-50 border border-slate-100 flex items-center gap-6">
          <div className="w-12 h-12 rounded-[18px] bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
            <Info className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
            "Broadcasts are executed as high-priority protocols. Notifications are dispatched via the Neural Notification System (NNS) instantly to all connected ecosystem devices."
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
