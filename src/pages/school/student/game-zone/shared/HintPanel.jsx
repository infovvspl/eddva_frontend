import React, { useEffect, useState } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Hint button shared by all four hint-eligible games. Draws from the
 * student's lifetime free-hint pool for this game type first, then charges
 * coins (server-enforced; the caps shown here are a display convenience,
 * not the source of truth).
 *
 * Two modes, chosen by which identifier prop is passed:
 * - `questionId` (Quiz Rush / Math Sprint / Treasure Hunt): the server
 *   returns a text clue, shown inline.
 * - `wordIndex` (Word Master): there are no "options" to clue toward, so the
 *   server instead reveals one more letter of the word and returns a
 *   pattern like "CO______"; the panel hands that to the parent via
 *   onRevealPattern instead of rendering text itself, so the parent can
 *   lock those letters into its own tile UI.
 *
 * Resets its visible state whenever the identifier changes, and reports the
 * running "hints used on this question/word" count to the parent via
 * onHintsUsedChange so it can be attached to the answer payload
 * (answers[].hintsUsed) when the game submits.
 */
const FREE_HINTS_PER_GAME = 3; // mirrors GamificationService.HINT_FREE_TOTAL

export default function HintPanel({ sessionId, gameType, questionId, wordIndex, disabled, onHintsUsedChange, onRevealPattern }) {
  const isWordReveal = wordIndex !== undefined && wordIndex !== null;
  const itemKey = isWordReveal ? wordIndex : questionId;

  const [wallet, setWallet] = useState(null); // { wallets, coins, hintCost, maxPurchasedPerQuestion }
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/school/gamification/hints/wallet')
      .then((res) => {
        if (!active) return;
        setWallet(res.data?.data ?? res.data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // A new question/word starts fresh — the server tracks hint counts per
  // item, so the panel's visible state must follow.
  useEffect(() => {
    setHintsUsed(0);
    setHintText('');
  }, [itemKey]);

  const maxPurchased = wallet?.maxPurchasedPerQuestion ?? 2;
  const maxPerQuestion = FREE_HINTS_PER_GAME + maxPurchased;
  const freeRemaining = wallet?.wallets?.[gameType]?.freeRemaining ?? FREE_HINTS_PER_GAME;
  const coins = wallet?.coins ?? 0;
  const hintCost = wallet?.hintCost ?? 5;
  const willBeFree = freeRemaining > 0;
  const canAfford = willBeFree || coins >= hintCost;
  const exhausted = hintsUsed >= maxPerQuestion;

  const handleUseHint = async () => {
    if (loading || disabled || exhausted || !canAfford) return;
    setLoading(true);
    try {
      const body = isWordReveal ? { sessionId, wordIndex } : { sessionId, questionId };
      const res = await api.post('/school/gamification/hints/request', body);
      const data = res.data?.data ?? res.data;
      setHintsUsed(data.hintsUsedThisQuestion);
      onHintsUsedChange?.(data.hintsUsedThisQuestion);
      if (isWordReveal) {
        onRevealPattern?.(data.revealPattern);
      } else {
        setHintText(data.hintText);
      }
      setWallet((prev) => ({
        ...prev,
        coins: data.coins,
        wallets: { ...(prev?.wallets || {}), [gameType]: { ...(prev?.wallets?.[gameType] || {}), freeRemaining: data.freeRemaining } },
      }));
      if (data.source === 'purchased') {
        toast.info(`Spent ${hintCost} coins on a hint.`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not get a hint right now.');
    } finally {
      setLoading(false);
    }
  };

  // A self-contained dark chip, independent of the host page's own theme
  // (Quiz Rush/Math Sprint are dark, Treasure Hunt/Word Master are light),
  // so contrast stays correct everywhere without a theme prop.
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleUseHint}
        disabled={loading || disabled || exhausted || !canAfford}
        title={!canAfford ? `You need ${hintCost} coins for another hint` : undefined}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-amber-400/40 bg-slate-900 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-amber-300 shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
        {exhausted
          ? 'No hints left'
          : willBeFree
            ? `Hint (${freeRemaining} free left)`
            : `Hint (${hintCost} coins)`}
      </button>
      {!isWordReveal && hintText && (
        <p className="max-w-md rounded-lg border border-amber-400/30 bg-slate-900/95 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-amber-100 shadow-sm">
          💡 {hintText}
        </p>
      )}
    </div>
  );
}
