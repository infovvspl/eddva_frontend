import { motion } from "framer-motion";
import { 
  Flame, Swords, Trophy, Brain, BookOpen, Video, 
  ArrowUp, Clock, Zap, ChevronRight, Lock, CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";

const todayTasks = [
  { icon: Video, title: "Watch Carnot Engine lecture", time: "45 min", color: "text-info", bg: "bg-info/10", done: true },
  { icon: BookOpen, title: "Topic Quiz: Thermodynamics", time: "20 min", color: "text-primary", bg: "bg-primary/10", done: true },
  { icon: Brain, title: "Practice: Heat Transfer", time: "30 min", color: "text-success", bg: "bg-success/10", done: false },
  { icon: Swords, title: "Battle at 7 PM", time: "Tonight", color: "text-ai", bg: "bg-ai/10", done: false },
  { icon: BookOpen, title: "Revision: Kinematic Equations", time: "25 min", color: "text-warning", bg: "bg-warning/10", done: false },
];

const subjects = [
  { name: "Physics", progress: 65, color: "from-info to-info/60" },
  { name: "Chemistry", progress: 40, color: "from-success to-success/60" },
  { name: "Mathematics", progress: 30, color: "from-primary to-primary/60" },
];

const activities = [
  { icon: CheckCircle, text: "Completed Thermodynamics quiz — 78% score", color: "text-success" },
  { icon: Swords, text: "Won battle against Priya — +32 ELO", color: "text-ai" },
  { icon: Flame, text: "7-day streak achieved!", color: "text-primary" },
  { icon: Lock, text: "Electrostatics still locked — need 70% in basics", color: "text-destructive" },
];

const weakTopics = ["Organic Chemistry", "Electrostatics", "Binomial Theorem"];

const StudentDashboard = () => {
  const { user } = useAuthStore();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Student Profile Mini */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card-surface p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-3">
              {user?.name.charAt(0)}
            </div>
            <h3 className="font-bold text-foreground">{user?.name}</h3>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20 font-medium">
                Gold III
              </span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1 text-primary">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">1,847 ELO</span>
            </div>
            {/* XP Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>XP to Platinum</span>
                <span>720 / 1000</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-warning rounded-full" style={{ width: "72%" }} />
              </div>
            </div>
            {/* Streak */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-foreground">7</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
          </div>
        </div>

        {/* Center: Main Content */}
        <div className="lg:col-span-6 space-y-6">
          {/* Today's Plan */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-lg">Today's Plan</h3>
              <span className="text-xs text-muted-foreground">2 of 5 done</span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: "40%" }} />
            </div>
            <div className="space-y-2">
              {todayTasks.map((task, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    task.done ? "opacity-60" : "bg-background hover:bg-foreground/[0.02]"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.bg}`}>
                    <task.icon className={`w-4 h-4 ${task.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium text-foreground ${task.done ? "line-through" : ""}`}>
                      {task.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{task.time}</span>
                  {task.done && <CheckCircle className="w-4 h-4 text-success" />}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Subject Progress */}
          <div className="card-surface p-5">
            <h3 className="font-bold text-foreground mb-4">Subject Progress</h3>
            <div className="grid grid-cols-3 gap-3">
              {subjects.map((subj) => (
                <div key={subj.name} className="bg-background rounded-xl p-4 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${subj.progress * 1.76} 176`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                      {subj.progress}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{subj.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-surface p-5">
            <h3 className="font-bold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <a.icon className={`w-4 h-4 shrink-0 ${a.color}`} />
                  <p className="text-sm text-foreground">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Rank & Battle */}
        <div className="lg:col-span-3 space-y-4">
          {/* Rank Card */}
          <div className="card-surface p-5">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Your Rank</h4>
            <div className="text-center">
              <p className="text-4xl font-extrabold text-primary">#142</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-success text-sm font-medium">
                <ArrowUp className="w-3.5 h-3.5" />
                14 positions this week
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { rank: 1, name: "Ananya S.", score: 2847 },
                { rank: 2, name: "Vikram R.", score: 2791 },
                { rank: 3, name: "Meera K.", score: 2756 },
              ].map((p) => (
                <div key={p.rank} className="flex items-center justify-between text-sm p-2 bg-background rounded-lg">
                  <span className="text-muted-foreground">#{p.rank}</span>
                  <span className="text-foreground font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Battle Countdown */}
          <div className="card-surface p-5 border-l-2 border-ai">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-ai" />
              <h4 className="text-sm font-semibold text-ai">Daily Battle</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Starts in</p>
            <p className="text-2xl font-bold text-foreground mb-1">2h 15m</p>
            <p className="text-xs text-muted-foreground mb-1">Topic: Thermodynamics</p>
            <p className="text-xs text-muted-foreground mb-3">312 players waiting</p>
            <Button variant="ai" size="sm" className="w-full">
              <Swords className="w-3.5 h-3.5" /> Join Battle
            </Button>
          </div>

          {/* Weak Topics */}
          <div className="card-surface p-5 border-l-2 border-destructive">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Weak Topics <span className="text-destructive">({weakTopics.length})</span>
            </h4>
            <div className="space-y-2">
              {weakTopics.map((t) => (
                <div key={t} className="text-sm text-destructive bg-destructive/5 px-3 py-1.5 rounded-lg">
                  {t}
                </div>
              ))}
            </div>
            <Button variant="destructive" size="sm" className="w-full mt-3">
              Practice Now
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;
