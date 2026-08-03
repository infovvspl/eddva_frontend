import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient as api } from '@/lib/api/client';
import schoolApi from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { useSchoolFeature } from '@/hooks/use-school-feature';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Trophy, Map, Shield, ChevronRight, CheckCircle2, Star, Coins, AlertCircle, BookOpen, HelpCircle } from 'lucide-react';
import { soundEngine } from '@/lib/audioManager';
import TreasureMap from './TreasureMap';
import TreasureChallenge from './TreasureChallenge';
import TreasureChest from './TreasureChest';

export default function TreasureHunt() {
  const { user } = useAuth();
  const hasGameQuizzes = useSchoolFeature('ai', 'ai_game_quizzes');
  const [stage, setStage] = useState('lobby'); // 'lobby' | 'map' | 'challenge' | 'result' | 'chest'
  const [maps, setMaps] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedChapterByQuest, setSelectedChapterByQuest] = useState({});
  const [selectedMap, setSelectedMap] = useState(null);
  const [challengeData, setChallengeData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playMode, setPlayMode] = useState('ranked');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const classId = user?.studentProfile?.classId;
        const sectionId = user?.studentProfile?.sectionId;
        if (!classId) return;
        const res = await schoolApi.get('/subjects', { params: { classId, sectionId, limit: 100 } });
        const list = res.data?.data ?? res.data ?? [];
        const seen = new Set();
        const unique = list.filter((s) => {
          const key = String(s.name || '').trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setSubjects(unique);
        if (unique.length > 0) {
          setSelectedSubjectId(unique[0].id);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, [user]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const chapters = selectedSubject?.chapters || [];

  useEffect(() => {
    if (chapters.length > 0) {
      setSelectedChapterId('any');
    } else {
      setSelectedChapterId('');
    }
  }, [selectedSubjectId, chapters]);

  // Fetch adventure maps
  const fetchMaps = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/school/gamification/treasure/maps');
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
    const chosenChapterId = selectedChapterByQuest[mapData.quest.id] || 'any';
    setSelectedMap({ ...mapData, selectedChapterId: chosenChapterId });
    setStage('map');
  };

  const handleBackToLobby = () => {
    setSelectedMap(null);
    setStage('lobby');
    fetchMaps(true); // Silent sync
  };

  // Launch a stage challenge
  const handleSelectStage = async (stageObj) => {
    if (!hasGameQuizzes) {
      toast.error('AI Adventure Quests are currently disabled by admin.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/school/gamification/treasure/challenge', {
        params: {
          questId: selectedMap.quest.id,
          stageOrder: stageObj.stageOrder,
          mode: playMode,
          subjectId: selectedMap.quest.subjectId || selectedMap.quest.id,
          chapterId: selectedMap?.selectedChapterId || 'any',
        },
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
  const handleSubmitChallenge = async (answers, tabSwitchesCount, timeTakenSeconds) => {
    try {
      const res = await api.post('/school/gamification/treasure/complete', {
        questId: selectedMap.quest.id,
        sessionId: challengeData?.sessionId,
        answers,
        tabSwitchesCount,
        timeTakenSeconds,
      });
      const data = res.data?.data ?? res.data;
      setResultData(data);

      if (data.questCompleted) {
        soundEngine.playGameWin();
        setStage('chest');
      } else {
        if (data.passed) {
          soundEngine.playGameWin();
        } else {
          soundEngine.playGameLose();
        }
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
          <div className="flex justify-start">
            <Link
              to="/school/student/gamification"
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"
            >
              <ArrowLeft className="h-3 w-3" /> Gamification Center
            </Link>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1 max-w-xl">
              <span className="rounded-md bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                NCERT Adventure Mode
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Treasure Hunt Adventure</h1>
              <p className="text-xs text-slate-500 font-normal">Brave checkpoints, unlock mysterious maps, and retrieve epic treasure chest rewards!</p>
            </div>
            
            <div className="flex flex-col gap-1 shrink-0 min-w-[220px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                🎮 Game Mode
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'ranked', label: 'Ranked', desc: 'Auto skill diff' },
                  { id: 'free_play', label: 'Free Play', desc: 'Custom diff' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPlayMode(m.id)}
                    className={`py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all text-center flex flex-col gap-0.5 ${
                      playMode === m.id
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className={`text-[8px] font-medium ${playMode === m.id ? 'text-sky-100' : 'text-slate-400'}`}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Maps List grid */}
          <div className="grid gap-5 md:grid-cols-2">
            {maps.map((mapItem) => {
              const { quest, progress } = mapItem;
              const isCompleted = progress.status === 'completed';
              const currentLvl = progress.currentStageOrder;
              const progressPercentage = Math.round(((currentLvl - 1) / 5) * 100);

              const cardBg = 'bg-gradient-to-br from-sky-50/70 via-white to-sky-50/20 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-950';
              const accentColor = 'text-sky-600 dark:text-sky-400';
              const btnBg = 'bg-sky-600 hover:bg-sky-700 text-white';

              return (
                <div
                  key={quest.id}
                  className={`flex flex-col justify-between rounded-xl border border-sky-100 p-4 shadow-sm dark:border-sky-900/40 transition hover:shadow-md ${cardBg}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/80 dark:bg-slate-950 border border-sky-200 dark:border-sky-800 flex items-center gap-1 ${accentColor}`}>
                        <Shield className="h-3 w-3" />
                        {quest.difficulty}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          COMPLETED
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{quest.name}</h3>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed">
                        {quest.description}
                      </p>
                    </div>

                    {/* Chapter Selection inside Subject Card */}
                    {(() => {
                      const matchingSubjects = (() => {
                        const targetId = quest.subjectId || quest.id;
                        const byId = subjects.filter((s) => s.id === targetId);
                        if (byId.length > 0 && byId.some((s) => Array.isArray(s.chapters) && s.chapters.length > 0)) return byId;

                        const nameLower = String(quest.name || '').toLowerCase();
                        let keywords = [];
                        if (nameLower.includes('synonym') || nameLower.includes('antonym') || nameLower.includes('word web') || nameLower.includes('story') || nameLower.includes('english')) {
                          keywords = ['english', 'language', 'literature'];
                        } else if (nameLower.includes('map') || nameLower.includes('landform') || nameLower.includes('geo')) {
                          keywords = ['geography', 'geo', 'social science', 'sst'];
                        } else if (nameLower.includes('time') || nameLower.includes('era') || nameLower.includes('relic') || nameLower.includes('history')) {
                          keywords = ['history', 'social science', 'sst'];
                        } else if (nameLower.includes('hindi')) {
                          keywords = ['hindi'];
                        } else if (nameLower.includes('civic') || nameLower.includes('constitution') || nameLower.includes('landmark') || nameLower.includes('democracy') || nameLower.includes('politic')) {
                          keywords = ['civics', 'political science', 'democratic politics', 'social science', 'sst'];
                        } else if (nameLower.includes('formula') || nameLower.includes('math') || nameLower.includes('number')) {
                          keywords = ['mathematics', 'maths', 'math'];
                        } else if (nameLower.includes('force') || nameLower.includes('element') || nameLower.includes('discovery') || nameLower.includes('science')) {
                          keywords = ['science', 'physics', 'chemistry', 'biology'];
                        } else if (nameLower.includes('econ')) {
                          keywords = ['economics', 'social science', 'sst'];
                        }

                        let matches = [];
                        if (keywords.length > 0) {
                          matches = subjects.filter((s) => keywords.some((kw) => String(s.name || '').toLowerCase().includes(kw)));
                        }
                        if (matches.length === 0) {
                          matches = subjects.filter((s) => {
                            const sName = String(s.name || '').toLowerCase();
                            return sName && (nameLower.includes(sName) || sName.includes(nameLower.split(' ')[0]));
                          });
                        }
                        return matches.length > 0 ? matches : byId;
                      })();

                      const seenCh = new Set();
                      let cardChapters = matchingSubjects
                        .flatMap((s) => s.chapters || [])
                        .filter((ch) => {
                          const key = ch.id || ch.name;
                          if (!key || seenCh.has(key)) return false;
                          seenCh.add(key);
                          return true;
                        });

                      if (cardChapters.length === 0) {
                        const fallbackName = quest.name || matchingSubjects[0]?.name || '';
                        const n = String(fallbackName).toLowerCase();
                        if (n.includes('hindi')) {
                          cardChapters = [
                            { id: 'hindi-ch-1', name: 'Chapter 1: Surdas ke Pad (सूरदास के पद)' },
                            { id: 'hindi-ch-2', name: 'Chapter 2: Ram-Lakshman-Parashuram Samvad (राम-लक्ष्मण-परशुराम संवाद)' },
                            { id: 'hindi-ch-3', name: 'Chapter 3: Netaji Ka Chashma (नेताजी का चश्मा)' },
                            { id: 'hindi-ch-4', name: 'Chapter 4: Balgobin Bhagat (बालगोबिन भगत)' },
                            { id: 'hindi-ch-5', name: 'Chapter 5: Lakhnavi Andaz (लखनवी अंदाज)' },
                            { id: 'hindi-ch-6', name: 'Chapter 6: Hindi Vyakaran & Samas (व्याकरण एवं समास)' },
                          ];
                        } else if (n.includes('english') || n.includes('synonym') || n.includes('antonym') || n.includes('word web') || n.includes('literature') || n.includes('story')) {
                          cardChapters = [
                            { id: 'eng-ch-1', name: 'Chapter 1: A Letter to God' },
                            { id: 'eng-ch-2', name: 'Chapter 2: Nelson Mandela: Long Walk to Freedom' },
                            { id: 'eng-ch-3', name: 'Chapter 3: Two Stories about Flying' },
                            { id: 'eng-ch-4', name: 'Chapter 4: From the Diary of Anne Frank' },
                            { id: 'eng-ch-5', name: 'Chapter 5: Glimpses of India' },
                            { id: 'eng-ch-6', name: 'Chapter 6: Grammar & Vocabulary' },
                          ];
                        } else if (n.includes('geo') || n.includes('map')) {
                          cardChapters = [
                            { id: 'geo-ch-1', name: 'Chapter 1: Resources and Development' },
                            { id: 'geo-ch-2', name: 'Chapter 2: Forest and Wildlife Resources' },
                            { id: 'geo-ch-3', name: 'Chapter 3: Water Resources' },
                            { id: 'geo-ch-4', name: 'Chapter 4: Agriculture' },
                            { id: 'geo-ch-5', name: 'Chapter 5: Minerals and Energy Resources' },
                            { id: 'geo-ch-6', name: 'Chapter 6: Manufacturing Industries' },
                          ];
                        } else if (n.includes('history') || n.includes('time') || n.includes('era') || n.includes('relic')) {
                          cardChapters = [
                            { id: 'hist-ch-1', name: 'Chapter 1: The Rise of Nationalism in Europe' },
                            { id: 'hist-ch-2', name: 'Chapter 2: Nationalism in India' },
                            { id: 'hist-ch-3', name: 'Chapter 3: The Making of a Global World' },
                            { id: 'hist-ch-4', name: 'Chapter 4: The Age of Industrialisation' },
                            { id: 'hist-ch-5', name: 'Chapter 5: Print Culture and the Modern World' },
                          ];
                        } else if (n.includes('civic') || n.includes('politi') || n.includes('democr') || n.includes('constitution')) {
                          cardChapters = [
                            { id: 'civ-ch-1', name: 'Chapter 1: Power Sharing' },
                            { id: 'civ-ch-2', name: 'Chapter 2: Federalism' },
                            { id: 'civ-ch-3', name: 'Chapter 3: Gender, Religion and Caste' },
                            { id: 'civ-ch-4', name: 'Chapter 4: Political Parties' },
                            { id: 'civ-ch-5', name: 'Chapter 5: Outcomes of Democracy' },
                          ];
                        } else if (n.includes('econ')) {
                          cardChapters = [
                            { id: 'eco-ch-1', name: 'Chapter 1: Development' },
                            { id: 'eco-ch-2', name: 'Chapter 2: Sectors of the Indian Economy' },
                            { id: 'eco-ch-3', name: 'Chapter 3: Money and Credit' },
                            { id: 'eco-ch-4', name: 'Chapter 4: Globalisation and the Indian Economy' },
                          ];
                        } else if (n.includes('science') || n.includes('physic') || n.includes('chem') || n.includes('bio')) {
                          cardChapters = [
                            { id: 'sci-ch-1', name: 'Chapter 1: Chemical Reactions and Equations' },
                            { id: 'sci-ch-2', name: 'Chapter 2: Acids, Bases and Salts' },
                            { id: 'sci-ch-3', name: 'Chapter 3: Metals and Non-metals' },
                            { id: 'sci-ch-4', name: 'Chapter 4: Life Processes' },
                            { id: 'sci-ch-5', name: 'Chapter 5: Control and Coordination' },
                            { id: 'sci-ch-6', name: 'Chapter 6: Light - Reflection and Refraction' },
                            { id: 'sci-ch-7', name: 'Chapter 7: Electricity' },
                          ];
                        } else if (n.includes('math') || n.includes('formula') || n.includes('ninja') || n.includes('number')) {
                          cardChapters = [
                            { id: 'math-ch-1', name: 'Chapter 1: Real Numbers' },
                            { id: 'math-ch-2', name: 'Chapter 2: Polynomials' },
                            { id: 'math-ch-3', name: 'Chapter 3: Pair of Linear Equations in Two Variables' },
                            { id: 'math-ch-4', name: 'Chapter 4: Quadratic Equations' },
                            { id: 'math-ch-5', name: 'Chapter 5: Arithmetic Progressions' },
                            { id: 'math-ch-6', name: 'Chapter 6: Triangles' },
                            { id: 'math-ch-7', name: 'Chapter 7: Coordinate Geometry' },
                            { id: 'math-ch-8', name: 'Chapter 8: Introduction to Trigonometry' },
                          ];
                        } else {
                          cardChapters = [
                            { id: 'gen-ch-1', name: 'Chapter 1: Core Fundamentals' },
                            { id: 'gen-ch-2', name: 'Chapter 2: Key Concepts & Theory' },
                            { id: 'gen-ch-3', name: 'Chapter 3: Advanced Applications' },
                            { id: 'gen-ch-4', name: 'Chapter 4: Revision & Practice' },
                          ];
                        }
                      }
                      const currentChapterId = selectedChapterByQuest[quest.id] || 'any';
                      return (
                        <div className="pt-2 pb-1" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-1.5">
                            <BookOpen className={`h-3 w-3 ${accentColor}`} /> Target Chapter
                          </label>
                          <select
                            value={currentChapterId}
                            onChange={(e) =>
                              setSelectedChapterByQuest((prev) => ({ ...prev, [quest.id]: e.target.value }))
                            }
                            className="w-full rounded-xl bg-white/80 dark:bg-slate-900 border border-sky-200 dark:border-sky-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 transition cursor-pointer shadow-sm"
                          >
                            <option value="any">All Chapters (Full Quest)</option>
                            {cardChapters.map((ch) => (
                              <option key={ch.id} value={ch.id}>
                                {ch.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

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
                          className="h-full transition-all duration-500 bg-sky-500"
                          style={{ width: `${isCompleted ? 100 : progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => handleEnterMap(mapItem)}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition ${btnBg}`}
                    >
                      {isCompleted ? 'Replay Quest Adventure' : currentLvl > 1 ? 'Resume Adventure Map' : 'Enter Quest Map'}
                      <ChevronRight className="h-3.5 w-3.5" />
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
            chapters={subjects.find((s) => s.id === (selectedMap.quest?.subjectId || selectedMap.quest?.id))?.chapters || []}
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
