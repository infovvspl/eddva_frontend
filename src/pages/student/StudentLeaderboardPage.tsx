import { useMemo, useState, type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Crown,
  Loader2,
  Lock,
  Medal,
  RotateCcw,
  Shield,
  Trophy,
  Zap,
  Swords,
  ShieldCheck,
  ArrowUpRight,
  Flame
} from "lucide-react";
import { leaderboardApi, type LeaderboardGroupMember } from "@/lib/api/xp";
import { useStudentMe } from "@/hooks/use-student";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("en-IN");

// --- UI Components ---

function zoneLabel(zone?: string | null) {
  if (zone === "promotion") return "Promotion Zone";
  if (zone === "demotion") return "Demotion Zone";
  if (zone === "safety") return "Safe Zone";
  return "Unranked";
}

function zoneClass(zone?: string | null) {
  if (zone === "promotion") return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm";
  if (zone === "demotion") return "border-rose-200 bg-rose-50 text-rose-700";
  if (zone === "safety") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StatTile({
  label,
  value,
  icon: Icon,
  color = "indigo",
}: {
  label: string;
  value: string;
  icon: ElementType;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    purple: "from-purple-50 to-white border-purple-100 text-purple-600 shadow-purple-50",
    blue: "from-blue-50 to-white border-blue-100 text-blue-600 shadow-blue-50",
    cyan: "from-cyan-50 to-white border-cyan-100 text-cyan-600 shadow-cyan-50",
    amber: "from-amber-50 to-white border-amber-100 text-amber-600 shadow-amber-50",
    indigo: "from-indigo-50 to-white border-indigo-100 text-indigo-600 shadow-indigo-50",
  };

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-5 transition-all hover:translate-y-[-2px] hover:shadow-xl shadow-md",
      colorMap[color] || colorMap.indigo
    )}>
      <div className="relative z-10">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform group-hover:rotate-3">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[34px] font-black tracking-tighter text-slate-900 leading-tight">{value}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400">{label}</p>
      </div>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-current opacity-[0.04] blur-2xl transition-all group-hover:opacity-[0.08]" />
    </div>
  );
}

function LeaderboardPodium({ top3 }: { top3: LeaderboardGroupMember[] }) {
  if (top3.length === 0) return null;

  const displayOrder = [
    top3[1] || null,
    top3[0] || null,
    top3[2] || null
  ].filter(Boolean);

  return (
    <div className="flex items-end justify-center gap-2 py-8 sm:gap-6">
      {displayOrder.map((member, idx) => {
        if (!member) return null;
        const isFirst = member.rank === 1;
        const isSecond = member.rank === 2;

        return (
          <motion.div
            key={member.studentId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.5 }}
            className={cn(
              "flex flex-col items-center gap-4",
              isFirst ? "z-10 -mb-2" : "z-0 scale-90"
            )}
          >
            <div className="relative">
              {isFirst && (
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 text-amber-500"
                >
                  <Crown className="h-10 w-10 drop-shadow-md" fill="currentColor" />
                </motion.div>
              )}
              <div className={cn(
                "relative rounded-full p-1",
                isFirst ? "bg-gradient-to-tr from-amber-400 to-yellow-100 shadow-xl shadow-amber-100" : 
                isSecond ? "bg-gradient-to-tr from-slate-300 to-slate-50 shadow-lg shadow-slate-100" :
                "bg-gradient-to-tr from-orange-400 to-orange-50 shadow-lg shadow-orange-50"
              )}>
                <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-50 sm:h-24 sm:w-24">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.fullName}`} 
                    alt={member.fullName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-black shadow-md sm:h-9 sm:w-9",
                  isFirst ? "bg-amber-500 text-white" : "bg-slate-700 text-white"
                )}>
                  #{member.rank}
                </div>
              </div>
            </div>

            <div className={cn(
              "flex w-28 flex-col items-center rounded-2xl border border-white bg-white/80 p-3 shadow-lg shadow-slate-200/40 backdrop-blur-md sm:w-32",
              isFirst ? "border-amber-100 bg-amber-50/60" : ""
            )}>
              <span className="truncate text-center text-[18px] font-bold text-slate-900 leading-tight">{member.fullName.split(' ')[0]}</span>
              <span className="text-[13px] font-bold text-indigo-600 tracking-tight">{nf.format(member.xpEarned)} XP</span>
            </div>

            <div className={cn(
              "w-full rounded-t-3xl sm:w-24",
              isFirst ? "h-32 bg-gradient-to-b from-amber-100/50 to-transparent" :
              isSecond ? "h-24 bg-gradient-to-b from-slate-100/50 to-transparent" :
              "h-16 bg-gradient-to-b from-orange-50/50 to-transparent"
            )} />
          </motion.div>
        );
      })}
    </div>
  );
}

function MemberCard({ member, idx }: { member: LeaderboardGroupMember; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + idx * 0.03 }}
      className={cn(
        "group relative flex items-center gap-4 rounded-2xl border p-3.5 transition-all hover:bg-slate-50/50 hover:shadow-md",
        member.isCurrentStudent 
          ? "border-indigo-200 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-100/50" 
          : "border-slate-100 bg-white/40"
      )}
    >
      <div className="flex w-6 shrink-0 items-center justify-center text-sm font-black text-slate-300">
        {member.rank === 1 ? <Crown className="h-5 w-5 text-amber-500" /> :
         member.rank === 2 ? <Medal className="h-5 w-5 text-slate-400" /> :
         member.rank === 3 ? <Medal className="h-5 w-5 text-orange-400" /> :
         <span>{member.rank}</span>}
      </div>

      <div className="relative h-11 w-11 shrink-0">
        <div className="h-full w-full overflow-hidden rounded-xl border border-white bg-slate-50 shadow-sm">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.fullName}`} 
            alt={member.fullName}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-bold text-slate-900">
            {member.fullName}
            {member.isCurrentStudent && (
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-700">You</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <Zap className="h-3 w-3 text-amber-500" fill="currentColor" />
          <span>{nf.format(member.xpEarned)} Cycle XP</span>
        </div>
      </div>

      <div className="hidden sm:block">
        <span className={cn("rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider", zoneClass(member.zone))}>
          {zoneLabel(member.zone)}
        </span>
      </div>

      <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100/50 group-hover:bg-indigo-50 transition-colors">
        <Swords className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
      </div>
    </motion.div>
  );
}

// --- Main Page Component ---

export default function StudentLeaderboardPage() {
  const { data: me } = useStudentMe();
  const [examType, setExamType] = useState<"jee" | "neet">(() => {
    const target = me?.student?.examTarget?.toLowerCase();
    return target?.includes("neet") ? "neet" : "jee";
  });

  const meQuery = useQuery({
    queryKey: ["leaderboard", "me"],
    queryFn: leaderboardApi.getMe,
  });

  const groupQuery = useQuery({
    queryKey: ["leaderboard", "group"],
    queryFn: leaderboardApi.getGroup,
    enabled: Boolean(meQuery.data?.isUnlocked),
    retry: false,
  });

  const mockQuery = useQuery({
    queryKey: ["leaderboard", "mock", examType],
    queryFn: () => leaderboardApi.getMockRank(examType),
  });

  const sortedGroup = useMemo(
    () => [...(groupQuery.data ?? [])].sort((a, b) => a.rank - b.rank),
    [groupQuery.data],
  );

  const top3Members = useMemo(() => sortedGroup.slice(0, 3), [sortedGroup]);

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
      </div>
    );
  }

  const stats = meQuery.data;
  const mock = mockQuery.data;
  const isLocked = !stats?.isUnlocked;

  return (
    <div className="relative space-y-10">
      {/* Subtle Background Elements */}
      <div className="pointer-events-none absolute -left-10 top-0 h-[400px] w-[400px] rounded-full bg-indigo-50/50 blur-[100px]" />
      <div className="pointer-events-none absolute -right-10 top-20 h-[400px] w-[400px] rounded-full bg-purple-50/50 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="space-y-6"
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600">Season 4</span>
                <div className="h-px w-8 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">14-Day Cycle</span>
              </div>
              <h1 className="text-[48px] font-bold tracking-[-1px] leading-[1.1] text-slate-900">
                <span className="font-medium text-slate-600">Group</span> <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Leaderboard</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-2 shadow-sm">
                <Flame className="h-4 w-4 text-orange-500" fill="currentColor" />
                <span className="text-[12px] font-bold text-indigo-700 uppercase tracking-wide">Promotion in <span className="text-orange-600">244 XP</span></span>
              </div>
              <div className={cn("flex items-center gap-2 rounded-full border px-4 py-2 shadow-sm backdrop-blur-sm", zoneClass(stats?.zone))}>
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[12px] font-black uppercase tracking-wider">{zoneLabel(stats?.zone)}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Cycle XP" value={nf.format(stats?.cycleXp ?? 0)} icon={Zap} color="purple" />
            <StatTile label="Group Rank" value={stats?.rank ? `#${stats.rank}` : "-"} icon={Trophy} color="amber" />
            <StatTile label="Level" value={`${stats?.level ?? 1}`} icon={Award} color="cyan" />
            <StatTile label="Reset In" value={`${stats?.daysUntilReset ?? 0}d`} icon={RotateCcw} color="indigo" />
          </div>

          {/* Main Content Area */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white/40 p-4 sm:p-8 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.02)] backdrop-blur-xl">
            {isLocked ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-amber-100 bg-amber-50 text-amber-500 shadow-lg shadow-amber-50">
                  <Lock className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Entrance Locked</h2>
                <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-relaxed text-slate-400">
                  Earn 10 cycle XP to join the group and see where you rank among peers.
                </p>
                <button className="mt-8 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-slate-800 hover:-translate-y-1">
                  Start Learning
                </button>
              </div>
            ) : groupQuery.isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Rankings...</p>
              </div>
            ) : groupQuery.isError ? (
              <div className="rounded-3xl border border-rose-100 bg-rose-50/30 p-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
                <p className="text-sm font-bold text-rose-700">Leaderboard data unavailable.</p>
              </div>
            ) : (
              <div className="space-y-10">
                <LeaderboardPodium top3={top3Members} />

                <div className="space-y-2 max-w-4xl mx-auto">
                  <div className="mb-4 grid grid-cols-[3rem_minmax(0,1fr)_auto] px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:grid-cols-[3rem_3.5rem_minmax(0,1fr)_9rem_2.5rem]">
                    <div className="text-center">#</div>
                    <div className="hidden sm:block">Img</div>
                    <div>Student</div>
                    <div className="hidden sm:block">League</div>
                    <div className="text-right sm:text-center">Duel</div>
                  </div>
                  
                  {sortedGroup.map((member, idx) => (
                    <MemberCard key={member.studentId} member={member} idx={idx} />
                  ))}

                  {sortedGroup.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Shield className="mb-4 h-12 w-12 text-slate-100" />
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No group members</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Mock Test Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6 border-t border-slate-100 pt-10"
        >
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-violet-600">National</span>
                <div className="h-px w-8 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Rankings</span>
              </div>
              <h2 className="text-[24px] font-black tracking-tight text-slate-900">Mock Test Rank</h2>
            </div>
            
            <div className="flex w-fit items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
              {(["jee", "neet"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setExamType(type)}
                  className={cn(
                    "rounded-lg px-5 py-2 text-[11px] font-black uppercase tracking-wider transition-all",
                    examType === type 
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                      : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Mock XP" value={nf.format(mock?.mockXpTotal ?? 0)} icon={Zap} color="purple" />
            <StatTile label="Global Rank" value={mock?.rank ? `#${mock.rank}` : "-"} icon={Trophy} color="amber" />
            <StatTile label="Percentile" value={mock?.percentile != null ? `${mock.percentile.toFixed(1)}` : "-"} icon={BarChart3} color="cyan" />
            <StatTile label="Accuracy" value={mock?.accuracy != null ? `${mock.accuracy.toFixed(0)}%` : "-"} icon={Medal} color="indigo" />
          </div>
        </motion.section>
      </div>
    </div>
  );
}
