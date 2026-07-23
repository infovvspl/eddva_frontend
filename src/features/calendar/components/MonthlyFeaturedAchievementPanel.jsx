import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3 } from 'lucide-react';
import defaultSchoolLogo from '@/assets/eddva web logo.png';

// Import transparent cutout images for months
import aprLeft from '@/assets/calendar_achievers/apr_left_1784629582215.png';
import febLeft from '@/assets/calendar_achievers/feb_left_1784629469535.png';
import janLeft from '@/assets/calendar_achievers/jan_left_1784629236523.png';
import marLeft from '@/assets/calendar_achievers/mar_left_1784629530987.png';
import mayLeft from '@/assets/calendar_achievers/may_left_1784629647960.png';
import junLeft from '@/assets/calendar_achievers/jun_left_1784629701895.png';
import julLeft from '@/assets/calendar_achievers/jul_left_1784629824426.png';
import augLeft from '@/assets/calendar_achievers/aug_left_1784695060636.png';
import sepLeft from '@/assets/calendar_achievers/sep_left_1784695098267.png';
import octLeft from '@/assets/calendar_achievers/oct_left_1784695137529.png';
import novLeft from '@/assets/calendar_achievers/nov_left_1784695170131.png';
import decLeft from '@/assets/calendar_achievers/dec_left_1784695208727.png';
import basketballGirl from '@/assets/calendar_achievers/basketball_girl_1784616205032.png';

export const MONTH_THEMES = [
  {
    month: 0,
    monthName: 'January',
    year: '2026',
    gradient: 'from-[#1e3a8a] via-[#1d4ed8] to-[#0f172a]',
    shadowColor: 'bg-[#0f172a]/40',
    studentPhoto: janLeft,
    studentName: 'Kavya Singh',
    studentClass: 'Class XII - A',
    achievementTitle: 'Best NCC Cadet State Parade Leader',
    tagline: 'Republic Day Honor 2026',
  },
  {
    month: 1,
    monthName: 'February',
    year: '2026',
    gradient: 'from-[#701a75] via-[#86198f] to-[#3b0764]',
    shadowColor: 'bg-[#3b0764]/40',
    studentPhoto: febLeft,
    studentName: 'Siddharth Nair',
    studentClass: 'Class V - A',
    achievementTitle: 'National Youth Fine Arts Poster Exhibition Winner',
    tagline: 'Fine Arts Championship 2026',
  },
  {
    month: 2,
    monthName: 'March',
    year: '2026',
    gradient: 'from-[#134e4a] via-[#0f766e] to-[#042f2e]',
    shadowColor: 'bg-[#042f2e]/40',
    studentPhoto: marLeft,
    studentName: 'Sneha Gupta',
    studentClass: 'Class X - A',
    achievementTitle: 'State Board Examination Rank 1 (99.4% Aggregate)',
    tagline: 'Academic Topper Award',
  },
  {
    month: 3,
    monthName: 'April',
    year: '2026',
    gradient: 'from-[#881337] via-[#9f1239] to-[#4c0519]', // Deep Rose Burgundy matching photo!
    shadowColor: 'bg-[#4c0519]/50',
    studentPhoto: basketballGirl,
    studentName: 'Sourabh Sharma',
    studentClass: 'Class XI - B',
    achievementTitle: '3x3 SR Memorial Inter School Basketball Tournament Winner.',
    tagline: 'Inter-School Basketball Champion',
  },
  {
    month: 4,
    monthName: 'May',
    year: '2026',
    gradient: 'from-[#78350f] via-[#b45309] to-[#451a03]',
    shadowColor: 'bg-[#451a03]/40',
    studentPhoto: mayLeft,
    studentName: 'Aditya Sen',
    studentClass: 'Class IX - A',
    achievementTitle: 'Robotics & AI National Youth Innovation Award Winner',
    tagline: 'Robotics Innovator 2026',
  },
  {
    month: 5,
    monthName: 'June',
    year: '2026',
    gradient: 'from-[#0c4a6e] via-[#0284c7] to-[#082f49]',
    shadowColor: 'bg-[#082f49]/40',
    studentPhoto: junLeft,
    studentName: 'Diya Das',
    studentClass: 'Class VII - C',
    achievementTitle: 'Best All-Rounder National Youth Leadership Camp',
    tagline: 'Leadership Excellence Star',
  },
  {
    month: 6,
    monthName: 'July',
    year: '2026',
    gradient: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
    shadowColor: 'bg-[#0f172a]/50',
    studentPhoto: julLeft,
    studentName: 'Ananya Sharma',
    studentClass: 'Class VIII - A',
    achievementTitle: 'State Level Chess Championship Winner',
    tagline: 'Grandmaster Junior Award',
  },
  {
    month: 7,
    monthName: 'August',
    year: '2026',
    gradient: 'from-[#064e3b] via-[#047857] to-[#022c22]',
    shadowColor: 'bg-[#022c22]/50',
    studentPhoto: augLeft,
    studentName: 'Rohan Verma',
    studentClass: 'Class X - B',
    achievementTitle: 'Gold Medalist 400m Sprint State Athletics Meet',
    tagline: 'Sports Champion 2026',
  },
  {
    month: 8,
    monthName: 'September',
    year: '2026',
    gradient: 'from-[#7f1d1d] via-[#b91c1c] to-[#450a0a]',
    shadowColor: 'bg-[#450a0a]/50',
    studentPhoto: sepLeft,
    studentName: 'Priya Patel',
    studentClass: 'Class IX - C',
    achievementTitle: 'National Inter-School Oratory & Debate Winner',
    tagline: 'Best Speaker Award',
  },
  {
    month: 9,
    monthName: 'October',
    year: '2026',
    gradient: 'from-[#4c1d95] via-[#6d28d9] to-[#2e1065]',
    shadowColor: 'bg-[#2e1065]/50',
    studentPhoto: octLeft,
    studentName: 'Ishita Roy',
    studentClass: 'Class VII - A',
    achievementTitle: 'First Prize Regional Classical Dance & Arts Fest',
    tagline: 'Cultural Festival Winner',
  },
  {
    month: 10,
    monthName: 'November',
    year: '2026',
    gradient: 'from-[#7c2d12] via-[#c2410c] to-[#431407]',
    shadowColor: 'bg-[#431407]/50',
    studentPhoto: novLeft,
    studentName: 'Aarav Mehta',
    studentClass: 'Class VI - B',
    achievementTitle: 'Gold Medalist State Youth Vocal Music Festival',
    tagline: 'Best Vocalist Award',
  },
  {
    month: 11,
    monthName: 'December',
    year: '2026',
    gradient: 'from-[#4c0519] via-[#881337] to-[#1e1b4b]',
    shadowColor: 'bg-[#1e1b4b]/50',
    studentPhoto: decLeft,
    studentName: 'Devansh Kumar',
    studentClass: 'Class XI - A',
    achievementTitle: 'Smart Agriculture AI Model National Science Winner',
    tagline: 'National Science Fair Winner',
  }
];

export default function MonthlyFeaturedAchievementPanel({ selectedDate, school, customAchievements = [], onEdit, isAdmin }) {
  const monthIndex = selectedDate instanceof Date ? selectedDate.getMonth() : new Date().getMonth();
  const defaultTheme = MONTH_THEMES[monthIndex] || MONTH_THEMES[0];

  const customMatch = Array.isArray(customAchievements)
    ? customAchievements.find((a) => Number(a.month) === monthIndex)
    : null;

  const currentMonthData = customMatch
    ? {
        ...defaultTheme,
        studentName: customMatch.studentName || defaultTheme.studentName,
        studentClass: customMatch.studentClass || defaultTheme.studentClass,
        achievementTitle: customMatch.achievementTitle || defaultTheme.achievementTitle,
        tagline: customMatch.tagline || defaultTheme.tagline,
        studentPhoto: customMatch.studentPhoto || defaultTheme.studentPhoto,
      }
    : defaultTheme;

  const schoolName = school?.name || 'RAJ KUMAR ACADEMY';
  const schoolLogoUrl = school?.logo || defaultSchoolLogo;
  const displayYear = selectedDate instanceof Date ? selectedDate.getFullYear() : 2026;

  return (
    <>
      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW ONLY (Hidden on Desktop md:)                                */}
      {/* ========================================================================= */}
      <div className={`block md:hidden w-full shrink-0 bg-gradient-to-r ${currentMonthData.gradient} relative overflow-hidden select-none rounded-2xl border border-white/15 shadow-xl transition-colors duration-700 p-3.5 sm:p-4 my-2`}>
        {/* Background Subtle Paper Texture & Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/40 pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={monthIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 flex flex-row items-center justify-between gap-3 h-[155px] sm:h-[170px]"
          >
            {/* Left Content Area (Logo, Month Title, Printed Badge) */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full z-20">
              {/* Top Row: School Logo (Much Bigger & Full-Height Impact) + Month/Year */}
              <div className="flex items-center gap-3">
                <img
                  src={schoolLogoUrl}
                  alt="School Logo"
                  className="h-13 w-13 sm:h-16 sm:w-16 max-h-[56px] object-contain filter drop-shadow-md brightness-110 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <h1 className="font-black font-serif text-white text-3xl sm:text-4xl tracking-tight leading-none filter drop-shadow-md truncate">
                    {currentMonthData.monthName}
                  </h1>
                  <span className="text-sm sm:text-base font-extrabold font-serif text-white/90 tracking-tight mt-1">
                    {displayYear}
                  </span>
                </div>
              </div>

              {/* Bottom White Printed Badge */}
              <div className="bg-white/95 text-slate-900 rounded-xl p-2 sm:p-2.5 shadow-lg border border-white/60 relative z-30 shrink-0 mt-auto mr-1">
                <p className="text-[11px] sm:text-xs font-black leading-tight tracking-tight text-slate-900 truncate">
                  {currentMonthData.achievementTitle}
                </p>
                <div className="mt-0.5 pt-0.5 border-t border-slate-200 flex flex-wrap items-center gap-x-1.5">
                  <span className="text-[9px] sm:text-[10px] font-black text-blue-800 uppercase tracking-wider truncate">
                    {currentMonthData.studentName} • {currentMonthData.studentClass}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Student Photo Cutout & Bottom Right Edit Button */}
            <div className="relative shrink-0 h-full w-[120px] sm:w-[145px] flex items-end justify-center z-10">
              <img
                src={currentMonthData.studentPhoto}
                alt={currentMonthData.studentName}
                className="h-full w-auto max-h-[155px] sm:max-h-[170px] object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transform transition-transform duration-500"
              />

              {/* Edit Button Positioned at Bottom Right Corner */}
              {isAdmin && onEdit && (
                <button
                  onClick={() => onEdit(currentMonthData)}
                  title="Edit Featured Achievement"
                  className="absolute bottom-0 right-0 z-40 p-2 rounded-full bg-white/30 hover:bg-white/50 text-white backdrop-blur-md transition-all shadow-lg active:scale-95 border border-white/40"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 🖥️ DESKTOP VIEW ONLY (100% UNCHANGED, Hidden on Mobile)                    */}
      {/* ========================================================================= */}
      <div className={`hidden md:flex w-[250px] lg:w-[270px] xl:w-[290px] shrink-0 self-stretch flex-col justify-between bg-gradient-to-b ${currentMonthData.gradient} relative overflow-hidden select-none border-r border-white/10 shadow-inner transition-colors duration-700`}>
        
        {/* Background Subtle Paper Texture & Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none" />

        {/* Top Header: Standalone School Logo Picture Only */}
        <div className="relative z-30 flex items-center justify-between px-4 pt-4 shrink-0">
          <img
            src={schoolLogoUrl}
            alt="School Logo"
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain filter drop-shadow-md brightness-110"
          />
          {isAdmin && onEdit && (
            <button
              onClick={() => onEdit(currentMonthData)}
              title="Edit Featured Achievement"
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all shadow-md active:scale-95 border border-white/20"
            >
              <Edit3 size={15} />
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={monthIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-20 flex-1 flex flex-col justify-between pt-2 pb-3 h-full overflow-hidden"
          >
            {/* 1. Huge Month & Year Serif Typography with Long Ribbon Shadow */}
            {(() => {
              const len = currentMonthData.monthName.length;
              const monthSizeClass = 
                len >= 9
                  ? 'text-3xl sm:text-4xl xl:text-[2.5rem]'
                  : len >= 7
                    ? 'text-4xl sm:text-4xl xl:text-[3rem]'
                    : 'text-5xl sm:text-6xl xl:text-7xl';

              return (
                <div className="relative pt-2 px-3 sm:px-4 text-left shrink-0 overflow-hidden">
                  {/* Long 3D Ribbon Shadow effect extending diagonally across */}
                  <div className="absolute top-2 left-2 right-0 h-28 bg-black/25 transform -skew-y-6 pointer-events-none filter blur-[0.5px]" />

                  {/* Huge Serif Month Title */}
                  <h1 className={`relative font-black font-serif text-white tracking-tight leading-none filter drop-shadow-lg truncate ${monthSizeClass}`}>
                    {currentMonthData.monthName}
                  </h1>
                  
                  {/* Huge Serif Year Title */}
                  <h2 className="relative text-2xl sm:text-3xl xl:text-4xl font-extrabold font-serif text-white/90 tracking-tight leading-none mt-1 ml-6 sm:ml-8 filter drop-shadow-md">
                    {displayYear}
                  </h2>
                </div>
              );
            })()}

            {/* 2. Direct Cutout Student Image */}
            <div className="relative flex-1 min-h-0 flex items-end justify-center my-2 overflow-hidden py-1">
              <img
                src={currentMonthData.studentPhoto}
                alt={currentMonthData.studentName}
                className="h-full w-auto max-h-[300px] object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] transform transition-transform duration-500 hover:scale-105"
              />
            </div>

            {/* 3. Printed White Banner Badge at Bottom */}
            <div className="mx-2.5 sm:mx-3 mt-auto mb-3 p-2 sm:p-2.5 bg-white text-slate-900 rounded-xl text-center shadow-xl border border-white/50 relative z-30 shrink-0">
              <p className="text-[10.5px] sm:text-xs font-black leading-tight tracking-tight text-slate-900 truncate">
                {currentMonthData.achievementTitle}
              </p>
              <div className="mt-1 pt-1 border-t border-slate-200 flex flex-col items-center">
                <span className="text-[9px] sm:text-[9.5px] font-black text-blue-800 uppercase tracking-wider truncate max-w-full">
                  {currentMonthData.studentName} • {currentMonthData.studentClass}
                </span>
                <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5 truncate max-w-full">
                  {schoolName}
                </span>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </>
  );
}
