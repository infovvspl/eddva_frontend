import { motion } from "framer-motion";
import { Video, BookOpen, MessageSquare, Users, Upload, Plus, HelpCircle } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import type { StatCardData } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";

const stats: StatCardData[] = [
  { label: "Total Lectures", value: 48, trend: 12, icon: Video, color: "info" },
  { label: "Active Quizzes", value: 6, icon: BookOpen, color: "primary" },
  { label: "Pending Doubts", value: 5, icon: MessageSquare, color: "destructive" },
  { label: "My Students", value: 342, trend: 4, icon: Users, color: "success" },
];

const todaySchedule = [
  { type: "lecture", title: "Thermodynamics — Carnot Cycle", time: "10:00 AM", batch: "JEE-2026 Morning" },
  { type: "test", title: "Weekly Physics Test #12", time: "2:00 PM", batch: "JEE-2026 Morning" },
  { type: "lecture", title: "Organic Chemistry — Alkenes", time: "4:00 PM", batch: "NEET-2026 Evening" },
];

const TeacherDashboard = () => {
  const { user } = useAuthStore();
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader 
        title={`Good morning, ${user?.name.split(" ").pop()}`}
        subtitle="Here's your day at a glance"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 card-surface p-5">
          <h3 className="font-semibold text-foreground mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            {todaySchedule.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-background rounded-lg">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  item.type === "lecture" ? "bg-info/10" : "bg-primary/10"
                }`}>
                  {item.type === "lecture" ? (
                    <Video className="w-4 h-4 text-info" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.batch}</p>
                </div>
                <span className="text-sm text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="card-surface p-5">
            <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Upload className="w-4 h-4" /> Upload Lecture
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" /> Create Quiz
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <HelpCircle className="w-4 h-4" /> View Doubts
              </Button>
            </div>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Pending Doubts</h3>
              <span className="text-2xl font-bold text-destructive">5</span>
            </div>
            <p className="text-xs text-muted-foreground">2 escalated · 3 new</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TeacherDashboard;
