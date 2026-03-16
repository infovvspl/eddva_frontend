import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, Plus, Send, Users, Calendar, Eye, 
  Trash2, X, Info, Sparkles, Filter 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const announcements = [
  { id: "1", title: "Platform Maintenance — March 20", body: "APEXIQ will undergo scheduled maintenance from 2 AM to 5 AM IST on March 20. All services will be temporarily unavailable.", audience: "All Users", createdAt: "2026-03-12", readCount: 12400, status: "published", type: "system" },
  { id: "2", title: "New Battle Mode: Weekly Tournament", body: "We're launching Weekly Tournaments every Saturday at 6 PM! Top 10 players win exclusive rewards.", audience: "Students", createdAt: "2026-03-10", readCount: 8920, status: "published", type: "feature" },
  { id: "3", title: "Teacher Portal Update v2.4", body: "New features: AI question generation improvements, bulk upload for lectures, and enhanced analytics dashboard.", audience: "Teachers", createdAt: "2026-03-05", readCount: 456, status: "published", type: "update" },
  { id: "4", title: "Fee Revision Notice — Q2 2026", body: "Starting April 1, plan pricing will be updated. Current subscribers will be grandfathered at existing rates for 6 months.", audience: "Admins", createdAt: "2026-03-01", readCount: 89, status: "published", type: "billing" },
];

const AnnouncementsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });

  const getBadgeColor = (audience: string) => {
    switch (audience.toLowerCase()) {
      case 'all users': return 'bg-slate-900 text-white';
      case 'students': return 'bg-indigo-100 text-indigo-600';
      case 'teachers': return 'bg-emerald-100 text-emerald-600';
      case 'admins': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Broadcasts</h1>
            <p className="text-slate-500 font-medium">Manage global announcements and system alerts</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className={`h-12 px-6 rounded-2xl font-bold flex gap-2 transition-all active:scale-95 ${
              showForm ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
            }`}
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close Form" : "New Broadcast"}
          </Button>
        </header>

        {/* Creation Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border-2 border-indigo-100 rounded-[32px] p-8 shadow-xl shadow-indigo-50/50">
                <div className="flex items-center gap-2 mb-6 text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-black uppercase tracking-tight">Draft New Message</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Headline</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., Scheduled Maintenance"
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Audience</label>
                      <select
                        value={form.audience}
                        onChange={(e) => setForm({ ...form, audience: e.target.value })}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none appearance-none cursor-pointer"
                      >
                        <option value="all">All Ecosystem Users</option>
                        <option value="students">Students Only</option>
                        <option value="teachers">Teachers Only</option>
                        <option value="admins">Institute Admins</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiration (Optional)</label>
                      <input type="date" className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Message Content</label>
                    <textarea
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder="Write the full details here..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-bold flex gap-2">
                      <Send className="w-4 h-4" />
                      Publish Broadcast
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed Headers */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">Recent Activity</span>
          </div>
        </div>

        {/* Announcement List */}
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                    <Megaphone className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">{a.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getBadgeColor(a.audience)}`}>
                        {a.audience}
                      </span>
                    </div>
                    
                    <p className="text-slate-500 font-medium leading-relaxed py-2 max-w-2xl">{a.body}</p>
                    
                    <div className="flex items-center gap-6 pt-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{a.readCount.toLocaleString()} reads</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              {/* Subtle background icon for "premium" feel */}
              <Megaphone className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Empty State Help */}
        <div className="mt-12 p-6 rounded-[32px] bg-indigo-50/50 border border-indigo-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-indigo-900/60 leading-tight">
            Broadcasts are sent via Push Notification and In-App Toast messages instantly. Email mirroring can be enabled in <span className="underline cursor-pointer">Notification Settings</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;