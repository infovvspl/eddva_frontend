import React from 'react';
import { Lock, CheckCircle2, Play, Sparkles, MapPin, Gift, Trophy, ArrowLeft } from 'lucide-react';

export default function TreasureMap({ questData, onSelectStage, onBackToLobby }) {
  const { quest, progress } = questData;
  const currentStageOrder = progress?.currentStageOrder || progress?.current_stage_order || 1;
  const isQuestCompleted = progress?.status === 'completed';

  // Sort stages by stageOrder to ensure correct sequence
  const fallbackStages = [
    { id: `${quest?.id || 'quest'}-1`, name: 'Trail Gate', stageOrder: 1, xpReward: 50, coinsReward: 5 },
    { id: `${quest?.id || 'quest'}-2`, name: 'Clue Bridge', stageOrder: 2, xpReward: 60, coinsReward: 6 },
    { id: `${quest?.id || 'quest'}-3`, name: 'Riddle Ruins', stageOrder: 3, xpReward: 70, coinsReward: 7 },
    { id: `${quest?.id || 'quest'}-4`, name: 'Cipher Cave', stageOrder: 4, xpReward: 80, coinsReward: 8 },
    { id: `${quest?.id || 'quest'}-5`, name: 'Treasure Vault', stageOrder: 5, xpReward: 90, coinsReward: 9 },
  ];
  const stages = Array.isArray(quest?.stages) && quest.stages.length > 0 ? quest.stages : fallbackStages;
  const sortedStages = stages
    .map((stage, index) => ({
      ...stage,
      id: stage.id || `${quest?.id || 'quest'}-${index + 1}`,
      stageOrder: Number(stage.stageOrder || stage.stage_order || index + 1),
      xpReward: Number(stage.xpReward || stage.xp_reward || 40 + (index + 1) * 10),
      coinsReward: Number(stage.coinsReward || stage.coins_reward || 4 + index + 1),
    }))
    .sort((a, b) => a.stageOrder - b.stageOrder);
  const activeStage = sortedStages.find((stage) => stage.stageOrder === currentStageOrder);

  // Map theme configuration
  const isForest = quest.mapType === 'forest';
  const bgGradient = isForest
    ? 'from-emerald-950 via-emerald-900/40 to-slate-950 text-emerald-100'
    : 'from-amber-950 via-amber-900/40 to-slate-950 text-amber-100';

  const accentColor = isForest ? 'text-emerald-400' : 'text-amber-400';
  const accentBorder = isForest ? 'border-emerald-500/50' : 'border-amber-500/50';
  const nodeBgActive = isForest
    ? 'bg-emerald-500 text-white shadow-emerald-500/50'
    : 'bg-amber-500 text-white shadow-amber-500/50';

  const nodeBorderActive = isForest
    ? 'border-emerald-400 ring-emerald-500/20'
    : 'border-amber-400 ring-amber-500/20';

  const lineBg = isForest ? 'bg-emerald-800/50' : 'bg-amber-800/50';
  const lineBgActive = isForest ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div className={`relative min-h-[85vh] rounded-3xl border border-slate-800 bg-gradient-to-b ${bgGradient} p-6 shadow-2xl overflow-hidden flex flex-col md:flex-row gap-6`}>
      {/* Dynamic Background Grid Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20 ${isForest ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20 bg-indigo-500" />

      {/* Sidebar Details Panel */}
      <div className="relative z-10 w-full md:w-80 flex flex-col justify-between shrink-0 bg-slate-950/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5">
        <div>
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Lobby Menu
          </button>

          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 ${accentColor}`}>
            <Sparkles className="h-3 w-3" />
            {quest.difficulty} quest
          </span>

          <h2 className="mt-4 text-2xl font-black text-white leading-tight">{quest.name}</h2>
          <p className="mt-2 text-sm font-medium text-slate-400 leading-relaxed">
            {quest.description}
          </p>

          <div className="mt-6 border-t border-slate-800/80 pt-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Adventure Target</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Trophy className={`h-5 w-5 ${accentColor}`} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase">Grand Reward</p>
                <p className="text-sm font-black text-white">Treasure Hunter Badge</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase">Active Stage Loot</p>
                <p className="text-sm font-black text-white">
                  {currentStageOrder <= 5 
                    ? `+${activeStage?.xpReward || 0} XP & +${activeStage?.coinsReward || 0} Coins`
                    : 'All stages complete'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-4 text-xs font-semibold text-slate-500 leading-relaxed">
          🔒 Answer at least <strong>60% of questions</strong> correctly to advance the path. Reach checkpoint 5 to break the padlock off the treasure chest!
        </div>
      </div>

      {/* Main Map Path Renderer */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-[500px]">
        {/* Connection Path Track Line */}
        <div className="absolute top-[10%] bottom-[10%] w-1 bg-slate-800 rounded pointer-events-none flex flex-col justify-between">
          <div className={`w-full transition-all duration-1000 ${lineBgActive}`} style={{ height: `${Math.min(100, (currentStageOrder - 1) * 25)}%` }} />
        </div>

        {/* Quest Checkpoints (rendered from bottom up: stage 5 at top, stage 1 at bottom) */}
        <div className="relative w-full max-w-md h-[550px] flex flex-col justify-between items-center">
          {sortedStages.slice().reverse().map((stage) => {
            const isCompleted = stage.stageOrder < currentStageOrder;
            const isActive = stage.stageOrder === currentStageOrder;
            const isLocked = stage.stageOrder > currentStageOrder;

            // Offset checkpoints horizontally to create a winding serpentine path
            const windingOffset = stage.stageOrder % 2 === 0 ? 'translate-x-12 md:translate-x-20' : '-translate-x-12 md:-translate-x-20';

            return (
              <div
                key={stage.id}
                className={`relative flex items-center justify-center transition-all duration-500 ${windingOffset}`}
              >
                {/* Stage Info Tooltip Panel */}
                <div className={`absolute whitespace-nowrap bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2 shadow-xl flex flex-col transition-all duration-300 pointer-events-none z-20 ${
                  stage.stageOrder % 2 === 0
                    ? '-left-48 md:-left-56 text-right items-end'
                    : '-right-48 md:-right-56 text-left items-start'
                } ${isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-65 scale-95'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? accentColor : 'text-slate-500'}`}>
                    Checkpoint {stage.stageOrder} {isActive && '• ACTIVE'}
                  </span>
                  <span className="text-sm font-black text-white mt-0.5">{stage.name}</span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {stage.xpReward} XP • {stage.coinsReward} Coins
                  </span>
                </div>

                {/* Main Checkpoint Interactive Sphere Node */}
                <button
                  disabled={isLocked || isQuestCompleted}
                  onClick={() => onSelectStage(stage)}
                  className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 transition-all duration-300 outline-none ${
                    isCompleted
                      ? 'bg-slate-900 border-indigo-500 text-indigo-400 hover:scale-110 shadow-lg shadow-indigo-500/10 cursor-pointer'
                      : isActive
                      ? `${nodeBgActive} ${nodeBorderActive} hover:scale-115 ring-8 shadow-xl cursor-pointer animate-pulse`
                      : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 stroke-[3]" />
                  ) : isActive ? (
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  ) : stage.stageOrder === 5 ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}

                  {/* Pulsing Outer Aura for the active step */}
                  {isActive && (
                    <span className="absolute -inset-2 rounded-full border border-current animate-ping opacity-45 pointer-events-none" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
