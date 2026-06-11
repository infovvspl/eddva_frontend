import React, { useState } from 'react';
import QuizRushHome from './QuizRushHome';
import QuizRushPlay from './QuizRushPlay';
import QuizRushResult from './QuizRushResult';
import QuizRushLeaderboard from './QuizRushLeaderboard';

export default function QuizRush() {
  const [stage, setStage] = useState('home'); // 'home' | 'play' | 'result' | 'leaderboard'
  const [sessionData, setSessionData] = useState(null); // { sessionId, questions }
  const [resultData, setResultData] = useState(null); // API response from submit

  const handleStartGame = (data) => {
    setSessionData(data);
    setStage('play');
  };

  const handleFinishGame = (results) => {
    setResultData(results);
    setStage('result');
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
    <div className="mx-auto max-w-5xl">
      {stage === 'home' && (
        <QuizRushHome
          onStart={handleStartGame}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
      {stage === 'play' && (
        <QuizRushPlay
          session={sessionData}
          onFinish={handleFinishGame}
          onQuit={handleGoHome}
        />
      )}
      {stage === 'result' && (
        <QuizRushResult
          result={resultData}
          onPlayAgain={handleGoHome}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}
      {stage === 'leaderboard' && (
        <QuizRushLeaderboard
          onBack={handleGoHome}
        />
      )}
    </div>
  );
}
