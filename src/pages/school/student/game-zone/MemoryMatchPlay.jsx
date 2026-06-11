import React, { useState, useEffect, useRef } from 'react';
import { Timer, RefreshCw, XCircle, Grid, Zap, Shield, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MemoryMatchPlay({ session, onFinish, onQuit }) {
  const { deckName, difficulty, cards } = session;
  const [flippedCards, setFlippedCards] = useState([]); // Array of indices of open cards
  const [matchedIds, setMatchedIds] = useState(new Set()); // Set of matchIds
  const [turns, setTurns] = useState(0);
  const [mismatches, setMismatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef(null);

  // Cards state containing matched/wrong status to style them
  const [wrongPair, setWrongPair] = useState([]); // indices of mismatched cards

  // Start tick timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCardClick = (idx) => {
    if (isProcessing) return;
    if (flippedCards.includes(idx)) return;
    if (matchedIds.has(cards[idx].matchId)) return;

    const newFlipped = [...flippedCards, idx];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      setTurns((prev) => prev + 1);

      const cardA = cards[newFlipped[0]];
      const cardB = cards[newFlipped[1]];

      if (cardA.matchId === cardB.matchId) {
        // Match found
        setTimeout(() => {
          setMatchedIds((prev) => {
            const next = new Set(prev);
            next.add(cardA.matchId);
            return next;
          });
          setFlippedCards([]);
          setIsProcessing(false);
        }, 500);
      } else {
        // Mismatch
        setMismatches((prev) => prev + 1);
        setWrongPair(newFlipped);

        setTimeout(() => {
          setFlippedCards([]);
          setWrongPair([]);
          setIsProcessing(false);
        }, 1200);
      }
    }
  };

  // Check game completion
  useEffect(() => {
    const totalPairs = cards.length / 2;
    if (matchedIds.size === totalPairs && totalPairs > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      // Brief delay before finishing for visual satisfaction
      setTimeout(() => {
        onFinish(turns, mismatches);
      }, 800);
    }
  }, [matchedIds, cards.length, turns, mismatches, onFinish]);

  const totalPairs = cards.length / 2;
  const matchedCount = matchedIds.size;
  const progressPercent = Math.min(100, Math.round((matchedCount / totalPairs) * 100));

  // Determine grid column counts based on deck size
  const gridClass = cards.length <= 12 
    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
    : cards.length <= 16 
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5";

  // Perspective flip card CSS rules
  const styles = `
    .mm-card-container {
      perspective: 1000px;
    }
    .mm-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      transform-style: preserve-3d;
    }
    .mm-card-container.flipped .mm-card-inner {
      transform: rotateY(180deg);
    }
    .mm-card-front, .mm-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
    }
    .mm-card-front {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }
    .mm-card-back {
      transform: rotateY(180deg);
      background-color: white;
    }
    .dark .mm-card-back {
      background-color: #0f172a;
    }
  `;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <style>{styles}</style>

      {/* Header HUD panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Memory Deck: {difficulty}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-xs font-semibold text-slate-500">{cards.length} Cards ({totalPairs} Pairs)</span>
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white mt-1">{deckName}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850">
            <Timer className="h-4 w-4 text-emerald-500" />
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400">Time</p>
              <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{formatTime(timeElapsed)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850">
            <RefreshCw className="h-4 w-4 text-emerald-500" />
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400">Turns</p>
              <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{turns}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850">
            <Grid className="h-4 w-4 text-emerald-500" />
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400">Matched</p>
              <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{matchedCount}/{totalPairs}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to quit this run? Your progress will be lost.')) {
                onQuit();
              }
            }}
            className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>Overall Match Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Playing Cards Grid */}
      <div className={`grid gap-4 ${gridClass}`}>
        {cards.map((card, idx) => {
          const isFlipped = flippedCards.includes(idx);
          const isMatched = matchedIds.has(card.matchId);
          const isWrong = wrongPair.includes(idx);

          // Card styles based on state
          let cardBackBorderClass = "border-slate-200 dark:border-slate-850";
          let cardBackBgClass = "bg-white dark:bg-slate-900";
          let cardBackTextClass = "text-slate-800 dark:text-slate-100";

          if (isMatched) {
            cardBackBorderClass = "border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20";
            cardBackBgClass = "bg-emerald-50/50 dark:bg-emerald-950/30";
            cardBackTextClass = "text-emerald-800 dark:text-emerald-400 font-bold";
          } else if (isWrong) {
            cardBackBorderClass = "border-rose-500 dark:border-rose-600 ring-2 ring-rose-500/20";
            cardBackBgClass = "bg-rose-50/50 dark:bg-rose-950/30";
            cardBackTextClass = "text-rose-800 dark:text-rose-400 font-bold";
          }

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`mm-card-container aspect-[4/3] sm:aspect-square w-full cursor-pointer select-none rounded-xl ${
                (isFlipped || isMatched) ? 'flipped' : ''
              }`}
            >
              <div className="mm-card-inner">
                {/* Front (Facing down, logo showing) */}
                <div className="mm-card-front shadow-sm border border-slate-700/50 flex flex-col justify-center gap-2 hover:border-emerald-500/40 hover:bg-slate-800 transition">
                  <Brain className="h-6 w-6 text-emerald-400/80" />
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">EDDVA</span>
                </div>

                {/* Back (Facing up, content showing) */}
                <div className={`mm-card-back shadow-md border-2 ${cardBackBorderClass} ${cardBackBgClass} ${cardBackTextClass}`}>
                  <p className="text-xs sm:text-sm font-bold text-center leading-snug line-clamp-4">
                    {card.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
