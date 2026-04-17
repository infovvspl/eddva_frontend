import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Zap, Target, BookOpen, Sparkles,
  ChevronRight, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Brain, BarChart3, Activity, LogOut,
  Edit3, Camera, X, Check, Loader2, Layers,
  Star, ShieldCheck, Clock, Crosshair, TrendingUp, User,
} from "lucide-react";
import {
  useStudentMe, useProgressReport, useWeeklyActivity,
  useUpdateProfile, useUploadAvatar, useMyCourses,
} from "@/hooks/use-student";
import { useAuthStore } from "@/lib/auth-store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Design Tokens (original palette preserved) ───────────────────────────────
const BLUE    = "#2563EB";
const PURPLE  = "#7C3AED";
const EMERALD = "#10B981";
const ORANGE  = "#F97316";

const TIERS: Record<string, { label: string; color: string; from: string; to: string }> = {
  champion: { label: "CHAMPION", color: "#f59e0b", from: "#fbbf24", to: "#f97316" },
  diamond:  { label: "DIAMOND",  color: "#06b6d4", from: "#67e8f9", to: "#3b82f6" },
  platinum: { label: "PLATINUM", color: "#8b5cf6", from: "#a78bfa", to: "#7c3aed" },
  gold:     { label: "GOLD",     color: "#d97706", from: "#fcd34d", to: "#f59e0b" },
  silver:   { label: "SILVER",   color: "#64748b", from: "#cbd5e1", to: "#94a3b8" },
  bronze:   { label: "BRONZE",   color: "#b45309", from: "#fbbf24", to: "#d97706" },
  iron:     { label: "IRON",     color: BLUE,      from: "#6366f1", to: "#7c3aed" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDNA(acc: number, streak: number) {
  if (acc >= 80 && streak >= 14) return { type: "Precision Master",   desc: "High accuracy with relentless consistency. A top-tier learner." };
  if (acc >= 75)                 return { type: "Pattern Recognizer", desc: "Fast learner with strong pattern recognition and moderate consistency." };
  if (streak >= 10)              return { type: "Momentum Builder",   desc: "Consistency-driven learner with strong habit formation." };
  if (acc >= 60)                 return { type: "Analytical Thinker", desc: "Methodical problem solver who excels under structured conditions." };
  return                                { type: "Rising Challenger",  desc: "Early-stage learner with high growth potential and adaptability." };
}

function getAIInsight(subjects: { subjectName: string; overallAccuracy: number }[], streak: number) {
  if (!subjects.length) return "Complete your first assessment to unlock AI-powered insights tailored to your learning profile.";
  const sorted = [...subjects].sort((a, b) => a.overallAccuracy - b.overallAccuracy);
  const weak = sorted[0], strong = sorted[sorted.length - 1];
  if (weak && strong && weak.subjectName !== strong.subjectName)
    return `You're strongest in ${strong.subjectName} (${strong.overallAccuracy}% mastery). Prioritize ${weak.subjectName} — closing this gap will accelerate your overall rank progression.`;
  return `You've maintained a ${streak}-day streak. Channel this momentum into your weaker topics to compound your growth.`;
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ text, speed = 20 }: { text: string; speed?: number }) {
  const [out, setOut] = useState("");
  const i = useRef(0);
  useEffect(() => {
    i.current = 0; setOut("");
    const t = setInterval(() => {
      i.current++; setOut(text.slice(0, i.current));
      if (i.current >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <span>{out}<span className="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 animate-pulse align-middle" /></span>;
}

// ─── Radial ring ─────────────────────────────────────────────────────────────
function Ring({ pct, size = 96, stroke = 6, color = BLUE, children }: {
  pct: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.4, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─── Animated bar ────────────────────────────────────────────────────────────
function Bar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: color }}
        initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1, delay, ease: "easeOut" }} />
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, value, label, trend, color, sub }: {
  icon: React.ElementType; value: string | number; label: string;
  trend?: "up" | "down" | "neutral"; color: string; sub?: string;
}) {
  return (
    <motion.div whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm group cursor-default relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && trend !== "neutral" && (
          <span className={cn("flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend === "up" ? "+2.4%" : "-1.1%"}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-slate-800 mb-0.5">{value}</p>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      {sub && <p className="text-[11px] text-slate-300 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Subject card ─────────────────────────────────────────────────────────────
function SubjectCard({ subj, idx }: { subj: any; idx: number }) {
  const [open, setOpen] = useState(false);
  const pct   = Math.round(subj.overallAccuracy ?? 0);
  const color = pct >= 70 ? EMERALD : pct >= 45 ? ORANGE : "#ef4444";
  const label = pct >= 70 ? "Strong" : pct >= 45 ? "Average" : "Weak";
  const weak  = (subj.chapters ?? []).filter((c: any) => (c.overallAccuracy ?? 0) < 50).slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}>
      <div onClick={() => setOpen(v => !v)}
        className="bg-white border border-slate-100 rounded-2xl p-4 cursor-pointer hover:border-slate-200 hover:shadow-md transition-all shadow-sm group">
        <div className="flex items-center gap-4">
          <Ring pct={pct} size={60} stroke={5} color={color}>
            <span className="text-[11px] font-black text-slate-700">{pct}%</span>
          </Ring>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-bold text-slate-800 text-sm">{subj.subjectName}</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color, background: `${color}15` }}>
                {label}
              </span>
            </div>
            <Bar pct={pct} color={color} delay={idx * 0.07} />
            <p className="text-[11px] text-slate-400 mt-1.5">{subj.topicsCompleted}/{subj.topicsTotal} topics done</p>
          </div>
          <motion.div animate={{ rotate: open ? 90 : 0 }}>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weak Chapters</p>
              {weak.length === 0
                ? <p className="text-xs text-slate-400 italic">No critical gaps — keep going!</p>
                : weak.map((ch: any, i: number) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-slate-600 flex-1">{ch.chapterName}</span>
                    <span className="text-[10px] font-bold text-red-500">{Math.round(ch.overallAccuracy ?? 0)}%</span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ me, onClose }: { me: any; onClose: () => void }) {
  const [form, setForm] = useState({
    fullName:             me.fullName ?? "",
    email:                me.email ?? "",
    phone:                me.phone ?? "",
    targetCollege:        me.student?.targetCollege ?? "",
    dailyStudyHours:      me.student?.dailyStudyHours ?? 6,
    city:                 me.city ?? me.student?.city ?? "",
    state:                me.student?.state ?? "",
    address:              me.student?.address ?? "",
    pinCode:              me.student?.pinCode ?? "",
    careOf:               me.student?.careOf ?? "",
    alternatePhoneNumber: me.student?.alternatePhoneNumber ?? "",
    landmark:             me.student?.landmark ?? "",
    postOffice:           me.student?.postOffice ?? "",
  });
  const update  = useUpdateProfile();
  const upload  = useUploadAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-lg">Edit Profile</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative cursor-pointer group" onClick={() => fileRef.current?.click()}>
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br"
              style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
              {me.profilePictureUrl
                ? <img src={me.profilePictureUrl} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black">{me.fullName?.[0]?.toUpperCase()}</div>}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {upload.isPending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) upload.mutate(f, { onSuccess: () => toast.success("Avatar updated"), onError: () => toast.error("Upload failed") }); }} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Full Name",          key: "fullName",             type: "text"   },
          { label: "Email",              key: "email",                type: "email"  },
          { label: "Phone Number",       key: "phone",                type: "text", readOnly: true },
          { label: "Alternate Phone",    key: "alternatePhoneNumber", type: "text"   },
          { label: "State",              key: "state",                type: "text"   },
          { label: "City",               key: "city",                 type: "text"   },
          { label: "PIN Code",           key: "pinCode",              type: "text"   },
          { label: "Full Address",       key: "address",              type: "text"   },
          { label: "Care Of / Son Of",   key: "careOf",               type: "text"   },
          { label: "Landmark / Tehsil",  key: "landmark",             type: "text"   },
          { label: "Post Office",        key: "postOffice",           type: "text"   },
          { label: "Target College",     key: "targetCollege",        type: "text"   },
          { label: "Daily Study Hours",  key: "dailyStudyHours",      type: "number" },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
            <input type={f.type} value={(form as any)[f.key]} readOnly={f.readOnly}
              onChange={e => !f.readOnly && setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
              className={`w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none transition-all ${f.readOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400'}`} />
          </div>
        ))}
        </div>
        <button
          onClick={() => update.mutate(form, { onSuccess: () => { toast.success("Profile updated"); onClose(); }, onError: () => toast.error("Failed to update") })}
          disabled={update.isPending}
          className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
          {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Changes
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const [showEdit, setShowEdit]   = useState(false);
  const [aiReady, setAiReady]     = useState(false);
  const { logout }                = useAuthStore();
  const navigate                  = useNavigate();

  const { data: me,       isLoading: meLoading }     = useStudentMe();
  const { data: report,   isLoading: reportLoading } = useProgressReport();
  const { data: _activity }                           = useWeeklyActivity();
  const { data: _courses  }                           = useMyCourses();
  // Guard: React Query's default `= []` only fires when data === undefined.
  // If the API returns null or a non-array object the default is bypassed → crash.
  const activity = Array.isArray(_activity) ? _activity : [];
  const courses  = Array.isArray(_courses)  ? _courses  : [];

  useEffect(() => { const t = setTimeout(() => setAiReady(true), 700); return () => clearTimeout(t); }, []);

  if (meLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading profile…</p>
      </div>
    </div>
  );

  const s        = me?.student;
  const tier     = TIERS[s?.currentEloTier ?? "iron"] ?? TIERS.iron;
  const subjects = report?.subjects ?? [];
  const summary  = report?.summary;
  const dna      = getDNA(summary?.overallAccuracy ?? 0, s?.streakDays ?? 0);
  const insight  = getAIInsight(subjects, s?.streakDays ?? 0);
  const weekMin  = activity.reduce((a, d) => a + d.minutesStudied, 0);
  const examRdy  = summary
    ? Math.min(100, Math.round((summary.completedTopics / Math.max(summary.totalTopics, 1)) * 60 + (summary.overallAccuracy ?? 0) * 0.4))
    : 0;
  const cogLoad  = weekMin > 600 ? "High" : weekMin > 300 ? "Medium" : "Low";
  const cogColor = cogLoad === "High" ? "#ef4444" : cogLoad === "Medium" ? ORANGE : EMERALD;
  const weakList = subjects.filter(s => s.overallAccuracy < 50).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-5">

      {/* ── PROFILE HEADER ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        {/* Subtle gradient accent top-left */}
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none opacity-[0.06]"
          style={{ background: `radial-gradient(circle, ${PURPLE}, transparent)`, filter: "blur(60px)" }} />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-[0.04]"
          style={{ background: `radial-gradient(circle, ${BLUE}, transparent)`, filter: "blur(50px)" }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar + ring */}
          <div className="relative shrink-0">
            <Ring pct={examRdy} size={104} stroke={5} color={tier.color}>
              <div className="w-[76px] h-[76px] rounded-xl overflow-hidden shadow-md"
                style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
                {me?.profilePictureUrl
                  ? <img src={me.profilePictureUrl} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-black">
                      {me?.fullName?.[0]?.toUpperCase() ?? "?"}
                    </div>}
              </div>
            </Ring>
            {/* Tier badge */}
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-lg text-[9px] font-black text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${tier.from}, ${tier.to})` }}>
              {tier.label}
            </div>
          </div>

          {/* Identity block */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-slate-900">{me?.fullName ?? "Student"}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${tier.from}, ${tier.to})` }}>
                {tier.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              {s?.examTarget ?? "NEET"} Aspirant • Class {s?.currentClass ?? "12"}
              {s?.examYear ? ` • ${s.examYear}` : ""}
            </p>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border"
                style={{ color: PURPLE, borderColor: `${PURPLE}30`, background: `${PURPLE}08` }}>
                <Brain className="w-3.5 h-3.5" /> {dna.type}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600">
                <Star className="w-3.5 h-3.5 text-amber-400" /> {(s?.xpPoints ?? 0).toLocaleString()} XP
              </span>
              {courses.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-600">
                  <BookOpen className="w-3.5 h-3.5" style={{ color: EMERALD }} /> {courses.length} Course{courses.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 italic">"{dna.desc}"</p>

            {/* Personal Details (compact) */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4 border-t border-slate-100 pt-4">
              {[
                { label: "Phone", value: me?.phone },
                { label: "Email", value: me?.email },
                { label: "City", value: s?.city ?? me?.city },
                { label: "State", value: s?.state },
                { label: "PIN Code", value: s?.pinCode },
                { label: "Address", value: s?.address },
                { label: "Care Of", value: s?.careOf },
                { label: "Alt Phone", value: s?.alternatePhoneNumber },
                { label: "Landmark", value: s?.landmark },
                { label: "Post Office", value: s?.postOffice },
              ].map((item, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-xs font-semibold text-slate-700 truncate min-w-0" title={item.value || ""}>{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right actions + readiness */}
          <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
            <div className="flex flex-col items-center">
              <Ring pct={examRdy} size={72} stroke={5} color={BLUE}>
                <span className="text-xs font-black text-slate-700">{examRdy}%</span>
              </Ring>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 text-center">Exam Ready</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => { logout(); navigate("/login"); }}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Flame,  value: `${s?.streakDays ?? 0}d`,    label: "Learning Streak",  trend: (s?.streakDays ?? 0) > 3 ? "up" : "neutral" as any, color: ORANGE,  sub: `Best: ${s?.longestStreak ?? 0}d`      },
          { icon: Zap,    value: `${s?.dailyStudyHours ?? 0}h`, label: "Daily Target",   trend: "neutral" as any,                                    color: "#eab308", sub: `${Math.round(weekMin/60)}h this week`},
          { icon: Target, value: `${Math.round(summary?.overallAccuracy ?? 0)}%`, label: "Accuracy Index", trend: (summary?.overallAccuracy ?? 0) > 60 ? "up" : "down" as any, color: BLUE, sub: `${summary?.totalPYQAttempted ?? 0} PYQs` },
          { icon: ShieldCheck, value: (s?.xpPoints ?? 0).toLocaleString(), label: "XP Points", trend: "neutral" as any, color: EMERALD, sub: `Rank: ${tier.label}` },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}>
            <MetricCard {...m} />
          </motion.div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT col: mastery map + performance intel */}
        <div className="lg:col-span-2 space-y-5">

          {/* Cognitive Mastery Map */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, ${PURPLE})` }}>
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-sm">Cognitive Mastery Map</h2>
                  <p className="text-[11px] text-slate-400">{subjects.length} subjects tracked</p>
                </div>
              </div>
            </div>

            {reportLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: BLUE }} />
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No subject data yet. Start learning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map((subj, i) => <SubjectCard key={subj.subjectId} subj={subj} idx={i} />)}
              </div>
            )}
          </div>

          {/* Performance Intelligence */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${PURPLE}15` }}>
                <Activity className="w-4 h-4" style={{ color: PURPLE }} />
              </div>
              <div>
                <h2 className="font-black text-slate-800 text-sm">Performance Intelligence</h2>
                <p className="text-[11px] text-slate-400">Smart analytics</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: "Exam Readiness",   value: `${examRdy}%`,  color: examRdy > 60 ? EMERALD : ORANGE, pct: examRdy },
                { label: "Topic Completion", value: `${summary ? Math.round((summary.completedTopics / Math.max(summary.totalTopics, 1)) * 100) : 0}%`, color: BLUE, pct: summary ? Math.round((summary.completedTopics / Math.max(summary.totalTopics, 1)) * 100) : 0 },
                { label: "PYQ Accuracy",     value: `${Math.round(summary?.pyqAccuracy ?? 0)}%`, color: ORANGE, pct: Math.round(summary?.pyqAccuracy ?? 0) },
                { label: "Cognitive Load",   value: cogLoad, color: cogColor, pct: cogLoad === "High" ? 88 : cogLoad === "Medium" ? 52 : 24 },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                    <span className="text-xs font-black" style={{ color: item.color }}>{item.value}</span>
                  </div>
                  <Bar pct={item.pct} color={item.color} delay={0.3 + i * 0.08} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT col: AI panel + weak areas + activity */}
        <div className="space-y-5">

          {/* AI Insight */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-3xl p-5 text-white"
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${PURPLE} 100%)`, boxShadow: `0 8px 40px ${BLUE}30` }}>
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />

            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">AI Insight</p>
                    <p className="text-[10px] text-white/60">Personalized for you</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-bold text-white">LIVE</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-white/90 min-h-[64px]">
                {aiReady ? <Typewriter text={insight} /> : <span className="text-white/30">Analyzing your data…</span>}
              </p>

              <button onClick={() => navigate("/student/lectures")}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center gap-2 border border-white/20">
                <Crosshair className="w-3.5 h-3.5" /> Start Focus Session
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>


          {/* Improvement Zones */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-black text-slate-800 text-sm">Improvement Zones</h3>
            </div>
            {weakList.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400">No critical gaps detected!</p>
              </div>
            ) : weakList.map((subj, i) => {
              const crit  = subj.overallAccuracy < 25;
              const color = crit ? "#ef4444" : ORANGE;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="flex items-center gap-3 p-3 rounded-xl border mb-2 last:mb-0"
                  style={{ borderColor: `${color}25`, background: `${color}06` }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{subj.subjectName}</p>
                    <p className="text-[10px] text-slate-400">{Math.round(subj.overallAccuracy)}% mastery</p>
                  </div>
                  <button onClick={() => navigate("/student/lectures")}
                    className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all"
                    style={{ background: color }}>
                    Fix Now
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Weekly activity */}
          {activity.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${EMERALD}15` }}>
                  <TrendingUp className="w-4 h-4" style={{ color: EMERALD }} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Weekly Activity</h3>
                  <p className="text-[11px] text-slate-400">{Math.round(weekMin/60)}h {weekMin % 60}min total</p>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-14">
                {activity.slice(-7).map((d, i) => {
                  const max = Math.max(...activity.map(a => a.minutesStudied), 1);
                  const h   = Math.max(4, (d.minutesStudied / max) * 52);
                  const days = ["M","T","W","T","F","S","S"];
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div className="w-full rounded-sm"
                        style={{ height: h, background: d.minutesStudied > 0 ? `${BLUE}50` : "#f1f5f9" }}
                        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                        transition={{ delay: 0.4 + i * 0.05, transformOrigin: "bottom" }} />
                      <span className="text-[9px] text-slate-300 font-medium">{days[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEdit && me && <EditModal me={me} onClose={() => setShowEdit(false)} />}
      </AnimatePresence>
    </div>
  );
}
