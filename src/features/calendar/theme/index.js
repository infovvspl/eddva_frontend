import { CALENDAR_ILLUSTRATIONS } from './illustrations';
import { CALENDAR_QUOTES } from './quotes';
import { CALENDAR_PALETTES } from './palettes';
import { CALENDAR_DECORATIONS } from './decorations';
import { CALENDAR_THEMES, MONTH_KEYS } from './themes';
import { EVENT_CATEGORIES, EVENT_PRIORITY_ORDER } from './eventTypes';

export {
  CALENDAR_ILLUSTRATIONS,
  CALENDAR_QUOTES,
  CALENDAR_PALETTES,
  CALENDAR_DECORATIONS,
  CALENDAR_THEMES,
  MONTH_KEYS,
  EVENT_CATEGORIES,
  EVENT_PRIORITY_ORDER
};

// Maps event priority and returns matched details
export function getEventDetails(event) {
  if (!event) return EVENT_CATEGORIES.NOTICE;
  const cat = (event.category || '').toUpperCase();
  const title = (event.title || '').toLowerCase();
  
  if (cat === 'LIVE_CLASS' || title.includes('live class')) {
    return EVENT_CATEGORIES.LIVE_CLASS;
  }
  if (cat === 'EXAM' || title.includes('exam') || title.includes('unit test') || title.includes('test') || title.includes('assessment')) {
    return EVENT_CATEGORIES.EXAM;
  }
  if (cat === 'HOLIDAY' || cat === 'VACATION' || title.includes('holiday') || title.includes('vacation')) {
    return EVENT_CATEGORIES.HOLIDAY;
  }
  if (cat === 'PARENT_MEETING' || cat === 'PTM' || title.includes('parent teacher meeting') || title.includes('ptm')) {
    return EVENT_CATEGORIES.PTM;
  }
  if (cat === 'TEACHER_MEETING' || cat === 'MEETING' || title.includes('meeting') || title.includes('staff meeting') || title.includes('board meeting')) {
    return EVENT_CATEGORIES.MEETING;
  }
  if (cat === 'SPORTS_EVENT' || cat === 'SPORTS' || title.includes('sports') || title.includes('football') || title.includes('basketball') || title.includes('cricket') || title.includes('match') || title.includes('play')) {
    return EVENT_CATEGORIES.SPORTS;
  }
  if (cat === 'COMPETITION' || title.includes('competition') || title.includes('debate') || title.includes('contest') || title.includes('quiz') || title.includes('olympiad')) {
    return EVENT_CATEGORIES.COMPETITION;
  }
  if (cat === 'SCIENCE' || title.includes('science') || title.includes('exhibition') || title.includes('exhibit') || title.includes('lab') || title.includes('experiment')) {
    return EVENT_CATEGORIES.SCIENCE;
  }
  if (cat === 'CULTURAL_PROGRAM' || cat === 'CULTURAL' || title.includes('cultural') || title.includes('annual') || title.includes('celebration') || title.includes('fest') || title.includes('dance') || title.includes('music') || title.includes('drama') || title.includes('function') || title.includes('assembly')) {
    return EVENT_CATEGORIES.CULTURAL;
  }
  
  return EVENT_CATEGORIES.NOTICE;
}

// Resolves theme details dynamically
export function getMonthTheme(dateOrIndex) {
  const idx = typeof dateOrIndex === 'number' ? dateOrIndex : dateOrIndex.getMonth();
  const key = MONTH_KEYS[idx] || 'january';
  
  const theme = CALENDAR_THEMES[key];
  const illustrations = CALENDAR_ILLUSTRATIONS[theme.illustration];
  const palette = CALENDAR_PALETTES[theme.palette];
  const quote = CALENDAR_QUOTES[theme.quote];
  const decorations = CALENDAR_DECORATIONS[theme.decorations];
  
  return {
    key,
    name: theme.name,
    quote,
    leftImage: illustrations.left,
    rightImage: illustrations.right,
    bgGradient: palette.bgGradient,
    borderColor: palette.borderColor,
    badgeBg: palette.badgeBg,
    glowColor: palette.glowColor,
    decorations,
    titleColor: palette.titleColor,
    themeColor: palette.themeColor,
    quoteColor: palette.quoteColor
  };
}
