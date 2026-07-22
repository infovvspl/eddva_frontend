import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getMonthTheme } from '../../theme';
import { HeroBackground } from './HeroBackground';
import { HeroIllustration } from './HeroIllustration';
import { HeroTitle } from './HeroTitle';
import { cn } from '@/components/school/admin/Skeleton';

export const Hero = ({ selectedDate, statsStr }) => {
  const currentMonthIdx = selectedDate.getMonth();
  const theme = getMonthTheme(currentMonthIdx);
  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const yearName = selectedDate.getFullYear();

  // Determine if it is the current calendar month
  const now = new Date();
  const isCurrentMonth = selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={theme.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "relative overflow-hidden rounded-[2rem] border transition-all duration-500 shadow-xs w-full h-[130px] sm:h-[145px] md:h-[155px]",
            "bg-gradient-to-br",
            theme.bgGradient,
            theme.borderColor
          )}
        >
          {/* Background decorations layer */}
          <HeroBackground decorations={theme.decorations} />

          {/* Desktop & Tablet grid layout (>= sm) */}
          <div className="hidden sm:grid grid-cols-[25%_50%_25%] sm:grid-cols-[30%_40%_30%] h-full w-full items-end relative z-10">
            {/* Left Character Illustration Column */}
            <div className="h-full flex items-end justify-start pl-4 md:pl-6 overflow-hidden">
              <HeroIllustration src={theme.leftImage} side="left" />
            </div>

            {/* Center Content Column */}
            <HeroTitle 
              monthName={monthName}
              yearName={yearName}
              themeName={theme.name}
              quote={theme.quote}
              titleColor={theme.titleColor}
              themeColor={theme.themeColor}
              quoteColor={theme.quoteColor}
            />

            {/* Right Character Illustration Column */}
            <div className="h-full flex items-end justify-end pr-4 md:pr-6 overflow-hidden">
              <HeroIllustration src={theme.rightImage} side="right" />
            </div>
          </div>

          {/* Mobile layout with clear, sharp character illustrations (< sm) */}
          <div className="sm:hidden relative flex items-center justify-center h-full w-full px-2 z-10">
            {/* Left Character Illustration */}
            {theme.leftImage && (
              <img
                src={theme.leftImage}
                alt=""
                aria-hidden="true"
                className="absolute left-0.5 bottom-0 h-[105px] max-w-[26%] object-contain pointer-events-none select-none z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
              />
            )}
            
            {/* Centered Typography */}
            <div className="z-20 max-w-[56%] flex flex-col items-center justify-center text-center">
              <HeroTitle 
                monthName={monthName}
                yearName={yearName}
                themeName={theme.name}
                quote={theme.quote}
                titleColor={theme.titleColor}
                themeColor={theme.themeColor}
                quoteColor={theme.quoteColor}
              />
            </div>

            {/* Right Character Illustration */}
            {theme.rightImage && (
              <img
                src={theme.rightImage}
                alt=""
                aria-hidden="true"
                className="absolute right-0.5 bottom-0 h-[105px] max-w-[26%] object-contain pointer-events-none select-none z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
