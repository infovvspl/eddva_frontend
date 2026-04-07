import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Lock, CheckCircle, BookOpen,
  Play, Clock, Loader2, Sparkles, Flame, Zap, 
  Trophy, Target, Brain, TrendingUp, Globe,
  ArrowRight, Star, AlertCircle, MessageCircle,
  ArrowLeft, Layers,
} from "lucide-react";
import {
  useSubjects, useChapters, useTopics, useProgressOverview,
  useStudentMe, useMyPerformance, useNextAction,
  useTopicProgress, useStudentLectures, useStudyStatus,
} from "@/hooks/use-student";
import { TopicStatus } from "@/lib/api/student";
import { cn } from "@/lib/utils";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE          = "#2563EB";
const PURPLE        = "#7C3AED";
const INDIGO        = "#4F46E5";
const EMERALD       = "#10B981";
const AMBER         = "#F59E0B";

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

// ─── Hero: Learning Control Center ───────────────────────────────────────────

function LearningHero({ me, nextAction }: { me: any; nextAction: any }) {
  const navigate = useNavigate();
  const xpPct = (me?.student?.xp % 1000) / 10;
  const level = Math.floor((me?.student?.xp || 0) / 1000) + 1;

  const handleResume = () => {
    if (!nextAction) return;
    if (nextAction.type === "lecture") navigate(`/student/lecture/${nextAction.refId}`);
    else if (nextAction.refId) navigate(`/student/quiz?mockTestId=${nextAction.refId}`);
  };

  return (
    <div className="relative mb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-4 flex-1 min-w-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">3 Day Streak</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">45m Left Today</span>
             </div>
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
            Continue Your<br/><span className="not-italic text-blue-600 underline decoration-blue-200 underline-offset-8">Expedition</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm sm:text-base max-w-lg leading-relaxed">
            Your personalized AI roadmap is calibrated. You are <strong>1.4x</strong> more likely to retain information in this session.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(37,99,235,0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResume}
            className="group flex items-center gap-6 px-10 py-5 rounded-[2.5rem] bg-slate-900 text-white shadow-3xl hover:bg-blue-600 transition-all"
          >
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Play className="w-5 h-5 fill-white" />
             </div>
             <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-0.5">Primary Directive</p>
                <p className="text-lg font-bold italic tracking-tight">RESUME LEARNING</p>
             </div>
             <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
          </motion.button>
        </div>

        <div className="lg:w-72 space-y-4">
           <CardGlass className="p-6">
              <div className="flex items-center justify-between mb-3">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Rank Status</p>
                 <span className="text-[10px] font-black text-blue-600 italic">Tier {level} Mastery</span>
              </div>
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl rotate-3">
                    <Trophy className="w-8 h-8 text-white" />
                 </div>
                 <div>
                    <p className="text-xl font-black text-slate-900 leading-none">Iron II</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Nearing Bronze</p>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-2">
                    <span>Exp Progress</span>
                    <span>{Math.round(xpPct)}%</span>
                 </div>
                 <ProgressBar pct={xpPct} color={`linear-gradient(90deg, ${BLUE}, ${INDIGO})`} className="h-1.5" />
                 <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest text-center">450 XP until Level {level + 1}</p>
              </div>
           </CardGlass>
        </div>
      </div>
    </div>
  );
}

// ─── Today's Mission ──────────────────────────────────────────────────────────

function MissionCard({ action }: { action: any }) {
  const navigate = useNavigate();
  if (!action) return null;

  return (
    <CardGlass className="p-1 max-w-4xl cursor-pointer group" onClick={() => navigate(action.type === "lecture" ? `/student/lecture/${action.refId}` : `/student/quiz?mockTestId=${action.refId}`)}>
       <div className="rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 blur-[70px] rounded-full -mr-24 -mt-24" />
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
             <div className="space-y-5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                   <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-[0.25em]">Today's Focus</div>
                   <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                      <Zap className="w-3 h-3 fill-emerald-400" /> +250 XP
                   </div>
                </div>
                <div>
                   <h2 className="text-2xl sm:text-3xl font-black italic uppercase leading-none tracking-tight mb-3">{action.title}</h2>
                   <p className="text-white/60 font-bold uppercase tracking-widest text-[9px] flex items-center gap-4">
                      <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Core Synthesis</span>
                      <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> 25 Minutes</span>
                   </p>
                </div>
             </div>
             
             <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-3xl group-hover:rotate-12 transition-transform shrink-0">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
             </div>
          </div>
       </div>
    </CardGlass>
  );
}

// ─── Module Explorer ──────────────────────────────────────────────────────────

function SubjectCard({ subject, progress, active, onClick }: { subject: any; progress: number; active: boolean; onClick: () => void }) {
  const Icon = subject.name.toLowerCase().includes("physics") ? Zap :
               subject.name.toLowerCase().includes("math") ? TrendingUp :
               subject.name.toLowerCase().includes("chem") ? Sparkles : Brain;
  return (
    <CardGlass onClick={onClick} className={cn("p-5", active ? "ring-2 ring-blue-600 shadow-blue-500/10" : "bg-white border-slate-100")}>
       <div className="flex items-center gap-4 mb-4">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400")}>
             <Icon className="w-5 h-5" />
          </div>
          <div>
             <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight italic">{subject.name}</h4>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{Math.round(progress)}% Mastery</p>
          </div>
       </div>
       <ProgressBar pct={progress} color={active ? BLUE : "#94A3B8"} className="h-1.5" />
    </CardGlass>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function StudentLearnPage() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: nextAction } = useNextAction();
  const { data: subjects = [], isLoading: subsLoading } = useSubjects();
  const { data: overview } = useProgressOverview();
  const { data: performance } = useMyPerformance();

  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const activeSub = subjects.find(s => s.id === activeSubId) || subjects[0];
  const { data: chapters = [], isLoading: chapsLoading } = useChapters(activeSub?.id);

  const subjectProgress = useMemo(() => {
    if (!(overview as any)?.subjectProgress) return {};
    return (overview as any).subjectProgress.reduce((acc: any, s: any) => {
      acc[s.subjectId] = s.percentage;
      return acc;
    }, {});
  }, [overview]);

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] custom-scrollbar selection:bg-blue-600/10">
      {/* ── Aero Dynamic Background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-100/15 blur-[120px] rounded-full -mr-[300px] -mt-[300px]" />
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-purple-100/15 blur-[120px] rounded-full -ml-[300px] -mb-[300px]" />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto px-6 sm:px-10 py-8">
        <LearningHero me={me} nextAction={nextAction} />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
          <div className="xl:col-span-3 space-y-12">
             
             {/* 🎯 Today's Mission */}
             <section className="space-y-8">
                <MissionCard action={nextAction} />
             </section>

             {/* 🧪 Module Explorer */}
             <section className="space-y-8">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-2xl">
                         <Layers className="w-6 h-6" />
                      </div>
                      <div>
                         <h2 className="text-xl font-black text-slate-900 uppercase italic leading-none">Learning Path</h2>
                         <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Structural Progression Synthesis</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                   {subjects.slice(0, 3).map(sub => (
                      <SubjectCard 
                        key={sub.id} 
                        subject={sub} 
                        progress={subjectProgress[sub.id] || 0} 
                        active={activeSub?.id === sub.id} 
                        onClick={() => setActiveSubId(sub.id)}
                      />
                   ))}
                </div>

                <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-8 shadow-3xl">
                   <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-4 custom-scrollbar">
                      <span className="text-[9px] font-black uppercase text-slate-400 px-3 py-1.5 rounded-full border border-slate-200 shrink-0">Current Stage</span>
                      <ChevronRight className="w-4 h-4 text-slate-200 shrink-0" />
                      <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight shrink-0">{activeSub?.name} Overview</h3>
                   </div>
                   
                   <div className="space-y-4">
                      {chapsLoading ? (
                         <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500/20" /></div>
                      ) : chapters.map((chap, i) => (
                         <div key={chap.id} className="flex items-start gap-6 group">
                            <div className="flex flex-col items-center">
                               <div className="w-8 h-8 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-[10px] font-black text-slate-400 shadow-inner group-hover:border-blue-500 group-hover:text-blue-500 transition-all">
                                  {i + 1}
                               </div>
                               {i < chapters.length - 1 && <div className="w-0.5 h-16 bg-slate-100 group-hover:bg-blue-100 transition-all" />}
                            </div>
                            <div className="flex_1 pt-1 min-w-0">
                               <h4 className="text-base font-black text-slate-900 uppercase italic mb-0.5 truncate">{chap.name}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{Math.round(subjectProgress[activeSub?.id] || 0)}% Chapter Maturity</p>
                               <div className="mt-4 flex flex-wrap gap-3">
                                  {["Lecture", "Combat Prep", "Grand Quest"].map((t, j) => (
                                     <button key={j} className="px-5 py-2.5 rounded-xl bg-white border border-slate-100 text-[9px] font-black uppercase tracking-widest shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all">
                                        {t}
                                     </button>
                                  ))}
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </section>

             {/* 📊 Performance Dashboard */}
             <section className="space-y-8 pb-16">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20 shadow-2xl">
                      <Brain className="w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase italic leading-none">Cognitive Insights</h2>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">AI Detection Profile</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <CardGlass className="p-8 border-emerald-500/10 bg-emerald-500/[0.02]">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                            <Star className="w-5 h-5 fill-white" />
                         </div>
                         <h4 className="text-base font-black text-slate-900 uppercase italic tracking-tight">Prime Zones</h4>
                      </div>
                      <div className="space-y-4">
                         {[
                           { label: "Classical Mechanics", val: 94 },
                           { label: "Thermodynamics", val: 88 },
                         ].map((p, i) => (
                           <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-white/60 border border-white shadow-sm">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.label}</span>
                              <span className="text-xs font-black text-emerald-500 italic">{p.val}% Eff.</span>
                           </div>
                         ))}
                      </div>
                   </CardGlass>

                   <CardGlass className="p-8 border-red-500/10 bg-red-500/[0.02]">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-500/20">
                            <AlertCircle className="w-5 h-5 fill-white" />
                         </div>
                         <h4 className="text-base font-black text-slate-900 uppercase italic tracking-tight">Sync Buffers</h4>
                      </div>
                      <div className="space-y-4">
                         {[
                           { label: "Organic Logic", val: 42 },
                           { label: "Probability Arrays", val: 38 },
                         ].map((p, i) => (
                           <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-white/60 border border-white shadow-sm">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.label}</span>
                              <button className="text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/5 px-3 py-1 rounded-lg border border-red-500/10 hover:bg-red-500 hover:text-white transition-all">
                                 Optimize
                              </button>
                           </div>
                         ))}
                      </div>
                   </CardGlass>
                </div>
             </section>
          </div>

          {/* ⚡ Quick Hub Dashboard */}
          <aside className="xl:col-span-1 h-[calc(100vh-12rem)] sticky top-28 space-y-8 min-w-0">
             <CardGlass className="p-8">
                <h4 className="text-sm font-black text-slate-900 uppercase italic mb-6 flex items-center justify-between">
                   Quick Hub
                   <Zap className="w-4 h-4 text-amber-500 fill-amber-300" />
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Practice", icon: Target, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Notes", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-50" },
                    { label: "Mocks", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Doubts", icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
                  ].map((act, i) => (
                    <button key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:scale-105 transition-all shadow-sm">
                       <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", act.bg)}>
                          <act.icon className={cn("w-4 h-4", act.color)} />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{act.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 italic">
                   <p className="text-[10px] font-bold text-slate-500 leading-relaxed">"Quest completion at <span className="text-blue-600 font-black">82%</span>. Rank ascension imminent."</p>
                </div>
             </CardGlass>
          </aside>
        </div>
      </div>

      {/* ── Floating Doubt Trigger ── */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }}
        className="fixed bottom-10 right-10 w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-3xl z-[100] group"
        onClick={() => navigate("/student/doubts")}
      >
        <div className="absolute inset-0 bg-blue-600/20 blur-2xl group-hover:blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-all" />
        <MessageCircle className="w-7 h-7 relative z-10" />
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 border-4 border-[#F8FAFC] flex items-center justify-center text-[9px] font-black">!</div>
      </motion.button>
    </div>
  );
}

export function TopicDetailPage() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const { data: topicProgress } = useTopicProgress(topicId!);
  const { data: studyStatus } = useStudyStatus(topicId!);
  const { data: me } = useStudentMe();
  
  const batchId = me?.student?.batchId || "";
  const { data: lectures, isLoading: lecturesLoading } = useStudentLectures(batchId, topicId!);

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] custom-scrollbar selection:bg-blue-600/10">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-100/15 blur-[120px] rounded-full -mr-[300px] -mt-[300px]" />
        <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-purple-100/15 blur-[120px] rounded-full -ml-[300px] -mb-[300px]" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-10 py-8">
         <button 
           onClick={() => navigate("/student/learn")}
           className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all mb-10"
         >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Expedition
         </button>

         <header className="mb-12 space-y-4">
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-600/10 text-blue-600 w-fit">
               <Zap className="w-3.5 h-3.5 fill-blue-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Active Module Focus</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-tight uppercase italic">
               {(topicProgress as any)?.topic?.name || "Topic Analytics"}
            </h1>
         </header>
      </div>
    </div>
  );
}
