import React, { useState, useEffect, useRef } from 'react';
import { Timer, ArrowRight, XCircle, Award, CheckCircle, HelpCircle, Zap, RefreshCw, Delete, Heart } from 'lucide-react';
import { soundEngine } from '@/lib/audioManager';
import { toast } from 'sonner';
import { apiClient as api } from '@/lib/api/client';
import { useConfirm } from '@/context/ConfirmContext';

export default function WordMasterPlay({ session, onFinish, onQuit }) {
  const confirm = useConfirm();
  const { sessionId, deckName, difficulty } = session;
  const [localWords, setLocalWords] = useState(session.words || []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]); // Array<{ index, word }>
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Game Stats
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [lives, setLives] = useState(3);
  const livesRef = useRef(3);
  livesRef.current = lives;

  const userAnswersRef = useRef([]);
  userAnswersRef.current = userAnswers;
  const tabSwitchesCountRef = useRef(0);
  tabSwitchesCountRef.current = tabSwitchesCount;
  
  // Scrambled tiles state for current word
  const [tiles, setTiles] = useState([]); // Array<{ char, id, used }>

  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Anti-Cheat: Tab Switching detection & copy/select blocking
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const next = tabSwitchesCountRef.current + 1;
        tabSwitchesCountRef.current = next;
        setTabSwitchesCount(next);

        if (next >= 3) {
          toast.error('Game terminated due to multiple tab switches (cheat protection). 15 coins deducted.', {
            duration: 5000,
          });
          if (timerRef.current) clearInterval(timerRef.current);

          try {
            const totalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
            const res = await api.post('/school/gamification/word-master/submit', {
              sessionId,
              answers: userAnswersRef.current,
              tabSwitchesCount: next,
              timeTakenSeconds: totalDuration,
            });
            const results = res.data?.data ?? res.data;
            onFinish(results);
          } catch (err) {
            console.error('Failed to submit word master results:', err);
            onQuit();
          }
        } else {
          toast.warning(`Tab switch detected! Warning ${next}/3. The game will automatically terminate and deduct coins on the 3rd switch.`, {
            duration: 5000,
          });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const currentWordData = localWords[currentIdx];
  const displayHint = maskAnswerInHint(currentWordData?.hint, currentWordData?.scrambled, currentWordData?.length);

  // Start timer and BGM
  useEffect(() => {
    soundEngine.startBackgroundMusic();
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      soundEngine.stopBackgroundMusic();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Set up tiles when current word changes
  useEffect(() => {
    if (currentWordData) {
      const letters = currentWordData.scrambled.split('').map((char, id) => ({
        char: char.toUpperCase(),
        id: `${char}_${id}`,
        used: false
      }));
      setTiles(letters);
      setInputValue('');
      if (inputRef.current) inputRef.current.focus();
    }
  }, [currentIdx, currentWordData]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Click on a scrambled letter tile
  const handleTileClick = (tile, idx) => {
    if (tile.used) return;
    soundEngine.playButtonClick();
    
    // Mark tile as used
    const nextTiles = [...tiles];
    nextTiles[idx] = { ...tile, used: true };
    setTiles(nextTiles);

    // Append letter
    setInputValue((prev) => prev + tile.char);
  };

  // Backspace last letter
  const handleBackspace = () => {
    if (inputValue.length === 0) return;
    
    const lastChar = inputValue[inputValue.length - 1];
    setInputValue((prev) => prev.slice(0, -1));

    // Find the last used tile matching this character and restore it
    const nextTiles = [...tiles];
    for (let i = nextTiles.length - 1; i >= 0; i--) {
      if (nextTiles[i].char === lastChar && nextTiles[i].used) {
        nextTiles[i].used = false;
        break;
      }
    }
    setTiles(nextTiles);
  };

  // Clear answer
  const handleClear = () => {
    setInputValue('');
    setTiles(tiles.map((t) => ({ ...t, used: false })));
  };

  // Monitor text input directly
  const handleInputChange = (e) => {
    const text = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    setInputValue(text);

    // Update tile used status based on matching the characters in the text
    const tempTextChars = text.split('');
    const nextTiles = tiles.map((t) => ({ ...t, used: false }));

    tempTextChars.forEach((char) => {
      // Find the first unused tile matching this character
      const match = nextTiles.find((t) => t.char === char && !t.used);
      if (match) {
        match.used = true;
      }
    });
    setTiles(nextTiles);
  };

  const handleCheckWord = async (wordToSubmit) => {
    if (submitting) return;
    setSubmitting(true);
    const answersList = [...userAnswers, { index: currentIdx, word: wordToSubmit }];
    setUserAnswers(answersList);
    
    try {
      const totalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
      const res = await api.post('/school/gamification/word-master/submit-word', {
        sessionId,
        index: currentIdx,
        word: wordToSubmit,
        answers: answersList,
        tabSwitchesCount,
        timeTakenSeconds: totalDuration,
      });
      const data = res.data?.data ?? res.data;
      
      if (data.isCorrect) {
        soundEngine.playCorrect();
        setCorrectCount((prev) => prev + 1);
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setMaxStreak((prev) => Math.max(prev, nextStreak));
        
        setLocalWords((prev) => [...prev, data.nextWord]);
        setCurrentIdx((prev) => prev + 1);
      } else {
        soundEngine.playWrong();
        setStreak(0);
        if (data.lives > 0) {
          setLives(data.lives);
          setLocalWords((prev) => [...prev, data.nextWord]);
          setCurrentIdx((prev) => prev + 1);
        } else {
          setLives(0);
          if (timerRef.current) clearInterval(timerRef.current);
          onFinish(data.results);
        }
      }
    } catch (err) {
      console.error('Failed to submit word:', err);
      toast.error('Failed to submit word.');
    } finally {
      setSubmitting(false);
    }
  };

  // Skip word
  const handleSkip = () => {
    handleCheckWord('');
  };

  // Submit current word
  const handleSubmitWord = () => {
    handleCheckWord(inputValue.trim().toUpperCase());
  };

  const currentProgressPercent = Math.round(((currentIdx) / localWords.length) * 100);

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-4">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Word Master: {difficulty}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-xs font-semibold text-slate-500">Word {currentIdx + 1} of {localWords.length}</span>
          </div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white mt-1">{deckName}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850 text-red-500">
            <Heart className="h-4 w-4 fill-current animate-pulse" />
            <div className="text-left">
              <p className="text-[9px] font-black uppercase text-slate-400">Lives</p>
              <div className="flex gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-3 w-3 ${
                      i < lives ? 'fill-red-500 text-red-500' : 'text-slate-300 dark:text-slate-750 fill-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850">
            <Timer className="h-4 w-4 text-violet-500" />
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400">Time</p>
              <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">{formatTime(timeElapsed)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const isConfirmed = await confirm({
                title: 'Quit Word Master?',
                message: 'Are you sure you want to quit this run? Your progress for this session will be lost.',
                confirmLabel: 'Quit Game',
                cancelLabel: 'Keep Playing',
                variant: 'destructive',
              });
              if (isConfirmed) {
                onQuit();
              }
            }}
            className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-bold text-slate-500">
          <span>Overall Quiz Progress</span>
          <span>{currentProgressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full rounded-full bg-violet-500 transition-all duration-500 ease-out" 
            style={{ width: `${currentProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Gameplay Board */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4 sm:space-y-5">
        {/* Hint / Definition Area */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 border border-slate-100 dark:border-slate-850 text-center space-y-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <HelpCircle className="h-3.5 w-3.5 text-violet-500" /> Clue / Definition
          </span>
          <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-relaxed">
            "{displayHint}"
          </p>
          <div className="pt-2 text-xs font-bold text-slate-400">
            Length: {currentWordData?.length} letters
          </div>
        </div>

        {/* Scrambled Letters Tiles */}
        <div className="space-y-2">
          <label className="block text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            Click letter tiles to assemble word
          </label>
          <div className="flex flex-wrap items-center justify-center gap-2.5 py-2">
            {tiles.map((tile, idx) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTileClick(tile, idx)}
                disabled={tile.used}
                className={`h-11 w-11 rounded-xl border-2 text-base font-black flex items-center justify-center shadow transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                  tile.used
                    ? 'border-slate-200 bg-slate-100 text-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-650 cursor-not-allowed scale-90 opacity-50'
                    : 'border-violet-200 bg-violet-50/50 text-violet-800 hover:border-violet-400 dark:border-violet-900 dark:bg-violet-950/20 dark:text-violet-300'
                }`}
              >
                {tile.char}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Action Panel */}
        <div className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type or click letters above..."
              className="w-full text-center tracking-widest text-lg font-black uppercase rounded-xl border-2 border-slate-200 bg-slate-50 py-3.5 px-4 focus:border-violet-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900 dark:text-white transition outline-none"
            />
            {inputValue.length > 0 && (
              <button
                type="button"
                onClick={handleBackspace}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
              >
                <Delete className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={inputValue.length === 0}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </button>
            
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
            >
              Skip Word
            </button>

            <button
              type="button"
              onClick={handleSubmitWord}
              disabled={inputValue.length !== currentWordData?.length}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 text-xs font-black text-white hover:bg-violet-700 transition disabled:opacity-50 shadow-md"
            >
              Submit <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function maskAnswerInHint(hint = '', scrambled = '', length = 0) {
  const text = String(hint || '');
  const answerLength = Number(length || scrambled.length || 0);
  const sortedAnswer = sortLetters(scrambled);
  if (!text || !answerLength || !sortedAnswer) return text;

  const words = [...text.matchAll(/[A-Za-z]+/g)].map((match) => ({
    value: match[0],
    start: match.index,
    end: match.index + match[0].length,
  }));

  const ranges = [];
  for (let start = 0; start < words.length; start += 1) {
    for (let end = start; end < Math.min(words.length, start + 5); end += 1) {
      const phraseStart = words[start].start;
      const phraseEnd = words[end].end;
      const phrase = text.slice(phraseStart, phraseEnd);
      const letters = normalizeLetters(phrase);
      if (letters.length === answerLength && sortLetters(letters) === sortedAnswer) {
        ranges.push([phraseStart, phraseEnd]);
      }
    }
  }

  if (ranges.length === 0) return text;

  return ranges
    .sort((a, b) => b[0] - a[0])
    .reduce((masked, [start, end]) => `${masked.slice(0, start)}_____ ${masked.slice(end)}`, text)
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLetters(value = '') {
  return String(value).replace(/[^A-Za-z]/g, '').toUpperCase();
}

function sortLetters(value = '') {
  return normalizeLetters(value).split('').sort().join('');
}
