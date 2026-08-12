import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient as api } from '@/lib/api/client';
import schoolApi from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { useSchoolFeature } from '@/hooks/use-school-feature';
import { Play, Trophy, ArrowLeft, Loader2, BookOpen, Star, Layers, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect } from '@/components/ui/CustomSelect';
import './quiz-rush/arena.css';
import { ArenaBackdrop, ArenaButton, ArenaLabel, ArenaPanel } from './quiz-rush/ArenaKit';

// CustomSelect swaps its default trigger classes wholesale, so the arena
// variant has to restate layout as well as colour.
const SELECT_TRIGGER =
  'flex w-full items-center justify-between gap-2 border border-cyan-400/25 bg-slate-950/60 px-4 py-3 ' +
  'text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/50 disabled:opacity-40';
const SELECT_MENU = '!border-cyan-500/30 !bg-slate-950 !text-cyan-100';

const RULES = [
  { icon: '⏱️', title: '30 seconds', body: 'Answer before the ring runs out.' },
  { icon: '⚡', title: 'Survival', body: 'Keep answering — the questions get harder as you go.' },
  { icon: '💔', title: '3 lives', body: 'A wrong answer or a timeout costs one life.' },
  { icon: '✨', title: '+10 XP', body: 'Per correct answer, +5 more if you beat 5 seconds.' },
  { icon: '🏆', title: '5-streak', body: '+50 XP, +5 coins and the Quiz Master badge.' },
];

export default function QuizRushHome({ onStart, onViewLeaderboard }) {
  const { user } = useAuth();
  const hasGameQuizzes = useSchoolFeature('ai', 'ai_game_quizzes');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [difficulty, setDifficulty] = useState('any');
  const [mode, setMode] = useState('ranked');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const classId = user?.studentProfile?.classId;
        const sectionId = user?.studentProfile?.sectionId;
        if (!classId) {
          setSubjects([]);
          setLoading(false);
          return;
        }
        const res = await schoolApi.get('/subjects', { params: { classId, sectionId, limit: 100 } });
        const list = res.data?.data ?? res.data ?? [];
        // Deduplicate by name — prevents same-named subjects showing twice in the dropdown
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
        toast.error('Failed to load subjects.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [user]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const chapters = selectedSubject?.chapters || [];

  // Reset chapter selection when subject changes
  useEffect(() => {
    if (chapters.length > 0) {
      setSelectedChapterId('any');
    } else {
      setSelectedChapterId('');
    }
  }, [selectedSubjectId, chapters]);

  const handleStart = async () => {
    if (!selectedSubjectId) {
      toast.error('Please select a subject to start.');
      return;
    }

    setStarting(true);
    try {
      const res = await api.get('/school/gamification/quiz-rush/start', {
        params: {
          subjectId: selectedSubjectId,
          chapterId: selectedChapterId || 'any',
          difficulty: mode === 'ranked' ? undefined : difficulty,
          mode,
        },
      });
      const data = res.data?.data ?? res.data;
      onStart(data);
    } catch (err) {
      console.error('Failed to start Quiz Rush:', err);
      toast.error(err.response?.data?.message || 'Failed to start Quiz Rush. Make sure questions exist.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="qr-arena relative">
        <ArenaBackdrop />
        <div className="relative z-10 flex h-[60vh] flex-col items-center justify-center gap-5">
          <div className="qr-float qr-display text-4xl font-bold tracking-[0.3em] text-cyan-300 qr-neon">
            QUIZ RUSH
          </div>
          <div className="flex items-center gap-2.5 text-cyan-200/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="qr-display text-[11px] font-bold uppercase tracking-[0.25em]">
              Booting arena
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-arena relative">
      <ArenaBackdrop />

      <div className="relative z-10 mx-auto max-w-2xl space-y-5 pb-8">
        <Link
          to="/school/student/gamification"
          className="qr-display inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 transition hover:text-cyan-300"
        >
          <ArrowLeft className="h-3 w-3" /> Gamification Center
        </Link>

        {/* ── Title ───────────────────────────────────────────────────── */}
        <div className="qr-rise relative py-4 text-center">
          <p className="qr-display text-[11px] font-bold uppercase tracking-[0.45em] text-fuchsia-300/80">
            Survival Mode
          </p>
          <h1 className="qr-display relative mt-2 text-5xl font-bold uppercase tracking-[0.08em] text-white sm:text-6xl">
            {/* Chromatic offset — two coloured ghosts behind the white face,
                the way a CRT misconverges. Cheap, and instantly "arcade". */}
            <span aria-hidden="true" className="absolute inset-0 translate-x-[3px] text-fuchsia-500/70 blur-[1px]">
              Quiz Rush
            </span>
            <span aria-hidden="true" className="absolute inset-0 -translate-x-[3px] text-cyan-400/70 blur-[1px]">
              Quiz Rush
            </span>
            <span className="relative">Quiz Rush</span>
          </h1>
          <p className="qr-read mx-auto mt-3 max-w-sm text-xs font-medium text-slate-400">
            Straight from your NCERT chapters. Three lives, thirty seconds a question,
            and it only gets harder.
          </p>
        </div>

        {/* ── Briefing ────────────────────────────────────────────────── */}
        <ArenaPanel tone="magenta" className="p-5">
          <ArenaLabel tone="magenta">Mission Briefing</ArenaLabel>
          <div className="qr-stagger mt-4 grid gap-2.5 sm:grid-cols-2">
            {RULES.map((r) => (
              <div key={r.title} className="flex items-start gap-2.5">
                <span className="text-base leading-none">{r.icon}</span>
                <p className="qr-read text-[11px] leading-snug text-slate-400">
                  <strong className="qr-display font-bold uppercase tracking-wider text-white">
                    {r.title}
                  </strong>
                  <span className="mx-1.5 text-slate-600">·</span>
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </ArenaPanel>

        {/* ── Loadout ─────────────────────────────────────────────────── */}
        <ArenaPanel className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <ArenaLabel tone="cyan">Loadout</ArenaLabel>
            <span className="qr-display text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {subjects.length} subject{subjects.length === 1 ? '' : 's'} available
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="qr-display flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
                <BookOpen className="h-3.5 w-3.5" /> Subject
              </label>
              <CustomSelect
                onChange={setSelectedSubjectId}
                value={selectedSubjectId}
                options={subjects.map((sub) => ({ value: sub.id, label: quizSubjectLabel(sub.name) }))}
                className="w-full"
                triggerClassName={SELECT_TRIGGER}
                menuClassName={SELECT_MENU}
              />
            </div>

            <div className="space-y-2">
              <label className="qr-display flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
                <Layers className="h-3.5 w-3.5" /> Chapter
              </label>
              <CustomSelect
                onChange={setSelectedChapterId}
                value={selectedChapterId}
                options={[
                  { value: 'any', label: 'All Chapters' },
                  ...chapters.map((ch) => ({ value: ch.id, label: ch.name })),
                ]}
                disabled={chapters.length === 0}
                className="w-full"
                triggerClassName={SELECT_TRIGGER}
                menuClassName={SELECT_MENU}
              />
            </div>
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <label className="qr-display text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
              Game Mode
            </label>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {[
                { id: 'ranked', label: 'Ranked', desc: 'Auto difficulty · affects your ELO', glyph: '⚔️' },
                { id: 'free_play', label: 'Free Play', desc: 'Your difficulty · no rank change', glyph: '🎯' },
              ].map((m) => {
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id);
                      if (m.id === 'ranked') setDifficulty('any');
                    }}
                    className={`qr-chip flex items-start gap-3 border p-3.5 text-left transition ${
                      active
                        ? 'border-cyan-400/60 bg-cyan-400/10 qr-glow-cyan'
                        : 'border-white/10 bg-white/[0.02] hover:border-cyan-400/30'
                    }`}
                  >
                    <span className="text-lg leading-none">{m.glyph}</span>
                    <span className="min-w-0">
                      <span className={`qr-display block text-xs font-bold uppercase tracking-wider ${active ? 'text-cyan-200' : 'text-slate-300'}`}>
                        {m.label}
                      </span>
                      <span className="qr-read mt-0.5 block text-[10px] font-medium text-slate-500">
                        {m.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty — ranked picks this for you, so it only appears in free play */}
          {mode === 'free_play' && (
            <div className="qr-rise space-y-2">
              <label className="qr-display flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">
                <Star className="h-3.5 w-3.5" /> Difficulty
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'any', label: 'Any' },
                  { id: 'easy', label: 'Easy' },
                  { id: 'medium', label: 'Med' },
                  { id: 'hard', label: 'Hard' },
                ].map((diff) => {
                  const active = difficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setDifficulty(diff.id)}
                      className={`qr-chip qr-display border py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                        active
                          ? 'border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-200'
                          : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-fuchsia-400/30'
                      }`}
                    >
                      {diff.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </ArenaPanel>

        {/* ── Launch ──────────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          <ArenaButton
            type="button"
            onClick={handleStart}
            disabled={starting || !hasGameQuizzes}
            tone="cyan"
            className="w-full py-4 text-base"
          >
            {starting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Entering Arena
              </>
            ) : !hasGameQuizzes ? (
              <>
                <Lock className="h-4 w-4" /> Locked — AI disabled
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" />
                <span className="qr-blink">Insert Coin — Start</span>
              </>
            )}
          </ArenaButton>

          <ArenaButton type="button" onClick={onViewLeaderboard} tone="ghost" className="w-full">
            <Trophy className="h-4 w-4 text-amber-300" /> Hall of Fame
          </ArenaButton>
        </div>
      </div>
    </div>
  );
}

function quizSubjectLabel(subjectName = '') {
  return String(subjectName || 'Subject');
}
