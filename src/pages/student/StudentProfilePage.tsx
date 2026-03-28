import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Flame, Zap, Trophy, Target, BookOpen,
  Loader2, Check, LogOut, Edit3, X, TrendingUp, BarChart2,
} from "lucide-react";
import { useStudentMe, useMyPerformance, useUpdateProfile } from "@/hooks/use-student";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProgressReportTree from "@/components/shared/ProgressReportTree";

// ─── Tier config ──────────────────────────────────────────────────────────────

const tierGradients: Record<string, string> = {
  champion:   "from-amber-400 to-orange-500",
  diamond:    "from-cyan-400 to-blue-500",
  platinum:   "from-violet-400 to-purple-600",
  gold:       "from-yellow-400 to-amber-500",
  silver:     "from-slate-300 to-slate-500",
  bronze:     "from-amber-700 to-orange-800",
  iron:       "from-slate-500 to-slate-700",
};

const nextTier: Record<string, string> = {
  iron: "bronze", bronze: "silver", silver: "gold",
  gold: "platinum", platinum: "diamond", diamond: "champion",
};

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({ me, onClose }: {
  me: { fullName: string; city?: string; student?: { targetCollege?: string; dailyStudyHours?: number } };
  onClose: () => void;
}) {
  const [fullName, setFullName]               = useState(me.fullName ?? "");
  const [city, setCity]                       = useState(me.city ?? "");
  const [targetCollege, setTargetCollege]     = useState(me.student?.targetCollege ?? "");
  const [dailyStudyHours, setDailyStudyHours] = useState(me.student?.dailyStudyHours ?? 4);

  const update = useUpdateProfile();

  const handleSave = () => {
    update.mutate(
      { fullName, city, targetCollege, dailyStudyHours },
      {
        onSuccess: () => { toast.success("Profile updated!"); onClose(); },
        onError:   () => toast.error("Failed to update profile"),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">Edit Profile</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: "Full Name", value: fullName, set: setFullName, type: "text" },
            { label: "City", value: city, set: setCity, type: "text" },
            { label: "Target College", value: targetCollege, set: setTargetCollege, type: "text" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">{f.label}</label>
              <input
                type={f.type} value={f.value}
                onChange={e => f.set(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
              Daily Study Goal: {dailyStudyHours}h
            </label>
            <input type="range" min={1} max={12} value={dailyStudyHours}
              onChange={e => setDailyStudyHours(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
        </div>
        <div className="px-5 pb-5">
          <button onClick={handleSave} disabled={update.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode; value: string | number; label: string; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 text-center">
      <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2"
        style={{ background: color + "22" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState<"profile" | "progress">("profile");
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: perf }                     = useMyPerformance();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  if (meLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const student     = me?.student;
  const tier        = student?.currentEloTier?.toLowerCase() ?? "iron";
  const gradient    = tierGradients[tier] ?? tierGradients.iron;
  const xp          = student?.xpPoints ?? 0;
  const streak      = student?.streakDays ?? 0;
  const accuracy    = perf?.overallAccuracy ?? 0;
  const rank        = perf?.estimatedRank;
  const totalTests  = perf?.totalTestsTaken ?? 0;
  const weakTopics  = perf?.weakTopics ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/40 border border-border rounded-xl p-1 w-fit">
        {(["profile", "progress"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize
              ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "progress" && <BarChart2 className="w-3.5 h-3.5" />}
            {t === "profile" && <User className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {tab === "progress" && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">My Progress Report</h2>
          <ProgressReportTree />
        </div>
      )}

      {tab === "profile" && (
      <>
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className={`h-20 bg-gradient-to-r ${gradient} opacity-30`} />
        <div className="px-5 pb-5 -mt-8 relative">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full border-4 border-card bg-primary/20 flex items-center justify-center mb-3">
            {me?.profilePictureUrl ? (
              <img src={me.profilePictureUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {me?.fullName?.charAt(0).toUpperCase() ?? "S"}
              </span>
            )}
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{me?.fullName ?? "Student"}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {student?.examTarget} · Class {student?.currentClass}
                {student?.examYear && ` · ${student.examYear}`}
              </p>
              {me?.city && <p className="text-xs text-muted-foreground mt-0.5">{me.city}</p>}
            </div>
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/40 border border-border text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors">
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>

          {/* ELO Badge */}
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-gradient-to-r ${gradient} text-white text-xs font-bold`}>
            <Trophy className="w-3.5 h-3.5" />
            <span className="capitalize">{tier}</span>
            {nextTier[tier] && <span className="opacity-70">→ {nextTier[tier]}</span>}
          </div>

          {/* Goal */}
          {student?.targetCollege && (
            <div className="flex items-center gap-1.5 mt-2">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Target: {student.targetCollege}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Flame className="w-5 h-5" />}    value={streak}                         label="Day Streak"    color="#f59e0b" />
        <StatCard icon={<Zap className="w-5 h-5" />}      value={xp.toLocaleString()}              label="XP Points"     color="#6366f1" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} value={`${accuracy.toFixed(0)}%`}     label="Accuracy"      color="#10b981" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} value={totalTests}                       label="Tests Taken"   color="#3b82f6" />
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-red-400" /> Areas to Improve
          </h3>
          <div className="space-y-3">
            {weakTopics.slice(0, 5).map(wt => (
              <div key={wt.topicId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{wt.topicName}</span>
                  <span className={`text-xs font-bold ${wt.accuracy < 50 ? "text-red-400" : "text-amber-400"}`}>
                    {wt.accuracy.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${wt.accuracy}%` }}
                    transition={{ duration: 0.7 }}
                    className="h-full rounded-full"
                    style={{ background: wt.accuracy < 50 ? "#ef4444" : "#f59e0b" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-3">Account Details</h3>
        <div className="space-y-3">
          {[
            { label: "Phone",          value: me?.phone ?? "—" },
            { label: "Email",          value: me?.email ?? "—" },
            { label: "Exam Target",    value: student?.examTarget ?? "—" },
            { label: "Exam Year",      value: student?.examYear ? String(student.examYear) : "—" },
            { label: "Daily Goal",     value: student?.dailyStudyHours ? `${student.dailyStudyHours}h / day` : "—" },
            { label: "Longest Streak", value: student?.longestStreak ? `${student.longestStreak} days` : "—" },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors">
        <LogOut className="w-4 h-4" /> Logout
      </button>

      {/* Edit Modal */}
      {showEdit && me && <EditProfileModal me={me} onClose={() => setShowEdit(false)} />}
      </>
      )}
    </div>
  );
}