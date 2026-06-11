import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, ArrowLeft, Loader2, BookOpen, Award, Check, Sparkles } from 'lucide-react';
import { apiClient as api } from '@/lib/api/client';
import { toast } from 'sonner';

export default function WordMasterHome({ onStart, onViewLeaderboard }) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await api.get('/games/word-master/decks');
        const data = res.data?.data ?? res.data ?? [];
        setDecks(data);
        if (data.length > 0) {
          setSelectedDeckId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load Word Master decks:', err);
        toast.error('Failed to load vocabulary decks.');
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, []);

  const handleStart = async () => {
    if (!selectedDeckId) return;
    setStarting(true);
    try {
      await onStart(selectedDeckId);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
          <BookOpen className="h-6 w-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Word Master</h1>
        <p className="text-sm font-medium text-slate-500">Unscramble key terminology and boost your academic vocabulary!</p>
      </div>

      {/* Rules Board */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-violet-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-2">
          <Award className="h-4 w-4 animate-bounce" /> Word Master Mechanics
        </h2>
        <ul className="mt-3 space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-violet-600 dark:text-violet-400">✨</span>
            <div><strong>Scramble Points</strong>: Earn +15 XP per correct word and a streak bonus multiplier for consecutive unscrambles!</div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-600 dark:text-violet-400">💰</span>
            <div><strong>Loot Payout</strong>: Get +1 Coin per correct word. Secure a clean 10/10 run to claim a +5 Coin bonus!</div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-600 dark:text-violet-400">🔠</span>
            <div><strong>Flexible Play</strong>: Click bouncy letter tiles or type directly in the answer box to arrange your words!</div>
          </li>
          <li className="flex items-start gap-2 text-violet-600 dark:text-violet-400">
            <span className="text-xl leading-none">🏆</span>
            <div><strong>Vocab Wizard Badge</strong>: Unlock the legendary badge by completing any <strong className="font-black">Hard</strong> deck with <strong className="font-black">100% accuracy (10/10 correct)</strong>!</div>
          </li>
        </ul>
      </section>

      {/* Main Configuration Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <>
            {/* Deck Selection List */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Select Vocabulary Subject Theme
              </label>
              <div className="grid gap-3">
                {decks.map((deck) => {
                  const isSelected = selectedDeckId === deck.id;
                  const difficultyColor = 
                    deck.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                    deck.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                    'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
                  
                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => setSelectedDeckId(deck.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50/20 text-violet-950 dark:bg-violet-950/10 dark:text-white'
                          : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex-1 space-y-1 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-sm">{deck.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${difficultyColor}`}>
                            {deck.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {deck.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          {deck.wordsCount} Words
                        </span>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Play Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleStart}
                disabled={starting || !selectedDeckId}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/10 transition hover:bg-violet-700 disabled:opacity-50"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Preparing letter tiles...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" /> Start Word Master
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onViewLeaderboard}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
              >
                <Trophy className="h-4 w-4 text-amber-500" /> Rankings Leaderboard
              </button>
            </div>
          </>
        )}
      </div>

      <div className="text-center">
        <Link
          to="/school/student/gamification"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-505 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Gamification Center
        </Link>
      </div>
    </div>
  );
}
