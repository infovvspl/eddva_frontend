import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Flame, Zap, Trophy, Target, BookOpen,
  Loader2, Check, LogOut, Edit3, X, TrendingUp, BarChart2,
  Mail, Phone, MapPin, Calendar, Star, Award, 
  Shield, Sparkles, Globe, ArrowRight, Activity, 
  Layers, HardDrive, Cpu, Compass,
} from "lucide-react";
import { useStudentMe, useMyPerformance, useUpdateProfile } from "@/hooks/use-student";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProgressReportTree from "@/components/shared/ProgressReportTree";
import { cn } from "@/lib/utils";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE          = "#2563EB";
const PURPLE        = "#7C3AED";
const EMERALD       = "#10B981";
const ORANGE        = "#F97316";

const tierGradients: Record<string, string> = {
  champion: "from-amber-400 to-orange-500", 
  diamond:  "from-cyan-400 to-blue-500",
  platinum: "from-violet-400 to-purple-600", 
  gold:     "from-yellow-400 to-amber-500",
  silver:   "from-slate-300 to-slate-500", 
  bronze:   "from-amber-700 to-orange-800",
  iron:     "from-slate-500 to-slate-700",
};

const tierColors: Record<string, string> = {
  champion: "#f59e0b", diamond: "#06b6d4", platinum: "#8b5cf6",
  gold: "#f59e0b", silver: "#94a3b8", bronze: "#a16207", iron: BLUE,
};

// ─── Shared Components ──────────────────────────────────────────────────────────

const CardGlass = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={onClick ? { y: -5, scale: 1.01 } : {}}
    onClick={onClick}
    className={cn(
      "bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-500",
      onClick ? "cursor-pointer" : "",
      className
    )}
  >
    {children}
  </motion.div>
);

const ProgressBar = ({ pct, color, className }: { pct: number; color: string; className?: string }) => (
  <div className={cn("h-2 bg-slate-100 rounded-full overflow-hidden p-0.5", className)}>
    <motion.div 
      initial={{ width: 0 }} animate={{ width: `${pct}%` }} 
      className="h-full rounded-full shadow-lg" 
      style={{ background: color }} 
    />
  </div>
);

// ─── Edit Profile Terminal ───────────────────────────────────────────────────
function EditProfileModal({ me, onClose }: {
  me: { fullName: string; city?: string; student?: { targetCollege?: string; dailyStudyHours?: number } };
  onClose: () => void;
}) {
  const [fullName, setFullName]               = useState(me.fullName ?? "");
  const [city, setCity]                       = useState(me.city ?? "");
  const [targetCollege, setTargetCollege]     = useState(me.student?.targetCollege ?? "");
  const [dailyStudyHours, setDailyStudyHours] = useState(me.student?.dailyStudyHours ?? 4);
  const update = useUpdateProfile();

  const inp = "w-full border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }}
        className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden flex flex-col shadow-3xl relative"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[40px] rounded-full -mr-24 -mt-24 pointer-events-none" />
        
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <HardDrive className="w-5 h-5" />
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none">Update Terminal</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Profile Synchronization</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 relative z-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {[
            { label: "Identity Label (Full Name)", value: fullName, set: setFullName, icon: <User className="w-3.5 h-3.5" /> },
            { label: "Regional Sync (City)", value: city, set: setCity, icon: <MapPin className="w-3.5 h-3.5" /> },
            { label: "Strategic Target (College)", value: targetCollege, set: setTargetCollege, icon: <Target className="w-3.5 h-3.5" /> },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2 flex items-center gap-2">
                 <span className="text-blue-500">{f.icon}</span> {f.label}
              </label>
              <input type="text" value={f.value} onChange={e => f.set(e.target.value)} className={inp} />
            </div>
          ))}

          <div className="pt-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-2 flex items-center justify-between">
              Primary Study Velocity <span className="text-blue-600 font-black italic">{dailyStudyHours}H / CYCLE</span>
            </label>
            <input type="range" min={1} max={12} value={dailyStudyHours}
              onChange={e => setDailyStudyHours(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
            <div className="flex justify-between mt-2 text-[9px] font-black text-slate-300 px-1 uppercase tracking-widest">
               <span>Eco (1H)</span>
               <span>Boost (6H)</span>
               <span>Max (12H)</span>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 relative z-10 bg-white">
          <button
            onClick={() => update.mutate(
              { fullName, city, targetCollege, dailyStudyHours },
              { onSuccess: () => { toast.success("Neural Link Synchronized!"); onClose(); }, onError: () => toast.error("Sync Failed") }
            )}
            disabled={update.isPending}
            className="w-full py-5 rounded-[1.75rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl hover:bg-blue-600"
          >
            {update.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
            SYNCHRONIZE DATA
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stat Capsule ────────────────────────────────────────────────────────────
function StatCapsule({ icon, value, label, color, bg }: {
  icon: React.ReactNode; value: string | number; label: string; color: string; bg: string;
}) {
  return (
    <CardGlass className="p-6 text-center border-white/60 bg-white/30 backdrop-blur-3xl group">
      <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 transition-transform" style={{ background: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">{label}</p>
    </CardGlass>
  );
}

// ─── Mastery Circuit ──────────────────────────────────────────────────────────
function MasteryCircuit({ label, accuracy, color }: { label: string; accuracy: number; color: string }) {
  return (
    <div className="space-y-3 p-4 rounded-2xl bg-white/40 border border-white hover:bg-white group transition-all">
       <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
             <span className="text-xs font-black text-slate-900 uppercase italic">{label}</span>
          </div>
          <span className="text-[11px] font-black italic tracking-tighter" style={{ color }}>{accuracy.toFixed(0)}% SYNTH</span>
       </div>
       <ProgressBar pct={accuracy} color={color} className="h-1.5" />
    </div>
  );
}

// ─── Main Page: Intelligence DNA Hub ──────────────────────────────────────────
export default function StudentProfilePage() {
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState<"dna" | "reports">("dna");
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: perf }                     = useMyPerformance();

  if (meLoading) {
    return (
      <div className="py-40 flex flex-col items-center gap-6">
         <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-blue-50" />
            <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying Academy Identity</p>
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
  const name       = me?.fullName ?? "Unit Zero";

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] custom-scrollbar selection:bg-blue-600/10">
      {/* ── Aero Dynamic Background ── */}
   
      <div className="relative z-10 px-6 sm:px-10 py-8 max-w-[1700px] mx-auto">
        
        {/* ── Hub Tab Header ── */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10 mb-12">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900 text-white w-fit shadow-xl"
            >
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural DNA Sync Interface</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Intelligence<br/><span className="not-italic text-blue-600">Hub</span>
            </h1>
            <div className="flex gap-2 p-1 rounded-2xl bg-white/60 border border-white/60 w-fit shadow-xl backdrop-blur-3xl">
              {(["dna", "reports"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    tab === t ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {t === "dna" ? <Target className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
                  {t} Hub
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <motion.button
               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
               onClick={() => setShowEdit(true)}
               className="px-8 py-5 rounded-2xl bg-white border border-slate-100 text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:border-blue-200 transition-all group"
             >
                <Edit3 className="w-4 h-4 text-blue-500 group-hover:rotate-12 transition-transform" /> Reconfigure Profile
             </motion.button>
             <motion.button
               whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
               onClick={() => { clearAuth(); navigate("/login"); toast.success("Neural Link Terminated"); }}
               className="w-14 h-14 rounded-2xl bg-white border border-red-100 flex items-center justify-center text-red-500 shadow-xl hover:bg-red-50 transition-all"
             >
                <LogOut className="w-6 h-6" />
             </motion.button>
          </div>
        </header>

        {tab === "reports" ? (
          <div className="space-y-8">
            <CardGlass className="p-10">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/20">
                     <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic">Unit Growth Matrix</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Strategic Progression Synthesizer</p>
                  </div>
               </div>
               <ProgressReportTree />
            </CardGlass>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 items-start pb-20">
            {/* Identity DNA Column */}
            <div className="xl:col-span-1 space-y-8">
               <CardGlass className="p-0 border-white/80 overflow-hidden">
                  <div className={cn("h-32 bg-gradient-to-br relative", tierGradients[tier] || tierGradients.iron)}>
                     <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-white fill-white/20" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{tier}</span>
                     </div>
                  </div>
                  <div className="px-8 pb-10 -mt-12 relative flex flex-col items-center text-center">
                     <div className="w-24 h-24 rounded-[2.5rem] bg-white border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center group mb-6">
                        {me?.profilePictureUrl ? (
                          <img src={me.profilePictureUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-900">
                             {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute inset-0 border-2 border-white/20 rounded-[2.5rem] pointer-events-none" />
                     </div>
                     
                     <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{name}</h2>
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-2">{student?.examTarget} UNIT • CLASS {student?.currentClass}</p>
                     
                     <div className="mt-8 space-y-4 w-full">
                        {[
                          { icon: <Mail className="w-3.5 h-3.5" />, val: me?.email },
                          { icon: <Phone className="w-3.5 h-3.5" />, val: me?.phone },
                          { icon: <MapPin className="w-3.5 h-3.5" />, val: me?.city },
                        ].filter(i => i.val).map((item, idx) => (
                           <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 border border-slate-50 transition-colors hover:bg-white shadow-sm">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                 {item.icon}
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 truncate">{item.val}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </CardGlass>
               
               {/* Achievement Panel */}
               <CardGlass className="p-8 bg-slate-900 border-slate-800 text-white overflow-hidden shadow-orange-500/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full -mr-16 -mt-16" />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Glory Vault</p>
                     <Award className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 relative z-10">
                     {[Star, Zap, Shield, Flame, Target, Trophy].map((Icon, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:bg-orange-500 hover:border-orange-400 transition-all cursor-pointer">
                           <Icon className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        </div>
                     ))}
                  </div>
                  <button className="w-full mt-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                     Showcase All (14)
                  </button>
               </CardGlass>
            </div>

            {/* Core Intelligence Column */}
            <div className="xl:col-span-3 space-y-10">
               {/* High Tech Stat Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatCapsule icon={<Flame className="w-5 h-5" />} value={`${streak}d`} label="Neural Streak" color={ORANGE} bg="rgba(249, 115, 22, 0.1)" />
                  <StatCapsule icon={<Zap className="w-5 h-5" />} value={xp.toLocaleString()} label="XP Reservoir" color={BLUE} bg="rgba(37, 99, 235, 0.1)" />
                  <StatCapsule icon={<TrendingUp className="w-5 h-5" />} value={`${accuracy.toFixed(0)}%`} label="Synth Precision" color={EMERALD} bg="rgba(16, 185, 129, 0.1)" />
                  <StatCapsule icon={<BookOpen className="w-5 h-5" />} value={totalTests} label="Data Modules" color={PURPLE} bg="rgba(124, 58, 237, 0.1)" />
               </div>

               {/* Mastery Circuit Visualization */}
               <CardGlass className="p-10">
                  <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
                           <Globe className="w-6 h-6" />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-slate-900 uppercase italic leading-none">Mastery Circuit</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1.5">Cognitive Synchronization Matrix</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="text-right">
                           <p className="text-2xl font-black text-slate-900 leading-none">{(accuracy).toFixed(1)}%</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Average Sync</p>
                        </div>
                        <div className="w-px h-10 bg-slate-100" />
                        <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                     {[
                       { label: "Quantum Physics", val: accuracy + 12, col: BLUE },
                       { label: "Theoretical Calculus", val: accuracy - 5, col: PURPLE },
                       { label: "Molecular Synthesis", val: accuracy + 4, col: EMERALD },
                       { label: "Structural Mechanics", val: accuracy - 15, col: ORANGE },
                     ].map((item, i) => (
                        <MasteryCircuit key={i} label={item.label} accuracy={item.val} color={item.col} />
                     ))}
                  </div>

                  <div className="mt-12 p-8 rounded-[2.5rem] bg-blue-50/50 border border-blue-100 border-dashed relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4"><Compass className="w-10 h-10 text-blue-100 group-hover:rotate-45 transition-transform" /></div>
                     <div className="relative z-10">
                        <p className="text-xs font-black text-blue-900 uppercase italic mb-2 tracking-tight">AI Diagnostic Directive</p>
                        <p className="text-sm font-bold text-blue-600/80 max-w-2xl leading-relaxed">
                           "Genetic learning profile indicates <span className="font-black text-blue-800">Advanced Pattern Recognition</span>. Recommend focusing on Molecular Synthesis modules to attain Unit Paragon rank."
                        </p>
                        <button onClick={() => navigate("/student/learn")} className="mt-6 flex items-center gap-3 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] group/btn">
                           Engage Module <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  </div>
               </CardGlass>

               {/* Intelligence Data Log */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <CardGlass className="p-8">
                     <h3 className="text-sm font-black text-slate-900 uppercase italic mb-8 flex items-center gap-3">
                        <ArchiveRestore className="w-4 h-4 text-blue-600" /> System Metrics
                     </h3>
                     <div className="space-y-4">
                        {[
                          { label: "Sync Target", icon: <Target className="w-3.5 h-3.5" />, val: student?.examTarget },
                          { label: "Cycle Projection", icon: <Calendar className="w-3.5 h-3.5" />, val: student?.examYear },
                          { label: "Neural Velocity", icon: <Zap className="w-3.5 h-3.5" />, val: `${student?.dailyStudyHours}H / CYCLE` },
                          { icon: <Clock className="w-3.5 h-3.5" />, label: "Peak Persistence", val: `${student?.longestStreak} DAYS` },
                        ].map((row, i) => (
                           <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-slate-50 transition-colors hover:bg-white shadow-sm">
                              <span className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <span className="text-blue-500">{row.icon}</span> {row.label}
                              </span>
                              <span className="text-[11px] font-black text-slate-800 uppercase italic">{row.val || "????"}</span>
                           </div>
                        ))}
                     </div>
                  </CardGlass>

                  {/* Weak Topics Analysis */}
                  <CardGlass className="p-8 border-red-500/10 bg-red-500/[0.02]">
                     <h3 className="text-sm font-black text-slate-900 uppercase italic mb-8 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-red-500" /> Fragmented Sectors
                     </h3>
                     <div className="space-y-6">
                        {weakTopics.slice(0, 4).map(wt => (
                           <div key={wt.topicId} className="group cursor-help">
                              <div className="flex items-center justify-between mb-3 px-1">
                                 <span className="text-[11px] font-black text-slate-700 uppercase italic group-hover:text-red-600 transition-colors">{wt.topicName}</span>
                                 <span className="text-[11px] font-black text-red-500 italic">{wt.accuracy.toFixed(0)}% SYNC</span>
                              </div>
                              <div className="h-1.5 w-full bg-red-100/50 rounded-full overflow-hidden p-0.5">
                                 <motion.div initial={{ width: 0 }} animate={{ width: `${wt.accuracy}%` }} className="h-full bg-red-500 rounded-full shadow-lg" />
                              </div>
                           </div>
                        ))}
                        {weakTopics.length === 0 && (
                           <div className="py-20 flex flex-col items-center gap-3 text-center opacity-30">
                              <Shield className="w-10 h-10 text-emerald-500" />
                              <p className="text-[10px] font-black uppercase tracking-widest">All Sectors Calibrated</p>
                           </div>
                        )}
                     </div>
                  </CardGlass>
               </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showEdit && me && <EditProfileModal me={me} onClose={() => setShowEdit(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Extra Icons for the DNA UI ─────────────────────────────────────────────
const ArchiveRestore = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
);
const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
);
const Clock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const Brain = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.13 3 3 0 1 0 5.277 2.102 3 3 0 1 0 5.451 0 3 3 0 1 0 5.277-2.102 4 4 0 0 0 .52-8.13 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M12 13V8"/><path d="M15 13a4.5 4.5 0 0 1-3-4"/></svg>
);