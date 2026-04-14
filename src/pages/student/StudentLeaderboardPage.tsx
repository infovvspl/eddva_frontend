import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Medal, Crown, Loader2, Flame, Zap, 
  Globe, MapPin, Building, Swords, Star, 
  TrendingUp, ArrowRight, User, Info, 
  Sparkles, Target, Award,
} from "lucide-react";
import { useLeaderboard, useStudentMe } from "@/hooks/use-student";
import { cn } from "@/lib/utils";
import { CardGlass } from "@/components/shared/CardGlass";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";
const CYAN   = "#06B6D4";
const AMBER  = "#F59E0B";

const tierGradients: Record<string, string> = {
  champion: "from-amber-400 to-orange-600", 
  diamond:  "from-cyan-400 to-blue-600",
  platinum: "from-violet-400 to-purple-700", 
  gold:     "from-yellow-300 to-amber-500",
  silver:   "from-slate-300 to-slate-500", 
  bronze:   "from-amber-700 to-orange-900",
  iron:     "from-slate-500 to-slate-800",
};

const tierColors: Record<string, string> = {
  champion: AMBER, diamond: CYAN, platinum: PURPLE, gold: "#FBBF24",
  silver: "#94A3B8", bronze: "#B45309", iron: "#475569",
};

type ScopeType = "global" | "state" | "city" | "school" | "subject" | "battle_xp";

const SCOPES: { key: ScopeType; label: string; icon: React.ReactNode }[] = [
  { key: "global",    label: "Global Hub",    icon: <Globe    className="w-3.5 h-3.5" /> },
  { key: "city",      label: "Regional",      icon: <MapPin   className="w-3.5 h-3.5" /> },
  { key: "school",    label: "Institute",     icon: <Building className="w-3.5 h-3.5" /> },
  { key: "battle_xp", label: "Combat XP",     icon: <Swords   className="w-3.5 h-3.5" /> },
];

// ─── Podium: Holographic Hall of Fame ─────────────────────────────────────────
function Podium({ entries }: { entries: any[] }) {
  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean);
  const configs = [
    { height: "h-64",  medal: "🥈", delay: 0.2 },
    { height: "h-80",  medal: "🥇", delay: 0 },
    { height: "h-56",  medal: "🥉", delay: 0.4 },
  ];

  return (
    <div className="flex items-end justify-center gap-6 sm:gap-10 mt-12 mb-16 px-4">
      {podiumOrder.map((entry, i) => {
        if (!entry) return <div key={i} className="flex-1 opacity-0" />;
        const config = configs[i];
        return (
          <motion.div 
            key={entry.rank} initial={{ opacity: 0, scale: 0.8, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: config.delay, type: "spring" }}
            className="flex-1 flex flex-col items-center max-w-[240px]"
          >
            <div className="relative mb-6">
               <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden z-10">
                  {entry.profilePictureUrl ? <img src={entry.profilePictureUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-900 bg-slate-50">{entry.name.charAt(0).toUpperCase()}</div>}
               </div>
               {i === 1 && <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-8 left-1/2 -translate-x-1/2"><Crown className="w-8 h-8 text-amber-400 fill-amber-200" /></motion.div>}
            </div>

            <div className="text-center mb-6">
               <p className="text-lg font-black text-slate-900 uppercase italic leading-tight truncate px-2">{entry.name}</p>
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mt-2 inline-block">{entry.score.toLocaleString()} PTS</span>
            </div>

            <div className={cn("w-full rounded-t-[2.5rem] relative overflow-hidden group border border-white bg-white/60", config.height)}>
               <div className="flex flex-col items-center justify-center h-full pt-6 relative z-10 gap-2">
                  <span className="text-4xl filter drop-shadow-2xl">{config.medal}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rank #{entry.rank}</span>
               </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Rank Row: Hall of Fame Entry ─────────────────────────────────────────────
function RankRow({ entry, isMe }: { entry: any; isMe?: boolean }) {
  const tier  = entry.eloTier?.toLowerCase() ?? "iron";
  const grad  = tierGradients[tier] ?? tierGradients.iron;

  return (
    <CardGlass className={cn("p-5 flex items-center gap-6 group mb-3 border-white bg-white/60", isMe ? "ring-2 ring-blue-600 shadow-xl" : "hover:border-blue-200")}>
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-50 flex items-center justify-center shrink-0 shadow-inner">
         {entry.rank <= 3 ? <span className="text-2xl">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span> : <span className={cn("text-lg font-black italic", isMe ? "text-blue-600" : "text-gray-400")}>#{entry.rank}</span>}
      </div>

      <div className="relative">
         <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            {entry.profilePictureUrl ? <img src={entry.profilePictureUrl} alt="" className="w-full h-full object-cover" /> : <div className="text-lg font-black text-slate-900">{entry.name.charAt(0).toUpperCase()}</div>}
         </div>
         {isMe && <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white animate-pulse" />}
      </div>

      <div className="flex-1 min-w-0">
         <h4 className={cn("text-base font-black uppercase italic tracking-tight truncate px-1", isMe ? "text-blue-600" : "text-slate-900")}>{entry.name}</h4>
         <div className="flex items-center gap-3">
            <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r", grad)}>{tier}</span>
            {entry.city && <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest"><MapPin className="w-3 h-3" /> {entry.city}</span>}
         </div>
      </div>

      <div className="text-right shrink-0 px-4">
         <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-xl font-black text-slate-900 leading-none">{entry.score.toLocaleString()}</p>
         </div>
         <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">System XP</p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-blue-600 transition-all" />
    </CardGlass>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentLeaderboardPage() {
  const [scope, setScope] = useState<ScopeType>("global");
  const { data: me } = useStudentMe();
  const { data: lb, isLoading } = useLeaderboard({ scope });

  const entries  = lb?.data ?? [];
  const myRank   = lb?.currentStudentRank;
  const top3     = entries.slice(0, 3);
  const myId     = me?.student?.id;
  const meInList = entries.some(e => e.studentId === myId);

  return (
    <div className="flex flex-col space-y-12 pb-32">
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-12">
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white text-gray-900 w-fit shadow-xl">
              <Award className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural Paragon Archive</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Hall of<br/><span className="not-italic text-blue-600">Glory</span>
            </h1>
          </div>

          <div className="flex items-center gap-8">
             {myRank && (
               <CardGlass className="px-10 py-6 border-white bg-white/60 shadow-3xl">
                  <div className="flex items-center gap-8">
                     <div>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Your Rank</p>
                        <p className="text-3xl font-black text-slate-900 leading-none italic">#{myRank.rank}</p>
                     </div>
                     <div className="w-px h-10 bg-blue-100" />
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Power</p>
                        <p className="text-2xl font-black text-slate-900 leading-none">{myRank.score.toLocaleString()}</p>
                     </div>
                  </div>
               </CardGlass>
             )}
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none sticky top-0 z-40">
          {SCOPES.map(s => (
            <motion.button key={s.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setScope(s.key)}
              className={cn("shrink-0 flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border", scope === s.key ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white/60 backdrop-blur-3xl text-slate-400 border-white hover:border-blue-200")}>
              {s.icon} {s.label}
            </motion.button>
          ))}
        </div>

        {isLoading ? (
           <div className="py-40 flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying Academy Standings</p>
           </div>
        ) : entries.length === 0 ? (
           <div className="py-40 flex flex-col items-center text-center max-w-md mx-auto">
              <div className="w-24 h-24 rounded-[3.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10"><Swords className="w-10 h-10 text-slate-200" /></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">No Contenders</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">This frequency is dormant. Complete quests to establish first contact.</p>
           </div>
        ) : (
          <div className="space-y-12">
            {top3.length >= 3 && <Podium entries={top3} />}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 items-start">
               <div className="xl:col-span-3">
                  <div className="space-y-4">
                    {entries.map((entry, i) => (
                      <motion.div key={entry.studentId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}><RankRow entry={entry} isMe={entry.studentId === myId} /></motion.div>
                    ))}
                    {!meInList && myRank && (
                      <div className="mt-12 space-y-4">
                         <div className="flex items-center gap-4 px-6 opacity-30"><div className="flex-1 h-px bg-slate-900/10" /><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Your Trajectory</span><div className="flex-1 h-px bg-slate-900/10" /></div>
                         <RankRow entry={{ rank: myRank.rank, name: me?.fullName ?? "Unit Zero", score: myRank.score }} isMe />
                      </div>
                    )}
                  </div>
               </div>

               <aside className="xl:col-span-1 sticky top-32 space-y-10">
                  <CardGlass className="p-10 border-white bg-white/60 shadow-3xl">
                     <h4 className="text-sm font-black text-slate-900 uppercase italic mb-8 flex items-center justify-between">Tactical Insights <Zap className="w-5 h-5 text-amber-500" /></h4>
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Global Sync</span><span className="text-blue-600">82.4%</span></div>
                           <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden p-0.5"><motion.div initial={{ width: 0 }} animate={{ width: "82%" }} className="h-full bg-blue-600 rounded-full" /></div>
                        </div>
                     </div>
                  </CardGlass>

                  <div className="bg-slate-950 rounded-[3rem] p-10 shadow-3xl group relative overflow-hidden transition-all hover:translate-y-[-10px]">
                     <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
                     <Medal className="w-12 h-12 text-blue-400 mb-8" />
                     <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-[1.1] mb-6">Paragon Perks</h2>
                     <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-10 leading-relaxed">Reach Global <span className="text-amber-400">Top 10</span> to unlock specialized AI avatars.</p>
                     <button className="w-full py-5 rounded-2xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">View Rewards <ArrowRight className="w-4 h-4" /></button>
                  </div>
               </aside>
            </div>
          </div>
        )}
    </div>
  );
}
