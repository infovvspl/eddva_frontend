import { motion } from "framer-motion";
import { Users, Layout, Video, FileText, HelpCircle, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import type { StatCardData } from "@/lib/types";

const stats: StatCardData[] = [
  { label: "Total Students", value: 1284, trend: 8, icon: Users, color: "primary" },
  { label: "Active Batches", value: 12, trend: 2, icon: Layout, color: "info" },
  { label: "Lectures Today", value: 6, icon: Video, color: "success" },
  { label: "Tests Due", value: 3, icon: FileText, color: "warning" },
  { label: "Open Doubts", value: 28, trend: -5, icon: HelpCircle, color: "destructive" },
];

const activities = [
  { text: "Rahul completed Thermodynamics quiz", time: "2m ago", type: "quiz" },
  { text: "3 doubts escalated today", time: "15m ago", type: "doubt" },
  { text: "Mr. Sharma published a new lecture", time: "1h ago", type: "lecture" },
  { text: "New batch 'JEE-2026 Morning' created", time: "3h ago", type: "batch" },
  { text: "12 students joined via invite link", time: "5h ago", type: "students" },
];

const AdminDashboard = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <PageHeader title="Institute Dashboard" subtitle="Elite IIT Academy" />

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <StatCard {...s} />
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Batch Performance</h3>
        <div className="space-y-3">
          {[
            { name: "JEE-2026 Morning", avg: 72, attendance: 89 },
            { name: "NEET-2026 Evening", avg: 68, attendance: 82 },
            { name: "JEE Dropper Batch", avg: 76, attendance: 91 },
          ].map((b) => (
            <div key={b.name} className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span className="text-sm font-medium text-foreground">{b.name}</span>
              <div className="flex gap-6 text-sm">
                <span className="text-muted-foreground">Avg: <span className="text-foreground font-medium">{b.avg}%</span></span>
                <span className="text-muted-foreground">Attendance: <span className="text-foreground font-medium">{b.attendance}%</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <div>
                <p className="text-sm text-foreground">{a.text}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

export default AdminDashboard;
