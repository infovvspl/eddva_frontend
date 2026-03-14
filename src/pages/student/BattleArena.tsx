import { motion } from "framer-motion";
import { Swords, Zap, Users, Globe, UserPlus, Bot, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

const tiers = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion"];
const currentTier = 3; // Gold

const battleModes = [
  { icon: Zap, title: "Quick 1v1 Duel", desc: "5 questions, 30s each", players: 487, color: "text-primary", bg: "bg-primary/10" },
  { icon: Swords, title: "Topic Battle", desc: "Choose topic, 10 questions", players: 312, color: "text-info", bg: "bg-info/10" },
  { icon: Globe, title: "Daily Battle 7PM", desc: "Everyone fights at once", players: 1247, color: "text-ai", bg: "bg-ai/10" },
  { icon: UserPlus, title: "Challenge Friend", desc: "Send a direct challenge", players: 89, color: "text-success", bg: "bg-success/10" },
  { icon: Bot, title: "Bot Practice", desc: "Train against AI bots", players: 0, color: "text-warning", bg: "bg-warning/10" },
  { icon: Trophy, title: "Weekly Tournament", desc: "Sat 6PM · Top prizes", players: 2100, color: "text-primary", bg: "bg-primary/10" },
];

const BattleArena = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Swords className="w-7 h-7 text-ai" />
        <h1 className="text-2xl font-bold text-foreground">Battle Arena</h1>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ai/10 border border-ai/20">
        <Zap className="w-4 h-4 text-ai" />
        <span className="text-sm font-bold text-ai">1,847 ELO</span>
      </div>
    </div>

    {/* Tier Progress */}
    <div className="card-surface p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        {tiers.map((tier, i) => (
          <div key={tier} className="flex flex-col items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${
              i < currentTier ? "bg-primary" :
              i === currentTier ? "bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-card" :
              "bg-border"
            }`} />
            <span className={`text-xs hidden sm:block ${
              i === currentTier ? "text-primary font-bold" : "text-muted-foreground"
            }`}>
              {tier}
            </span>
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-background rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-ai to-primary rounded-full" style={{ width: `${(currentTier / (tiers.length - 1)) * 100}%` }} />
      </div>
    </div>

    {/* Battle Modes */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {battleModes.map((mode, i) => (
        <motion.div
          key={mode.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="card-surface p-5 hover:border-primary/30 transition-all group cursor-pointer"
        >
          <div className={`w-12 h-12 rounded-xl ${mode.bg} flex items-center justify-center mb-3`}>
            <mode.icon className={`w-6 h-6 ${mode.color}`} />
          </div>
          <h3 className="font-bold text-foreground mb-1">{mode.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{mode.desc}</p>
          <div className="flex items-center justify-between">
            {mode.players > 0 ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> {mode.players.toLocaleString()} online
              </span>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Always available
              </span>
            )}
            <Button size="sm" variant={mode.title.includes("Daily") ? "ai" : "default"}>
              Play
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default BattleArena;
