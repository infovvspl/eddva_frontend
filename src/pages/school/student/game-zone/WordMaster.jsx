import React, { useState } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { toast } from 'sonner';
import WordMasterHome from './WordMasterHome';
import WordMasterPlay from './WordMasterPlay';
import WordMasterResult from './WordMasterResult';
import WordMasterLeaderboard from './WordMasterLeaderboard';

export default function WordMaster() {
  const [stage, setStage] = useState('home'); // 'home' | 'play' | 'result' | 'leaderboard'
  const [sessionData, setSessionData] = useState(null); // { sessionId, deckName, difficulty, words }
  const [resultData, setResultData] = useState(null); // submit API response

  const handleStartGame = async (deckId) => {
    try {
      const res = await api.get('/games/word-master/start', {
        params: { deckId },
      });
      const data = res.data?.data ?? res.data;
      setSessionData(data);
      setStage('play');
    } catch (err) {
      console.error('Failed to start Word Master:', err);
      toast.error('Failed to start Word Master. Please try again.');
      throw err;
    }
  };

  const handleFinishGame = async (answers) => {
    try {
      const res = await api.post('/games/word-master/submit', {
        sessionId: sessionData.sessionId,
        answers,
      });
      const results = res.data?.data ?? res.data;
      setResultData(results);
      setStage('result');
    } catch (err) {
      console.error('Failed to submit Word Master results:', err);
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
        <WordMasterHome
          onStart={handleStartGame}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
      {stage === 'play' && sessionData && (
        <WordMasterPlay
          session={sessionData}
          onFinish={handleFinishGame}
          onQuit={handleGoHome}
        />
      )}
      {stage === 'result' && resultData && (
        <WordMasterResult
          result={resultData}
          onPlayAgain={handleGoHome}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
      {stage === 'leaderboard' && (
        <WordMasterLeaderboard
          onBack={handleGoHome}
        />
      )}
    </div>
  );
}
