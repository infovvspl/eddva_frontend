import React from 'react';
import { cn } from '@/components/school/admin/Skeleton';

export const HeroTitle = ({ 
  monthName, 
  yearName, 
  themeName, 
  quote, 
  titleColor,
  themeColor,
  quoteColor
}) => {
  return (
    <div className="h-full flex flex-col justify-center items-center text-center px-4 z-10 select-none">
      {/* Large Extra Bold Month & Year Title */}
      <h1 className={cn("text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-none filter drop-shadow-xs", titleColor)}>
        {monthName} <span className="text-slate-500 dark:text-slate-400 font-black">{yearName}</span>
      </h1>

      {/* Extra Bold Theme Subtitle */}
      <p className={cn("mt-1.5 text-[10px] sm:text-[11.5px] md:text-[12.5px] font-black tracking-[0.3em] uppercase filter drop-shadow-2xs", themeColor)}>
        — {themeName} —
      </p>

      {/* Extra Bold Quote */}
      <p className={cn("mt-1.5 text-[11px] sm:text-[12px] md:text-[13px] font-extrabold italic max-w-[420px] leading-snug filter drop-shadow-2xs", quoteColor)}>
        "{quote.replace(/^"|"$/g, '')}"
      </p>
    </div>
  );
};
