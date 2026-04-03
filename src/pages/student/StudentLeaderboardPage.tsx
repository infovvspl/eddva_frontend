import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Loader2, Flame, Zap } from "lucide-react";
import { useLeaderboard, useStudentMe } from "@/hooks/use-student";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#013889";
const BLUE_M = "#0257c8";
const BLUE_L = "#E6EEF8";

const tierColors: Record<string, string> = {
  champion: "#f59e0b", diamond: "#67e8f9", platinum: "#a78bfa",
  gold: "#fbbf24", silver: "#94a3b8", bronze: "#a16207", iron: "#64748b",
};

const tierGradients: Record<string, string> = {
  champion: "from-amber-400 to-orange-500", diamond: "from-cyan-400 to-blue-500",
  platinum: "from-violet-400 to-purple-600", gold: "from-yellow-400 to-amber-500",
  silver: "from-slate-300 to-slate-500", bronze: "from-amber-700 to-orange-800",
  iron: "from-slate-500 to-slate-700",
};

type ScopeType = "global" | "state" | "city" | "school" | "subject" | "battle_xp";

const SCOPES: { key: ScopeType; label: string }[] = [
  { key: "global",    label: "Global"    },
  { key: "city",      label: "City"      },
  { key: "school",    label: "Institute" },
  { key: "battle_xp", label: "Battle XP" },
];

// ─── Podium ────────────────────────────────────────────────────────────────────
function Podium({ entries }: { entries: { rank: number; name: string; score: number; eloTier?: string }[] }) {
  const top3 = [entries[1], entries[0], entries[2]].filter(Boolean);
  const heights  = [96, 120, 80];
  const medals   = ["🥈", "🥇", "🥉"];
  const ringColor = ["#94a3b8", "#fbbf24", "#cd7f32"];

  return (
    <div className="flex items-end justify-center gap-4 mb-8 px-4 pt-4">
      {top3.map((entry, i) => {
        if (!entry) return null;
        const tier = entry.eloTier?.toLowerCase() ?? "iron";
        const color = tierColors[tier] ?? "#94a3b8";
        return (
          <motion.div key={entry.rank}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex-1 flex flex-col items-center"
          >
            {/* Crown for #1 */}
            {i === 1 && <Crown className="w-5 h-5 text-amber-400 mb-1" />}
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg mb-2"
              style={{ background: `linear-gradient(135deg, ${color}cc, ${color})`, boxShadow: `0 8px 24px ${color}44` }}
            >
              {entry.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-bold text-gray-900 text-center truncate w-full px-1">{entry.name.split(" ")[0]}</p>
            <p className="text-[11px] font-semibold mb-2" style={{ color }}>{entry.score.toLocaleString()} pts</p>
            {/* Podium block */}
            <div
              className="w-full rounded-t-2xl flex items-start justify-center pt-3 relative overflow-hidden"
              style={{
                height: heights[i],
                background: i === 1
                  ? `linear-gradient(160deg, ${BLUE} 0%, ${BLUE_M} 100%)`
                  : `linear-gradient(160deg, #e2e8f0 0%, #cbd5e1 100%)`,
              }}
            >
              <span className="text-2xl">{medals[i]}</span>
              {/* Shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Rank Row ──────────────────────────────────────────────────────────────────
function RankRow({ entry, isMe }: {
  entry: { rank: number; name: string; score: number; eloTier?: string; city?: string };
  isMe?: boolean;
}) {
  const tier  = entry.eloTier?.toLowerCase() ?? "iron";
  const color = tierColors[tier] ?? "#94a3b8";
  const grad  = tierGradients[tier] ?? tierGradients.iron;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all
        ${isMe
          ? "border-2 shadow-md"
          : "hover:bg-gray-50 border border-transparent"}`}
      style={isMe ? { borderColor: BLUE, background: BLUE_L, boxShadow: `0 4px 16px ${BLUE}15` } : {}}
    >
      {/* Rank */}
      <div className="w-9 text-center shrink-0">
        {entry.rank <= 3 ? (
          <span className="text-xl">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
        ) : (
          <span className={`text-sm font-black ${isMe ? "" : "text-gray-400"}`} style={isMe ? { color: BLUE } : {}}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${color}bb, ${color})` }}
      >
        {entry.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isMe ? "" : "text-gray-800"}`} style={isMe ? { color: BLUE } : {}}>
          {entry.name} {isMe && <span className="text-xs font-semibold text-gray-400">(You)</span>}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {tier && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${grad} text-white capitalize`}
            >
              {tier}
            </span>
          )}
          {entry.city && <span className="text-[11px] text-gray-400">· {entry.city}</span>}
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-black ${isMe ? "" : "text-gray-800"}`} style={isMe ? { color: BLUE } : {}}>
          {entry.score.toLocaleString()}
        </p>
        <p className="text-[10px] text-gray-400 font-medium">pts</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentLeaderboardPage() {
  const [scope, setScope] = useState<ScopeType>("global");
  const { data: me }              = useStudentMe();
  const { data: lb, isLoading }   = useLeaderboard({ scope });

  const entries  = lb?.data ?? [];
  const myRank   = lb?.currentStudentRank;
  const top3     = entries.slice(0, 3);
  const rest     = entries.slice(3);
  const myId     = me?.student?.id;
  const meInList = entries.some(e => e.studentId === myId);

  return (
    <div className="min-h-screen p-5 sm:p-6" style={{ background: "#F5F7FB" }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6"
          style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 60%, #0388d1 100%)` }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white opacity-5" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white opacity-5" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Leaderboard</h1>
                <p className="text-white/60 text-xs font-medium">Compete, rank up, win</p>
              </div>
            </div>
            {myRank && (
              <div className="flex items-center gap-4 mt-3 bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                <div>
                  <p className="text-3xl font-black text-white">#{myRank.rank}</p>
                  <p className="text-xs text-white/60 font-medium">Your rank</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-xl font-black text-white">{myRank.score.toLocaleString()}</p>
                  <p className="text-xs text-white/60 font-medium">Your score</p>
                </div>
                {myRank.rank > 1 && entries[myRank.rank - 2] && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-white/60">Behind #{myRank.rank - 1}</p>
                    <p className="text-sm font-black text-amber-300">
                      {(entries[myRank.rank - 2].score - myRank.score).toLocaleString()} pts
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Scope Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SCOPES.map(s => (
            <motion.button
              key={s.key}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setScope(s.key)}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={scope === s.key
                ? { background: BLUE, color: "#fff", boxShadow: `0 4px 12px ${BLUE}30` }
                : { background: "#fff", color: "#6b7280", border: "1px solid #E5E7EB" }}
            >
              {s.label}
            </motion.button>
          ))}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
            <p className="text-sm text-gray-400 font-medium">Loading rankings…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
            <Trophy className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600 text-base">No data yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete tests to appear on the leaderboard</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="border-b border-gray-100 py-6 px-4" style={{ background: "linear-gradient(180deg, #F8FAFF 0%, #fff 100%)" }}>
                <Podium entries={top3} />
              </div>
            )}

            {/* List */}
            <div className="p-3 space-y-1">
              {/* Show top entries */}
              {entries.map(entry => (
                <RankRow
                  key={entry.studentId}
                  entry={entry}
                  isMe={entry.studentId === myId}
                />
              ))}

              {/* My row if not visible */}
              {!meInList && myRank && (
                <>
                  <div className="flex items-center gap-2 py-2 px-3">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <span className="text-xs text-gray-400 shrink-0">Your position</span>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>
                  <RankRow
                    entry={{ rank: myRank.rank, name: me?.fullName ?? "You", score: myRank.score }}
                    isMe
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}