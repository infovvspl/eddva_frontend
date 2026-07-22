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
      {/* Large Bold Month Title */}
      <h1 className={cn("text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase leading-none", titleColor)}>
        {monthName} <span className="text-slate-400 dark:text-slate-500 font-medium">{yearName}</span>
      </h1>

      {/* Theme Subtitle */}
      <p className={cn("mt-1.5 text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-[0.25em] uppercase", themeColor)}>
        — {themeName} —
      </p>

      {/* Quote */}
      <p className={cn("mt-2 text-[10px] sm:text-[11px] md:text-[12px] font-semibold italic max-w-[380px] leading-snug", quoteColor)}>
        {quote}
      </p>
    </div>
  );
};
