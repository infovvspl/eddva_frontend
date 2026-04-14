import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Swords, Trophy, Brain, BookOpen, Video,
  Zap, ChevronRight, CheckCircle, Target,
  Loader2, Bell, Play, RefreshCw, MessageSquare,
  TrendingUp, Clock, Award, Sparkles,
  Calendar, BarChart3, HelpCircle,
  Star, Lock, Plus, X, Users, Activity,
  GraduationCap, Microscope, Layers, IndianRupee, ArrowRight, ShieldCheck, Cpu
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import {
  useStudentMe, useTodaysPlan, useMyPerformance,
  useLeaderboard, useCompletePlanItem, useDailyBattle,
  useNextAction, usePublicBatches,
} from "@/hooks/use-student";
import { useUnreadNotificationCount } from "@/hooks/use-teacher";
import { StudyPlanItem, PlanItemType } from "@/lib/api/student";
import { toast } from "sonner";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";

const typeIcon: Record<PlanItemType, any> = {
  lecture:       Video,
  practice:      Brain,
  mock_test:     BookOpen,
  battle:        Swords,
  revision:      RefreshCw,
  doubt_session: MessageSquare,
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: plan, isLoading: planLoading } = useTodaysPlan();
  const { data: perf } = useMyPerformance();
  const { data: lb } = useLeaderboard({ scope: "global" });
  const { data: nextAction } = useNextAction();

  const student = me?.student;
  const xp = student?.xpPoints ?? 0;
  const level = Math.floor(xp / 1000) + 1;
  const rank = lb?.currentStudentRank?.rank;
  const accuracy = perf?.overallAccuracy ?? 0;

  const completed = plan?.filter(i => i.status === "completed").length ?? 0;
  const total = plan?.length ?? 0;
  const planPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (meLoading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-8">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
           <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] animate-pulse">Initializing Lucid Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Lucid Command Central ── */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <CardGlass className="xl:col-span-2 p-10 bg-white/40 border-white relative overflow-hidden flex flex-col justify-between min-h-[380px]">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/30 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
           
           <div className="relative z-10 flex flex-col gap-10">
              <div className="flex items-center gap-4">
                 <div className="px-4 py-1.5 rounded-xl bg-white border border-slate-100 flex items-center gap-2.5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Nexus Protocol Active</span>
                 </div>
                 <div className="px-4 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-2.5 shadow-sm">
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{student?.currentEloTier ?? "Iron I"}</span>
                 </div>
              </div>

              <div className="space-y-4">
                 <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight max-w-md">
                    Continue <span className="text-indigo-600">Lucid Progression</span> through your roadmap
                 </h1>
                 <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-indigo-500 rounded-full" />
                    <p className="text-slate-400 font-medium text-xs max-w-md leading-relaxed">
                       {nextAction?.title ?? "Neural synchronization required. Initiate your daily study roadmap to begin progression."}
                    </p>
                 </div>
              </div>
           </div>

           <div className="relative z-10 flex flex-wrap items-end justify-between gap-10 pt-10 border-t border-slate-100/50">
              <div className="flex items-center gap-12">
                 <div className="space-y-3">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Lucidity Index</p>
                    <div className="flex items-center gap-4">
                       <span className="text-2xl font-bold text-slate-700 tabular-nums tracking-tighter">{planPct}%</span>
                       <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${planPct}%` }} className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
                       </div>
                    </div>
                 </div>
                 <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                 <div className="space-y-2">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Global Port Pos</p>
                    <p className="text-xl font-bold text-slate-700 tabular-nums tracking-tighter">#{rank ?? "--"}</p>
                 </div>
              </div>

              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => nextAction ? navigate(`/student/learn`) : navigate(`/student/study-plan`)}
                className="px-8 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl group"
              >
                {nextAction ? <Zap className="w-4 h-4 fill-current" /> : <Layers className="w-4 h-4" />}
                {nextAction ? "ACCESS PROTOCOL" : "SYNC ROADMAP"}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </motion.button>
           </div>
        </CardGlass>

        <CardGlass className="p-8 border-white bg-white/60 flex flex-col justify-between">
           <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                 <ShieldCheck className="w-6 h-6" />
              </div>
              <Activity className="w-5 h-5 text-indigo-500 opacity-20" />
           </div>
           
           <div className="space-y-1 mt-auto mb-10">
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Credential Rank</p>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Identity Tier {level}</h3>
           </div>

           <div className="space-y-8">
              <div className="space-y-3">
                 <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Sequence Integrity</span>
                    <span className="text-slate-800">{accuracy.toFixed(0)}%</span>
                 </div>
                 <div className="h-1 bg-slate-100 rounded-full p-0 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${accuracy}%` }} className="h-full bg-slate-800" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="p-4 rounded-xl bg-white border border-slate-50 shadow-sm text-center">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">STREAK</p>
                    <p className="text-base font-bold text-slate-800">{student?.streakDays ?? 0}d</p>
                 </div>
                 <div className="p-4 rounded-xl bg-white border border-slate-50 shadow-sm text-center">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">XP YIELD</p>
                    <p className="text-base font-bold text-slate-800">{xp > 1000 ? (xp/1000).toFixed(1)+'k' : xp}</p>
                 </div>
              </div>
           </div>
        </CardGlass>
      </section>

      {/* ── Operational Timeline ── */}
      <section className="grid grid-cols-1 xl:grid-cols-4 gap-10">
         <div className="xl:col-span-3 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                     <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Daily Logic Vector</h2>
               </div>
               <button onClick={() => navigate("/student/study-plan")} className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-all">Full Manifest</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {(plan?.length ?? 0) > 0 ? plan?.slice(0, 6).map((item, i) => {
                  const Icon = typeIcon[item.type] || BookOpen;
                  const isDone = item.status === "completed";
                  return (
                    <CardGlass key={item.id} className={cn("p-6 border-white bg-white/40 group transition-all", isDone && "opacity-40")}>
                       <div className="flex items-start justify-between mb-8">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600", isDone ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white text-slate-400 border-slate-100 shadow-sm")}>
                             <Icon className="w-4.5 h-4.5" />
                          </div>
                          {isDone ? <CheckCircle className="w-4.5 h-4.5 text-emerald-500" /> : <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest py-1 px-2 border border-slate-100 rounded-lg">{item.estimatedMinutes}M</div>}
                       </div>
                       <h4 className="text-xs font-bold text-slate-800 tracking-tight line-clamp-2 leading-relaxed min-h-[2.4rem] mb-6">{item.title}</h4>
                       {!isDone && (
                         <button onClick={() => navigate(`/student/learn`)} className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">EXECUTE</button>
                       )}
                    </CardGlass>
                  );
               }) : (
                 <div className="md:col-span-3 py-20 text-center border-2 border-dashed border-slate-50 rounded-[2.5rem]">
                    <Cpu className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">No Operational Vectors Initialized</p>
                 </div>
               )}
            </div>
         </div>

         {/* Sector Analytics */}
         <div className="xl:col-span-1 space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
               <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                  <BarChart3 className="w-4.5 h-4.5" />
               </div>
               <h2 className="text-lg font-bold text-slate-800 tracking-tight">Sector Probe</h2>
            </div>
            
            <CardGlass className="p-7 border-white bg-white/60 space-y-7">
               {perf?.subjectAccuracy ? Object.entries(perf.subjectAccuracy).slice(0, 5).map(([sub, acc], i) => (
                 <div key={sub} className="space-y-2">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                       <span className="text-slate-400 truncate max-w-[120px]">{sub}</span>
                       <span className="text-slate-800 text-[10px] tabular-nums">{Number(acc).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full p-0 overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${acc}%` }} className="h-full bg-indigo-500" />
                    </div>
                 </div>
               )) : <p className="text-center text-[9px] font-bold text-slate-200 py-10 uppercase tracking-widest tracking-tighter">DATA UNAVAILABLE</p>}
            </CardGlass>

            <button onClick={() => navigate("/student/leaderboard")} className="w-full p-8 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden group text-left shadow-xl shadow-indigo-100">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-700" />
               <Sparkles className="w-8 h-8 text-white/40 mb-8" />
               <h3 className="text-base font-bold tracking-tight mb-2 leading-tight">Neural<br/>Ascension Plan</h3>
               <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest leading-relaxed mb-8 max-w-[180px]">Analyze weak segments and secure global port percentile.</p>
               <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-white/80 group-hover:gap-4 transition-all">Launch Analyzer <ArrowRight className="w-3 h-3" /></div>
            </button>
         </div>
      </section>
    </div>
  );
}
