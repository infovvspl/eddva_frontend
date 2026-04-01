import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLeaderboard, useStudentMe } from "@/hooks/use-student";

// ─── Tier config ──────────────────────────────────────────────────────────────

const tierColors: Record<string, string> = {
  champion:   "#f59e0b",
  diamond:    "#67e8f9",
  platinum:   "#a78bfa",
  gold:       "#fbbf24",
  silver:     "#94a3b8",
  bronze:     "#a16207",
  iron:       "#64748b",
};

const tierIcon: Record<string, React.ReactNode> = {
  champion: <Crown className="w-3.5 h-3.5" />,
  diamond:  <Trophy className="w-3.5 h-3.5" />,
  platinum: <Medal className="w-3.5 h-3.5" />,
  gold:     <Medal className="w-3.5 h-3.5" />,
};

type ScopeType = "global" | "state" | "city" | "school" | "subject" | "battle_xp";

const SCOPES: { key: ScopeType; label: string }[] = [
  { key: "global",    label: "Global" },
  { key: "city",      label: "City" },
  { key: "school",    label: "Institute" },
  { key: "battle_xp", label: "Battle XP" },
];

// ─── Podium ───────────────────────────────────────────────────────────────────

function Podium({ entries }: { entries: { rank: number; name: string; score: number; eloTier?: string }[] }) {
  const top3 = [entries[1], entries[0], entries[2]].filter(Boolean);
  const podiumHeights = ["h-20", "h-28", "h-16"];
  const medals = ["🥈", "🥇", "🥉"];
  const bgColors = ["bg-slate-500/20", "bg-amber-500/20", "bg-amber-700/20"];

  return (
    <div className="flex items-end justify-center gap-3 mb-8 px-4">
      {top3.map((entry, i) => {
        if (!entry) return null;
        const tier = entry.eloTier?.toLowerCase();
        const color = tierColors[tier ?? "iron"];
        return (
          <motion.div key={entry.rank}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="flex-1 flex flex-col items-center"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-1.5"
              style={{ background: color + "22", border: `2px solid ${color}44` }}>
              {entry.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-semibold text-foreground text-center truncate w-full px-1">{entry.name.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground">{entry.score.toLocaleString()}</p>

            {/* Podium block */}
            <div className={`w-full ${podiumHeights[i]} ${bgColors[i]} rounded-t-xl mt-2 flex items-start justify-center pt-2`}>
              <span className="text-2xl">{medals[i]}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Rank Row ─────────────────────────────────────────────────────────────────

function RankRow({
  entry,
  isMe,
}: {
  entry: { rank: number; name: string; score: number; eloTier?: string; city?: string };
  isMe?: boolean;
}) {
  const tier = entry.eloTier?.toLowerCase();
  const color = tierColors[tier ?? "iron"] ?? "#94a3b8";

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
        ${isMe ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/20"}`}
    >
      {/* Rank number */}
      <div className="w-8 text-center shrink-0">
        {entry.rank <= 3 ? (
          <span className="text-lg">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
        ) : (
          <span className={`text-sm font-bold ${isMe ? "text-primary" : "text-muted-foreground"}`}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: color + "22", border: `1.5px solid ${color}44` }}>
        {entry.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : "text-foreground"}`}>
          {entry.name} {isMe && <span className="text-xs">(You)</span>}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {tier && tierIcon[tier] && (
            <span className="flex items-center gap-0.5 text-xs" style={{ color }}>
              {tierIcon[tier]}
              <span className="capitalize">{tier}</span>
            </span>
          )}
          {entry.city && <span className="text-xs text-muted-foreground">· {entry.city}</span>}
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isMe ? "text-primary" : "text-foreground"}`}>
          {entry.score.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentLeaderboardPage() {
  const [scope, setScope] = useState<ScopeType>("global");
  const { data: me } = useStudentMe();
  const { data: lb, isLoading } = useLeaderboard({ scope });

  const entries   = lb?.data ?? [];
  const myRank    = lb?.currentStudentRank;
  const top3      = entries.slice(0, 3);
  const rest      = entries.slice(3);
  const myId      = me?.student?.id;

  // Check if current student is visible in the list
  const meInList  = entries.some(e => e.studentId === myId);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Compete, rank up, win</p>
      </div>

      {/* My rank card */}
      {myRank && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3.5 mb-5 flex items-center gap-4">
          <div>
            <p className="text-3xl font-bold text-primary">#{myRank.rank}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your rank</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-lg font-bold text-foreground">{myRank.score.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Your score</p>
          </div>
          {myRank.rank > 1 && entries[myRank.rank - 2] && (
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Behind #{myRank.rank - 1}</p>
              <p className="text-sm font-bold text-amber-400">
                {(entries[myRank.rank - 2].score - myRank.score).toLocaleString()} pts
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scope tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {SCOPES.map(s => (
          <button key={s.key} onClick={() => setScope(s.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors
              ${scope === s.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-foreground">No data yet</p>
          <p className="text-sm mt-1">Complete tests to appear on the leaderboard</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && <Podium entries={top3} />}

          {/* List */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/50">
              {entries.map(entry => (
                <RankRow
                  key={entry.studentId}
                  entry={entry}
                  isMe={entry.studentId === myId}
                />
              ))}

              {/* My row if not in visible list */}
              {!meInList && myRank && (
                <>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <div className="flex-1 border-t border-dashed border-border/60" />
                    <span className="text-xs text-muted-foreground shrink-0">Your position</span>
                    <div className="flex-1 border-t border-dashed border-border/60" />
                  </div>
                  <RankRow
                    entry={{
                      rank: myRank.rank,
                      name: me?.fullName ?? "You",
                      score: myRank.score,
                    }}
                    isMe
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}