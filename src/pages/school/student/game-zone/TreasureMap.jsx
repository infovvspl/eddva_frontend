import React from 'react';
import { Lock, CheckCircle2, Play, Sparkles, Gift, Trophy, ArrowLeft, ChevronRight } from 'lucide-react';

export default function TreasureMap({ questData, onSelectStage, onBackToLobby }) {
  const { quest, progress } = questData;
  const currentStageOrder = progress?.currentStageOrder || progress?.current_stage_order || 1;
  const isQuestCompleted = progress?.status === 'completed';

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

  const bgGradient = 'from-sky-50 via-sky-100/50 to-blue-50/60 text-slate-900';
  const accentColor = 'text-sky-700';
  const cleanDescription = (quest?.description || '').replace(/Class Class/g, 'Class');

  return (
    <div className={`relative rounded-2xl border border-sky-200/90 bg-gradient-to-b ${bgGradient} p-4 md:p-5 shadow-lg shadow-sky-500/5 overflow-hidden`}>
      {/* Background Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c712_1px,transparent_1px),linear-gradient(to_bottom,#0284c712_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 bg-sky-400" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-15 bg-cyan-300" />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-sky-200/80 pb-3 mb-4">
        <button
          onClick={onBackToLobby}
          className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 transition group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Gamification Lobby
        </button>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 border border-sky-300/80 shadow-sm ${accentColor}`}>
            <Sparkles className="h-3 w-3 text-sky-500" />
            {quest?.difficulty || 'Medium'} Quest Map
          </span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quest Info & Stats */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/95 backdrop-blur-md border border-sky-200 rounded-xl p-4 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{quest?.name}</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed font-normal">
                {cleanDescription}
              </p>
            </div>

            <div className="border-t border-sky-200/80 pt-3 space-y-2.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Quest Milestones</h3>
              
              <div className="flex items-center gap-2.5 bg-sky-50/80 p-2.5 rounded-lg border border-sky-200/80">
                <div className="h-8 w-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Grand Prize</p>
                  <p className="text-xs font-bold text-slate-800">Treasure Hunter Badge</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-sky-50/80 p-2.5 rounded-lg border border-sky-200/80">
                <div className="h-8 w-8 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center shrink-0">
                  <Gift className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Stage Loot</p>
                  <p className="text-xs font-bold text-slate-800">
                    {currentStageOrder <= 5 
                      ? `+${activeStage?.xpReward || 0} XP & +${activeStage?.coinsReward || 0} Coins`
                      : 'All 5 Stages Completed! 🎉'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-sky-200/80 pt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                <span>Map Progress</span>
                <span className="text-sky-700 font-bold">{Math.min(100, Math.round(((currentStageOrder - 1) / 5) * 100))}%</span>
              </div>
              <div className="h-2 w-full bg-sky-100 rounded-full overflow-hidden border border-sky-200">
                <div 
                  className="h-full transition-all duration-700 bg-gradient-to-r from-sky-500 to-cyan-500"
                  style={{ width: `${isQuestCompleted ? 100 : Math.round(((currentStageOrder - 1) / 5) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-sky-100/60 backdrop-blur-md border border-sky-200 rounded-xl p-3 text-xs font-medium text-sky-900 leading-relaxed">
            🔒 Clear checkpoints in order by scoring <strong className="text-sky-800 font-bold">60%+</strong> on AI clue riddles. Complete stage 5 to open the treasure vault!
          </div>
        </div>

        {/* Right Column: Interactive Quest Map Route */}
        <div className="lg:col-span-8 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-800 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            Adventure Checkpoints Path
          </div>

          <div className="space-y-2.5 relative">
            {sortedStages.map((stage) => {
              const isCompleted = stage.stageOrder < currentStageOrder || isQuestCompleted;
              const isActive = stage.stageOrder === currentStageOrder && !isQuestCompleted;
              const isLocked = stage.stageOrder > currentStageOrder && !isQuestCompleted;

              return (
                <div
                  key={stage.id}
                  className={`relative flex flex-col md:flex-row items-stretch md:items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-50 via-white to-cyan-50/50 border-2 border-sky-500 shadow-md shadow-sky-500/10'
                      : isCompleted
                      ? 'bg-white border-sky-200 text-slate-800 shadow-sm hover:border-sky-300'
                      : 'bg-slate-50/80 border-slate-200/80 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Stage Status Icon Badge */}
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border font-bold transition-all ${
                        isCompleted
                          ? 'bg-sky-100 border-sky-300 text-sky-600'
                          : isActive
                          ? 'bg-sky-500 border border-sky-400 text-white shadow-sm shadow-sky-500/30'
                          : 'bg-slate-100 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4.5 w-4.5 stroke-[2.5]" />
                      ) : isActive ? (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-sky-500/15 text-sky-700 border border-sky-300/80'
                            : isCompleted
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          Checkpoint {stage.stageOrder} {isActive && '• ACTIVE'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{stage.name}</h4>
                      <p className="text-[11px] font-medium text-slate-500">
                        Reward: <span className="text-amber-600 font-bold">+{stage.xpReward} XP</span> & <span className="text-yellow-600 font-bold">+{stage.coinsReward} Coins</span>
                      </p>
                    </div>
                  </div>

                  {/* Stage Action Button */}
                  <div className="mt-3 md:mt-0 flex items-center justify-end">
                    <button
                      disabled={isLocked}
                      onClick={() => onSelectStage(stage)}
                      className={`w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                        isActive
                          ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-500/25'
                          : isCompleted
                          ? 'bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      {isActive ? (
                        <>Start Checkpoint <ChevronRight className="h-3.5 w-3.5" /></>
                      ) : isCompleted ? (
                        <>Replay Stage</>
                      ) : (
                        <>Locked</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
