import React from 'react';
import {
  BookOpen,
  CalendarDays,
  CalendarOff,
  ClipboardList,
  Drama,
  FileText,
  FlaskConical,
  GraduationCap,
  Medal,
  Megaphone,
  Music,
  Plane,
  Trophy,
  Users,
  Video,
  Volleyball,
} from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import examIcon from '@/assets/calendar_icons/exam.png';
import { getHolidayIcon } from '../theme/holidayIcons';

// Categories whose events can carry a named-holiday icon (Diwali, Republic Day, ...).
const HOLIDAY_ICON_CATEGORIES = ['HOLIDAY', 'VACATION', 'NOTICE', 'CULTURAL'];

/**
 * Category -> flat illustrated icon (image). Categories listed here are rendered as the
 * image itself; every other category falls back to the Lucide icon tile below.
 */
const CATEGORY_IMAGES = {
  // Unit test / exam. Source (Icons8, Officel, saved locally as a 30px PNG):
  // https://img.icons8.com/officel/30/test-partial-passed.png
  EXAM: examIcon,
};

/**
 * Category → lucide icon mapping.
 */
const CATEGORY_ICONS = {
  NOTICE:           Megaphone,
  HOLIDAY:          CalendarOff,
  VACATION:         Plane,
  EXAM:             ClipboardList,
  SPORTS:           Trophy,
  SPORTS_EVENT:     Volleyball,
  COMPETITION:      Medal,
  SCIENCE:          FlaskConical,
  CULTURAL:         Drama,
  CULTURAL_PROGRAM: Music,
  MEETING:          Users,
  TEACHER_MEETING:  GraduationCap,
  PTM:              Users,
  PARENT_MEETING:   Users,
  LIVE_CLASS:       Video,
  ACADEMIC:         BookOpen,
  ASSIGNMENT:       FileText,
};

/**
 * Solid tile colours, used when the icon sits on a white surface (cards).
 */
const CATEGORY_TILE_COLORS = {
  NOTICE:           'bg-blue-600',
  HOLIDAY:          'bg-emerald-600',
  VACATION:         'bg-emerald-600',
  EXAM:             'bg-amber-500',
  SPORTS:           'bg-sky-600',
  SPORTS_EVENT:     'bg-sky-600',
  COMPETITION:      'bg-yellow-600',
  SCIENCE:          'bg-purple-600',
  CULTURAL:         'bg-pink-600',
  CULTURAL_PROGRAM: 'bg-pink-600',
  MEETING:          'bg-teal-600',
  TEACHER_MEETING:  'bg-teal-600',
  PTM:              'bg-indigo-600',
  PARENT_MEETING:   'bg-indigo-600',
  LIVE_CLASS:       'bg-rose-600',
  ACADEMIC:         'bg-indigo-600',
  ASSIGNMENT:       'bg-violet-600',
};

/**
 * EventIcon renders a category icon inside a small rounded tile.
 *
 * @param {string} category      - Event category key (e.g. "EXAM", "HOLIDAY")
 * @param {string} title         - Event title; used to pick a named-holiday icon (see theme/holidayIcons.js)
 * @param {string} className     - Tile size/spacing classes (e.g. "h-8 w-8")
 * @param {string} variant       - "onColor" (default): translucent dark tile with a white ring, for coloured
 *                                 calendar cells and chips. "solid": category-coloured tile,
 *                                 for white cards.
 * @param {string} iconClassName - Optional override for the inner icon classes
 */
export const EventIcon = ({ category, title, className = 'h-5 w-5', variant = 'onColor', iconClassName }) => {
  const cat = (category || '').toUpperCase();
  const holiday = HOLIDAY_ICON_CATEGORIES.includes(cat) ? getHolidayIcon(title) : null;
  const image = holiday?.icon || CATEGORY_IMAGES[cat];
  // Dark single-colour icons are turned white on coloured cells; white cards keep them as-is.
  const invert = Boolean(holiday?.invert) && variant !== 'solid';

  if (image) {
    return (
      <img
        src={image}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn(
          'shrink-0 select-none object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-200 group-hover:scale-110',
          invert && 'brightness-0 invert',
          className
        )}
      />
    );
  }

  const Icon = CATEGORY_ICONS[cat] || CalendarDays;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center shrink-0 rounded-lg select-none transition-transform duration-200 group-hover:scale-110 active:scale-95',
        variant === 'solid'
          ? cn('text-white shadow-sm', CATEGORY_TILE_COLORS[cat] || 'bg-slate-600')
          : 'bg-black/20 text-white ring-1 ring-white/40 backdrop-blur-sm',
        className
      )}
    >
      <Icon className={cn('size-[55%]', iconClassName)} strokeWidth={2.25} />
    </span>
  );
};
