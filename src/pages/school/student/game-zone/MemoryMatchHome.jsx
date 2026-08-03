import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, ArrowLeft, Loader2, Brain, Award, Check, ChevronRight, Zap, Flame, Snowflake, BookOpen, HelpCircle } from 'lucide-react';
import { apiClient as api } from '@/lib/api/client';
import schoolApi from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { useSchoolFeature } from '@/hooks/use-school-feature';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { toast } from 'sonner';

const DIFFICULTIES = [
  {
    key: 'easy',
    label: 'Easy',
    icon: Snowflake,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    selectedBorder: 'border-emerald-500',
    selectedBg: 'bg-emerald-50/80 dark:bg-emerald-950/60',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    desc: 'Familiar concepts · Great for warming up',
  },
  {
    key: 'medium',
    label: 'Medium',
    icon: Zap,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    selectedBorder: 'border-amber-500',
    selectedBg: 'bg-amber-50/80 dark:bg-amber-950/60',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    desc: 'Balanced mix · Moderate definitions',
  },
  {
    key: 'hard',
    label: 'Hard',
    icon: Flame,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    selectedBorder: 'border-rose-500',
    selectedBg: 'bg-rose-50/80 dark:bg-rose-950/60',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    desc: 'Complex pairs · Advanced academic terms',
  },
];

export default function MemoryMatchHome({ onStart, onViewLeaderboard }) {
  const { user } = useAuth();
  const hasGameQuizzes = useSchoolFeature('ai', 'ai_game_quizzes');
  const [decks, setDecks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [mode, setMode] = useState('ranked');
  const [step, setStep] = useState('deck'); // 'deck' | 'difficulty'
  const [starting, setStarting] = useState(false);

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

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await api.get('/school/gamification/memory-match/decks');
        const data = res.data?.data ?? res.data ?? [];
        setDecks(data);
        if (data.length > 0) {
          setSelectedDeckId(data[0].id);
          setSelectedDifficulty(data[0].defaultDifficulty || 'medium');
        }
      } catch (err) {
        console.error('Failed to load memory match decks:', err);
        toast.error('Failed to load card decks.');
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, []);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId);

  const handleDeckSelect = (deckId) => {
    setSelectedDeckId(deckId);
    const deck = decks.find((d) => d.id === deckId);
    setSelectedDifficulty(deck?.defaultDifficulty || 'medium');
    if (deck?.subjectId) {
      setSelectedSubjectId(deck.subjectId);
    }
  };

  const handleNext = () => {
    if (!selectedDeckId) return;
    if (mode === 'ranked') {
      handleStart();
    } else {
      setStep('difficulty');
    }
  };

  const handleBack = () => {
    setStep('deck');
  };

  const handleStart = async () => {
    if (!selectedDeckId || starting) return;
    setStarting(true);
    try {
      await onStart(selectedDeckId, selectedDifficulty, mode, selectedSubjectId, selectedChapterId);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div className="flex justify-start">
        <Link
          to="/school/student/gamification"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Gamification Center
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Brain className="h-6 w-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Memory Match</h1>
        <p className="text-sm font-medium text-slate-500">NCERT Fact Recall. Match terms, definitions, symbols, or historical events!</p>
      </div>

      {/* Rules Board */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <Award className="h-4 w-4 animate-bounce" /> Memory Match Mechanics
        </h2>
        <ul className="mt-3 space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 dark:text-emerald-400">✨</span>
            <div><strong>Base Rewards</strong>: Earn 10 XP and 1 Coin for every matching pair found!</div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 dark:text-emerald-400">🎯</span>
            <div><strong>Efficiency Bonus</strong>: Get up to +100 bonus XP for completing the deck in the fewest turns possible. Each extra turn slightly reduces this bonus.</div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 dark:text-emerald-400">💰</span>
            <div><strong>Super Coin Payout</strong>: Get +5 bonus Coins for finishing within 3 extra turns, or +2 Coins for within 6 extra turns!</div>
          </li>
          <li className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
            <span className="text-xl leading-none">🏆</span>
            <div><strong>Mind Matcher Badge</strong>: Unlock the special badge by completing any <strong className="font-black">Hard</strong> deck in <strong className="font-black">under 20 turns</strong>!</div>
          </li>
        </ul>
      </section>

      {/* Main Configuration Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : step === 'deck' ? (
          <>
            {/* Step 1 – Deck Selection */}
            <div className="space-y-4">
              {/* Mode Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  🎮 Game Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ranked', label: 'Ranked Play', desc: 'Auto skill difficulty' },
                    { id: 'free_play', label: 'Free Play', desc: 'Custom difficulty settings' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`py-3 px-4 text-xs font-black rounded-lg border text-left transition flex flex-col gap-0.5 ${
                        mode === m.id
                          ? 'border-sky-500 bg-sky-50/30 text-sky-900 dark:bg-sky-950/30 dark:text-sky-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                    >
                      <span>{m.label}</span>
                      <span className="text-[9px] font-medium text-slate-455 dark:text-slate-500">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Select Card Deck Theme
                </label>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  Step 1 of 2
                </span>
              </div>
              <div className="grid gap-3">
                {decks.map((deck) => {
                  const isSelected = selectedDeckId === deck.id;
                  const matchingSubjects = (() => {
                    const targetId = deck.subjectId || deck.id;
                    const byId = subjects.filter((s) => s.id === targetId);
                    if (byId.length > 0 && byId.some((s) => Array.isArray(s.chapters) && s.chapters.length > 0)) return byId;

                    const nameLower = String(deck.name || '').toLowerCase();
                    let keywords = [];
                    if (nameLower.includes('synonym') || nameLower.includes('antonym') || nameLower.includes('word web') || nameLower.includes('literature') || nameLower.includes('english')) {
                      keywords = ['english', 'language', 'literature'];
                    } else if (nameLower.includes('map') || nameLower.includes('landform') || nameLower.includes('geo')) {
                      keywords = ['geography', 'geo', 'social science', 'sst'];
                    } else if (nameLower.includes('time capsule') || nameLower.includes('era') || nameLower.includes('history')) {
                      keywords = ['history', 'social science', 'sst'];
                    } else if (nameLower.includes('hindi')) {
                      keywords = ['hindi'];
                    } else if (nameLower.includes('civic') || nameLower.includes('landmark') || nameLower.includes('democracy') || nameLower.includes('politic')) {
                      keywords = ['civics', 'political science', 'democratic politics', 'social science', 'sst'];
                    } else if (nameLower.includes('formula') || nameLower.includes('math') || nameLower.includes('ninja') || nameLower.includes('number')) {
                      keywords = ['mathematics', 'maths', 'math'];
                    } else if (nameLower.includes('force') || nameLower.includes('element') || nameLower.includes('life lab') || nameLower.includes('discovery') || nameLower.includes('science')) {
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
                  let deckChapters = matchingSubjects
                    .flatMap((s) => s.chapters || [])
                    .filter((ch) => {
                      const key = ch.id || ch.name;
                      if (!key || seenCh.has(key)) return false;
                      seenCh.add(key);
                      return true;
                    });

                  if (deckChapters.length === 0) {
                    const fallbackName = deck.name || matchingSubjects[0]?.name || '';
                    const n = String(fallbackName).toLowerCase();
                    if (n.includes('hindi')) {
                      deckChapters = [
                        { id: 'hindi-ch-1', name: 'Chapter 1: Surdas ke Pad (सूरदास के पद)' },
                        { id: 'hindi-ch-2', name: 'Chapter 2: Ram-Lakshman-Parashuram Samvad (राम-लक्ष्मण-परशुराम संवाद)' },
                        { id: 'hindi-ch-3', name: 'Chapter 3: Netaji Ka Chashma (नेताजी का चश्मा)' },
                        { id: 'hindi-ch-4', name: 'Chapter 4: Balgobin Bhagat (बालगोबिन भगत)' },
                        { id: 'hindi-ch-5', name: 'Chapter 5: Lakhnavi Andaz (लखनवी अंदाज)' },
                        { id: 'hindi-ch-6', name: 'Chapter 6: Hindi Vyakaran & Samas (व्याकरण एवं समास)' },
                      ];
                    } else if (n.includes('english') || n.includes('synonym') || n.includes('antonym') || n.includes('word web') || n.includes('literature')) {
                      deckChapters = [
                        { id: 'eng-ch-1', name: 'Chapter 1: A Letter to God' },
                        { id: 'eng-ch-2', name: 'Chapter 2: Nelson Mandela: Long Walk to Freedom' },
                        { id: 'eng-ch-3', name: 'Chapter 3: Two Stories about Flying' },
                        { id: 'eng-ch-4', name: 'Chapter 4: From the Diary of Anne Frank' },
                        { id: 'eng-ch-5', name: 'Chapter 5: Glimpses of India' },
                        { id: 'eng-ch-6', name: 'Chapter 6: Grammar & Vocabulary' },
                      ];
                    } else if (n.includes('geo') || n.includes('map')) {
                      deckChapters = [
                        { id: 'geo-ch-1', name: 'Chapter 1: Resources and Development' },
                        { id: 'geo-ch-2', name: 'Chapter 2: Forest and Wildlife Resources' },
                        { id: 'geo-ch-3', name: 'Chapter 3: Water Resources' },
                        { id: 'geo-ch-4', name: 'Chapter 4: Agriculture' },
                        { id: 'geo-ch-5', name: 'Chapter 5: Minerals and Energy Resources' },
                        { id: 'geo-ch-6', name: 'Chapter 6: Manufacturing Industries' },
                      ];
                    } else if (n.includes('history') || n.includes('time capsule') || n.includes('era')) {
                      deckChapters = [
                        { id: 'hist-ch-1', name: 'Chapter 1: The Rise of Nationalism in Europe' },
                        { id: 'hist-ch-2', name: 'Chapter 2: Nationalism in India' },
                        { id: 'hist-ch-3', name: 'Chapter 3: The Making of a Global World' },
                        { id: 'hist-ch-4', name: 'Chapter 4: The Age of Industrialisation' },
                        { id: 'hist-ch-5', name: 'Chapter 5: Print Culture and the Modern World' },
                      ];
                    } else if (n.includes('civic') || n.includes('politi') || n.includes('democr')) {
                      deckChapters = [
                        { id: 'civ-ch-1', name: 'Chapter 1: Power Sharing' },
                        { id: 'civ-ch-2', name: 'Chapter 2: Federalism' },
                        { id: 'civ-ch-3', name: 'Chapter 3: Gender, Religion and Caste' },
                        { id: 'civ-ch-4', name: 'Chapter 4: Political Parties' },
                        { id: 'civ-ch-5', name: 'Chapter 5: Outcomes of Democracy' },
                      ];
                    } else if (n.includes('econ')) {
                      deckChapters = [
                        { id: 'eco-ch-1', name: 'Chapter 1: Development' },
                        { id: 'eco-ch-2', name: 'Chapter 2: Sectors of the Indian Economy' },
                        { id: 'eco-ch-3', name: 'Chapter 3: Money and Credit' },
                        { id: 'eco-ch-4', name: 'Chapter 4: Globalisation and the Indian Economy' },
                      ];
                    } else if (n.includes('science') || n.includes('physic') || n.includes('chem') || n.includes('bio')) {
                      deckChapters = [
                        { id: 'sci-ch-1', name: 'Chapter 1: Chemical Reactions and Equations' },
                        { id: 'sci-ch-2', name: 'Chapter 2: Acids, Bases and Salts' },
                        { id: 'sci-ch-3', name: 'Chapter 3: Metals and Non-metals' },
                        { id: 'sci-ch-4', name: 'Chapter 4: Life Processes' },
                        { id: 'sci-ch-5', name: 'Chapter 5: Control and Coordination' },
                        { id: 'sci-ch-6', name: 'Chapter 6: Light - Reflection and Refraction' },
                        { id: 'sci-ch-7', name: 'Chapter 7: Electricity' },
                      ];
                    } else if (n.includes('math') || n.includes('formula') || n.includes('ninja') || n.includes('number')) {
                      deckChapters = [
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
                      deckChapters = [
                        { id: 'gen-ch-1', name: 'Chapter 1: Core Fundamentals' },
                        { id: 'gen-ch-2', name: 'Chapter 2: Key Concepts & Theory' },
                        { id: 'gen-ch-3', name: 'Chapter 3: Advanced Applications' },
                        { id: 'gen-ch-4', name: 'Chapter 4: Revision & Practice' },
                      ];
                    }
                  }
                  return (
                    <div
                      key={deck.id}
                      onClick={() => handleDeckSelect(deck.id)}
                      className={`p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/30 text-slate-900 dark:bg-sky-950/20 dark:text-white'
                          : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-1 pr-4">
                          <span className="font-black text-sm">{deck.name}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {deck.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            {deck.pairsCount * 2} Cards
                          </span>
                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}>
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-sky-200/60 dark:border-sky-800/40" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 flex items-center gap-1 mb-1.5">
                            <HelpCircle className="h-3 w-3 text-sky-500" /> Target Chapter
                          </label>
                          <select
                            value={selectedChapterId}
                            onChange={(e) => setSelectedChapterId(e.target.value)}
                            className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-sky-500 transition cursor-pointer"
                          >
                            <option value="any">All Chapters (Full Subject)</option>
                            {deckChapters.map((ch) => (
                              <option key={ch.id} value={ch.id}>
                                {ch.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedDeckId || starting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700 disabled:opacity-50"
              >
                {mode === 'ranked' ? (
                  starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</> : <><Play className="h-4 w-4 fill-current" /> Start Memory Match</>
                ) : (
                  <>{starting ? 'Preparing...' : 'Choose Difficulty'} <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
              <button
                type="button"
                onClick={onViewLeaderboard}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
              >
                <Trophy className="h-4 w-4 text-amber-500" /> Rankings Leaderboard
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2 – Difficulty Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Choose Difficulty
                  </label>
                  {selectedDeck && (
                    <p className="mt-0.5 text-sm font-black text-slate-700 dark:text-white">
                      {selectedDeck.name}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  Step 2 of 2
                </span>
              </div>

              <div className="grid gap-3">
                {DIFFICULTIES.map(({ key, label, icon: Icon, color, bg, selectedBorder, selectedBg, badge, desc }) => {
                  const isSelected = selectedDifficulty === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDifficulty(key)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? `${selectedBorder} ${selectedBg}`
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-800 dark:text-white">{label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${badge}`}>
                            {key}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{desc}</p>
                      </div>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                        isSelected ? `${selectedBorder} bg-emerald-500 border-emerald-500 text-white` : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleStart}
                disabled={starting || !hasGameQuizzes}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {starting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Preparing card board...</>
                ) : !hasGameQuizzes ? (
                  <>Locked (AI disabled)</>
                ) : (
                  <><Play className="h-4 w-4 fill-current" /> Start Memory Match</>
                )}
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Theme Selection
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
