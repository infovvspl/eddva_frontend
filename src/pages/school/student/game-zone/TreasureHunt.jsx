import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient as api } from '@/lib/api/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Trophy, Map, Shield, ChevronRight, CheckCircle2, Star, Coins, AlertCircle } from 'lucide-react';
import TreasureMap from './TreasureMap';
import TreasureChallenge from './TreasureChallenge';
import TreasureChest from './TreasureChest';

export default function TreasureHunt() {
  const [stage, setStage] = useState('lobby'); // 'lobby' | 'map' | 'challenge' | 'result' | 'chest'
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [challengeData, setChallengeData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch adventure maps
  const fetchMaps = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/games/treasure/maps');
      const data = res.data?.data ?? res.data ?? [];
      setMaps(data);
      
      // If we are currently in map view, sync selected map data with the updated progress
      if (selectedMap) {
        const updated = data.find((m) => m.quest.id === selectedMap.quest.id);
        if (updated) setSelectedMap(updated);
      }
    } catch (err) {
      console.error('Failed to load treasure maps:', err);
      toast.error('Failed to load adventure maps.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  const handleEnterMap = (mapData) => {
    setSelectedMap(mapData);
    setStage('map');
  };

  const handleBackToLobby = () => {
    setSelectedMap(null);
    setStage('lobby');
    fetchMaps(true); // Silent sync
  };

  // Launch a stage challenge
  const handleSelectStage = async (stageObj) => {
    try {
      setLoading(true);
      const res = await api.get('/games/treasure/challenge', {
        params: { questId: selectedMap.quest.id },
      });
      const data = res.data?.data ?? res.data;
      setChallengeData({
        ...data,
        stageName: stageObj.name,
      });
      setStage('challenge');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to start challenge. Make sure questions exist.');
    } finally {
      setLoading(false);
    }
  };

  // Submit stage challenge answers
  const handleSubmitChallenge = async (answers) => {
    try {
      const res = await api.post('/games/treasure/complete', {
        questId: selectedMap.quest.id,
        answers,
      });
      const data = res.data?.data ?? res.data;
      setResultData(data);

      if (data.questCompleted) {
        setStage('chest');
      } else {
        setStage('result');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit challenge results.');
      throw err;
    }
  };

  const handleQuitChallenge = () => {
    setChallengeData(null);
    setStage('map');
  };

  const handleClaimRewards = () => {
    setChallengeData(null);
    setResultData(null);
    setSelectedMap(null);
    setStage('lobby');
    fetchMaps();
  };

  const handleCloseResult = () => {
    setChallengeData(null);
    setResultData(null);
    setStage('map');
    fetchMaps(true); // Sync progress silent
  };

  if (loading && stage === 'lobby') {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm font-semibold text-slate-500">Loading learning arcade...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-6 px-4">
      {stage === 'lobby' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="rounded-md bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                NCERT Adventure Mode
              </span>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2">Treasure Hunt Adventure</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">Brave checkpoints, unlock mysterious maps, and retrieve epic treasure chest rewards!</p>
            </div>
            <Link
              to="/school/student/gamification"
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Gamification Center
            </Link>
          </div>

          {/* Maps List grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {maps.map((mapItem) => {
              const { quest, progress } = mapItem;
              const isCompleted = progress.status === 'completed';
              const currentLvl = progress.currentStageOrder;
              const progressPercentage = Math.round(((currentLvl - 1) / 5) * 100);

              const isForest = quest.mapType === 'forest';
              const cardBg = isForest
                ? 'bg-gradient-to-br from-emerald-50/60 to-white dark:from-slate-900/60 dark:to-slate-950'
                : 'bg-gradient-to-br from-amber-50/60 to-white dark:from-slate-900/60 dark:to-slate-950';

              const accentColor = isForest ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
              const btnBg = isForest ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700';

              return (
                <div
                  key={quest.id}
                  className={`flex flex-col justify-between rounded-2xl border border-slate-200 p-6 shadow-sm dark:border-slate-800 transition hover:shadow-md ${cardBg}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-1 ${accentColor}`}>
                        <Shield className="h-3 w-3" />
                        {quest.difficulty}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          COMPLETED
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">{quest.name}</h3>
                      <p className="text-xs font-semibold text-slate-500 leading-relaxed min-h-[40px]">
                        {quest.description}
                      </p>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>Checkpoint progression</span>
                        <span className="text-slate-700 dark:text-slate-200">
                          {isCompleted ? '5 of 5 Complete' : `Checkpoint ${currentLvl} active`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isForest ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${isCompleted ? 100 : progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleEnterMap(mapItem)}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-black text-white shadow transition ${btnBg}`}
                    >
                      {isCompleted ? 'Replay Quest Adventure' : currentLvl > 1 ? 'Resume Adventure Map' : 'Enter Quest Map'}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stage === 'map' && selectedMap && (
        <div className="animate-fade-in">
          <TreasureMap
            questData={selectedMap}
            onSelectStage={handleSelectStage}
            onBackToLobby={handleBackToLobby}
          />
        </div>
      )}

      {stage === 'challenge' && challengeData && (
        <div className="animate-fade-in">
          <TreasureChallenge
            challenge={challengeData}
            onSubmit={handleSubmitChallenge}
            onQuit={handleQuitChallenge}
          />
        </div>
      )}

      {stage === 'chest' && resultData && (
        <div className="animate-fade-in">
          <TreasureChest
            results={resultData}
            onClaim={handleClaimRewards}
          />
        </div>
      )}

      {stage === 'result' && resultData && (
        <div className="max-w-md mx-auto py-8 animate-fade-in">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-center space-y-6">
            <div className="flex justify-center">
              {resultData.passed ? (
                <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                  <AlertCircle className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {resultData.passed ? 'Checkpoint Cleared!' : 'Checkpoint Failed!'}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {resultData.passed
                  ? 'Great logic! You deciphered the NCERT challenges successfully.'
                  : 'You answered less than 60% of the stage riddles correctly.'}
              </p>
            </div>

            {resultData.passed && (
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-850">
                  <Star className="h-5 w-5 text-amber-500 fill-current mb-1" />
                  <span className="text-xs text-slate-400 uppercase font-black">Loot Gained</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">+{resultData.xpEarned} XP</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <Coins className="h-5 w-5 text-yellow-500 mb-1" />
                  <span className="text-xs text-slate-400 uppercase font-black">Coins Gained</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">+{resultData.coinsEarned} Coins</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleCloseResult}
                className={`w-full py-3.5 rounded-xl text-xs font-black text-white shadow-md transition ${
                  resultData.passed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-650 hover:bg-slate-700'
                }`}
              >
                {resultData.passed ? 'Advance Path Map' : 'Try Again Checkpoint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
