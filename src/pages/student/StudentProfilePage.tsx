import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Flame, Zap, Trophy, Target, BookOpen,
  Loader2, Check, LogOut, Edit3, X, TrendingUp, BarChart2,
  Mail, Phone, MapPin, Calendar, Star,
} from "lucide-react";
import { useStudentMe, useMyPerformance, useUpdateProfile } from "@/hooks/use-student";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProgressReportTree from "@/components/shared/ProgressReportTree";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

const tierGradients: Record<string, string> = {
  champion: "from-amber-400 to-orange-500", diamond: "from-cyan-400 to-blue-500",
  platinum: "from-violet-400 to-purple-600", gold: "from-yellow-400 to-amber-500",
  silver: "from-slate-300 to-slate-500", bronze: "from-amber-700 to-orange-800",
  iron: `from-[${BLUE}] to-[${BLUE_M}]`,
};

const tierColors: Record<string, string> = {
  champion: "#f59e0b", diamond: "#06b6d4", platinum: "#8b5cf6",
  gold: "#f59e0b", silver: "#94a3b8", bronze: "#a16207", iron: BLUE,
};

const nextTier: Record<string, string> = {
  iron: "bronze", bronze: "silver", silver: "gold",
  gold: "platinum", platinum: "diamond", diamond: "champion",
};

// ─── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ me, onClose }: {
  me: { fullName: string; city?: string; student?: { targetCollege?: string; dailyStudyHours?: number } };
  onClose: () => void;
}) {
  const [fullName, setFullName]               = useState(me.fullName ?? "");
  const [city, setCity]                       = useState(me.city ?? "");
  const [targetCollege, setTargetCollege]     = useState(me.student?.targetCollege ?? "");
  const [dailyStudyHours, setDailyStudyHours] = useState(me.student?.dailyStudyHours ?? 4);
  const update = useUpdateProfile();

  const inp = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Edit Profile</h3>
            <p className="text-xs text-gray-400">Update your personal details</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Full Name",       value: fullName,       set: setFullName       },
            { label: "City",            value: city,           set: setCity           },
            { label: "Target College",  value: targetCollege,  set: setTargetCollege  },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{f.label}</label>
              <input type="text" value={f.value} onChange={e => f.set(e.target.value)} className={inp} />
            </div>
          ))}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
              Daily Study Goal — <span style={{ color: BLUE }}>{dailyStudyHours}h</span>
            </label>
            <input type="range" min={1} max={12} value={dailyStudyHours}
              onChange={e => setDailyStudyHours(Number(e.target.value))}
              className="w-full" style={{ accentColor: BLUE }} />
          </div>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={() => update.mutate(
              { fullName, city, targetCollege, dailyStudyHours },
              { onSuccess: () => { toast.success("Profile updated!"); onClose(); }, onError: () => toast.error("Failed") }
            )}
            disabled={update.isPending}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})`, boxShadow: `0 4px 16px ${BLUE}30` }}
          >
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color, bg }: {
  icon: React.ReactNode; value: string | number; label: string; color: string; bg: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: `0 8px 24px ${color}15` }}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center transition-all"
    >
      <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-2" style={{ background: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState<"profile" | "progress">("profile");
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: perf }                     = useMyPerformance();

  if (meLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
        <p className="text-sm text-gray-400">Loading profile…</p>
      </div>
    );
  }

  const student    = me?.student;
  const tier       = student?.currentEloTier?.toLowerCase() ?? "iron";
  const tierColor  = tierColors[tier] ?? BLUE;
  const xp         = student?.xpPoints ?? 0;
  const streak     = student?.streakDays ?? 0;
  const accuracy   = perf?.overallAccuracy ?? 0;
  const totalTests = perf?.totalTestsTaken ?? 0;
  const weakTopics = perf?.weakTopics ?? [];
  const name       = me?.fullName ?? "Student";

  return (
    <div className="min-h-screen p-5 sm:p-6" style={{ background: "#F5F7FB" }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white border border-gray-100 w-fit shadow-sm">
          {(["profile", "progress"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize"
              style={tab === t
                ? { background: BLUE, color: "#fff", boxShadow: `0 4px 12px ${BLUE}30` }
                : { color: "#9CA3AF" }}
            >
              {t === "profile" ? <User className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
              {t}
            </button>
          ))}
        </div>

        {/* ── Progress Tab ── */}
        {tab === "progress" && (
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-4">My Progress Report</h2>
            <ProgressReportTree />
          </div>
        )}

        {/* ── Profile Tab ── */}
        {tab === "profile" && (
          <>
            {/* Banner + Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Gradient banner */}
              <div
                className="h-24 relative"
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 60%, #0388d1 100%)` }}
              >
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white opacity-5" />
                <div className="absolute bottom-0 left-10 w-20 h-20 rounded-full bg-white opacity-5" />
                {/* ELO tier chip */}
                <div className="absolute top-3 right-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span className="capitalize">{tier}</span>
                    {nextTier[tier] && <span className="opacity-70">→ {nextTier[tier]}</span>}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5 -mt-10 relative">
                <div className="flex items-end justify-between gap-3 mb-4">
                  {/* Avatar */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white border-4 border-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_M})` }}
                  >
                    {me?.profilePictureUrl
                      ? <img src={me.profilePictureUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                      : name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors mb-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                <h2 className="text-xl font-black text-gray-900">{name}</h2>
                <p className="text-sm text-gray-400 font-medium mt-0.5">
                  {student?.examTarget}{student?.currentClass ? ` · Class ${student.currentClass}` : ""}
                  {student?.examYear ? ` · ${student.examYear}` : ""}
                </p>

                {/* Info row */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {me?.city && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" /> {me.city}
                    </span>
                  )}
                  {me?.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="w-3 h-3" /> {me.email}
                    </span>
                  )}
                  {student?.targetCollege && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Target className="w-3 h-3" /> {student.targetCollege}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={<Flame className="w-5 h-5" />} value={`${streak}d`}              label="Day Streak"   color="#f97316" bg="#FFF4ED" />
              <StatCard icon={<Zap   className="w-5 h-5" />} value={xp.toLocaleString()}        label="XP Points"   color={BLUE}    bg={BLUE_L} />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} value={`${accuracy.toFixed(0)}%`} label="Accuracy"    color="#10b981" bg="#ECFDF5" />
              <StatCard icon={<BookOpen className="w-5 h-5" />} value={totalTests}               label="Tests Taken"  color="#8b5cf6" bg="#F5F3FF" />
            </div>

            {/* Account Details */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
            >
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: BLUE }} /> Account Details
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Phone",          icon: <Phone      className="w-3.5 h-3.5" />, value: me?.phone ?? "—"                                    },
                  { label: "Email",          icon: <Mail       className="w-3.5 h-3.5" />, value: me?.email ?? "—"                                    },
                  { label: "Exam Target",    icon: <Target     className="w-3.5 h-3.5" />, value: student?.examTarget ?? "—"                           },
                  { label: "Exam Year",      icon: <Calendar   className="w-3.5 h-3.5" />, value: student?.examYear ? String(student.examYear) : "—"   },
                  { label: "Daily Goal",     icon: <Zap        className="w-3.5 h-3.5" />, value: student?.dailyStudyHours ? `${student.dailyStudyHours}h / day` : "—" },
                  { label: "Longest Streak", icon: <Flame      className="w-3.5 h-3.5" />, value: student?.longestStreak ? `${student.longestStreak} days` : "—" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                      <span style={{ color: BLUE }}>{row.icon}</span>
                      {row.label}
                    </span>
                    <span className="text-sm font-bold text-gray-800">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Weak Topics */}
            {weakTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
              >
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-400" /> Areas to Improve
                </h3>
                <div className="space-y-3">
                  {weakTopics.slice(0, 5).map(wt => (
                    <div key={wt.topicId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold text-gray-700">{wt.topicName}</span>
                        <span className={`text-xs font-black ${wt.accuracy < 50 ? "text-red-500" : "text-amber-500"}`}>
                          {wt.accuracy.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: BLUE_L }}>
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
              </motion.div>
            )}

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => { clearAuth(); navigate("/login"); toast.success("Logged out successfully"); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-100 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </motion.button>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && me && <EditProfileModal me={me} onClose={() => setShowEdit(false)} />}
    </div>
  );
}