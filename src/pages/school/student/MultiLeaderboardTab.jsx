import React, { useState, useEffect } from 'react';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import { Trophy, Medal, Star, Flame, Shield, ChevronUp, RefreshCw, Crown } from 'lucide-react';

function GoldenCrown({ className = "h-14 w-14 sm:h-20 sm:w-20" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-amber-400/50 rounded-full blur-xl animate-pulse" />
      <svg
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_8px_16px_rgba(180,83,9,0.7)] transform hover:scale-105 transition-transform duration-300"
      >
        <defs>
          <linearGradient id="goldBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="20%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#fef08a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="goldBase" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          <linearGradient id="innerBand" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#581c87" />
            <stop offset="60%" stopColor="#3b0764" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>

          <linearGradient id="rubyMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="25%" stopColor="#ef4444" />
            <stop offset="65%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          <linearGradient id="rubyDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="60%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          <radialGradient id="goldSphere" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#fef08a" />
            <stop offset="65%" stopColor="#f59e0b" />
            <stop offset="90%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#451a03" />
          </radialGradient>
        </defs>

        <ellipse cx="100" cy="116" rx="58" ry="14" fill="url(#innerBand)" />
        <path d="M 42 116 C 42 126, 158 126, 158 116 C 158 106, 42 106, 42 116 Z" fill="#2e1065" opacity="0.6" />

        <path d="M 28 66 L 40 102 L 20 95 Z" fill="#d97706" />
        <path d="M 172 66 L 160 102 L 180 95 Z" fill="#b45309" />

        <path
          d="M 24 66 
             L 42 98 
             L 60 52 
             L 80 82 
             L 100 24 
             L 120 82 
             L 140 52 
             L 158 98 
             L 176 66 
             L 158 112 
             Q 100 126 42 112 
             Z"
          fill="url(#goldBody)"
          stroke="#78350f"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        <path
          d="M 100 28 L 118 80 L 100 75 Z"
          fill="url(#goldHighlight)"
        />
        <path
          d="M 60 56 L 78 80 L 60 74 Z"
          fill="url(#goldHighlight)"
        />
        <path
          d="M 140 56 L 122 80 L 140 74 Z"
          fill="url(#goldHighlight)"
        />

        <polygon points="100,44 113,68 100,92 87,68" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="2" />
        <polygon points="100,44 100,92 87,68" fill="#fca5a5" opacity="0.3" />

        <polygon points="60,66 70,82 60,98 50,82" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1.8" />
        <polygon points="60,66 60,98 50,82" fill="#fca5a5" opacity="0.3" />

        <polygon points="140,66 150,82 140,98 130,82" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1.8" />
        <polygon points="140,66 140,98 130,82" fill="#fca5a5" opacity="0.3" />

        <polygon points="26,76 32,86 26,96 20,86" fill="url(#rubyDark)" stroke="#450a0a" strokeWidth="1.5" />
        <polygon points="174,76 180,86 174,96 168,86" fill="url(#rubyDark)" stroke="#450a0a" strokeWidth="1.5" />

        <circle cx="100" cy="24" r="10" fill="url(#goldSphere)" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="60" cy="52" r="8" fill="url(#goldSphere)" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="140" cy="52" r="8" fill="url(#goldSphere)" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="24" cy="66" r="7" fill="url(#goldSphere)" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="176" cy="66" r="7" fill="url(#goldSphere)" stroke="#78350f" strokeWidth="1.5" />
        <circle cx="80" cy="80" r="5" fill="url(#goldSphere)" stroke="#78350f" strokeWidth="1" />
        <circle cx="120" cy="80" r="5" fill="url(#goldSphere)" stroke="#78350f" strokeWidth="1" />

        <path
          d="M 38 108 
             Q 100 124 162 108 
             L 160 124 
             Q 100 140 40 124 
             Z"
          fill="url(#goldBase)"
          stroke="#78350f"
          strokeWidth="2.5"
        />

        <path
          d="M 40 124 Q 100 140 160 124 Q 100 134 40 124 Z"
          fill="#451a03"
          opacity="0.7"
        />

        <ellipse cx="50" cy="118" rx="4.5" ry="3.5" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1" />
        <ellipse cx="66" cy="120" rx="4.5" ry="3.5" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1" />
        <ellipse cx="83" cy="122" rx="4.5" ry="3.5" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1" />
        <ellipse cx="100" cy="123" rx="5" ry="4" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1" />
        <ellipse cx="117" cy="122" rx="4.5" ry="3.5" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1" />
        <ellipse cx="134" cy="120" rx="4.5" ry="3.5" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1" />
        <ellipse cx="150" cy="118" rx="4.5" ry="3.5" fill="url(#rubyMain)" stroke="#450a0a" strokeWidth="1" />
      </svg>
    </div>
  );
}

export default function MultiLeaderboardTab({ currentProfile }) {
  const [scope, setScope] = useState('SCHOOL');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/gamification/leaderboard?scope=${scope}`);
      const data = res?.data?.data ?? res?.data ?? [];
      setRankings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [scope]);

  const scopes = [
    { key: 'SCHOOL', label: 'School' },
    { key: 'CLASS', label: 'Class' },
    { key: 'SECTION', label: 'Section' },
    { key: 'SUBJECT', label: 'Subject' },
    { key: 'ARCADE', label: 'Arcade Games' },
    { key: 'WEEKLY', label: 'Weekly' },
    { key: 'MONTHLY', label: 'Monthly Championship' },
  ];

  const getAvatarUrl = (user) => {
    if (!user) return '';
    const directPhoto = user.avatar || user.photo || user.profileImage || user.profile_image || user.avatarUrl;
    if (directPhoto && directPhoto.trim() !== '' && !directPhoto.includes('undefined') && !directPhoto.includes('null')) {
      return directPhoto;
    }
    if (
      currentProfile &&
      (user.userId === currentProfile.id || user.userId === currentProfile.userId || user.userId === currentProfile.studentId)
    ) {
      const cpPhoto = currentProfile.avatar || currentProfile.photo || currentProfile.profileImage || currentProfile.profile_image;
      if (cpPhoto && cpPhoto.trim() !== '' && !cpPhoto.includes('undefined') && !cpPhoto.includes('null')) {
        return cpPhoto;
      }
    }
    const cleanName = user.name || 'Student';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=6366f1&color=ffffff&bold=true&rounded=true`;
  };

  // Helper mock data fallback for clean visual rendering if API returns empty array
  const displayRankings = rankings.length > 0 ? rankings : [
    { userId: '1', rank: 1, name: 'Stephen Chen', level: 9, xp: 70, streak: 12, tier: 'Gold League', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80' },
    { userId: '2', rank: 2, name: 'Li Fang', level: 8, xp: 52, streak: 8, tier: 'Gold League', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80' },
    { userId: '3', rank: 3, name: 'Janson', level: 7, xp: 42, streak: 5, tier: 'Gold League', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
    { userId: '4', rank: 4, name: 'Sarah Jenkins', level: 6, xp: 38, streak: 4, tier: 'Silver League' },
    { userId: '5', rank: 5, name: 'Alex Rivera', level: 6, xp: 35, streak: 3, tier: 'Silver League' },
    { userId: '6', rank: 6, name: 'Priya Sharma', level: 5, xp: 30, streak: 2, tier: 'Silver League' },
    { userId: '7', rank: 7, name: 'David Kim', level: 5, xp: 28, streak: 1, tier: 'Bronze League' },
  ];

  const sortedRankings = [...displayRankings].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  const top1 = sortedRankings.find((r) => r.rank === 1) || sortedRankings[0];
  const top2 = sortedRankings.find((r) => r.rank === 2) || sortedRankings[1];
  const top3 = sortedRankings.find((r) => r.rank === 3) || sortedRankings[2];
  const restRankings = sortedRankings.filter((r) => (r.rank ? r.rank > 3 : true));

  return (
    <div className="space-y-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-300">
            <Shield className="h-3 w-3 text-indigo-500" />
            League Status: {currentProfile?.leagueName || 'Gold League'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Multi-Scope Leaderboards</h2>
          <p className="text-xs text-slate-500 font-medium">Climb the ranks across school, subject, games, and championships!</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-1.5 shadow-sm shrink-0">
          <ChevronUp className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-[9px] font-bold uppercase text-slate-400">Promotion Zone</p>
            <p className="text-xs font-black text-slate-900 dark:text-white">Top 5 advance to Platinum</p>
          </div>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
        {scopes.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              soundEngine.playButtonClick();
              setScope(s.key);
            }}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              scope === s.key
                ? 'bg-white text-indigo-600 shadow dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Leaderboard Section */}
      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Card with Custom Blue Frame */}
          <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 p-3 sm:p-6 shadow-xl">
            <div className="rounded-[2rem] bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-inner flex flex-col items-center border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              
              {/* Pill Title Header */}
              <div className="mb-6 rounded-full border-2 border-indigo-100 bg-white dark:bg-slate-800 dark:border-indigo-900 px-8 py-2 text-center shadow-md">
                <span className="text-base sm:text-xl font-extrabold text-indigo-500 dark:text-indigo-400 tracking-wide">
                  Total stars rank
                </span>
              </div>

              {/* Podium Flex Container */}
              <div className="flex items-end justify-center gap-3 sm:gap-6 w-full max-w-xl pt-2">
                
                {/* --- RANK 2 (Left - Silver) --- */}
                {top2 && (
                  <div className="flex flex-col items-center z-10">
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-slate-300 shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                        <img 
                          src={getAvatarUrl(top2)} 
                          alt={top2.name} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top2.name || 'Student')}&background=6366f1&color=ffffff&bold=true&rounded=true`;
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 text-center truncate max-w-[90px] sm:max-w-[110px]">
                      {top2.name}
                    </p>

                    <div className="flex items-center gap-1 text-xs sm:text-sm font-black text-amber-500 my-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{top2.xp || top2.stars || 0}</span>
                    </div>

                    {/* Silver Block */}
                    <div className="w-24 sm:w-36 h-40 sm:h-48 rounded-3xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 shadow-md border-t-4 border-slate-200 dark:border-slate-600 flex flex-col items-center justify-between p-2.5 sm:p-3 relative overflow-hidden">
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-rose-500 shadow-sm border border-rose-200 dark:border-rose-900">
                        <Shield className="h-3 w-3 text-rose-500 fill-rose-500" /> Lv {top2.level || 8}
                      </div>

                      <span className="text-3xl sm:text-4xl font-black text-slate-700 dark:text-slate-200 tracking-tight my-0.5 sm:my-1 drop-shadow-xs">
                        2
                      </span>

                      <div className="relative flex items-center justify-center mb-1">
                        <div className="absolute inset-0 bg-slate-100/80 rounded-full blur-sm" />
                        <Trophy className="h-10 w-10 sm:h-14 sm:w-14 text-slate-600 fill-slate-100 stroke-[2] drop-shadow-md relative z-10" />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- RANK 1 (Center - Gold) --- */}
                {top1 && (
                  <div className="flex flex-col items-center z-20">
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="mb-[-22px] sm:mb-[-32px] z-20">
                        <GoldenCrown className="h-24 w-24 sm:h-36 sm:w-36" />
                      </div>
                      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-amber-400 ring-4 ring-amber-300/40 shadow-2xl overflow-hidden bg-amber-50 flex items-center justify-center relative z-10">
                        <img 
                          src={getAvatarUrl(top1)} 
                          alt={top1.name} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top1.name || 'Student')}&background=6366f1&color=ffffff&bold=true&rounded=true`;
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white text-center truncate max-w-[100px] sm:max-w-[130px]">
                      {top1.name}
                    </p>

                    <div className="flex items-center gap-1 text-sm sm:text-base font-black text-amber-500 my-1">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400" />
                      <span>{top1.xp || top1.stars || 0}</span>
                    </div>

                    {/* Gold Block */}
                    <div className="w-28 sm:w-44 h-52 sm:h-60 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 shadow-xl border-t-4 border-amber-200 flex flex-col items-center justify-between p-3 relative overflow-hidden">
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-slate-800 px-3 py-1 text-xs font-black text-emerald-600 shadow-sm border border-emerald-200 dark:border-emerald-900">
                        <Shield className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" /> Lv {top1.level || 9}
                      </div>

                      <span className="text-5xl sm:text-6xl font-black text-amber-900 dark:text-amber-950 tracking-tight my-1 drop-shadow-xs">
                        1
                      </span>

                      <div className="relative flex items-center justify-center mb-1">
                        <div className="absolute inset-0 bg-amber-200/60 rounded-full blur-md" />
                        <Trophy className="h-16 w-16 sm:h-20 sm:w-20 text-amber-700 fill-amber-200 stroke-[2] drop-shadow-lg relative z-10" />
                      </div>
                    </div>
                  </div>
                )}

                {/* --- RANK 3 (Right - Bronze / Peach) --- */}
                {top3 && (
                  <div className="flex flex-col items-center z-10">
                    <div className="relative mb-2 flex flex-col items-center">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-orange-300 shadow-lg overflow-hidden bg-orange-50 flex items-center justify-center">
                        <img 
                          src={getAvatarUrl(top3)} 
                          alt={top3.name} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(top3.name || 'Student')}&background=6366f1&color=ffffff&bold=true&rounded=true`;
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 text-center truncate max-w-[90px] sm:max-w-[110px]">
                      {top3.name}
                    </p>

                    <div className="flex items-center gap-1 text-xs sm:text-sm font-black text-amber-500 my-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{top3.xp || top3.stars || 0}</span>
                    </div>

                    {/* Peach Block */}
                    <div className="w-24 sm:w-36 h-36 sm:h-44 rounded-3xl bg-gradient-to-b from-orange-200 via-orange-300 to-amber-300 dark:from-orange-800/60 dark:to-amber-900/60 shadow-md border-t-4 border-orange-200 dark:border-orange-700 flex flex-col items-center justify-between p-2.5 sm:p-3 relative overflow-hidden">
                      <div className="inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] sm:text-xs font-black text-indigo-600 shadow-sm border border-indigo-200 dark:border-indigo-900">
                        <Shield className="h-3 w-3 text-indigo-500 fill-indigo-500" /> Lv {top3.level || 7}
                      </div>

                      <span className="text-3xl sm:text-4xl font-black text-orange-800 dark:text-orange-300 tracking-tight my-0.5 sm:my-1 drop-shadow-xs">
                        3
                      </span>

                      <div className="relative flex items-center justify-center mb-1">
                        <div className="absolute inset-0 bg-orange-100/80 rounded-full blur-sm" />
                        <Trophy className="h-9 w-9 sm:h-12 sm:w-12 text-orange-700 fill-orange-100 stroke-[2] drop-shadow-md relative z-10" />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Rest of Rankings List (Rank 4+) */}
          {restRankings.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">Rest of Leaderboard</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {restRankings.map((r, index) => {
                  const displayRank = r.rank || index + 4;

                  return (
                    <div
                      key={r.userId || r.id || index}
                      className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full font-black text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {displayRank}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <img 
                            src={getAvatarUrl(r)} 
                            alt={r.name} 
                            className="h-8 w-8 rounded-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name || 'Student')}&background=6366f1&color=ffffff&bold=true&rounded=true`;
                            }}
                          />
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{r.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                              <span>Lvl {r.level || 1}</span>
                              {r.streak !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-500" /> {r.streak}d streak</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-black text-slate-900 dark:text-white">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            {r.xp || r.stars || 0} XP
                          </div>
                          {r.tier && <span className="text-[10px] font-bold text-slate-400">{r.tier}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
