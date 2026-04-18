import { Trophy, Medal, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLeaderboard, useStudentMe } from "@/hooks/use-student";

const RANK_CONFIG: Record<number, { icon: React.ReactNode; color: string; bg: string }> = {
  1: { icon: <Trophy className="w-4 h-4" />, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  2: { icon: <Medal  className="w-4 h-4" />, color: "text-slate-400",  bg: "bg-slate-100 dark:bg-slate-800/50" },
  3: { icon: <Medal  className="w-4 h-4" />, color: "text-amber-600",  bg: "bg-amber-100 dark:bg-amber-900/30" },
};

const AVATAR_COLORS = ["from-violet-400 to-purple-500","from-pink-400 to-rose-500","from-blue-400 to-indigo-500","from-emerald-400 to-teal-500"];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function LeaderboardPreview() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const { data: lb } = useLeaderboard({ scope: "global" });

  const myId     = me?.student?.id;
  const entries  = lb?.data ?? [];
  const myRank   = lb?.currentStudentRank;
  const top3     = entries.slice(0, 3);
  const meInTop3 = top3.some(e => e.studentId === myId);

  return (
    <div className="space-y-2.5">
      {top3.map((entry, i) => {
        const isMe = entry.studentId === myId;
        const rankCfg = RANK_CONFIG[entry.rank];
        return (
          <div key={entry.studentId}
            className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all",
              isMe ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-card hover:border-border")}>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black",
              rankCfg ? cn(rankCfg.color, rankCfg.bg) : "bg-muted text-muted-foreground")}>
              {rankCfg ? rankCfg.icon : `#${entry.rank}`}
            </div>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold bg-gradient-to-br", AVATAR_COLORS[i % AVATAR_COLORS.length])}>
              {entry.avatarUrl
                ? <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                : initials(entry.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold truncate", isMe && "text-primary")}>
                {isMe ? "You" : entry.name}
              </p>
              <p className="text-xs text-muted-foreground">{entry.score.toLocaleString()} XP</p>
            </div>
            {rankCfg && <span className={cn("text-xs font-black", rankCfg.color)}>#{entry.rank}</span>}
          </div>
        );
      })}

      {/* Show current user if not already in top 3 */}
      {!meInTop3 && myRank && (
        <>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px border-t border-dashed border-border" />
            <span className="text-[10px] text-muted-foreground">· · ·</span>
            <div className="flex-1 h-px border-t border-dashed border-border" />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/40 bg-primary/5 ring-1 ring-primary/20">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground text-xs font-black">
              #{myRank.rank}
            </div>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold bg-gradient-to-br", AVATAR_COLORS[3])}>
              {initials(me?.fullName ?? "You")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-primary">You</p>
              <p className="text-xs text-muted-foreground">{myRank.score.toLocaleString()} XP</p>
            </div>
          </div>
        </>
      )}

      <button onClick={() => navigate("/student/leaderboard")}
        className="w-full text-center text-sm font-semibold text-primary hover:underline flex items-center justify-center gap-1 pt-1">
        Full Leaderboard <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
