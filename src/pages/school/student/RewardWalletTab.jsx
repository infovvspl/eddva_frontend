import React, { useState, useEffect } from 'react';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import { Wallet, ArrowUpRight, History, CheckCircle, RefreshCw, CreditCard, Sparkles, AlertCircle } from 'lucide-react';

export default function RewardWalletTab({ profile, onRefresh }) {
  const [history, setHistory] = useState({ transactions: [], redemptions: [] });
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState(10);
  const [upiId, setUpiId] = useState('student@demo.upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gamification/wallet/history');
      const data = res?.data?.data ?? res?.data ?? {};
      setHistory({
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        redemptions: Array.isArray(data.redemptions) ? data.redemptions : [],
      });
    } catch (e) {
      console.error('Failed to fetch reward history:', e);
      setHistory({ transactions: [], redemptions: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRedeem = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amount = Number(redeemAmount);
    if (!amount || amount <= 0) {
      setErrorMsg('Please enter a valid redemption amount greater than ₹0');
      return;
    }

    if (amount > (profile?.rewardBalanceInr || 0)) {
      setErrorMsg(`Insufficient wallet balance. You have ₹${profile?.rewardBalanceInr || 0}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/gamification/wallet/redeem', {
        amountInr: amount,
        payoutMethod: 'DEMO_PAYMENT_RECEIVE',
        payoutDetails: { upiId, note: 'Instant Demo Payout' },
      });

      soundEngine.playCoinDrop();
      setSuccessMsg(`🎉 Demo Payout Received! ₹${amount} credited to ${upiId} (Ref: ${res?.data?.demoPayoutId})`);
      setRedeemAmount(10);
      fetchHistory();
      if (onRefresh) onRefresh();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to process redemption request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const balanceInr = profile?.rewardBalanceInr ?? Number(((profile?.xp || 0) / 100).toFixed(2));
  const lifetimeXp = profile?.lifetimeXp || profile?.xp || 0;

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              100 XP = ₹1 Reward Rate
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Reward Wallet</h2>
            <p className="mt-1 text-sm text-emerald-100 font-medium">Earn real reward credits for learning activities, homework, and quizzes.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/20 text-center min-w-[140px]">
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Available Balance</p>
              <p className="text-3xl font-black mt-1 text-white">₹{balanceInr.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-md border border-white/20 text-center min-w-[140px]">
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Lifetime XP</p>
              <p className="text-3xl font-black mt-1 text-amber-300">{lifetimeXp}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Calculator & Payout Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instant Demo Payment Receive Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Receive Demo Payout</h3>
              <p className="text-xs text-slate-500 font-medium">Convert your reward wallet balance to instant demo payout</p>
            </div>
          </div>

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Redemption Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                max={balanceInr}
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                required
              />
              <p className="mt-1 text-[11px] font-bold text-slate-400">Requires {Number(redeemAmount || 0) * 100} XP conversion</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Demo UPI ID / Details
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                placeholder="student@demo.upi"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || balanceInr <= 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4" />
                  Receive Demo Payment (₹{redeemAmount || 0})
                </>
              )}
            </button>
          </form>
        </div>

        {/* Economy Rules & Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">How XP & Rewards Work</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <span className="rounded-lg bg-amber-100 p-2 text-amber-700 font-bold text-xs shrink-0">100 XP</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Automatically converts into <strong>₹1.00</strong> in your Reward Wallet for every learning task completed.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <span className="rounded-lg bg-yellow-100 p-2 text-yellow-700 font-bold text-xs shrink-0">Coins</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  EDDVA Coins are awarded for premium achievements like 100% quiz scores, streak milestones, and rare badges.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700 font-bold text-xs shrink-0">Payouts</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Instant demo payout simulation mode is enabled for instant testing and redemption verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction & Redemption History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-slate-500" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Transaction Ledger</h3>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : history.transactions.length === 0 && history.redemptions.length === 0 ? (
          <p className="text-center py-8 text-xs font-medium text-slate-400">No transaction history found yet. Play games & quizzes to earn XP!</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.redemptions.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Demo Payout: ₹{r.amount_inr}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Ref: {r.demo_payout_id || r.id}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                    {r.status || 'APPROVED'}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {history.transactions.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.transaction_type === 'EARNED' ? `+₹${t.amount_inr} Earned (${t.xp_converted} XP)` : `-₹${t.amount_inr} Redeemed`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Source: {t.source}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">{new Date(t.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
