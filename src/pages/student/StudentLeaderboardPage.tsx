import { motion } from "framer-motion";
import {
  Trophy, Medal, Flame, Zap,
  Award, Target, BarChart3,
} from "lucide-react";
import { useStudentMe } from "@/hooks/use-student";
import { cn } from "@/lib/utils";
import {
  WeeklyXPChart,
  RankTrajectoryChart,
  SubjectRadarChart,
  TierDistributionChart,
  SubjectXPChart,
  ActivityHeatmap,
} from "@/components/student/leaderboard/LeaderboardCharts";

// ── Dummy stats (replace with API) ────────────────────────────────────────────
const MY_STATS = { streak: 14, xp: 7340, accuracy: 74, testsAttempted: 34, rank: 14 };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StudentLeaderboardPage() {
  const { data: me } = useStudentMe();

  return (
    <div className="space-y-10 pb-20">


      {/* ── ANALYTICS SECTION ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-8">

        {/* Section heading */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white text-slate-900 w-fit shadow-lg">
            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Performance Matrix</span>
          </div>
        </div>
   

        {/* Stat cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Current Rank",    value: `#${MY_STATS.rank}`,          icon: <Trophy className="w-5 h-5" />, color: "from-amber-500/10 to-yellow-500/5",  iconCls: "bg-amber-100 text-amber-600" },
            { label: "Total XP",        value: MY_STATS.xp.toLocaleString(), icon: <Zap    className="w-5 h-5" />, color: "from-blue-500/10 to-indigo-500/5",   iconCls: "bg-blue-100 text-blue-600" },
            { label: "Day Streak",      value: `${MY_STATS.streak} days`,    icon: <Flame  className="w-5 h-5" />, color: "from-rose-500/10 to-pink-500/5",     iconCls: "bg-rose-100 text-rose-600" },
            { label: "Accuracy",        value: `${MY_STATS.accuracy}%`,      icon: <Target className="w-5 h-5" />, color: "from-emerald-500/10 to-teal-500/5",  iconCls: "bg-emerald-100 text-emerald-600" },
          ].map(s => (
            <div key={s.label} className={cn("rounded-2xl p-5 border border-border/50 bg-gradient-to-br shadow-sm hover:-translate-y-0.5 transition-all", s.color)}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.iconCls)}>{s.icon}</div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-[10px] font-black text-slate-500 mt-0.5 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <WeeklyXPChart />
          <RankTrajectoryChart />
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SubjectRadarChart />
          <SubjectXPChart />
          <TierDistributionChart />
        </div>

      

        {/* Insight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🚀", title: "Climbing Fast",     body: "You gained 5 ranks this week. Keep the momentum!",    border: "border-blue-200 bg-blue-50/60" },
            { icon: "⚡", title: "XP Spike Saturday", body: "Your best day is Saturday — plan heavy sessions then.", border: "border-violet-200 bg-violet-50/60" },
            { icon: "🧬", title: "Biology is Strong", body: "85% accuracy — your strongest subject by far.",         border: "border-emerald-200 bg-emerald-50/60" },
          ].map(ins => (
            <div key={ins.title} className={cn("rounded-2xl p-5 border", ins.border)}>
              <span className="text-2xl">{ins.icon}</span>
              <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight mt-2">{ins.title}</p>
              <p className="text-xs font-bold text-slate-500 mt-1 leading-relaxed">{ins.body}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
