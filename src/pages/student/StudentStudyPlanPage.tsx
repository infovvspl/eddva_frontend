import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, CheckCircle2, Clock, ChevronRight,
  Sparkles, Trophy, Target, Zap, 
  Layout, ListTodo, RefreshCw, Loader2,
  Play, SkipForward, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useTodaysPlan, useWeeklyPlan, useCompletePlanItem,
  useSkipPlanItem, useRegeneratePlan,
} from "@/hooks/use-student";
<<<<<<< HEAD
import { StudyPlanItem, PlanItemType } from "@/lib/api/student";
import { toast } from "sonner";
import { LanguageSelector } from "@/components/LanguageSelector";
import { sarvamTranslateMany, getStoredLanguage } from "@/lib/api/sarvam";
=======
import type { StudyPlanItem } from "@/lib/api/student";
>>>>>>> 6001d4f1a65eecb3bf3fd2350afc992db7751fd1

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE = "#2563EB";
const BLUE_VIBRANT = "#3B82F6";
const PURPLE = "#7C3AED";
const SLATE_INNER = "rgba(255, 255, 255, 0.4)";

const typeConfig: Record<StudyPlanItem["type"], { icon: any; color: string; label: string; xp: number }> = {
  lecture:     { icon: Play,         color: "#2563EB", label: "Core Lecture", xp: 15 },
  quiz:        { icon: Sparkles,     color: "#7C3AED", label: "Neural Quiz",  xp: 10 },
  practice:    { icon: Target,       color: "#10B981", label: "Combat Prep",  xp: 15 },
  revision:    { icon: RefreshCw,    color: "#F59E0B", label: "Optimization", xp: 5  },
  mock_test:   { icon: Trophy,       color: "#8B5CF6", label: "Grand Quest",  xp: 50 },
  diagnostic:  { icon: Zap,          color: "#EF4444", label: "Evaluation",   xp: 25 },
};

// ─── Components ────────────────────────────────────────────────────────────

<<<<<<< HEAD
const typeNav: Record<PlanItemType, (refId: string | null | undefined) => string> = {
  lecture:       id => validId(id) ? `/student/lectures/${validId(id)}` : `/student/learn`,
  practice:      id => validId(id) ? `/student/learn/topic/${validId(id)}` : `/student/learn`,
  mock_test:     id => validId(id) ? `/student/quiz?mockTestId=${validId(id)}` : `/student/learn`,
  battle:        ()  => `/student/battle`,
  revision:      id => validId(id) ? `/student/learn/topic/${validId(id)}` : `/student/learn`,
  doubt_session: ()  => `/student/doubts`,
};

function getWeekDates(offset = 0) {
  const today = new Date();
  today.setDate(today.getDate() + offset * 7);
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end:   sunday.toISOString().split("T")[0],
    label: `${monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
  };
}

<<<<<<< HEAD
// ─── Plan Item Card ───────────────────────────────────────────────────────────

function PlanItemCard({ item, translatedTitle }: { item: StudyPlanItem; translatedTitle?: string }) {
  const navigate    = useNavigate();
  const complete    = useCompletePlanItem();
  const skip        = useSkipPlanItem();
  const cfg         = typeConfig[item.type];
  const isDone      = item.status === "completed";
  const isSkipped   = item.status === "skipped";

  const handleComplete = () => {
    complete.mutate(item.id, {
      onSuccess: () => toast.success(`+${cfg.xp} XP earned! ✨`),
      onError:   () => toast.error("Failed to update"),
    });
  };

  const handleSkip = () => {
    skip.mutate(item.id, {
      onSuccess: () => toast.info("Rescheduled to tomorrow"),
      onError:   () => toast.error("Failed to skip"),
    });
  };

  const handleOpen = () => navigate(typeNav[item.type](item.refId));
=======
// ─── Plan Item Card ────────────────────────────────────────────────────────────
function PlanItemCard({ item }: { item: StudyPlanItem }) {
  const navigate  = useNavigate();
  const complete  = useCompletePlanItem();
  const skip      = useSkipPlanItem();
  const cfg       = typeConfig[item.type];
  const isDone    = item.status === "completed";
  const isSkipped = item.status === "skipped";
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={!isDone && !isSkipped ? { y: -1, boxShadow: `0 6px 20px rgba(1,56,137,0.08)` } : {}}
      className={`bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 transition-all shadow-sm ${isDone || isSkipped ? "opacity-60" : ""}`}
    >
      {/* Type icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
<<<<<<< HEAD
        <p className={`text-sm font-semibold truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {translatedTitle ?? item.title}
=======
        <p className={`text-sm font-bold truncate ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
          {item.title}
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-semibold capitalize" style={{ color: cfg.color }}>
            {item.type.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />{item.estimatedMinutes}m
          </span>
          {!isDone && !isSkipped && (
            <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />+{cfg.xp} XP
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {isDone ? (
        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
      ) : isSkipped ? (
        <span className="text-xs text-gray-400 shrink-0 px-2 py-1 rounded-lg bg-gray-50">Rescheduled</span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => skip.mutate(item.id, { onSuccess: () => toast.info("Rescheduled"), onError: () => toast.error("Failed") })}
            disabled={skip.isPending}
            className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={() => complete.mutate(item.id, { onSuccess: () => toast.success(`+${cfg.xp} XP earned! ✨`), onError: () => toast.error("Failed") })}
            disabled={complete.isPending}
            className="w-8 h-8 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
          >
            {complete.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" /> : <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
          </button>
          <button
            onClick={() => navigate(typeNav[item.type](item.refId))}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: BLUE, boxShadow: `0 2px 8px ${BLUE}30` }}
          >
            Start
          </button>
        </div>
=======
function PlanItemCard({ item }: { item: StudyPlanItem }) {
  const navigate = useNavigate();
  const complete = useCompletePlanItem();
  const skip     = useSkipPlanItem();
  const cfg      = typeConfig[item.type];
  const isDone   = item.status === "completed";
  const isSkip   = item.status === "skipped";

  const handleAction = () => {
    if (isDone || isSkip) return;
    if (item.type === "lecture" && item.refId) navigate(`/student/lecture/${item.refId}`);
    else if (item.refId) navigate(`/student/quiz?mockTestId=${item.refId}`);
  };

  return (
    <motion.div
      whileHover={!isDone ? { y: -8, scale: 1.01 } : {}}
      className={cn(
        "relative group transition-all duration-500",
        isDone ? "opacity-60" : "opacity-100"
>>>>>>> 6001d4f1a65eecb3bf3fd2350afc992db7751fd1
      )}
    >
      <div className={cn(
        "bg-white/40 backdrop-blur-3xl border rounded-[2rem] p-6 shadow-2xl relative overflow-hidden",
        isDone ? "border-slate-100" : "border-white/40 shadow-blue-500/5"
      )}>
        {/* Glow Effect */}
        {!isDone && (
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        
        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-2xl border border-current opacity-70",
                isDone ? "text-slate-400" : ""
              )} style={!isDone ? { color: cfg.color } : {}}>
                {cfg.label}
              </span>
              {(item as any).topic?.name && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                  • {(item as any).topic.name}
                </span>
              )}
            </div>
            <h3 className={cn(
              "text-lg font-black tracking-tight leading-tight mb-2",
              isDone ? "text-slate-400 line-through" : "text-slate-900"
            )}>
              {item.title}
            </h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">+ {cfg.xp} Neural EXP</p>
          </div>

          <div className={cn(
            "w-16 h-16 rounded-[1.75rem] flex items-center justify-center border shadow-inner transition-transform group-hover:rotate-6",
            isDone ? "bg-slate-50 border-slate-100" : "bg-white/60 border-white/80"
          )}>
            <cfg.icon className={cn("w-8 h-8", isDone ? "text-slate-300" : "")} style={!isDone ? { color: cfg.color } : {}} />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {isDone ? (
               <span className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle className="w-4 h-4" /> Mastery Confirmed
               </span>
             ) : isSkip ? (
               <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Postponed</span>
             ) : (
               <button 
                 onClick={handleAction} 
                 className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-600 transition-colors shadow-xl"
               >
                 Initiate Session
               </button>
             )}
          </div>

          <div className="flex items-center gap-1.5">
             {!isDone && !isSkip && (
               <>
                 <button onClick={() => complete.mutate(item.id)} className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                 </button>
                 <button onClick={() => skip.mutate(item.id)} className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                    <SkipForward className="w-5 h-5" />
                 </button>
               </>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

<<<<<<< HEAD
<<<<<<< HEAD
// ─── Weekly View ──────────────────────────────────────────────────────────────

function WeeklyView({ lang }: { lang: string }) {
=======
// ─── Weekly View ───────────────────────────────────────────────────────────────
function WeeklyView() {
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
  const [weekOffset, setWeekOffset] = useState(0);
  const { start, end, label } = getWeekDates(weekOffset);
  const { data: items, isLoading } = useWeeklyPlan(start, end);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lang === "en-IN" || !items?.length) { setTranslations({}); return; }
    const titles = items.map((i) => i.title);
    sarvamTranslateMany(titles, lang).then((translated) => {
      const map: Record<string, string> = {};
      items.forEach((item, idx) => { map[item.id] = translated[idx]; });
      setTranslations(map);
    }).catch(() => setTranslations({}));
  }, [lang, items]);
=======
// ─── Weekly Planner ────────────────────────────────────────────────────────
>>>>>>> 6001d4f1a65eecb3bf3fd2350afc992db7751fd1

function WeeklyManager() {
  const { data: weekMap, isLoading } = useWeeklyPlan();
  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500/20" /></div>;
  if (!weekMap) return null;

  const entries = Object.entries(weekMap).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  return (
<<<<<<< HEAD
    <div>
      <div className="flex items-center justify-between mb-5">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setWeekOffset(v => v - 1)}
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </motion.button>
        <div className="text-center">
          <p className="text-sm font-black text-gray-900">{label}</p>
          {weekOffset === 0 && <p className="text-xs font-bold" style={{ color: BLUE }}>This week</p>}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setWeekOffset(v => v + 1)}
          className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </motion.button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: BLUE }} />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-semibold">No tasks scheduled this week</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort().map(([date, dayItems]) => {
            const isToday = date === today;
            const d = new Date(date);
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={isToday ? { background: BLUE_L } : { background: "#F8FAFF" }}
                  >
                    <Calendar className="w-3.5 h-3.5" style={{ color: isToday ? BLUE : "#9CA3AF" }} />
                    <p className={`text-sm font-black ${isToday ? "" : "text-gray-500"}`} style={isToday ? { color: BLUE } : {}}>
                      {isToday ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{dayItems.length} tasks</span>
                </div>
                <div className="space-y-2">
                  {dayItems.map(item => <PlanItemCard key={item.id} item={item} translatedTitle={translations[item.id]} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
=======
    <div className="space-y-16">
      {entries.map(([dateStr, dayItems]) => {
        const d = new Date(dateStr);
        const isToday = new Date().toDateString() === d.toDateString();
        return (
          <div key={dateStr} className="relative">
            <div className="flex items-center gap-6 mb-8 group">
               <div className={cn(
                 "w-16 h-16 rounded-[2rem] flex flex-col items-center justify-center border shadow-2xl transition-all group-hover:scale-110",
                 isToday ? "bg-blue-600 border-blue-500 text-white" : "bg-white border-white text-slate-900"
               )}>
                 <span className="text-[10px] font-black uppercase opacity-60 leading-none mb-0.5">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                 <span className="text-xl font-black">{d.getDate()}</span>
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-2">
                    {isToday ? "Active Frequency" : d.toLocaleDateString("en-IN", { weekday: "long" })}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dayItems.length} Quests Loaded</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
              {dayItems.map(item => <PlanItemCard key={item.id} item={item} />)}
            </div>
          </div>
        );
      })}
>>>>>>> 6001d4f1a65eecb3bf3fd2350afc992db7751fd1
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentStudyPlanPage() {
  const [tab, setTab] = useState<"today" | "week">("today");
  const [lang, setLang] = useState<string>(() => getStoredLanguage());
  const [todayTranslations, setTodayTranslations] = useState<Record<string, string>>({});
  const { data: todayItems, isLoading } = useTodaysPlan();
  const regenerate = useRegeneratePlan();
  const navigate = useNavigate();

<<<<<<< HEAD
<<<<<<< HEAD
  useEffect(() => {
    if (lang === "en-IN" || !todayItems?.length) { setTodayTranslations({}); return; }
    const titles = todayItems.map((i) => i.title);
    sarvamTranslateMany(titles, lang).then((translated) => {
      const map: Record<string, string> = {};
      todayItems.forEach((item, idx) => { map[item.id] = translated[idx]; });
      setTodayTranslations(map);
    }).catch(() => setTodayTranslations({}));
  }, [lang, todayItems]);

  const completed  = todayItems?.filter(i => i.status === "completed").length ?? 0;
  const total      = todayItems?.length ?? 0;
  const pct        = total > 0 ? (completed / total) * 100 : 0;
  const totalXP    = todayItems?.filter(i => i.status !== "skipped")
=======
  const completed = todayItems?.filter(i => i.status === "completed").length ?? 0;
  const total     = todayItems?.length ?? 0;
  const pct       = total > 0 ? (completed / total) * 100 : 0;
  const totalXP   = todayItems?.filter(i => i.status !== "skipped")
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
    .reduce((sum, i) => sum + (typeConfig[i.type]?.xp ?? 5), 0) ?? 0;

  return (
<<<<<<< HEAD
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Plan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI-generated daily tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector value={lang} onChange={setLang} />
          <button
            onClick={handleRegenerate}
            disabled={regenerate.isPending}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors disabled:opacity-50"
          >
            {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate
          </button>
        </div>
      </div>
=======
    <div className="min-h-screen p-5 sm:p-6" style={{ background: "#F5F7FB" }}>
      <div className="max-w-2xl mx-auto space-y-5">
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
=======
  const stats = useMemo(() => {
    const completed = todayItems?.filter(i => i.status === "completed").length ?? 0;
    const total     = todayItems?.length ?? 0;
    const pct       = total > 0 ? (completed / total) * 100 : 0;
    const totalXP   = todayItems?.filter(i => i.status !== "skipped")
      .reduce((sum, i) => sum + (typeConfig[i.type]?.xp ?? 5), 0) ?? 0;
    return { pct, totalXP, total };
  }, [todayItems]);

  const dashStats = [
    { label: "Operation Completion", value: `${Math.round(stats.pct)}%`, sub: `${todayItems?.filter(i => i.status === "completed").length}/${stats.total} Missions`, icon: Target, color: "#2563EB" },
    { label: "Daily Experience",     value: `${stats.totalXP} XP`,      sub: "Points to secure today", icon: Zap,    color: "#F59E0B" },
    { label: "Global Standing",    value: "Iron II",                  sub: "Top 12% in Batch",       icon: Trophy, color: "#7C3AED" },
  ];

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] custom-scrollbar">
      {/* ── Aero Dynamic Background ── */}
    
>>>>>>> 6001d4f1a65eecb3bf3fd2350afc992db7751fd1

      <div className="relative z-10 px-6 sm:px-10 py-8 max-w-[1700px] mx-auto">
        {/* ── Aero Dashboard Hook ── */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-10 mb-12">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900 text-white w-fit shadow-xl"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural Intelligence Roadmap</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Mission<br/><span className="not-italic text-blue-600">Mastery</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm sm:text-base max-w-lg leading-relaxed">
              Your real-time generated study path. Every completed module increases neural retention by 1.4x.
            </p>
          </div>

          <div className="flex flex-wrap gap-8">
            {dashStats.map((s, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-6 min-w-[240px] shadow-2xl group hover:scale-105 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform mb-4" style={{ color: s.color }}>
                  <s.icon className="w-6 h-6" />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{s.label}</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </header>

        {/* ── Content Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
          
          <div className="xl:col-span-3 space-y-12">
            {/* Nav & Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-200/60">
              <div className="flex bg-slate-100 p-2 rounded-[2.5rem] w-fit shadow-inner">
                {[
                  { id: "today", label: "Active Grid", icon: Layout },
                  { id: "week",  label: "Weekly View",  icon: ListTodo },
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id as any)}
                    className={cn(
                      "flex items-center gap-3 px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all",
                      tab === t.id ? "bg-white text-slate-900 shadow-2xl scale-110" : "text-slate-400 hover:text-slate-600"
                    )}>
                    <t.icon className={cn("w-4.5 h-4.5", tab === t.id ? "text-blue-600" : "")} />
                    {t.label}
                  </button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => regenerate.mutate(undefined, { onSuccess: () => toast.success("Roadmap Recalibrated") })}
                className="flex items-center gap-4 px-10 py-5 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl text-xs font-black text-slate-900 hover:bg-slate-50 transition-all group"
              >
                {regenerate.isPending ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <RefreshCw className="w-5 h-5 text-blue-600 group-hover:rotate-180 transition-transform duration-500" />}
                Recalibrate Path
              </motion.button>
            </div>
<<<<<<< HEAD
          ) : (
            <div className="space-y-3">
              {todayItems.map(item => <PlanItemCard key={item.id} item={item} />)}
            </div>
          )
        ) : (
<<<<<<< HEAD
          <div className="space-y-2.5">
            {todayItems.map(item => <PlanItemCard key={item.id} item={item} translatedTitle={todayTranslations[item.id]} />)}
          </div>
        )
      ) : (
        <WeeklyView lang={lang} />
      )}
=======
          <WeeklyView />
        )}
=======

            <AnimatePresence mode="wait">
              {tab === "today" ? (
                <motion.div key="today" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-10">
                   <div className="flex items-center gap-6 mb-12">
                     <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                        <Target className="w-8 h-8 text-blue-600" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase italic leading-none">The Daily Grid</h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-[0.25em]">Precision Sequenced • Batch {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                     </div>
                   </div>
                   {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500/20" /></div> : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       {todayItems?.map(item => <PlanItemCard key={item.id} item={item} />)}
                       {todayItems?.length === 0 && (
                          <div className="md:col-span-2 py-32 text-center bg-white/40 border border-dashed border-slate-200 rounded-[3.5rem] backdrop-blur-xl">
                             <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                             <p className="text-xl font-black text-slate-300 uppercase tracking-widest italic">All Missions Complete</p>
                             <p className="text-sm font-bold text-slate-300 mt-2">Check the weekly view for upcoming quests.</p>
                          </div>
                       )}
                     </div>
                   )}
                </motion.div>
              ) : (
                <motion.div key="week" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <WeeklyManager />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Stats */}
          <aside className="xl:col-span-1 h-[calc(100vh-14rem)] sticky top-40 space-y-12 min-w-0">
             <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3.5rem] p-10 shadow-3xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                <h4 className="text-lg font-black text-slate-900 uppercase italic mb-8 flex items-center justify-between">
                   Sync Stream
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                </h4>
                <div className="space-y-8">
                   {[
                     { label: "Quantum Physics", val: 78, color: "bg-blue-600" },
                     { label: "Organic Chemistry", val: 45, color: "bg-purple-600" },
                     { label: "Calculus Base", val: 92, color: "bg-emerald-500" },
                   ].map((prog, i) => (
                     <div key={i}>
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                           <span>{prog.label}</span>
                           <span className="text-slate-900">{prog.val}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${prog.val}%` }} className={cn("h-full rounded-full shadow-lg", prog.color)} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-slate-900 rounded-[3.5rem] p-10 shadow-3xl relative overflow-hidden group">
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                <Sparkles className="w-12 h-12 text-blue-400 mb-8" />
                <p className="text-2xl font-black text-white italic leading-tight mb-4">Ascend to Rank<br/><span className="text-blue-400 not-italic">Tier III Mastery</span></p>
                <p className="text-sm font-bold text-white/30 uppercase tracking-[0.15em] leading-relaxed mb-10">Verify 4 more modules before Sunday to secure your batch percentile.</p>
                <button 
                  onClick={() => navigate("/student/leaderboard")}
                  className="w-full py-5 rounded-2xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/20 transition-all"
                >
                  View Standings
                </button>
             </div>
          </aside>
        </div>
>>>>>>> 6001d4f1a65eecb3bf3fd2350afc992db7751fd1
      </div>
>>>>>>> 65ae41bbcc96ba8dbde77931ffc6961dfcd2e0ed
    </div>
  );
}