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

// ─── Shared Components ──────────────────────────────────────────────────────────

const CardGlass = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={onClick ? { y: -5, scale: 1.01 } : {}}
    onClick={onClick}
    className={cn(
      "bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-500",
      onClick ? "cursor-pointer" : "",
      className
    )}
  >
    {children}
  </motion.div>
);

// ─── Podium: Holographic Hall of Fame ─────────────────────────────────────────
function Podium({ entries }: { entries: any[] }) {
  // Top 3 order: 🥈(1), 🥇(0), 🥉(2)
  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean);
  const configs = [
    { height: "h-64",  medal: "🥈", color: "bg-slate-300",  glow: "shadow-slate-500/20",   delay: 0.2 },
    { height: "h-80",  medal: "🥇", color: "bg-amber-400",  glow: "shadow-amber-500/30",   delay: 0 },
    { height: "h-56",  medal: "🥉", color: "bg-amber-700",  glow: "shadow-orange-800/20",  delay: 0.4 },
  ];

  return (
    <div className="flex items-end justify-center gap-6 sm:gap-10 mt-12 mb-16 px-4">
      {podiumOrder.map((entry, i) => {
        if (!entry) return <div key={i} className="flex-1 opacity-0" />;
        const config = configs[i];
        const tier = entry.eloTier?.toLowerCase() ?? "iron";
        const color = tierColors[tier];

        return (
          <motion.div 
            key={entry.rank}
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: config.delay, type: "spring", stiffness: 100 }}
            className="flex-1 flex flex-col items-center max-w-[240px]"
          >
            {/* Holographic Crown / Wings */}
            <div className="relative mb-6">
               <motion.div 
                 animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent blur-xl rounded-full"
               />
               <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden z-10 transition-transform hover:scale-110">
                  {entry.profilePictureUrl ? (
                    <img src={entry.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-900 bg-slate-50">
                       {entry.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {i === 1 && (
                    <div className="absolute top-0 left-0 w-full h-full bg-amber-400/10 pointer-events-none" />
                  )}
               </div>
               
               {i === 1 && (
                 <motion.div
                   animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                   className="absolute -top-8 left-1/2 -translate-x-1/2"
                 >
                    <Crown className="w-8 h-8 text-amber-400 fill-amber-200" />
                 </motion.div>
               )}
            </div>

            <div className="text-center mb-6">
               <p className="text-lg font-black text-slate-900 uppercase italic leading-tight truncate px-2">{entry.name}</p>
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mt-2 inline-block">
                  {entry.score.toLocaleString()} PTS
               </span>
            </div>

            {/* Cinematic Pillar */}
            <div className={cn(
              "w-full rounded-t-[2.5rem] relative overflow-hidden group border border-white/60",
              config.height,
              i === 1 ? "bg-slate-900 border-slate-800" : "bg-white/60"
            )}>
               <div className={cn("absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity", i === 1 ? "bg-blue-600" : "bg-slate-400")} />
               <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
               
               <div className="flex flex-col items-center justify-center h-full pt-6 relative z-10 gap-2">
                  <span className="text-4xl filter drop-shadow-2xl">{config.medal}</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", i === 1 ? "text-white/40" : "text-slate-400")}>
                    Rank #{entry.rank}
                  </span>
               </div>

               {/* Ambient Floor Glow */}
               <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-4 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity", i === 1 ? "bg-blue-600/40" : "bg-slate-400/20")} />
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
  const color = tierColors[tier] ?? tierColors.iron;
  const grad  = tierGradients[tier] ?? tierGradients.iron;

  return (
    <CardGlass 
      className={cn(
        "p-5 flex items-center gap-6 group mb-3",
        isMe ? "ring-2 ring-blue-600 shadow-blue-500/10" : "hover:border-blue-200"
      )}
    >
      {/* Rank Indicator */}
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
         {entry.rank <= 3 ? (
           <span className="text-2xl">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
         ) : (
           <span className={cn("text-lg font-black italic", isMe ? "text-blue-600" : "text-slate-300")}>#{entry.rank}</span>
         )}
      </div>

      {/* Avatar */}
      <div className="relative">
         <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            {entry.profilePictureUrl ? (
              <img src={entry.profilePictureUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-lg font-black text-slate-900">{entry.name.charAt(0).toUpperCase()}</div>
            )}
         </div>
         {isMe && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse" />
         )}
      </div>

      {/* Identity Node */}
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-3 mb-1">
            <h4 className={cn("text-base font-black uppercase italic tracking-tight truncate px-1", isMe ? "text-blue-600" : "text-slate-900")}>
               {entry.name} {isMe && <span className="not-italic text-[10px] text-blue-400 ml-1.5">(Neural Sync: Online)</span>}
            </h4>
         </div>
         <div className="flex items-center gap-3">
            <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r", grad)}>
               {tier}
            </span>
            {entry.city && (
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                 <MapPin className="w-3 h-3" /> {entry.city}
              </span>
            )}
         </div>
      </div>

      {/* Score Analytics */}
      <div className="text-right shrink-0 px-4">
         <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
               <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
               <p className="text-xl font-black text-slate-900 leading-none">{entry.score.toLocaleString()}</p>
            </div>
            <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">System XP</p>
         </div>
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
         <ArrowRight className="w-5 h-5 text-slate-300" />
      </div>
    </CardGlass>
  );
}

// ─── Main Page: Hall of Fame Hub ─────────────────────────────────────────────
export default function StudentLeaderboardPage() {
  const [scope, setScope] = useState<ScopeType>("global");
  const { data: me } = useStudentMe();
  const { data: lb, isLoading } = useLeaderboard({ scope });

  const entries  = lb?.data ?? [];
  const myRank   = lb?.currentStudentRank;
  const top3     = entries.slice(0, 3);
  const rest     = entries.slice(3);
  const myId     = me?.student?.id;
  const meInList = entries.some(e => e.studentId === myId);

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] custom-scrollbar selection:bg-blue-600/10">
      {/* ── Aero Dynamic Background ── */}

      <div className="relative z-10 px-6 sm:px-10 py-8 max-w-[1700px] mx-auto">
        
        {/* ── Hall of Fame Header ── */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-12 mb-16">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900 text-white w-fit shadow-xl"
            >
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural Paragon Archive</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
              Hall of<br/><span className="not-italic text-blue-600">Glory</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm sm:text-base max-w-lg leading-relaxed">
               Calibrating the highest-performing synthesis units across the network. Only the top <strong>0.1%</strong> attain Paragon status.
            </p>
          </div>

          <div className="flex items-center gap-8">
             {myRank && (
               <CardGlass className="px-10 py-6 border-blue-500/10 bg-blue-500/[0.02]">
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
                  {myRank.rank > 1 && entries[myRank.rank - 2] && (
                    <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bridging gap to #{myRank.rank - 1}</span>
                       <span className="text-[10px] font-black text-amber-500">
                          {(entries[myRank.rank - 2].score - myRank.score).toLocaleString()} XP Needed
                       </span>
                    </div>
                  )}
               </CardGlass>
             )}
          </div>
        </header>

        {/* ── Scope Console ── */}
        <div className="flex gap-2 overflow-x-auto pb-8 custom-scrollbar">
          {SCOPES.map(s => (
            <motion.button
              key={s.key}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setScope(s.key)}
              className={cn(
                "shrink-0 flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                scope === s.key ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-400 border border-slate-100 hover:border-blue-200"
              )}
            >
              {s.icon} {s.label}
            </motion.button>
          ))}
        </div>

        {/* ── Main Podium View ── */}
        {isLoading ? (
           <div className="py-40 flex flex-col items-center gap-6">
              <div className="relative">
                 <Loader2 className="w-16 h-16 animate-spin text-blue-50" />
                 <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Querying Academy Standings</p>
           </div>
        ) : entries.length === 0 ? (
           <div className="py-40 flex flex-col items-center text-center max-w-md mx-auto">
              <div className="w-24 h-24 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl mb-10">
                 <Swords className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-3">No Contenders Found</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">
                This frequency is currently dormant. Initiate unit training or complete quests to establish first contact.
              </p>
           </div>
        ) : (
          <div className="space-y-12 pb-20">
            {top3.length >= 3 && <Podium entries={top3} />}

            {/* Hall List Area */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 items-start">
               <div className="xl:col-span-3">
                  <div className="space-y-4">
                    {entries.map((entry, i) => (
                      <motion.div
                        key={entry.studentId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                         <RankRow
                           entry={entry}
                           isMe={entry.studentId === myId}
                         />
                      </motion.div>
                    ))}
                    
                    {/* My Rank Row Gap (if applicable) */}
                    {!meInList && myRank && (
                      <div className="mt-12 space-y-4">
                         <div className="flex items-center gap-4 px-6 opacity-30">
                            <div className="flex-1 h-px bg-slate-900/10" />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Your Trajectory</span>
                            <div className="flex-1 h-px bg-slate-900/10" />
                         </div>
                         <RankRow entry={{ rank: myRank.rank, name: me?.fullName ?? "Unit Zero", score: myRank.score }} isMe />
                      </div>
                    )}
                  </div>
               </div>

               {/* Right Sideboard: Intelligence */}
               <aside className="xl:col-span-1 h-[calc(100vh-16rem)] sticky top-32 space-y-10 min-w-0">
                  <CardGlass className="p-8">
                     <h4 className="text-sm font-black text-slate-900 uppercase italic mb-8 flex items-center justify-between">
                        Tactical Insights
                        <Zap className="w-5 h-5 text-amber-500 fill-amber-200" />
                     </h4>
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                              <span>Global Sync Pct</span>
                              <span className="text-blue-600">82.4%</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden p-0.5">
                              <motion.div initial={{ width: 0 }} animate={{ width: "82%" }} className="h-full bg-blue-600 rounded-full" />
                           </div>
                        </div>
                        <div className="space-y-4 p-5 rounded-2xl bg-orange-50/50 border border-orange-100 border-dashed">
                           <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest leading-relaxed">
                              You are <span className="font-black">Top 4%</span> of your batch in Combat Proficiency.
                           </p>
                        </div>
                     </div>
                  </CardGlass>

                  <CardGlass className="p-0 bg-slate-900 overflow-hidden shadow-amber-500/10">
                     <div className="p-8 pb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center mb-6">
                           <Medal className="w-7 h-7 text-white" />
                        </div>
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Paragon Perks</h4>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-10 leading-loose">Reach Global <span className="text-amber-400">Top 10</span> to unlock specialized AI avatars and early-access quests.</p>
                     </div>
                     <button className="w-full py-5 bg-white/5 border-t border-white/5 text-xs font-black text-white hover:bg-white/10 uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                        View Rewards <ArrowRight className="w-4 h-4" />
                     </button>
                  </CardGlass>
               </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}