import React, { useState } from 'react';
import { Sparkles, Trophy, Award, Coins, ChevronRight } from 'lucide-react';

export default function TreasureChest({ results, onClaim }) {
  const [chestState, setChestState] = useState('closed'); // 'closed' | 'shaking' | 'open'
  const { xpEarned, coinsEarned, badgeUnlocked } = results;

  const handleOpenChest = () => {
    if (chestState !== 'closed') return;
    setChestState('shaking');
    
    // Play shake animation for 1.2s, then open
    setTimeout(() => {
      setChestState('open');
    }, 1200);
  };

  return (
    <div className="relative min-h-[80vh] rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 p-6 md:p-10 shadow-2xl overflow-hidden flex flex-col items-center justify-center max-w-2xl mx-auto">
      {/* Background stars / grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_32px] pointer-events-none" />
      
      {/* Radiant glow matching states */}
      <div className={`absolute w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-40 transition-all duration-1000 ${
        chestState === 'open' ? 'bg-amber-400 scale-125' : 'bg-indigo-500 animate-pulse'
      }`} />

      {chestState === 'closed' && (
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Quest Stage 5 Complete
            </span>
            <h1 className="text-3xl font-black text-white leading-tight">The Treasure Awaits!</h1>
            <p className="text-sm font-medium text-slate-400 max-w-sm">
              You cleared the final checkpoint. The locked chest is ready to be opened.
            </p>
          </div>

          {/* Locked Chest Illustration */}
          <div 
            onClick={handleOpenChest}
            className="group relative cursor-pointer my-8 hover:scale-105 transition-transform"
          >
            {/* Pulsing ring aura */}
            <div className="absolute -inset-4 rounded-full bg-amber-500/10 blur-xl opacity-75 group-hover:bg-amber-500/20 transition-all" />
            
            {/* SVG Illustration of Locked Ancient Chest */}
            <svg 
              className="w-48 h-48 text-amber-500 drop-shadow-[0_10px_20px_rgba(245,158,11,0.3)]"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
              {/* Chest bottom lid */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V13" />
              {/* Chest top lid */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 13C4 8 8 7 12 7C16 7 20 8 20 13H4Z" />
              {/* Lock brace */}
              <rect x="10" y="12" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11V12" />
              {/* Padlock */}
              <circle cx="12" cy="14" r="1.5" fill="none" className="stroke-slate-950 stroke-[2.5]" />
            </svg>
          </div>

          <button
            onClick={handleOpenChest}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-sm font-black text-slate-950 hover:bg-amber-400 shadow-xl shadow-amber-500/20 transition hover:translate-y-[-2px] active:translate-y-0"
          >
            Tap to Open Chest
          </button>
        </div>
      )}

      {chestState === 'shaking' && (
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <h2 className="text-xl font-black text-amber-400 animate-pulse uppercase tracking-widest">
            Unlocking ancient seals...
          </h2>

          <div className="my-8 animate-[bounce_0.3s_infinite]">
            {/* Locked Chest Shaking SVG */}
            <svg 
              className="w-48 h-48 text-amber-500 drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V13" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 13C4 8 8 7 12 7C16 7 20 8 20 13H4Z" />
              <rect x="10" y="12" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
              <circle cx="12" cy="14" r="1.5" fill="none" className="stroke-slate-950 stroke-[2.5]" />
            </svg>
          </div>
        </div>
      )}

      {chestState === 'open' && (
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm animate-[scale-up_0.5s_ease-out]">
          {/* Confetti / Particle effect container */}
          <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none">
            <span className="text-3xl animate-ping opacity-60">✨</span>
            <span className="text-2xl animate-bounce delay-150 opacity-80 mx-10">🌟</span>
            <span className="text-3xl animate-ping delay-300 opacity-60">✨</span>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Quest Accomplished!
            </span>
            <h1 className="text-3xl font-black text-white leading-tight">Legendary Loot Claimed</h1>
            <p className="text-sm font-medium text-slate-400">
              The lock has shattered. Inside you find ancient artifacts and learning tokens!
            </p>
          </div>

          {/* Open Chest Illustration */}
          <div className="my-4 relative scale-110">
            <div className="absolute -inset-6 rounded-full bg-amber-400/20 blur-2xl animate-pulse" />
            <svg 
              className="w-48 h-48 text-amber-400 drop-shadow-[0_15px_30px_rgba(245,158,11,0.5)]"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
              {/* Open Chest Bottom */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V13" />
              {/* Open Chest Top flipped open */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 10C4 6 7 3 12 3C17 3 20 6 20 10H4Z" className="origin-top -translate-y-4 rotate-[-12deg] transform" />
              {/* Glowing coins inside */}
              <circle cx="10" cy="14" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="13.5" cy="13.5" r="1" fill="currentColor" stroke="none" />
              <circle cx="12" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </div>

          {/* Rewards Summary Panel */}
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-sm font-black border-b border-slate-800 pb-2">
              <span className="text-slate-400">Total XP Gained</span>
              <span className="text-white flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                +{xpEarned} XP
              </span>
            </div>

            <div className="flex items-center justify-between text-sm font-black border-b border-slate-800 pb-2">
              <span className="text-slate-400">Total Coins Earned</span>
              <span className="text-yellow-400 flex items-center gap-1">
                <Coins className="h-4 w-4" />
                +{coinsEarned} Coins
              </span>
            </div>

            {badgeUnlocked && (
              <div className="flex items-center gap-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 text-left">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-400">Badge Earned</p>
                  <p className="text-xs font-black text-white">{badgeUnlocked}</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClaim}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition"
          >
            Claim Loot & Exit <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
