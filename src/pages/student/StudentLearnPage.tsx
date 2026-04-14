import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Lock, CheckCircle,
  Play, Clock, Loader2, Sparkles, Flame, Zap,
  Trophy, Target, TrendingUp,
  ArrowRight, ArrowLeft, Layers, BarChart2, FileText,
  Headphones, Rocket, Medal, Crown,
} from "lucide-react";
import {
  useSubjects, useChapters, useProgressOverview,
  useStudentMe, useMyPerformance, useNextAction,
  useTopicProgress, useStudentLectures, useStudyStatus,
} from "@/hooks/use-student";
import { cn } from "@/lib/utils";
import { CardGlass } from "@/components/shared/CardGlass";

// ─── Shared Utilities ──────────────────────────────────────────────────────────

const ProgressRing = ({ pct, size = 56, stroke = 5, color = "#818cf8" }: {
  pct: number; size?: number; stroke?: number; color?: string;
}) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: dash }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
};

const SectionHeader = ({ icon: Icon, title, sub, color = "#6366f1" }: {
  icon: any; title: string; sub?: string; color?: string;
}) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 bg-slate-50 shadow-sm">
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      {sub && <p className="text-[11px] font-medium text-slate-500 tracking-wide mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Hero Section ──────────────────────────────────────────────────────────────

function LearningHero({ me, nextAction }: { me: any; nextAction: any }) {
  const navigate = useNavigate();
  const xp = me?.student?.xpPoints ?? 0;
  const streak = me?.student?.streakDays ?? 0;
  const level = Math.floor(xp / 1000) + 1;
  const xpPct = (xp % 1000) / 10;

  const handleResume = () => {
    if (!nextAction) return;
    if (nextAction.type === "lecture") navigate(`/student/lectures/${nextAction.refId}`);
    else if (nextAction.refId) navigate(`/student/quiz?mockTestId=${nextAction.refId}`);
  };

  return (
    <div className="p-8 sm:p-12 mb-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-50/50 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100/50">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span className="text-[11px] font-bold text-orange-600 tracking-wide">{streak} Day Streak</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50">
            <Zap className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
            <span className="text-[11px] font-bold text-indigo-600 tracking-wide">+{Math.round(xpPct * 10)} XP Today</span>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center">
          <div className="flex-1 min-w-0">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
              Welcome back, <span className="text-indigo-600">{me?.name || "Student"}</span>.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-500 text-sm font-medium max-w-xl mb-10 leading-relaxed">
              Your learning journey is progressing beautifully. You consistenly outperform the baseline by <span className="text-indigo-600 font-bold">1.4×</span>. Keep the momentum going!
            </motion.p>

            <div className="mb-10 max-w-md">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 tracking-wide mb-3">
                <span>Tier {level} Progress</span>
                <span className="text-indigo-600">{Math.round(xpPct)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: "#6366f1" }} initial={{ width: 0 }} animate={{ width: `${Math.min(xpPct, 100)}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleResume} className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-slate-900 shadow-lg shadow-slate-200 transition-all hover:bg-black">
                <Play className="w-4 h-4 fill-white" /> Resume Learning
              </motion.button>
            </div>
          </div>

          <div className="lg:w-64 bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 shrink-0 relative">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-slate-100 shadow-sm">
                <Crown className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status</p>
                <p className="text-lg font-bold text-slate-900">{me?.student?.currentEloTier || "Iron II"}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
              <span className="flex items-center gap-2"><Medal className="w-4 h-4 text-indigo-500" /> {me?.student?.rank ? `Rank #${me.student.rank}` : "Unranked"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Today's Focus Card ────────────────────────────────────────────────────────

function TodaysFocusCard({ action }: { action: any }) {
  const navigate = useNavigate();
  if (!action) return null;

  const handleClick = () => {
    if (action.type === "lecture") navigate(`/student/lectures/${action.refId}`);
    else if (action.refId) navigate(`/student/quiz?mockTestId=${action.refId}`);
  };

  return (
    <button onClick={handleClick} className="w-full text-left p-8 mb-10 bg-white border border-slate-100 rounded-[2rem] shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all duration-300">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-slate-50/50 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none" />
      <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
        <div className="space-y-4 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">Next Task</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 flex items-center gap-2"><Zap className="w-3.5 h-3.5 fill-current" /> +250 XP Rewards</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">{action.title}</h2>
        </div>
        <div className="relative shrink-0 flex items-center justify-center">
          <ProgressRing pct={38} size={80} stroke={6} color="#6366f1" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-6 h-6 text-indigo-600 fill-current translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Learning Path (Roadmap) ───────────────────────────────────────────────────

function ChapterNode({ chapter, index, total, subjectProgress, onAction }: {
  chapter: any; index: number; total: number; subjectProgress: number;
  onAction: (type: string, chapterId: string) => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const isFirst = index === 0;
  const isDone = subjectProgress > ((index + 1) / total) * 100;
  const isCurrent = !isDone && isFirst;
  const isLocked = !isDone && !isCurrent && index > 1;

  const statusIcon = isDone
    ? <CheckCircle className="w-5 h-5 text-indigo-600" />
    : isCurrent
    ? <Rocket className="w-5 h-5 text-indigo-600" />
    : <Lock className="w-5 h-5 text-slate-300" />;

  return (
    <div className="flex gap-8 relative">
      <div className="flex flex-col items-center gap-0 shrink-0">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 z-10 bg-white shadow-sm"
          style={{
            borderColor: isDone ? "#e0e7ff" : isCurrent ? "#6366f1" : "#f1f5f9",
          }}
        >
          {statusIcon}
        </motion.div>
        {index < total - 1 && (
          <div className="w-px flex-1 my-2 rounded-full bg-slate-100" style={{ minHeight: 60 }} />
        )}
      </div>

      <div className="flex-1 min-w-0 pb-10">
        <button className="w-full text-left focus:outline-none" onClick={() => !isLocked && setExpanded(e => !e)}>
          <div className={cn(
            "flex items-center justify-between rounded-2xl px-6 py-5 border transition-all duration-300 group",
            isCurrent ? "bg-white border-indigo-200 shadow-md" : isDone ? "bg-white border-slate-100" : "bg-slate-50/30 border-slate-100 opacity-60",
          )}>
            <div className="flex-1 min-w-0">
               <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isCurrent ? "text-indigo-600" : "text-slate-400")}>
                {isDone ? "Completed" : isCurrent ? "Currently Studying" : "Upcoming Section"}
              </p>
              <h4 className={cn("text-lg font-bold tracking-tight truncate", isLocked ? "text-slate-400" : "text-slate-900")}>
                {chapter.name}
              </h4>
            </div>
            {!isLocked && (
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <ChevronRight className={cn("w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform", expanded && "rotate-90")} />
              </div>
            )}
          </div>
        </button>

        <AnimatePresence>
          {expanded && !isLocked && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex gap-3 mt-4 px-1 flex-wrap">
                {[
                  { key: "lecture", label: "Video", icon: Play, color: "#6366f1", bg: "#f5f3ff" },
                  { key: "practice", label: "Practice", icon: Target, color: "#10b981", bg: "#f0fdf4" },
                  { key: "test", label: "Assessment", icon: BarChart2, color: "#f59e0b", bg: "#fffbeb" },
                ].map(a => (
                  <motion.button key={a.key} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => onAction(a.key, chapter.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-wide border border-transparent shadow-sm" style={{ color: a.color, background: a.bg }}>
                    <a.icon className={cn("w-3.5 h-3.5")} /> {a.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Quick Hub ─────────────────────────────────────────────────────────────────

function QuickHub() {
  const navigate = useNavigate();
  const items = [
    { label: "Drills", icon: Target, color: "#6366f1", bg: "#f5f3ff", path: "/student/quiz" },
    { label: "Archive", icon: FileText, color: "#10b981", bg: "#f0fdf4", path: "/student/learn" },
    { label: "Audits", icon: Trophy, color: "#f59e0b", bg: "#fffbeb", path: "/student/quiz" },
    { label: "Help", icon: Headphones, color: "#ec4899", bg: "#fdf2f8", path: "/student/doubts" },
  ];

  return (
    <div className="p-8 mb-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500 fill-current" /> Quick Access
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, i) => (
          <motion.button key={i} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-2.5 py-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 group transition-all">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <span className="text-[10px] font-bold text-slate-600 tracking-wide">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentLearnPage() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: nextAction } = useNextAction();
  const { data: subjects = [] } = useSubjects();
  const { data: overview } = useProgressOverview();
  useMyPerformance();

  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const activeSub = subjects.find(s => s.id === activeSubId) || subjects[0];
  const { data: chapters = [], isLoading: chapsLoading } = useChapters(activeSub?.id ?? "");

  const subjectProgress = useMemo(() => {
    if (!(overview as any)?.subjectProgress) return {} as Record<string, number>;
    return (overview as any).subjectProgress.reduce((acc: Record<string, number>, s: any) => {
      acc[s.subjectId] = s.percentage;
      return acc;
    }, {} as Record<string, number>);
  }, [overview]);

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <LearningHero me={me} nextAction={nextAction} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-12 items-start">
          <div className="space-y-10 min-w-0">
            <TodaysFocusCard action={nextAction} />

            <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
              <SectionHeader icon={Layers} title="Course Pipeline" sub="Chapter-wise progression" color="#6366f1" />

              <div className="flex gap-2.5 overflow-x-auto pb-6 mb-10 hide-scrollbar scroll-smooth">
                {subjects.slice(0, 6).map((sub) => {
                  const active = activeSub?.id === sub.id;
                  const pct = subjectProgress[sub.id] ?? 0;
                  return (
                    <motion.button key={sub.id} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveSubId(sub.id)}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3 rounded-xl border shrink-0 transition-all text-[11px] font-bold tracking-wide whitespace-nowrap",
                        active ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:text-slate-900"
                      )}>
                      <div className={cn("w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white", active ? "bg-indigo-500" : "bg-white text-slate-400 border border-slate-100")}>{Math.round(pct)}</div>
                      {sub.name}
                    </motion.button>
                  );
                })}
              </div>

              {chapsLoading ? (
                <div className="py-24 flex flex-col items-center gap-4"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /><p className="text-[11px] font-bold tracking-wide text-slate-300">Loading curriculum...</p></div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((chap, i) => (
                    <ChapterNode key={chap.id} chapter={chap} index={i} total={chapters.length} subjectProgress={subjectProgress[activeSub?.id ?? ""] ?? 0}
                      onAction={(type) => (type === "lecture" ? navigate(`/student/lectures`) : navigate(`/student/quiz?chapterId=${chap.id}`))} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="xl:sticky xl:top-32 space-y-10 min-w-0">
            <QuickHub />
            <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-500" /> Progression Metrics</h3>
              <div className="space-y-4">
                {[
                  { label: "Topics Mastered", value: "4 / 7", icon: CheckCircle, color: "#10b981" },
                  { label: "Study Credits", value: "1h 24m", icon: Clock, color: "#6366f1" },
                  { label: "Avg. Accuracy", value: "78%", icon: Target, color: "#f59e0b" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-2xl px-5 py-4 bg-slate-50 border border-slate-100 transition-colors hover:bg-white">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 bg-white"><s.icon className="w-5 h-5" style={{ color: s.color }} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                      <p className="text-lg font-bold text-slate-900 leading-none">{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none group-hover:scale-150 transition-transform duration-700" />
               <Sparkles className="w-8 h-8 text-white/40 mb-6" />
               <p className="text-lg font-bold text-white leading-snug mb-8">"You've completed <span className="text-white underline decoration-white/30 decoration-2">82%</span> of your weekly goals. Keep pushing!"</p>
               <button onClick={() => navigate("/student/leaderboard")} className="w-full py-4 rounded-xl text-xs font-bold text-indigo-600 bg-white flex items-center justify-center gap-2.5 transition-all hover:scale-[1.03]">View Leaderboard <ArrowRight className="w-4 h-4" /></button>
            </div>
          </aside>
        </div>
    </div>
  );
}

export function TopicDetailPage() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const { data: topicProgress } = useTopicProgress(topicId!);
  useStudyStatus(topicId!);
  const { data: me } = useStudentMe();
  const batchId = me?.student?.batchId || "";
  const { data: lectures, isLoading: lecturesLoading } = useStudentLectures(batchId, topicId!);

  return (
    <div className="flex flex-col space-y-10 pb-32">
        <button onClick={() => navigate("/student/learn")} className="flex items-center gap-2.5 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Learn
        </button>

        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-900 text-white">Topic Detail</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 flex items-center gap-2"><Zap className="w-3.5 h-3.5 fill-current" /> Active Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10 tracking-tight">
            {(topicProgress as any)?.topic?.name || "Topic Modules"}
          </h1>

          {lecturesLoading ? (
            <div className="py-24 flex flex-col items-center gap-4"><Loader2 className="w-10 h-10 animate-spin text-slate-100" /><p className="text-xs font-bold text-slate-300">Gathering modules...</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(lectures ?? []).map((lec: any, i: number) => (
                <motion.div key={lec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <button onClick={() => navigate(`/student/lectures/${lec.id}`)} className="w-full text-left p-6 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-slate-900 truncate">{lec.title}</p>
                        <div className="flex items-center gap-4 mt-1.5">
                           <p className="text-[11px] font-bold text-slate-400 tracking-wide flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-indigo-400" /> {Math.round((lec.videoDurationSeconds ?? 0) / 60)} Minutes runtime</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
