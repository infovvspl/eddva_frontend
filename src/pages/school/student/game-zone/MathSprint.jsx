import React, { useState } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { toast } from 'sonner';
import MathSprintHome from './MathSprintHome';
import MathSprintPlay from './MathSprintPlay';
import MathSprintResult from './MathSprintResult';
import MathSprintLeaderboard from './MathSprintLeaderboard';

export default function MathSprint() {
  const [stage, setStage] = useState('home'); // 'home' | 'play' | 'result' | 'leaderboard'
  const [sessionData, setSessionData] = useState(null); // { sessionId, questions }
  const [resultData, setResultData] = useState(null); // submit API response

  const handleStartGame = async (difficulty) => {
    try {
      const res = await api.get('/games/math-sprint/start', {
        params: { difficulty },
      });
      const data = res.data?.data ?? res.data;
      setSessionData(data);
      setStage('play');
    } catch (err) {
      console.error('Failed to start Math Sprint:', err);
      toast.error('Failed to start Math Sprint. Make sure connection is correct.');
      throw err;
    }
  };

  const handleFinishGame = async (answers) => {
    try {
      const res = await api.post('/games/math-sprint/submit', {
        sessionId: sessionData.sessionId,
        answers,
      });
      const results = res.data?.data ?? res.data;
      setResultData(results);
      setStage('result');
    } catch (err) {
      console.error('Failed to submit sprint results:', err);
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
    <div className="mx-auto max-w-5xl px-4">
      {stage === 'home' && (
        <MathSprintHome
          onStart={handleStartGame}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
      {stage === 'play' && sessionData && (
        <MathSprintPlay
          session={sessionData}
          onFinish={handleFinishGame}
          onQuit={handleGoHome}
        />
      )}
      {stage === 'result' && resultData && (
        <MathSprintResult
          result={resultData}
          onPlayAgain={handleGoHome}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
      {stage === 'leaderboard' && (
        <MathSprintLeaderboard
          onBack={handleGoHome}
        />
      )}
    </div>
  );
}
