import React from 'react';
import { cn } from '@/components/school/admin/Skeleton';

/**
 * Category → 3D Realistic Emoji / Emblem mapping
 */
const CATEGORY_3D_EMOJIS = {
  NOTICE:           '📢',
  HOLIDAY:          '🌴',
  VACATION:         '🏖️',
  EXAM:             '📝',
  SPORTS:           '🏆',
  SPORTS_EVENT:     '⚽',
  COMPETITION:      '🥇',
  SCIENCE:          '🧪',
  CULTURAL:         '🎭',
  CULTURAL_PROGRAM: '🎵',
  MEETING:          '🤝',
  TEACHER_MEETING:  '👨‍🏫',
  PTM:              '👨‍👩‍👧',
  PARENT_MEETING:   '👨‍👩‍👧',
  LIVE_CLASS:       '📹',
  ACADEMIC:         '📚',
};

const DEFAULT_3D_EMOJI = '📅';

/**
 * EventIcon renders JUST the 3D realistic emoji icon directly (without any background circle).
 *
 * @param {string}  category      - Event category key (e.g. "EXAM", "HOLIDAY")
 * @param {string}  className     - Optional size/spacing classes
 * @param {string}  iconClassName - Optional font size override (e.g. "text-xl")
 */
export const EventIcon = ({ category, className = 'h-5 w-5', iconClassName }) => {
  const cat = (category || '').toUpperCase();
  const emoji = CATEGORY_3D_EMOJIS[cat] || DEFAULT_3D_EMOJI;

  // Derive text size based on className height
  const textSizeClass = className.includes('h-10')
    ? 'text-2xl'
    : className.includes('h-8')
      ? 'text-xl'
      : className.includes('h-6')
        ? 'text-base'
        : className.includes('h-4')
          ? 'text-xs'
          : 'text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 leading-none select-none filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.22)] transition-transform duration-200 group-hover:scale-110 active:scale-95',
        textSizeClass,
        iconClassName
      )}
    >
      {emoji}
    </span>
  );
};
