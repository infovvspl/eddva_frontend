import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Plus, Send, Users, Calendar, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

const announcements = [
  { id: "1", title: "Platform Maintenance — March 20", body: "APEXIQ will undergo scheduled maintenance from 2 AM to 5 AM IST on March 20. All services will be temporarily unavailable.", audience: "All Users", createdAt: "2025-03-12", readCount: 12400, status: "published" },
  { id: "2", title: "New Battle Mode: Weekly Tournament", body: "We're launching Weekly Tournaments every Saturday at 6 PM! Top 10 players win exclusive rewards.", audience: "Students", createdAt: "2025-03-10", readCount: 8920, status: "published" },
  { id: "3", title: "Teacher Portal Update v2.4", body: "New features: AI question generation improvements, bulk upload for lectures, and enhanced analytics dashboard.", audience: "Teachers", createdAt: "2025-03-05", readCount: 456, status: "published" },
  { id: "4", title: "Fee Revision Notice — Q2 2025", body: "Starting April 1, plan pricing will be updated. Current subscribers will be grandfathered at existing rates for 6 months.", audience: "Institute Admins", createdAt: "2025-03-01", readCount: 89, status: "published" },
  { id: "5", title: "JEE Mains 2025 Results Integration", body: "Students can now link their JEE Mains scorecard to get personalized improvement plans.", audience: "Students", createdAt: "2025-02-25", readCount: 15200, status: "published" },
];

const AnnouncementsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Announcements"
        subtitle="Broadcast messages to platform users"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> New Announcement
          </Button>
        }
      />

      {/* New Announcement Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-foreground">Create Announcement</h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
            <input
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Announcement title..."
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
            <textarea
              value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Audience</label>
            <select
              value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
              className="h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none"
            >
              <option value="all">All Users</option>
              <option value="students">Students Only</option>
              <option value="teachers">Teachers Only</option>
              <option value="admins">Institute Admins Only</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button><Send className="w-4 h-4" /> Publish</Button>
          </div>
        </motion.div>
      )}

      {/* Announcement List */}
      <div className="space-y-3">
        {announcements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-surface p-5"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{a.title}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {a.audience}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {a.readCount.toLocaleString()} reads
                    </span>
                  </div>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground ml-12">{a.body}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AnnouncementsPage;
