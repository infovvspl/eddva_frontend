import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient as api } from '@/lib/api/client';
import schoolApi from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { Play, Trophy, ArrowLeft, Loader2, Sparkles, BookOpen, Star, HelpCircle, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function QuizRushHome({ onStart, onViewLeaderboard }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [difficulty, setDifficulty] = useState('any');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const classId = user?.studentProfile?.classId;
        if (!classId) {
          setSubjects([]);
          setLoading(false);
          return;
        }
        const res = await schoolApi.get('/subjects', { params: { classId, limit: 100 } });
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
          difficulty,
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
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-500">Loading game configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto py-8">
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
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <Gamepad2 className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Quiz Rush!</h1>
        <p className="text-sm font-medium text-slate-500">Fast-paced NCERT quizzes. Test your speed and accuracy!</p>
      </div>

      {/* Rules */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Game Rules &amp; Rewards
        </h2>
        <ul className="mt-3 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2">⏱️ <strong>30-Second Limit</strong>: Answer each question before time runs out.</li>
          <li className="flex items-center gap-2">✨ <strong>Base Points</strong>: +10 XP &amp; +1 EDDVA Coin per correct answer.</li>
          <li className="flex items-center gap-2">⚡ <strong>Speed Bonus</strong>: +5 XP if you answer correctly within 5 seconds!</li>
          <li className="flex items-center gap-2">🔥 <strong>Combo Streak</strong>: Build streaks for ultimate bragging rights.</li>
          <li className="flex items-center gap-2">🏆 <strong>Perfect Score</strong>: Solve all 5 correctly for +50 XP, +5 Coins, and the <strong className="text-indigo-600 dark:text-indigo-400">Quiz Master Badge</strong>!</li>
        </ul>
      </section>

      {/* Configuration Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* Subject Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> Subject
          </label>
          <CustomSelect
          onChange={setSelectedSubjectId}
            value={selectedSubjectId}
            options={subjects.map((sub) => ({ value: sub.id, label: quizSubjectLabel(sub.name) }))}
            className="w-full"
          />
        </div>

        {/* Chapter Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> Chapter
          </label>
          <CustomSelect
          onChange={setSelectedChapterId}
            value={selectedChapterId}
            options={[
            { value: "any", label: "All Chapters" },
            ...chapters.map((ch) => ({ value: ch.id, label: ch.name })),
          ]}
            disabled={chapters.length === 0}
            className="w-full"
          />
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> Difficulty
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'any', label: 'Any' },
              { id: 'easy', label: 'Easy' },
              { id: 'medium', label: 'Medium' },
              { id: 'hard', label: 'Hard' },
            ].map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => setDifficulty(diff.id)}
                className={`py-2 px-3 text-xs font-black rounded-lg border transition ${
                  difficulty === diff.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-black text-white shadow transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {starting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting Game...</>
            ) : (
              <><Play className="h-4 w-4 fill-current" /> Start Quiz Rush</>
            )}
          </button>

          <button
            type="button"
            onClick={onViewLeaderboard}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
          >
            <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

function quizSubjectLabel(subjectName = '') {
  const name = String(subjectName || 'Subject');
  const lower = name.toLowerCase();
  if (lower.includes('science')) return 'Science Shock Round';
  if (lower.includes('math')) return 'Number Ninja Challenge';
  if (lower.includes('history')) return 'Time-Travel Quiz Vault';
  if (lower.includes('geo')) return 'Map Mystery Blitz';
  if (lower.includes('civic') || lower.includes('political')) return 'Citizen Code Challenge';
  if (lower.includes('english')) return 'Word Wizard Rush';
  return `${name} Brain Blitz`;
}
