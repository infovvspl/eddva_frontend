import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Crown, Zap, BarChart3, TrendingUp, Lock, Loader2 } from "lucide-react";
import { leaderboardApi, type LeaderboardGroupMember } from "@/lib/api/xp";
import { useStudentMe } from "@/hooks/use-student";
import { cn } from "@/lib/utils";

function avatarSrc(name: string, url?: string | null) {
  return url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

const nf = new Intl.NumberFormat("en-IN");

function CompactPodium({ top3 }: { top3: LeaderboardGroupMember[] }) {
  const first  = top3.find(m => m.rank === 1);
  const second = top3.find(m => m.rank === 2);
  const third  = top3.find(m => m.rank === 3);

  const Slot = ({ m, pos }: { m?: LeaderboardGroupMember; pos: "left" | "center" | "right" }) => {
    if (!m) return <div className="flex-1" />;
    const isC = pos === "center";
    const ringCls = isC
      ? "ring-4 ring-amber-400 ring-offset-2 shadow-amber-100"
      : pos === "left"
      ? "ring-2 ring-slate-300 ring-offset-1"
      : "ring-2 ring-orange-300 ring-offset-1";
    const badgeCls = isC ? "bg-amber-500" : pos === "left" ? "bg-slate-500" : "bg-orange-400";
    const avatarSize = isC ? "h-14 w-14" : "h-11 w-11";
    const baseH = isC ? "h-12" : pos === "left" ? "h-8" : "h-5";
    const baseCls = isC
      ? "bg-gradient-to-b from-amber-100 to-amber-50"
      : pos === "left"
      ? "bg-gradient-to-b from-slate-100 to-slate-50"
      : "bg-gradient-to-b from-orange-100 to-orange-50";

    return (
      <div className="flex flex-1 flex-col items-center gap-1">
        {isC ? (
          <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="text-amber-400">
            <Crown className="h-5 w-5 drop-shadow" fill="currentColor" />
          </motion.div>
        ) : <div className="h-5" />}

        <div className="relative">
          <div className={cn("overflow-hidden rounded-full bg-slate-100 shadow-sm", avatarSize, ringCls)}>
            <img src={avatarSrc(m.fullName, m.avatarUrl)} alt={m.fullName} className="h-full w-full object-cover" />
          </div>
          <span className={cn("absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white text-[8px] font-black text-white", badgeCls)}>
            {m.rank}
          </span>
        </div>

        <div className="text-center">
          <p className={cn("font-bold text-slate-800 leading-tight text-xs truncate max-w-[80px]")}>
            {m.fullName.split(" ")[0]}
          </p>
          <p className="font-bold text-indigo-600 text-[10px]">
            {nf.format(m.xpEarned)} XP
          </p>
        </div>

        <div className={cn("w-full rounded-t-xl", baseH, baseCls)} />
      </div>
    );
  };

  return (
    <div className="flex items-end gap-2 px-2 pt-2">
      <Slot m={second} pos="left" />
      <Slot m={first}  pos="center" />
      <Slot m={third}  pos="right" />
    </div>
  );
}

export default function LeaderboardPreview() {
  const { data: me } = useStudentMe();
  const [tab, setTab] = useState<"group" | "mock">("group");

  const meQuery    = useQuery({ queryKey: ["leaderboard", "me"],  queryFn: leaderboardApi.getMe });
  const groupQuery = useQuery({
    queryKey: ["leaderboard", "group"],
    queryFn:  leaderboardApi.getGroup,
    enabled:  Boolean(meQuery.data?.isUnlocked),
    retry: false,
  });

  const examType = me?.student?.examTarget?.toLowerCase().includes("neet") ? "neet" : "jee";
  const mockQuery  = useQuery({
    queryKey: ["leaderboard", "mock", examType],
    queryFn:  () => leaderboardApi.getMockRank(examType),
  });

  const sortedGroup = useMemo(
    () => [...(groupQuery.data ?? [])].sort((a, b) => a.rank - b.rank),
    [groupQuery.data],
  );
  const top3 = sortedGroup.slice(0, 3);
  const mock = mockQuery.data;

  const isLocked = !meQuery.data?.isUnlocked;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm w-fit">
        {(["group", "mock"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wide transition-all",
              tab === t ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-700",
            )}
          >
            {t === "group" ? "Group Rank" : "Mock Test Rank"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative">
        {tab === "group" ? (
          isLocked ? (
            <div className="flex flex-col items-center justify-center py-6 text-center px-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-xs font-black text-slate-800">Earn 10 XP to unlock</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Complete tasks to join the leaderboard.</p>
            </div>
          ) : groupQuery.isLoading ? (
            <div className="flex h-24 items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading…</span>
            </div>
          ) : (
            <CompactPodium top3={top3} />
          )
        ) : (
          /* Mock Test Rank */
          mockQuery.isLoading ? (
            <div className="flex h-24 items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading…</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Zap className="w-3.5 h-3.5" />, val: nf.format(mock?.mockXpTotal ?? 0), label: "Mock XP" },
                { icon: <Trophy className="w-3.5 h-3.5" />, val: mock?.rank ? `#${mock.rank}` : "—", label: "Rank" },
                { icon: <BarChart3 className="w-3.5 h-3.5" />, val: mock?.percentile != null ? `${mock.percentile.toFixed(1)}%` : "—", label: "Percentile" },
                { icon: <TrendingUp className="w-3.5 h-3.5" />, val: mock?.accuracy != null ? `${mock.accuracy.toFixed(0)}%` : "—", label: "Accuracy" }
              ].map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                  <div className="text-indigo-500 shrink-0">{s.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 leading-tight">{s.val}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
