import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Award, BarChart3, Crown, Flame, Loader2, Lock,
  Medal, RotateCcw, Shield, ShieldCheck, Swords, Trophy, TrendingUp, Zap,
} from "lucide-react";
import { leaderboardApi, type LeaderboardGroupMember } from "@/lib/api/xp";
import { useStudentMe } from "@/hooks/use-student";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("en-IN");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function zoneLabel(z?: string | null) {
  if (z === "promotion") return "Promotion Zone";
  if (z === "demotion")  return "Demotion Zone";
  if (z === "safety")    return "Safe Zone";
  return "Unranked";
}
function zoneCls(z?: string | null) {
  if (z === "promotion") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (z === "demotion")  return "bg-rose-50 text-rose-600 border-rose-200";
  if (z === "safety")    return "bg-blue-50 text-blue-600 border-blue-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}

function avatarSrc(name: string, url?: string | null) {
  return url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

// ─── Compact Stat Card ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, sub, color, className, compactMobile }: {
  icon: React.ElementType; value: string; label: string; sub?: string;
  color: "indigo" | "amber" | "teal" | "violet";
  className?: string;
  compactMobile?: boolean;
}) {
  const colors = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
    amber:  "bg-amber-50  border-amber-100  text-amber-600",
    teal:   "bg-teal-50   border-teal-100   text-teal-600",
    violet: "bg-violet-50 border-violet-100 text-violet-600",
  };
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border p-3",
      colors[color],
      compactMobile && "justify-center sm:justify-start gap-1 sm:gap-3 p-1.5 sm:p-3 w-full",
      className
    )}>
      <div className="shrink-0">
        <Icon className={cn("h-4.5 w-4.5", compactMobile && "h-3.5 w-3.5 sm:h-4.5 sm:w-4.5")} style={compactMobile ? undefined : { width: 18, height: 18 }} />
      </div>
      <div className="min-w-0">
        <p className={cn("text-lg font-black leading-none tracking-tight text-slate-900", compactMobile && "text-[10px] sm:text-lg")}>{value}</p>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5", compactMobile && "hidden sm:block")}>{label}</p>
        {sub && <p className={cn("text-[10px] text-slate-500 mt-0.5", compactMobile && "hidden sm:block")}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Compact Podium ───────────────────────────────────────────────────────────

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
    const avatarSize = isC ? "h-16 w-16" : "h-13 w-13";
    const baseH = isC ? "h-14" : pos === "left" ? "h-10" : "h-7";
    const baseCls = isC
      ? "bg-gradient-to-b from-amber-100 to-amber-50"
      : pos === "left"
      ? "bg-gradient-to-b from-slate-100 to-slate-50"
      : "bg-gradient-to-b from-orange-100 to-orange-50";

    return (
      <motion.div
        className="flex flex-1 flex-col items-center gap-1.5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isC ? 0 : 0.08, duration: 0.35 }}
      >
        {isC ? (
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} className="text-amber-400">
            <Crown className="h-6 w-6 drop-shadow" fill="currentColor" />
          </motion.div>
        ) : <div className="h-6" />}

        <div className="relative">
          <div className={cn("overflow-hidden rounded-full bg-slate-100 shadow-md", avatarSize, ringCls)}
            style={isC ? { width: 64, height: 64 } : { width: 52, height: 52 }}>
            <img src={avatarSrc(m.fullName, m.avatarUrl)} alt={m.fullName} className="h-full w-full object-cover" />
          </div>
          <span className={cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[9px] font-black text-white", badgeCls)}>
            {m.rank}
          </span>
        </div>

        <div className="text-center">
          <p className={cn("font-bold text-slate-900 leading-tight", isC ? "text-sm" : "text-xs")}>
            {m.fullName.split(" ")[0]}
            {m.isCurrentStudent && <span className="ml-1 text-indigo-500">·</span>}
          </p>
          <p className={cn("font-semibold text-indigo-600", isC ? "text-xs" : "text-[11px]")}>
            {nf.format(m.xpEarned)} XP
          </p>
        </div>

        <div className={cn("w-full rounded-t-xl", baseH, baseCls)} />
      </motion.div>
    );
  };

  return (
    <div className="flex items-end gap-2 px-4 pb-0">
      <Slot m={second} pos="left" />
      <Slot m={first}  pos="center" />
      <Slot m={third}  pos="right" />
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({ m, idx }: { m: LeaderboardGroupMember; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.02, duration: 0.25 }}
      className={cn(
        "group grid items-center gap-2 rounded-xl border px-3 py-2.5 transition-all",
        "grid-cols-[28px_36px_1fr_auto_32px]",
        m.isCurrentStudent
          ? "border-indigo-200 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-100"
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/60",
      )}
    >
      {/* Rank */}
      <div className="flex justify-center text-sm font-black">
        {m.rank === 1 ? <Crown className="h-4 w-4 text-amber-400" fill="currentColor" /> :
         m.rank === 2 ? <span className="text-slate-400">🥈</span> :
         m.rank === 3 ? <span className="text-orange-400">🥉</span> :
         <span className="text-slate-400 text-[13px]">{m.rank}</span>}
      </div>

      {/* Avatar */}
      <div className="h-9 w-9 overflow-hidden rounded-xl border border-white bg-slate-50 shadow-sm">
        <img src={avatarSrc(m.fullName, m.avatarUrl)} alt={m.fullName} className="h-full w-full object-cover" />
      </div>

      {/* Name + XP */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900 leading-none">{m.fullName}</p>
          {m.isCurrentStudent && (
            <span className="shrink-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-black text-white uppercase">You</span>
          )}
        </div>
        <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
          <Zap className="h-2.5 w-2.5 text-amber-400" fill="currentColor" />
          {nf.format(m.xpEarned)} XP
        </p>
      </div>

      {/* Zone */}
      <span className={cn("hidden rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-block", zoneCls(m.zone))}>
        {zoneLabel(m.zone)}
      </span>

      {/* Duel */}
      <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition-colors hover:bg-indigo-100 group-hover:bg-indigo-50">
        <Swords className="h-3.5 w-3.5 text-slate-400 hover:text-indigo-600" />
      </button>
    </motion.div>
  );
}

// ─── Progress Sidebar ─────────────────────────────────────────────────────────

function ProgressSidebar({ stats, streak, xp }: {
  stats: { cycleXp: number; rank: number | null; level: number; zone: string | null; daysUntilReset: number; isUnlocked: boolean } | undefined;
  streak: number;
  xp: number;
}) {
  const level = stats?.level ?? 1;
  const cycleXp = stats?.cycleXp ?? 0;
  // Rough XP thresholds per level (approximate)
  const levelXpMap: Record<number, number> = { 1: 500, 2: 1200, 3: 2500, 4: 5000, 5: 10000 };
  const nextLevelXp = levelXpMap[level] ?? 9999;
  const pct = Math.min(100, Math.round((cycleXp / nextLevelXp) * 100));

  const xpToPromotion = 244; // TODO: get from API

  return (
    <div className="space-y-3">
      {/* Promotion meter */}
      <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="h-4 w-4 text-orange-500" fill="currentColor" />
          <span className="text-xs font-black uppercase tracking-wider text-orange-700">Promotion Target</span>
        </div>
        <p className="text-2xl font-black text-slate-900">{nf.format(xpToPromotion)} <span className="text-sm font-semibold text-slate-400">XP away</span></p>
        <div className="mt-2 h-2 w-full rounded-full bg-orange-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${100 - Math.min(100, Math.round(xpToPromotion / 3))}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-orange-600 mt-1.5 font-semibold">Keep going — promotion is close!</p>
      </div>

      {/* Streak + Zone */}
      <div className="hidden sm:grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 flex flex-col items-center gap-1">
          <Flame className="h-5 w-5 text-amber-500" fill="currentColor" />
          <p className="text-xl font-black text-slate-900">{streak}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Day Streak</p>
        </div>
        <div className={cn("rounded-xl border p-3 flex flex-col items-center gap-1", zoneCls(stats?.zone))}>
          <ShieldCheck className="h-5 w-5" />
          <p className="text-[11px] font-black uppercase tracking-wide text-center leading-tight">{zoneLabel(stats?.zone)}</p>
        </div>
      </div>

      {/* Level progress */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Level {level}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">{nf.format(cycleXp)} / {nf.format(nextLevelXp)} XP</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">{pct}% to Level {level + 1}</p>
      </div>

      {/* Total XP */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap className="h-4 w-4 text-indigo-500" fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-wide text-indigo-600">Total XP</span>
        </div>
        <p className="text-2xl font-black text-slate-900">{nf.format(xp)}</p>
        <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">{nf.format(cycleXp)} this cycle</p>
      </div>

      {/* Cycle reset */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3 flex items-center gap-3">
        <RotateCcw className="h-4 w-4 text-violet-500 shrink-0" />
        <div>
          <p className="text-sm font-black text-slate-900">{stats?.daysUntilReset ?? 0}d left</p>
          <p className="text-[10px] text-violet-600 font-semibold">Cycle resets in {stats?.daysUntilReset ?? 0} days</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabKey = "group" | "mock";

export default function StudentLeaderboardPage() {
  const { data: me } = useStudentMe();
  const [tab, setTab] = useState<TabKey>("group");
  const [examType, setExamType] = useState<"jee" | "neet">(() =>
    me?.student?.examTarget?.toLowerCase().includes("neet") ? "neet" : "jee"
  );

  const meQuery    = useQuery({ queryKey: ["leaderboard", "me"],  queryFn: leaderboardApi.getMe });
  const groupQuery = useQuery({
    queryKey: ["leaderboard", "group"],
    queryFn:  leaderboardApi.getGroup,
    enabled:  Boolean(meQuery.data?.isUnlocked),
    retry: false,
  });
  const mockQuery  = useQuery({
    queryKey: ["leaderboard", "mock", examType],
    queryFn:  () => leaderboardApi.getMockRank(examType),
  });

  const sortedGroup = useMemo(
    () => [...(groupQuery.data ?? [])].sort((a, b) => a.rank - b.rank),
    [groupQuery.data],
  );
  const top3 = sortedGroup.slice(0, 3);

  const stats  = meQuery.data;
  const mock   = mockQuery.data;
  const isLocked = !stats?.isUnlocked;
  const streak = me?.student?.streakDays ?? 0;
  const xp     = me?.student?.xpPoints   ?? 0;

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
      </div>
    );
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: "group", label: "Group Rank" },
    { key: "mock",  label: "Mock Test Rank" },
  ];

  return (
    <div className="flex flex-col space-y-6 pt-3 sm:pt-5 pb-8 overflow-x-hidden w-full">
      {/* Title row */}
      <div className="order-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 sm:p-0 shadow-sm sm:bg-transparent sm:border-0 sm:shadow-none">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Season 4
              </span>
              <div className="h-px w-5 bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">14-Day Cycle</span>
            </div>
            <h1 className="text-[28px] font-black leading-tight tracking-tight text-slate-900">
              Group{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
          </div>
          
          {/* Mobile Streak Badge */}
          <div className="flex sm:hidden flex-col items-center gap-0.5 bg-amber-50 border border-amber-100/80 rounded-2xl px-3 py-2 shadow-sm shrink-0">
            <Flame className="h-4.5 w-4.5 text-amber-500 animate-pulse" fill="currentColor" />
            <span className="text-sm font-black text-slate-900 leading-none">{streak}</span>
            <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wide">Streak</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 sm:px-3 sm:py-1.5">
            <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500 shrink-0" fill="currentColor" />
            <span className="text-[9.5px] sm:text-[11px] font-black text-orange-700 uppercase tracking-wide truncate">
              +244 XP to promote
            </span>
          </div>
          <div className={cn("flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border px-2.5 py-1 sm:px-3 sm:py-1.5", zoneCls(stats?.zone))}>
            <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="text-[9.5px] sm:text-[11px] font-black uppercase tracking-wide truncate">{zoneLabel(stats?.zone)}</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="order-2 sm:order-3 grid grid-cols-4 gap-1.5 w-full sm:flex sm:flex-nowrap sm:gap-4 sm:overflow-x-visible sm:pb-0 scrollbar-none">
        <StatCard compactMobile className="sm:w-auto" icon={Zap}       value={nf.format(stats?.cycleXp ?? 0)}           label="Cycle XP"   sub={`${nf.format(xp)} total`}       color="indigo" />
        <StatCard compactMobile className="sm:w-auto" icon={Trophy}    value={stats?.rank ? `#${stats.rank}` : "—"}      label="Group Rank" sub="in your group"                   color="amber"  />
        <StatCard compactMobile className="sm:w-auto" icon={Award}     value={String(stats?.level ?? 1)}                 label="Level"      sub={`${Math.min(100, Math.round((stats?.cycleXp ?? 0) / 12))}% to next`} color="teal"   />
        <StatCard compactMobile className="sm:w-auto" icon={RotateCcw} value={`${stats?.daysUntilReset ?? 0}d`}          label="Reset In"   sub="cycle ends soon"                 color="violet" />
      </div>

      {/* Tab bar */}
      <div className="order-3 sm:order-2 flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-fit">
        <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm w-full sm:w-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 sm:flex-initial text-center rounded-lg px-3 py-1.5 text-[11.5px] font-black uppercase tracking-wide transition-all",
                tab === t.key ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        
        {tab === "mock" && (
          <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm w-full sm:w-auto justify-center">
            {(["jee", "neet"] as const).map(e => (
              <button
                key={e}
                onClick={() => setExamType(e)}
                className={cn(
                  "flex-1 sm:flex-initial text-center rounded-lg px-4 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all",
                  examType === e ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-600",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main two-column layout */}
      <div className="order-4">
        <AnimatePresence mode="wait">
        {tab === "group" ? (
          <motion.div
            key="group"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="grid gap-5 sm:gap-6 lg:grid-cols-[1fr_256px]"
          >
            {/* Left: podium + table */}
            <div className="space-y-3 min-w-0">
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                {isLocked ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50">
                      <Lock className="h-6 w-6 text-amber-500" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Earn 10 XP to unlock</h2>
                    <p className="mt-1 text-sm text-slate-400">Complete tasks in your study plan to join the group leaderboard.</p>
                  </div>
                ) : groupQuery.isLoading ? (
                  <div className="flex h-40 items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Loading…</span>
                  </div>
                ) : groupQuery.isError ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <AlertTriangle className="mb-2 h-7 w-7 text-rose-400" />
                    <p className="text-sm font-semibold text-rose-600">Leaderboard unavailable.</p>
                  </div>
                ) : (
                  <div>
                    {/* Compact podium */}
                    {top3.length > 0 && (
                      <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white pt-4">
                        <CompactPodium top3={top3} />
                      </div>
                    )}

                    {/* Table header */}
                    <div className="grid grid-cols-[28px_36px_1fr_auto_32px] gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 border-b border-slate-50">
                      <div className="text-center">#</div>
                      <div />
                      <div>Student</div>
                      <div className="hidden sm:block">League</div>
                      <div className="text-center">Duel</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-50 px-2 py-1.5 space-y-1">
                      {sortedGroup.length === 0 ? (
                        <div className="flex flex-col items-center py-10">
                          <Shield className="mb-2 h-8 w-8 text-slate-200" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-300">No members yet</p>
                        </div>
                      ) : (
                        sortedGroup.map((m, i) => <MemberRow key={m.studentId} m={m} idx={i} />)
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: progress sidebar */}
            <ProgressSidebar stats={stats} streak={streak} xp={xp} />
          </motion.div>
        ) : (
          /* Mock Test Tab */
          <motion.div
            key="mock"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="grid gap-5 sm:gap-6 lg:grid-cols-[1fr_256px]"
          >
            {/* Left: mock stats */}
            <div className="space-y-3 min-w-0">
              <div className="flex flex-nowrap overflow-x-auto gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-x-visible sm:pb-0 scrollbar-none">
                <StatCard className="shrink-0 w-[155px] sm:w-auto" icon={Zap}      value={nf.format(mock?.mockXpTotal ?? 0)}                              label="Mock XP"     sub="from all tests"     color="indigo" />
                <StatCard className="shrink-0 w-[155px] sm:w-auto" icon={Trophy}   value={mock?.rank ? `#${mock.rank}` : "—"}                             label="Global Rank"  sub="national ranking"   color="amber"  />
                <StatCard className="shrink-0 w-[155px] sm:w-auto" icon={BarChart3} value={mock?.percentile != null ? `${mock.percentile.toFixed(1)}%` : "—"} label="Percentile" sub="top performers"   color="teal"   />
                <StatCard className="shrink-0 w-[155px] sm:w-auto" icon={TrendingUp} value={mock?.accuracy != null ? `${mock.accuracy.toFixed(0)}%` : "—"}   label="Accuracy"   sub="across all tests"  color="violet" />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                {mockQuery.isLoading ? (
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-400" />
                ) : mock?.rank ? (
                  <div className="space-y-2">
                    <Trophy className="mx-auto h-10 w-10 text-amber-400" />
                    <p className="text-3xl font-black text-slate-900">#{mock.rank}</p>
                    <p className="text-sm text-slate-500">You're in the top {mock.percentile?.toFixed(0) ?? "—"}% nationally for {examType.toUpperCase()}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Medal className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-400">Attempt mock tests to earn a national rank.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: progress sidebar */}
            <ProgressSidebar stats={stats} streak={streak} xp={xp} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}
