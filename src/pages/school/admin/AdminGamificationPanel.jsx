import React, { useState, useEffect } from 'react';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import { 
  Settings, Wallet, Shield, CheckCircle2, XCircle, RefreshCw, Sparkles, 
  TrendingUp, Users, DollarSign, Brain, Sliders, AlertCircle 
} from 'lucide-react';

export default function AdminGamificationPanel() {
  const [history, setHistory] = useState({ transactions: [], redemptions: [] });
  const [loading, setLoading] = useState(true);
  const [conversionRate, setConversionRate] = useState(10);
  const [minRedeem, setMinRedeem] = useState(10);
  const [payoutMode, setPayoutMode] = useState('DEMO_PAYMENT_RECEIVE');
  const [activeTab, setActiveTab] = useState('redemptions');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/school/gamification/admin/redemptions');
      setHistory(res?.data ?? { transactions: [], redemptions: [] });
    } catch (e) {
      console.error('Failed to load admin gamification data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const totalConvertedInr = history.redemptions.reduce((acc, r) => acc + Number(r.amount_inr || 0), 0);
  const pendingCount = history.redemptions.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider border border-indigo-500/30 text-indigo-300">
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              School Administration Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">Gamification & Reward Control Panel</h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">Manage Coins conversion economy (10 Coins = ₹1), redemptions, AI parameters, and analytics.</p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Payout Mode</p>
              <p className="text-sm font-black text-emerald-400 mt-0.5">Demo Instant</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-md border border-white/10 text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Paid</p>
              <p className="text-sm font-black text-amber-300 mt-0.5">₹{totalConvertedInr.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex gap-2 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('redemptions')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === 'redemptions'
              ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Wallet className="h-4 w-4" />
          Redemptions Log ({history.redemptions.length})
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === 'rules'
              ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Economy Rules (10 Coins = ₹1)
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === 'ai'
              ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Brain className="h-4 w-4" />
          AI Difficulty & Memory Settings
        </button>
      </div>

      {/* Tab 1: Redemptions Log */}
      {activeTab === 'redemptions' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Student Reward Redemptions</h2>
            <button
              onClick={fetchAdminData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : history.redemptions.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400 font-medium">No redemptions logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="pb-3">Student ID</th>
                    <th className="pb-3">Amount (₹)</th>
                    <th className="pb-3">Payout Method</th>
                    <th className="pb-3">Ref Code</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.redemptions.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{r.user_id}</td>
                      <td className="py-3 font-black text-emerald-600 dark:text-emerald-400">₹{r.amount_inr}</td>
                      <td className="py-3 font-bold text-slate-600 dark:text-slate-300">{r.payout_method}</td>
                      <td className="py-3 font-mono text-[11px] text-slate-500">{r.demo_payout_id || r.id}</td>
                      <td className="py-3">
                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {r.status || 'APPROVED'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Economy Rules */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">Coins-to-INR Conversion Controls</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">EDDVA Coins per ₹1 Reward</label>
                <input
                  type="number"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-800 dark:bg-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">Default rule: 10 Coins = ₹1</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Minimum Redemption Threshold (₹)</label>
                <input
                  type="number"
                  value={minRedeem}
                  onChange={(e) => setMinRedeem(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-800 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Payout Processing Mode</label>
                <select
                  value={payoutMode}
                  onChange={(e) => setPayoutMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-800 dark:bg-slate-800"
                >
                  <option value="DEMO_PAYMENT_RECEIVE">Instant Demo Payment Receive (Simulation)</option>
                  <option value="MANUAL_APPROVAL">Manual Admin Approval Required</option>
                </select>
              </div>

              <button
                onClick={() => soundEngine.playCorrect()}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Save Economy Settings
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">Reward Activity Multipliers</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Base XP values awarded for learning activities</p>
            <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Video Lesson Watch:</span> <span className="text-indigo-600 font-black">+50 XP</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Topic Quiz Completion:</span> <span className="text-indigo-600 font-black">+75 XP</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>Battle Arena Win:</span> <span className="text-indigo-600 font-black">+100 XP</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span>100% Perfect Score Bonus:</span> <span className="text-yellow-600 font-black">+25 EDDVA Coins</span>
              </div>
              <div className="flex justify-between py-2">
                <span>AI Spaced Revision:</span> <span className="text-purple-600 font-black">+60 XP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Difficulty & Memory Settings */}
      {activeTab === 'ai' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">AI Adaptive Engine & SuperMemo Spaced Repetition Parameters</h3>
          <p className="text-xs text-slate-500 font-medium mb-4">Control how AI adjusts student level (Beginner → Master) and triggers flashcards.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400">Accuracy Rank Up Threshold</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">90%</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Triggers difficulty step increase</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400">Memory Score Warning</p>
              <p className="text-2xl font-black text-amber-500 mt-1">&lt; 60%</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Generates AI flashcard notifications</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400">SM-2 Initial Ease Factor</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">2.5</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Spaced repetition multiplier</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
