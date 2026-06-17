import React, { useState } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { toast } from 'sonner';
import MemoryMatchHome from './MemoryMatchHome';
import MemoryMatchPlay from './MemoryMatchPlay';
import MemoryMatchResult from './MemoryMatchResult';
import MemoryMatchLeaderboard from './MemoryMatchLeaderboard';

export default function MemoryMatch() {
  const [stage, setStage] = useState('home'); // 'home' | 'play' | 'result' | 'leaderboard'
  const [sessionData, setSessionData] = useState(null); // { sessionId, deckName, difficulty, cards }
  const [resultData, setResultData] = useState(null); // submit API response

  const handleStartGame = async (deckId, difficulty = 'medium') => {
    try {
      const res = await api.get('/school/gamification/memory-match/start', {
        params: { deckId, difficulty },
      });
      const data = res.data?.data ?? res.data;
      setSessionData(data);
      setStage('play');
    } catch (err) {
      console.error('Failed to start Memory Match:', err);
      toast.error('Failed to start Memory Match. Please try again.');
      throw err;
    }
  };

  const handleFinishGame = async (turnsCount, mismatchesCount) => {
    try {
      const res = await api.post('/school/gamification/memory-match/submit', {
        sessionId: sessionData.sessionId,
        turnsCount,
        mismatchesCount,
      });
      const results = res.data?.data ?? res.data;
      setResultData(results);
      setStage('result');
    } catch (err) {
      console.error('Failed to submit Memory Match results:', err);
      toast.error('Failed to submit game results.');
    }
  };

  const handleGoHome = () => {
    setSessionData(null);
    setResultData(null);
    setStage('home');
  };

  const handleViewLeaderboard = () => {
    setStage('leaderboard');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {stage === 'home' && (
        <MemoryMatchHome
          onStart={handleStartGame}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
      {stage === 'play' && sessionData && (
        <MemoryMatchPlay
          session={sessionData}
          onFinish={handleFinishGame}
          onQuit={handleGoHome}
        />
      )}
      {stage === 'result' && resultData && (
        <MemoryMatchResult
          result={resultData}
          onPlayAgain={handleGoHome}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
      {stage === 'leaderboard' && (
        <MemoryMatchLeaderboard
          onBack={handleGoHome}
        />
      )}
    </div>
  );
}
