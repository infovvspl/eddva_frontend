import React, { useEffect, useState } from 'react';
import QuizRushHome from './QuizRushHome';
import QuizRushPlay from './QuizRushPlay';
import QuizRushResult from './QuizRushResult';
import QuizRushLeaderboard from './QuizRushLeaderboard';
import './quiz-rush/arena.css';

export default function QuizRush() {
  const [stage, setStage] = useState('home'); // 'home' | 'play' | 'result' | 'leaderboard'
  const [sessionData, setSessionData] = useState(null); // { sessionId, questions }
  const [resultData, setResultData] = useState(null); // API response from submit

  // Flags the shared GameArenaShell chrome as part of the arena for as long as
  // Quiz Rush is mounted. Removed on unmount so the other games in the shell
  // keep their normal light/dark header.
  useEffect(() => {
    document.body.classList.add('qr-immersive');
    return () => document.body.classList.remove('qr-immersive');
  }, []);

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
    <div className={stage === 'play' || stage === 'result' ? "w-full h-full flex flex-col justify-start px-2 sm:px-4 py-2 sm:py-4" : "mx-auto max-w-5xl"}>
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
