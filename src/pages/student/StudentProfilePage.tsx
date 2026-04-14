import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Flame, Zap, Trophy, Target, BookOpen,
  Loader2, LogOut, Edit3, X, TrendingUp, BarChart2,
  Mail, Phone, MapPin, Calendar, Star, Award,
  Shield, Sparkles, Globe, ArrowRight, Activity,
  Layers, HardDrive, Cpu, Compass, Camera,
} from "lucide-react";
import { useStudentMe, useMyPerformance, useUpdateProfile, useUploadAvatar } from "@/hooks/use-student";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProgressReportTree from "@/components/shared/ProgressReportTree";
import { cn } from "@/lib/utils";
import { CardGlass } from "@/components/shared/CardGlass";

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

const ProgressBar = ({ pct, color, className }: { pct: number; color: string; className?: string }) => (
  <div className={cn("h-2 bg-slate-100/50 rounded-full overflow-hidden p-0.5 shadow-inner", className)}>
    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full shadow-lg" style={{ background: color }} />
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

  const inp = "w-full border border-slate-100 rounded-2xl px-5 py-4 text-[11px] font-black uppercase italic text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-3xl"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <CardGlass className="border-white bg-white/95 rounded-[3.5rem] w-full max-w-lg overflow-hidden flex flex-col shadow-3xl p-0">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900"><HardDrive className="w-5 h-5" /></div>
             <div>
                <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none">Update Terminal</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Profile Synchronization</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {[
            { label: "Identity Label (Full Name)", value: fullName, set: setFullName, icon: <User className="w-3.5 h-3.5" /> },
            { label: "Regional Sync (City)", value: city, set: setCity, icon: <MapPin className="w-3.5 h-3.5" /> },
            { label: "Strategic Target", value: targetCollege, set: setTargetCollege, icon: <Target className="w-3.5 h-3.5" /> },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-2 flex items-center gap-2">{f.icon} {f.label}</label>
              <input type="text" value={f.value} onChange={e => f.set(e.target.value)} className={inp} />
            </div>
          ))}

          <div className="pt-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-2 flex items-center justify-between">
              Study Velocity <span className="text-blue-600 font-black italic">{dailyStudyHours}H / CYCLE</span>
            </label>
            <input type="range" min={1} max={12} value={dailyStudyHours} onChange={e => setDailyStudyHours(Number(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white">
          <button onClick={() => update.mutate({ fullName, city, targetCollege, dailyStudyHours }, { onSuccess: () => onClose() })} disabled={update.isPending}
            className="w-full py-5 rounded-[1.75rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-50">
            {update.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Cpu className="w-5 h-5" /> SYNCHRONIZE DATA</>}
          </button>
        </div>
      </CardGlass>
    </motion.div>
  );
}

// ─── Stat Capsule ────────────────────────────────────────────────────────────
function StatCapsule({ icon, value, label, color, bg }: {
  icon: React.ReactNode; value: string | number; label: string; color: string; bg: string;
}) {
  return (
    <CardGlass className="p-8 text-center border-white bg-white/60 group">
      <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform" style={{ background: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-3xl font-black text-slate-900 leading-none uppercase italic tracking-tighter">{value}</p>
      <p className="text-[10px] text-slate-400 mt-3 font-black uppercase tracking-[0.2em]">{label}</p>
    </CardGlass>
  );
}

// ─── Mastery Circuit ──────────────────────────────────────────────────────────
function MasteryCircuit({ label, accuracy, color }: { label: string; accuracy: number; color: string }) {
  return (
    <div className="space-y-4 p-6 rounded-3xl bg-white border border-slate-50 hover:border-indigo-100 hover:shadow-xl transition-all group">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full" style={{ background: color }} />
             <span className="text-[11px] font-black text-slate-900 uppercase italic tracking-tight">{label}</span>
          </div>
          <span className="text-[11px] font-black italic tracking-tighter" style={{ color }}>{accuracy.toFixed(0)}% SYNTH</span>
       </div>
       <ProgressBar pct={accuracy} color={color} className="h-1.5" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState<"dna" | "reports">("dna");
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: perf }                     = useMyPerformance();
  const uploadAvatar                       = useUploadAvatar();

  const handleAvatarClick = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadAvatar.mutate(file);
    };
    input.click();
  };

  if (meLoading) return (
    <div className="py-40 flex flex-col items-center gap-6">
       <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-3xl"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying Academy Identity</p>
    </div>
  );

  const student    = me?.student;
  const tier       = (student?.currentEloTier?.toLowerCase() ?? "iron") as string;
  const xp         = student?.xpPoints ?? 0;
  const streak     = student?.streakDays ?? 0;
  const accuracy   = perf?.overallAccuracy ?? 0;
  const totalTests = perf?.totalTestsTaken ?? 0;
  const weakTopics = perf?.weakTopics ?? [];
  const name       = me?.fullName ?? "Unit Zero";

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white text-gray-900 w-fit shadow-xl">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">Neural DNA Hub v2.0</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Intelligence<br/><span className="not-italic text-blue-600">Hub</span>
            </h1>
            <div className="flex p-2 rounded-[1.75rem] bg-slate-950/5 border border-white w-fit shadow-inner">
              {(["dna", "reports"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={cn("flex items-center gap-3 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all", tab === t ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-600")}>
                  {t === "dna" ? <Target className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />} {t} Hub
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowEdit(true)} className="px-10 py-5 rounded-2xl bg-white border border-slate-50 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all">
                <Edit3 className="w-4 h-4 text-blue-500" /> Reconfigure Profile
             </motion.button>
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { clearAuth(); navigate("/login"); toast.success("Terminated"); }} className="w-14 h-14 rounded-2xl bg-white border border-red-50 flex items-center justify-center text-red-500 shadow-xl transition-all"><LogOut className="w-6 h-6" /></motion.button>
          </div>
        </header>

        {tab === "reports" ? (
          <CardGlass className="p-10 border-white bg-white/60 shadow-3xl">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl"><TrendingUp className="w-7 h-7" /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Unit Growth Matrix</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Progression Synthesizer</p>
                </div>
             </div>
             <ProgressReportTree />
          </CardGlass>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 items-start">
            <div className="xl:col-span-1 space-y-8">
               <CardGlass className="p-0 border-white bg-white/60 overflow-hidden shadow-3xl">
                  <div className={cn("h-32 bg-gradient-to-br relative", tierGradients[tier] || tierGradients.iron)}>
                     <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-white fill-white/20" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{tier}</span>
                     </div>
                  </div>
                  <div className="px-8 pb-10 -mt-12 relative flex flex-col items-center">
                     <button onClick={handleAvatarClick} disabled={uploadAvatar.isPending} className="relative w-28 h-28 rounded-[2.5rem] bg-white border-4 border-white shadow-3xl overflow-hidden flex items-center justify-center group mb-6 transition-all hover:scale-105 active:scale-95">
                       {me?.profilePictureUrl ? (
                         <img src={me.profilePictureUrl} alt="avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                       ) : (
                         <div className="w-full h-full bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-900">{name.charAt(0)}</div>
                       )}
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                         {uploadAvatar.isPending ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                       </div>
                     </button>
                     <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{name}</h2>
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-3">{student?.examTarget} UNIT • CLASS {student?.currentClass}</p>
                     
                     <div className="mt-10 space-y-3 w-full">
                        {[
                          { icon: <Mail className="w-3.5 h-3.5" />, val: me?.email },
                          { icon: <Phone className="w-3.5 h-3.5" />, val: me?.phone },
                          { icon: <MapPin className="w-3.5 h-3.5" />, val: me?.city },
                        ].filter(i => i.val).map((item, idx) => (
                           <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-50 shadow-sm">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">{item.icon}</div>
                              <span className="text-[11px] font-bold text-slate-600 truncate">{item.val}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </CardGlass>
            </div>

            <div className="xl:col-span-3 space-y-10">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCapsule icon={<Flame className="w-6 h-6" />} value={`${streak}d`} label="Neural Streak" color={ORANGE} bg="rgba(249, 115, 22, 0.1)" />
                  <StatCapsule icon={<Zap className="w-6 h-6" />} value={xp.toLocaleString()} label="XP Reservoir" color={BLUE} bg="rgba(37, 99, 235, 0.1)" />
                  <StatCapsule icon={<TrendingUp className="w-6 h-6" />} value={`${accuracy.toFixed(0)}%`} label="Synth Precision" color={EMERALD} bg="rgba(16, 185, 129, 0.1)" />
                  <StatCapsule icon={<BookOpen className="w-6 h-6" />} value={totalTests} label="Data Modules" color={PURPLE} bg="rgba(124, 58, 237, 0.1)" />
               </div>

               <CardGlass className="p-10 border-white bg-white/60 shadow-3xl">
                  <div className="flex items-center justify-between mb-12">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl"><Globe className="w-6 h-6" /></div>
                        <div>
                           <h2 className="text-xl font-black text-slate-900 uppercase italic leading-none">Mastery Circuit</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Cognitive Synchronization Matrix</p>
                        </div>
                     </div>
                     <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {[
                       { label: "Quantum Physics", val: accuracy + 12, col: BLUE },
                       { label: "Theoretical Calculus", val: accuracy - 5, col: PURPLE },
                       { label: "Molecular Synthesis", val: accuracy + 4, col: EMERALD },
                       { label: "Structural Mechanics", val: accuracy - 15, col: ORANGE },
                     ].map((item, i) => (
                        <MasteryCircuit key={i} label={item.label} accuracy={item.val} color={item.col} />
                     ))}
                  </div>

                  <div className="mt-12 p-8 rounded-[3rem] bg-indigo-600 text-white shadow-3xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 scale-150 opacity-10 group-hover:rotate-45 transition-transform"><Compass className="w-20 h-20" /></div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase italic mb-4 tracking-widest opacity-60">AI Diagnostic Directive</p>
                        <p className="text-lg font-bold leading-relaxed max-w-2xl italic tracking-tight">"Genetic learning profile indicates <span className="text-white font-black underline decoration-white/30">Advanced Pattern Recognition</span>. Focus on Molecular Synthesis to attain Unit Paragon rank."</p>
                        <button onClick={() => navigate("/student/learn")} className="mt-8 flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-[0.3em] group/btn">Engage Module <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" /></button>
                     </div>
                  </div>
               </CardGlass>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <CardGlass className="p-8 border-white bg-white/60">
                     <h3 className="text-[11px] font-black text-slate-900 uppercase italic mb-8 flex items-center gap-3">System Metrics</h3>
                     <div className="space-y-4">
                        {[
                          { label: "Sync Target", val: student?.examTarget },
                          { label: "Cycle Projection", val: student?.examYear },
                          { label: "Neural Velocity", val: `${student?.dailyStudyHours}H / CYCLE` },
                        ].map((row, i) => (
                           <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-50">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                              <span className="text-[11px] font-black text-slate-800 uppercase italic">{row.val || "????"}</span>
                           </div>
                        ))}
                     </div>
                  </CardGlass>

                  <CardGlass className="p-8 border-red-100 bg-red-500/[0.02]">
                     <h3 className="text-[11px] font-black text-slate-900 uppercase italic mb-8 flex items-center gap-3">Fragmented Sectors</h3>
                     <div className="space-y-6">
                        {weakTopics.slice(0, 4).map(wt => (
                           <div key={wt.topicId}>
                              <div className="flex justify-between mb-2 text-[10px] font-black uppercase italic"><span className="text-slate-700">{wt.topicName}</span><span className="text-red-500">{wt.accuracy.toFixed(0)}% SYNCH</span></div>
                              <ProgressBar pct={wt.accuracy} color="red" className="h-1.5" />
                           </div>
                        ))}
                     </div>
                  </CardGlass>
               </div>
            </div>
          </div>
        )}

      <AnimatePresence>
        {showEdit && me && <EditProfileModal me={me} onClose={() => setShowEdit(false)} />}
      </AnimatePresence>
    </div>
  );
}
