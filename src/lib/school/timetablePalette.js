// Single accent palette shared by every class card, mirroring the admin timetable.
export const SLOT_PALETTE = { bar: 'bg-blue-600', soft: 'border-blue-200 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/20', glow: 'bg-blue-500/15', badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50', avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300', icon: 'text-blue-700 dark:text-blue-400', ring: 'hover:border-blue-300 dark:hover:border-blue-700' };
export const BREAK_PALETTE = { bar: 'bg-amber-500', soft: 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20', glow: 'bg-amber-500/20', badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50', avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', icon: 'text-amber-600 dark:text-amber-400', ring: 'hover:border-amber-300 dark:hover:border-amber-700' };

export const SLOT_TYPE_STYLES = {
  offline: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  live: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  lab: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  extra: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  break: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
};

export const getSlotPalette = (isBreak) => (isBreak ? BREAK_PALETTE : SLOT_PALETTE);
