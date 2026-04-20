import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, Sparkles, Trophy, Target, Zap,
  RefreshCw, Loader2, Play, SkipForward, CheckCircle,
  CalendarDays, ListChecks, ChevronRight,
  BookOpen, Brain, Swords, MessageSquare, Lock, Flame, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CardGlass } from "@/components/shared/CardGlass";
import {
  useTodaysPlan, useWeeklyPlanGrouped, useCompletePlanItem,
  useSkipPlanItem, useRegeneratePlan, useStudentMe
} from "@/hooks/use-student";
import type { StudyPlanItem } from "@/lib/api/student";

function toYoutubeEmbed(url?: string | null): string | null {
  if (!url) return null;
  const raw = String(url).trim();
  const idFromWatch = raw.match(/[?&]v=([^&]+)/)?.[1];
  const idFromShort = raw.match(/youtu\.be\/([^?&/]+)/)?.[1];
  const idFromEmbed = raw.match(/youtube\.com\/embed\/([^?&/]+)/)?.[1];
  const idFromShorts = raw.match(/youtube\.com\/shorts\/([^?&/]+)/)?.[1];
  const idFromLive = raw.match(/youtube\.com\/live\/([^?&/]+)/)?.[1];
  const id = idFromWatch || idFromShort || idFromEmbed || idFromShorts || idFromLive;
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

// ─── Type Config ───────────────────────────────────────────────────────────────
const typeConfig: Record<StudyPlanItem["type"], {
  icon: any; color: string; bg: string; label: string; xp: number;
}> = {
  lecture: { icon: Play, color: "#4f46e5", bg: "#e0e7ff", label: "Lecture", xp: 15 }, // indigo
  practice: { icon: Target, color: "#10b981", bg: "#d1fae5", label: "Practice", xp: 15 }, // emerald
  revision: { icon: BookOpen, color: "#f59e0b", bg: "#fef3c7", label: "Notes / Video", xp: 5 }, // amber
  mock_test: { icon: Trophy, color: "#ec4899", bg: "#fce7f3", label: "Mock Test", xp: 50 }, // pink
  battle: { icon: Swords, color: "#ef4444", bg: "#fee2e2", label: "Battle", xp: 30 }, // red
  doubt_session: { icon: MessageSquare, color: "#8b5cf6", bg: "#ede9fe", label: "Doubt Session", xp: 10 }, // violet
};

// ─── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ item, onOpenVideo }: { item: StudyPlanItem; onOpenVideo: (url: string, title: string) => void }) {
  const navigate = useNavigate();
  const complete = useCompletePlanItem();
  const skip = useSkipPlanItem();
  const cfg = typeConfig[item.type] ?? typeConfig.lecture;
  const isDone = item.status === "completed";
  const isSkip = item.status === "skipped";

  const handleStart = () => {
    if (isDone || isSkip) return;
    const taskKind = item.content?.taskKind;
    const topicId = item.content?.topicId || item.refId;
    if (taskKind === "youtube_video") {
      const embed = toYoutubeEmbed(item.content?.videoUrl);
      if (embed) {
        onOpenVideo(embed, item.content?.videoTitle || item.title);
      } else {
        toast.error("No YouTube video found for this topic yet.");
      }
      return;
    }
    if (taskKind === "ai_notes" && topicId) {
      navigate(`/student/ai-study/${topicId}`);
      return;
    }
    if (item.type === "lecture" && item.refId) navigate(`/student/lectures/${item.refId}`);
    else if (item.type === "revision" && topicId) navigate(`/student/ai-study/${topicId}`);
    else if (topicId) navigate(`/student/quiz?topicId=${topicId}`);
  };

  return (
    <CardGlass className={cn(
      "p-5 mb-3 border-white bg-white/50 transition-all duration-300",
      isDone ? "opacity-70" : isSkip ? "opacity-60" : "hover:bg-white/70"
    )}>
      <div className="flex items-center gap-4">
      {/* Icon block */}
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/80 shadow-sm",
        isDone ? "bg-emerald-100 text-emerald-500" : isSkip ? "bg-gray-100 text-gray-400" : ""
      )} style={(!isDone && !isSkip) ? { backgroundColor: cfg.bg, color: cfg.color } : {}}>
         <cfg.icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{cfg.label}</span>
          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
            +{cfg.xp} XP
          </span>
        </div>
        <h4 className={cn("text-base font-black truncate tracking-tight", isDone || isSkip ? "text-slate-500 line-through" : "text-slate-900")}>
           {item.title}
        </h4>
        <div className="flex items-center gap-4 mt-1 text-xs font-semibold text-slate-500">
           <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {(item as any).estimatedMinutes || "15"} mins</span>
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0 flex items-center gap-2">
         {isDone ? (
           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" /> Completed
           </div>
         ) : isSkip ? (
            <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold border border-gray-200">
               Skipped
            </div>
         ) : (
            <div className="flex items-center gap-1">
               <>
                 <button onClick={() => skip.mutate(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition" title="Skip Task">
                   <SkipForward className="w-4 h-4" />
                 </button>
                 <button onClick={() => complete.mutate(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition" title="Mark Complete">
                   <CheckCircle className="w-4 h-4" />
                 </button>
               </>
               <button onClick={handleStart} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 hover:bg-indigo-600 transition shadow-sm ml-1 uppercase tracking-wide">
                  <Play className="w-4 h-4 fill-current" /> Start
               </button>
            </div>
         )}
      </div>
      </div>
    </CardGlass>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentStudyPlanPage() {
  const { data: todayItemsRaw = [], isLoading } = useTodaysPlan();
  const regenerate = useRegeneratePlan();
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const [videoPlayer, setVideoPlayer] = useState<{ url: string; title: string } | null>(null);
  const streakDetails = me?.student?.streakDays || 0;

  const todayItems = todayItemsRaw;

  // Week map
  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { start: fmt(monday), end: fmt(sunday) };
  }, []);
  const { data: weekMap } = useWeeklyPlanGrouped(weekDates.start, weekDates.end);

  const stats = useMemo(() => {
    const total = todayItems.length;
    const completed = todayItems.filter(i => i.status === "completed").length;
    const skipped = todayItems.filter(i => i.status === "skipped").length;
    const pending = total - completed - skipped;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let totalMins = 0;
    let xpPending = 0;
    todayItems.forEach(i => {
       totalMins += ((i as any).estimatedMinutes || 15);
       if (i.status === "pending") xpPending += (typeConfig[i.type]?.xp ?? 5);
    });
    
    return { total, completed, skipped, pending, pct, totalMins, xpPending };
  }, [todayItems]);

  const pendingItems = todayItems.filter(i => i.status === "pending");
  const doneItems = todayItems.filter(i => i.status === "completed");
  const skipItems = todayItems.filter(i => i.status === "skipped");

  // Group by subjects
  const currentSubjects = useMemo(() => {
     const subMap: Record<string, StudyPlanItem[]> = {};
     todayItems.forEach(i => {
        const sub = i.content?.subjectName || "General";
        if (!subMap[sub]) subMap[sub] = [];
        subMap[sub].push(i);
     });
     return subMap;
  }, [todayItems]);

  const upcomingTomorrow = useMemo(() => {
     if (!weekMap) return [];
     const tmrw = new Date();
     tmrw.setDate(tmrw.getDate() + 1);
     const dateStr = tmrw.toISOString().split("T")[0];
     return weekMap[dateStr] || [];
  }, [weekMap]);

  if (isLoading) return (
     <div className="py-40 flex justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 pb-32 font-sans text-slate-900">
      
      {/* 1. TOP SECTION (DAILY FOCUS) */}
      <CardGlass className="rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sticky top-0 z-40 bg-gradient-to-br from-indigo-600 to-indigo-800 border-white/20">
         <div className="absolute -top-24 -right-10 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
         
         <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">
               <CalendarDays className="w-4 h-4" /> Today's Focus
            </div>
            <h1 className="text-3xl font-bold mb-3">Your Personalized Plan 🚀</h1>
            <div className="flex items-center gap-4 text-sm font-semibold text-indigo-100">
               <span className="bg-indigo-900/40 px-3 py-1 rounded-lg backdrop-blur-sm">{stats.total} Tasks</span>
               <span className="bg-indigo-900/40 px-3 py-1 rounded-lg backdrop-blur-sm">~{stats.totalMins} mins</span>
               <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-lg backdrop-blur-sm">+{stats.xpPending} XP Reward</span>
            </div>
         </div>
         
    
      </CardGlass>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 flex flex-col space-y-8">

            {/* 3. PROGRESS TRACKER */}
            {stats.total > 0 && (
               <CardGlass className="p-6 border-white bg-white/55 flex items-center gap-6">
                  <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-indigo-50 shrink-0">
                     <svg className="w-full h-full -rotate-90">
                        <circle className="text-slate-100 stroke-current" strokeWidth="6" cx="32" cy="32" r="28" fill="transparent"></circle>
                        <motion.circle className="text-indigo-500 stroke-current" strokeWidth="6" strokeLinecap="round" cx="32" cy="32" r="28" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * stats.pct) / 100} initial={{ strokeDashoffset: 175 }} animate={{ strokeDashoffset: 175 - (175 * stats.pct) / 100 }} transition={{ duration: 1 }}></motion.circle>
                     </svg>
                     <span className="absolute text-sm font-bold text-indigo-700">{stats.pct}%</span>
                  </div>
                  <div className="flex-1">
                     <h3 className="text-lg font-bold text-slate-800">Daily Progress</h3>
                     <p className="text-sm font-medium text-slate-500 mt-1">{stats.completed} of {stats.total} tasks completed today. Keep going!</p>
                  </div>
               </CardGlass>
            )}

            {/* 4. WEEKLY VIEW */}
            <CardGlass className="p-6 border-white bg-white/55 overflow-hidden">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Weekly Consistency
               </h3>
               <div className="flex gap-2 justify-between">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                     const d = new Date(weekDates.start);
                     d.setDate(d.getDate() + i);
                     const dayKey = d.toISOString().split("T")[0];
                     const tasks = weekMap?.[dayKey] || [];
                     const hasTask = tasks.length > 0;
                     const completed = tasks.filter((t) => t.status === "completed").length;
                     const isToday = dayKey === new Date().toISOString().split("T")[0];
                     let status: 'done' | 'missed' | 'upcoming' | 'today' = 'upcoming';
                     if (isToday) status = 'today';
                     else if (hasTask && completed === tasks.length) status = 'done';
                     else if (hasTask && completed < tasks.length && dayKey < new Date().toISOString().split("T")[0]) status = 'missed';

                     return (
                        <div key={day} className="flex flex-col items-center gap-2">
                           <span className={cn("text-xs font-bold", status === 'today' ? "text-indigo-600" : "text-slate-400")}>{day}</span>
                           <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px]",
                              status === 'done' ? "bg-emerald-100 text-emerald-600" :
                              status === 'missed' ? "bg-red-50 text-red-500" :
                              status === 'today' ? "bg-indigo-600 text-white shadow-md border-2 border-indigo-200" :
                              "bg-slate-50 text-slate-300 border border-slate-100"
                           )}>
                              {status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : 
                               status === 'missed' ? "✖" : 
                               status === 'today' ? "🚀" : "○"}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </CardGlass>

            {/* 5. SUBJECT / CHAPTER BREAKDOWN & 2. DAILY TASK LIST */}
            {todayItems.length === 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl mb-2">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <p className="text-xs font-semibold text-indigo-700">
                  Your monthly AI plan has not been generated yet for <span className="font-extrabold">{(me?.student?.examTarget ?? "your exam").toUpperCase().replace("_", " ")}</span>.
                  Click <span className="font-extrabold">Generate Smart Plan</span> to build a 30-day schedule from your last month tests and weak topics.
                </p>
              </div>
            )}
            <div className="space-y-8">
               {Object.entries(currentSubjects).map(([sub, items]) => (
                  <div key={sub}>
                     <h3 className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase mb-3 px-1">{sub} TASKS</h3>
                     <div>
                        {items.map(item => <TaskCard key={item.id} item={item} onOpenVideo={(url, title) => setVideoPlayer({ url, title })} />)}
                     </div>
                  </div>
               ))}
            </div>

         </div>

         {/* RIGHT SIDEBAR */}
         <div className="lg:col-span-4 space-y-6">

            {/* 7. AI PLAN SUPER FEATURE */}
            <div className="p-[2px] rounded-2xl bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 shadow-md">
               <CardGlass className="bg-white rounded-[14px] p-6 text-center border-white">
                  <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 mb-1">AI Smart Plan</h3>
                  <p className="text-xs font-semibold text-slate-500 mb-5 leading-relaxed">Adjust difficulty, focus on weak areas, and balance subjects magically.</p>
                  <button
                    onClick={() =>
                      regenerate.mutate(undefined, {
                        onSuccess: () => toast.success("Smart plan generated."),
                        onError: () => toast.error("Could not generate plan right now. Please try again."),
                      })
                    }
                    disabled={regenerate.isPending}
                    className="w-full py-3 bg-gradient-to-r from-indigo-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                     {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Generate Smart Plan
                  </button>
               </CardGlass>
            </div>

            {/* 8. STREAK & CONSISTENCY */}
            <CardGlass className="p-6 overflow-hidden relative border-white bg-white/55">
               <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-orange-50 rounded-full blur-2xl" />
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> Consistency</h3>
               <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-orange-400 to-red-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                     <Flame className="w-8 h-8 fill-current opacity-90" />
                  </div>
                  <div>
                     <p className="text-3xl font-black text-slate-800 leading-none mb-1">{streakDetails}</p>
                     <p className="text-sm font-bold text-orange-600">Day Streak</p>
                  </div>
                  <div className="ml-auto flex -space-x-2">
                     {[1,2,3,4,5].map((_, i) => (
                        <div key={i} className={cn("w-6 h-8 rounded-md bg-orange-100 border border-white", i < stats.total / 3 ? "bg-orange-500" : "")} />
                     ))}
                  </div>
               </div>
               <p className="text-xs font-semibold text-slate-500 mt-4 relative z-10">Keep going! Finish today's tasks to maintain your streak.</p>
            </CardGlass>

            {/* 9. REWARDS / XP SYSTEM */}
            <CardGlass className="p-6 border-white bg-white/55">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-yellow-500" /> Today's Rewards</h3>
               
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50 border border-yellow-100/50">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                           <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">Task XP</span>
                     </div>
                     <span className="font-bold text-yellow-600">+{stats.xpPending}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-100/50">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                           <Flame className="w-4 h-4 fill-current" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">Streak Bonus</span>
                     </div>
                     <span className="font-bold text-orange-600">+1</span>
                  </div>
               </div>
            </CardGlass>

            {/* 6. UPCOMING TASKS */}
            <CardGlass className="p-6 border-white bg-white/55">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tomorrow</h3>
               
               {upcomingTomorrow.length > 0 ? (
                  <div className="space-y-3">
                     {upcomingTomorrow.slice(0, 3).map((task, i) => (
                        <div key={i} className="flex gap-3 items-center">
                           <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400"><Lock className="w-3.5 h-3.5" /></div>
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-700 text-sm truncate">{task.title}</p>
                              <p className="text-xs font-semibold text-slate-400">{(task as any).estimatedMinutes || "15"} mins</p>
                           </div>
                        </div>
                     ))}
                     {upcomingTomorrow.length > 3 && (
                        <p className="text-xs text-center font-bold text-indigo-500 mt-2 hover:underline cursor-pointer">+ {upcomingTomorrow.length - 3} more tasks</p>
                     )}
                  </div>
               ) : (
                  <p className="text-sm font-semibold text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">No tasks prepared yet.</p>
               )}
            </CardGlass>

         </div>
      </div>

      <AnimatePresence>
        {videoPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"
            onClick={() => setVideoPlayer(null)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 10, scale: 0.98 }}
              className="w-full max-w-5xl bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                <h3 className="text-sm font-bold truncate pr-4">{videoPlayer.title}</h3>
                <button onClick={() => setVideoPlayer(null)} className="text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20">
                  Close
                </button>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  src={videoPlayer.url}
                  title={videoPlayer.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
